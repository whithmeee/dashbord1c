<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class EmailVerificationCodeNotification extends Notification
{
    public function __construct(
        public readonly string $code,
        public readonly int $lifetimeMinutes,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Код подтверждения почты')
            ->markdown('mail.verification-code', [
                'name' => $notifiable->name,
                'code' => $this->code,
                'lifetimeMinutes' => $this->lifetimeMinutes,
            ]);
    }
}
