<?php

namespace Tests\Unit;

use App\Services\TaxNumbers;
use PHPUnit\Framework\TestCase;

class TaxNumbersTest extends TestCase
{
    public function test_valid_ten_and_twelve_digit_inn_are_accepted(): void
    {
        $this->assertTrue(TaxNumbers::validInn('7707083893'));
        $this->assertTrue(TaxNumbers::validInn('500100732259'));
    }

    public function test_inn_with_a_wrong_check_digit_or_length_is_rejected(): void
    {
        $this->assertFalse(TaxNumbers::validInn('7707083894'));
        $this->assertFalse(TaxNumbers::validInn('500100732258'));
        $this->assertFalse(TaxNumbers::validInn('770708389'));
        $this->assertFalse(TaxNumbers::validInn('77070838a3'));
        $this->assertFalse(TaxNumbers::validInn(''));
    }

    public function test_kpp_has_nine_characters_with_two_letters_allowed_in_the_middle(): void
    {
        $this->assertTrue(TaxNumbers::validKpp('770701001'));
        $this->assertTrue(TaxNumbers::validKpp('7707AB001'));
        $this->assertFalse(TaxNumbers::validKpp('77070100'));
        $this->assertFalse(TaxNumbers::validKpp('7707010011'));
        $this->assertFalse(TaxNumbers::validKpp('7707ab001'));
    }
}
