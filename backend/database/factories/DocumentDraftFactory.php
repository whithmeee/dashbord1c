<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\DocumentDraft;
use App\Models\Integration;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DocumentDraft>
 */
class DocumentDraftFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'integration_id' => Integration::factory(),
            'author_type' => 'company',
            'author_id' => Company::factory(),
            'profile' => 'accounting',
            'file_name' => 'upd.pdf',
            'status' => DocumentDraft::STATUS_DRAFT,
            'source_text' => 'УПД № 418',
            'data' => [],
            'issues' => [],
        ];
    }
}
