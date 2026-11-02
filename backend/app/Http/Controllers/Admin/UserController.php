<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Str;

/**
 * Staff accounts of the administration team (not client companies).
 */
class UserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $users = User::with('role')
            ->when($request->integer('role_id'), fn ($query, int $roleId) => $query->where('role_id', $roleId))
            ->latest('id')
            ->paginate(25);

        return UserResource::collection($users);
    }

    public function show(User $user): UserResource
    {
        return new UserResource($user->load('role'));
    }

    /**
     * Create a staff account (or another administrator). The generated password is returned once, in `initial_password`.
     */
    public function store(StoreUserRequest $request): JsonResponse
    {
        $initialPassword = $this->generatePassword();

        $user = new User($request->safe()->except('role_id'));
        $user->forceFill([
            'role_id' => $request->validated('role_id', Role::USER_ID),
            'password' => $initialPassword,
        ])->save();

        return $this->withInitialPassword($user, $initialPassword, 201);
    }

    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        $user->fill($request->safe()->except('role_id'));

        if ($request->has('role_id')) {
            abort_if($user->is($request->user()) && $request->integer('role_id') !== Role::ADMIN_ID, 422, 'Нельзя снять роль администратора с самого себя.');
            $user->role_id = $request->integer('role_id');
        }

        $user->save();

        return new UserResource($user->load('role'));
    }

    /**
     * Issue a new temporary password. Existing sessions end because their stored password hash no longer matches.
     */
    public function resetPassword(User $user): JsonResponse
    {
        $initialPassword = $this->generatePassword();

        $user->forceFill(['password' => $initialPassword])->save();

        return $this->withInitialPassword($user, $initialPassword);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        abort_if($user->is($request->user()), 422, 'Нельзя удалить самого себя.');

        $user->delete();

        return response()->json(null, 204);
    }

    /**
     * The flat user payload plus the one-time plain password for the administrator to hand over.
     */
    private function withInitialPassword(User $user, string $initialPassword, int $status = 200): JsonResponse
    {
        $payload = (new UserResource($user->load('role')))->resolve();

        return response()->json($payload + ['initial_password' => $initialPassword], $status);
    }

    private function generatePassword(): string
    {
        return Str::password(14, symbols: false);
    }
}
