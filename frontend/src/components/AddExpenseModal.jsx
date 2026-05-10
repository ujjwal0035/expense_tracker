import { useState, useEffect } from 'react';
import { Modal, Form, Input, InputNumber, Select, DatePicker, Button, Typography, Space } from 'antd';
import { WalletOutlined, CalendarOutlined, TagsOutlined, FileTextOutlined, EditOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
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
          expenses: [{
            ...initialData,
            expense_date: dayjs(initialData.expense_date)
          }]
        });
      } else {
        form.setFieldsValue({
          expenses: [{
            category: 'Food',
            expense_date: dayjs(),
          }]
        });
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
      if (isEditing) {
        const item = values.expenses[0];
        const payload = {
          amount: parseFloat(item.amount),
          category: item.category,
          expense_date: item.expense_date.format('YYYY-MM-DD'),
          description: item.description,
        };
        await api.patch(`/expenses/${initialData.id}`, payload);
        toast.success('Expense updated successfully!');
      } else {
        const items = values.expenses.map(item => ({
          amount: parseFloat(item.amount),
          category: item.category,
          expense_date: item.expense_date.format('YYYY-MM-DD'),
          description: item.description || "",
        }));

        if (items.length === 1) {
          await api.post('/expenses/', items[0]);
          toast.success('Expense added successfully!');
        } else {
          await api.post('/expenses/bulk', { expenses: items });
          toast.success(`${items.length} expenses added successfully!`);
        }
      }
      
      form.resetFields();
      onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.detail || `Failed to ${isEditing ? 'update' : 'add'} expense(s)`);
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
        className="mt-6"
        size="large"
      >
        <div style={{ maxHeight: '60vh', overflowY: 'auto', overflowX: 'hidden', paddingRight: '8px' }}>
          <Form.List name="expenses">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} className="mb-6 p-4 border border-slate-100 dark:border-slate-700/50 rounded-2xl bg-slate-50 dark:bg-slate-800/50 relative">
                    {fields.length > 1 && !isEditing && (
                      <Button 
                        type="text" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => remove(name)}
                        className="absolute top-2 right-2"
                      />
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <Form.Item
                        {...restField}
                        name={[name, 'amount']}
                        label={<Text strong className="text-slate-600 dark:text-slate-300">Amount (₹)</Text>}
                        rules={[
                          { required: true, message: 'Please enter an amount' },
                          { type: 'number', min: 0.01, message: 'Must be > 0' }
                        ]}
                      >
                        <InputNumber
                          prefix={<Text className="text-slate-400 dark:text-slate-500">₹</Text>}
                          placeholder="0.00"
                          className="w-full rounded-xl"
                          style={{ borderRadius: '12px', width: '100%' }}
                          precision={2}
                        />
                      </Form.Item>

                      <Form.Item
                        {...restField}
                        name={[name, 'expense_date']}
                        label={<Text strong className="text-slate-600 dark:text-slate-300">Date</Text>}
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
                      {...restField}
                      name={[name, 'category']}
                      label={<Text strong className="text-slate-600 dark:text-slate-300">Category</Text>}
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
                      {...restField}
                      name={[name, 'description']}
                      label={<Text strong className="text-slate-600 dark:text-slate-300">Description</Text>}
                      className="mb-0"
                    >
                      <Input
                        prefix={<FileTextOutlined className="text-slate-400 dark:text-slate-500" />}
                        placeholder="What was this for?"
                        className="rounded-xl"
                      />
                    </Form.Item>
                  </div>
                ))}
                {!isEditing && (
                  <Form.Item>
                    <Button 
                      type="dashed" 
                      onClick={() => add({ category: 'Food', expense_date: dayjs() })} 
                      block 
                      icon={<PlusOutlined />}
                      className="rounded-xl h-[48px] border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:text-[#6c63ff] hover:border-[#6c63ff] dark:bg-transparent"
                    >
                      Add Another Expense
                    </Button>
                  </Form.Item>
                )}
              </>
            )}
          </Form.List>
        </div>

        <Form.Item className="mb-0 mt-6 pt-4 border-t border-slate-100 dark:border-slate-700/50">
          <div className="flex gap-4">
            <Button
              onClick={onClose}
              className="flex-1 h-[48px] rounded-xl font-semibold border-slate-200 dark:border-slate-700 dark:text-slate-300 dark:bg-transparent"
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
              {isEditing ? 'Update Expense' : 'Save Expense(s)'}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
}
