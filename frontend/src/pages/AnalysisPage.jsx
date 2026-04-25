import { useState, useEffect } from 'react';
import { DatePicker, Space, Button, Card, Tabs, Table, Tag, Progress, Typography, Row, Col } from 'antd';
import dayjs from 'dayjs';
import { useDashboard } from '../context/DashboardContext';
import CategoryPieChart from '../components/CategoryPieChart';
import MonthlyTrendLine from '../components/MonthlyTrendLine';
import api from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

const COLORS = [
  '#6c63ff', '#10b981', '#f59e0b', '#ef4444', '#3b82f6',
  '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#06b6d4',
];

export default function AnalysisPage() {
  const { dateRange, setDateRange, refreshTrigger } = useDashboard();
  const [summary, setSummary] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [stackedData, setStackedData] = useState({ data: [], categories: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, refreshTrigger]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = {};
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
          <Text strong>{text}</Text>
        </Space>
      ),
    },
    {
      title: 'Amount',
      dataIndex: 'total',
      key: 'total',
      align: 'right',
      render: (amount) => (
        <Text strong className="text-[#6c63ff]">
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
          <Text size="small">{pct}%</Text>
          <Progress percent={pct} showInfo={false} strokeColor="#6c63ff" trailColor="#f1f5f9" />
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'visual',
      label: 'Visual Analytics',
      children: (
        <div className="space-y-10">
          <Row gutter={[32, 32]}>
            <Col xs={24} lg={12}>
              <Card 
                title={<Title level={5}>Line Chart: Monthly Spending Trend</Title>}
                className="rounded-3xl shadow-sm border-slate-100 h-full"
              >
                <div className="h-[350px]">
                  <MonthlyTrendLine data={summary?.monthly_breakdown || []} loading={loading} />
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card 
                title={<Title level={5}>Donut Chart: Category Distribution</Title>}
                className="rounded-3xl shadow-sm border-slate-100 h-full"
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
                title={<Title level={5}>Bar Chart: Top Categories Comparison</Title>}
                className="rounded-3xl shadow-sm border-slate-100"
              >
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="category" 
                        angle={-45} 
                        textAnchor="end" 
                        interval={0} 
                        height={60}
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `₹${v}`} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Spend']}
                      />
                      <Bar dataKey="total" radius={[8, 8, 0, 0]} barSize={40}>
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
                title={<Title level={5}>Stacked Bar Chart: Categories Over Time</Title>}
                className="rounded-3xl shadow-sm border-slate-100"
              >
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stackedData.data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12, fill: '#64748b' }}
                      />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} tickFormatter={(v) => `₹${v}`} />
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        formatter={(value, name) => [`₹${value.toLocaleString('en-IN')}`, name]}
                      />
                      <Legend />
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
      label: 'Tabular Breakdown & Progress',
      children: (
        <Card className="rounded-3xl shadow-sm border-slate-100 overflow-hidden">
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
          <h1 className="text-3xl font-bold text-slate-800">Analytics</h1>
          <p className="text-slate-500">Comprehensive view of your financial ecosystem</p>
        </div>

        <Space size="middle">
          <RangePicker
            className="h-[46px] rounded-xl border-slate-200 shadow-sm"
            value={dateRange.startDate ? [dayjs(dateRange.startDate), dayjs(dateRange.endDate)] : null}
            onChange={handleDateChange}
            format="DD MMM, YYYY"
            size="large"
          />
          <Button 
            className="h-[46px] rounded-xl font-semibold px-6"
            onClick={() => setDateRange({ startDate: '', endDate: '' })}
            type={!dateRange.startDate ? "primary" : "default"}
            style={!dateRange.startDate ? { background: '#6c63ff', borderColor: '#6c63ff' } : {}}
            size="large"
          >
            All Time
          </Button>
        </Space>
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
