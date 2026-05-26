<?php

namespace App\Mail;

use App\Models\Customer;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CustomerNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public $subjectText;
    public $messageText;
    public $customer;

    /**
     * Create a new message instance.
     */
    public function __construct(string $subjectText, string $messageText, Customer $customer)
    {
        $this->subjectText = $subjectText;
        $this->messageText = $messageText;
        $this->customer = $customer;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->subjectText,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        // Convert text to HTML-safe and replace URLs with clickable <a> tags
        $escapedBody = e($this->messageText);
        $htmlBody = preg_replace(
            '/(https?:\/\/[^\s]+)/',
            '<a href="$1" style="color: #2563eb; text-decoration: underline; font-weight: 600;" target="_blank">$1</a>',
            $escapedBody
        );

        return new Content(
            view: 'emails.customer_notification',
            with: [
                'subject' => $this->subjectText,
                'messageBody' => $htmlBody,
                'customerName' => $this->customer->name,
                'customerEmail' => $this->customer->email,
            ],
        );
    }
}
