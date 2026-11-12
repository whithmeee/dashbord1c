<?php

namespace App\Services\Documents;

class DraftValidator
{
    private const TOLERANCE = 0.01;

    /**
     * @param  array<string, mixed>  $data
     * @return list<array{level: string, field: string, message: string}>
     */
    public function validate(array $data): array
    {
        $issues = [];

        if ($data['number'] === '') {
            $issues[] = $this->error('number', 'Не найден номер документа.');
        }
        if ($data['date'] === '') {
            $issues[] = $this->error('date', 'Не найдена дата документа.');
        }

        array_push(
            $issues,
            ...$this->party($data['counterparty'], 'counterparty', 'Поставщик'),
            ...$this->party($data['buyer'], 'buyer', 'Организация-покупатель'),
            ...$this->items($data),
        );

        if (($data['contract']['match'] ?? 'missing') === 'missing') {
            $issues[] = ['level' => 'warning', 'field' => 'contract', 'message' => 'Договор не найден: в 1С его нужно указать вручную.'];
        }

        return $issues;
    }

    /**
     * @param  array<string, mixed>  $party
     * @return list<array{level: string, field: string, message: string}>
     */
    private function party(array $party, string $field, string $label): array
    {
        return match ($party['match']) {
            'missing' => [$this->error($field, "{$label} «{$party['name']}» не найден в 1С: добавьте его в справочник и повторите.")],
            'matched' => [['level' => 'warning', 'field' => $field, 'message' => "{$label} подобран по неполному совпадению, проверьте."]],
            default => [],
        };
    }

    /**
     * @param  array<string, mixed>  $data
     * @return list<array{level: string, field: string, message: string}>
     */
    private function items(array $data): array
    {
        if ($data['type'] === 'invoice') {
            return $this->total($data);
        }
        if ($data['items'] === []) {
            return [$this->error('items', 'В документе не найдено ни одной позиции.')];
        }

        $issues = [];
        foreach ($data['items'] as $index => $item) {
            $number = $index + 1;
            if ($item['match'] === 'missing') {
                $issues[] = $this->error("items.{$index}", "Позиция {$number} «{$item['name']}» не найдена в номенклатуре 1С.");
            } elseif ($item['match'] === 'matched') {
                $issues[] = ['level' => 'warning', 'field' => "items.{$index}", 'message' => "Позиция {$number} подобрана по неполному совпадению, проверьте."];
            }
        }

        return [...$issues, ...$this->total($data)];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return list<array{level: string, field: string, message: string}>
     */
    private function total(array $data): array
    {
        if ($data['total'] <= 0) {
            return [$this->error('total', 'Не найдена сумма документа.')];
        }
        if ($data['type'] === 'invoice' || $data['items'] === []) {
            return [];
        }

        $sum = array_sum(array_column($data['items'], 'amount'));

        return abs($sum - $data['total']) > self::TOLERANCE
            ? [$this->error('total', 'Сумма позиций ('.round($sum, 2).') не равна сумме документа ('.round($data['total'], 2).').')]
            : [];
    }

    /**
     * @return array{level: string, field: string, message: string}
     */
    private function error(string $field, string $message): array
    {
        return ['level' => 'error', 'field' => $field, 'message' => $message];
    }
}
