<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'deepseek' => [
        'api_key' => env('DEEPSEEK_API_KEY'),
        'base_url' => env('DEEPSEEK_BASE_URL', 'https://api.deepseek.com'),
        'model' => env('DEEPSEEK_MODEL', 'deepseek-chat'),
        'timeout' => (int) env('DEEPSEEK_TIMEOUT', 60),
    ],

    'ocr' => [
        'api_key' => env('OCR_API_KEY'),
        'folder_id' => env('OCR_FOLDER_ID'),
        'url' => env('OCR_URL', 'https://ocr.api.cloud.yandex.net/ocr/v1/recognizeText'),
        'timeout' => (int) env('OCR_TIMEOUT', 60),
        'max_kilobytes' => (int) env('OCR_MAX_KILOBYTES', 10240),
    ],

    'onec' => [
        'timeout' => (int) env('ONEC_TIMEOUT', 30),
        'page_size' => (int) env('ONEC_PAGE_SIZE', 1000),
        'reference_cache_ttl' => (int) env('ONEC_REFERENCE_CACHE_TTL', 3600),
        'query_max_pages' => (int) env('ONEC_QUERY_MAX_PAGES', 10),
        'metadata_timeout' => (int) env('ONEC_METADATA_TIMEOUT', 120),
        'schema_cache_ttl' => (int) env('ONEC_SCHEMA_CACHE_TTL', 86400),
        'health_timeout' => (int) env('ONEC_HEALTH_TIMEOUT', 5),
        'health_cache_ttl' => (int) env('ONEC_HEALTH_CACHE_TTL', 60),
    ],

];
