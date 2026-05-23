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
        return new Content(
            view: 'emails.customer_notification',
            with: [
                'subject' => $this->subjectText,
                'messageBody' => $this->messageText,
                'customerName' => $this->customer->name,
                'customerEmail' => $this->customer->email,
            ],
        );
    }
}
