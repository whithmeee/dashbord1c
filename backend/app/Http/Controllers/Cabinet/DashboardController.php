<?php

namespace App\Http\Controllers\Cabinet;

use App\Http\Controllers\Controller;
use App\Http\Resources\CompanyResource;
use App\Http\Resources\EmployeeResource;
use App\Http\Resources\IntegrationResource;
use App\Models\Company;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * The client's home screen: company card, connected 1C databases and (for the owner) the team.
     *
     * @return array<string, mixed>
     */
    public function __invoke(Request $request): array
    {
        $account = $request->user();
        $company = $account->ownerCompany()->load(['phones', 'messengers']);
        $integrations = $company->integrations()->get();

        $dashboard = [
            'company' => (new CompanyResource($company))->resolve(),
            'integrations' => [
                'count' => $integrations->count(),
                'active_count' => $integrations->where('is_active', true)->count(),
                'items' => IntegrationResource::collection($integrations)->resolve(),
            ],
        ];

        if ($account instanceof Company) {
            $employees = $company->employees()->orderBy('name')->get();

            $dashboard['employees'] = [
                'count' => $employees->count(),
                'online_count' => $employees->filter->isOnline()->count(),
                'items' => EmployeeResource::collection($employees)->resolve(),
            ];
        }

        return $dashboard;
    }
}
