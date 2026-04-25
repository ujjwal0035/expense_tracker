import { Wallet, Receipt, Tag, Calculator } from 'lucide-react';

const icons = {
  wallet: Wallet,
  receipt: Receipt,
  tag: Tag,
  calculator: Calculator,
};

export default function KPIWidget({ title, value, subtitle, icon, color, loading, index = 0 }) {
  const Icon = icons[icon] || Wallet;

  if (loading) {
    return (
      <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
        <div className="flex items-center gap-4">
          <div className="loading-shimmer rounded-xl" style={{ width: '48px', height: '48px' }} />
          <div className="flex-1 space-y-2">
            <div className="loading-shimmer rounded" style={{ width: '60%', height: '12px' }} />
            <div className="loading-shimmer rounded" style={{ width: '80%', height: '24px' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="glass-card p-5 animate-fade-in-up"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="flex items-center gap-4">
        <div
          className="rounded-xl p-3 shrink-0"
          style={{
            background: `${color}15`,
            border: `1px solid ${color}25`,
          }}
        >
          <Icon size={22} color={color} />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-muted)' }}>
            {title}
          </p>
          <p className="text-xl font-bold truncate" style={{ color: 'var(--color-text-primary)' }}>
            {value}
          </p>
          {subtitle && (
            <p className="text-xs mt-0.5" style={{ color }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
