<?php

namespace Tests\Feature;

use App\Models\Chat;
use App\Models\ChatMessageRequest;
use App\Models\Company;
use App\Models\DeepSeekUsage;
use App\Models\Employee;
use App\Models\Integration;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\Support\FakeOneCBase;
use Tests\TestCase;

class MessageApiTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::factory()->create();
        $this->actingAs($this->company, 'company');
    }

    private function chatFor(Company|Employee $author, ?Company $company = null): Chat
    {
        return Chat::factory()
            ->for(Integration::factory()->for($company ?? $this->company))
            ->for($author, 'author')
            ->create();
    }

    private function toolCall(string $name, array $arguments): array
    {
        return ['choices' => [['message' => ['content' => null, 'tool_calls' => [[
            'id' => 'call_1',
            'type' => 'function',
            'function' => ['name' => $name, 'arguments' => json_encode($arguments, JSON_UNESCAPED_UNICODE)],
        ]]]]]];
    }

    private function salesQuery(): array
    {
        return [
            'entity' => 'Document_РеализацияТоваровУслуг',
            'period' => ['from' => '2026-10-01', 'to' => '2026-10-31'],
            'group_by' => ['Контрагент_Key'],
            'metrics' => [['field' => 'СуммаДокумента', 'operation' => 'sum']],
            'limit' => 5,
        ];
    }

    private function deepSeekCalls(): int
    {
        return collect(Http::recorded())->filter(
            fn (array $record): bool => str_contains($record[0]->url(), 'deepseek'),
        )->count();
    }

    public function test_sales_question_reads_documents_and_returns_computed_table(): void
    {
        $chat = $this->chatFor($this->company);

        Http::fake([
            'api.deepseek.com/*' => Http::sequence()
                ->push($this->toolCall('query_1c', $this->salesQuery()))
                ->push(['choices' => [['message' => ['content' => '- Альфа приносит основную выручку']]]]),
            ...FakeOneCBase::responses([
                ['Контрагент_Key' => 'buyer-1', 'ВалютаДокумента_Key' => 'cur-rub', 'СуммаДокумента' => 100000.10],
                ['Контрагент_Key' => 'buyer-1', 'ВалютаДокумента_Key' => 'cur-rub', 'СуммаДокумента' => 200000.20],
                ['Контрагент_Key' => 'buyer-2', 'ВалютаДокумента_Key' => 'cur-rub', 'СуммаДокумента' => 50],
            ]),
        ]);

        $this->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Покажи топ 5 контрагентов за октябрь'])
            ->assertCreated()
            ->assertJsonPath('role', 'assistant')
            ->assertJsonPath('content', '- Альфа приносит основную выручку')
            ->assertJsonPath('widget.rows.0.Контрагент_Key', 'Альфа')
            ->assertJsonPath('widget.rows.0.sum_СуммаДокумента', 300000.3)
            ->assertJsonPath('widget.rows.1.Контрагент_Key', 'Бета')
            ->assertJsonPath('widget.totals.sum_СуммаДокумента', 300050.3);

        $this->assertDatabaseCount('messages', 2);
        $this->assertSame('Покажи топ 5 контрагентов за октябрь', $chat->fresh()->title);
        $this->assertSame(2, $this->deepSeekCalls());
    }

    public function test_the_model_reads_the_schema_before_querying_and_sees_tool_results(): void
    {
        $chat = $this->chatFor($this->company);

        Http::fake([
            'api.deepseek.com/*' => Http::sequence()
                ->push($this->toolCall('search_1c_schema', ['query' => 'реализация']))
                ->push($this->toolCall('query_1c', $this->salesQuery()))
                ->push(['choices' => [['message' => ['content' => 'Готово']]]]),
            ...FakeOneCBase::responses([
                ['Контрагент_Key' => 'buyer-1', 'ВалютаДокумента_Key' => 'cur-rub', 'СуммаДокумента' => 10],
            ]),
        ]);

        $this->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Топ покупателей'])
            ->assertCreated()
            ->assertJsonPath('content', 'Готово')
            ->assertJsonPath('widget.rows.0.Контрагент_Key', 'Альфа');

        Http::assertSent(function (Request $request): bool {
            $body = json_encode($request->data(), JSON_UNESCAPED_UNICODE);

            return str_contains($request->url(), 'deepseek')
                && str_contains($body, '"role":"tool"')
                && str_contains($body, 'Document_РеализацияТоваровУслуг');
        });
        $this->assertSame(3, $this->deepSeekCalls());
        $this->assertDatabaseHas('deepseek_usages', ['call_index' => 3]);
    }

    public function test_a_rejected_plan_goes_back_to_the_model_instead_of_failing(): void
    {
        $chat = $this->chatFor($this->company);

        Http::fake([
            'api.deepseek.com/*' => Http::sequence()
                ->push($this->toolCall('query_1c', ['entity' => 'Catalog_Пользователи']))
                ->push(['choices' => [['message' => ['content' => 'Эти данные недоступны']]]]),
            ...FakeOneCBase::responses(),
        ]);

        $this->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Покажи пользователей'])
            ->assertCreated()
            ->assertJsonPath('content', 'Эти данные недоступны')
            ->assertJsonPath('widget', null);
    }

    public function test_the_system_prompt_restricts_the_assistant_to_the_one_c_base(): void
    {
        $chat = $this->chatFor($this->company);
        Http::fake(['api.deepseek.com/*' => Http::response(['choices' => [['message' => ['content' => 'Помогаю только с данными 1С.']]]])]);

        $this->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Какая сегодня погода?'])->assertCreated();

        Http::assertSent(function (Request $request): bool {
            $system = $request->data()['messages'][0] ?? [];

            return $system['role'] === 'system'
                && str_contains($system['content'], 'посторонние темы')
                && str_contains($system['content'], '1С Тест');
        });
    }

    public function test_question_without_tool_call_returns_plain_text(): void
    {
        $chat = $this->chatFor($this->company);

        Http::fake([
            'api.deepseek.com/*' => Http::response(['choices' => [['message' => ['content' => 'Привет!']]]]),
        ]);

        $this->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Привет'])
            ->assertCreated()
            ->assertJsonPath('content', 'Привет!')
            ->assertJsonPath('widget', null);
    }

    public function test_one_c_failure_returns_bad_gateway(): void
    {
        $chat = $this->chatFor($this->company);

        Http::fake([
            'api.deepseek.com/*' => Http::response($this->toolCall('query_1c', $this->salesQuery())),
            '*$metadata*' => Http::response('Unauthorized', 401),
        ]);

        $this->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Выручка'])
            ->assertStatus(502);
    }

    public function test_message_content_is_required(): void
    {
        $chat = $this->chatFor($this->company);

        $this->postJson("/api/chats/{$chat->id}/messages", [])->assertUnprocessable();
    }

    public function test_company_cannot_use_another_companys_chat(): void
    {
        $other = Company::factory()->create();
        $foreignChat = $this->chatFor($other, $other);

        $this->getJson("/api/chats/{$foreignChat->id}/messages")->assertForbidden();
        $this->postJson("/api/chats/{$foreignChat->id}/messages", ['content' => 'Привет'])->assertForbidden();
    }

    public function test_chats_are_private_to_their_author_even_inside_one_company(): void
    {
        $employee = Employee::factory()->for($this->company)->create();
        $employeeChat = $this->chatFor($employee);

        $this->getJson("/api/chats/{$employeeChat->id}/messages")->assertForbidden();

        $this->app['auth']->forgetGuards();
        $this->actingAs($employee, 'employee');
        $this->getJson("/api/chats/{$employeeChat->id}/messages")->assertOk();
    }

    public function test_chat_list_contains_only_own_chats(): void
    {
        $this->chatFor($this->company);
        $this->chatFor(Employee::factory()->for($this->company)->create());
        $this->chatFor(Company::factory()->create());

        $this->getJson('/api/chats')->assertOk()->assertJsonCount(1);
    }

    public function test_new_chat_without_a_title_answers_with_the_default_title(): void
    {
        $integration = Integration::factory()->for($this->company)->create();

        $this->postJson('/api/chats', ['integration_id' => $integration->id])
            ->assertCreated()
            ->assertJsonPath('title', 'Новый диалог');
    }

    public function test_chat_can_only_be_created_on_own_companys_integration(): void
    {
        $own = Integration::factory()->for($this->company)->create();
        $foreign = Integration::factory()->create();

        $this->postJson('/api/chats', ['integration_id' => $own->id])
            ->assertCreated()
            ->assertJsonPath('integration_id', $own->id);
        $this->postJson('/api/chats', ['integration_id' => $foreign->id])->assertUnprocessable();
    }

    public function test_employee_chats_on_the_company_integration_are_owned_by_the_employee(): void
    {
        $integration = Integration::factory()->for($this->company)->create();
        $employee = Employee::factory()->for($this->company)->create();
        $this->app['auth']->forgetGuards();
        $this->actingAs($employee, 'employee');

        $this->postJson('/api/chats', ['integration_id' => $integration->id])->assertCreated();

        $this->assertDatabaseHas('chats', ['author_type' => 'employee', 'author_id' => $employee->id]);
    }

    public function test_author_deletes_their_chat_with_messages_but_not_someone_elses(): void
    {
        $chat = $this->chatFor($this->company);
        $foreign = $this->chatFor(Employee::factory()->for($this->company)->create());
        Message::factory()->for($chat)->create();

        $this->deleteJson("/api/chats/{$foreign->id}")->assertForbidden();
        $this->deleteJson("/api/chats/{$chat->id}")->assertNoContent();

        $this->assertDatabaseMissing('chats', ['id' => $chat->id]);
        $this->assertDatabaseCount('messages', 0);
    }

    public function test_inactive_subscription_blocks_the_chat(): void
    {
        $this->actingAs(Company::factory()->expired()->create(), 'company');

        $this->getJson('/api/chats')
            ->assertForbidden()
            ->assertJsonPath('code', 'subscription_inactive');
    }

    public function test_unverified_company_cannot_use_the_chat(): void
    {
        $this->actingAs(Company::factory()->unverified()->create(), 'company');

        $this->getJson('/api/chats')
            ->assertForbidden()
            ->assertJsonPath('code', 'email_verification_required');
    }

    public function test_guests_cannot_use_the_chat(): void
    {
        $this->app['auth']->forgetGuards();
        $this->flushSession();

        $this->getJson('/api/chats')->assertUnauthorized();
    }

    public function test_idempotency_key_replays_completed_message_without_running_pipeline_again(): void
    {
        $chat = $this->chatFor($this->company);
        Http::fake(['api.deepseek.com/*' => Http::response(['choices' => [['message' => ['content' => 'Готово']]]])]);
        $key = '11111111-1111-4111-8111-111111111111';

        $first = $this->withHeader('Idempotency-Key', $key)
            ->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Привет'])
            ->assertCreated();
        $second = $this->withHeader('Idempotency-Key', $key)
            ->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Привет'])
            ->assertOk();

        $this->assertSame($first->json('id'), $second->json('id'));
        $this->assertDatabaseCount('messages', 2);
        $this->assertDatabaseCount('deepseek_usages', 1);
        Http::assertSentCount(1);
    }

    public function test_idempotency_key_conflict_is_rejected_for_different_content(): void
    {
        $chat = $this->chatFor($this->company);
        Http::fake(['api.deepseek.com/*' => Http::response(['choices' => [['message' => ['content' => 'Готово']]]])]);
        $key = '22222222-2222-4222-8222-222222222222';

        $this->withHeader('Idempotency-Key', $key)
            ->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Первый вопрос'])
            ->assertCreated();
        $this->withHeader('Idempotency-Key', $key)
            ->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Другой вопрос'])
            ->assertConflict()
            ->assertJsonPath('code', 'idempotency_key_conflict');

        $this->assertDatabaseCount('messages', 2);
        Http::assertSentCount(1);
    }

    public function test_unknown_operation_is_not_retried(): void
    {
        $chat = $this->chatFor($this->company);
        Http::fake(['api.deepseek.com/*' => Http::response([], 503)]);
        $key = '33333333-3333-4333-8333-333333333333';

        $this->withHeader('Idempotency-Key', $key)
            ->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Вопрос'])
            ->assertStatus(502);
        $this->assertDatabaseHas('chat_message_requests', ['request_id' => $key, 'status' => 'unknown']);

        $this->withHeader('Idempotency-Key', $key)
            ->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Вопрос'])
            ->assertConflict()
            ->assertJsonPath('code', 'message_request_unknown');
        Http::assertSentCount(1);
    }

    public function test_message_request_status_returns_completed_message_without_external_calls(): void
    {
        $chat = $this->chatFor($this->company);
        Http::fake(['api.deepseek.com/*' => Http::response(['choices' => [['message' => ['content' => 'Готово']]]])]);
        $key = '44444444-4444-4444-8444-444444444444';

        $this->withHeader('Idempotency-Key', $key)
            ->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Вопрос'])
            ->assertCreated();
        $this->getJson("/api/chats/{$chat->id}/message-requests/{$key}")
            ->assertOk()
            ->assertJsonPath('status', 'completed')
            ->assertJsonPath('message.content', 'Готово');
        Http::assertSentCount(1);
    }

    public function test_processing_operation_does_not_start_a_second_pipeline(): void
    {
        $chat = $this->chatFor($this->company);
        $key = '55555555-5555-4555-8555-555555555555';
        $user = Message::factory()->for($chat)->create(['role' => Message::ROLE_USER, 'content' => 'Вопрос']);
        ChatMessageRequest::create([
            'chat_id' => $chat->id,
            'request_id' => $key,
            'content_hash' => hash('sha256', 'Вопрос'),
            'integration_id' => $chat->integration_id,
            'status' => ChatMessageRequest::PROCESSING,
            'user_message_id' => $user->id,
            'started_at' => now(),
        ]);
        Http::fake();

        $this->withHeader('Idempotency-Key', $key)
            ->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Вопрос'])
            ->assertConflict()
            ->assertJsonPath('code', 'message_request_processing');
        Http::assertNothingSent();
    }

    public function test_stale_processing_operation_becomes_unknown_without_retry(): void
    {
        $chat = $this->chatFor($this->company);
        $key = '77777777-7777-4777-8777-777777777777';
        $user = Message::factory()->for($chat)->create(['role' => Message::ROLE_USER, 'content' => 'Вопрос']);
        ChatMessageRequest::create([
            'chat_id' => $chat->id,
            'request_id' => $key,
            'content_hash' => hash('sha256', 'Вопрос'),
            'integration_id' => $chat->integration_id,
            'status' => ChatMessageRequest::PROCESSING,
            'user_message_id' => $user->id,
            'started_at' => now()->subMinutes(6),
        ]);
        Http::fake();

        $this->withHeader('Idempotency-Key', $key)
            ->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Вопрос'])
            ->assertConflict()
            ->assertJsonPath('code', 'message_request_unknown');
        $this->assertDatabaseHas('chat_message_requests', ['request_id' => $key, 'status' => 'unknown']);
        Http::assertNothingSent();
    }

    public function test_idempotency_key_conflict_includes_selected_integration(): void
    {
        $first = Integration::factory()->for($this->company)->create();
        $second = Integration::factory()->for($this->company)->create();
        $chat = $this->chatFor($this->company);
        $chat->update(['integration_id' => $first->id]);
        Http::fake(['api.deepseek.com/*' => Http::response(['choices' => [['message' => ['content' => 'Готово']]]])]);
        $key = '88888888-8888-4888-8888-888888888888';

        $this->withHeader('Idempotency-Key', $key)
            ->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Вопрос'])
            ->assertCreated();
        $chat->update(['integration_id' => $second->id]);
        $this->withHeader('Idempotency-Key', $key)
            ->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Вопрос'])
            ->assertConflict()
            ->assertJsonPath('code', 'idempotency_key_conflict');
        Http::assertSentCount(1);
    }

    public function test_status_of_foreign_chat_request_is_forbidden(): void
    {
        $other = Company::factory()->create();
        $chat = $this->chatFor($other, $other);

        $this->getJson("/api/chats/{$chat->id}/message-requests/66666666-6666-4666-8666-666666666666")
            ->assertForbidden();
    }

    public function test_invalid_idempotency_key_is_rejected_without_pipeline(): void
    {
        $chat = $this->chatFor($this->company);
        Http::fake();

        $this->withHeader('Idempotency-Key', 'not-a-uuid')
            ->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Вопрос'])
            ->assertUnprocessable()
            ->assertJsonPath('code', 'invalid_idempotency_key');
        Http::assertNothingSent();
    }

    public function test_usage_is_recorded_for_a_plain_completion(): void
    {
        $chat = $this->chatFor($this->company);
        Http::fake(['api.deepseek.com/*' => Http::response([
            'id' => 'completion-1',
            'model' => 'deepseek-flash',
            'choices' => [['message' => ['content' => 'Готово']]],
            'usage' => [
                'prompt_tokens' => 12,
                'completion_tokens' => 7,
                'total_tokens' => 19,
                'prompt_cache_hit_tokens' => 3,
                'prompt_cache_miss_tokens' => 9,
            ],
        ])]);

        $this->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Вопрос'])->assertCreated();

        $this->assertDatabaseHas('deepseek_usages', [
            'company_id' => $this->company->id,
            'actor_type' => 'company',
            'actor_id' => $this->company->id,
            'chat_id' => $chat->id,
            'call_index' => 1,
            'provider_request_id' => 'completion-1',
            'model' => 'deepseek-flash',
            'prompt_tokens' => 12,
            'completion_tokens' => 7,
            'cached_tokens' => 3,
            'cache_miss_tokens' => 9,
            'total_tokens' => 19,
            'status' => DeepSeekUsage::RECORDED,
            'estimated_cost_usd_micros' => 6,
        ]);
    }

    public function test_every_model_call_of_a_tool_question_is_recorded(): void
    {
        $chat = $this->chatFor($this->company);
        $toolMessage = $this->toolCall('query_1c', $this->salesQuery());
        Http::fake([
            'api.deepseek.com/*' => Http::sequence()
                ->push($toolMessage + ['id' => 'completion-1', 'model' => 'deepseek-chat', 'usage' => ['prompt_tokens' => 10, 'completion_tokens' => 4, 'total_tokens' => 14, 'prompt_cache_hit_tokens' => 0, 'prompt_cache_miss_tokens' => 10]])
                ->push(['id' => 'completion-2', 'model' => 'deepseek-chat', 'choices' => [['message' => ['content' => 'Готово']]], 'usage' => ['prompt_tokens' => 20, 'completion_tokens' => 6, 'total_tokens' => 26, 'prompt_tokens_details' => ['cached_tokens' => 5]]]),
            ...FakeOneCBase::responses(),
        ]);

        $this->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Выручка'])->assertCreated();

        $this->assertDatabaseCount('deepseek_usages', 2);
        $this->assertDatabaseHas('deepseek_usages', ['call_index' => 1, 'provider_request_id' => 'completion-1', 'total_tokens' => 14]);
        $this->assertDatabaseHas('deepseek_usages', ['call_index' => 2, 'provider_request_id' => 'completion-2', 'total_tokens' => 26]);
        $this->assertSame(2, $this->deepSeekCalls());
    }

    public function test_timeout_keeps_usage_unknown_with_null_tokens(): void
    {
        $chat = $this->chatFor($this->company);
        Http::fake(fn () => throw new ConnectionException('timeout'));

        $this->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Вопрос'])->assertStatus(502);

        $this->assertDatabaseHas('deepseek_usages', [
            'chat_id' => $chat->id,
            'status' => DeepSeekUsage::UNKNOWN,
            'prompt_tokens' => null,
            'completion_tokens' => null,
            'total_tokens' => null,
        ]);
    }

    public function test_employee_usage_is_linked_to_employee_and_company(): void
    {
        $employee = Employee::factory()->for($this->company)->create();
        $chat = $this->chatFor($employee);
        $this->app['auth']->forgetGuards();
        $this->actingAs($employee, 'employee');
        Http::fake(['api.deepseek.com/*' => Http::response([
            'id' => 'employee-completion',
            'choices' => [['message' => ['content' => 'Готово']]],
            'usage' => ['prompt_tokens' => 1, 'completion_tokens' => 1, 'total_tokens' => 2],
        ])]);

        $this->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Вопрос'])->assertCreated();

        $this->assertDatabaseHas('deepseek_usages', [
            'company_id' => $this->company->id,
            'actor_type' => 'employee',
            'actor_id' => $employee->id,
        ]);
    }

    public function test_success_without_usage_is_recorded_as_unknown(): void
    {
        $chat = $this->chatFor($this->company);
        Http::fake(['api.deepseek.com/*' => Http::response([
            'id' => 'without-usage',
            'choices' => [['message' => ['content' => 'Готово']]],
        ])]);

        $this->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Вопрос'])->assertCreated();

        $this->assertDatabaseHas('deepseek_usages', [
            'provider_request_id' => 'without-usage',
            'status' => DeepSeekUsage::UNKNOWN,
            'prompt_tokens' => null,
            'completion_tokens' => null,
            'total_tokens' => null,
        ]);
    }
}
