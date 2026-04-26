import { useState, useEffect } from 'react';
import { Table, Tag, Button, Popconfirm, Space, Typography, Input, Select } from 'antd';
import { Trash2, Edit2, Search, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useDashboard } from '../context/DashboardContext';
import AddExpenseModal from './AddExpenseModal';

const { Text } = Typography;
const { Option } = Select;

export default function ExpenseTable({ onDelete }) {
  const { refreshTrigger, dateRange, triggerRefresh } = useDashboard();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const limit = 10;

  // Search with debounce effect
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExpenses();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  useEffect(() => {
    // Only fetch on other triggers immediately
    fetchExpenses();
  }, [page, refreshTrigger, dateRange]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = { skip: page * limit, limit: limit };
      if (dateRange.startDate) params.start_date = dateRange.startDate;
      if (dateRange.endDate) params.end_date = dateRange.endDate;
      if (searchText) params.search = searchText;

      const { data } = await api.get('/expenses/', { params });
      setExpenses(data);
      setTotal(data.length === limit ? (page + 2) * limit : (page + 1) * limit);
    } catch (err) {
      console.error('Failed to fetch expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/expenses/${id}`);
      toast.success('Expense deleted');
      fetchExpenses();
      onDelete?.();
    } catch (err) {
      toast.error('Failed to delete expense');
    }
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setEditModalOpen(true);
  };

  const categoryColors = {
    Food: 'success',
    Travel: 'processing',
    Utilities: 'warning',
    Entertainment: 'magenta',
    Shopping: 'purple',
    Health: 'error',
    Education: 'cyan',
    Transport: 'orange',
    Other: 'default'
  };

  const columns = [
    {
      title: 'Date',
      dataKey: 'expense_date',
      key: 'date',
      render: (_, record) => (
        <Text className="text-slate-600">
          {new Date(record.expense_date).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      ),
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag color={categoryColors[category] || 'default'} className="rounded-lg px-3 py-0.5 border-none font-semibold">
          {category}
        </Tag>
      ),
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => <Text className="text-slate-800">{text || '—'}</Text>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount) => (
        <Text className="font-bold text-[#6c63ff]">
          ₹{parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      align: 'center',
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="text"
            icon={<Edit2 size={16} className="text-blue-500" />}
            onClick={() => handleEdit(record)}
            className="flex items-center justify-center"
          />
          <Popconfirm
            title="Delete Expense"
            description="Are you sure you want to delete this expense?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
            okButtonProps={{ danger: true }}
          >
            <Button
              type="text"
              danger
              icon={<Trash2 size={16} />}
              className="flex items-center justify-center"
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <>
      <div className="glass-card p-0 overflow-hidden border-none shadow-xl">
        <div className="p-6 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ marginBottom: '10px ' }}>
          <h3 className="text-xl font-bold text-slate-800">Recent Expenses</h3>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <Input
              placeholder="Search category or description..."
              prefix={<Search size={16} className="text-slate-400" />}
              allowClear={{ clearIcon: <XCircle size={14} className="text-slate-300 hover:text-slate-400" /> }}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(0);
              }}
              className="rounded-xl border-slate-200 hover:border-[#6c63ff] focus:border-[#6c63ff] h-[42px] min-w-[280px]"
            />
          </div>
        </div>

        <Table
          columns={columns}
          dataSource={expenses}
          rowKey="id"
          loading={loading}
          pagination={{
            current: page + 1,
            pageSize: limit,
            total: total,
            onChange: (p) => setPage(p - 1),
            showSizeChanger: false,
            className: "px-6 pb-4",
          }}
          className="expense-antd-table"
        />
      </div>

      <AddExpenseModal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        initialData={selectedExpense}
        onSuccess={() => {
          setEditModalOpen(false);
          fetchExpenses();
          triggerRefresh?.();
        }}
      />
    </>
  );
}
