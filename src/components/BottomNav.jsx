import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutGrid, Scan, User } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-white border-t border-gray-100 px-8 py-4 flex justify-around items-center rounded-t-[2rem] shadow-[0_-8px_30px_rgba(0,0,0,0.08)] z-50">
      <button
        onClick={() => navigate('/')}
        className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/' ? 'text-forest' : 'text-gray-400'}`}
      >
        <LayoutGrid size={22} />
        <span className="text-[10px] font-semibold">Home</span>
      </button>

      <button
        onClick={() => navigate('/add-money')}
        className="bg-forest text-gold p-4 rounded-full -mt-10 border-[5px] border-background shadow-xl active:scale-95 transition-transform"
      >
        <Scan size={26} />
      </button>

      <button
        onClick={() => navigate('/profile')}
        className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === '/profile' ? 'text-forest' : 'text-gray-400'}`}
      >
        <User size={22} />
        <span className="text-[10px] font-semibold">Profile</span>
      </button>
    </nav>
  );
}