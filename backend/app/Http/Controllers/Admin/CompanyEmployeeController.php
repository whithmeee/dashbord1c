<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\EmployeeResource;
use App\Models\Company;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class CompanyEmployeeController extends Controller
{
    public function index(Company $company): AnonymousResourceCollection
    {
        return EmployeeResource::collection($company->employees()->orderBy('name')->get());
    }
}
