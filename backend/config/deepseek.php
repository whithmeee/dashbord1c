<?php

return [
    'pricing_source' => 'https://api-docs.deepseek.com/quick_start/pricing/',
    'pricing_version' => '2026-11-06',
    'chinese_public_holidays' => env('DEEPSEEK_CHINESE_PUBLIC_HOLIDAYS') === null
        ? null
        : array_values(array_filter(explode(',', (string) env('DEEPSEEK_CHINESE_PUBLIC_HOLIDAYS')))),
    'pricing' => [
        'deepseek-flash' => [
            'peak' => ['cache_hit' => '0.006', 'cache_miss' => '0.3', 'output' => '1.2'],
            'off_peak' => ['cache_hit' => '0.003', 'cache_miss' => '0.15', 'output' => '0.6'],
        ],
        'deepseek-v4-pro' => [
            'peak' => ['cache_hit' => '0.044', 'cache_miss' => '1.32', 'output' => '3.96'],
            'off_peak' => ['cache_hit' => '0.022', 'cache_miss' => '0.66', 'output' => '1.98'],
        ],
    ],
];
