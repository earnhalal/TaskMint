import React, { useMemo } from 'react';
import QRCode from 'react-qr-code';
import { QrCode } from 'lucide-react';
import { buildRaastQrPayload } from '../utils/raastQr';

interface RaastQrCardProps {
  iban?: string;
  name?: string;
  // PKR amount embedded in the QR. Omit it for an any-amount QR.
  amount?: number;
}

// Shows a Raast QR for the platform payment account when an IBAN is
// configured in app_settings (paymentIban). Renders nothing otherwise.
export default function RaastQrCard({ iban, name, amount }: RaastQrCardProps) {
  const payload = useMemo(
    () => buildRaastQrPayload(iban || '', name || 'TASKMINT', amount),
    [iban, name, amount]
  );

  if (!payload) return null;

  return (
    <div className="bg-[#15181D] border border-white/5 rounded-3xl p-5 text-center">
      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.18em] mb-1 flex items-center justify-center gap-1.5">
        <QrCode className="w-3.5 h-3.5" /> Or pay by Raast QR
      </p>
      <p className="text-[11px] font-semibold text-zinc-400 mb-4">
        Scan with EasyPaisa, JazzCash or any bank app
        {amount ? (
          <>
            {' '}— amount is set to{' '}
            <span className="text-emerald-400 font-black">Rs. {amount.toLocaleString()}</span>
          </>
        ) : (
          ' — enter the amount in your app'
        )}
      </p>
      <div className="bg-white rounded-2xl p-4 inline-block">
        <QRCode value={payload} size={176} />
      </div>
      <p className="text-[10px] font-bold text-zinc-500 mt-3 uppercase tracking-widest">
        {(name || 'TASKMINT').toUpperCase()} • Raast
      </p>
    </div>
  );
}
