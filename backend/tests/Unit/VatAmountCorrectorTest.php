<?php

namespace Tests\Unit;

use App\Services\Documents\VatAmountCorrector;
use PHPUnit\Framework\TestCase;

class VatAmountCorrectorTest extends TestCase
{
    /**
     * @param  list<float>  $amounts
     * @return array<string, mixed>
     */
    private function receipt(array $amounts, float $total): array
    {
        return [
            'type' => 'receipt',
            'total' => $total,
            'items' => array_map(fn (float $amount): array => ['name' => 'Товар', 'quantity' => 1.0, 'price' => $amount, 'amount' => $amount], $amounts),
        ];
    }

    public function test_amounts_without_vat_are_raised_to_the_total_with_vat(): void
    {
        $corrected = (new VatAmountCorrector)->correct($this->receipt([1000.0, 500.0], 1800.0));

        $this->assertSame([1200.0, 600.0], array_column($corrected['items'], 'amount'));
        $this->assertSame([1200.0, 600.0], array_column($corrected['items'], 'price'));
        $this->assertSame('20%', $corrected['vat_adjusted']);
    }

    public function test_cents_lost_to_rounding_are_put_on_the_last_item(): void
    {
        $corrected = (new VatAmountCorrector)->correct($this->receipt([29333.33, 500.0, 105725.0], 162670.0));

        $this->assertEqualsWithDelta(162670.0, array_sum(array_column($corrected['items'], 'amount')), 0.0001);
        $this->assertSame('20%', $corrected['vat_adjusted']);
    }

    public function test_a_document_whose_sum_already_matches_is_left_alone(): void
    {
        $data = $this->receipt([1000.0, 500.0], 1500.0);

        $this->assertSame($data, (new VatAmountCorrector)->correct($data));
    }

    public function test_an_unexplained_mismatch_is_left_for_the_person_to_fix(): void
    {
        $data = $this->receipt([1000.0, 500.0], 1777.0);

        $this->assertSame($data, (new VatAmountCorrector)->correct($data));
    }

    public function test_invoices_are_not_corrected(): void
    {
        $data = ['type' => 'invoice', 'total' => 1800.0, 'items' => [['amount' => 1500.0, 'price' => 1500.0]]];

        $this->assertSame($data, (new VatAmountCorrector)->correct($data));
    }

    public function test_the_previous_adjustment_mark_is_dropped_before_checking_again(): void
    {
        $data = $this->receipt([1200.0, 600.0], 1800.0) + ['vat_adjusted' => '20%'];

        $this->assertArrayNotHasKey('vat_adjusted', (new VatAmountCorrector)->correct($data));
    }
}
