<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice #{{ $invoice->id }}</title>
    <style>
        body { font-family: sans-serif; color: #333; line-height: 1.5; }
        .invoice-box { max-width: 800px; margin: auto; padding: 30px; }
        .header { display: table; width: 100%; border-bottom: 2px solid #eee; padding-bottom: 20px; }
        .header-cell { display: table-cell; vertical-align: top; }
        .logo { font-size: 28px; font-weight: bold; color: #2563eb; }
        .status-paid { color: #059669; font-weight: bold; text-transform: uppercase; border: 2px solid #059669; padding: 5px 10px; display: inline-block; margin-top: 10px; }
        .details { margin-top: 40px; width: 100%; border-collapse: collapse; }
        .details th { text-align: left; background: #f9fafb; padding: 12px; border-bottom: 1px solid #eee; }
        .details td { padding: 12px; border-bottom: 1px solid #eee; }
        .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #9ca3af; }
    </style>
</head>
<body>
    <div className="invoice-box">
        <div className="header">
            <div className="header-cell">
                <div className="logo text-blue-600">NETBILLING ISP</div>
                <div>Jl. Merdeka No. 123, Indonesia</div>
                <div>Support: support@netbilling.id</div>
            </div>
            <div className="header-cell" style="text-align: right;">
                <div style="font-size: 20px; font-weight: bold;">KWITANSI PEMBAYARAN</div>
                <div>No: #INV-{{ str_pad($invoice->id, 4, '0', STR_PAD_LEFT) }}</div>
                <div>Tanggal: {{ \Carbon\Carbon::parse($invoice->updated_at)->format('d F Y') }}</div>
                @if($invoice->status == 'paid')
                    <div className="status-paid">LUNAS</div>
                @endif
            </div>
        </div>

        <div style="margin-top: 30px;">
            <div style="float: left; width: 50%;">
                <div style="font-weight: bold; color: #6b7280; font-size: 12px; text-transform: uppercase;">Ditagihkan Ke:</div>
                <div style="font-size: 16px; font-weight: bold;">{{ $invoice->customer->name }}</div>
                <div>{{ $invoice->customer->address }}</div>
                <div>IP: {{ $invoice->customer->ip_address }}</div>
            </div>
            <div style="clear: both;"></div>
        </div>

        <table className="details">
            <thead>
                <tr>
                    <th>Deskripsi Layanan</th>
                    <th>Periode</th>
                    <th style="text-align: right;">Total</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>
                        <strong>{{ $invoice->package->name }}</strong><br>
                        <span style="font-size: 12px; color: #666;">Kecepatan hingga {{ $invoice->package->speed }}</span>
                    </td>
                    <td>{{ \Carbon\Carbon::create(null, $invoice->month)->format('F') }} {{ $invoice->year }}</td>
                    <td style="text-align: right; font-weight: bold;">Rp {{ number_format($invoice->amount, 0, ',', '.') }}</td>
                </tr>
            </tbody>
            <tfoot>
                <tr>
                    <td colspan="2" style="text-align: right; font-weight: bold; padding-top: 20px;">TOTAL BAYAR</td>
                    <td style="text-align: right; font-weight: bold; padding-top: 20px; font-size: 20px; color: #2563eb;">Rp {{ number_format($invoice->amount, 0, ',', '.') }}</td>
                </tr>
            </tfoot>
        </table>

        <div className="footer">
            <p>Terima kasih telah berlangganan layanan internet kami.</p>
            <p>Simpan kwitansi ini sebagai bukti pembayaran yang sah.</p>
        </div>
    </div>
</body>
</html>
