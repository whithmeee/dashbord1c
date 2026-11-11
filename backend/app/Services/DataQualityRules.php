<?php

namespace App\Services;

class DataQualityRules
{
    private const COUNTERPARTY = 'Catalog_Контрагенты';

    public function inspect(array $rows, array $contractOwners, array $capabilities): array
    {
        $active = array_values(array_filter(
            $rows,
            fn (array $row): bool => ! ($row['DeletionMark'] ?? false) && ! ($row['IsFolder'] ?? false),
        ));
        $issues = [];

        foreach ($active as $row) {
            array_push($issues, ...$this->counterpartyIssues($row, $contractOwners, $capabilities));
        }

        array_push($issues, ...$this->duplicateInnIssues($active, $capabilities['tax_details']));

        usort($issues, fn (DataQualityIssue $left, DataQualityIssue $right): int => [
            $this->severityOrder($left->severity),
            $left->title,
            $left->rule,
        ] <=> [
            $this->severityOrder($right->severity),
            $right->title,
            $right->rule,
        ]);

        return $issues;
    }

    private function counterpartyIssues(array $row, array $contractOwners, array $capabilities): array
    {
        $id = (string) ($row['Ref_Key'] ?? '');
        $title = trim((string) ($row['Description'] ?? '')) ?: 'Контрагент без наименования';
        $issues = [];

        if ($capabilities['tax_details'] && trim((string) ($row['ИНН'] ?? '')) === '') {
            $issues[] = $this->issue('missing_inn', 'critical', 'tax_details', $id, $title, 'Не указан ИНН.');
        } elseif ($capabilities['inn_validation'] && ($row['ИННВведенКорректно'] ?? true) === false) {
            $issues[] = $this->issue('invalid_inn', 'critical', 'tax_details', $id, $title, 'ИНН не прошёл проверку 1С.');
        }

        if ($this->isLegalEntity($row, $capabilities) && trim((string) ($row['КПП'] ?? '')) === '') {
            $issues[] = $this->issue('missing_kpp', 'warning', 'tax_details', $id, $title, 'У юридического лица не указан КПП.');
        } elseif ($capabilities['kpp_validation'] && trim((string) ($row['КПП'] ?? '')) !== '' && ($row['КППВведенКорректно'] ?? true) === false) {
            $issues[] = $this->issue('invalid_kpp', 'warning', 'tax_details', $id, $title, 'КПП не прошёл проверку 1С.');
        }

        if ($capabilities['contracts'] && ! isset($contractOwners[$id])) {
            $issues[] = $this->issue('missing_contract', 'warning', 'contracts', $id, $title, 'Нет активного договора с контрагентом.');
        }

        return $issues;
    }

    private function duplicateInnIssues(array $rows, bool $supported): array
    {
        if (! $supported) {
            return [];
        }

        $groups = [];
        foreach ($rows as $row) {
            $inn = trim((string) ($row['ИНН'] ?? ''));
            if ($inn !== '') {
                $groups[$inn][] = $row;
            }
        }
        $issues = [];
        foreach ($groups as $rowsWithSameInn) {
            if (count($rowsWithSameInn) < 2) {
                continue;
            }
            foreach ($rowsWithSameInn as $row) {
                $id = (string) $row['Ref_Key'];
                $title = trim((string) $row['Description']) ?: 'Контрагент без наименования';
                $issues[] = $this->issue('duplicate_inn', 'critical', 'duplicates', $id, $title, 'ИНН совпадает ещё у '.(count($rowsWithSameInn) - 1).' контрагента.');
            }
        }

        return $issues;
    }

    private function isLegalEntity(array $row, array $capabilities): bool
    {
        return $capabilities['legal_type']
            && $capabilities['tax_details']
            && ($row['ЮридическоеФизическоеЛицо'] ?? '') === 'ЮридическоеЛицо';
    }

    private function issue(string $rule, string $severity, string $category, string $id, string $title, string $message): DataQualityIssue
    {
        return new DataQualityIssue("{$rule}:{$id}", $rule, $severity, $category, self::COUNTERPARTY, $id, $title, $message);
    }

    private function severityOrder(string $severity): int
    {
        return match ($severity) {
            'critical' => 0,
            'warning' => 1,
            default => 2,
        };
    }
}
