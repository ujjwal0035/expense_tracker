import { Card, Typography, Spin, Space, Row, Col, Alert } from 'antd';
import dayjs from 'dayjs';
import { useDashboard } from '../context/DashboardContext';
import D3GaugeChart from '../components/D3GaugeChart';
import D3PredictiveLine from '../components/D3PredictiveLine';
import api from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { CompassOutlined, WarningOutlined, CheckCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function D3ForecastingPage({ isEmbedded = false }) {
  const { refreshTrigger } = useDashboard();
  
  // For forecasting, we strictly look at the CURRENT month.
  const currentMonthStart = dayjs().startOf('month').format('YYYY-MM-DD');
  const currentMonthEnd = dayjs().endOf('month').format('YYYY-MM-DD');
  const today = dayjs().format('YYYY-MM-DD');
  const daysInMonth = dayjs().daysInMonth();
  const currentDayOfMonth = dayjs().date();
  const fetchData = async () => {
    const res = await api.get('/analytics/summary', {
      params: {
        start_date: currentMonthStart,
        end_date: currentMonthEnd,
        group_by: 'day'
      }
    });
    return res.data;
  };

  const { data: summary, isLoading: loading } = useQuery({
    queryKey: ['forecast', currentMonthStart, currentMonthEnd, refreshTrigger],
    queryFn: fetchData,
    keepPreviousData: true
  });

  // Generate Prediction Data
  const generatePrediction = () => {
    if (!summary || !summary.daily_breakdown || summary.daily_breakdown.length === 0) {
      return { actualData: [], predictedData: [], alertObj: null };
    }

    const actualData = summary.daily_breakdown;
    const totalSpendSoFar = summary.total_spend;
    const budget = summary.total_budget;
    
    // Calculate average spend per day *that has elapsed*
    const averageDailySpend = totalSpendSoFar / Math.max(1, currentDayOfMonth);

    // Generate predicted data from today until the end of the month
    const predictedData = [];
    let runningTotal = totalSpendSoFar;
    
    // Start prediction from tomorrow
    for (let i = currentDayOfMonth + 1; i <= daysInMonth; i++) {
      runningTotal += averageDailySpend;
      predictedData.push({
        date: dayjs().date(i).format('YYYY-MM-DD'),
        total: runningTotal
      });
    }

    // Determine alert status
    let alertObj = null;
    if (predictedData.length > 0) {
      const finalPredictedTotal = predictedData[predictedData.length - 1].total;
      if (finalPredictedTotal > budget && budget > 0) {
        alertObj = {
          type: 'error',
          message: 'Budget Warning',
          description: `At your current rate (₹${Math.round(averageDailySpend).toLocaleString()}/day), you are projected to exceed your budget by ₹${Math.round(finalPredictedTotal - budget).toLocaleString()} by the end of the month.`
        };
      } else if (budget > 0) {
        alertObj = {
          type: 'success',
          message: 'On Track',
          description: `Great job! You are projected to finish the month with ₹${Math.round(budget - finalPredictedTotal).toLocaleString()} remaining.`
        };
      }
    }

    return { actualData, predictedData, alertObj };
  };

  const { actualData, predictedData, alertObj: predictionAlert } = generatePrediction();

  return (
    <div className={`space-y-12 animate-fade-in-up ${isEmbedded ? 'pb-2' : ''}`}>
      {/* Page Header */}
      {!isEmbedded && (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6" style={{ marginTop: '20px', marginBottom: '20px' }}>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text-primary)' }}>Predictive Forecast</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>AI-driven trajectory of your current month's expenses</p>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-900/30 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-800">
            <Text strong className="text-indigo-600 dark:text-indigo-400">
              {dayjs().format('MMMM YYYY')} (Day {currentDayOfMonth} of {daysInMonth})
            </Text>
          </div>
        </div>
      )}

      {predictionAlert && (
        <Alert
          message={predictionAlert.message}
          description={predictionAlert.description}
          type={predictionAlert.type}
          showIcon
          icon={predictionAlert.type === 'error' ? <WarningOutlined /> : <CheckCircleOutlined />}
          style={{ borderRadius: '16px', marginBottom: '24px' }}
        />
      )}

      {loading ? (
        <div className="w-full h-64 flex items-center justify-center">
          <Spin size="large" />
        </div>
      ) : summary ? (
        <Row gutter={[32, 32]}>
          <Col xs={24} lg={8}>
            <Card
              title={
                <Space>
                  <CompassOutlined style={{ color: '#10b981', fontSize: '20px' }} /> 
                  <Title level={4} style={{ margin: 0, color: 'var(--color-text-primary)' }}>Burn Rate Gauge</Title>
                </Space>
              }
              style={{ borderRadius: '24px', borderColor: 'var(--color-border)', height: '100%' }}
              className="shadow-sm"
              bodyStyle={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100% - 64px)' }}
            >
              <div className="w-full h-[250px]">
                <D3GaugeChart 
                  value={summary.total_spend} 
                  max={summary.total_budget || 100000} // Fallback max if no budget
                />
              </div>
              <div className="text-center mt-4 space-y-1">
                <Text type="secondary" className="block text-sm">Monthly Budget Utilized</Text>
                <Text strong className="text-xl" style={{ color: 'var(--color-text-primary)' }}>
                  {summary.total_budget > 0 ? Math.round((summary.total_spend / summary.total_budget) * 100) : 0}%
                </Text>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card
              title={
                <Space>
                  <CompassOutlined style={{ color: '#6c63ff', fontSize: '20px' }} /> 
                  <Title level={4} style={{ margin: 0, color: 'var(--color-text-primary)' }}>Spend Trajectory</Title>
                </Space>
              }
              extra={<Text type="secondary" style={{ color: 'var(--color-text-secondary)' }}>Solid = Actual, Dashed = Projected</Text>}
              style={{ borderRadius: '24px', borderColor: 'var(--color-border)', height: '100%' }}
              className="shadow-sm"
              bodyStyle={{ height: 'calc(100% - 64px)', padding: '16px' }}
            >
              <div className="w-full h-[350px]">
                {actualData.length > 0 ? (
                  <D3PredictiveLine 
                    actualData={actualData} 
                    predictedData={predictedData} 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Text type="secondary">Not enough data to generate forecast for this month.</Text>
                  </div>
                )}
              </div>
            </Card>
          </Col>
        </Row>
      ) : null}
    </div>
  );
}
