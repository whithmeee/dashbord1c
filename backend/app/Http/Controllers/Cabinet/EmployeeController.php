<?php

namespace App\Http\Controllers\Cabinet;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cabinet\StoreEmployeeRequest;
use App\Http\Requests\Cabinet\UpdateEmployeeRequest;
use App\Http\Resources\EmployeeResource;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

/**
 * The company owner manages the team. Every action is scoped to the owner's own employees.
 */
class EmployeeController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        return EmployeeResource::collection($request->user()->employees()->orderBy('name')->get());
    }

    public function show(Request $request, Employee $employee): EmployeeResource
    {
        $this->ensureOwnEmployee($request, $employee);

        return new EmployeeResource($employee);
    }

    public function store(StoreEmployeeRequest $request): JsonResponse
    {
        $employee = $request->user()->employees()->create($request->validated());

        return (new EmployeeResource($employee))->response()->setStatusCode(201);
    }

    public function update(UpdateEmployeeRequest $request, Employee $employee): EmployeeResource
    {
        $this->ensureOwnEmployee($request, $employee);

        $employee->update($request->validated());

        return new EmployeeResource($employee);
    }

    public function destroy(Request $request, Employee $employee): JsonResponse
    {
        $this->ensureOwnEmployee($request, $employee);

        $employee->delete();

        return response()->json(null, 204);
    }

    private function ensureOwnEmployee(Request $request, Employee $employee): void
    {
        abort_unless($employee->company_id === $request->user()->id, 404);
    }
}
