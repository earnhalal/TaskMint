// Raast (SBP) EMV QR payload builder.
//
// Format follows the State Bank of Pakistan interoperable QR
// specification (EMV merchant-presented mode):
//   00  Payload Format Indicator: "01"
//   01  Point of Initiation: "12" dynamic (amount embedded) / "11" static
//   27  Merchant Account Information (Raast): subtag 00 = AID
//       "A000000736", subtag 01 = the 24-character IBAN
//   52  Merchant Category Code: "5999"
//   53  Currency: "586" (PKR)
//   54  Transaction amount (dynamic QRs only)
//   58  Country code: "PK"
//   59  Account title (max 25 chars)
//   60  City (max 15 chars)
//   63  CRC16-CCITT (poly 0x1021, init 0xFFFF)
function tlv(id: string, value: string): string {
  return id + String(value.length).padStart(2, '0') + value;
}

function crc16Ccitt(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= (data.charCodeAt(i) & 0xff) << 8;
    for (let j = 0; j < 8; j++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function buildRaastQrPayload(iban: string, name: string, amount?: number): string | null {
  const cleanIban = (iban || '').replace(/\s+/g, '').toUpperCase();
  if (!/^PK\d{2}[A-Z]{4}\d{16}$/.test(cleanIban)) return null;

  const hasAmount = typeof amount === 'number' && Number.isFinite(amount) && amount > 0;
  const mai = tlv('00', 'A000000736') + tlv('01', cleanIban);

  let payload = tlv('00', '01');
  payload += tlv('01', hasAmount ? '12' : '11');
  payload += tlv('27', mai);
  payload += tlv('52', '5999');
  payload += tlv('53', '586');
  if (hasAmount) {
    payload += tlv('54', Number.isInteger(amount) ? String(amount) : amount!.toFixed(2));
  }
  payload += tlv('58', 'PK');
  payload += tlv('59', (name || 'TASKMINT').toUpperCase().slice(0, 25));
  payload += tlv('60', 'PAKISTAN');
  payload += '6304';
  return payload + crc16Ccitt(payload);
}
