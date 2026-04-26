import { useState, useEffect } from 'react';
import { DatePicker, Space, Button, Card, Tabs, Table, Progress, Typography, Row, Col, Select } from 'antd';
import dayjs from 'dayjs';
import { useDashboard } from '../context/DashboardContext';
import CategoryPieChart from '../components/CategoryPieChart';
import MonthlyTrendLine from '../components/MonthlyTrendLine';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { CalendarOutlined, BarChartOutlined, LineChartOutlined, PieChartOutlined } from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;
const { Option } = Select;

const COLORS = [
  '#6c63ff', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
  '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4', '#84cc16'
];

export default function AnalysisPage() {
  const { dateRange, setDateRange, refreshTrigger } = useDashboard();
  const { isDarkMode } = useTheme();
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [stackedData, setStackedData] = useState({ data: [], categories: [] });
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState('month');

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, refreshTrigger, groupBy]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = { group_by: groupBy };
      if (dateRange.startDate) params.start_date = dateRange.startDate;
      if (dateRange.endDate) params.end_date = dateRange.endDate;

      const [summaryRes, categoryRes, stackedRes] = await Promise.all([
        api.get('/analytics/summary', { params }),
        api.get('/analytics/category-breakdown', { params }),
        api.get('/analytics/stacked-data', { params }),
      ]);

      setSummary(summaryRes.data);
      setCategoryData(categoryRes.data);
      setStackedData(stackedRes.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (dates) => {
    if (!dates) {
      setDateRange({ startDate: '', endDate: '' });
    } else {
      setDateRange({
        startDate: dates[0].format('YYYY-MM-DD'),
        endDate: dates[1].format('YYYY-MM-DD'),
      });
    }
  };

  const tableColumns = [
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (text, _, index) => (
        <Space>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
          <Text strong style={{ color: 'var(--color-text-primary)' }}>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      render: (amount) => (
        <Text strong style={{ color: '#6c63ff' }}>
          ₹{parseFloat(amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: 'Contribution',
      dataIndex: 'percentage',
      key: 'percentage',
      width: '30%',
      render: (pct) => (
        <Space direction="vertical" className="w-full" size={0}>
          <Text size="small" style={{ color: 'var(--color-text-secondary)' }}>{pct}%</Text>
          <Progress percent={pct} showInfo={false} strokeColor="#6c63ff" trailColor={isDarkMode ? '#334155' : '#f1f5f9'} />
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'visual',
      label: <Space style={{ color: 'inherit' }}><BarChartOutlined /> Visual Analytics</Space>,
      children: (
        <div className="space-y-10">
          <Row gutter={[32, 32]}>
            <Col xs={24} lg={12}>
              <Card 
                title={<Space><BarChartOutlined style={{ color: '#f59e0b' }} /> <Title level={5} style={{ margin: 0, color: 'var(--color-text-primary)' }}>Top Categories Comparison</Title></Space>}
                style={{ borderRadius: '24px', borderColor: 'var(--color-border)' }}
                className="shadow-sm h-full"
              >
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                      <XAxis 
                        dataKey="category" 
                        angle={-45} 
                        textAnchor="end" 
                        interval={0} 
                        height={60}
                        tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                      />
                      <YAxis tick={{ fontSize: 10, fill: isDarkMode ? '#94a3b8' : '#64748b' }} tickFormatter={(v) => `₹${v}`} />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--color-bg-card)', 
                          borderRadius: '12px', 
                          border: '1px solid var(--color-border)', 
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                          color: 'var(--color-text-primary)'
                        }}
                        itemStyle={{ color: 'var(--color-text-primary)' }}
                        formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Spend']}
                      />
                      <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={32}>
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card 
                title={<Space><PieChartOutlined style={{ color: '#10b981' }} /> <Title level={5} style={{ margin: 0, color: 'var(--color-text-primary)' }}>Category Distribution</Title></Space>}
                style={{ borderRadius: '24px', borderColor: 'var(--color-border)' }}
                className="shadow-sm h-full"
              >
                <div className="h-[350px]">
                  <CategoryPieChart data={categoryData} loading={loading} />
                </div>
              </Card>
            </Col>
          </Row>

          <Row gutter={[32, 32]}>
            <Col xs={24} lg={12}>
              <Card 
                title={<Space><LineChartOutlined style={{ color: '#6c63ff' }} /> <Title level={5} style={{ margin: 0, color: 'var(--color-text-primary)' }}>Spending Trend ({groupBy.charAt(0).toUpperCase() + groupBy.slice(1)} Wise)</Title></Space>}
                style={{ borderRadius: '24px', borderColor: 'var(--color-border)' }}
                className="shadow-sm h-full"
              >
                <div className="h-[400px]">
                  <MonthlyTrendLine data={summary?.monthly_breakdown || []} loading={loading} />
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card 
                title={<Space><BarChartOutlined style={{ color: '#ef4444' }} /> <Title level={5} style={{ margin: 0, color: 'var(--color-text-primary)' }}>Categories Over Time ({groupBy})</Title></Space>}
                style={{ borderRadius: '24px', borderColor: 'var(--color-border)' }}
                className="shadow-sm h-full"
              >
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stackedData.data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#334155' : '#f1f5f9'} />
                      <XAxis 
                        dataKey="period" 
                        tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b' }}
                      />
                      <YAxis tick={{ fontSize: 12, fill: isDarkMode ? '#94a3b8' : '#64748b' }} tickFormatter={(v) => `₹${v}`} />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: 'var(--color-bg-card)', 
                          borderRadius: '12px', 
                          border: '1px solid var(--color-border)', 
                          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
                          color: 'var(--color-text-primary)'
                        }}
                        itemStyle={{ color: 'var(--color-text-primary)' }}
                        formatter={(value, name) => [`₹${value.toLocaleString('en-IN')}`, name]}
                      />
                      <Legend wrapperStyle={{ paddingTop: '20px' }} />
                      {stackedData.categories.map((cat, index) => (
                        <Bar 
                          key={cat} 
                          dataKey={cat} 
                          stackId="a" 
                          fill={COLORS[index % COLORS.length]} 
                          radius={index === stackedData.categories.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </Col>
          </Row>
        </div>
      )
    },
    {
      key: 'table',
      label: <Space style={{ color: 'inherit' }}><CalendarOutlined /> Tabular Breakdown</Space>,
      children: (
        <Card style={{ borderRadius: '24px', borderColor: 'var(--color-border)', overflow: 'hidden' }}>
          <Table 
            columns={tableColumns} 
            dataSource={categoryData} 
            rowKey="category"
            pagination={false}
            loading={loading}
          />
        </Card>
      )
    }
  ];

  return (
    <div className="space-y-12 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6" style={{ marginTop: '20px' }}>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Analytics</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Comprehensive view of your financial ecosystem</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Space size="middle">
            <Select
              value={groupBy}
              onChange={setGroupBy}
              className="h-[46px] w-[140px]"
              dropdownStyle={{ borderRadius: '12px', backgroundColor: 'var(--color-bg-card)' }}
            >
              <Option value="day">Day Wise</Option>
              <Option value="week">Week Wise</Option>
              <Option value="month">Month Wise</Option>
              <Option value="quarter">Quarter Wise</Option>
              <Option value="year">Year Wise</Option>
            </Select>
            <RangePicker
              className="h-[46px] rounded-xl shadow-sm"
              style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)' }}
              value={dateRange.startDate ? [dayjs(dateRange.startDate), dayjs(dateRange.endDate)] : null}
              onChange={handleDateChange}
              format="DD MMM, YYYY"
              size="large"
            />
            <Button 
              className="h-[46px] rounded-xl font-semibold px-6"
              onClick={() => setDateRange({ startDate: '', endDate: '' })}
              type={!dateRange.startDate ? "primary" : "default"}
              style={!dateRange.startDate ? { background: '#6c63ff', borderColor: '#6c63ff' } : { borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
              size="large"
            >
              All Time
            </Button>
          </Space>
        </div>
      </div>

      <Tabs 
        defaultActiveKey="visual" 
        items={tabItems} 
        className="analytics-tabs"
        size="large"
      />
    </div>
  );
}
