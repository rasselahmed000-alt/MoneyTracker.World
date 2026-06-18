import { useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Plane } from 'lucide-react';

export default function AirTicketReceipt({ ticket, onClose }) {
  const receiptRef = useRef(null);

  const handleDownload = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Air Ticket — ${ticket.bookingRef}</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: 'Arial', sans-serif; background: #f0f4f8; display:flex; justify-content:center; align-items:center; min-height:100vh; padding:20px; }
  .ticket { width:600px; background:#fff; border-radius:20px; overflow:hidden; box-shadow:0 20px 60px rgba(0,0,0,0.15); }
  .header { background: linear-gradient(135deg, #0B3D2E 0%, #1a6b4e 100%); color:white; padding:30px; text-align:center; }
  .logo { font-size:28px; font-weight:900; letter-spacing:2px; color:#D4A843; margin-bottom:4px; }
  .subtitle { font-size:12px; color:rgba(255,255,255,0.6); letter-spacing:1px; text-transform:uppercase; }
  .status-badge { display:inline-block; background:#22c55e; color:#fff; font-size:11px; font-weight:700; padding:4px 14px; border-radius:20px; margin-top:12px; letter-spacing:1px; }
  .route-section { background: linear-gradient(135deg, #0B3D2E 0%, #1a6b4e 100%); padding:0 30px 30px; }
  .route-box { background:rgba(255,255,255,0.1); border-radius:16px; padding:20px; display:flex; align-items:center; justify-content:space-between; }
  .airport-code { font-size:36px; font-weight:900; color:#fff; }
  .airport-name { font-size:11px; color:rgba(255,255,255,0.6); margin-top:2px; }
  .flight-line { flex:1; display:flex; flex-direction:column; align-items:center; padding:0 16px; }
  .flight-path { display:flex; align-items:center; width:100%; }
  .dot { width:8px; height:8px; background:#D4A843; border-radius:50%; }
  .line { flex:1; height:1px; background:rgba(255,255,255,0.3); }
  .plane-icon { color:#D4A843; font-size:16px; padding:0 4px; }
  .flight-duration { font-size:11px; color:rgba(255,255,255,0.6); margin-top:6px; }
  .divider { position:relative; display:flex; align-items:center; margin:0; }
  .divider::before { content:''; position:absolute; left:0; width:30px; height:30px; background:#f0f4f8; border-radius:0 50% 50% 0; }
  .divider::after { content:''; position:absolute; right:0; width:30px; height:30px; background:#f0f4f8; border-radius:50% 0 0 50%; }
  .divider-line { flex:1; border-top:2px dashed #e2e8f0; margin:0 40px; }
  .body { padding:24px 30px; }
  .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; }
  .info-item label { font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; font-weight:700; display:block; margin-bottom:4px; }
  .info-item span { font-size:14px; color:#1e293b; font-weight:700; }
  .ref-section { background:linear-gradient(135deg, #f8fafc, #f1f5f9); border:2px dashed #e2e8f0; border-radius:14px; padding:16px; text-align:center; margin-bottom:20px; }
  .ref-label { font-size:10px; color:#94a3b8; text-transform:uppercase; letter-spacing:2px; font-weight:700; }
  .ref-code { font-size:28px; font-weight:900; color:#0B3D2E; letter-spacing:4px; margin:4px 0; }
  .payment-row { display:flex; justify-content:space-between; align-items:center; padding:10px 0; border-bottom:1px solid #f1f5f9; }
  .payment-row:last-child { border-bottom:none; }
  .payment-label { font-size:12px; color:#64748b; }
  .payment-value { font-size:14px; font-weight:700; color:#1e293b; }
  .payment-value.total { font-size:18px; color:#0B3D2E; }
  .payment-value.savings { color:#22c55e; }
  .footer { background:#f8fafc; padding:16px 30px; text-align:center; }
  .footer p { font-size:11px; color:#94a3b8; }
  .footer strong { color:#0B3D2E; }
  .times { display:flex; gap:6px; align-items:center; justify-content:center; margin-top:8px; }
  .time-badge { background:rgba(255,255,255,0.15); color:#fff; padding:4px 12px; border-radius:8px; font-size:13px; font-weight:800; }
  .time-sep { color:rgba(255,255,255,0.4); font-size:11px; }
</style>
</head>
<body>
<div class="ticket">
  <div class="header">
    <div class="logo">MONEY TRACKER</div>
    <div class="subtitle">E-Ticket / Boarding Pass</div>
    <div class="status-badge">✓ CONFIRMED</div>
  </div>
  <div class="route-section">
    <div class="route-box">
      <div style="text-align:left">
        <div class="airport-code">${ticket.fromCode}</div>
        <div class="airport-name">${ticket.fromName}</div>
      </div>
      <div class="flight-line">
        <div class="flight-path">
          <div class="dot"></div>
          <div class="line"></div>
          <span class="plane-icon">✈</span>
          <div class="line"></div>
          <div class="dot"></div>
        </div>
        <div class="flight-duration">${ticket.duration}</div>
      </div>
      <div style="text-align:right">
        <div class="airport-code">${ticket.toCode}</div>
        <div class="airport-name">${ticket.toName}</div>
      </div>
    </div>
    <div class="times" style="margin-top:12px">
      <div class="time-badge">${ticket.departure}</div>
      <div class="time-sep">→</div>
      <div class="time-badge">${ticket.arrival}</div>
    </div>
  </div>
  <div class="divider"><div class="divider-line"></div></div>
  <div class="body">
    <div class="info-grid">
      <div class="info-item"><label>Airline</label><span>${ticket.airlineName}</span></div>
      <div class="info-item"><label>Flight No.</label><span>${ticket.flightNo}</span></div>
      <div class="info-item"><label>Date</label><span>${ticket.date}</span></div>
      <div class="info-item"><label>Cabin</label><span style="text-transform:capitalize">${ticket.cabin}</span></div>
      <div class="info-item"><label>Passengers</label><span>${ticket.passengers}</span></div>
      <div class="info-item"><label>Baggage</label><span>${ticket.baggage}</span></div>
      <div class="info-item"><label>Passenger Name</label><span>${ticket.passengerName}</span></div>
      <div class="info-item"><label>Stops</label><span>${ticket.stops}</span></div>
    </div>
    <div class="ref-section">
      <div class="ref-label">Booking Reference</div>
      <div class="ref-code">${ticket.bookingRef}</div>
      <div style="font-size:11px;color:#94a3b8">Keep this code for check-in</div>
    </div>
    <div class="payment-row"><span class="payment-label">Ticket Price (per pax)</span><span class="payment-value">৳${ticket.pricePerPax?.toLocaleString()}</span></div>
    <div class="payment-row"><span class="payment-label">Original Price</span><span class="payment-value" style="text-decoration:line-through;color:#94a3b8">৳${ticket.originalPrice?.toLocaleString()}</span></div>
    <div class="payment-row"><span class="payment-label">Money Tracker Discount (20%)</span><span class="payment-value savings">-৳${ticket.savings?.toLocaleString()}</span></div>
    <div class="payment-row" style="border-top:2px solid #e2e8f0;margin-top:4px;padding-top:14px"><span class="payment-label" style="font-weight:700;color:#1e293b;font-size:14px">Total Paid</span><span class="payment-value total">৳${ticket.totalPrice?.toLocaleString()}</span></div>
  </div>
  <div class="footer">
    <p><strong>Money Tracker</strong> — Your trusted digital remittance partner</p>
    <p style="margin-top:4px">Issued: ${new Date().toLocaleString()} · This is an official e-ticket</p>
  </div>
</div>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MoneyTracker-Ticket-${ticket.bookingRef}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-0">
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28 }}
        className="bg-white w-full max-w-[430px] rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 shrink-0">
          <h3 className="font-extrabold text-base text-gray-800">✈️ Air Ticket Receipt</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Ticket Body */}
        <div ref={receiptRef} className="overflow-y-auto flex-1">
          {/* Ticket Visual */}
          <div className="bg-gradient-to-br from-forest to-emerald-700 px-5 py-5">
            <div className="text-center mb-4">
              <p className="text-gold font-extrabold text-xl tracking-widest">MONEY TRACKER</p>
              <p className="text-white/50 text-[10px] uppercase tracking-widest">E-Ticket · Boarding Pass</p>
              <span className="inline-block bg-green-400 text-white text-[10px] font-bold px-3 py-0.5 rounded-full mt-2">✓ CONFIRMED</span>
            </div>

            {/* Route */}
            <div className="bg-white/10 rounded-2xl p-4 flex items-center justify-between mb-3">
              <div>
                <p className="text-white font-extrabold text-3xl">{ticket.fromCode}</p>
                <p className="text-white/50 text-[10px]">{ticket.fromName}</p>
              </div>
              <div className="flex-1 flex flex-col items-center px-3">
                <div className="flex items-center w-full gap-1">
                  <div className="w-2 h-2 rounded-full bg-gold" />
                  <div className="flex-1 h-px bg-white/30" />
                  <Plane size={14} className="text-gold" />
                  <div className="flex-1 h-px bg-white/30" />
                  <div className="w-2 h-2 rounded-full bg-gold" />
                </div>
                <p className="text-white/50 text-[10px] mt-1">{ticket.duration}</p>
              </div>
              <div className="text-right">
                <p className="text-white font-extrabold text-3xl">{ticket.toCode}</p>
                <p className="text-white/50 text-[10px]">{ticket.toName}</p>
              </div>
            </div>

            {/* Times */}
            <div className="flex justify-center gap-3">
              <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
                <p className="text-white/50 text-[9px] uppercase">Departs</p>
                <p className="text-white font-extrabold text-lg">{ticket.departure}</p>
              </div>
              <div className="flex items-center text-white/30">→</div>
              <div className="bg-white/15 rounded-xl px-4 py-2 text-center">
                <p className="text-white/50 text-[9px] uppercase">Arrives</p>
                <p className="text-white font-extrabold text-lg">{ticket.arrival}</p>
              </div>
            </div>
          </div>

          {/* Dashed divider */}
          <div className="flex items-center bg-gray-50">
            <div className="w-5 h-5 rounded-full bg-white -ml-2.5 shrink-0" />
            <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-1" />
            <div className="w-5 h-5 rounded-full bg-white -mr-2.5 shrink-0" />
          </div>

          {/* Details */}
          <div className="bg-gray-50 px-5 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Airline', value: ticket.airlineName },
                { label: 'Flight No.', value: ticket.flightNo },
                { label: 'Date', value: ticket.date },
                { label: 'Cabin', value: ticket.cabin?.toUpperCase() },
                { label: 'Passengers', value: ticket.passengers },
                { label: 'Baggage', value: ticket.baggage },
                { label: 'Passenger', value: ticket.passengerName },
                { label: 'Stops', value: ticket.stops },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-xl p-3 shadow-sm">
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{label}</p>
                  <p className="text-sm font-bold text-gray-800 mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {/* Booking Ref */}
            <div className="bg-white border-2 border-dashed border-forest/20 rounded-2xl p-4 text-center">
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">Booking Reference</p>
              <p className="text-forest font-extrabold text-2xl tracking-widest mt-1">{ticket.bookingRef}</p>
              <p className="text-[10px] text-gray-400 mt-1">Present this code at check-in</p>
            </div>

            {/* Payment */}
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Original Price</span>
                <span className="text-gray-400 line-through">৳{ticket.originalPrice?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Money Tracker Discount</span>
                <span className="text-emerald-500 font-bold">-৳{ticket.savings?.toLocaleString()}</span>
              </div>
              <div className="h-px bg-gray-100" />
              <div className="flex justify-between">
                <span className="font-extrabold text-gray-800">Total Paid</span>
                <span className="font-extrabold text-forest text-lg">৳{ticket.totalPrice?.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Download Button */}
        <div className="px-5 py-4 border-t border-gray-100 shrink-0">
          <button onClick={handleDownload}
            className="w-full bg-forest text-gold py-4 rounded-2xl font-extrabold text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-transform">
            <Download size={20} />
            Download Ticket (HTML)
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}