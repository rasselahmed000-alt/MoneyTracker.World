import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// 2000 unique English names (Bangladeshi expats)
const FIRST_NAMES = [
  'Rakibul','Shariful','Arif','Saiful','Rafiqul','Jahangir','Nurul','Belal','Tajuddin','Shahidul',
  'Habibur','Kamruzzaman','Faruk','Abul','Selim','Rahimul','Moniruzzaman','Nazrul','Aminul','Zakir',
  'Rezaul','Badrul','Alamgir','Shamsul','Nasirul','Mahbubur','Riazul','Tariqul','Imran','Ziaur',
  'Mostafizur','Ashikur','Shafiqul','Touhidul','Anisur','Mizanur','Obaidul','Azizul','Shafiul','Hafizur',
  'Delowar','Iqbal','Jaliluir','Khaliluir','Nizamul','Parvez','Rashidul','Salahuddin','Tahurul','Ujjal',
  'Abdul','Mohammad','Md.','Mahmud','Ahmed','Hasan','Hossain','Alam','Islam','Rahman',
  'Karim','Rahim','Kabir','Jabbar','Gafur','Latif','Motiur','Nasim','Wahid','Palash',
  'Kawsar','Naim','Sabbir','Tanvir','Rafi','Shaheen','Babul','Mukul','Tipu','Sumon',
  'Rony','Raju','Sohel','Milon','Rubel','Jewel','Noman','Arman','Sagar','Tushar',
  'Bipul','Russel','Shaon','Masum','Sourav','Dipu','Topu','Rahul','Subho','Mahi',
  'Liton','Sajib','Piyal','Bijoy','Mithu','Ratan','Shopan','Himel','Dulal','Bachchu',
  'Mannan','Jaman','Helal','Shakil','Nahid','Omar','Faisal','Salman','Adnan','Siraj',
  'Alauddin','Nafis','Jishan','Tamim','Sunny','Sujan','Nayan','Kajal','Rajib','Abhi',
  'Sanaul','Tofazzal','Morshid','Bahar','Akash','Borshon','Prant','Ornob','Shanto','Tanzim',
  'Nahiyan','Yasin','Sadman','Mahfuz','Rayhan','Shahriyar','Ridwan','Sadiq','Wasim','Nawaz',
  'Hamid','Jamil','Kamal','Jamal','Badal','Shahed','Farhan','Nabil','Zubair','Usman',
  'Tariq','Bilal','Khalid','Yusuf','Ibrahim','Ismail','Idris','Musa','Isa','Yahya',
  'Dawud','Sulaiman','Harun','Yunus','Ayub','Ilyas','Zakaria','Yahia','Shuaib','Saleh',
  'Taha','Yasin','Wasil','Nuh','Lut','Hud','Shu','Dhul','Kif','Idrees',
  'Jasim','Kasem','Osman','Hannan','Nuru','Siru','Miru','Biru','Tiru','Chiru',
  'Limon','Simon','Dimon','Timon','Fimon','Gimon','Himon','Jimon','Kimon','Mimon',
  'Pintu','Mintu','Tintu','Rintu','Bintu','Dintu','Fintu','Gintu','Hintu','Jintu',
  'Sazu','Razu','Tazu','Bazu','Dazu','Fazu','Gazu','Hazu','Jazu','Kazu',
  'Emon','Jemon','Demon','Femon','Gemon','Hemon','Iemon','Kemon','Lemon','Memon',
  'Babu','Dabu','Fabu','Gabu','Habu','Jabu','Kabu','Labu','Mabu','Nabu',
  // Female names
  'Nusrat','Maliha','Sumaiya','Fatema','Halima','Rashida','Maryam','Taslima','Nasreen','Parvin',
  'Rima','Rima','Shima','Tima','Bima','Dima','Fima','Gima','Hima','Jima',
  'Nipa','Mipa','Tipa','Ripa','Bipa','Dipa','Fipa','Gipa','Hipa','Jipa',
  'Liza','Miza','Tiza','Riza','Biza','Diza','Fiza','Giza','Hiza','Jiza',
  'Mitu','Ritu','Bitu','Ditu','Fitu','Gitu','Hitu','Jitu','Kitu','Litu',
  'Poly','Moly','Toly','Roly','Boly','Doly','Foly','Goly','Holy','Joly',
  'Piya','Miya','Tiya','Riya','Biya','Diya','Fiya','Giya','Hiya','Jiya',
  'Sumi','Rumi','Bumi','Dumi','Fumi','Gumi','Humi','Jumi','Kumi','Lumi',
  'Tania','Rania','Bania','Dania','Fania','Gania','Hania','Jania','Kania','Lania',
  'Mona','Rona','Bona','Dona','Fona','Gona','Hona','Jona','Kona','Lona',
  'Shila','Mila','Tila','Rila','Bila','Dila','Fila','Gila','Hila','Jila',
  'Kotha','Motha','Totha','Rotha','Botha','Dotha','Fotha','Gotha','Hotha','Jotha',
  'Nila','Aila','Baila','Caila','Daila','Faila','Gaila','Haila','Jaila','Kaila',
  'Sonia','Monia','Tonia','Ronia','Bonia','Donia','Fonia','Gonia','Honia','Jonia',
  'Prity','Mrity','Trity','Rrity','Brity','Drity','Frity','Grity','Hrity','Jrity',
];

