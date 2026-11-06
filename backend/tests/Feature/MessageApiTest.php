<?php

namespace Tests\Feature;

use App\Models\Chat;
use App\Models\Company;
use App\Models\Employee;
use App\Models\Integration;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
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

    public function test_sales_question_returns_widget_calculated_in_php_and_ai_summary(): void
    {
        $chat = $this->chatFor($this->company);

        Http::fake([
            'api.deepseek.com/*' => Http::sequence()
                ->push(['choices' => [['message' => [
                    'content' => null,
                    'tool_calls' => [[
                        'id' => 'call_1',
                        'type' => 'function',
                        'function' => [
                            'name' => 'get_sales_summary',
                            'arguments' => '{"date_from":"2026-10-01","date_to":"2026-10-31"}',
                        ],
                    ]],
                ]]]])
                ->push(['choices' => [['message' => ['content' => '- Выручка стабильна']]]]),
            '*Catalog_*' => Http::response(['value' => [
                ['Ref_Key' => 'org-1', 'Description' => 'ООО "ИЛСЕРВИС"'],
            ]]),
            '*Document_*' => Http::response(['value' => [
                ['Ref_Key' => 'd1', 'Организация_Key' => 'org-1', 'СуммаДокумента' => 100000.10],
                ['Ref_Key' => 'd2', 'Организация_Key' => 'org-1', 'СуммаДокумента' => 200000.20],
            ]]),
        ]);

        $this->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Покажи выручку за октябрь'])
            ->assertCreated()
            ->assertJsonPath('role', 'assistant')
            ->assertJsonPath('content', '- Выручка стабильна')
            ->assertJsonPath('widget.rows.0.name', 'ООО "ИЛСЕРВИС"')
            ->assertJsonPath('widget.rows.0.documents', 2)
            ->assertJsonPath('widget.rows.0.revenue', 300000.3)
            ->assertJsonPath('widget.rows.0.average', 150000.15)
            ->assertJsonPath('widget.totals.revenue', 300000.3)
            ->assertJsonPath('widget.rows_count', 1);

        $this->assertDatabaseCount('messages', 2);
        $this->assertSame('Покажи выручку за октябрь', $chat->fresh()->title);
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
            'api.deepseek.com/*' => Http::response(['choices' => [['message' => [
                'content' => null,
                'tool_calls' => [[
                    'function' => [
                        'name' => 'get_sales_summary',
                        'arguments' => '{"date_from":"2026-10-01","date_to":"2026-10-31"}',
                    ],
                ]],
            ]]]]),
            '*Catalog_*' => Http::response('Unauthorized', 401),
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
}
