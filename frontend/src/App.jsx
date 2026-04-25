import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AnalysisPage from './pages/AnalysisPage';
import UploadPage from './pages/UploadPage';
import SettingsPage from './pages/SettingsPage';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#ffffff',
            color: '#1e293b',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            fontSize: '14px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Protected Routes inside Layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/analysis" element={<AnalysisPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
