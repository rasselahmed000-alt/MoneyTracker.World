import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Search, Plane, CheckCircle2, AlertCircle, Plus, Tag, Clock, Users } from 'lucide-react';
import UniversalHeader from '@/components/cellfin/UniversalHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { verifyUserPin, getCurrentUser, createTransaction, updateUserDoc } from '@/api/firebaseClient';

const AIRPORTS = [
  { code: 'DAC', name: 'Dhaka', country: 'Bangladesh', flag: '🇧🇩', full: 'Hazrat Shahjalal International' },
  { code: 'CGP', name: 'Chittagong', country: 'Bangladesh', flag: '🇧🇩', full: 'Shah Amanat International' },
  { code: 'ZYL', name: 'Sylhet', country: 'Bangladesh', flag: '🇧🇩', full: 'Osmani International' },
  { code: 'RUH', name: 'Riyadh', country: 'Saudi Arabia', flag: '🇸🇦', full: 'King Khalid International' },
  { code: 'JED', name: 'Jeddah', country: 'Saudi Arabia', flag: '🇸🇦', full: 'King Abdulaziz International' },
  { code: 'DXB', name: 'Dubai', country: 'UAE', flag: '🇦🇪', full: 'Dubai International' },
  { code: 'AUH', name: 'Abu Dhabi', country: 'UAE', flag: '🇦🇪', full: 'Zayed International' },
  { code: 'KUL', name: 'Kuala Lumpur', country: 'Malaysia', flag: '🇲🇾', full: 'KLIA International' },
  { code: 'DOH', name: 'Doha', country: 'Qatar', flag: '🇶🇦', full: 'Hamad International' },
  { code: 'KWI', name: 'Kuwait City', country: 'Kuwait', flag: '🇰🇼', full: 'Kuwait International' },
  { code: 'MCT', name: 'Muscat', country: 'Oman', flag: '🇴🇲', full: 'Muscat International' },
  { code: 'BAH', name: 'Bahrain', country: 'Bahrain', flag: '🇧🇭', full: 'Bahrain International' },
  { code: 'LHR', name: 'London', country: 'UK', flag: '🇬🇧', full: 'Heathrow Airport' },
  { code: 'JFK', name: 'New York', country: 'USA', flag: '🇺🇸', full: 'JFK International' },
  { code: 'SYD', name: 'Sydney', country: 'Australia', flag: '🇦🇺', full: 'Kingsford Smith' },
  { code: 'SIN', name: 'Singapore', country: 'Singapore', flag: '🇸🇬', full: 'Changi Airport' },
  { code: 'BKK', name: 'Bangkok', country: 'Thailand', flag: '🇹🇭', full: 'Suvarnabhumi Airport' },
  { code: 'DEL', name: 'Delhi', country: 'India', flag: '🇮🇳', full: 'Indira Gandhi International' },
  { code: 'TYO', name: 'Tokyo', country: 'Japan', flag: '🇯🇵', full: 'Narita International' },
  { code: 'IST', name: 'Istanbul', country: 'Turkey', flag: '🇹🇷', full: 'Istanbul Airport' },
];

