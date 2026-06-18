import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import {
  LayoutDashboard, Users, ArrowDownCircle, ArrowUpCircle,
  Bell, Globe, Package, TrendingUp, MessageSquare, ImageIcon,
  FileText, Plane, CreditCard, LogOut, Menu, ChevronRight,
  Banknote, Shield, Headphones, Building2, Info, Bot, MapPin, Home, ToggleLeft
} from 'lucide-react';


const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    ]
  },
  {
    label: 'Users & Finances',
    items: [
      { label: 'Users', icon: Users, path: '/admin/users' },
      { label: 'Transactions', icon: TrendingUp, path: '/admin/transactions' },
      { label: 'Manual Deposits', icon: ArrowDownCircle, path: '/admin/manual-deposits' },
      { label: 'Bank Management', icon: Building2, path: '/admin/banks' },
    ]
  },
  {
    label: 'Configuration',
    items: [
      { label: 'Countries', icon: Globe, path: '/admin/countries' },
      { label: 'Exchange Rates', icon: CreditCard, path: '/admin/exchange-rates' },
      { label: 'Deposit Packages', icon: Package, path: '/admin/deposit-packages' },
    ]
  },
  {
    label: 'Services Control',
    items: [
      { label: 'Visa Services', icon: FileText, path: '/admin/visa-services' },
      { label: 'Visa Applications', icon: FileText, path: '/admin/visa-apps' },
      { label: 'Air Ticket Routes', icon: Plane, path: '/admin/air-ticket-routes' },
      { label: 'Air Ticket Orders', icon: Plane, path: '/admin/air-tickets' },
    ]
  },
  {
    label: 'Finance Control',
    items: [
      { label: 'Min Balance Lock', icon: Shield, path: '/admin/min-balance' },
      { label: 'Intl Transfer', icon: Globe, path: '/admin/intl-transfer' },
    ]
  },
  {
    label: 'Content & Communication',
    items: [
      { label: 'Notifications', icon: Bell, path: '/admin/notifications' },
      { label: 'Banners', icon: ImageIcon, path: '/admin/banners' },
      { label: 'Support Chats', icon: MessageSquare, path: '/admin/support-chats' },
      { label: 'Virtual AI Agents', icon: Bot, path: '/admin/virtual-agents' },
      { label: 'Group Chat', icon: MessageSquare, path: '/admin/group-chat' },
      { label: '24/7 Support Links', icon: Headphones, path: '/admin/support-contacts' },
      { label: 'About Us', icon: Info, path: '/admin/about-us' },
      { label: 'Geo Restriction', icon: MapPin, path: '/admin/geo-restriction' },
      { label: 'KYC & Agent Verify', icon: Shield, path: '/admin/agent-kyc' },
    ]
  },
  {
    label: 'App Configuration',
    items: [
      { label: 'Home Screen Buttons', icon: Home, path: '/admin/home-config' },
    ]
  },
  {
    label: 'System',
    items: [
      { label: 'Admin Management', icon: Shield, path: '/admin/management' },
    ]
  },
];

const PAGE_TITLES = {
  '/admin/dashboard': 'Dashboard',
  '/admin/users': 'User Management',
  '/admin/transactions': 'Transactions',
  '/admin/manual-deposits': 'Manual Deposits',
  '/admin/wallet-requests': 'Wallet Requests',
  '/admin/countries': 'Countries',
  '/admin/exchange-rates': 'Exchange Rates',
  '/admin/deposit-packages': 'Deposit Packages',
  '/admin/notifications': 'Notifications',
  '/admin/banners': 'Banners',
  '/admin/air-tickets': 'Air Ticket Orders',
  '/admin/air-ticket-routes': 'Air Ticket Routes',
  '/admin/visa-apps': 'Visa Applications',
  '/admin/visa-services': 'Visa Services',
  '/admin/min-balance': 'Min Balance Lock',
  '/admin/support-chats': 'Support Chats',
  '/admin/group-chat': 'Group Chat Management',
  '/admin/intl-transfer': 'International Transfer',
  '/admin/support-contacts': '24/7 Support Contacts',
  '/admin/about-us': 'About Us Management',
  '/admin/banks': 'Bank Management',
  '/admin/virtual-agents': 'Virtual AI Agents',
  '/admin/geo-restriction': 'Geo Restriction',
  '/admin/agent-kyc': 'KYC & Agent Verification',
  '/admin/company-info': 'Company Info',
  '/admin/management': 'Admin Management',
  '/admin/home-config': 'Home Screen Config',
};

function Sidebar({ onNav }) {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      className="w-64 h-full flex flex-col"
      style={{
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}
        >
          <Shield size={17} className="text-white" />
        </div>
        <div>
          <p className="text-white font-black text-sm tracking-tight">Money Tracker</p>
          <p className="text-xs font-medium" style={{ color: '#10b981' }}>Admin Console</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="text-[10px] font-bold uppercase tracking-widest px-3 mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(item => {
                const active = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); onNav?.(); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative"
                    style={{
                      background: active ? 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.1) 100%)' : 'transparent',
                      color: active ? '#10b981' : 'rgba(255,255,255,0.5)',
                      border: active ? '1px solid rgba(16,185,129,0.3)' : '1px solid transparent',
                    }}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full" style={{ background: '#10b981' }} />
                    )}
                    <item.icon size={16} className={active ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-300 transition-colors'} />
                    <span className={active ? 'text-emerald-300 font-semibold' : 'group-hover:text-white transition-colors'}>
                      {item.label}
                    </span>
                    {active && <ChevronRight size={13} className="ml-auto text-emerald-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="pt-4">
          <button
            onClick={() => { base44.auth.logout(); window.location.href = '/admin'; }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group"
            style={{ color: 'rgba(255,255,255,0.35)' }}
          >
            <LogOut size={16} className="group-hover:text-red-400 transition-colors" />
            <span className="group-hover:text-red-400 transition-colors">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminShell({ children }) {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageTitle = PAGE_TITLES[location.pathname] || 'Admin';

  return (
    <div className="flex min-h-screen" style={{ background: '#f1f5f9' }}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex fixed top-0 left-0 h-full z-30 w-64">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="w-64 h-full">
            <Sidebar onNav={() => setMobileOpen(false)} />
          </div>
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top Header */}
        <header
          className="sticky top-0 z-20 flex items-center justify-between px-6 py-4"
          style={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(0,0,0,0.06)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          }}
        >
          <div className="flex items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 rounded-xl transition-colors"
              style={{ background: '#f1f5f9' }}
            >
              <Menu size={18} className="text-slate-600" />
            </button>
            <div>
              <h1 className="font-black text-slate-900 text-lg leading-tight">{pageTitle}</h1>
              <p className="text-xs text-slate-400 font-medium hidden sm:block">
                Money Tracker Remittance · Admin Console
              </p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(5,150,105,0.05) 100%)', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-bold text-emerald-700">Live</span>
            </div>
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' }}
            >
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-0">{children}</main>
      </div>
    </div>
  );
}