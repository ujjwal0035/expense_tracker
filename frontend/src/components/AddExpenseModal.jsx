import { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, DatePicker, Button, Typography, Space } from 'antd';
import { WalletOutlined, CalendarOutlined, TagsOutlined, FileTextOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import toast from 'react-hot-toast';
import api from '../services/api';

const { Text } = Typography;
const { Option } = Select;

export default function AddExpenseModal({ open, onClose, onSuccess, initialData = null }) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [form] = Form.useForm();
  const isEditing = !!initialData;

  useEffect(() => {
    if (open) {
      fetchCategories();
      if (initialData) {
        form.setFieldsValue({
          ...initialData,
          expense_date: dayjs(initialData.expense_date)
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, initialData, form]);

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories/');
      setCategories(data.map(c => c.name));
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      const payload = {
        ...values,
        amount: parseFloat(values.amount),
        expense_date: values.expense_date.format('YYYY-MM-DD'),
      };

      if (isEditing) {
        await api.patch(`/expenses/${initialData.id}`, payload);
        toast.success('Expense updated successfully!');
      } else {
        await api.post('/expenses/', payload);
        toast.success('Expense added successfully!');
      }
      
      form.resetFields();
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.detail || `Failed to ${isEditing ? 'update' : 'add'} expense`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space className="pt-2">
          <div className="bg-[#6c63ff]/10 p-2 rounded-lg">
            {isEditing ? <EditOutlined style={{ color: '#6c63ff', fontSize: '20px' }} /> : <WalletOutlined style={{ color: '#6c63ff', fontSize: '20px' }} />}
          </div>
          <Text strong style={{ fontSize: '18px' }}>{isEditing ? 'Edit Expense' : 'Add New Expense'}</Text>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      centered
      width={480}
      className="premium-modal"
      styles={{
        mask: { backdropFilter: 'blur(4px)' }
      }}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          category: 'Food',
          expense_date: dayjs(),
        }}
        className="mt-6"
        size="large"
      >
        <div className="grid grid-cols-2 gap-4">
          <Form.Item
            name="amount"
            label={<Text strong className="text-slate-600">Amount (₹)</Text>}
            rules={[
              { required: true, message: 'Please enter an amount' },
              { type: 'number', min: 0.01, message: 'Amount must be greater than zero' }
            ]}
          >
            <InputNumber
              prefix={<Text className="text-slate-400">₹</Text>}
              placeholder="0.00"
              className="w-full rounded-xl"
              style={{ borderRadius: '12px', width: '100%' }}
              precision={2}
            />
          </Form.Item>

          <Form.Item
            name="expense_date"
            label={<Text strong className="text-slate-600">Date</Text>}
            rules={[{ required: true, message: 'Please select a date' }]}
          >
            <DatePicker
              className="w-full rounded-xl"
              suffixIcon={<CalendarOutlined className="text-[#6c63ff]" />}
              format="DD MMM, YYYY"
            />
          </Form.Item>
        </div>

        <Form.Item
          name="category"
          label={<Text strong className="text-slate-600">Category</Text>}
          rules={[{ required: true, message: 'Please select a category' }]}
        >
          <Select
            placeholder="Select category"
            suffixIcon={<TagsOutlined className="text-[#6c63ff]" />}
            dropdownStyle={{ borderRadius: '12px' }}
          >
            {categories.map(cat => (
              <Option key={cat} value={cat}>{cat}</Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="description"
          label={<Text strong className="text-slate-600">Description</Text>}
        >
          <Input
            prefix={<FileTextOutlined className="text-slate-400" />}
            placeholder="What was this for?"
            className="rounded-xl"
          />
        </Form.Item>

        <Form.Item className="mb-0 mt-8">
          <div className="flex gap-4">
            <Button
              onClick={onClose}
              className="flex-1 h-[48px] rounded-xl font-semibold border-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="flex-1 h-[48px] rounded-xl font-bold"
              style={{ background: '#6c63ff', borderColor: '#6c63ff' }}
            >
              {isEditing ? 'Update Expense' : 'Save Expense'}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}
