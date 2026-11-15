<?php

namespace App\Services\Documents;

use Smalot\PdfParser\Parser;
use Throwable;

class PdfTextReader
{
    private const MIN_CHARACTERS = 40;

    public function read(string $path): ?string
    {
        try {
            $text = trim((string) preg_replace('/[ \t]+/u', ' ', (new Parser)->parseFile($path)->getText()));
        } catch (Throwable) {
            return null;
        }

        return mb_strlen($text) >= self::MIN_CHARACTERS ? $text : null;
    }
}
