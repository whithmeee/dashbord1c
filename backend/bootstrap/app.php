<?php

use App\Exceptions\DeepSeekException;
use App\Exceptions\OneCException;
use App\Http\Middleware\EnsureCompanyAccess;
use App\Http\Middleware\EnsureEmployeeSection;
use App\Http\Middleware\EnsureUserIsAdmin;
use App\Http\Middleware\TrackLastSeen;
use App\Support\RussianErrorMessages;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

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
            'section' => EnsureEmployeeSection::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(fn (OneCException|DeepSeekException $exception) => response()->json([
            'message' => $exception->getMessage(),
        ], 502));

        $exceptions->respond(function (Response $response) {
            if (! $response instanceof JsonResponse) {
                return $response;
            }

            $payload = $response->getData(true);
            $message = (string) ($payload['message'] ?? '');
            $russianMessage = RussianErrorMessages::forStatus($response->getStatusCode());

            if ($russianMessage !== null && ! preg_match('/\p{Cyrillic}/u', $message)) {
                $payload['message'] = $russianMessage;
                $response->setData($payload);
            }

            return $response;
        });

        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*', 'auth/*', 'admin-panel/*', 'cabinet/*') || $request->expectsJson(),
        );
    })->create();
