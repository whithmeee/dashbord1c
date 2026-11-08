<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Auth\EmailVerificationController;
use App\Http\Controllers\Cabinet;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');

    Route::middleware(['auth:web,company,employee', 'last.seen'])->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);

        Route::post('/email/verify', [EmailVerificationController::class, 'verify'])->middleware('throttle:10,1');
        Route::post('/email/resend', [EmailVerificationController::class, 'resend'])->middleware('throttle:3,1');
    });
});

Route::prefix('cabinet')->middleware(['auth:company,employee', 'last.seen', 'company.access'])->group(function () {
    Route::get('/dashboard', Cabinet\DashboardController::class);
    Route::get('/finance/sales', Cabinet\FinanceSalesController::class);
    Route::get('/integrations', [Cabinet\IntegrationController::class, 'index']);
    Route::get('/integrations/{integration}/check', [Cabinet\IntegrationController::class, 'check'])->middleware('throttle:30,1');
    Route::get('/statistics', Cabinet\StatisticsController::class);
    Route::middleware('company.access:owner')->group(function () {
        Route::get('/settings', [Cabinet\SettingsController::class, 'show']);
        Route::patch('/settings', [Cabinet\SettingsController::class, 'update']);

        Route::get('/employees', [Cabinet\EmployeeController::class, 'index']);
        Route::post('/employees', [Cabinet\EmployeeController::class, 'store']);
        Route::patch('/employees/{employee}', [Cabinet\EmployeeController::class, 'update']);
        Route::delete('/employees/{employee}', [Cabinet\EmployeeController::class, 'destroy']);
    });
});

Route::prefix('admin-panel')->middleware('admin')->group(function () {
    Route::get('/companies', [Admin\CompanyController::class, 'index']);
    Route::post('/companies', [Admin\CompanyController::class, 'store']);
    Route::get('/companies/{company}', [Admin\CompanyController::class, 'show']);
    Route::patch('/companies/{company}', [Admin\CompanyController::class, 'update']);
    Route::delete('/companies/{company}', [Admin\CompanyController::class, 'destroy']);
    Route::post('/companies/{company}/reset-password', [Admin\CompanyController::class, 'resetPassword']);
    Route::get('/companies/{company}/employees', [Admin\CompanyEmployeeController::class, 'index']);

    Route::get('/statistics', Admin\StatisticsController::class);

    Route::get('/integrations', [Admin\IntegrationController::class, 'index']);
    Route::post('/integrations', [Admin\IntegrationController::class, 'store']);
    Route::patch('/integrations/{integration}', [Admin\IntegrationController::class, 'update']);
    Route::delete('/integrations/{integration}', [Admin\IntegrationController::class, 'destroy']);
    Route::get('/integrations/{integration}/test', [Admin\IntegrationController::class, 'testConnection']);

    Route::get('/users', [Admin\UserController::class, 'index']);
    Route::post('/users', [Admin\UserController::class, 'store']);
    Route::get('/users/{user}', [Admin\UserController::class, 'show']);
    Route::patch('/users/{user}', [Admin\UserController::class, 'update']);
    Route::delete('/users/{user}', [Admin\UserController::class, 'destroy']);
    Route::post('/users/{user}/reset-password', [Admin\UserController::class, 'resetPassword']);
});

// У компании может быть несколько баз, которые интегрированы с приложением
// отобразить для компании количество интегрированных баз и их статус - возможность переключаться между его базами из 1с для вопросов
// к боту
// базы из 1С привязаны к компаниям
// статистика запросов к боту от пользователя за месяц неделю день год
