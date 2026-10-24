import React from 'react';
import { QrCode } from 'lucide-react';
import { EASYPAISA_QR_DATA_URI } from '../assets/easypaisaQr';

interface PaymentQrCardProps {
  // When set (e.g. the activation joining fee), the caption tells the
  // user to send exactly this amount after scanning.
  amount?: number;
}

// The owner's official EasyPaisa QR card, saved from the EasyPaisa app.
// EasyPaisa's own QR format carries no amount, so after scanning the
// user enters the amount inside the EasyPaisa app.
export default function PaymentQrCard({ amount }: PaymentQrCardProps) {
  return (
    <div className="bg-[#15181D] border border-white/5 rounded-3xl p-5 text-center">
      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.18em] mb-1 flex items-center justify-center gap-1.5">
        <QrCode className="w-3.5 h-3.5" /> Or pay by QR code
      </p>
      <p className="text-[11px] font-semibold text-zinc-400 mb-4">
        Scan with the EasyPaisa app
        {amount ? (
          <>
            {' '}and send exactly{' '}
            <span className="text-emerald-400 font-black">Rs. {amount.toLocaleString()}</span>
          </>
        ) : (
          ' and enter your deposit amount'
        )}
      </p>
      <div className="bg-white rounded-2xl p-3 inline-block">
        <img
          src={EASYPAISA_QR_DATA_URI}
          alt="EasyPaisa QR code — MUHAMMAD WASEEM"
          className="w-52 h-auto rounded-lg"
        />
      </div>
      <p className="text-[10px] font-bold text-zinc-500 mt-3 uppercase tracking-widest">
        EasyPaisa • MUHAMMAD WASEEM
      </p>
    </div>
  );
}
