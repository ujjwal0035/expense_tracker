import { createContext, useContext, useState, useCallback } from 'react';

const DashboardContext = createContext(null);

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getCurrentMonthRange = () => {
  const now = new Date();
  return {
    startDate: formatDate(new Date(now.getFullYear(), now.getMonth(), 1)),
    endDate: formatDate(new Date(now.getFullYear(), now.getMonth() + 1, 0)),
  };
};

export function DashboardProvider({ children }) {
  const [dateRange, setDateRange] = useState(getCurrentMonthRange);
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
