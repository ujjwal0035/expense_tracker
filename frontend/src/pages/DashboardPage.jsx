import { useState, useEffect } from 'react';
import { DatePicker, Button, Space, Empty, Progress, Typography } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../context/DashboardContext';
import KPIWidget from '../components/KPIWidget';
import ExpenseTable from '../components/ExpenseTable';
import AddExpenseModal from '../components/AddExpenseModal';
import api from '../services/api';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const formatCurrency = (value, options = {}) => {
  const amount = Math.abs(Number(value || 0)).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });
  return Number(value || 0) < 0 ? `-₹${amount}` : `₹${amount}`;
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const { dateRange, setDateRange, refreshTrigger, triggerRefresh } = useDashboard();
  const [summary, setSummary] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [overallBudget, setOverallBudget] = useState(null);
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
      const budgetMonth = dateRange.startDate
        ? dayjs(dateRange.startDate).format('YYYY-MM')
        : dayjs().format('YYYY-MM');

      const [summaryRes, categoryRes, budgetRes] = await Promise.all([
        api.get('/analytics/summary', {
          params,
          headers: { 'Cache-Control': 'no-cache' },
        }),
        api.get('/analytics/category-breakdown', {
          params,
          headers: { 'Cache-Control': 'no-cache' },
        }),
        api.get('/budgets/', { params: { month: budgetMonth } }),
      ]);

      const budgetsByCategory = new Map(
        budgetRes.data
          .filter((budget) => budget.budget_type === 'category' && budget.category)
          .map((budget) => [budget.category, budget])
      );

      setSummary(summaryRes.data);
      setOverallBudget(budgetRes.data.find((budget) => budget.budget_type === 'overall') || null);
      setCategoryBreakdown(
        [...categoryRes.data].sort((a, b) => Number(b.total || 0) - Number(a.total || 0))
          .map((item) => ({
            ...item,
            budget: budgetsByCategory.get(item.category) || null,
          }))
          .slice(0, 5)
      );
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

  const selectedPeriodLabel = dateRange.startDate && dateRange.endDate
    ? `${dayjs(dateRange.startDate).format('DD MMM YYYY')} - ${dayjs(dateRange.endDate).format('DD MMM YYYY')}`
    : 'All Time';
  const maxCategorySpend = categoryBreakdown.reduce(
    (max, item) => Math.max(max, Number(item.total || 0)),
    0
  );

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

      {/* Category Spending Breakdown */}
      <div className="glass-card p-6" style={{ backgroundColor: 'var(--color-bg-card)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Top 5 Spend Categories</h3>
            <Text style={{ color: 'var(--color-text-secondary)' }}>{selectedPeriodLabel}</Text>
          </div>
          <div className="flex flex-col sm:items-end gap-2">
            <Text strong style={{ color: '#6c63ff', display: 'block' }}>
              {summary ? formatCurrency(summary.total_spend) : '--'}
            </Text>
            <Text style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
              {overallBudget ? `${formatCurrency(overallBudget.amount)} monthly budget` : 'No overall budget'}
            </Text>
            <Button onClick={() => navigate('/settings?tab=budgets')} style={{ borderRadius: 12 }}>
              Manage Budgets
            </Button>
          </div>
        </div>

        {!loading && categoryBreakdown.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No spending categories for this period" />
        ) : (
          <Space direction="vertical" className="w-full" size="middle">
            {categoryBreakdown.map((item, index) => {
              const budgetAmount = Number(item.budget?.amount || 0);
              const spentAmount = Number(item.total || 0);
              const remaining = budgetAmount - spentAmount;
              const budgetUsage = budgetAmount > 0 ? Math.round((spentAmount / budgetAmount) * 100) : 0;
              const budgetColor = remaining < 0 ? '#ef4444' : budgetUsage >= 80 ? '#f59e0b' : '#10b981';
              const rankBarPercent = maxCategorySpend > 0
                ? Math.round((spentAmount / maxCategorySpend) * 100)
                : 0;

              return (
              <div key={item.category}>
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                      style={{
                        backgroundColor: index === 0 ? '#f59e0b' : 'var(--color-bg-primary)',
                        color: index === 0 ? '#ffffff' : 'var(--color-text-secondary)',
                      }}
                    >
                      {index + 1}
                    </span>
                    <Text strong style={{ color: 'var(--color-text-primary)' }}>
                      {item.category}
                    </Text>
                  </div>
                  <Text style={{ color: 'var(--color-text-secondary)' }}>
                    {formatCurrency(item.total)}
                  </Text>
                </div>
                <Progress
                  percent={rankBarPercent}
                  strokeColor={index === 0 ? '#f59e0b' : '#6c63ff'}
                  trailColor="var(--color-bg-primary)"
                  showInfo={false}
                />
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <Text style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
                    {item.percentage}% of spend
                  </Text>
                  <Text style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
                    Budget: {budgetAmount > 0 ? formatCurrency(budgetAmount) : 'Not set'}
                  </Text>
                  <Text style={{ color: budgetAmount > 0 ? budgetColor : 'var(--color-text-muted)', fontSize: 12 }}>
                    {budgetAmount > 0
                      ? `${formatCurrency(Math.abs(remaining))} ${remaining < 0 ? 'over' : 'left'} (${budgetUsage}% used)`
                      : 'Set budget in Settings'}
                  </Text>
                </div>
              </div>
              );
            })}
          </Space>
        )}
      </div>

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
