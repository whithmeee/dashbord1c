<?php

use App\Exceptions\DeepSeekException;
use App\Exceptions\OneCException;
use App\Http\Middleware\EnsureCompanyAccess;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\TrackLastSeen;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->redirectGuestsTo(fn (Request $request) => $request->expectsJson() ? null : '/');
        $middleware->statefulApi();
        $middleware->authenticateSessions();

        $middleware->alias([
            'admin' => EnsureUserIsAdmin::class,
            'company.access' => EnsureCompanyAccess::class,
            'last.seen' => TrackLastSeen::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(fn (OneCException|DeepSeekException $exception) => response()->json([
            'message' => $exception->getMessage(),
        ], 502));

        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*', 'auth/*', 'admin-panel/*', 'cabinet/*') || $request->expectsJson(),
        );
    })->create();
