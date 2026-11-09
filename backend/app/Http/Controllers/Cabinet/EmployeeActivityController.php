<?php

namespace App\Http\Controllers\Cabinet;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Services\EmployeeActivityService;
use Illuminate\Http\Request;

class EmployeeActivityController extends Controller
{
    private const DEFAULT_LIMIT = 50;

    private const MAX_LIMIT = 200;

    /**
     * Sign-in and sign-out times and recent questions of one of the owner's employees.
     *
     * @return array<string, mixed>
     */
    public function __invoke(Request $request, Employee $employee, EmployeeActivityService $activity): array
    {
        abort_unless($employee->company_id === $request->user()->id, 404);

        $limit = min(max($request->integer('limit', self::DEFAULT_LIMIT), 1), self::MAX_LIMIT);

        return $activity->profile($employee, $limit);
    }
}
