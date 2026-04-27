import { useState, useEffect } from 'react';
import { DatePicker, Button, Space } from 'antd';
import dayjs from 'dayjs';
import { useDashboard } from '../context/DashboardContext';
import KPIWidget from '../components/KPIWidget';
import ExpenseTable from '../components/ExpenseTable';
import AddExpenseModal from '../components/AddExpenseModal';
import BudgetProgressPanel from '../components/BudgetProgressPanel';
import api from '../services/api';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const { RangePicker } = DatePicker;

const formatCurrency = (value, options = {}) => {
  const amount = Math.abs(Number(value || 0)).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });
  return Number(value || 0) < 0 ? `-₹${amount}` : `₹${amount}`;
};

export default function DashboardPage() {
  const { dateRange, setDateRange, refreshTrigger, triggerRefresh } = useDashboard();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const dashboardBudgetRemaining = summary
    ? Number(summary.total_budget || 0) - Number(summary.total_spend || 0)
    : 0;

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, refreshTrigger]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = {};
      if (dateRange.startDate) params.start_date = dateRange.startDate;
      if (dateRange.endDate) params.end_date = dateRange.endDate;

      const { data } = await api.get('/analytics/summary', { params });
      setSummary(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
      toast.error(err.response?.data?.detail || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dates) => {
    if (!dates) {
      setDateRange({ startDate: '', endDate: '' });
    } else {
      setDateRange({
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
      });
    }
  };

  const clearFilters = () => {
    setDateRange({ startDate: '', endDate: '' });
  };

  const applyQuickRange = (range) => {
    const today = dayjs();
    const ranges = {
      month: [today.startOf('month'), today.endOf('month')],
      last30: [today.subtract(29, 'day'), today],
      year: [today.startOf('year'), today.endOf('year')],
    };
    const [start, end] = ranges[range];
    setDateRange({
      startDate: start.format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD'),
    });
  };

  return (
    <div className="space-y-12 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6" style={{ marginTop: "20px" }}>
        <div style={{ marginBottom: "20px" }}>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Home Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Overview of your recent spending</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Space size="middle">
            <Button
              className="h-[46px] rounded-xl font-semibold"
              onClick={() => applyQuickRange('month')}
              size="large"
            >
              This Month
            </Button>
            <Button
              className="h-[46px] rounded-xl font-semibold"
              onClick={() => applyQuickRange('last30')}
              size="large"
            >
              Last 30 Days
            </Button>
            <RangePicker
              className="h-[46px] rounded-xl shadow-sm"
              style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}
              value={dateRange.startDate ? [dayjs(dateRange.startDate), dayjs(dateRange.endDate)] : null}
              onChange={handleDateChange}
              format="DD MMM, YYYY"
            />
            <Button
              className="h-[46px] rounded-xl font-semibold px-6"
              onClick={clearFilters}
              size='large'
              type={!dateRange.startDate ? "primary" : "default"}
              style={!dateRange.startDate ? { background: '#6c63ff', borderColor: '#6c63ff' } : { borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              All Time
            </Button>
          </Space>

          <Button
            type="primary"
            icon={<Plus size={18} />}
            size='large'
            onClick={() => setShowAddModal(true)}
            className="h-[46px] rounded-xl font-bold flex items-center gap-2 px-6 shadow-lg shadow-[#6c63ff]/20"
            style={{ background: '#6c63ff', borderColor: '#6c63ff' }}
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* KPI Row - Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <KPIWidget
          title="Total Spend"
          value={summary ? formatCurrency(summary.total_spend) : '--'}
          icon="wallet"
          color="#6c63ff"
          loading={loading}
          index={0}
        />
        <KPIWidget
          title="Total Budget"
          value={summary ? formatCurrency(summary.total_budget) : '--'}
          icon="target"
          color="#3b82f6"
          loading={loading}
          index={1}
        />
        <KPIWidget
          title="Remaining"
          value={summary ? formatCurrency(dashboardBudgetRemaining) : '--'}
          icon={dashboardBudgetRemaining < 0 ? 'trendingDown' : 'trending'}
          color={dashboardBudgetRemaining < 0 ? '#ef4444' : '#10b981'}
          loading={loading}
          index={2}
        />
      </div>

      {/* Secondary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <KPIWidget
          title="Expenses"
          value={summary ? summary.expense_count.toString() : '--'}
          icon="receipt"
          color="#8b5cf6"
          loading={loading}
          index={3}
        />
        <KPIWidget
          title="Top Category"
          value={summary?.top_category || '--'}
          subtitle={summary?.top_category_amount ? formatCurrency(summary.top_category_amount) : ''}
          icon="tag"
          color="#f59e0b"
          loading={loading}
          index={4}
        />
        <KPIWidget
          title="Avg / Expense"
          value={
            summary && summary.expense_count > 0
              ? formatCurrency(summary.total_spend / summary.expense_count)
              : '--'
          }
          icon="calculator"
          color="#ec4899"
          loading={loading}
          index={5}
        />
      </div>

      {/* Detailed Budget Breakdown */}
      <BudgetProgressPanel refreshTrigger={refreshTrigger} />

      {/* Expense Table */}
      <div className="mt-8">
        <ExpenseTable onDelete={triggerRefresh} />
      </div>

      <AddExpenseModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          setShowAddModal(false);
          triggerRefresh();
        }}
      />
    </div>
  );
}
