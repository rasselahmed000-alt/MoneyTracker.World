const COLORS = [
  'bg-pink-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-cyan-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-rose-500',
  'bg-fuchsia-500',
  'bg-sky-500',
];

export default function ChatAvatar({ name }) {
  const getColor = (str) => {
    if (!str) return COLORS[0];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return COLORS[Math.abs(hash) % COLORS.length];
  };

  const initials = (name || '?')
    .trim()
    .split(/\s+/)
    .map((n, i) => i === 0 || i === name.split(/\s+/).length - 1 ? n[0] : '')
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase() || '?';

  return (
    <div className={`${getColor(name)} w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm`}>
      {initials}
    </div>
  );
}