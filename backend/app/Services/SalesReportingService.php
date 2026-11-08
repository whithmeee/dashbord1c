<?php

namespace App\Services;

use App\Models\Integration;
use Carbon\CarbonImmutable;

class SalesReportingService
{
    public function __construct(private readonly OneCSalesReader $salesReader) {}

    /**
     * @return array<string, mixed>
     */
    public function report(Integration $integration, CarbonImmutable $from, CarbonImmutable $to): array
    {
        $client = new OneCClient($integration);
        // Keep the reachability/error behaviour of the existing endpoint, but do not
        // expose any aggregate until the OData currency contract is confirmed.
        $this->salesReader->documents($client, $from, $to);

        return [
            'integration_id' => $integration->id,
            'period' => [
                'from' => $from->toDateString(),
                'to' => $to->toDateString(),
            ],
            'money' => [
                'currency' => null,
                'currency_status' => 'not_provided_by_current_odata',
                'amount_scale' => null,
                'unit' => null,
            ],
            'financial_status' => 'unavailable',
            'financial_status_code' => 'currency_unconfirmed',
            'monthly' => [],
            'customers' => [],
            'total_amount_minor' => null,
            'customers_total_amount_minor' => null,
        ];
    }
}
