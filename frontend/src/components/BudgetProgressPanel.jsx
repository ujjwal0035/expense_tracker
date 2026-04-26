import { useEffect, useState } from 'react';
import { Button, Empty, Progress, Space, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import api from '../services/api';

const { Text } = Typography;

const statusColor = {
  ok: '#10b981',
  warning: '#f59e0b',
  over: '#ef4444',
};

const formatCurrency = (value) => {
  const amount = Math.abs(value).toLocaleString('en-IN');
  return value < 0 ? `-₹${amount}` : `₹${amount}`;
};

export default function BudgetProgressPanel({ refreshTrigger = 0 }) {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const month = dayjs().format('YYYY-MM');

  useEffect(() => {
    fetchBudgets();
  }, [refreshTrigger]);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/budgets/', { params: { month } });
      setBudgets(data);
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6" style={{ backgroundColor: 'var(--color-bg-card)' }}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Monthly Budgets</h3>
          <Text style={{ color: 'var(--color-text-secondary)' }}>{dayjs().format('MMMM YYYY')}</Text>
        </div>
        <Button onClick={() => navigate('/settings?tab=budgets')} style={{ borderRadius: 12 }}>
          Manage Budgets
        </Button>
      </div>

      {!loading && budgets.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No budgets set for this month"
        >
          <Button type="primary" onClick={() => navigate('/settings?tab=budgets')} style={{ background: '#6c63ff', borderColor: '#6c63ff' }}>
            Create Budget
          </Button>
        </Empty>
      ) : (
        <Space direction="vertical" className="w-full" size="middle">
          {budgets.map((budget) => (
            <div key={budget.id}>
              <div className="flex items-center justify-between gap-4 mb-2">
                <Text strong style={{ color: 'var(--color-text-primary)' }}>
                  {budget.budget_type === 'overall' ? 'All Categories' : budget.category}
                </Text>
                <Text style={{ color: 'var(--color-text-secondary)' }}>
                  ₹{budget.spent.toLocaleString('en-IN')} / ₹{budget.amount.toLocaleString('en-IN')}
                </Text>
              </div>
              <Progress
                percent={Math.min(budget.percentage, 100)}
                strokeColor={statusColor[budget.status]}
                trailColor="var(--color-bg-primary)"
                showInfo={false}
              />
              <Text style={{ color: statusColor[budget.status], fontSize: 12 }}>
                {formatCurrency(Number(budget.amount || 0) - Number(budget.spent || 0))} remaining
              </Text>
            </div>
          ))}
        </Space>
      )}
    </div>
  );
}
