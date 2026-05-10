import { useState } from 'react';
import { Card, Typography, Spin, Space, Row, Col, DatePicker, Select } from 'antd';
import dayjs from 'dayjs';
import { useDashboard } from '../context/DashboardContext';
import D3ZoomTimeSeries from '../components/D3ZoomTimeSeries';
import D3Sunburst from '../components/D3Sunburst';
import D3ScatterPlot from '../components/D3ScatterPlot';
import api from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { CrownOutlined, AreaChartOutlined, DotChartOutlined, PieChartOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function ExecutiveDashboard({ isEmbedded = false }) {
  const { refreshTrigger } = useDashboard();
  
  const [dateRange, setDateRange] = useState([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);

  const fetchData = async () => {
    const startDate = dateRange[0].format('YYYY-MM-DD');
    const endDate = dateRange[1].format('YYYY-MM-DD');

    const [summaryRes, expensesRes] = await Promise.all([
      api.get('/analytics/summary', { params: { start_date: startDate, end_date: endDate, group_by: 'day' } }),
      api.get('/expenses', { params: { start_date: startDate, end_date: endDate, limit: 200 } })
    ]);

    return {
      timeSeriesData: summaryRes.data?.daily_breakdown || [],
      rawExpenses: expensesRes.data?.items || []
    };
  };

  const { data, isLoading: loading } = useQuery({
    queryKey: ['executive', dateRange[0].format('YYYY-MM-DD'), dateRange[1].format('YYYY-MM-DD'), refreshTrigger],
    queryFn: fetchData,
    keepPreviousData: true
  });

  const timeSeriesData = data?.timeSeriesData || [];
  const rawExpenses = data?.rawExpenses || [];

  const handleRangeChange = (dates) => {
    if (dates) setDateRange(dates);
  };

  return (
    <div className={`space-y-12 animate-fade-in-up pb-12 ${isEmbedded ? 'pt-2' : ''}`}>
      {/* Page Header */}
      {!isEmbedded && (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6" style={{ marginTop: '20px', marginBottom: '20px' }}>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Executive Board</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>Deep insights using advanced D3 visualizations</p>
          </div>
          <div className="flex gap-4">
            <RangePicker 
              value={dateRange} 
              onChange={handleRangeChange}
              style={{ borderRadius: '8px' }}
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="w-full h-64 flex items-center justify-center">
          <Spin size="large" />
        </div>
      ) : (
        <Row gutter={[32, 32]}>
          
          {/* Time Series with Zoom */}
          <Col xs={24}>
            <Card
              title={
                <Space>
                  <AreaChartOutlined style={{ color: '#6c63ff', fontSize: '20px' }} /> 
                  <Title level={4} style={{ margin: 0, color: 'var(--color-text-primary)' }}>Cash Flow Timeline (Zoomable)</Title>
                </Space>
              }
              extra={<Text type="secondary">Drag the mini-map at the bottom to zoom</Text>}
              style={{ borderRadius: '24px', borderColor: 'var(--color-border)', height: '500px' }}
              className="shadow-sm"
              bodyStyle={{ height: 'calc(100% - 64px)', padding: '16px' }}
            >
              <div className="w-full h-full">
                {timeSeriesData.length > 0 ? (
                  <D3ZoomTimeSeries data={timeSeriesData} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Text type="secondary">No data available for this range.</Text>
                  </div>
                )}
              </div>
            </Card>
          </Col>

          {/* Sunburst Drilldown */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <PieChartOutlined style={{ color: '#ec4899', fontSize: '20px' }} /> 
                  <Title level={4} style={{ margin: 0, color: 'var(--color-text-primary)' }}>Category Hierarchy</Title>
                </Space>
              }
              extra={<Text type="secondary">Click a slice to drill down!</Text>}
              style={{ borderRadius: '24px', borderColor: 'var(--color-border)', height: '600px' }}
              className="shadow-sm"
              bodyStyle={{ height: 'calc(100% - 64px)', padding: '16px' }}
            >
              <div className="w-full h-full flex items-center justify-center">
                {rawExpenses.length > 0 ? (
                  <D3Sunburst data={rawExpenses} />
                ) : (
                  <Text type="secondary">No recent transactions to display.</Text>
                )}
              </div>
            </Card>
          </Col>

          {/* Scatter Plot Outliers */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <Space>
                  <DotChartOutlined style={{ color: '#10b981', fontSize: '20px' }} /> 
                  <Title level={4} style={{ margin: 0, color: 'var(--color-text-primary)' }}>Transaction Clusters</Title>
                </Space>
              }
              extra={<Text type="secondary">Hover dots for itemized details</Text>}
              style={{ borderRadius: '24px', borderColor: 'var(--color-border)', height: '600px' }}
              className="shadow-sm"
              bodyStyle={{ height: 'calc(100% - 64px)', padding: '16px' }}
            >
              <div className="w-full h-full">
                {rawExpenses.length > 0 ? (
                  <D3ScatterPlot data={rawExpenses} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Text type="secondary">No recent transactions to display.</Text>
                  </div>
                )}
              </div>
            </Card>
          </Col>

        </Row>
      )}
    </div>
  );
}
