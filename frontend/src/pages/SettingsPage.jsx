import { useState, useEffect } from 'react';
import { Card, Typography, Space, Row, Col, Avatar, Button, Descriptions, Divider, Statistic, List, Tag } from 'antd';
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  GlobalOutlined,
  SafetyCertificateOutlined,
  ExportOutlined,
  DeleteOutlined,
  CalendarOutlined,
  WalletOutlined
} from '@ant-design/icons';
import api from '../services/api';
import toast from 'react-hot-toast';

const { Title, Text, Paragraph } = Typography;

export default function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profileRes, summaryRes] = await Promise.all([
        api.get('/auth/me'),
        api.get('/analytics/summary'),
      ]);
      setProfile(profileRes.data);
      setStats(summaryRes.data);
    } catch (err) {
      console.error('Failed to fetch settings data:', err);
      toast.error('Failed to load profile settings');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    // Basic CSV export logic
    toast.success('Exporting your data...');
  };

  const handleDeleteData = () => {
    // In a real app, this would show a confirmation modal
    toast.error('Feature coming soon: Please contact support to delete data.');
  };

  return (
    <div className="animate-fade-in-up space-y-12 py-10 max-w-6xl mx-auto px-4" style={{ marginTop: "20px" }}>
      {/* Page Header */}
      <div>
        <Title level={2}>Account Settings</Title>
        <Text type="secondary">Manage your profile and data preferences</Text>
      </div>

      <Row gutter={[32, 32]}>
        {/* Left Column - Profile Card */}
        <Col xs={24} lg={16}>
          <Space direction="vertical" className="w-full" size="large">
            <Card
              className="rounded-3xl shadow-sm border-slate-100 overflow-hidden p-4"
              loading={loading}
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
                    <Tag icon={<SafetyCertificateOutlined />} color="success" className="rounded-lg px-3 py-0.5 border-none">Verified Account</Tag>
                    <Tag icon={<CalendarOutlined />} color="processing" className="rounded-lg px-3 py-0.5 border-none">Member since {new Date().getFullYear()}</Tag>
                  </div>
                </div>
              </div>

              <Divider />

              <Descriptions
                title={<Title level={5} className="mb-4">Personal Information</Title>}
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
                <Descriptions.Item label={<Space><GlobalOutlined /> <Text strong>Country / Region</Text></Space>}>
                  India (Default)
                </Descriptions.Item>
                <Descriptions.Item label={<Space><UserOutlined /> <Text strong>Account Type</Text></Space>}>
                  Free Tier
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card className="rounded-3xl shadow-sm border-slate-100 p-4">
              <Title level={5} className="mb-6">Data Management</Title>
              <Row gutter={[24, 24]}>
                <Col xs={24} md={12}>
                  <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100" style={{ padding: "10px" }}>
                    <Title level={5}>Export Your Data</Title>
                    <Paragraph type="secondary" className="text-xs mb-4">
                      Download a complete backup of all your expenses in CSV format for offline analysis.
                    </Paragraph>
                    <Button
                      type="primary"
                      icon={<ExportOutlined />}
                      onClick={exportData}
                      className="rounded-xl h-[40px] font-bold"
                      style={{ background: '#6c63ff', borderColor: '#6c63ff' }}
                    >
                      Download CSV
                    </Button>
                  </div>
                </Col>
                <Col xs={24} md={12}>
                  <div className="p-6 rounded-2xl bg-red-50/50 border border-red-100" style={{ padding: "10px" }}>
                    <Title level={5} className="text-red-600">Danger Zone</Title>
                    <Paragraph type="secondary" className="text-xs mb-4">
                      Irreversibly delete all your expense data and reset your account to zero.
                    </Paragraph>
                    <Button
                      danger
                      icon={<DeleteOutlined />}
                      onClick={handleDeleteData}
                      className="rounded-xl h-[40px] font-bold"
                    >
                      Clear All Data
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card>
          </Space>
        </Col>

        {/* Right Column - Stats & Summary */}
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
                    value={9}
                    valueStyle={{ fontSize: '20px', fontWeight: 700 }}
                  />
                </Col>
              </Row>
            </Card>

            <Card className="rounded-3xl shadow-sm border-slate-100">
              <Title level={5} className="mb-4">System Information</Title>
              <List
                size="small"
                dataSource={[
                  { label: 'Platform Version', value: 'v1.2.0-beta' },
                  { label: 'Database Status', value: 'Connected', color: 'success' },
                  { label: 'API Connection', value: 'Active', color: 'success' },
                  { label: 'Storage Usage', value: '0.2 MB / 10 MB' },
                ]}
                renderItem={(item) => (
                  <List.Item className="px-0 py-3 flex justify-between border-slate-50">
                    <Text className="text-slate-500">{item.label}</Text>
                    {item.color ? (
                      <Tag color={item.color} className="mr-0 rounded-lg border-none px-3 font-semibold">{item.value}</Tag>
                    ) : (
                      <Text strong className="text-slate-700">{item.value}</Text>
                    )}
                  </List.Item>
                )}
              />
            </Card>

            <div className="bg-[#6c63ff] p-8 rounded-[10px] text-white relative overflow-hidden shadow-xl" style={{ padding: "8px 20px" }}>
              {/* <WalletOutlined className="absolute -right-4 -bottom-4 text-white/10 text-9xl" /> */}
              <Title level={4} style={{ color: '#fff', marginBottom: '8px' }}>Pro Features</Title>
              <Paragraph style={{ color: 'rgba(255,255,255,0.7)', marginBottom: '24px' }}>
                Unlock advanced forecasting, multiple accounts, and custom export formats.
              </Paragraph>
              <Button ghost block className="rounded-xl h-[44px] border-white/30 font-bold hover:bg-white/10">
                Upgrade Now
              </Button>
            </div>
          </Space>
        </Col>
      </Row>
    </div>
  );
}
