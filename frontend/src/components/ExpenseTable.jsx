import { useState, useEffect } from 'react';
import { Table, Tag, Button, Popconfirm, Space, Typography, Input, Select } from 'antd';
import { Trash2, Edit2, Search, XCircle, FilterX } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useDashboard } from '../context/DashboardContext';
import AddExpenseModal from './AddExpenseModal';

const { Text } = Typography;

export default function ExpenseTable({ onDelete }) {
  const { refreshTrigger, dateRange, triggerRefresh } = useDashboard();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState(null);
  const limit = 10;

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchExpenses();
    }, 300);

    return () => clearTimeout(timer);
  }, [page, refreshTrigger, dateRange, searchText, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories/');
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = { skip: page * limit, limit: limit };
      if (dateRange.startDate) params.start_date = dateRange.startDate;
      if (dateRange.endDate) params.end_date = dateRange.endDate;
      if (searchText) params.search = searchText;
      if (selectedCategory) params.category = selectedCategory;

      const { data } = await api.get('/expenses/', { params });
      setExpenses(data.items || data);
      setTotal(data.total ?? data.length);
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
    } catch {
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
        <Text style={{ color: 'var(--color-text-secondary)' }}>
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
      render: (text) => <Text style={{ color: 'var(--color-text-primary)' }}>{text || '—'}</Text>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (amount) => (
        <Text className="font-bold" style={{ color: '#6c63ff' }}>
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
            icon={<Edit2 size={16} style={{ color: '#3b82f6' }} />}
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
      <div className="glass-card p-0 overflow-hidden border-none shadow-xl" style={{ backgroundColor: 'var(--color-bg-card)' }}>
        <div className="p-6 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4" style={{ marginBottom: '10px ' }}>
          <h3 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Recent Expenses</h3>

          <div className="w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Input
              placeholder="Search category or description..."
              prefix={<Search size={16} style={{ color: 'var(--color-text-muted)' }} />}
              allowClear={{ clearIcon: <XCircle size={14} style={{ color: 'var(--color-text-muted)' }} /> }}
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setPage(0);
              }}
              style={{ 
                borderRadius: '12px', 
                height: '42px', 
                minWidth: '280px',
                backgroundColor: 'var(--color-bg-primary)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-primary)'
              }}
            />
            <Select
              allowClear
              placeholder="Category"
              value={selectedCategory || undefined}
              onChange={(value) => {
                setSelectedCategory(value || '');
                setPage(0);
              }}
              options={categories.map((cat) => ({ label: cat.name, value: cat.name }))}
              style={{ minWidth: 180, height: 42 }}
            />
            {(searchText || selectedCategory) && (
              <Button
                icon={<FilterX size={16} />}
                onClick={() => {
                  setSearchText('');
                  setSelectedCategory('');
                  setPage(0);
                }}
                style={{ height: 42, borderRadius: 12 }}
              >
                Clear
              </Button>
            )}
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
