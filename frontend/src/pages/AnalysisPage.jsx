import { useState } from 'react';
import { DatePicker, Space, Button, Card, Tabs, Table, Progress, Typography, Row, Col, Select } from 'antd';
import dayjs from 'dayjs';
import { useDashboard } from '../context/DashboardContext';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { CalendarOutlined, BarChartOutlined, LineChartOutlined, PieChartOutlined, ExperimentOutlined, CompassOutlined, CrownOutlined } from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';

import D3BarChart from '../components/D3BarChart';
import D3PieChart from '../components/D3PieChart';
import D3TrendLine from '../components/D3TrendLine';
import D3StackedBar from '../components/D3StackedBar';

import D3VisualsPage from './D3VisualsPage';
import D3ForecastingPage from './D3ForecastingPage';
import ExecutiveDashboard from './ExecutiveDashboard';

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
  const [groupBy, setGroupBy] = useState('month');

  // React Query Fetcher
  const fetchAnalytics = async () => {
    const params = { group_by: groupBy };
    if (dateRange.startDate) params.start_date = dateRange.startDate;
    if (dateRange.endDate) params.end_date = dateRange.endDate;

    const [summaryRes, categoryRes, stackedRes] = await Promise.all([
      api.get('/analytics/summary', { params }),
      api.get('/analytics/category-breakdown', { params }),
      api.get('/analytics/stacked-data', { params }),
    ]);

    return {
      summary: summaryRes.data,
      categoryData: categoryRes.data,
      stackedData: stackedRes.data
    };
  };

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', dateRange, groupBy, refreshTrigger],
    queryFn: fetchAnalytics,
    keepPreviousData: true
  });

  const summary = data?.summary || null;
  const categoryData = data?.categoryData || [];
  const stackedData = data?.stackedData || { data: [], categories: [] };
  const loading = isLoading;

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

  const applyQuickRange = (range) => {
    const today = dayjs();
    const ranges = {
      month: [today.startOf('month'), today.endOf('month')],
      last30: [today.subtract(29, 'day'), today],
      year: [today.startOf('year'), today.endOf('year')],
    };
    const [start, end] = ranges[range];
    setDateRange({
      startDate: start.format('YYYY-MM-DD'),
      endDate: end.format('YYYY-MM-DD'),
    });
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
      label: <Space style={{ color: 'inherit' }}><BarChartOutlined /> Basic Visuals</Space>,
      children: (
        <div className="space-y-10" style={{ marginBottom: "20px" }}>
          <Row gutter={[32, 32]}>
            <Col xs={24} lg={12}>
              <Card
                title={<Space><BarChartOutlined style={{ color: '#f59e0b' }} /> <Title level={5} style={{ margin: 0, color: 'var(--color-text-primary)' }}>Top Categories Comparison</Title></Space>}
                style={{ borderRadius: '24px', borderColor: 'var(--color-border)' }}
                className="shadow-sm h-full"
              >
                <div className="h-[350px] w-full">
                  {categoryData.length > 0 ? (
                    <D3BarChart data={categoryData} />
                  ) : <div className="flex items-center justify-center h-full"><Text type="secondary">No data available.</Text></div>}
                </div>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card
                title={<Space><PieChartOutlined style={{ color: '#10b981' }} /> <Title level={5} style={{ margin: 0, color: 'var(--color-text-primary)' }}>Category Distribution</Title></Space>}
                style={{ borderRadius: '24px', borderColor: 'var(--color-border)' }}
                className="shadow-sm h-full"
              >
                <div className="h-[350px] w-full">
                  {categoryData.length > 0 ? (
                    <D3PieChart data={categoryData} />
                  ) : <div className="flex items-center justify-center h-full"><Text type="secondary">No data available.</Text></div>}
                </div>
              </Card>
            </Col>
          </Row>

          <div style={{ marginTop: "40px" }}></div>

          <Row gutter={[32, 32]}>
            <Col xs={24} lg={12}>
              <Card
                title={<Space><LineChartOutlined style={{ color: '#6c63ff' }} /> <Title level={5} style={{ margin: 0, color: 'var(--color-text-primary)' }}>Spending Trend ({groupBy.charAt(0).toUpperCase() + groupBy.slice(1)} Wise)</Title></Space>}
                style={{ borderRadius: '24px', borderColor: 'var(--color-border)' }}
                className="shadow-sm h-full"
              >
                <div className="h-[400px] w-full">
                  {summary?.monthly_breakdown?.length > 0 ? (
                    <D3TrendLine data={summary.monthly_breakdown} />
                  ) : <div className="flex items-center justify-center h-full"><Text type="secondary">No data available.</Text></div>}
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
                  {stackedData?.data?.length > 0 ? (
                    <D3StackedBar data={stackedData.data} categories={stackedData.categories} />
                  ) : <div className="flex items-center justify-center h-full"><Text type="secondary">No data available.</Text></div>}
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
    },
    {
      key: 'd3playground',
      label: <Space style={{ color: 'inherit' }}><ExperimentOutlined /> D3 Playground</Space>,
      children: (
        <D3VisualsPage isEmbedded={true} />
      )
    },
    {
      key: 'forecast',
      label: <Space style={{ color: 'inherit' }}><CompassOutlined /> Forecast</Space>,
      children: (
        <D3ForecastingPage isEmbedded={true} />
      )
    },
    {
      key: 'executive',
      label: <Space style={{ color: 'inherit' }}><CrownOutlined /> Executive Board</Space>,
      children: (
        <ExecutiveDashboard isEmbedded={true} />
      )
    }
  ];

  return (
    <div className="space-y-12 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6" style={{ marginTop: '20px' }}>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Analytics Hub</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Comprehensive D3 ecosystem of your finances</p>
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
            <Button
              className="h-[46px] rounded-xl font-semibold"
              onClick={() => applyQuickRange('month')}
              size="large"
            >
              This Month
            </Button>
            <Button
              className="h-[46px] rounded-xl font-semibold"
              onClick={() => applyQuickRange('last30')}
              size="large"
            >
              Last 30 Days
            </Button>
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
