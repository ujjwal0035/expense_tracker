import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const COLORS = [
  '#6c63ff',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#3b82f6',
  '#ec4899',
  '#8b5cf6',
  '#14b8a6',
  '#f97316',
  '#06b6d4',
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div
        className="glass-card px-4 py-3"
        style={{ minWidth: '160px' }}
      >
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          {data.category}
        </p>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          ₹{data.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {data.percentage}% of total
        </p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }) => {
  return (
    <div className="flex flex-wrap gap-3 justify-center mt-4">
      {payload?.map((entry, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <div
            className="rounded-full"
            style={{
              width: '8px',
              height: '8px',
              background: entry.color,
            }}
          />
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function CategoryPieChart({ data, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '300px' }}>
        <div className="loading-shimmer rounded-full" style={{ width: '200px', height: '200px' }} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{ height: '300px', color: 'var(--color-text-muted)' }}
      >
        <PieChart width={48} height={48} />
        <p className="text-sm mt-3">No data yet</p>
        <p className="text-xs">Add expenses to see the breakdown</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={100}
          dataKey="total"
          nameKey="category"
          stroke="none"
          paddingAngle={3}
        >
          {data.map((_, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[index % COLORS.length]}
              style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.08))' }}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={<CustomLegend />} />
      </PieChart>
    </ResponsiveContainer>
  );
}
