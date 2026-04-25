import { useState, useEffect } from 'react';
import { Table, Tag, Button, Popconfirm, Space, Typography } from 'antd';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useDashboard } from '../context/DashboardContext';

const { Text } = Typography;

export default function ExpenseTable({ onDelete }) {
  const { refreshTrigger, dateRange } = useDashboard();
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    fetchExpenses();
  }, [page, refreshTrigger, dateRange]);

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const params = { skip: page * limit, limit: limit };
      if (dateRange.startDate) params.start_date = dateRange.startDate;
      if (dateRange.endDate) params.end_date = dateRange.endDate;

      const { data } = await api.get('/expenses/', { params });
      setExpenses(data);
      // Since we don't have a total count from backend yet, we estimate or handle pagination
      // For now, let's assume we can see at least one more page if we got full results
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
            className="flex items-center justify-center mx-auto"
          />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div className="glass-card p-0 overflow-hidden border-none shadow-xl">
      <div className="p-6 pb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-800">Recent Expenses</h3>
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
  );
}
