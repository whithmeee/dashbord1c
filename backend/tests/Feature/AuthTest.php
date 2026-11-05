<?php

namespace Tests\Feature;

use App\Models\Company;
use App\Models\Employee;
use App\Models\User;
use App\Notifications\EmailVerificationCodeNotification;
use Database\Seeders\RoleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RoleSeeder::class);
    }

    private function capturedCode(Company $company): string
    {
        $code = null;

        Notification::assertSentTo($company, EmailVerificationCodeNotification::class, function ($notification) use (&$code) {
            $code = $notification->code;

            return true;
        });

        return $code;
    }

    public function test_company_logs_in_by_email(): void
    {
        $company = Company::factory()->create(['password' => 'secret-pass1']);

        $this->postJson('/auth/login', ['login' => $company->email, 'password' => 'secret-pass1'])
            ->assertOk()
            ->assertJsonPath('type', 'company')
            ->assertJsonPath('account.id', $company->id)
            ->assertJsonPath('account.subscription_status', 'active')
            ->assertJsonMissingPath('account.subscription_ends_at');

        $this->assertAuthenticatedAs($company, 'company');
    }

    public function test_employee_logs_in_by_login(): void
    {
        $employee = Employee::factory()->create(['login' => 'ivan_01', 'password' => 'secret-pass1']);

        $this->postJson('/auth/login', ['login' => 'ivan_01', 'password' => 'secret-pass1'])
            ->assertOk()
            ->assertJsonPath('type', 'employee')
            ->assertJsonPath('account.position', $employee->position);

        $this->assertAuthenticatedAs($employee, 'employee');
    }

    public function test_admin_logs_in_through_the_same_route(): void
    {
        $admin = User::factory()->admin()->create(['password' => 'secret-pass1']);

        $this->postJson('/auth/login', ['login' => $admin->email, 'password' => 'secret-pass1'])
            ->assertOk()
            ->assertJsonPath('type', 'admin')
            ->assertJsonPath('account.is_admin', true)
            ->assertJsonPath('account.role.name', 'admin');

        $this->assertAuthenticatedAs($admin);
    }

    public function test_wrong_credentials_are_rejected(): void
    {
        $company = Company::factory()->create();

        $this->postJson('/auth/login', ['login' => $company->email, 'password' => 'wrong'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('login');
        $this->postJson('/auth/login', ['login' => 'nobody', 'password' => 'x'])->assertUnprocessable();
    }

    public function test_unverified_company_gets_a_code_by_email_on_login_once_per_minute(): void
    {
        Notification::fake();
        $company = Company::factory()->unverified()->create(['password' => 'secret-pass1']);
        $credentials = ['login' => $company->email, 'password' => 'secret-pass1'];

        $this->postJson('/auth/login', $credentials)->assertOk()->assertJsonPath('account.email_verified', false);
        $this->postJson('/auth/login', $credentials)->assertOk();

        Notification::assertSentToTimes($company, EmailVerificationCodeNotification::class, 1);
        $this->assertMatchesRegularExpression('/^\d{6}$/', $this->capturedCode($company));
    }

    public function test_verified_company_receives_no_code(): void
    {
        Notification::fake();
        $company = Company::factory()->create(['password' => 'secret-pass1']);

        $this->postJson('/auth/login', ['login' => $company->email, 'password' => 'secret-pass1'])->assertOk();

        Notification::assertNothingSent();
    }

    public function test_code_mail_contains_the_code(): void
    {
        $company = Company::factory()->unverified()->create();

        $mail = (new EmailVerificationCodeNotification('123456', 15))->toMail($company);

        $this->assertSame('Код подтверждения почты', $mail->subject);
        $this->assertStringContainsString('123456', (string) $mail->render());
    }

    public function test_correct_code_confirms_the_email_and_unlocks_the_cabinet(): void
    {
        Notification::fake();
        $company = Company::factory()->unverified()->create(['password' => 'secret-pass1']);
        $this->postJson('/auth/login', ['login' => $company->email, 'password' => 'secret-pass1']);

        $this->getJson('/cabinet/dashboard')
            ->assertForbidden()
            ->assertJsonPath('code', 'email_verification_required');

        $this->postJson('/auth/email/verify', ['code' => $this->capturedCode($company)])
            ->assertOk()
            ->assertJsonPath('account.email_verified', true);

        $this->assertTrue($company->fresh()->hasVerifiedEmail());
        $this->getJson('/cabinet/dashboard')->assertOk();
    }

    public function test_wrong_code_is_rejected_and_attempts_are_limited(): void
    {
        Notification::fake();
        $company = Company::factory()->unverified()->create();
        $this->actingAs($company, 'company');
        $this->postJson('/auth/email/resend')->assertOk();
        $code = $this->capturedCode($company);
        $wrong = $code === '000000' ? '111111' : '000000';

        $this->postJson('/auth/email/verify', ['code' => $wrong])->assertUnprocessable()->assertJsonValidationErrors('code');

        for ($i = 0; $i < 4; $i++) {
            $this->postJson('/auth/email/verify', ['code' => $wrong])->assertUnprocessable();
        }

        $this->postJson('/auth/email/verify', ['code' => $code])->assertUnprocessable();
        $this->assertFalse($company->fresh()->hasVerifiedEmail());
    }

    public function test_expired_code_is_rejected(): void
    {
        Notification::fake();
        $company = Company::factory()->unverified()->create();
        $this->actingAs($company, 'company');
        $this->postJson('/auth/email/resend')->assertOk();
        $code = $this->capturedCode($company);

        $company->forceFill(['email_verification_code_expires_at' => now()->subMinute()])->save();

        $this->postJson('/auth/email/verify', ['code' => $code])->assertUnprocessable();
    }

    public function test_code_must_be_six_digits(): void
    {
        $this->actingAs(Company::factory()->unverified()->create(), 'company');

        $this->postJson('/auth/email/verify', ['code' => 'abc'])->assertUnprocessable()->assertJsonValidationErrors('code');
    }

    public function test_employee_cannot_confirm_the_company_email(): void
    {
        $company = Company::factory()->unverified()->create();
        $this->actingAs(Employee::factory()->for($company)->create(), 'employee');

        $this->postJson('/auth/email/verify', ['code' => '123456'])->assertForbidden();
        $this->getJson('/cabinet/dashboard')->assertForbidden()->assertJsonPath('code', 'email_verification_required');
    }

    public function test_temporary_password_does_not_have_to_be_changed(): void
    {
        $company = Company::factory()->create(['password' => 'temp-pass-1']);

        $this->postJson('/auth/login', ['login' => $company->email, 'password' => 'temp-pass-1'])->assertOk();

        $this->getJson('/cabinet/dashboard')->assertOk();
    }

    public function test_password_can_be_changed_voluntarily(): void
    {
        $company = Company::factory()->create(['password' => 'temp-pass-1']);
        $this->actingAs($company, 'company');

        $this->postJson('/auth/change-password', [
            'current_password' => 'temp-pass-1',
            'password' => 'my-own-pass1',
            'password_confirmation' => 'my-own-pass1',
        ])->assertOk();

        $this->assertTrue(password_verify('my-own-pass1', $company->fresh()->password));
    }

    public function test_password_change_validates_current_and_new_password(): void
    {
        $this->actingAs(Company::factory()->create(['password' => 'temp-pass-1']), 'company');

        $this->postJson('/auth/change-password', [
            'current_password' => 'wrong',
            'password' => 'my-own-pass1',
            'password_confirmation' => 'my-own-pass1',
        ])->assertUnprocessable()->assertJsonValidationErrors('current_password');

        $this->postJson('/auth/change-password', [
            'current_password' => 'temp-pass-1',
            'password' => 'temp-pass-1',
            'password_confirmation' => 'temp-pass-1',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');

        $this->postJson('/auth/change-password', [
            'current_password' => 'temp-pass-1',
            'password' => 'short',
            'password_confirmation' => 'short',
        ])->assertUnprocessable()->assertJsonValidationErrors('password');
    }

    public function test_employee_can_change_own_password(): void
    {
        $employee = Employee::factory()->create(['password' => 'temp-pass-1']);
        $this->actingAs($employee, 'employee');

        $this->postJson('/auth/change-password', [
            'current_password' => 'temp-pass-1',
            'password' => 'my-own-pass1',
            'password_confirmation' => 'my-own-pass1',
        ])->assertOk();

        $this->assertTrue(password_verify('my-own-pass1', $employee->fresh()->password));
    }

    public function test_me_returns_the_current_account_with_its_type(): void
    {
        $employee = Employee::factory()->create();
        $this->actingAs($employee, 'employee');

        $this->getJson('/auth/me')
            ->assertOk()
            ->assertJsonPath('type', 'employee')
            ->assertJsonPath('account.login', $employee->login);
    }

    public function test_employee_is_online_after_activity_and_offline_after_logout(): void
    {
        $employee = Employee::factory()->create();
        $this->actingAs($employee, 'employee');

        $this->assertFalse($employee->fresh()->isOnline());

        $this->getJson('/auth/me')->assertOk();
        $this->assertTrue($employee->fresh()->isOnline());

        $this->postJson('/auth/logout')->assertOk();
        $this->assertFalse($employee->fresh()->isOnline());
        $this->assertGuest('employee');
    }

    public function test_employee_is_offline_after_five_idle_minutes(): void
    {
        $employee = Employee::factory()->create(['last_seen_at' => now()->subMinutes(6)]);

        $this->assertFalse($employee->isOnline());
    }

    public function test_employee_session_expires_after_password_changes(): void
    {
        $employee = Employee::factory()->create(['password' => 'old-pass1']);
        $this->actingAs($employee, 'employee');

        $this->getJson('/auth/me')->assertOk();
        $employee->forceFill(['password' => 'new-pass1'])->save();
        Auth::forgetGuards();

        $this->getJson('/auth/me')->assertUnauthorized();
    }

    public function test_employee_session_expires_after_employee_is_deleted(): void
    {
        $employee = Employee::factory()->create();
        $this->actingAs($employee, 'employee');

        $this->getJson('/auth/me')->assertOk();
        $employee->delete();
        Auth::forgetGuards();

        $this->getJson('/auth/me')->assertUnauthorized();
    }

    public function test_protected_routes_require_authentication(): void
    {
        $this->getJson('/auth/me')->assertUnauthorized();
        $this->getJson('/cabinet/dashboard')->assertUnauthorized();
        $this->getJson('/api/chats')->assertUnauthorized();
    }
}
