import { createContext, useContext, useState, useCallback } from 'react';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = useCallback(() => setRefreshTrigger((prev) => prev + 1), []);

  const value = {
    dateRange,
    setDateRange,
    selectedCategory,
    setSelectedCategory,
    refreshTrigger,
    triggerRefresh,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
