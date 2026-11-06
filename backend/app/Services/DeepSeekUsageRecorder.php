<?php

namespace App\Services;

use App\Models\Chat;
use App\Models\ChatMessageRequest;
use App\Models\DeepSeekUsage;
use Illuminate\Http\Client\Response;

class DeepSeekUsageRecorder
{
    public function __construct(private readonly DeepSeekCostCalculator $calculator) {}

    public function begin(Chat $chat, ?ChatMessageRequest $request, int $callIndex): DeepSeekUsage
    {
        $chat->loadMissing('author');
        $actor = $chat->author;
        $company = $actor->ownerCompany();

        return DeepSeekUsage::create([
            'company_id' => $company->id,
            'actor_type' => $chat->author_type,
            'actor_id' => $chat->author_id,
            'chat_id' => $chat->id,
            'chat_message_request_id' => $request?->id,
            'call_index' => $callIndex,
            'model' => (string) config('services.deepseek.model'),
            'status' => DeepSeekUsage::UNKNOWN,
            'started_at' => now(),
        ]);
    }

    public function recordResponse(DeepSeekUsage $usage, Response $response): void
    {
        $payload = $response->json();
        $usageData = is_array($payload['usage'] ?? null) ? $payload['usage'] : null;
        $promptTokens = $this->integer($usageData['prompt_tokens'] ?? null);
        $completionTokens = $this->integer($usageData['completion_tokens'] ?? null);
        $totalTokens = $this->integer($usageData['total_tokens'] ?? null);
        $cachedTokens = $this->integer($usageData['prompt_cache_hit_tokens'] ?? ($usageData['prompt_tokens_details']['cached_tokens'] ?? null));
        $cacheMissTokens = $this->integer($usageData['prompt_cache_miss_tokens'] ?? null);

        $usage->update([
            'provider_request_id' => is_string($payload['id'] ?? null) ? $payload['id'] : null,
            'model' => is_string($payload['model'] ?? null) ? $payload['model'] : $usage->model,
            'prompt_tokens' => $promptTokens,
            'completion_tokens' => $completionTokens,
            'cached_tokens' => $cachedTokens,
            'cache_miss_tokens' => $cacheMissTokens,
            'total_tokens' => $totalTokens,
            'status' => $promptTokens !== null && $completionTokens !== null && $totalTokens !== null
                ? DeepSeekUsage::RECORDED
                : DeepSeekUsage::UNKNOWN,
            'completed_at' => now(),
        ]);
        $quote = $this->calculator->quote($usage->fresh());
        if ($quote !== null) {
            $usage->update($quote);
        }
    }

    public function markUnknown(DeepSeekUsage $usage): void
    {
        $usage->update(['status' => DeepSeekUsage::UNKNOWN, 'completed_at' => now()]);
    }

    private function integer(mixed $value): ?int
    {
        return is_int($value) ? $value : (is_numeric($value) && (int) $value == $value ? (int) $value : null);
    }
}
