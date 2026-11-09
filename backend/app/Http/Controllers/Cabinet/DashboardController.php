<?php

namespace App\Http\Controllers\Cabinet;

use App\Enums\CabinetSection;
use App\Http\Controllers\Controller;
use App\Http\Resources\CompanyResource;
use App\Http\Resources\EmployeeResource;
use App\Http\Resources\IntegrationResource;
use App\Models\Company;
use App\Models\Employee;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * The client's home screen: company card, connected 1C databases and (for the owner) the team.
     * An employee gets only the blocks of the sections the owner opened to them.
     *
     * @return array<string, mixed>
     */
    public function __invoke(Request $request): array
    {
        $account = $request->user();
        $company = $account->ownerCompany()->load(['phones', 'messengers']);

        $dashboard = [
            'company' => (new CompanyResource($company))->resolve(),
            'viewer' => $this->viewer($account),
        ];

        if ($this->allows($account, CabinetSection::Integrations)) {
            $dashboard['integrations'] = $this->integrations($company);
        }

        if (! $this->allows($account, CabinetSection::Subscription)) {
            unset($dashboard['company']['subscription_status']);
        }

        if ($account instanceof Company) {
            $dashboard['employees'] = $this->employees($company);
        }

        return $dashboard;
    }

    /**
     * Who is looking at the cabinet: the company itself or one of its employees.
     *
     * @return array{type: string, name: string, position: ?string}
     */
    private function viewer(Company|Employee $account): array
    {
        return $account instanceof Employee
            ? ['type' => 'employee', 'name' => $account->name, 'position' => $account->position]
            : ['type' => 'company', 'name' => $account->name, 'position' => null];
    }

    private function allows(Company|Employee $account, CabinetSection $section): bool
    {
        return $account instanceof Company || $account->hasSection($section->value);
    }

    /**
     * @return array<string, mixed>
     */
    private function integrations(Company $company): array
    {
        $integrations = $company->integrations()->get();

        return [
            'count' => $integrations->count(),
            'active_count' => $integrations->where('is_active', true)->count(),
            'items' => IntegrationResource::collection($integrations)->resolve(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function employees(Company $company): array
    {
        $employees = $company->employees()->orderBy('name')->get();

        return [
            'count' => $employees->count(),
            'online_count' => $employees->filter->isOnline()->count(),
            'items' => EmployeeResource::collection($employees)->resolve(),
        ];
    }
}
