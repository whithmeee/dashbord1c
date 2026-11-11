<?php

namespace Tests\Feature;

use App\Models\Integration;
use App\Services\OneCSchemaIndex;
use App\Services\OneCToolsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use InvalidArgumentException;
use Tests\Support\FakeOneCBase;
use Tests\TestCase;

class OneCQueryToolTest extends TestCase
{
    use RefreshDatabase;

    private Integration $integration;

    private OneCToolsService $tools;

    protected function setUp(): void
    {
        parent::setUp();

        $this->integration = Integration::factory()->create(['odata_url' => 'https://base.test/odata']);
        $this->tools = app(OneCToolsService::class);
    }

    private function fakeBase(array $documents = []): void
    {
        Http::fake(FakeOneCBase::responses($documents));
    }

    private function salesPlan(array $override = []): array
    {
        return $override + [
            'entity' => 'Document_РеализацияТоваровУслуг',
            'period' => ['from' => '2026-10-01', 'to' => '2026-10-31'],
            'group_by' => ['Контрагент_Key'],
            'metrics' => [['field' => 'СуммаДокумента', 'operation' => 'sum']],
            'limit' => 5,
        ];
    }

    public function test_schema_search_finds_objects_and_hides_forbidden_ones(): void
    {
        $this->fakeBase();

        $result = json_decode(
            $this->tools->execute($this->integration, 'search_1c_schema', ['query' => 'реализация контрагент'])['text'],
            true,
        );

        $entities = array_column($result['entities'], 'entity');
        $this->assertSame('Document_РеализацияТоваровУслуг', $entities[0]);
        $this->assertNotContains('Catalog_Пользователи', $entities);
        $this->assertStringNotContainsString('Пароль', json_encode($result, JSON_UNESCAPED_UNICODE));
        $this->assertStringNotContainsString('Телефон', json_encode($result, JSON_UNESCAPED_UNICODE));
    }

    public function test_top_customers_are_grouped_per_currency_with_names_and_automatic_filters(): void
    {
        $this->fakeBase([
            ['Контрагент_Key' => 'buyer-1', 'ВалютаДокумента_Key' => 'cur-rub', 'СуммаДокумента' => 100.5],
            ['Контрагент_Key' => 'buyer-1', 'ВалютаДокумента_Key' => 'cur-rub', 'СуммаДокумента' => 200.25],
            ['Контрагент_Key' => 'buyer-1', 'ВалютаДокумента_Key' => 'cur-usd', 'СуммаДокумента' => 50],
            ['Контрагент_Key' => 'buyer-2', 'ВалютаДокумента_Key' => 'cur-rub', 'СуммаДокумента' => 900],
        ]);

        $result = $this->tools->execute($this->integration, 'query_1c', $this->salesPlan());
        $widget = $result['widget'];

        $this->assertSame(
            [
                ['Контрагент_Key' => 'Бета', 'ВалютаДокумента_Key' => 'руб.', 'sum_СуммаДокумента' => 900.0],
                ['Контрагент_Key' => 'Альфа', 'ВалютаДокумента_Key' => 'руб.', 'sum_СуммаДокумента' => 300.75],
                ['Контрагент_Key' => 'Альфа', 'ВалютаДокумента_Key' => 'USD', 'sum_СуммаДокумента' => 50.0],
            ],
            $widget['rows'],
        );
        $this->assertSame('Строк: 3', $widget['totals']->{'Контрагент_Key'});
        $this->assertSame('Валюта', $widget['columns'][1]['label']);

        Http::assertSent(function (Request $request): bool {
            $url = urldecode($request->url());

            return str_contains($url, 'Document_')
                && str_contains($url, "Date ge datetime'2026-10-01T00:00:00'")
                && str_contains($url, "Date le datetime'2026-10-31T23:59:59'")
                && str_contains($url, 'Posted eq true')
                && str_contains($url, 'DeletionMark eq false');
        });
    }

    public function test_single_currency_totals_are_summed(): void
    {
        $this->fakeBase([
            ['Контрагент_Key' => 'buyer-1', 'ВалютаДокумента_Key' => 'cur-rub', 'СуммаДокумента' => 100],
            ['Контрагент_Key' => 'buyer-2', 'ВалютаДокумента_Key' => 'cur-rub', 'СуммаДокумента' => 50.5],
        ]);

        $widget = $this->tools->execute($this->integration, 'query_1c', $this->salesPlan())['widget'];

        $this->assertSame('Итого', $widget['totals']->{'Контрагент_Key'});
        $this->assertSame(150.5, $widget['totals']->{'sum_СуммаДокумента'});
    }

    public function test_documents_require_a_period(): void
    {
        $this->fakeBase();

        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('period');

        $this->tools->execute($this->integration, 'query_1c', $this->salesPlan(['period' => null]));
    }

    public function test_unknown_entities_forbidden_fields_and_odata_code_are_rejected(): void
    {
        $this->fakeBase();
        $rejected = [
            ['entity' => 'Catalog_Пользователи'],
            ['entity' => 'Catalog_Контрагенты', 'fields' => ['Телефон']],
            $this->salesPlan(['group_by' => ['Пароль']]),
            $this->salesPlan(['filters' => ['Контрагент_Key' => "x' or 1 eq 1"]]),
            $this->salesPlan(['metrics' => [['field' => 'Контрагент_Key', 'operation' => 'sum']]]),
            $this->salesPlan(['filters' => ['Date ge 1 or Posted' => true]]),
        ];

        foreach ($rejected as $plan) {
            try {
                $this->tools->execute($this->integration, 'query_1c', $plan);
                $this->fail('Plan was accepted: '.json_encode($plan, JSON_UNESCAPED_UNICODE));
            } catch (InvalidArgumentException) {
                $this->addToAssertionCount(1);
            }
        }

        Http::assertNotSent(fn (Request $request): bool => str_contains($request->url(), 'Document_'));
    }

    public function test_string_filters_are_quoted_and_rows_are_listed_without_forbidden_fields(): void
    {
        $this->fakeBase();

        $this->tools->execute($this->integration, 'query_1c', [
            'entity' => 'Catalog_Контрагенты',
            'filters' => ['Description' => ['op' => 'contains', 'value' => "О'Нил"]],
            'limit' => 5,
        ]);

        Http::assertSent(function (Request $request): bool {
            $url = urldecode($request->url());

            return str_contains($url, "substringof('О''Нил', Description) eq true")
                && str_contains($url, '$top=5')
                && ! str_contains($url, 'Телефон');
        });
    }

    public function test_the_schema_is_downloaded_once_per_base(): void
    {
        $this->fakeBase();

        $this->tools->execute($this->integration, 'search_1c_schema', ['query' => 'реализация']);
        app()->forgetInstance(OneCSchemaIndex::class);
        $this->tools = app(OneCToolsService::class);
        $this->tools->execute($this->integration, 'search_1c_schema', ['query' => 'валюта']);

        $metadataRequests = collect(Http::recorded())->filter(
            fn (array $record): bool => str_contains($record[0]->url(), '$metadata'),
        );
        $this->assertCount(1, $metadataRequests);
    }
}
