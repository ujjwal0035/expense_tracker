import { useState, useEffect } from 'react';
import { Card, Typography, Button, Space, Row, Col, Alert, Steps, Tag } from 'antd';
import { DownloadOutlined, FileExcelOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useDashboard } from '../context/DashboardContext';
import UploadWidget from '../components/UploadWidget';

const { Title, Text, Paragraph } = Typography;

export default function UploadPage() {
  const { triggerRefresh } = useDashboard();

  const downloadSampleCSV = () => {
    const headers = ['amount', 'category', 'expense_date', 'description'];
    const rows = [
      ['150.50', 'Food', '2023-10-25', 'Dinner at restaurant'],
      ['20.00', 'Transport', '2023-10-24', 'Taxi to office'],
      ['500.00', 'Travel', '2023-10-22', 'Flight ticket'],
      ['12.99', 'Shopping', '2023-10-21', 'Groceries'],
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
            className="h-[52px] px-8 rounded-xl font-bold"
            style={{ background: '#6c63ff', borderColor: '#6c63ff' }}
          >
            Download Sample
          </Button>
        </div>
      </div>

      <Row gutter={[32, 32]}>
        <Col xs={24} lg={16}>
          <UploadWidget onUploadComplete={triggerRefresh} />
        </Col>
        <Col xs={24} lg={8}>
          <Card className="rounded-3xl shadow-sm border-slate-100 h-full">
            <Title level={4}>Instructions</Title>
            <Steps
              direction="vertical"
              size="small"
              current={0}
              items={[
                {
                  title: 'Download Template',
                  description: 'Use our sample CSV to ensure correct formatting.',
                },
                {
                  title: 'Prepare Data',
                  description: 'Fill in your expenses. Ensure dates are YYYY-MM-DD.',
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
        </Col>
      </Row>
    </div>
  );
}
