// Reusable page card container for admin pages
export function AdminCard({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl overflow-hidden ${className}`}
      style={{
        background: '#fff',
        border: '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
      }}
    >
      {children}
    </div>
  );
}

export function AdminCardHeader({ title, subtitle, action }) {
  return (
    <div
      className="px-6 py-4 flex items-center justify-between"
      style={{ borderBottom: '1px solid rgba(0,0,0,0.05)' }}
    >
      <div>
        <h2 className="font-black text-slate-900">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400 font-medium mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function StatusBadge({ status }) {
  const config = {
    pending: { bg: '#fef3c7', color: '#d97706', label: 'Pending' },
    approved: { bg: '#d1fae5', color: '#059669', label: 'Approved' },
    rejected: { bg: '#fee2e2', color: '#dc2626', label: 'Rejected' },
    success: { bg: '#d1fae5', color: '#059669', label: 'Success' },
    failed: { bg: '#fee2e2', color: '#dc2626', label: 'Failed' },
    active: { bg: '#d1fae5', color: '#059669', label: 'Active' },
    inactive: { bg: '#f1f5f9', color: '#64748b', label: 'Inactive' },
  };
  const c = config[status] || config.pending;
  return (
    <span
      className="text-[10px] font-bold px-2.5 py-1 rounded-full"
      style={{ background: c.bg, color: c.color }}
    >
      {c.label}
    </span>
  );
}

export function AddButton({ onClick, label = 'Add New' }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
      style={{
        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
        boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
      }}
    >
      <span className="text-lg leading-none">+</span> {label}
    </button>
  );
}

export function FilterTabs({ options, value, onChange }) {
  return (
    <div className="flex gap-1.5 p-1 rounded-xl" style={{ background: '#f1f5f9' }}>
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all capitalize"
          style={
            value === opt.value
              ? { background: '#fff', color: '#0f172a', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }
              : { color: '#64748b' }
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="p-6 space-y-4">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-100 rounded-full w-56 animate-pulse" />
            <div className="h-2 bg-slate-50 rounded-full w-36 animate-pulse" />
          </div>
          <div className="h-3 bg-slate-100 rounded-full w-20 animate-pulse" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon: Icon, message }) {
  return (
    <div className="py-16 text-center">
      {Icon && <Icon size={36} className="mx-auto mb-3" style={{ color: '#e2e8f0' }} />}
      <p className="text-slate-400 text-sm">{message}</p>
    </div>
  );
}

// Default wrapper component for admin pages
export default function AdminPageWrapper({ title, children }) {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {title && (
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}