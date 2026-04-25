import { useState, useEffect } from 'react';
import { DatePicker, Button, Space } from 'antd';
import dayjs from 'dayjs';
import { useDashboard } from '../context/DashboardContext';
import KPIWidget from '../components/KPIWidget';
import ExpenseTable from '../components/ExpenseTable';
import AddExpenseModal from '../components/AddExpenseModal';
import api from '../services/api';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

const { RangePicker } = DatePicker;

export default function DashboardPage() {
  const { dateRange, setDateRange, refreshTrigger, triggerRefresh } = useDashboard();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

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

  return (
    <div className="space-y-12 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6" style={{ marginTop: "20px" }}>
        <div style={{ marginBottom: "20px" }}>
          <h1 className="text-3xl font-bold text-slate-800">Home Dashboard</h1>
          <p className="text-slate-500">Overview of your recent spending</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Space size="middle">
            <RangePicker
              className="h-[46px] rounded-xl border-slate-200 shadow-sm"
              value={dateRange.startDate ? [dayjs(dateRange.startDate), dayjs(dateRange.endDate)] : null}
              onChange={handleDateChange}
              format="DD MMM, YYYY"
            />
            <Button
              className="h-[46px] rounded-xl font-semibold px-6 border-slate-200"
              onClick={clearFilters}
              size='large'
              type={!dateRange.startDate ? "primary" : "default"}
              style={!dateRange.startDate ? { background: '#6c63ff', borderColor: '#6c63ff' } : {}}
            >
              All Time
            </Button>
          </Space>

          <Button
            type="primary"
            icon={<Plus size={18} />}
            size='large'
            onClick={() => setShowAddModal(true)}
            className="h-[46px] rounded-xl font-bold flex items-center gap-2 px-6"
            style={{ background: '#6c63ff', borderColor: '#6c63ff' }}
          >
            Add Expense
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <KPIWidget
          title="Total Spend"
          value={summary ? `₹${summary.total_spend.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '--'}
          icon="wallet"
          color="#6c63ff"
          loading={loading}
          index={0}
        />
        <KPIWidget
          title="Expenses"
          value={summary ? summary.expense_count.toString() : '--'}
          icon="receipt"
          color="#10b981"
          loading={loading}
          index={1}
        />
        <KPIWidget
          title="Top Category"
          value={summary?.top_category || '--'}
          subtitle={summary?.top_category_amount ? `₹${summary.top_category_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : ''}
          icon="tag"
          color="#f59e0b"
          loading={loading}
          index={2}
        />
        <KPIWidget
          title="Avg / Expense"
          value={
            summary && summary.expense_count > 0
              ? `₹${(summary.total_spend / summary.expense_count).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : '--'
          }
          icon="calculator"
          color="#3b82f6"
          loading={loading}
          index={3}
        />
      </div>

      {/* Expense Table */}
      <div className="mt-8">
        <ExpenseTable onDelete={triggerRefresh} />
      </div>

      {showAddModal && (
        <AddExpenseModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            triggerRefresh();
          }}
        />
      )}
    </div>
  );
}
