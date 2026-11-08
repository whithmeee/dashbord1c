<?php

namespace App\Support;

class RussianErrorMessages
{
    /**
     * @var array<int, string>
     */
    private const BY_STATUS = [
        401 => 'Требуется вход в систему.',
        403 => 'Недостаточно прав для этого действия.',
        404 => 'Не найдено.',
        405 => 'Метод запроса не поддерживается.',
        409 => 'Действие конфликтует с текущим состоянием.',
        419 => 'Сессия устарела. Обновите страницу и повторите.',
        422 => 'Переданы некорректные данные.',
        429 => 'Слишком много запросов. Повторите позже.',
        500 => 'Внутренняя ошибка сервера.',
        502 => 'Внешний сервис не ответил. Повторите позже.',
        503 => 'Сервис временно недоступен.',
    ];

    /**
     * Replacement for an English framework message. Server errors keep their real text in debug mode.
     */
    public static function forStatus(int $status): ?string
    {
        if ($status >= 500 && config('app.debug')) {
            return null;
        }

        return self::BY_STATUS[$status] ?? null;
    }
}