const LAST_NAMES = [
  'Hasan','Hossain','Islam','Alam','Rahman','Uddin','Ahmed','Miah','Khan','Sheikh',
  'Molla','Sarkar','Biswas','Mondol','Ghosh','Das','Pal','Roy','Chowdhury','Talukdar',
  'Matubbar','Hawladar','Gazi','Sikdar','Fakir','Dewan','Majumdar','Nandi','Saha','Barman',
  'Kader','Goni','Razzak','Siddiq','Faruq','Hakim','Jabbar','Latif','Majid','Naser',
  'Ali','Bari','Chari','Dari','Fari','Gari','Hari','Jari','Kari','Lari',
  'Bhuiyan','Patwari','Akand','Bepari','Dalal','Faqir','Gramin','Hakim','Imam','Jalal',
  'Sultan','Badsha','Raja','Samrat','Bahar','Megh','Jhor','Taranga','Nodi','Pahad',
  'Surya','Bayu','Alo','Chhaya','Phul','Pakhi','Bon','Math','Sonar','Rupar',
  'Tama','Loha','Manik','Kanchan','Zahir','Bashir','Nasir','Qadir','Rasul','Wadud',
  'Zaman','Amin','Karim','Rashid','Hamid','Jalil','Khalil','Nizam','Pervez','Rashid',
];

const COUNTRIES = [
  { country: 'Saudi Arabia', flag: '🇸🇦', currency: 'SAR', rate: 29.5, amounts: [150, 200, 300, 500, 750, 1000] },
  { country: 'Malaysia', flag: '🇲🇾', currency: 'MYR', rate: 24.2, amounts: [100, 150, 200, 300, 500] },
  { country: 'UAE', flag: '🇦🇪', currency: 'AED', rate: 30.1, amounts: [100, 150, 200, 300, 500, 800] },
  { country: 'Qatar', flag: '🇶🇦', currency: 'QAR', rate: 30.3, amounts: [100, 200, 300, 400, 600] },
  { country: 'Kuwait', flag: '🇰🇼', currency: 'KWD', rate: 360, amounts: [20, 30, 50, 75, 100] },
  { country: 'Oman', flag: '🇴🇲', currency: 'OMR', rate: 288, amounts: [30, 50, 75, 100, 150] },
  { country: 'Bahrain', flag: '🇧🇭', currency: 'BHD', rate: 293, amounts: [20, 30, 50, 75, 100] },
  { country: 'UK', flag: '🇬🇧', currency: 'GBP', rate: 140, amounts: [50, 100, 150, 200] },
  { country: 'USA', flag: '🇺🇸', currency: 'USD', rate: 110, amounts: [50, 100, 200, 300] },
  { country: 'Singapore', flag: '🇸🇬', currency: 'SGD', rate: 82, amounts: [50, 100, 150, 200] },
  { country: 'Italy', flag: '🇮🇹', currency: 'EUR', rate: 120, amounts: [50, 100, 150] },
  { country: 'Australia', flag: '🇦🇺', currency: 'AUD', rate: 72, amounts: [50, 100, 150, 200] },
];

