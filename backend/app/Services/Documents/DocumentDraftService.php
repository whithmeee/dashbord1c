<?php

namespace App\Services\Documents;

use App\Exceptions\DocumentException;
use App\Models\Company;
use App\Models\DocumentDraft;
use App\Models\Employee;
use App\Models\Integration;
use App\Services\OneCClient;
use App\Services\OneCSchemaIndex;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class DocumentDraftService
{
    public function __construct(
        private readonly OcrClient $ocr,
        private readonly DocumentExtractor $extractor,
        private readonly DocumentNormalizer $normalizer,
        private readonly DocumentResolver $resolver,
        private readonly DraftValidator $validator,
        private readonly OneCSchemaIndex $schemaIndex,
        private readonly ConfigurationProfiles $profiles,
    ) {}

    public function create(Company|Employee $author, Integration $integration, UploadedFile $file): DocumentDraft
    {
        $client = new OneCClient($integration);
        $profile = $this->profiles->detect($this->schemaIndex->load($client));
        $text = $this->ocr->read($file);
        $data = $this->extractor->extract($text);

        $draft = new DocumentDraft([
            'integration_id' => $integration->id,
            'profile' => $profile->key(),
            'file_name' => mb_substr($file->getClientOriginalName(), 0, 255),
            'status' => DocumentDraft::STATUS_DRAFT,
            'source_text' => $text,
        ]);
        $draft->author()->associate($author);

        return $this->fill($draft, $client, $data);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(DocumentDraft $draft, array $data): DocumentDraft
    {
        $this->assertEditable($draft);

        return $this->fill($draft, new OneCClient($draft->integration), $this->normalizer->normalize($data));
    }

    public function retry(DocumentDraft $draft): DocumentDraft
    {
        $this->assertEditable($draft);

        return $this->fill($draft, new OneCClient($draft->integration), $this->extractor->extract($draft->source_text));
    }

    /**
     * Write the draft into 1C as an unposted document for the accountant to review and post.
     *
     * @throws DocumentException
     */
    public function write(DocumentDraft $draft): DocumentDraft
    {
        return DB::transaction(function () use ($draft): DocumentDraft {
            $locked = DocumentDraft::query()->lockForUpdate()->findOrFail($draft->id);
            $this->assertEditable($locked);

            if ($locked->hasErrors()) {
                throw new DocumentException('В документе есть ошибки: исправьте их и повторите проверку.');
            }

            $client = new OneCClient($locked->integration);
            $schema = $this->schemaIndex->load($client);
            $profile = $this->profiles->byKey($locked->profile);
            $data = $locked->data;
            $entity = $profile->entity($data['type'], $schema);

            if ($entity === null) {
                throw new DocumentException('Этот тип документа не поддерживается в конфигурации базы.');
            }

            $created = $client->create($entity, $profile->payload($data['type'], $data, $schema[$entity], [
                'buyer' => $data['buyer']['ref_key'],
                'counterparty' => $data['counterparty']['ref_key'],
                'contract' => $data['contract']['ref_key'] ?? null,
            ]));

            $locked->update([
                'status' => DocumentDraft::STATUS_WRITTEN,
                'onec_ref_key' => $created['Ref_Key'] ?? null,
                'onec_number' => isset($created['Number']) ? (string) $created['Number'] : null,
                'written_at' => now(),
            ]);

            return $locked;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function fill(DocumentDraft $draft, OneCClient $client, array $data): DocumentDraft
    {
        $resolved = $this->resolver->resolve($client, $data);
        $draft->fill(['data' => $resolved, 'issues' => $this->validator->validate($resolved)])->save();

        return $draft;
    }

    private function assertEditable(DocumentDraft $draft): void
    {
        if ($draft->isWritten()) {
            throw new DocumentException('Документ уже записан в 1С.');
        }
    }
}
