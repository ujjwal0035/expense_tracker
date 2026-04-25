import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-4 py-3">
        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--color-text-primary)' }}>
          {label}
        </p>
        <p className="text-sm" style={{ color: '#6c63ff' }}>
          ₹{payload[0].value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </p>
      </div>
    );
  }
  return null;
};

export default function MonthlyTrendLine({ data, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '300px' }}>
        <div className="loading-shimmer rounded-xl" style={{ width: '100%', height: '200px' }} />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center"
        style={{ height: '300px', color: 'var(--color-text-muted)' }}
      >
        <p className="text-sm mt-3">No data yet</p>
        <p className="text-xs">Add expenses to see the trend</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6c63ff" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6c63ff" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#e2e8f0"
          vertical={false}
        />
        <XAxis
          dataKey="month"
          stroke="var(--color-text-muted)"
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: 'var(--color-border)' }}
        />
        <YAxis
          stroke="var(--color-text-muted)"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `₹${v}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#6c63ff"
          strokeWidth={2.5}
          fill="url(#colorTotal)"
          dot={{
            r: 4,
            fill: '#6c63ff',
            stroke: '#ffffff',
            strokeWidth: 2,
          }}
          activeDot={{
            r: 6,
            fill: '#8b83ff',
            stroke: '#ffffff',
            strokeWidth: 2,
          }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
