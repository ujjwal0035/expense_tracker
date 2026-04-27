import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Wallet, Menu, X, Sun, Moon } from 'lucide-react';
import { Dropdown, Avatar, Space, Typography, Switch } from 'antd';
import {
  HomeOutlined,
  BarChartOutlined,
  CloudUploadOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  DownOutlined
} from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';

const { Text } = Typography;

export default function TopBar() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();
  const userEmail = localStorage.getItem('user') || 'User';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    {
      key: 'profile',
      label: (
        <div className="px-1 py-1">
          <Text strong style={{ display: 'block', color: 'var(--color-text-primary)' }}>{userEmail.split('@')[0]}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{userEmail}</Text>
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'theme',
      label: (
        <div className="flex items-center justify-between min-w-[160px]" onClick={(e) => e.stopPropagation()}>
          <Space>
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </Space>
          <Switch
            size="small"
            checked={isDarkMode}
            onChange={toggleTheme}
          />
        </div>
      ),
    },
    {
      key: 'settings',
      label: 'Account Settings',
      icon: <SettingOutlined />,
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: 'Logout',
      icon: <LogoutOutlined />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  const navLinks = [
    { name: 'Home', path: '/dashboard', icon: HomeOutlined },
    { name: 'Analysis', path: '/analysis', icon: BarChartOutlined },
    { name: 'File Upload', path: '/upload', icon: CloudUploadOutlined },
  ];

  return (
    <header
      className="sticky top-0 z-50 border-b transition-all duration-300"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderColor: 'var(--color-border)',
        boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
      }}
    >
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">

          {/* Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer"
            style={{ marginLeft: "20px" }}
            onClick={() => navigate('/dashboard')}
          >
            <div className="rounded-xl p-2 bg-gradient-to-br from-[#6c63ff] to-[#a78bfa]">
              <Wallet size={24} color="white" />
            </div>
            <span className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>ExpenseIQ</span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-12">
            {navLinks.map((link) => (
              <div key={link.path} style={{ marginRight: "20px" }}>
                <NavLink
                  to={link.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 text-sm font-semibold transition-colors border-b-2 ${isActive
                      ? 'border-[#6c63ff] text-[#6c63ff]'
                      : 'border-transparent text-slate-500 hover:text-[#6c63ff]'
                    }`
                  }
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <link.icon style={{ fontSize: 18 }} />
                  {link.name}
                </NavLink>
              </div>
            ))}
          </nav>

          {/* User Profile Dropdown (Desktop) */}
          <div className="hidden md:flex items-center gap-6" style={{ marginRight: "20px" }}>
            <Dropdown menu={{ items: menuItems }} placement="bottomRight" arrow trigger={['click']}>
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl transition-all cursor-pointer" style={{ backgroundColor: 'var(--color-bg-primary)', padding: "5px 10px" }}>
                <Avatar
                  size="default"
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${userEmail}`}
                />
                <Text strong className="text-sm hidden lg:block" style={{ color: 'var(--color-text-primary)' }}>{userEmail.split('@')[0]}</Text>
                <DownOutlined className="text-slate-400 text-[10px]" />
              </div>
            </Dropdown>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="focus:outline-none"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b" style={{ backgroundColor: 'var(--color-bg-secondary)', borderColor: 'var(--color-border)' }}>
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-3 rounded-md text-base font-medium ${isActive
                    ? 'text-[#6c63ff]'
                    : 'text-slate-600 hover:text-[#6c63ff]'
                  }`
                }
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-secondary)'
                }}
              >
                <div className="flex items-center gap-3">
                  <link.icon style={{ fontSize: 20 }} />
                  {link.name}
                </div>
              </NavLink>
            ))}
            <div className="pt-4 pb-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <div className="px-3 py-3 flex items-center justify-between">
                <Space style={{ color: 'var(--color-text-secondary)' }}>
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                  <span className="font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </Space>
                <Switch checked={isDarkMode} onChange={toggleTheme} />
              </div>
              <NavLink
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-3 rounded-md text-base font-medium"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <div className="flex items-center gap-3">
                  <SettingOutlined style={{ fontSize: 20 }} />
                  Settings
                </div>
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-3 rounded-md text-base font-medium text-red-500 hover:bg-red-50 w-full text-left cursor-pointer"
              >
                <LogoutOutlined style={{ fontSize: 20 }} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
