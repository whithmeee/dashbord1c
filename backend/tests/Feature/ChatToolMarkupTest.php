<?php

namespace Tests\Feature;

use App\Models\Chat;
use App\Models\Company;
use App\Models\Integration;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Tests\Support\FakeOneCBase;
use Tests\TestCase;

class ChatToolMarkupTest extends TestCase
{
    use RefreshDatabase;

    private const LEAKED = '< | DSML | calls><| DSML | invoke name="query_1c"></| DSML | invoke></| DSML | calls>';

    private Chat $chat;

    protected function setUp(): void
    {
        parent::setUp();

        $company = Company::factory()->create();
        $integration = Integration::factory()->for($company)->create(['odata_url' => 'https://first.test/odata/standard.odata']);
        $this->chat = Chat::factory()->for($integration)->for($company, 'author')->create();
        $this->actingAs($company, 'company');
    }

    private function fakeAnswers(array ...$answers): void
    {
        $sequence = Http::sequence();

        foreach ($answers as $answer) {
            $sequence->push(['choices' => [['message' => $answer]]]);
        }

        Http::fake(['api.deepseek.com/*' => $sequence, ...FakeOneCBase::responses()]);
    }

    public function test_tool_call_written_as_text_is_replaced_with_an_answer_from_collected_data(): void
    {
        $this->fakeAnswers(['content' => self::LEAKED], ['content' => 'Поступлений за июнь не найдено.']);

        $this->postJson("/api/chats/{$this->chat->id}/messages", ['content' => 'Покажи поступление'])
            ->assertCreated()
            ->assertJsonPath('content', 'Поступлений за июнь не найдено.');

        Http::assertSent(fn (Request $request): bool => str_contains(json_encode($request->data(), JSON_UNESCAPED_UNICODE), 'Вызывать инструменты больше нельзя')
            && ! isset($request->data()['tools']));
    }

    public function test_markup_is_never_shown_when_the_model_keeps_writing_it(): void
    {
        $this->fakeAnswers(['content' => self::LEAKED], ['content' => self::LEAKED]);

        $this->postJson("/api/chats/{$this->chat->id}/messages", ['content' => 'Покажи поступление'])
            ->assertCreated()
            ->assertJsonPath('content', 'Не удалось сформировать ответ. Переформулируйте вопрос.');
    }
}
