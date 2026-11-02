<?php

namespace Tests\Feature;

use App\Models\Chat;
use App\Models\Company;
use App\Models\Employee;
use App\Models\Integration;
use App\Models\Message;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class ChatIntegrationSwitchTest extends TestCase
{
    use RefreshDatabase;

    private Company $company;

    private Integration $first;

    private Integration $second;

    protected function setUp(): void
    {
        parent::setUp();

        $this->company = Company::factory()->create();
        $this->first = Integration::factory()->for($this->company)->create([
            'name' => 'Основная',
            'odata_url' => 'https://first.test/odata/standard.odata',
        ]);
        $this->second = Integration::factory()->for($this->company)->create([
            'name' => 'Филиал',
            'odata_url' => 'https://second.test/odata/standard.odata',
        ]);
        $this->actingAs($this->company, 'company');
    }

    private function chatOn(Integration $integration): Chat
    {
        return Chat::factory()->for($integration)->for($this->company, 'author')->create();
    }

    public function test_bases_list_shows_every_base_with_its_status(): void
    {
        Integration::factory()->for($this->company)->create(['is_active' => false]);
        Integration::factory()->create();

        $this->getJson('/cabinet/integrations')
            ->assertOk()
            ->assertJsonCount(3)
            ->assertJsonPath('0.status', 'active')
            ->assertJsonPath('2.status', 'inactive')
            ->assertJsonMissingPath('0.password');
    }

    public function test_chat_can_be_switched_to_another_base_of_the_company(): void
    {
        $chat = $this->chatOn($this->first);

        $this->patchJson("/api/chats/{$chat->id}", ['integration_id' => $this->second->id])
            ->assertOk()
            ->assertJsonPath('integration_id', $this->second->id)
            ->assertJsonPath('integration.name', 'Филиал')
            ->assertJsonMissingPath('integration.password');

        $this->assertSame($this->second->id, $chat->fresh()->integration_id);
    }

    public function test_chat_cannot_be_switched_to_a_foreign_or_disabled_base(): void
    {
        $chat = $this->chatOn($this->first);
        $disabled = Integration::factory()->for($this->company)->create(['is_active' => false]);

        $this->patchJson("/api/chats/{$chat->id}", ['integration_id' => Integration::factory()->create()->id])
            ->assertUnprocessable()->assertJsonValidationErrors('integration_id');
        $this->patchJson("/api/chats/{$chat->id}", ['integration_id' => $disabled->id])
            ->assertUnprocessable()->assertJsonValidationErrors('integration_id');
        $this->postJson('/api/chats', ['integration_id' => $disabled->id])->assertUnprocessable();
    }

    public function test_chat_can_be_renamed_without_touching_the_base(): void
    {
        $chat = $this->chatOn($this->first);

        $this->patchJson("/api/chats/{$chat->id}", ['title' => 'Отчёты'])
            ->assertOk()
            ->assertJsonPath('title', 'Отчёты')
            ->assertJsonPath('integration_id', $this->first->id);
    }

    public function test_only_the_author_can_switch_a_chat(): void
    {
        $employee = Employee::factory()->for($this->company)->create();
        $chat = Chat::factory()->for($this->first)->for($employee, 'author')->create();

        $this->patchJson("/api/chats/{$chat->id}", ['integration_id' => $this->second->id])->assertForbidden();
    }

    public function test_questions_go_to_the_selected_base_and_forget_answers_about_the_previous_one(): void
    {
        $chat = $this->chatOn($this->first);
        Message::factory()->for($chat)->create(['content' => 'вопрос про основную базу']);

        $this->patchJson("/api/chats/{$chat->id}", ['integration_id' => $this->second->id])->assertOk();

        Http::fake([
            'api.deepseek.com/*' => Http::sequence()
                ->push(['choices' => [['message' => ['content' => null, 'tool_calls' => [[
                    'function' => [
                        'name' => 'get_sales_summary',
                        'arguments' => '{"date_from":"2026-10-01","date_to":"2026-10-31"}',
                    ],
                ]]]]]])
                ->push(['choices' => [['message' => ['content' => 'Готово']]]]),
            '*Catalog_*' => Http::response(['value' => []]),
            '*Document_*' => Http::response(['value' => []]),
        ]);

        $this->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Выручка'])->assertCreated();

        Http::assertSent(fn (Request $request): bool => str_contains($request->url(), 'second.test'));
        Http::assertNotSent(fn (Request $request): bool => str_contains($request->url(), 'first.test'));
        Http::assertSent(function (Request $request): bool {
            $body = json_encode($request->data(), JSON_UNESCAPED_UNICODE);

            return str_contains($request->url(), 'deepseek')
                && str_contains($body, 'Филиал')
                && ! str_contains($body, 'вопрос про основную базу');
        });
        $this->assertSame(2, Message::where('integration_id', $this->second->id)->count());
    }

    public function test_questions_to_a_disabled_base_are_rejected(): void
    {
        $chat = $this->chatOn($this->first);
        $this->first->update(['is_active' => false]);
        Http::fake();

        $this->postJson("/api/chats/{$chat->id}/messages", ['content' => 'Привет'])
            ->assertConflict()
            ->assertJsonPath('code', 'integration_inactive');
        Http::assertNothingSent();
    }

    public function test_live_check_reports_online_offline_and_inactive(): void
    {
        $disabled = Integration::factory()->for($this->company)->create(['is_active' => false]);
        Http::fake([
            'first.test/*' => Http::response(['value' => []]),
            'second.test/*' => Http::response('down', 503),
        ]);

        $this->getJson("/cabinet/integrations/{$this->first->id}/check")->assertOk()->assertJsonPath('status', 'online');
        $this->getJson("/cabinet/integrations/{$this->second->id}/check")->assertOk()->assertJsonPath('status', 'offline');
        $this->getJson("/cabinet/integrations/{$disabled->id}/check")->assertOk()->assertJsonPath('status', 'inactive');
    }

    public function test_live_check_is_limited_to_own_bases(): void
    {
        $this->getJson('/cabinet/integrations/'.Integration::factory()->create()->id.'/check')->assertNotFound();
    }
}
