<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject }}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                    <!-- Header -->
                    <tr>
                        <td style="background-color: #2563eb; padding: 24px 32px; text-align: left;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">NetBilling ISP</h1>
                            <p style="margin: 4px 0 0 0; color: #93c5fd; font-size: 12px; font-weight: 600;">Layanan Internet Terpercaya</p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 32px 32px; text-align: left;">
                            <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Kepada: {{ $customerName }} ({{ $customerEmail }})</p>
                            <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 18px; font-weight: 700; border-bottom: 2px solid #f3f4f6; padding-bottom: 12px; line-height: 1.3;">{{ $subject }}</h2>
                            <p style="margin: 0; color: #4b5563; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">{!! $messageBody !!}</p>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 16px 32px; text-align: center; border-top: 1px solid #f3f4f6;">
                            <p style="margin: 0; color: #9ca3af; font-size: 11px; line-height: 1.5;">NetBilling ISP &bull; Jl. Contoh No. 1 &bull; Jangan balas email ini</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
