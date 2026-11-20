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
            $issues[] = $this->error('number', 'Не найден номер документа. Впишите его вручную в поле «Номер».');
        }
        if ($data['date'] === '') {
            $issues[] = $this->error('date', 'Не найдена дата документа. Укажите её в поле «Дата».');
        }

        array_push(
            $issues,
            ...$this->party($data['counterparty'], 'counterparty', 'Поставщик'),
            ...$this->party($data['buyer'], 'buyer', 'Организация-покупатель'),
            ...$this->items($data),
        );

        if (isset($data['vat_adjusted'])) {
            $issues[] = ['level' => 'warning', 'field' => 'total', 'message' => "Суммы позиций в документе были без НДС: пересчитаны с НДС {$data['vat_adjusted']}. Проверьте."];
        }

        if (($data['contract']['match'] ?? 'missing') === 'missing') {
            $issues[] = ['level' => 'warning', 'field' => 'contract', 'message' => 'Договор не найден: создайте его в карточке контрагента в 1С и укажите в документе после записи.'];
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
            'missing' => [$this->error($field, "{$label} «{$party['name']}» не найден в 1С. Нажмите «Создать контрагента» или добавьте его в справочник в 1С, затем нажмите «Сохранить и проверить».")],
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
            return [$this->error('items', 'В документе не найдено ни одной позиции. Нажмите «Распознать снова» или проверьте, что файл читаемый.')];
        }

        $issues = [];
        foreach ($data['items'] as $index => $item) {
            $number = $index + 1;
            if ($item['match'] === 'missing') {
                $issues[] = $this->error("items.{$index}", "Позиция {$number} «{$item['name']}» не найдена в номенклатуре 1С. Нажмите «Создать номенклатуру» или добавьте её в справочник в 1С и повторите проверку.");
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
            return [$this->error('total', 'Не найдена сумма документа. Впишите её вручную в поле «Сумма».')];
        }
        if ($data['type'] === 'invoice' || $data['items'] === []) {
            return [];
        }

        $sum = array_sum(array_column($data['items'], 'amount'));

        return abs($sum - $data['total']) > self::TOLERANCE
            ? [$this->error('total', 'Сумма позиций ('.round($sum, 2).') не равна сумме документа ('.round($data['total'], 2).'). Если цены указаны без НДС, выберите позиции и нажмите «Прибавить НДС»; если позиции верны, а сумма документа распознана неточно, нажмите «Сумма документа = сумме позиций»; либо поправьте цены и количества вручную.')]
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
