import { Outlet, Navigate } from 'react-router-dom';
import TopBar from './TopBar';
import { DashboardProvider } from '../context/DashboardContext';

export default function Layout() {
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <DashboardProvider>
      <div className="min-h-screen bg-slate-50">
        <TopBar />
        <div className="flex justify-center">
          <main className="w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
            <Outlet />
          </main>
        </div>
      </div>
    </DashboardProvider>
  );
}
