<?php

namespace Tests\Unit;

use App\Services\DataQualityRules;
use PHPUnit\Framework\TestCase;

class DataQualityRulesTest extends TestCase
{
    private const CAPABILITIES = [
        'tax_details' => true,
        'inn_validation' => false,
        'kpp_validation' => false,
        'legal_type' => true,
        'contracts' => false,
    ];

    /**
     * @return array<string, mixed>
     */
    private function row(string $id, string $inn, string $kpp, string $type = 'ЮридическоеЛицо'): array
    {
        return ['Ref_Key' => $id, 'Description' => "Контрагент {$id}", 'ИНН' => $inn, 'КПП' => $kpp, 'ЮридическоеФизическоеЛицо' => $type];
    }

    /**
     * @param  list<array<string, mixed>>  $rows
     * @return list<string>
     */
    private function rules(array $rows): array
    {
        return array_map(fn ($issue): string => "{$issue->rule}:{$issue->objectId}", (new DataQualityRules)->inspect($rows, [], self::CAPABILITIES));
    }

    public function test_branches_of_one_legal_entity_with_different_kpp_are_not_duplicates(): void
    {
        $rules = $this->rules([
            $this->row('a', '7707083893', '770701001'),
            $this->row('b', '7707083893', '500101001'),
            $this->row('c', '7707083893', '770801001'),
        ]);

        $this->assertSame([], $rules);
    }

    public function test_same_inn_and_kpp_are_duplicates_for_both_cards(): void
    {
        $rules = $this->rules([
            $this->row('a', '7707083893', '770701001'),
            $this->row('b', '7707083893', '770701001'),
            $this->row('c', '7707083893', '500101001'),
        ]);

        $this->assertEqualsCanonicalizing(['duplicate_inn:a', 'duplicate_inn:b'], $rules);
    }

    public function test_same_inn_of_individuals_without_kpp_are_duplicates(): void
    {
        $rules = $this->rules([
            $this->row('a', '500100732259', '', 'ФизическоеЛицо'),
            $this->row('b', '500100732259', '', 'ФизическоеЛицо'),
        ]);

        $this->assertEqualsCanonicalizing(['duplicate_inn:a', 'duplicate_inn:b'], $rules);
    }

    public function test_tax_issues_carry_the_current_values_for_the_fix_form(): void
    {
        $issues = (new DataQualityRules)->inspect([$this->row('a', '500100732259', '')], [], self::CAPABILITIES);

        $this->assertSame('missing_kpp', $issues[0]->rule);
        $this->assertSame(['inn' => '500100732259', 'kpp' => '', 'legal_type' => 'legal'], $issues[0]->fields);
    }
}
