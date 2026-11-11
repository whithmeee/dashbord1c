<?php

namespace App\Enums;

enum CabinetSection: string
{
    case Finance = 'finance';
    case Integrations = 'integrations';
    case Analytics = 'analytics';
    case Subscription = 'subscription';
    case SystemStatus = 'system_status';
    case Chat = 'chat';
    case DataQuality = 'data_quality';

    public static function values(): array
    {
        return array_map(fn (self $section) => $section->value, self::cases());
    }
}
