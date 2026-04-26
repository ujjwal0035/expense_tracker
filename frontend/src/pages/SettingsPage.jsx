import { useState, useEffect } from 'react';
import {
  Card, Typography, Space, Row, Col, Avatar, Button,
  Descriptions, Divider, Statistic, List, Tag, Tabs,
  Modal, Form, Input, Table, Popconfirm, Select
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
  SaveOutlined
} from '@ant-design/icons';
import api from '../services/api';
import toast from 'react-hot-toast';

const { Title, Text, Paragraph } = Typography;

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [catModalVisible, setCatModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [form] = Form.useForm();
  const [catForm] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, []);

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
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted');
      fetchUsers();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    try {
      await api.post('/categories/', { name: newCatName });
      toast.success('Category added');
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
    } catch (err) {
      toast.error('Failed to delete category');
    }
  };

  const userColumns = [
    {
      title: 'User',
      key: 'user',
      render: (record) => (
        <Space>
          <Avatar src={`https://api.dicebear.com/7.x/initials/svg?seed=${record.full_name}`} size="small" />
          <div>
            <div className="font-bold">{record.full_name}</div>
            <div className="text-xs text-slate-400">{record.email}</div>
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
          style={{ width: 120 }}
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
      render: (date) => new Date(date).toLocaleDateString()
    },
    {
      title: 'Actions',
      key: 'actions',
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
      render: (text) => <Text strong><TagsOutlined style={{ color: '#6c63ff' }} className="mr-2" /> {text}</Text>
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (record) => (
        <Space>
          <Button type="text" icon={<EditOutlined className="text-blue-500" />} onClick={() => handleEditCategory(record)} />
          <Popconfirm title="Delete category?" onConfirm={() => handleDeleteCategory(record.id)}>
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  const profileContent = (
    <Row gutter={[32, 32]}>
      <Col xs={24} lg={16}>
        <Space direction="vertical" className="w-full" size="large">
          <Card
            className="rounded-3xl shadow-sm border-slate-100 overflow-hidden"
            loading={loading}
            extra={<Button icon={<EditOutlined />} onClick={() => setEditModalVisible(true)}>Edit Profile</Button>}
            title={<Space><SettingOutlined /> Profile Settings</Space>}
          >
            <div className="flex flex-col sm:flex-row items-center gap-8 mb-8 p-4">
              <Avatar
                size={120}
                icon={<UserOutlined />}
                className="bg-[#6c63ff]/10 text-[#6c63ff] border-4 border-white shadow-xl"
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile?.full_name || 'User'}`}
              />
              <div className="text-center sm:text-left">
                <Title level={3} style={{ margin: 0 }}>{profile?.full_name || 'Loading...'}</Title>
                <Text type="secondary" className="text-lg">@{profile?.username || 'username'}</Text>
                <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
                  <Tag icon={<CrownOutlined />} color={profile?.role === 'superadmin' ? 'gold' : profile?.role === 'premium' ? 'purple' : 'default'} className="rounded-lg px-3 py-0.5 border-none uppercase font-bold">
                    {profile?.role || 'Free'}
                  </Tag>
                  <Tag icon={<SafetyCertificateOutlined />} color="success" className="rounded-lg px-3 py-0.5 border-none">Verified Account</Tag>
                </div>
              </div>
            </div>

            <Divider />

            <Descriptions
              column={{ xs: 1, sm: 2 }}
              layout="vertical"
              className="p-4"
            >
              <Descriptions.Item label={<Space><MailOutlined /> <Text strong>Email Address</Text></Space>}>
                {profile?.email}
              </Descriptions.Item>
              <Descriptions.Item label={<Space><PhoneOutlined /> <Text strong>Mobile Number</Text></Space>}>
                {profile?.mobile || 'Not provided'}
              </Descriptions.Item>
              <Descriptions.Item label={<Space><GlobalOutlined /> <Text strong>Account Type</Text></Space>}>
                <span className="capitalize">{profile?.role} User</span>
              </Descriptions.Item>
              <Descriptions.Item label={<Space><CalendarOutlined /> <Text strong>Member Since</Text></Space>}>
                {profile ? new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : '--'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card className="rounded-3xl shadow-sm border-slate-100 p-4">
            <Title level={5} className="mb-6">Data Management</Title>
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100" style={{ padding: '15px' }}>
                  <Title level={5}>Export Your Data</Title>
                  <Paragraph type="secondary" className="text-xs mb-4">
                    Download a complete backup of all your expenses in CSV format.
                  </Paragraph>
                  <Button
                    type="primary"
                    icon={<ExportOutlined />}
                    className="rounded-xl h-[40px] font-bold"
                    style={{ background: '#6c63ff', borderColor: '#6c63ff' }}
                  >
                    Download CSV
                  </Button>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div className="p-6 rounded-2xl bg-red-50/50 border border-red-100" style={{ padding: '15px' }}>
                  <Title level={5} className="text-red-600">Danger Zone</Title>
                  <Paragraph type="secondary" className="text-xs mb-4">
                    Irreversibly delete all your expense data.
                  </Paragraph>
                  <Button danger icon={<DeleteOutlined />} className="rounded-xl h-[40px] font-bold">
                    Clear All Data
                  </Button>
                </div>
              </Col>
            </Row>
          </Card>
        </Space>
      </Col>

      <Col xs={24} lg={8}>
        <Space direction="vertical" className="w-full" size="large">
          <Card className="rounded-3xl shadow-sm border-slate-100 text-center py-8">
            <Statistic
              title={<Text strong className="text-slate-500 uppercase tracking-widest text-xs">Total Tracked Spending</Text>}
              value={stats?.total_spend || 0}
              precision={2}
              prefix="₹"
              valueStyle={{ color: '#6c63ff', fontWeight: 800, fontSize: '32px' }}
            />
            <Divider className="my-6" />
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title={<Text className="text-xs text-slate-400">Expenses</Text>}
                  value={stats?.expense_count || 0}
                  valueStyle={{ fontSize: '20px', fontWeight: 700 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<Text className="text-xs text-slate-400">Categories</Text>}
                  value={categories.length}
                  valueStyle={{ fontSize: '20px', fontWeight: 700 }}
                />
              </Col>
            </Row>
          </Card>

          {profile?.role !== 'premium' && profile?.role !== 'superadmin' && (
            <div className="bg-gradient-to-br from-[#6c63ff] to-[#a78bfa] p-8 rounded-3xl text-white relative overflow-hidden shadow-xl">
              <CrownOutlined className="absolute -right-4 -bottom-4 text-white/10 text-9xl" />
              <Title level={4} style={{ color: '#fff', marginBottom: '8px' }}>Pro Features</Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>
                Unlock advanced forecasting, multiple accounts, and custom export formats.
              </Paragraph>
              <Button ghost block className="rounded-xl h-[44px] border-white/30 font-bold hover:bg-white/10">
                Upgrade to Premium
              </Button>
            </div>
          )}
        </Space>
      </Col>
    </Row>
  );

  const adminContent = (
    <Space direction="vertical" className="w-full" size="large">
      <Card className="rounded-3xl shadow-sm border-slate-100" title={<Space><TeamOutlined /> User Management</Space>}>
        <Table
          dataSource={users}
          columns={userColumns}
          loading={adminLoading}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>

      <Card 
        className="rounded-3xl shadow-sm border-slate-100" 
        title={<Space><TagsOutlined /> Category Management</Space>}
        extra={
          <div className="flex gap-2">
            <Input 
              placeholder="New category name" 
              value={newCatName} 
              onChange={(e) => setNewCatName(e.target.value)}
              onPressEnter={handleAddCategory}
              className="rounded-xl"
              style={{ width: 200 }}
            />
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAddCategory} className="rounded-xl">Add</Button>
          </div>
        }
      >
        <Table
          dataSource={categories}
          columns={categoryColumns}
          rowKey="id"
          pagination={{ pageSize: 5 }}
        />
      </Card>
    </Space>
  );

  return (
    <div className="animate-fade-in-up space-y-8 py-10 max-w-6xl mx-auto px-4">
      <div>
        <Title level={2}>Account Settings</Title>
        <Text type="secondary">Manage your profile, security and preferences</Text>
      </div>

      <Tabs
        defaultActiveKey="profile"
        className="premium-tabs"
        items={[
          {
            key: 'profile',
            label: <Space><UserOutlined /> Profile</Space>,
            children: profileContent
          },
          {
            key: 'security',
            label: <Space><LockOutlined /> Security</Space>,
            children: <Card className="rounded-3xl shadow-sm border-slate-100 p-8 text-center">
              <LockOutlined style={{ fontSize: 48, color: '#6c63ff' }} />
              <Title level={4} className="mt-4">Security Settings</Title>
              <Paragraph>Change your password and manage active sessions.</Paragraph>
              <Button type="primary" onClick={() => setEditModalVisible(true)}>Change Password</Button>
            </Card>
          },
          ...(profile?.role === 'superadmin' ? [{
            key: 'admin',
            label: <Space><SafetyCertificateOutlined /> Admin Panel</Space>,
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
          className="mt-4"
        >
          <Form.Item name="full_name" label="Full Name" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input prefix={<Text strong className="text-slate-400">@</Text>} />
          </Form.Item>
          <Form.Item name="mobile" label="Mobile Number">
            <Input prefix={<PhoneOutlined />} />
          </Form.Item>
          <Divider />
          <Form.Item name="password" label="New Password (Leave blank to keep current)">
            <Input.Password prefix={<LockOutlined />} />
          </Form.Item>
          <Form.Item className="mb-0 mt-6">
            <Button type="primary" htmlType="submit" block loading={loading}>Save Changes</Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Category Modal */}
      <Modal
        title={<Space><TagsOutlined /> Edit Category</Space>}
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
          className="mt-4"
        >
          <Form.Item 
            name="name" 
            label="Category Name" 
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input prefix={<TagsOutlined className="text-slate-400" />} placeholder="Enter name" className="rounded-xl" />
          </Form.Item>
          <Form.Item className="mb-0 mt-8">
            <Button type="primary" htmlType="submit" block icon={<SaveOutlined />} className="rounded-xl h-[44px]">Update Category</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