const ACTIONS = [
   { type: 'bKash', logo: 'https://media.base44.com/images/public/69fdabac102db66d741fa29f/363909b92_images18.jpeg', color: 'text-pink-600', bg: 'bg-pink-50' },
   { type: 'Nagad', logo: 'https://media.base44.com/images/public/69fdabac102db66d741fa29f/95658fabe_images25.png', color: 'text-orange-500', bg: 'bg-orange-50' },
   { type: 'Rocket', logo: 'https://media.base44.com/images/public/69fdabac102db66d741fa29f/f48b1b6ca_unnamed5.png', color: 'text-purple-600', bg: 'bg-purple-50' },
   { type: 'Bank Transfer', logo: null, icon: '🏦', color: 'text-indigo-600', bg: 'bg-indigo-50' },
   { type: 'Intl Transfer', logo: null, icon: '🌍', color: 'text-teal-600', bg: 'bg-teal-50' },
   { type: 'Air Ticket', logo: null, icon: '✈️', color: 'text-sky-600', bg: 'bg-sky-50' },
   { type: 'Visa Apply', logo: null, icon: '📋', color: 'text-amber-600', bg: 'bg-amber-50' },
];

// Generate names lazily — only 500 to keep it lightweight
let ALL_NAMES = null;
function getNames() {
  if (ALL_NAMES) return ALL_NAMES;
  const names = [];
  for (let li = 0; li < LAST_NAMES.length && names.length < 500; li++) {
    for (let fi = 0; fi < FIRST_NAMES.length && names.length < 500; fi++) {
      names.push(`${FIRST_NAMES[fi]} ${LAST_NAMES[li]}`);
    }
  }
  ALL_NAMES = names;
  return ALL_NAMES;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickActivity(name) {
  const countryData = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
  const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  const amount = countryData.amounts[Math.floor(Math.random() * countryData.amounts.length)];
  return {
    name, countryData, action, amount,
    bdtAmount: Math.round(amount * countryData.rate),
    id: Date.now() + Math.random(),
  };
}

function LogoBox({ action }) {
  const [imgErr, setImgErr] = useState(false);
  if (action.logo && !imgErr) {
    return (
      <div className={`w-7 h-7 rounded-lg overflow-hidden ${action.bg} flex items-center justify-center shrink-0 border border-gray-100`}>
        <img src={action.logo} alt={action.type} className="w-full h-full object-contain"
          onError={() => setImgErr(true)} />
      </div>
    );
  }
  return (
    <div className={`w-7 h-7 rounded-lg ${action.bg} flex items-center justify-center shrink-0 text-sm`}>
      {action.icon || '💳'}
    </div>
  );
}

export default function LiveActivityTicker() {
  const shuffledNamesRef = useRef(null);
  const idxRef = useRef(0);

  const getNext = () => {
    const names = getNames();
    if (!shuffledNamesRef.current) shuffledNamesRef.current = shuffle(names);
    if (idxRef.current >= shuffledNamesRef.current.length) {
      shuffledNamesRef.current = shuffle(names);
      idxRef.current = 0;
    }
    const name = shuffledNamesRef.current[idxRef.current++];
    return pickActivity(name);
  };

  const [items, setItems] = useState(() => [getNext()]);

  useEffect(() => {
    // Continuous: every 2s–5s randomly
    const tick = () => {
      const delay = 2000 + Math.random() * 3000;
      return setTimeout(() => {
        setItems([getNext()]);
        timerRef.current = tick();
      }, delay);
    };
    const timerRef = { current: tick() };
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    // Fixed height prevents layout shift when content swaps
    <div className="px-3 py-3" style={{ height: 62, overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        {items.map((act) => (
          <motion.div
            key={act.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-center gap-3"
          >
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-lg shrink-0 shadow-sm">
                {act.countryData.flag}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[12px] text-foreground truncate">{act.name}</p>
                <p className="text-[11px] text-muted-foreground">{act.countryData.country}</p>
              </div>
              <div className="flex flex-col items-end gap-0.5 shrink-0">
                <div className="flex items-center gap-1.5">
                  <LogoBox action={act.action} />
                  <p className={`font-black text-[11px] ${act.action.color}`}>{act.action.type}</p>
                </div>
                <p className="text-[11px] font-bold text-forest">৳{act.bdtAmount.toLocaleString()}</p>
              </div>
            </motion.div>
            ))}
            </AnimatePresence>
            </div>
            );
}