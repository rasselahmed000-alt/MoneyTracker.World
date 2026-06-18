import { memo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, History, User } from 'lucide-react';
import { motion } from 'framer-motion';

const tabs = [
  { path: '/',        icon: Home,    label: 'Home',    activeColor: '#22c55e', activeBg: 'rgba(34,197,94,0.18)'    },
  { path: '/history', icon: History, label: 'History', activeColor: '#f59e0b', activeBg: 'rgba(245,158,11,0.18)'   },
  { path: '/profile', icon: User,    label: 'Profile', activeColor: '#60a5fa', activeBg: 'rgba(96,165,250,0.18)'   },
];

export default memo(function BottomNav() {
  const navigate  = useNavigate();
  const { pathname } = useLocation();
  const lastNavRef = useRef(null);

  const handleNav = (path) => {
    // Debounce: ignore rapid double-taps & same-page taps
    const now = Date.now();
    if (pathname === path) return;
    if (lastNavRef.current && now - lastNavRef.current < 400) return;
    lastNavRef.current = now;
    navigate(path);
  };

  return (
    <div className="px-3 pb-2 pt-1.5">
      <nav
        className="flex justify-around items-center px-2 py-2.5 rounded-2xl"
        style={{
          background:     'linear-gradient(135deg, rgba(11,61,30,0.97) 0%, rgba(15,77,38,0.97) 100%)',
          boxShadow:      '0 -4px 24px rgba(0,0,0,0.22), 0 8px 32px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.08)',
          border:         '1px solid rgba(255,255,255,0.10)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {tabs.map(tab => {
          const active = pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => handleNav(tab.path)}
              className="relative flex flex-col items-center gap-0.5 px-6 py-2 rounded-xl transition-all"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {active && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: tab.activeBg }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.3 }}
                />
              )}
              <div className="relative z-10">
                <tab.icon
                  size={20}
                  strokeWidth={active ? 2.5 : 1.8}
                  color={active ? tab.activeColor : 'rgba(255,255,255,0.40)'}
                />
              </div>
              <span
                className="text-[10px] font-bold relative z-10 whitespace-nowrap tracking-wide"
                style={{ color: active ? tab.activeColor : 'rgba(255,255,255,0.35)' }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
});