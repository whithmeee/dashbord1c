<?php

namespace App\Http\Controllers\Cabinet;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cabinet\UpdateSettingsRequest;
use App\Http\Resources\CompanyResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    public function show(Request $request): CompanyResource
    {
        return new CompanyResource($request->user()->load(['phones', 'messengers']));
    }

    /**
     * Update the company name, phones and messengers. Password changes go through /auth/change-password.
     */
    public function update(UpdateSettingsRequest $request): CompanyResource
    {
        $company = $request->user();

        DB::transaction(function () use ($request, $company): void {
            $company->update($request->safe()->only('name'));
            $company->replaceContacts($request->validated('phones'), $request->validated('messengers'));
        });

        return new CompanyResource($company->load(['phones', 'messengers']));
    }
}
