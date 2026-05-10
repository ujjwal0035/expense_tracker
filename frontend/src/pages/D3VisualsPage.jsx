import { Card, Typography, Spin, Space, Button, DatePicker } from 'antd';
import dayjs from 'dayjs';
import { useDashboard } from '../context/DashboardContext';
import D3BubbleChart from '../components/D3BubbleChart';
import D3StreamGraph from '../components/D3StreamGraph';
import api from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { ExperimentOutlined } from '@ant-design/icons';
import { useTheme } from '../context/ThemeContext';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

export default function D3VisualsPage({ isEmbedded = false }) {
  const { dateRange, setDateRange, refreshTrigger } = useDashboard();
  const { isDarkMode } = useTheme();
  const fetchData = async () => {
    const params = {};
    if (dateRange.startDate) params.start_date = dateRange.startDate;
    if (dateRange.endDate) params.end_date = dateRange.endDate;

    const [catRes, stackRes] = await Promise.all([
      api.get('/analytics/category-breakdown', { params }),
      api.get('/analytics/stacked-data', { params: { ...params, group_by: 'day' } })
    ]);
    return {
      categoryData: catRes.data,
      stackedData: stackRes.data
    };
  };

  const { data, isLoading: loading } = useQuery({
    queryKey: ['d3visuals', dateRange, refreshTrigger],
    queryFn: fetchData,
    keepPreviousData: true
  });

  const categoryData = data?.categoryData || [];
  const stackedData = data?.stackedData || { data: [], categories: [] };

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

  return (
    <div className={`space-y-12 animate-fade-in-up ${isEmbedded ? 'pb-2' : ''}`}>
      {/* Page Header */}
      {!isEmbedded && (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6" style={{ marginTop: '20px', marginBottom: '20px' }}>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>D3 Physics Visuals</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Interactive, force-directed ecosystem of your expenses</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Space size="middle">
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
      )}

      <Card
        title={
          <Space>
            <ExperimentOutlined style={{ color: '#ec4899', fontSize: '20px' }} />
            <Title level={4} style={{ margin: 0, color: 'var(--color-text-primary)' }}>Category Bubbles</Title>
          </Space>
        }
        extra={<Text type="secondary" style={{ color: 'var(--color-text-secondary)' }}>Try dragging the bubbles!</Text>}
        style={{ borderRadius: '24px', borderColor: 'var(--color-border)', height: '70vh' }}
        className="shadow-sm"
        bodyStyle={{ height: 'calc(100% - 64px)', padding: 0 }}
      >
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Spin size="large" />
          </div>
        ) : categoryData.length > 0 ? (
          <div className="w-full h-full p-4">
            <D3BubbleChart data={categoryData} />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Text type="secondary">No expense data found for the selected period.</Text>
          </div>
        )}
      </Card>

      {/* Stream Graph Card */}
      <Card
        title={
          <Space>
            <ExperimentOutlined style={{ color: '#8b5cf6', fontSize: '20px' }} />
            <Title level={4} style={{ margin: 0, color: 'var(--color-text-primary)' }}>Spending Stream</Title>
          </Space>
        }
        extra={<Text type="secondary" style={{ color: 'var(--color-text-secondary)' }}>Hover over layers to isolate categories</Text>}
        style={{ borderRadius: '24px', borderColor: 'var(--color-border)', height: '60vh', marginBottom: '20px', marginTop: '20px' }}
        className="shadow-sm mt-8"
        bodyStyle={{ height: 'calc(100% - 64px)', padding: 0 }}
      >
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <Spin size="large" />
          </div>
        ) : stackedData.data.length > 0 ? (
          <div className="w-full h-full p-4 pb-8">
            <D3StreamGraph data={stackedData.data} categories={stackedData.categories} />
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Text type="secondary">No trend data found for the selected period.</Text>
          </div>
        )}
      </Card>
    </div>
  );
}
