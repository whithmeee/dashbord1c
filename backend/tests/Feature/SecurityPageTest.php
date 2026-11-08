<?php

namespace Tests\Feature;

use Tests\TestCase;

class SecurityPageTest extends TestCase
{
    public function test_security_page_is_public(): void
    {
        $this->get('/security')
            ->assertOk()
            ->assertSee('Безопасность');
    }

    public function test_security_page_has_a_named_route(): void
    {
        $this->assertSame(url('/security'), route('security'));
    }
}
