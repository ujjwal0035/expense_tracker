import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, Space, Divider, Row, Col } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  PhoneOutlined, 
  LoginOutlined, 
  UserAddOutlined,
  WalletFilled,
  ThunderboltFilled,
  SafetyCertificateFilled,
  PieChartFilled,
  SunOutlined,
  MoonOutlined
} from '@ant-design/icons';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useTheme } from '../context/ThemeContext';

const { Title, Text, Paragraph } = Typography;

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { isDarkMode, toggleTheme } = useTheme();

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      // Determine which identifier to use for login
      const loginIdentifier = isRegister ? values.email : values.identifier;

      if (isRegister) {
        await api.post('/auth/register', {
          email: values.email,
          password: values.password,
          full_name: values.fullName,
          username: values.username,
          mobile: values.mobile
        });
        toast.success('Account created! Logging you in...');
      }

      // Updated to send 'username_or_email' which supports both
      const { data } = await api.post('/auth/login', { 
        username_or_email: loginIdentifier, 
        password: values.password 
      });
      
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', loginIdentifier);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      let msg = 'Something went wrong';
      if (err.response?.data?.detail) {
        msg = Array.isArray(err.response.data.detail) 
          ? err.response.data.detail[0].msg 
          : err.response.data.detail;
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex transition-colors duration-300" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Theme Toggle for Login Page */}
      <div className="absolute top-8 right-8 z-50">
        <Button 
          shape="circle" 
          icon={isDarkMode ? <SunOutlined /> : <MoonOutlined />} 
          onClick={toggleTheme}
          style={{ 
            backgroundColor: 'var(--color-bg-card)', 
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)'
          }}
        />
      </div>

      {/* Left Panel - Hero Branding */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center p-12 relative bg-[#6c63ff] overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-white/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-white/10 rounded-full blur-2xl animate-pulse" />

        <div className="relative z-10 text-center max-w-lg">
          <div className="inline-flex items-center justify-center rounded-[40px] p-8 mb-10 bg-white/15 backdrop-blur-xl border border-white/20 shadow-2xl">
            <WalletFilled style={{ fontSize: 72, color: '#fff' }} />
          </div>

          <Title level={1} style={{ color: '#fff', fontSize: '64px', fontWeight: 900, marginBottom: '24px', letterSpacing: '-0.02em' }}>
            ExpenseIQ
          </Title>
          <Paragraph style={{ color: 'rgba(255,255,255,0.85)', fontSize: '20px', marginBottom: '48px', lineHeight: '1.6' }}>
            The most powerful way to track, analyze, and optimize your personal finances.
          </Paragraph>

          <div className="space-y-6 text-left">
            {[
              { icon: PieChartFilled, title: 'Deep Analytics', desc: 'Real-time charts and spending insights' },
              { icon: SafetyCertificateFilled, title: 'Bank-Grade Security', desc: 'Your data is encrypted and private' },
              { icon: ThunderboltFilled, title: 'Lightning Fast', desc: 'Bulk import months of data in one click' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-6 p-6 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/15 transition-all">
                <item.icon style={{ fontSize: 28, color: '#fff' }} />
                <div>
                  <Text strong style={{ color: '#fff', fontSize: '18px', display: 'block' }}>{item.title}</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px' }}>{item.desc}</Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Login/Register Card */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-[500px]">
          {/* Mobile View Header */}
          <div className="lg:hidden text-center mb-12">
            <Space direction="vertical" align="center">
              <div className="bg-[#6c63ff]/10 p-5 rounded-3xl inline-block mb-4">
                <WalletFilled style={{ fontSize: 40, color: '#6c63ff' }} />
              </div>
              <Title level={2} style={{ marginBottom: 0, color: 'var(--color-text-primary)' }}>ExpenseIQ</Title>
            </Space>
          </div>

          <Card 
            className="rounded-[40px] shadow-2xl border-none p-4 sm:p-8"
            style={{ 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)',
              backgroundColor: 'var(--color-bg-card)',
              borderColor: 'var(--color-border)'
            }}
          >
            <div className="mb-10 text-center sm:text-left">
              <Title level={2} style={{ marginBottom: '8px', fontWeight: 800, color: 'var(--color-text-primary)' }}>
                {isRegister ? 'Create Account' : 'Welcome Back'}
              </Title>
              <Text style={{ fontSize: '16px', color: 'var(--color-text-secondary)' }}>
                {isRegister 
                  ? 'Join thousands of users tracking their wealth.' 
                  : 'Log in to your account to continue.'}
              </Text>
            </div>

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              requiredMark={false}
              size="large"
            >
              {isRegister ? (
                <>
                  <Row gutter={16}>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="fullName"
                        label={<Text strong style={{ color: 'var(--color-text-secondary)' }}>Full Name</Text>}
                        rules={[{ required: true, message: 'Please enter your name' }]}
                      >
                        <Input prefix={<UserOutlined style={{ color: 'var(--color-text-muted)' }} />} placeholder="John Doe" style={{ borderRadius: '12px', height: '52px', backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
                      </Form.Item>
                    </Col>
                    <Col xs={24} sm={12}>
                      <Form.Item
                        name="username"
                        label={<Text strong style={{ color: 'var(--color-text-secondary)' }}>Username</Text>}
                        rules={[{ required: true, message: 'Please enter a username' }]}
                      >
                        <Input prefix={<Text strong style={{ color: 'var(--color-text-muted)' }}>@</Text>} placeholder="johndoe" style={{ borderRadius: '12px', height: '52px', backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        name="email"
                        label={<Text strong style={{ color: 'var(--color-text-secondary)' }}>Email Address</Text>}
                        rules={[
                          { required: true, message: 'Email is required' },
                          { type: 'email', message: 'Enter a valid email' }
                        ]}
                      >
                        <Input prefix={<MailOutlined style={{ color: 'var(--color-text-muted)' }} />} placeholder="name@company.com" style={{ borderRadius: '12px', height: '52px', backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
                      </Form.Item>
                    </Col>
                    <Col span={24}>
                      <Form.Item
                        name="mobile"
                        label={<Text strong style={{ color: 'var(--color-text-secondary)' }}>Mobile Number</Text>}
                      >
                        <Input prefix={<PhoneOutlined style={{ color: 'var(--color-text-muted)' }} />} placeholder="+91 00000 00000" style={{ borderRadius: '12px', height: '52px', backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
                      </Form.Item>
                    </Col>
                  </Row>
                </>
              ) : (
                <Form.Item
                  name="identifier"
                  label={<Text strong style={{ color: 'var(--color-text-secondary)' }}>Email or Username</Text>}
                  rules={[{ required: true, message: 'Email or Username is required' }]}
                >
                  <Input prefix={<UserOutlined style={{ color: 'var(--color-text-muted)' }} />} placeholder="name@email.com or username" style={{ borderRadius: '12px', height: '52px', backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
                </Form.Item>
              )}

              <Form.Item
                name="password"
                label={<Text strong style={{ color: 'var(--color-text-secondary)' }}>Password</Text>}
                rules={[
                  { required: true, message: 'Password is required' },
                  { min: 6, message: 'Minimum 6 characters' }
                ]}
              >
                <Input.Password prefix={<LockOutlined style={{ color: 'var(--color-text-muted)' }} />} placeholder="••••••••" style={{ borderRadius: '12px', height: '52px', backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
              </Form.Item>

              <Form.Item className="mt-8">
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading} 
                  block 
                  style={{ 
                    height: '56px', 
                    borderRadius: '16px', 
                    fontWeight: 'bold', 
                    fontSize: '18px', 
                    background: '#6c63ff', 
                    borderColor: '#6c63ff',
                    boxShadow: '0 10px 15px -3px rgba(108, 99, 255, 0.2)'
                  }}
                  icon={isRegister ? <UserAddOutlined /> : <LoginOutlined />}
                >
                  {isRegister ? 'Start Journey' : 'Sign In'}
                </Button>
              </Form.Item>
            </Form>

            <Divider style={{ borderColor: 'var(--color-border)' }}>
              <Text style={{ color: 'var(--color-text-muted)' }}>Or</Text>
            </Divider>

            <div className="text-center">
              <Text style={{ color: 'var(--color-text-secondary)' }}>
                {isRegister ? 'Already have an account?' : "New to ExpenseIQ?"}
              </Text>
              <Button 
                type="link" 
                className="font-bold p-0 ml-2"
                style={{ color: '#6c63ff' }}
                onClick={() => {
                  setIsRegister(!isRegister);
                  form.resetFields();
                }}
              >
                {isRegister ? 'Log In Instead' : 'Create Free Account'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