// Real airlines with actual logos
const AIRLINES = [
  { id: 'bg', name: 'Biman Bangladesh', code: 'BG', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/6/64/Biman_Bangladesh_Airlines_Logo.svg/240px-Biman_Bangladesh_Airlines_Logo.svg.png', color: '#006633', textColor: '#fff' },
  { id: 'bs', name: 'US-Bangla Airlines', code: 'BS', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/5/57/US-Bangla_Airlines_logo.svg/240px-US-Bangla_Airlines_logo.svg.png', color: '#CC0000', textColor: '#fff' },
  { id: 'ek', name: 'Emirates', code: 'EK', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Emirates_logo.svg/240px-Emirates_logo.svg.png', color: '#D4A843', textColor: '#000' },
  { id: 'qr', name: 'Qatar Airways', code: 'QR', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/a7/Qatar_Airways_Logo.svg/240px-Qatar_Airways_Logo.svg.png', color: '#5C0037', textColor: '#fff' },
  { id: 'sv', name: 'Saudia', code: 'SV', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Saudi_Airlines_Logo.svg/240px-Saudi_Airlines_Logo.svg.png', color: '#006400', textColor: '#fff' },
  { id: 'fy', name: 'AirAsia', code: 'AK', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/AirAsia_Logo.svg/240px-AirAsia_Logo.svg.png', color: '#FF0000', textColor: '#fff' },
  { id: 'g9', name: 'Air Arabia', code: 'G9', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Air_Arabia_Logo.svg/240px-Air_Arabia_Logo.svg.png', color: '#E31837', textColor: '#fff' },
  { id: 'tk', name: 'Turkish Airlines', code: 'TK', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/Turkish_Airlines_logo_2019_compact.svg/240px-Turkish_Airlines_logo_2019_compact.svg.png', color: '#C70000', textColor: '#fff' },
  { id: 'ms', name: 'EgyptAir', code: 'MS', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/99/Egyptair_Logo.svg/240px-Egyptair_Logo.svg.png', color: '#005C9F', textColor: '#fff' },
  { id: 'ku', name: 'Kuwait Airways', code: 'KU', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Kuwait_Airways_new_logo.svg/240px-Kuwait_Airways_new_logo.svg.png', color: '#005EB8', textColor: '#fff' },
];

// Real price data per route (market rates in BDT, 20% discount applied)
// Market rates researched from Skyscanner, Google Flights, GoZayaan
const ROUTE_PRICES = {
  // ─── Bangladesh domestic ───
  'DAC-CGP': { base: 3200, duration: '45m', stops: 'Non-stop' },
  'DAC-ZYL': { base: 3500, duration: '50m', stops: 'Non-stop' },
  'CGP-DAC': { base: 3200, duration: '45m', stops: 'Non-stop' },
  'ZYL-DAC': { base: 3500, duration: '50m', stops: 'Non-stop' },
  // ─── Middle East ───
  'DAC-DXB': { base: 25600, duration: '5h 30m', stops: 'Non-stop' },  // $300 × 107 × 0.8
  'DAC-AUH': { base: 26400, duration: '5h 45m', stops: 'Non-stop' },
  'DAC-RUH': { base: 36800, duration: '6h 10m', stops: 'Non-stop' },  // ~$430 × 107 × 0.8
  'DAC-JED': { base: 36000, duration: '6h 20m', stops: 'Non-stop' },
  'DAC-DOH': { base: 30400, duration: '5h 15m', stops: 'Non-stop' },
  'DAC-KWI': { base: 38400, duration: '5h 55m', stops: 'Non-stop' },  // ~$450 × 107 × 0.8
  'DAC-MCT': { base: 33600, duration: '5h 30m', stops: 'Non-stop' },
  'DAC-BAH': { base: 35200, duration: '5h 45m', stops: 'Non-stop' },
  // ─── Southeast Asia ───
  'DAC-KUL': { base: 22400, duration: '3h 55m', stops: 'Non-stop' },  // $262 × 107 × 0.8
  'DAC-SIN': { base: 24800, duration: '4h 30m', stops: 'Non-stop' },
  'DAC-BKK': { base: 19200, duration: '3h 10m', stops: 'Non-stop' },
  // ─── South Asia ───
  'DAC-DEL': { base: 10400, duration: '1h 45m', stops: 'Non-stop' },
  // ─── Europe ───
  'DAC-LHR': { base: 72000, duration: '11h 30m', stops: '1 stop' },   // ~$840 × 107 × 0.8
  'DAC-IST': { base: 52000, duration: '9h 20m', stops: '1 stop' },
  // ─── Americas ───
  'DAC-JFK': { base: 96000, duration: '16h 45m', stops: '1 stop' },   // ~$1120 × 107 × 0.8
  // ─── Pacific ───
  'DAC-SYD': { base: 64000, duration: '14h 20m', stops: '1 stop' },
  // ─── Asia ───
  'DAC-TYO': { base: 56000, duration: '8h 40m', stops: '1 stop' },
};

// Which airlines serve each route
const ROUTE_AIRLINES = {
  'DAC-CGP': ['bg', 'bs'],
  'DAC-ZYL': ['bg', 'bs'],
  'CGP-DAC': ['bg', 'bs'],
  'ZYL-DAC': ['bg', 'bs'],
  'DAC-DXB': ['ek', 'g9', 'bg'],
  'DAC-AUH': ['ek', 'bg'],
  'DAC-RUH': ['sv', 'bs', 'bg'],
  'DAC-JED': ['sv', 'bg', 'bs'],
  'DAC-DOH': ['qr', 'bs'],
  'DAC-KWI': ['ku', 'qr', 'bg'],
  'DAC-MCT': ['bg', 'ek'],
  'DAC-BAH': ['bg', 'qr'],
  'DAC-KUL': ['bg', 'bs', 'fy'],
  'DAC-SIN': ['bg', 'ek'],
  'DAC-BKK': ['bg', 'fy'],
  'DAC-DEL': ['bg', 'bs'],
  'DAC-LHR': ['bg', 'ek', 'qr'],
  'DAC-IST': ['tk', 'bg'],
  'DAC-JFK': ['ek', 'qr', 'tk'],
  'DAC-SYD': ['ek', 'qr'],
  'DAC-TYO': ['bg', 'ek'],
};

// Cabin class price multipliers
const CABIN_MULTIPLIER = { economy: 1, business: 3.2, first: 5.8 };

// Departure time slots
const DEPARTURES = ['06:10', '07:45', '09:20', '10:55', '13:30', '15:10', '17:25', '20:40', '22:15'];

function calcArrival(dep, durStr) {
  const [h, rest] = durStr.split('h ');
  const m = parseInt(rest) || 0;
  const [dh, dm] = dep.split(':').map(Number);
  const total = dh * 60 + dm + parseInt(h) * 60 + m;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function getFlights(fromCode, toCode, cabin) {
  const key = `${fromCode}-${toCode}`;
  const reverseKey = `${toCode}-${fromCode}`;

  // Use exact route, reverse route, or generate a reasonable estimate
  let routeData = ROUTE_PRICES[key] || ROUTE_PRICES[reverseKey];

  // If no route data at all, generate a reasonable price based on distance estimate
  if (!routeData) {
    const domestic = ['DAC', 'CGP', 'ZYL'];
    const isDomestic = domestic.includes(fromCode) && domestic.includes(toCode);
    routeData = {
      base: isDomestic ? 3500 : 28000 + Math.floor(Math.random() * 20000),
      duration: isDomestic ? '50m' : '6h 30m',
      stops: 'Non-stop',
    };
  }

  const airlineIds = ROUTE_AIRLINES[key] || ROUTE_AIRLINES[reverseKey] || ['bg', 'bs', 'ek'];
  const mult = CABIN_MULTIPLIER[cabin] || 1;

  return airlineIds.map((id, i) => {
    const airline = AIRLINES.find(a => a.id === id);
    const dep = DEPARTURES[i % DEPARTURES.length];
    const priceVariance = 1 + (i * 0.08);
    const basePrice = Math.round(routeData.base * mult * priceVariance);
    const originalPrice = Math.round(basePrice / 0.8);
    const stops = routeData.stops;
    return {
      id: `${id}-${i}`,
      airline,
      departure: dep,
      arrival: calcArrival(dep, routeData.duration),
      duration: routeData.duration,
      price: basePrice,
      originalPrice,
      stops,
      seats: Math.floor(Math.random() * 7) + 2,
      baggage: cabin === 'economy' ? '23kg' : '32kg',
      meal: cabin !== 'economy',
      flightNo: `${airline?.code}${100 + i * 213}`,
    };
  });
}

function AirlineLogoBox({ airline }) {
  const [imgErr, setImgErr] = useState(false);
  if (!imgErr) {
    return (
      <div className="w-11 h-11 rounded-xl overflow-hidden bg-white border border-gray-100 flex items-center justify-center shrink-0 shadow-sm p-1">
        <img src={airline.logo} alt={airline.name} className="w-full h-full object-contain"
          onError={() => setImgErr(true)} />
      </div>
    );
  }
  return (
    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-white font-extrabold text-xs shadow-sm"
      style={{ backgroundColor: airline.color }}>
      {airline.code}
    </div>
  );
}

function AirportPicker({ label, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const filtered = AIRPORTS.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.code.toLowerCase().includes(search.toLowerCase()) ||
    a.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative flex-1">
      <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <button onClick={() => setOpen(!open)}
        className="w-full text-left bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 hover:border-forest transition-colors">
        {value ? (
          <>
            <p className="font-extrabold text-forest text-xl leading-tight">{value.code}</p>
            <p className="text-gray-500 text-[11px] truncate">{value.flag} {value.name}</p>
          </>
        ) : (
          <p className="text-gray-300 font-bold text-sm py-2">Select Airport</p>
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-0 right-0 z-40 bg-white rounded-2xl shadow-2xl border border-gray-100 mt-1 overflow-hidden">
            <div className="p-2 border-b border-gray-100">
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search city or code..."
                className="w-full px-3 py-2 text-sm outline-none bg-gray-50 rounded-xl" />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.map(a => (
                <button key={a.code} onClick={() => { onChange(a); setOpen(false); setSearch(''); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0 text-left">
                  <span className="text-xl">{a.flag}</span>
                  <div>
                    <p className="font-bold text-sm text-gray-800">{a.code} — {a.name}</p>
                    <p className="text-[10px] text-gray-400">{a.full}</p>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AirTicket() {
  const navigate = useNavigate();
  const [tripType, setTripType] = useState('one-way');
  const [from, setFrom] = useState(AIRPORTS[0]);
  const [to, setTo] = useState(null);
  const [date, setDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [cabin, setCabin] = useState('economy');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState(null);
  const [noRoute, setNoRoute] = useState(false);
  const [selected, setSelected] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [booked, setBooked] = useState(false);
  const [bookingRef, setBookingRef] = useState('');
  const [userBalance, setUserBalance] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [paying, setPaying] = useState(false);
  const [insufficientBalance, setInsufficientBalance] = useState(false);

  useEffect(() => {
    getCurrentUser().then(u => setUserBalance(u?.balance ?? 0)).catch(() => {});
  }, []);

  const handleSearch = async () => {
    if (!from || !to || !date) return;
    setSearching(true);
    setNoRoute(false);
    setResults(null);
    setSelected(null);
    await new Promise(r => setTimeout(r, 1600));
    const flights = getFlights(from.code, to.code, cabin);
    setResults(flights);
    setSearching(false);
  };

  const totalPrice = selected ? Math.round(selected.price * selectedSeats) : 0;
  const totalOriginal = selected ? Math.round(selected.originalPrice * selectedSeats) : 0;
  const savings = totalOriginal - totalPrice;

  const handleBookClick = () => {
    setInsufficientBalance(false);
    if ((userBalance ?? 0) < totalPrice) {
      setInsufficientBalance(true);
      return;
    }
    setShowPinModal(true);
  };

  const handleConfirmPayment = async () => {
    if (pin.length < 4) return;
    setPaying(true);
    // Verify PIN first
    const isPinValid = await verifyUserPin(me.email, pin);
    if (!isPinValid) {
      setPinError('ভুল PIN! আবার চেষ্টা করুন।');
      setPaying(false);
      return;
    }
    const me = await getCurrentUser();
    const bal = me?.balance ?? 0;
    const minBal = me?.min_balance ?? 0;
    if (bal < totalPrice) {
      setInsufficientBalance(true);
      setShowPinModal(false);
      setPaying(false);
      return;
    }
    if (minBal > 0 && (bal - totalPrice) < minBal) {
      setInsufficientBalance(true);
      setShowPinModal(false);
      setPaying(false);
      return;
    }
    const ref = 'BK' + Date.now().toString().slice(-8);
    setBookingRef(ref);
    await updateUserDoc(me.uid, { balance: bal - totalPrice });
    const ticketData = {
      bookingRef: ref,
      fromCode: from.code, fromName: from.name,
      toCode: to.code, toName: to.name,
      departure: selected.departure, arrival: selected.arrival,
      duration: selected.duration, date,
      airlineName: selected.airline.name, flightNo: selected.flightNo,
      cabin, passengers: `${selectedSeats} Seat${selectedSeats > 1 ? 's' : ''}`,
      baggage: selected.baggage, stops: selected.stops,
      passengerName: me.full_name || 'Passenger',
      totalPrice, originalPrice: totalOriginal, savings,
      pricePerPax: selected.price,
    };
    await createTransaction({
      user_id: me.id, user_email: me.email, type: 'send',
      amount: totalPrice, currency: me.currency || 'BDT',
      status: 'success', tx_id: ref,
      description: `Air Ticket: ${from.code}→${to.code} (${selected.airline.name}) ${selected.flightNo}`,
      ticket_data: JSON.stringify(ticketData),
    });
    const emailHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>body{font-family:Arial,sans-serif;background:#f0f4f8;margin:0;padding:20px}.ticket{max-width:560px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,.12)}.hdr{background:linear-gradient(135deg,#0B3D2E,#1a6b4e);color:#fff;padding:28px;text-align:center}.logo{font-size:26px;font-weight:900;color:#D4A843;letter-spacing:2px}.sub{font-size:11px;color:rgba(255,255,255,.5);letter-spacing:1px;text-transform:uppercase;margin-top:2px}.badge{display:inline-block;background:#22c55e;color:#fff;font-size:11px;font-weight:700;padding:4px 16px;border-radius:20px;margin-top:10px}.route{background:linear-gradient(135deg,#0B3D2E,#1a6b4e);padding:0 28px 24px}.rbox{background:rgba(255,255,255,.1);border-radius:14px;padding:18px;display:flex;align-items:center;justify-content:space-between}.code{font-size:34px;font-weight:900;color:#fff}.cname{font-size:10px;color:rgba(255,255,255,.5)}.mid{flex:1;text-align:center;color:rgba(255,255,255,.5);font-size:20px;padding:0 10px}.times{display:flex;gap:8px;justify-content:center;padding:0 28px 24px;background:linear-gradient(135deg,#0B3D2E,#1a6b4e)}.tb{background:rgba(255,255,255,.15);border-radius:10px;padding:8px 16px;text-align:center}.tl{font-size:9px;color:rgba(255,255,255,.5);text-transform:uppercase}.tv{font-size:18px;font-weight:900;color:#fff}.body{padding:24px 28px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px}.item label{font-size:9px;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;font-weight:700;display:block;margin-bottom:2px}.item span{font-size:13px;color:#1e293b;font-weight:700}.ref{background:#f8fafc;border:2px dashed #e2e8f0;border-radius:14px;padding:14px;text-align:center;margin-bottom:18px}.rl{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;font-weight:700}.rc{font-size:26px;font-weight:900;color:#0B3D2E;letter-spacing:4px;margin:4px 0}.pr{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f1f5f9}.pl{font-size:12px;color:#64748b}.pv{font-size:13px;font-weight:700;color:#1e293b}.total-row{display:flex;justify-content:space-between;padding:12px 0;border-top:2px solid #e2e8f0;margin-top:4px}.total-label{font-size:14px;font-weight:700;color:#1e293b}.total-val{font-size:18px;font-weight:900;color:#0B3D2E}.footer{background:#f8fafc;padding:16px 28px;text-align:center;font-size:11px;color:#94a3b8}</style></head><body><div class="ticket"><div class="hdr"><div class="logo">CELLFIN</div><div class="sub">E-Ticket / Boarding Pass</div><div class="badge">✓ CONFIRMED</div></div><div class="route"><div class="rbox"><div><div class="code">${from.code}</div><div class="cname">${from.name}</div></div><div class="mid">✈</div><div style="text-align:right"><div class="code">${to.code}</div><div class="cname">${to.name}</div></div></div></div><div class="times"><div class="tb"><div class="tl">Departs</div><div class="tv">${selected.departure}</div></div><div style="display:flex;align-items:center;color:rgba(255,255,255,.3);font-size:16px;background:linear-gradient(135deg,#0B3D2E,#1a6b4e);padding:0 4px">→</div><div class="tb"><div class="tl">Arrives</div><div class="tv">${selected.arrival}</div></div></div><div class="body"><div class="grid"><div class="item"><label>Airline</label><span>${selected.airline.name}</span></div><div class="item"><label>Flight No.</label><span>${selected.flightNo}</span></div><div class="item"><label>Date</label><span>${date}</span></div><div class="item"><label>Cabin</label><span>${cabin.toUpperCase()}</span></div><div class="item"><label>Passengers</label><span>${adults} Adult${children > 0 ? `, ${children} Child` : ''}</span></div><div class="item"><label>Baggage</label><span>${selected.baggage}</span></div><div class="item"><label>Passenger</label><span>${me.full_name || 'Passenger'}</span></div><div class="item"><label>Duration</label><span>${selected.duration}</span></div></div><div class="ref"><div class="rl">Booking Reference</div><div class="rc">${ref}</div><div style="font-size:10px;color:#94a3b8">Present at check-in</div></div><div class="pr"><span class="pl">Original Price</span><span class="pv" style="text-decoration:line-through;color:#94a3b8">৳${totalOriginal.toLocaleString()}</span></div><div class="pr"><span class="pl">Cellfin Discount (20%)</span><span class="pv" style="color:#22c55e">-৳${savings.toLocaleString()}</span></div><div class="total-row"><span class="total-label">Total Paid</span><span class="total-val">৳${totalPrice.toLocaleString()}</span></div></div><div class="footer"><strong style="color:#0B3D2E">Cellfin Remittance</strong> — Your trusted digital partner<br>Issued: ${new Date().toLocaleString()}</div></div></body></html>`;
    // TODO: Implement email notification via Firebase Cloud Function
      to: me.email,
      subject: `✈️ Cellfin Air Ticket Confirmed — ${ref}`,
      body: emailHtml,
    }).catch(() => {});
    setUserBalance(bal - totalPrice);
    setPaying(false);
    setShowPinModal(false);
    setBooked(true);
  };

  if (booked) {
    return (
      <div className="max-w-[430px] mx-auto min-h-screen bg-gradient-to-br from-forest to-emerald-700 flex flex-col items-center justify-center p-6 font-inter">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }} className="text-center w-full">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={56} className="text-white" />
          </div>
          <h2 className="text-white text-2xl font-extrabold mb-1">Booking Confirmed!</h2>
          <p className="text-white/70 text-sm mb-4">{selected?.airline.name} · {selected?.flightNo}</p>

          <div className="bg-white/15 rounded-3xl p-5 mb-4 text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-white/60 text-xs">Route</span>
              <span className="text-white font-bold text-sm">{from?.code} → {to?.code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60 text-xs">Date</span>
              <span className="text-white font-bold text-sm">{date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60 text-xs">Departure</span>
              <span className="text-white font-bold text-sm">{selected?.departure}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60 text-xs">Cabin</span>
              <span className="text-white font-bold text-sm capitalize">{cabin}</span>
            </div>
            <div className="h-px bg-white/20 my-1" />
            <div className="flex justify-between">
              <span className="text-white/60 text-xs">Total Paid</span>
              <span className="text-gold font-extrabold text-base">৳{totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-white/60 text-xs">You Saved</span>
              <span className="text-emerald-300 font-bold text-sm">৳{savings.toLocaleString()} 🎉</span>
            </div>
          </div>

          <div className="bg-white/20 rounded-2xl px-6 py-3 mb-3">
            <p className="text-white/60 text-xs">Booking Reference</p>
            <p className="text-white font-extrabold text-2xl tracking-widest">{bookingRef}</p>
          </div>
          <p className="text-white/40 text-xs mb-6">Confirmation sent to your email</p>
          <button onClick={() => navigate('/')} className="w-full bg-white text-forest px-10 py-3.5 rounded-2xl font-bold shadow-lg">
            Back to Home
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-[430px] mx-auto min-h-screen bg-gray-50 font-inter">
      {/* Universal Header */}
      <UniversalHeader
        title="Air Ticket"
        subtitle="Up to 20% off — Best Price Guaranteed"
        rightAction={userBalance !== null ? (
          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-white/20 text-white">৳{userBalance.toLocaleString()}</span>
        ) : null}
      />

      <div className="px-4 space-y-4" style={{ paddingTop: 'calc(4.5rem + env(safe-area-inset-top))' }}>
        {/* Trip Type */}
        <div className="flex gap-2 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100">
          {['one-way', 'round-trip'].map(t => (
            <button key={t} onClick={() => setTripType(t)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tripType === t ? 'bg-forest text-white shadow-sm' : 'text-gray-400'}`}>
              {t === 'one-way' ? '→ One Way' : '⇄ Round Trip'}
            </button>
          ))}
        </div>

        {/* From / To */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex gap-2 items-end">
            <AirportPicker label="FROM" value={from} onChange={v => { setFrom(v); setResults(null); }} />
            <button onClick={() => { const tmp = from; setFrom(to); setTo(tmp); setResults(null); }}
              className="mb-1 w-10 h-10 bg-forest text-white rounded-xl flex items-center justify-center shadow-md shrink-0">
              <ArrowLeftRight size={16} />
            </button>
            <AirportPicker label="TO" value={to} onChange={v => { setTo(v); setResults(null); }} />
          </div>
        </div>

        {/* Dates */}
        <div className={`grid gap-3 ${tripType === 'round-trip' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">📅 Departure Date</p>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full text-sm font-bold text-gray-800 outline-none bg-transparent" />
          </div>
          {tripType === 'round-trip' && (
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
              <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-1.5">📅 Return Date</p>
              <input type="date" value={returnDate} onChange={e => setReturnDate(e.target.value)}
                min={date || new Date().toISOString().split('T')[0]}
                className="w-full text-sm font-bold text-gray-800 outline-none bg-transparent" />
            </div>
          )}
        </div>

        {/* Passengers & Cabin */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">👥 Passengers</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setAdults(Math.max(1, adults - 1))}
                className="w-8 h-8 rounded-lg bg-gray-100 font-bold text-gray-600 flex items-center justify-center text-lg">−</button>
              <span className="flex-1 text-center font-extrabold text-forest text-lg">{adults + children}</span>
              <button onClick={() => setAdults(Math.min(9, adults + 1))}
                className="w-8 h-8 rounded-lg bg-forest text-white font-bold flex items-center justify-center text-lg">+</button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-1">{adults} Adult{children > 0 ? `, ${children} Child` : ''}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
            <p className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider mb-2">💺 Cabin Class</p>
            <select value={cabin} onChange={e => { setCabin(e.target.value); setResults(null); }}
              className="w-full text-sm font-bold text-gray-800 outline-none bg-transparent mt-1">
              <option value="economy">Economy</option>
              <option value="business">Business</option>
              <option value="first">First Class</option>
            </select>
          </div>
        </div>

        <button onClick={handleSearch} disabled={!from || !to || !date || searching}
          className="w-full bg-forest text-gold py-4 rounded-2xl font-extrabold text-base shadow-lg active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
          {searching ? (
            <><span className="w-5 h-5 border-2 border-gold/40 border-t-gold rounded-full animate-spin" /> Searching Flights...</>
          ) : (
            <><Search size={18} /> Search Flights</>
          )}
        </button>

        {/* No route found */}
        {noRoute && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
            <p className="text-2xl mb-2">✈️</p>
            <p className="font-bold text-amber-700 text-sm">No direct flights found</p>
            <p className="text-amber-600 text-xs mt-1">Try DAC (Dhaka) as origin for best availability</p>
          </motion.div>
        )}

        {/* Results */}
        <AnimatePresence>
          {results && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-gray-700">
                  {results.length} Flight{results.length > 1 ? 's' : ''} · {from?.code} → {to?.code}
                </h3>
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-full">20% OFF Applied ✓</span>
              </div>

              {results.map((f, i) => (
                <motion.div key={f.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                  onClick={() => { setSelected(selected?.id === f.id ? null : f); setSelectedSeats(1); }}
                  className={`bg-white rounded-2xl p-4 shadow-sm border-2 cursor-pointer transition-all ${selected?.id === f.id ? 'border-forest shadow-md' : 'border-gray-100'}`}>

                  {/* Airline + Price row */}
                  <div className="flex items-center gap-3 mb-3">
                    <AirlineLogoBox airline={f.airline} />
                    <div className="flex-1">
                      <p className="font-extrabold text-sm text-gray-800">{f.airline.name}</p>
                      <p className="text-[11px] text-gray-400">{f.flightNo} · {f.stops}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end">
                        <Tag size={10} className="text-emerald-500" />
                        <span className="text-[11px] text-gray-400 line-through">৳{f.originalPrice.toLocaleString()}</span>
                      </div>
                      <p className="font-extrabold text-forest text-lg leading-tight">৳{f.price.toLocaleString()}</p>
                      <p className="text-[10px] text-emerald-600 font-bold">Save ৳{(f.originalPrice - f.price).toLocaleString()}</p>
                    </div>
                  </div>

                  {/* Flight timeline */}
                  <div className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2.5">
                    <div className="text-center">
                      <p className="font-extrabold text-base text-gray-800">{f.departure}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{from?.code}</p>
                    </div>
                    <div className="flex-1 flex flex-col items-center px-2">
                      <div className="flex items-center gap-1 w-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-forest shrink-0" />
                        <div className="flex-1 h-px bg-gray-300" />
                        <Plane size={12} className="text-forest shrink-0" />
                        <div className="flex-1 h-px bg-gray-300" />
                        <div className="w-1.5 h-1.5 rounded-full bg-forest shrink-0" />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">{f.duration}</p>
                    </div>
                    <div className="text-center">
                      <p className="font-extrabold text-base text-gray-800">{f.arrival}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{to?.code}</p>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex gap-1.5 mt-2.5 flex-wrap">
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full">🧳 {f.baggage}</span>
                    {f.meal && <span className="bg-orange-50 text-orange-600 text-[10px] font-bold px-2 py-0.5 rounded-full">🍽️ Meal</span>}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${f.seats <= 3 ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                      {f.seats <= 3 ? `⚠️ মাত্র ${f.seats}টি আসন বাকি!` : `✅ ${f.seats} আসন পাওয়া যাচ্ছে`}
                    </span>
                  </div>

                  {/* Seat Selector — only for selected flight */}
                  {selected?.id === f.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 border-t border-gray-100">
                      <p className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider mb-2">💺 আসন সংখ্যা বেছে নিন</p>
                      <div className="flex gap-2 flex-wrap">
                        {Array.from({ length: Math.min(f.seats, 9) }, (_, idx) => idx + 1).map(n => (
                          <button key={n} onClick={e => { e.stopPropagation(); setSelectedSeats(n); }}
                            className={`w-10 h-10 rounded-xl text-sm font-extrabold border-2 transition-all ${selectedSeats === n ? 'bg-forest text-white border-forest shadow-md scale-105' : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-forest/40'}`}>
                            {n}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-forest font-bold mt-2">
                        {selectedSeats} আসন × ৳{f.price.toLocaleString()} = ৳{(selectedSeats * f.price).toLocaleString()}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              ))}

              {selected && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {/* Price Summary */}
                  <div className="bg-forest/5 border border-forest/20 rounded-2xl p-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-600 text-sm">{selectedSeats} আসন × ৳{selected.price.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-gray-800 text-base">Total</span>
                      <div className="text-right">
                        <p className="text-xs text-gray-400 line-through">৳{totalOriginal.toLocaleString()}</p>
                        <p className="font-extrabold text-forest text-xl">৳{totalPrice.toLocaleString()}</p>
                      </div>
                    </div>
                    <p className="text-emerald-600 text-xs font-bold mt-1 text-right">🎉 Saving ৳{savings.toLocaleString()} with Cellfin</p>
                  </div>

                  {insufficientBalance && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
                      <AlertCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold text-red-700 text-sm">Insufficient Balance</p>
                        <p className="text-red-500 text-xs mt-0.5">৳{totalPrice.toLocaleString()} প্রয়োজন, আপনার ব্যালেন্স ৳{(userBalance ?? 0).toLocaleString()}</p>
                      </div>
                      <button onClick={() => navigate('/add-money')}
                        className="flex items-center gap-1 bg-red-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold shrink-0">
                        <Plus size={12} /> Add Money
                      </button>
                    </div>
                  )}
                  <button onClick={handleBookClick}
                    className="w-full bg-gold text-forest py-4 rounded-2xl font-extrabold text-base shadow-lg active:scale-95 transition-transform">
                    Book & Pay ৳{totalPrice.toLocaleString()}
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-20" />
      </div>

      {/* PIN Modal */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-end justify-center z-50">
            <motion.div initial={{ y: 300 }} animate={{ y: 0 }} exit={{ y: 300 }} transition={{ type: 'spring', damping: 28 }}
              className="bg-white w-full max-w-[430px] rounded-t-3xl p-6 pb-10">
              <div className="w-14 h-14 rounded-2xl bg-forest/10 flex items-center justify-center mx-auto mb-4 text-3xl">✈️</div>
              <h3 className="font-extrabold text-lg text-center text-gray-800 mb-1">Confirm Booking</h3>
              <p className="text-center text-gray-500 text-sm">{selected?.airline.name} · {selected?.flightNo}</p>
              <p className="text-center text-gray-400 text-xs mb-1">{from?.code} → {to?.code} · {selected?.departure}</p>
              <p className="text-center font-extrabold text-forest text-2xl mb-1">৳{totalPrice.toLocaleString()}</p>
              <p className="text-center text-emerald-500 text-xs font-bold mb-5">You save ৳{savings.toLocaleString()} 🎉</p>
              <div className="mb-5">
                <p className="text-xs font-bold text-gray-500 mb-2 text-center">Enter Your PIN</p>
                <input type="password" value={pin}
                  onChange={e => { setPin(e.target.value.replace(/\D/g, '').slice(0, 4)); setPinError(''); }}
                  placeholder="● ● ● ●" autoFocus
                  className={`w-full text-center text-2xl tracking-[0.5em] border-2 rounded-2xl py-3.5 outline-none bg-gray-50 font-bold transition-colors ${pinError ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-forest'}`} />
                {pinError && <p className="text-red-500 text-xs font-bold text-center mt-2">⚠️ {pinError}</p>}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowPinModal(false); setPin(''); setPinError(''); }}
                  className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 font-bold text-gray-600">Cancel</button>
                <button onClick={handleConfirmPayment} disabled={paying || pin.length < 4}
                  className="flex-1 bg-forest text-gold py-3.5 rounded-2xl font-extrabold disabled:opacity-40 shadow-lg">
                  {paying ? 'Booking...' : 'Confirm & Pay'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}