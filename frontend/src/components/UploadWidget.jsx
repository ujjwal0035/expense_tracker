import { useState, useEffect } from 'react';
import { Upload, Progress, Typography, Space, Button, Alert, Card, Result } from 'antd';
import { InboxOutlined, LoadingOutlined, ReloadOutlined } from '@ant-design/icons';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useSSE } from '../hooks/useSSE';

const { Dragger } = Upload;
const { Title, Text, Paragraph } = Typography;

export default function UploadWidget({ onUploadComplete }) {
  const [jobId, setJobId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const { status, totalRows, processedRows, errorLog, isComplete, isStreaming, reset } = useSSE(jobId);

  const handleUpload = async ({ file, onSuccess, onError }) => {
    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      onError('Invalid file type');
      return;
    }

    setUploading(true);
    reset();

    try {
      const formData = new FormData();
      formData.append('file', file);

      const { data } = await api.post('/expenses/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setJobId(data.id);
      onSuccess(data);
      toast.success('Upload started!');
    } catch (err) {
      const errorMsg = err.response?.data?.detail || 'Upload failed';
      toast.error(errorMsg);
      onError(errorMsg);
    } finally {
      setUploading(false);
    }
  };

  const [hasRefreshed, setHasRefreshed] = useState(false);

  // When upload completes successfully, trigger parent refresh
  useEffect(() => {
    if (isComplete && status === 'COMPLETED' && onUploadComplete && !hasRefreshed) {
      onUploadComplete();
      setHasRefreshed(true);
    }
  }, [isComplete, status, onUploadComplete, hasRefreshed]);

  // Reset local refresh guard when a new job starts
  useEffect(() => {
    if (jobId) setHasRefreshed(false);
  }, [jobId]);

  const progress = totalRows > 0 ? Math.round((processedRows / totalRows) * 100) : 0;

  const handleReset = () => {
    setJobId(null);
    reset();
  };

  if (status === 'COMPLETED') {
    return (
      <Card className="rounded-3xl shadow-sm border-slate-100 text-center py-8">
        <Result
          status="success"
          title={<Title level={3}>Import Successful!</Title>}
          subTitle={`We've successfully processed and added ${processedRows} expenses to your account.`}
          extra={[
            <Button 
              type="primary" 
              key="reset" 
              onClick={handleReset} 
              icon={<ReloadOutlined />}
              className="h-[46px] px-8 rounded-xl"
              style={{ background: '#6c63ff', borderColor: '#6c63ff' }}
            >
              Upload Another File
            </Button>
          ]}
        />
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl shadow-sm border-slate-100 h-full overflow-hidden">
      <Space direction="vertical" className="w-full" size="large">
        <div className="flex items-center justify-between">
          <Title level={4} style={{ margin: 0 }}>Import Expenses</Title>
          {(isStreaming || status === 'FAILED') && (
            <Button type="text" onClick={handleReset} icon={<ReloadOutlined />}>
              Restart
            </Button>
          )}
        </div>

        {!isStreaming && status !== 'FAILED' ? (
          <Dragger
            customRequest={handleUpload}
            showUploadList={false}
            multiple={false}
            disabled={uploading}
            className="rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 hover:border-[#6c63ff] transition-all"
          >
            <p className="ant-upload-drag-icon">
              {uploading ? <LoadingOutlined style={{ color: '#6c63ff' }} /> : <InboxOutlined style={{ color: '#6c63ff' }} />}
            </p>
            <p className="ant-upload-text font-bold text-slate-700">
              {uploading ? 'Uploading File...' : 'Click or drag CSV file to this area to upload'}
            </p>
            <p className="ant-upload-hint text-slate-400">
              Support for a single CSV upload. Maximum 200 records per file.
            </p>
          </Dragger>
        ) : (
          <div className="py-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex justify-between mb-2">
                  <Text strong>
                    {status === 'FAILED' ? 'Processing Failed' : `Processing Rows: ${processedRows} / ${totalRows}`}
                  </Text>
                  <Text type="secondary">{progress}%</Text>
                </div>
                <Progress 
                  percent={progress} 
                  status={status === 'FAILED' ? 'exception' : (isComplete ? 'success' : 'active')}
                  strokeColor={status === 'FAILED' ? '#ef4444' : '#6c63ff'}
                  showInfo={false}
                />
              </div>
            </div>

            {status === 'FAILED' && (
              <Alert
                message="Import Error"
                description={
                  <div className="mt-2">
                    <Paragraph className="text-xs">
                      {typeof errorLog === 'string' ? errorLog : JSON.stringify(errorLog, null, 2)}
                    </Paragraph>
                    <Button danger icon={<ReloadOutlined />} onClick={handleReset} className="mt-2">
                      Try Again
                    </Button>
                  </div>
                }
                type="error"
                showIcon
                className="rounded-2xl"
              />
            )}
          </div>
        )}
      </Space>
    </Card>
  );
}
