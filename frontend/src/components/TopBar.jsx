import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Wallet, Menu, X } from 'lucide-react';
import { Dropdown, Avatar, Space, Typography } from 'antd';
import {
  HomeOutlined,
  BarChartOutlined,
  CloudUploadOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
  DownOutlined
} from '@ant-design/icons';

const { Text } = Typography;

export default function TopBar() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userEmail = localStorage.getItem('user') || 'User';

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
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
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
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
            <span className="text-xl font-bold text-slate-800">ExpenseIQ</span>
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
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                    }`
                  }
                >
                  <link.icon style={{ fontSize: 18 }} />
                  {link.name}
                </NavLink>
              </div>
            ))}
          </nav>

          {/* User Profile Dropdown (Desktop) */}
          <div className="hidden md:flex items-center" style={{ marginRight: "20px" }}>
            <Dropdown menu={{ items: menuItems }} placement="bottomRight" arrow trigger={['click']}>
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-50 transition-all cursor-pointer">
                <Avatar
                  size="default"
                  icon={<UserOutlined />}
                  style={{ backgroundColor: '#6c63ff' }}
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${userEmail}`}
                />
                <Text strong className="text-sm hidden lg:block">{userEmail.split('@')[0]}</Text>
                <DownOutlined className="text-slate-400 text-[10px]" />
              </div>
            </Dropdown>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-500 hover:text-slate-900 focus:outline-none"
            >
              {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-3 rounded-md text-base font-medium ${isActive
                    ? 'bg-[#f8fafc] text-[#6c63ff]'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <link.icon style={{ fontSize: 20 }} />
                  {link.name}
                </div>
              </NavLink>
            ))}
            <div className="pt-4 pb-2 border-t border-slate-200">
              <NavLink
                to="/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-3 rounded-md text-base font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900"
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
