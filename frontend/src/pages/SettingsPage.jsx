import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Card, Typography, Space, Row, Col, Avatar, Button,
  Descriptions, Divider, Statistic, Tag, Tabs,
  Modal, Form, Input, Table, Popconfirm, Select, Menu, DatePicker, InputNumber, Progress, Radio
} from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  ExportOutlined,
  DeleteOutlined,
  CalendarOutlined,
  SettingOutlined,
  LockOutlined,
  CrownOutlined,
  TeamOutlined,
  EditOutlined,
  TagsOutlined,
  PlusOutlined,
  SaveOutlined,
  AppstoreOutlined,
  UsergroupAddOutlined,
  SearchOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';
import toast from 'react-hot-toast';

const { Title, Text, Paragraph } = Typography;

const formatCurrency = (value) => {
  const amount = Math.abs(value).toLocaleString('en-IN');
  return value < 0 ? `-₹${amount}` : `₹${amount}`;
};

export default function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [dataActionLoading, setDataActionLoading] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [catSearch, setCatSearch] = useState('');
  const [adminTab, setAdminTab] = useState('users');
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'profile');
  const [budgets, setBudgets] = useState([]);
  const [budgetMonth, setBudgetMonth] = useState(dayjs());
  const [budgetLoading, setBudgetLoading] = useState(false);
  const [budgetMode, setBudgetMode] = useState('overall');
  const [form] = Form.useForm();
  const [catForm] = Form.useForm();
  const [budgetForm] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'budgets') {
      fetchBudgets();
    }
  }, [activeTab, budgetMonth]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, summaryRes, categoryRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/analytics/summary'),
        api.get('/categories/')
      ]);
      setProfile(profileRes.data);
      setStats(summaryRes.data);
      setCategories(categoryRes.data);
      
      if (profileRes.data.role === 'superadmin') {
        fetchUsers();
      }
    } catch (err) {
      console.error('Failed to fetch settings data:', err);
      toast.error('Failed to load profile settings');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setAdminLoading(true);
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setAdminLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get('/categories/');
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleUpdateProfile = async (values) => {
    try {
      const payload = {
        full_name: values.full_name,
        username: values.username,
        mobile: values.mobile,
      };
      if (values.password) payload.password = values.password;

      const { data } = await api.patch('/auth/me', payload);
      setProfile(data);
      localStorage.setItem('user', data.username);
      toast.success('Profile updated successfully');
      setEditModalVisible(false);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed');
    }
  };

  const handleUpdateRole = async (userId, newRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role?role=${newRole}`);
      toast.success(`Role updated to ${newRole}`);
      fetchUsers();
    } catch {
      toast.error('Failed to update role');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }
    
    // Simple duplicate check
    if (categories.some(c => c.name.toLowerCase() === newCatName.trim().toLowerCase())) {
      toast.error('This category already exists');
      return;
    }

    try {
      await api.post('/categories/', { name: newCatName.trim() });
      toast.success('Category added successfully');
      setNewCatName('');
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add category');
    }
  };

  const handleEditCategory = (record) => {
    setEditingCategory(record);
    catForm.setFieldsValue({ name: record.name });
    setCatModalVisible(true);
  };

  const handleUpdateCategory = async (values) => {
    try {
      await api.patch(`/categories/${editingCategory.id}`, values);
      toast.success('Category updated');
      setCatModalVisible(false);
      fetchCategories();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Update failed');
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      toast.success('Category removed');
      fetchCategories();
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const fetchBudgets = async () => {
    setBudgetLoading(true);
    try {
      const { data } = await api.get('/budgets/', {
        params: { month: budgetMonth.format('YYYY-MM') },
      });
      setBudgets(data);
    } catch (err) {
      console.error('Failed to fetch budgets:', err);
      toast.error('Failed to load budgets');
    } finally {
      setBudgetLoading(false);
    }
  };

  const handleExportData = async () => {
    setDataActionLoading(true);
    try {
      const { data } = await api.get('/expenses/export', { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'expenses_export.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Expense export downloaded');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to export expenses');
    } finally {
      setDataActionLoading(false);
    }
  };

  const handleClearData = () => {
    Modal.confirm({
      title: 'Clear all expense data?',
      content: 'This will permanently delete every expense in your account. This action cannot be undone.',
      okText: 'Clear Data',
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        setDataActionLoading(true);
        try {
          await api.delete('/expenses/clear');
          toast.success('All expenses cleared');
          fetchData();
        } catch (err) {
          toast.error(err.response?.data?.detail || 'Failed to clear expenses');
        } finally {
          setDataActionLoading(false);
        }
      },
    });
  };

  const handleCreateBudget = async (values) => {
    try {
      await api.post('/budgets/', {
        category: budgetMode === 'category' ? values.category : null,
        month: budgetMonth.format('YYYY-MM'),
        amount: values.amount,
      });
      toast.success('Budget added');
      budgetForm.resetFields();
      fetchBudgets();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add budget');
    }
  };

  const handleUpdateBudget = async (budgetId, amount) => {
    try {
      await api.patch(`/budgets/${budgetId}`, { amount });
      toast.success('Budget updated');
      fetchBudgets();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update budget');
    }
  };

  const handleDeleteBudget = async (budgetId) => {
    try {
      await api.delete(`/budgets/${budgetId}`);
      toast.success('Budget deleted');
      fetchBudgets();
    } catch {
      toast.error('Failed to delete budget');
    }
  };

  const filteredCategories = useMemo(() => {
    if (!catSearch) return categories;
    return categories.filter(c => 
      c.name.toLowerCase().includes(catSearch.toLowerCase())
    );
  }, [categories, catSearch]);

  const userColumns = [
    {
      title: 'User',
      key: 'user',
      render: (record) => (
        <Space>
          <Avatar src={`https://api.dicebear.com/7.x/initials/svg?seed=${record.full_name}`} size="small" />
          <div>
            <div style={{ fontWeight: 'bold', color: 'var(--color-text-primary)' }}>{record.full_name}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>{record.email}</div>
          </div>
        </Space>
      )
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role, record) => (
        <Select
          value={role}
          style={{ width: 120, borderRadius: '8px' }}
          onChange={(val) => handleUpdateRole(record.id, val)}
          disabled={record.id === profile?.id}
        >
          <Select.Option value="superadmin">SuperAdmin</Select.Option>
          <Select.Option value="premium">Premium</Select.Option>
          <Select.Option value="free">Free</Select.Option>
        </Select>
      )
    },
    {
      title: 'Joined',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date) => <Text style={{ color: 'var(--color-text-secondary)' }}>{new Date(date).toLocaleDateString()}</Text>
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (record) => (
        <Popconfirm title="Delete this user?" onConfirm={() => handleDeleteUser(record.id)} disabled={record.id === profile?.id}>
          <Button type="text" danger icon={<DeleteOutlined />} disabled={record.id === profile?.id} />
        </Popconfirm>
      )
    }
  ];

  const categoryColumns = [
    {
      title: 'Category Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <Text strong style={{ color: 'var(--color-text-primary)' }}><TagsOutlined style={{ color: '#6c63ff', marginRight: '8px' }} /> {text}</Text>
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      width: 150,
      render: (record) => (
        <Space>
          <Button type="text" icon={<EditOutlined style={{ color: '#3b82f6' }} />} onClick={() => handleEditCategory(record)} />
          <Popconfirm title="Delete category?" onConfirm={() => handleDeleteCategory(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const budgetColumns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (text, record) => (
        <Space>
          <Tag color={record.budget_type === 'overall' ? 'blue' : 'purple'} style={{ borderRadius: 8 }}>
            {record.budget_type === 'overall' ? 'Overall' : 'Category'}
          </Tag>
          <Text strong style={{ color: 'var(--color-text-primary)' }}>
            {record.budget_type === 'overall' ? 'All Categories' : text}
          </Text>
        </Space>
      ),
    },
    {
      title: 'Budget',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount, record) => (
        <InputNumber
          min={1}
          precision={2}
          prefix="₹"
          defaultValue={amount}
          onPressEnter={(event) => handleUpdateBudget(record.id, Number(event.target.value.replace(/[^0-9.]/g, '')))}
          onBlur={(event) => handleUpdateBudget(record.id, Number(event.target.value.replace(/[^0-9.]/g, '')))}
          style={{ width: 160 }}
        />
      ),
    },
    {
      title: 'Used',
      key: 'used',
      render: (record) => {
        const color = record.status === 'over' ? '#ef4444' : record.status === 'warning' ? '#f59e0b' : '#10b981';
        return (
          <div style={{ minWidth: 220 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ color: 'var(--color-text-secondary)' }}>₹{record.spent.toLocaleString('en-IN')}</Text>
              <Text style={{ color }}>{record.percentage}%</Text>
            </div>
            <Progress percent={Math.min(record.percentage, 100)} showInfo={false} strokeColor={color} />
          </div>
        );
      },
    },
    {
      title: 'Remaining',
      key: 'remaining',
      render: (record) => {
        const remaining = Number(record.amount || 0) - Number(record.spent || 0);
        return (
          <Text style={{ color: remaining < 0 ? '#ef4444' : 'var(--color-text-primary)' }}>
            {formatCurrency(remaining)}
          </Text>
        );
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      align: 'right',
      render: (record) => (
        <Popconfirm title="Delete this budget?" onConfirm={() => handleDeleteBudget(record.id)}>
          <Button type="text" danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  const budgetContent = (
    <Card style={{ borderRadius: '24px', borderColor: 'var(--color-border)' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <Title level={4} style={{ margin: 0, color: 'var(--color-text-primary)' }}>Monthly Budgets</Title>
            <Text style={{ color: 'var(--color-text-secondary)' }}>Set category limits and track monthly progress</Text>
          </div>
          <DatePicker
            picker="month"
            value={budgetMonth}
            onChange={(value) => setBudgetMonth(value || dayjs())}
            format="MMMM YYYY"
            style={{ width: 180, borderRadius: 12 }}
          />
        </div>

        <Form
          form={budgetForm}
          layout="inline"
          onFinish={handleCreateBudget}
          style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}
        >
          <Form.Item label="Budget Type">
            <Radio.Group
              value={budgetMode}
              onChange={(event) => {
                setBudgetMode(event.target.value);
                budgetForm.setFieldsValue({ category: undefined });
              }}
              optionType="button"
              buttonStyle="solid"
              options={[
                { label: 'Overall', value: 'overall' },
                { label: 'Category', value: 'category' },
              ]}
            />
          </Form.Item>
          {budgetMode === 'category' && (
            <Form.Item name="category" label="Category" rules={[{ required: true, message: 'Choose a category' }]}>
              <Select
                placeholder="Select category"
                style={{ width: 220 }}
                options={categories.map((cat) => ({ label: cat.name, value: cat.name }))}
              />
            </Form.Item>
          )}
          <Form.Item name="amount" label="Monthly Limit" rules={[{ required: true, message: 'Enter an amount' }]}>
            <InputNumber min={1} precision={2} prefix="₹" placeholder="0.00" style={{ width: 180 }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" icon={<PlusOutlined />} style={{ background: '#6c63ff', borderColor: '#6c63ff' }}>
              Add Budget
            </Button>
          </Form.Item>
        </Form>

        <Table
          dataSource={budgets}
          columns={budgetColumns}
          rowKey="id"
          loading={budgetLoading}
          pagination={false}
          scroll={{ x: true }}
        />
      </div>
    </Card>
  );

  const profileContent = (
    <Row gutter={[32, 32]}>
      <Col xs={24} lg={16}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Card
            style={{ borderRadius: '24px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', borderColor: 'var(--color-border)', overflow: 'hidden' }}
            loading={loading}
            extra={<Button icon={<EditOutlined />} onClick={() => setEditModalVisible(true)}>Edit Profile</Button>}
            title={<Space style={{ color: 'var(--color-text-primary)' }}><SettingOutlined /> Profile Settings</Space>}
          >
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '32px', marginBottom: '32px', padding: '16px' }}>
              <Avatar
                size={120}
                icon={<UserOutlined />}
                style={{ backgroundColor: 'rgba(108, 99, 255, 0.1)', color: '#6c63ff', border: '4px solid var(--color-bg-card)', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile?.full_name || 'User'}`}
              />
              <div style={{ textAlign: 'left' }}>
                <Title level={3} style={{ margin: 0, color: 'var(--color-text-primary)' }}>{profile?.full_name || 'Loading...'}</Title>
                <Text style={{ fontSize: '18px', color: 'var(--color-text-secondary)' }}>@{profile?.username || 'username'}</Text>
                <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <Tag icon={<CrownOutlined />} color={profile?.role === 'superadmin' ? 'gold' : profile?.role === 'premium' ? 'purple' : 'default'} style={{ borderRadius: '8px', padding: '2px 12px', border: 'none', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    {profile?.role || 'Free'}
                  </Tag>
                  <Tag icon={<SafetyCertificateOutlined />} color="success" style={{ borderRadius: '8px', padding: '2px 12px', border: 'none' }}>Verified Account</Tag>
                </div>
              </div>
            </div>

            <Divider style={{ borderColor: 'var(--color-border)' }} />

            <Descriptions
              column={{ xs: 1, sm: 2 }}
              layout="vertical"
              style={{ padding: '16px' }}
            >
              <Descriptions.Item label={<Space style={{ color: 'var(--color-text-secondary)' }}><MailOutlined /> <Text strong style={{ color: 'inherit' }}>Email Address</Text></Space>}>
                <Text style={{ color: 'var(--color-text-primary)' }}>{profile?.email}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Space style={{ color: 'var(--color-text-secondary)' }}><PhoneOutlined /> <Text strong style={{ color: 'inherit' }}>Mobile Number</Text></Space>}>
                <Text style={{ color: 'var(--color-text-primary)' }}>{profile?.mobile || 'Not provided'}</Text>
              </Descriptions.Item>
              <Descriptions.Item label={<Space style={{ color: 'var(--color-text-secondary)' }}><GlobalOutlined /> <Text strong style={{ color: 'inherit' }}>Account Type</Text></Space>}>
                <span style={{ textTransform: 'capitalize', color: 'var(--color-text-primary)' }}>{profile?.role} User</span>
              </Descriptions.Item>
              <Descriptions.Item label={<Space style={{ color: 'var(--color-text-secondary)' }}><CalendarOutlined /> <Text strong style={{ color: 'inherit' }}>Member Since</Text></Space>}>
                <Text style={{ color: 'var(--color-text-primary)' }}>{profile ? new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : '--'}</Text>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card style={{ borderRadius: '24px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', borderColor: 'var(--color-border)', padding: '16px' }}>
            <Title level={5} style={{ marginBottom: '24px', color: 'var(--color-text-primary)' }}>Data Management</Title>
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
                  <Title level={5} style={{ color: 'var(--color-text-primary)' }}>Export Your Data</Title>
                  <Paragraph style={{ fontSize: '12px', marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
                    Download a complete backup of all your expenses in CSV format.
                  </Paragraph>
                  <Button
                    type="primary"
                    icon={<ExportOutlined />}
                    onClick={handleExportData}
                    loading={dataActionLoading}
                    style={{ borderRadius: '12px', height: '40px', fontWeight: 'bold', background: '#6c63ff', borderColor: '#6c63ff' }}
                  >
                    Download CSV
                  </Button>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                  <Title level={5} style={{ color: '#dc2626' }}>Danger Zone</Title>
                  <Paragraph style={{ fontSize: '12px', marginBottom: '16px', color: 'var(--color-text-secondary)' }}>
                    Irreversibly delete all your expense data.
                  </Paragraph>
                  <Button danger icon={<DeleteOutlined />} onClick={handleClearData} loading={dataActionLoading} style={{ borderRadius: '12px', height: '40px', fontWeight: 'bold' }}>
                    Clear All Data
                  </Button>
                </div>
              </Col>
            </Row>
          </Card>
        </Space>
      </Col>

      <Col xs={24} lg={8}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Card style={{ borderRadius: '24px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', borderColor: 'var(--color-border)', textAlign: 'center', padding: '32px 16px' }}>
            <Statistic
              title={<Text strong style={{ color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '12px' }}>Total Tracked Spending</Text>}
              value={stats?.total_spend || 0}
              precision={2}
              prefix="₹"
              valueStyle={{ color: '#6c63ff', fontWeight: 800, fontSize: '32px' }}
            />
            <Divider style={{ margin: '24px 0', borderColor: 'var(--color-border)' }} />
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title={<Text style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Expenses</Text>}
                  value={stats?.expense_count || 0}
                  valueStyle={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<Text style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Categories</Text>}
                  value={categories.length}
                  valueStyle={{ fontSize: '20px', fontWeight: 700, color: 'var(--color-text-primary)' }}
                />
              </Col>
            </Row>
          </Card>

          {profile?.role !== 'premium' && profile?.role !== 'superadmin' && (
            <div style={{ background: 'linear-gradient(to bottom right, #6c63ff, #a78bfa)', padding: '32px', borderRadius: '24px', color: 'white', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
              <CrownOutlined style={{ position: 'absolute', right: '-16px', bottom: '-16px', color: 'rgba(255, 255, 255, 0.1)', fontSize: '128px' }} />
              <Title level={4} style={{ color: '#fff', marginBottom: '8px' }}>Pro Features</Title>
              <Paragraph style={{ color: 'rgba(255, 255, 255, 0.7)', marginBottom: '24px' }}>
                Unlock advanced forecasting, multiple accounts, and custom export formats.
              </Paragraph>
              <Button ghost block disabled style={{ borderRadius: '12px', height: '44px', borderColor: 'rgba(255, 255, 255, 0.3)', fontWeight: 'bold' }}>
                Premium Coming Soon
              </Button>
            </div>
          )}
        </Space>
      </Col>
    </Row>
  );

  const adminContent = (
    <Card style={{ borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', borderColor: 'var(--color-border)', overflow: 'hidden', padding: 0 }} styles={{ body: { padding: 0 } }}>
      <Row>
        <Col xs={24} md={6} style={{ backgroundColor: 'var(--color-bg-primary)', borderRight: '1px solid var(--color-border)', padding: '32px 8px' }}>
          <Menu
            mode="inline"
            selectedKeys={[adminTab]}
            onClick={(e) => setAdminTab(e.key)}
            style={{ backgroundColor: 'transparent', border: 'none', padding: '0 16px' }}
            items={[
              {
                key: 'users',
                icon: <TeamOutlined />,
                label: 'User Management',
              },
              {
                key: 'categories',
                icon: <TagsOutlined />,
                label: 'Category Management',
              },
              {
                type: 'divider'
              },
              {
                key: 'logs',
                icon: <SafetyCertificateOutlined />,
                label: 'Security Logs',
                disabled: true
              }
            ]}
          />
        </Col>
        <Col xs={24} md={18} style={{ padding: '40px 64px', backgroundColor: 'var(--color-bg-card)' }}>
          {adminTab === 'users' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Title level={4} style={{ margin: 0, color: 'var(--color-text-primary)' }}>User Management</Title>
                  <Text style={{ color: 'var(--color-text-secondary)' }}>Manage user roles and platform access</Text>
                </div>
                <Button icon={<UsergroupAddOutlined />} disabled style={{ borderRadius: '12px', height: '42px', padding: '0 24px' }}>Invite Coming Soon</Button>
              </div>
              <Table
                dataSource={users}
                columns={userColumns}
                loading={adminLoading}
                rowKey="id"
                pagination={{ pageSize: 10 }}
                style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', borderRadius: '16px', overflow: 'hidden' }}
              />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Title level={4} style={{ margin: 0, color: 'var(--color-text-primary)' }}>Category Management</Title>
                  <Text style={{ color: 'var(--color-text-secondary)' }}>Define and organize global expense categories</Text>
                </div>
              </div>
              
              <div style={{ backgroundColor: 'var(--color-bg-card)', padding: '32px', borderRadius: '24px', border: '1px solid var(--color-border)', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <Text strong style={{ color: 'var(--color-text-secondary)', display: 'block', marginBottom: '8px' }}>Add New Category</Text>
                  <Input 
                    placeholder="e.g. Business Travel, Investments..." 
                    value={newCatName} 
                    onChange={(e) => setNewCatName(e.target.value)}
                    onPressEnter={handleAddCategory}
                    style={{ borderRadius: '12px', height: '46px', border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
                    prefix={<AppstoreOutlined style={{ color: 'var(--color-text-muted)' }} />}
                  />
                </div>
                <Button 
                  type="primary" 
                  icon={<PlusOutlined />} 
                  onClick={handleAddCategory} 
                  disabled={!newCatName.trim()}
                  style={{ 
                    borderRadius: '12px', 
                    height: '46px', 
                    padding: '0 32px', 
                    fontWeight: 'bold', 
                    background: newCatName.trim() ? '#6c63ff' : 'var(--color-bg-primary)', 
                    borderColor: newCatName.trim() ? '#6c63ff' : 'var(--color-border)',
                    color: newCatName.trim() ? '#fff' : 'var(--color-text-muted)'
                  }}
                >
                  Add Category
                </Button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Title level={5} style={{ margin: 0, color: 'var(--color-text-primary)' }}>Category List</Title>
                  <Input 
                    placeholder="Search categories..." 
                    prefix={<SearchOutlined style={{ color: 'var(--color-text-muted)' }} />}
                    onChange={(e) => setCatSearch(e.target.value)}
                    style={{ width: '280px', borderRadius: '12px', height: '40px', backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                  />
                </div>
                <Table
                  dataSource={filteredCategories}
                  columns={categoryColumns}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  style={{ boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)', borderRadius: '16px', overflow: 'hidden' }}
                />
              </div>
            </div>
          )}
        </Col>
      </Row>
    </Card>
  );

  return (
    <div style={{ padding: '40px 16px', maxWidth: '1152px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      <div>
        <Title level={2} style={{ color: 'var(--color-text-primary)' }}>Account Settings</Title>
        <Text style={{ color: 'var(--color-text-secondary)' }}>Manage your profile, security and preferences</Text>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          setActiveTab(key);
          setSearchParams(key === 'profile' ? {} : { tab: key });
        }}
        className="premium-tabs"
        items={[
          {
            key: 'profile',
            label: <Space style={{ color: 'inherit' }}><UserOutlined /> Profile</Space>,
            children: profileContent
          },
          {
            key: 'budgets',
            label: <Space style={{ color: 'inherit' }}><AppstoreOutlined /> Budgets</Space>,
            children: budgetContent
          },
          {
            key: 'security',
            label: <Space style={{ color: 'inherit' }}><LockOutlined /> Security</Space>,
            children: <Card style={{ borderRadius: '24px', border: '1px solid var(--color-border)', padding: '32px', textAlign: 'center' }}>
              <LockOutlined style={{ fontSize: 48, color: '#6c63ff' }} />
              <Title level={4} style={{ marginTop: '16px', color: 'var(--color-text-primary)' }}>Security Settings</Title>
              <Paragraph style={{ color: 'var(--color-text-secondary)' }}>Change your password and manage active sessions.</Paragraph>
              <Button type="primary" onClick={() => setEditModalVisible(true)}>Change Password</Button>
            </Card>
          },
          ...(profile?.role === 'superadmin' ? [{
            key: 'admin',
            label: <Space style={{ color: 'inherit' }}><SafetyCertificateOutlined /> Admin Panel</Space>,
            children: adminContent
          }] : [])
        ]}
      />

      {/* Edit Profile Modal */}
      <Modal
        title="Edit Profile"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        centered
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={profile}
          onFinish={handleUpdateProfile}
          style={{ marginTop: '16px' }}
        >
          <Form.Item name="full_name" label="Full Name" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input prefix={<Text strong style={{ color: 'var(--color-text-muted)' }}>@</Text>} />
          </Form.Item>
          <Form.Item name="mobile" label="Mobile Number">
            <Input prefix={<PhoneOutlined />} />
          </Form.Item>
          <Divider style={{ borderColor: 'var(--color-border)' }} />
          <Form.Item name="password" label="New Password (Leave blank to keep current)">
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
            <Button type="primary" htmlType="submit" block loading={loading}>Save Changes</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        title={<Space style={{ color: 'var(--color-text-primary)' }}><TagsOutlined /> Edit Category</Space>}
        open={catModalVisible}
        onCancel={() => setCatModalVisible(false)}
        footer={null}
        centered
        width={400}
      >
        <Form
          form={catForm}
          layout="vertical"
          onFinish={handleUpdateCategory}
          style={{ marginTop: '16px' }}
        >
          <Form.Item 
            name="name" 
            label="Category Name" 
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input prefix={<TagsOutlined style={{ color: 'var(--color-text-muted)' }} />} placeholder="Enter name" style={{ borderRadius: '12px' }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: '32px' }}>
            <Button type="primary" htmlType="submit" block icon={<SaveOutlined />} style={{ borderRadius: '12px', height: '44px' }}>Update Category</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
