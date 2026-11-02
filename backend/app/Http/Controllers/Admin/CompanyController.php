<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreCompanyRequest;
use App\Http\Requests\Admin\UpdateCompanyRequest;
use App\Http\Resources\CompanyResource;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class CompanyController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $companies = Company::with(['phones', 'messengers'])
            ->withCount(['employees', 'integrations'])
            ->when($request->string('search')->toString(), function ($query, string $search) {
                $query->where(fn ($inner) => $inner->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
            })
            ->latest('id')
            ->paginate(25);

        return CompanyResource::collection($companies);
    }

    public function show(Company $company): CompanyResource
    {
        return new CompanyResource($company->load(['phones', 'messengers'])->loadCount(['employees', 'integrations']));
    }

    /**
     * Register a client company. The generated password is returned once, in `initial_password`,
     * for the administrator to send to the company's director.
     */
    public function store(StoreCompanyRequest $request): JsonResponse
    {
        $initialPassword = $this->generatePassword();

        $company = DB::transaction(function () use ($request, $initialPassword): Company {
            $company = Company::create($request->safe()->only(['name', 'email', 'subscription_starts_at', 'subscription_ends_at']) + [
                'password' => $initialPassword,
            ]);
            $company->replaceContacts($request->validated('phones'), $request->validated('messengers'));

            return $company;
        });

        return $this->withInitialPassword($company, $initialPassword, 201);
    }

    public function update(UpdateCompanyRequest $request, Company $company): CompanyResource
    {
        DB::transaction(function () use ($request, $company): void {
            $company->fill($request->safe()->only(['name', 'email', 'subscription_starts_at', 'subscription_ends_at']));

            if ($company->isDirty('email')) {
                $company->email_verified_at = null;
            }

            $company->save();
            $company->replaceContacts($request->validated('phones'), $request->validated('messengers'));
        });

        return new CompanyResource($company->load(['phones', 'messengers'])->loadCount(['employees', 'integrations']));
    }

    public function destroy(Company $company): JsonResponse
    {
        $company->delete();

        return response()->json(null, 204);
    }

    /**
     * Issue a new temporary password. Existing sessions end because their stored password hash no longer matches.
     */
    public function resetPassword(Company $company): JsonResponse
    {
        $initialPassword = $this->generatePassword();

        $company->forceFill(['password' => $initialPassword])->save();

        return $this->withInitialPassword($company, $initialPassword);
    }

    private function withInitialPassword(Company $company, string $initialPassword, int $status = 200): JsonResponse
    {
        $payload = (new CompanyResource($company->load(['phones', 'messengers'])))->resolve();

        return response()->json($payload + ['initial_password' => $initialPassword], $status);
    }

    private function generatePassword(): string
    {
        return Str::password(14, symbols: false);
    }
}
