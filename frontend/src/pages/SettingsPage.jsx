import { useState, useEffect, useMemo } from 'react';
import {
  Card, Typography, Space, Row, Col, Avatar, Button,
  Descriptions, Divider, Statistic, List, Tag, Tabs,
  Modal, Form, Input, Table, Popconfirm, Select, Menu
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
  const [catSearch, setCatSearch] = useState('');
  const [adminTab, setAdminTab] = useState('users');
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
    } catch (err) {
      toast.error('Failed to delete category');
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
            <div style={{ fontWeight: 'bold' }}>{record.full_name}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{record.email}</div>
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
      render: (date) => <Text type="secondary">{new Date(date).toLocaleDateString()}</Text>
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
      render: (text) => <Text strong><TagsOutlined style={{ color: '#6c63ff', marginRight: '8px' }} /> {text}</Text>
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

  const profileContent = (
    <Row gutter={[32, 32]}>
      <Col xs={24} lg={16}>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <Card
            style={{ borderRadius: '24px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9', overflow: 'hidden' }}
            loading={loading}
            extra={<Button icon={<EditOutlined />} onClick={() => setEditModalVisible(true)}>Edit Profile</Button>}
            title={<Space><SettingOutlined /> Profile Settings</Space>}
          >
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '32px', marginBottom: '32px', padding: '16px' }}>
              <Avatar
                size={120}
                icon={<UserOutlined />}
                style={{ backgroundColor: 'rgba(108, 99, 255, 0.1)', color: '#6c63ff', border: '4px solid #fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile?.full_name || 'User'}`}
              />
              <div style={{ textAlign: 'left' }}>
                <Title level={3} style={{ margin: 0 }}>{profile?.full_name || 'Loading...'}</Title>
                <Text type="secondary" style={{ fontSize: '18px' }}>@{profile?.username || 'username'}</Text>
                <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <Tag icon={<CrownOutlined />} color={profile?.role === 'superadmin' ? 'gold' : profile?.role === 'premium' ? 'purple' : 'default'} style={{ borderRadius: '8px', padding: '2px 12px', border: 'none', textTransform: 'uppercase', fontWeight: 'bold' }}>
                    {profile?.role || 'Free'}
                  </Tag>
                  <Tag icon={<SafetyCertificateOutlined />} color="success" style={{ borderRadius: '8px', padding: '2px 12px', border: 'none' }}>Verified Account</Tag>
                </div>
              </div>
            </div>

            <Divider />

            <Descriptions
              column={{ xs: 1, sm: 2 }}
              layout="vertical"
              style={{ padding: '16px' }}
            >
              <Descriptions.Item label={<Space><MailOutlined /> <Text strong>Email Address</Text></Space>}>
                {profile?.email}
              </Descriptions.Item>
              <Descriptions.Item label={<Space><PhoneOutlined /> <Text strong>Mobile Number</Text></Space>}>
                {profile?.mobile || 'Not provided'}
              </Descriptions.Item>
              <Descriptions.Item label={<Space><GlobalOutlined /> <Text strong>Account Type</Text></Space>}>
                <span style={{ textTransform: 'capitalize' }}>{profile?.role} User</span>
              </Descriptions.Item>
              <Descriptions.Item label={<Space><CalendarOutlined /> <Text strong>Member Since</Text></Space>}>
                {profile ? new Date(profile.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long' }) : '--'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          <Card style={{ borderRadius: '24px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9', padding: '16px' }}>
            <Title level={5} style={{ marginBottom: '24px' }}>Data Management</Title>
            <Row gutter={[24, 24]}>
              <Col xs={24} md={12}>
                <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: '#f8fafc', border: '1px solid #f1f5f9' }}>
                  <Title level={5}>Export Your Data</Title>
                  <Paragraph type="secondary" style={{ fontSize: '12px', marginBottom: '16px' }}>
                    Download a complete backup of all your expenses in CSV format.
                  </Paragraph>
                  <Button
                    type="primary"
                    icon={<ExportOutlined />}
                    style={{ borderRadius: '12px', height: '40px', fontWeight: 'bold', background: '#6c63ff', borderColor: '#6c63ff' }}
                  >
                    Download CSV
                  </Button>
                </div>
              </Col>
              <Col xs={24} md={12}>
                <div style={{ padding: '24px', borderRadius: '16px', backgroundColor: '#fef2f2', border: '1px solid #fee2e2' }}>
                  <Title level={5} style={{ color: '#dc2626' }}>Danger Zone</Title>
                  <Paragraph type="secondary" style={{ fontSize: '12px', marginBottom: '16px' }}>
                    Irreversibly delete all your expense data.
                  </Paragraph>
                  <Button danger icon={<DeleteOutlined />} style={{ borderRadius: '12px', height: '40px', fontWeight: 'bold' }}>
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
          <Card style={{ borderRadius: '24px', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', border: '1px solid #f1f5f9', textAlign: 'center', padding: '32px 16px' }}>
            <Statistic
              title={<Text strong style={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '12px' }}>Total Tracked Spending</Text>}
              value={stats?.total_spend || 0}
              precision={2}
              prefix="₹"
              valueStyle={{ color: '#6c63ff', fontWeight: 800, fontSize: '32px' }}
            />
            <Divider style={{ margin: '24px 0' }} />
            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title={<Text style={{ fontSize: '12px', color: '#94a3b8' }}>Expenses</Text>}
                  value={stats?.expense_count || 0}
                  valueStyle={{ fontSize: '20px', fontWeight: 700 }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title={<Text style={{ fontSize: '12px', color: '#94a3b8' }}>Categories</Text>}
                  value={categories.length}
                  valueStyle={{ fontSize: '20px', fontWeight: 700 }}
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
              <Button ghost block style={{ borderRadius: '12px', height: '44px', borderColor: 'rgba(255, 255, 255, 0.3)', fontWeight: 'bold' }}>
                Upgrade to Premium
              </Button>
            </div>
          )}
        </Space>
      </Col>
    </Row>
  );

  const adminContent = (
    <Card style={{ borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', border: '1px solid #f1f5f9', overflow: 'hidden', padding: 0 }} styles={{ body: { padding: 0 } }}>
      <Row>
        <Col xs={24} md={6} style={{ backgroundColor: '#f8fafc', borderRight: '1px solid #f1f5f9', padding: '32px 8px' }}>
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
        <Col xs={24} md={18} style={{ padding: '40px 64px', backgroundColor: '#fff' }}>
          {adminTab === 'users' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <Title level={4} style={{ margin: 0 }}>User Management</Title>
                  <Text type="secondary">Manage user roles and platform access</Text>
                </div>
                <Button icon={<UsergroupAddOutlined />} style={{ borderRadius: '12px', height: '42px', padding: '0 24px' }}>Invite User</Button>
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
                  <Title level={4} style={{ margin: 0 }}>Category Management</Title>
                  <Text type="secondary">Define and organize global expense categories</Text>
                </div>
              </div>
              
              <div style={{ backgroundColor: '#fff', padding: '32px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', display: 'flex', gap: '24px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <Text strong style={{ color: '#64748b', display: 'block', marginBottom: '8px' }}>Add New Category</Text>
                  <Input 
                    placeholder="e.g. Business Travel, Investments..." 
                    value={newCatName} 
                    onChange={(e) => setNewCatName(e.target.value)}
                    onPressEnter={handleAddCategory}
                    style={{ borderRadius: '12px', height: '46px', border: '1px solid #e2e8f0' }}
                    prefix={<AppstoreOutlined style={{ color: '#94a3b8' }} />}
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
                    background: newCatName.trim() ? '#6c63ff' : '#f1f5f9', 
                    borderColor: newCatName.trim() ? '#6c63ff' : '#e2e8f0' 
                  }}
                >
                  Add Category
                </Button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Title level={5} style={{ margin: 0 }}>Category List</Title>
                  <Input 
                    placeholder="Search categories..." 
                    prefix={<SearchOutlined style={{ color: '#94a3b8' }} />}
                    onChange={(e) => setCatSearch(e.target.value)}
                    style={{ width: '280px', borderRadius: '12px', height: '40px' }}
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
            children: <Card style={{ borderRadius: '24px', border: '1px solid #f1f5f9', padding: '32px', textAlign: 'center' }}>
              <LockOutlined style={{ fontSize: 48, color: '#6c63ff' }} />
              <Title level={4} style={{ marginTop: '16px' }}>Security Settings</Title>
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
          style={{ marginTop: '16px' }}
        >
          <Form.Item name="full_name" label="Full Name" rules={[{ required: true }]}>
            <Input prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input prefix={<Text strong style={{ color: '#94a3b8' }}>@</Text>} />
          </Form.Item>
          <Form.Item name="mobile" label="Mobile Number">
            <Input prefix={<PhoneOutlined />} />
          </Form.Item>
          <Divider />
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
          style={{ marginTop: '16px' }}
        >
          <Form.Item 
            name="name" 
            label="Category Name" 
            rules={[{ required: true, message: 'Please enter a name' }]}
          >
            <Input prefix={<TagsOutlined style={{ color: '#94a3b8' }} />} placeholder="Enter name" style={{ borderRadius: '12px' }} />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: '32px' }}>
            <Button type="primary" htmlType="submit" block icon={<SaveOutlined />} style={{ borderRadius: '12px', height: '44px' }}>Update Category</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
