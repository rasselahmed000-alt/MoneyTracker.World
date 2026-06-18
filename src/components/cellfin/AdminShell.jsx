import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, ArrowUpDown, Wallet, Globe, DollarSign,
  Image, LogOut, Building2, MessageSquare, Plane, FileText,
  ChevronLeft, ChevronRight, Menu, X, Bell, Settings
} from 'lucide-react';
import { base44 } from '@/api/base44Client';

const NAV_SECTIONS = [
  {
    label: 'Overview',
    items: [
      { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    ]
  },
  {
    label: 'Users & Finance',
    items: [
      { path: '/admin/users', icon: Users, label: 'Users' },
      { path: '/admin/transactions', icon: ArrowUpDown, label: 'Transactions' },
      { path: '/admin/wallet-requests', icon: Wallet, label: 'Wallet Requests' },
    ]
  },
  {
    label: 'Configuration',
    items: [
      { path: '/admin/countries', icon: Globe, label: 'Countries' },
      { path: '/admin/banks', icon: Building2, label: 'Banks' },
      { path: '/admin/deposit-packages', icon: DollarSign, label: 'Deposit Packages' },
      { path: '/admin/exchange-rates', icon: DollarSign, label: 'Exchange Rates' },
    ]
  },
  {
    label: 'Content',
    items: [
      { path: '/admin/banners', icon: Image, label: 'Banners' },
      { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
    ]
  },
  {
    label: 'Services',
    items: [
      { path: '/admin/manual-deposits', icon: Wallet, label: 'Manual Deposits' },
      { path: '/admin/air-tickets', icon: Plane, label: 'Air Tickets' },
      { path: '/admin/visa-apps', icon: FileText, label: 'Visa Applications' },
      { path: '/admin/support-chats', icon: MessageSquare, label: 'Support Chats' },
    ]
  },
];

export default function AdminShell({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`p-4 border-b border-white/10 flex items-center ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gold flex items-center justify-center font-extrabold text-forest text-xs shadow-md">CF</div>
            <div>
              <p className="text-white font-extrabold text-sm leading-tight">Cellfin</p>
              <p className="text-white/40 text-[10px]">Admin Panel</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-xl bg-gold flex items-center justify-center font-extrabold text-forest text-xs shadow-md">CF</div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-all"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-4">
        {NAV_SECTIONS.map(section => (
          <div key={section.label}>
            {!collapsed && (
              <p className="text-white/25 text-[9px] font-extrabold uppercase tracking-widest px-3 mb-1.5">{section.label}</p>
            )}
            <div className="space-y-0.5">
              {section.items.map(item => {
                const active = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setMobileOpen(false); }}
                    title={collapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-gold/20 text-gold border border-gold/20'
                        : 'text-white/60 hover:text-white hover:bg-white/10'
                    } ${collapsed ? 'justify-center' : ''}`}
                  >
                    <item.icon size={16} className="shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {!collapsed && active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-gold" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-white/10 space-y-1">
        <button
          onClick={() => navigate('/')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/10 transition-all ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Customer App' : undefined}
        >
          <Settings size={16} />
          {!collapsed && <span>Customer App</span>}
        </button>
        <button
          onClick={() => base44.auth.logout()}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all ${collapsed ? 'justify-center' : ''}`}
          title={collapsed ? 'Logout' : undefined}
        >
          <LogOut size={16} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex font-inter">
      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col bg-forest min-h-screen transition-all duration-300 shrink-0 ${collapsed ? 'w-16' : 'w-60'}`}>
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-64 bg-forest h-full overflow-y-auto">
            <SidebarContent />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 bg-forest z-40 px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gold flex items-center justify-center font-extrabold text-forest text-xs">CF</div>
          <p className="text-white font-extrabold text-sm">Admin Panel</p>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 text-white/70 hover:text-white">
          <Menu size={20} />
        </button>
      </div>

      <main className="flex-1 overflow-auto pt-14 md:pt-0 min-h-screen">{children}</main>
    </div>
  );
}