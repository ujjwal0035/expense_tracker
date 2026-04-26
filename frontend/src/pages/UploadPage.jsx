import { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Row, Col, Alert, Steps, Tag, Divider, Spin } from 'antd';
import { DownloadOutlined, TagsOutlined } from '@ant-design/icons';
import { useDashboard } from '../context/DashboardContext';
import UploadWidget from '../components/UploadWidget';
import api from '../services/api';

const { Title, Text, Paragraph } = Typography;

export default function UploadPage() {
  const { triggerRefresh } = useDashboard();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/categories/');
      setCategories(data);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const downloadSampleCSV = () => {
    const headers = ['amount', 'category', 'expense_date', 'description'];
    
    // Use live categories for the sample rows
    const liveCats = categories.length > 0 ? categories.map(c => c.name) : ['Food', 'Transport', 'Travel', 'Shopping'];
    
    const rows = [
      ['150.50', liveCats[0] || 'Food', '20-04-2026', 'Dinner at restaurant'],
      ['20.00', liveCats[1] || liveCats[0], '24-04-2026', 'Taxi to office'],
      ['500.00', liveCats[2] || liveCats[0], '23-04-2026', 'Stock Investment'],
      ['12.99', liveCats[3] || liveCats[0], '22-04-2026', 'Monthly Groceries'],
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'expense_sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fade-in-up space-y-12 py-10">
      {/* Page Header */}
      <div className="text-center space-y-6" style={{ marginTop: "20px" }}>
        <Space direction="vertical" align="center" className="w-full">
          <Title level={1}>Bulk Import</Title>
          <Paragraph className="text-lg text-slate-500 max-w-2xl mx-auto">
            Quickly import your financial history. Upload a CSV file following our simple template to sync months of data in seconds.
          </Paragraph>
        </Space>

        <div className="flex justify-center gap-4 pt-2" style={{ marginBottom: '15px' }}>
          <Button
            type="primary"
            size="large"
            icon={<DownloadOutlined />}
            onClick={downloadSampleCSV}
            loading={loading}
            className="h-[52px] px-8 rounded-xl font-bold"
            style={{ background: '#6c63ff', borderColor: '#6c63ff' }}
          >
            Download Live Template
          </Button>
        </div>
      </div>

      <Row gutter={[32, 32]}>
        <Col xs={24} lg={16}>
          <UploadWidget onUploadComplete={triggerRefresh} />
        </Col>
        <Col xs={24} lg={8}>
          <Space direction="vertical" className="w-full" size="large">
            <Card className="rounded-3xl shadow-sm border-slate-100">
              <Title level={4}>Instructions</Title>
              <Steps
                direction="vertical"
                size="small"
                current={0}
                items={[
                  {
                    title: 'Download Template',
                    description: 'Use our sample CSV which contains your current categories.',
                  },
                  {
                    title: 'Prepare Data',
                    description: 'Fill in expenses. Supported formats: YYYY-MM-DD or DD-MM-YYYY.',
                  },
                  {
                    title: 'Upload File',
                    description: 'Drag your file into the upload zone.',
                  },
                  {
                    title: 'Success!',
                    description: 'Expenses will be automatically added to your dashboard.',
                  },
                ]}
              />
            </Card>

            <Card className="rounded-3xl shadow-sm border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <Title level={5} style={{ margin: 0 }}>
                  <TagsOutlined className="text-[#6c63ff] mr-2" />
                  Supported Categories
                </Title>
                {loading && <Spin size="small" />}
              </div>
              <Text type="secondary" className="text-xs mb-4 block">
                Your CSV must use these exact category names:
              </Text>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <Tag key={cat.id} className="rounded-lg border-none bg-slate-100 text-slate-600 px-3 py-1 font-semibold">
                    {cat.name}
                  </Tag>
                ))}
              </div>
              <Divider className="my-4" />
              <Alert
                message="Pro Tip"
                description="If you need a new category, add it in Account Settings first!"
                type="info"
                showIcon
                className="rounded-xl border-none bg-[#6c63ff]/5 text-[#6c63ff]"
              />
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
}
