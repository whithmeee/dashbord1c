<?php

namespace App\Services\Documents;

use App\Exceptions\DocumentException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;

class OcrClient
{
    private const MIME_TYPES = [
        'pdf' => 'application/pdf',
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
    ];

    /**
     * @throws DocumentException
     */
    public function read(UploadedFile $file): string
    {
        $extension = strtolower($file->getClientOriginalExtension());

        if ($extension === 'txt') {
            return trim((string) file_get_contents($file->getRealPath()));
        }

        if (! isset(self::MIME_TYPES[$extension])) {
            throw new DocumentException('Поддерживаются PDF, JPG, PNG и TXT.');
        }

        if (! config('services.ocr.api_key') || ! config('services.ocr.folder_id')) {
            throw new DocumentException('Распознавание файлов не настроено на сервере.');
        }

        return $this->recognize(self::MIME_TYPES[$extension], (string) file_get_contents($file->getRealPath()));
    }

    private function recognize(string $mimeType, string $content): string
    {
        try {
            $response = Http::withHeaders([
                'Authorization' => 'Api-Key '.config('services.ocr.api_key'),
                'x-folder-id' => (string) config('services.ocr.folder_id'),
                'x-data-logging-enabled' => 'false',
            ])->timeout((int) config('services.ocr.timeout'))->post((string) config('services.ocr.url'), [
                'mimeType' => $mimeType,
                'languageCodes' => ['ru', 'en'],
                'model' => 'page',
                'content' => base64_encode($content),
            ]);
        } catch (ConnectionException $exception) {
            throw new DocumentException('Не удалось подключиться к сервису распознавания.', 0, $exception);
        }

        if ($response->failed()) {
            throw new DocumentException("Сервис распознавания ответил ошибкой {$response->status()}.");
        }

        $text = trim((string) $response->json('result.textAnnotation.fullText'));

        if ($text === '') {
            throw new DocumentException('В файле не удалось найти текст.');
        }

        return $text;
    }
}
