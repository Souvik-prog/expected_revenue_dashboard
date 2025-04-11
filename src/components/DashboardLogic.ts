import { useState, useMemo } from 'react';
import { format, subMonths, addMonths, addDays, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

// Type definitions
export interface DashboardData {
  data: any[];
  schema: any;
}

export interface DateRangeState {
  startDate: Date | null;
  endDate: Date | null;
}

// Enhanced luxury color palette with gradient definitions
export const COLORS = {
  // Primary palette
  primary: "#4f46e5", // Indigo
  primaryDark: "#3730a3", // Darker indigo
  primaryLight: "#6366f1", // Lighter indigo
  primaryGradient: ['#4f46e5', '#6366f1'],

  // Secondary palette - Vibrant teal
  secondary: "#0d9488", // Teal
  secondaryDark: "#0f766e", // Darker teal
  secondaryLight: "#2dd4bf", // Lighter teal
  secondaryGradient: ['#0d9488', '#2dd4bf'],

  // Accent palette - Rich purple
  accent: "#9333ea", // Purple
  accentDark: "#7e22ce", // Darker purple
  accentLight: "#a855f7", // Lighter purple
  accentGradient: ['#9333ea', '#a855f7'],

  // Complementary colors
  gold: "#eab308", // Gold
  goldLight: "#facc15", // Lighter gold
  goldGradient: ['#eab308', '#facc15'],

  coral: "#f97316", // Coral/Orange
  coralLight: "#fb923c", // Lighter coral
  coralGradient: ['#f97316', '#fb923c'],

  jade: "#10b981", // Emerald
  jadeLight: "#34d399", // Lighter emerald
  jadeGradient: ['#10b981', '#34d399'],

  // Neutral tones
  white: "#ffffff",
  neutral: "#f8fafc", // Very light gray-blue
  neutralBorder: "#e2e8f0", // Light gray for borders
  neutralBorderHover: "#cbd5e1", // Medium gray for hover borders

  // Text colors
  textPrimary: "#1e293b", // Dark blue-gray
  textSecondary: "#64748b", // Medium blue-gray
  textLight: "#94a3b8", // Lighter blue-gray

  // Status colors
  success: "#10b981", // Green
  successLight: "#d1fae5", // Light green
  successGradient: ['#10b981', '#34d399'],
  
  danger: "#ef4444", // Red
  dangerLight: "#fee2e2", // Light red
  dangerGradient: ['#ef4444', '#f87171'],
  
  warning: "#f59e0b", // Amber
  warningLight: "#fef3c7", // Light amber
  warningGradient: ['#f59e0b', '#fbbf24'],
  
  info: "#3b82f6", // Blue
  infoLight: "#dbeafe", // Light blue
  infoGradient: ['#3b82f6', '#60a5fa'],

  // Chart colors - carefully selected for contrast and harmony
  chartExpected: '#4f46e5', // Indigo
  chartExpectedGradient: ['#4338ca', '#6366f1'],
  
  chartActual: '#10b981', // Jade
  chartActualGradient: ['#047857', '#34d399'],
  
  chartExpectedCustomer: '#0d9488', // Teal
  chartExpectedCustomerGradient: ['#0f766e', '#2dd4bf'],
  
  chartActualCustomer: '#9333ea', // Purple
  chartActualCustomerGradient: ['#7e22ce', '#a855f7'],
  
  chartReference: '#f97316', // Coral for reference lines
  chartReferenceGradient: ['#ea580c', '#fb923c'],
};

// Utility functions
export const NY_TIMEZONE = "UTC";

export const convertDatesToNYTime = (data: any[]) => {
  if (!Array.isArray(data)) return [];
  return data.map(item => {
    if (!item.created_at) return item;
    try {
      const nyDate = toZonedTime(new Date(item.created_at), NY_TIMEZONE);
      return {
        ...item,
        created_at: nyDate.toISOString()
      };
    } catch (error) {
      console.error("Error converting date to NY timezone:", error);
      return item;
    }
  });
};

export const extractDateOnly = (timestamp: string): string => {
  if (!timestamp) return '';
  // Handle format "2025-03-29 17:39:07.000"
  return timestamp.includes(' ')
    ? timestamp.split(' ')[0]
    : timestamp.split('T')[0]; // Fallback for ISO format
};

export const shiftDateForwardOneMonth = (dateStr: string): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const originalMonth = date.getMonth();
  const originalDay = date.getDate();
  const originalYear = date.getFullYear();

  // Calculate target month and year
  const targetMonth = (originalMonth + 1) % 12;
  const targetYear = originalMonth === 11 ? originalYear + 1 : originalYear;

  // Get the last day of the target month
  const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

  // If the original day exceeds the target month's last day, use the last day instead
  if (originalDay > lastDayOfTargetMonth) {
    return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(lastDayOfTargetMonth).padStart(2, '0')}`;
  }

  // Otherwise, use the same day in the target month
  return `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(originalDay).padStart(2, '0')}`;
};

export const formatCurrency = (value: number, name?: string) => {
  return [`$${Number(value).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`, name || ''];
};

export const formatDate = (value: string) => {
  return format(new Date(value), "MMM d");
};

export const formatFullDate = (value: string) => {
  return format(new Date(value), "MMMM d, yyyy");
};

// Main custom hook that contains all dashboard data logic
export const useDashboardData = (data: any[], schema: any) => {
  // State management
  const [dateRange, setDateRange] = useState<DateRangeState>({
    startDate: null,
    endDate: null,
  });

  const [lastUpdated, setLastUpdated] = useState(
    format(new Date(), "MMM d, yyyy h:mm a")
  );

  // Convert dates in the data at the beginning
  const nyData = useMemo(() => convertDatesToNYTime(data), [data]);

  // Filter data based on date range BUT shifted one month back
  const filteredData = useMemo(() => {
    if (!Array.isArray(nyData)) return [];

    // Apply date filter if dates are selected
    if (dateRange.startDate && dateRange.endDate) {
      // Create copies of dates to avoid mutation
      const startDate = new Date(dateRange.startDate);
      // Set end date to include the full day (fix for the end date issue)
      const endDate = endOfDay(new Date(dateRange.endDate));

      // Calculate the extra days between months
      const calculateExtraDays = (date: Date): number => {
        const currentMonth = date.getMonth(); // JS months are 0-indexed
        const currentYear = date.getFullYear();
        // Calculate previous month and year
        const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        // Get last day of previous month
        const lastDayPrevMonth = new Date(prevYear, prevMonth + 1, 0).getDate();
        // Get last day of current month
        const lastDayCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        // Return the difference if previous month is longer, otherwise 0
        return Math.max(0, lastDayPrevMonth - lastDayCurrentMonth);
      };

      // Calculate the shifted month date range
      const prevMonthStartDate = subMonths(startDate, 1);
      // Calculate extra days and add them to previous month's end date
      const extraDays = calculateExtraDays(endDate);
      const prevMonthEndDate = addDays(subMonths(endDate, 1), extraDays);

      // Format dates consistently to avoid timezone issues
      const prevMonthStartStr = format(prevMonthStartDate, "yyyy-MM-dd");
      const prevMonthEndStr = format(prevMonthEndDate, "yyyy-MM-dd");

      return nyData.filter(item => {
        if (!item.created_at) return false;
        // Extract just the date parts for comparison
        const itemDateStr = extractDateOnly(item.created_at);
        // Compare with shifted date strings for filtering
        return itemDateStr >= prevMonthStartStr && itemDateStr <= prevMonthEndStr;
      });
    }

    return nyData;
  }, [nyData, dateRange]);

  // 1. Expected Revenue vs Date (divide amount by 100)
  const expectedRevenuePerDay = useMemo(() => {
    if (!filteredData.length) return [];

    const revenueMap: Record<string, number> = {};

    // First pass: collect all revenue by original date
    filteredData.forEach((row) => {
      if (row.created_at && row.amount) {
        const date = extractDateOnly(row.created_at);
        // Ensure amount is a number before dividing by 100
        const amount = typeof row.amount === 'string' ? Number(row.amount) : row.amount;
        revenueMap[date] = (revenueMap[date] || 0) + (Number(amount || 0) / 100);
      }
    });

    // Second pass: create mapping with shifted dates and handle month transitions
    const shiftedDateMap: Record<string, number> = {};

    // Calculate target month characteristics
    const targetMonthStart = dateRange.startDate ? new Date(dateRange.startDate) : new Date();
    const targetMonth = targetMonthStart.getMonth();
    const targetYear = targetMonthStart.getFullYear();
    const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    // Process each revenue entry
    Object.entries(revenueMap).forEach(([date, amount]) => {
      const originalDate = new Date(date);
      const originalDay = originalDate.getDate();

      // Check if this date would map beyond the target month's last day
      if (originalDay > lastDayOfTargetMonth) {
        // Add this revenue to the last day of the target month
        const lastDayDate = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(lastDayOfTargetMonth).padStart(2, '0')}`;
        shiftedDateMap[lastDayDate] = (shiftedDateMap[lastDayDate] || 0) + amount;
      } else {
        // Regular mapping - same day in target month
        const targetDate = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(originalDay).padStart(2, '0')}`;
        shiftedDateMap[targetDate] = (shiftedDateMap[targetDate] || 0) + amount;
      }
    });

    // Convert to final array format
    return Object.entries(shiftedDateMap)
      .map(([date, amount]) => ({
        date,
        expectedRevenue: amount
      }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date
  }, [filteredData, dateRange.startDate]);

  // Calculate the actual revenue for the selected date range
  const actualRevenuePerDay = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate || !Array.isArray(nyData)) return [];

    // First, collect revenue per day in the standard way
    const standardRevenueMap: Record<string, number> = {};

    // Filter data for the actual selected date range
    const actualDateRangeData = nyData.filter(item => {
      if (!item.created_at) return false;
      const itemDateStr = extractDateOnly(item.created_at);
      const startDateStr = format(dateRange.startDate, "yyyy-MM-dd");
      const endDateStr = format(endOfDay(dateRange.endDate), "yyyy-MM-dd");
      return itemDateStr >= startDateStr && itemDateStr <= endDateStr;
    });

    // Calculate revenue per day
    actualDateRangeData.forEach((row) => {
      if (row.created_at && row.amount) {
        const date = extractDateOnly(row.created_at);
        const amount = typeof row.amount === 'string' ? Number(row.amount) : row.amount;
        standardRevenueMap[date] = (standardRevenueMap[date] || 0) + (Number(amount || 0) / 100);
      }
    });

    // Now adjust the revenue map to match how the expected revenue is calculated
    const adjustedRevenueMap: Record<string, number> = {};

    // Adjust revenue for proper month transitions
    Object.entries(standardRevenueMap).forEach(([date, revenue]) => {
      // We don't need to shift dates for actual revenue display
      adjustedRevenueMap[date] = (adjustedRevenueMap[date] || 0) + revenue;
    });

    return Object.entries(adjustedRevenueMap)
      .map(([date, amount]) => ({
        date,
        actualRevenue: amount
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [nyData, dateRange.startDate, dateRange.endDate]);

  // Combine expected and actual revenue data for the chart
  const combinedRevenueData = useMemo(() => {
    const dataMap = new Map();

    // First add expected revenue data
    expectedRevenuePerDay.forEach(item => {
      dataMap.set(item.date, { date: item.date, expectedRevenue: item.expectedRevenue, actualRevenue: 0 });
    });

    // Then add or merge actual revenue data
    actualRevenuePerDay.forEach(item => {
      if (dataMap.has(item.date)) {
        const existing = dataMap.get(item.date)!;
        existing.actualRevenue = item.actualRevenue;
      } else {
        dataMap.set(item.date, { date: item.date, expectedRevenue: 0, actualRevenue: item.actualRevenue });
      }
    });

    return Array.from(dataMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [expectedRevenuePerDay, actualRevenuePerDay]);

  // Calculate expected customer count per day (based on previous month's data)
  const customerCountPerDay = useMemo(() => {
    if (!filteredData.length) return [];

    const customerMap: Record<string, Set<string>> = {};

    filteredData.forEach((row) => {
      if (row.created_at && row.customer_id) {
        const date = extractDateOnly(row.created_at);
        if (!customerMap[date]) customerMap[date] = new Set();
        customerMap[date].add(row.customer_id);
      }
    });

    // Shift dates forward by one month for expected customer count
    const shiftedCustomerMap: Record<string, number> = {};

    Object.entries(customerMap).forEach(([date, customers]) => {
      const shiftedDate = shiftDateForwardOneMonth(date);
      shiftedCustomerMap[shiftedDate] = (shiftedCustomerMap[shiftedDate] || 0) + customers.size;
    });

    return Object.entries(shiftedCustomerMap)
      .map(([date, count]) => ({
        date,
        expectedCustomerCount: count
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredData]);

  // Calculate actual customer count per day for the selected date range
  const actualCustomerCountPerDay = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate || !Array.isArray(nyData)) return [];

    const customerMap: Record<string, Set<string>> = {};

    // Filter data for the actual selected date range
    nyData.filter(item => {
      if (!item.created_at) return false;
      const itemDateStr = extractDateOnly(item.created_at);
      const startDateStr = format(dateRange.startDate, "yyyy-MM-dd");
      const endDateStr = format(endOfDay(dateRange.endDate), "yyyy-MM-dd");
      return itemDateStr >= startDateStr && itemDateStr <= endDateStr;
    }).forEach((row) => {
      if (row.created_at && row.customer_id) {
        const date = extractDateOnly(row.created_at);
        if (!customerMap[date]) customerMap[date] = new Set();
        customerMap[date].add(row.customer_id);
      }
    });

    return Object.entries(customerMap)
      .map(([date, customers]) => ({
        date,
        actualCustomerCount: customers.size
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [nyData, dateRange.startDate, dateRange.endDate]);

  // Combine expected and actual customer data for the chart
  const combinedCustomerData = useMemo(() => {
    const dataMap = new Map();

    // First add expected customer data
    customerCountPerDay.forEach(item => {
      dataMap.set(item.date, { date: item.date, expectedCustomerCount: item.expectedCustomerCount, actualCustomerCount: 0 });
    });

    // Then add or merge actual customer data
    actualCustomerCountPerDay.forEach(item => {
      if (dataMap.has(item.date)) {
        const existing = dataMap.get(item.date)!;
        existing.actualCustomerCount = item.actualCustomerCount;
      } else {
        dataMap.set(item.date, { date: item.date, expectedCustomerCount: 0, actualCustomerCount: item.actualCustomerCount });
      }
    });

    return Array.from(dataMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [customerCountPerDay, actualCustomerCountPerDay]);

  // Total Expected Revenue (based on previous month's data shifted forward)
  const totalExpectedRevenue = useMemo(() => {
    return expectedRevenuePerDay.reduce((sum, item) => sum + item.expectedRevenue, 0);
  }, [expectedRevenuePerDay]);

  // Total Actual Revenue (for the selected date range)
  const totalActualRevenue = useMemo(() => {
    return actualRevenuePerDay.reduce((sum, item) => sum + item.actualRevenue, 0);
  }, [actualRevenuePerDay]);

  // Total Expected Customer Count (from previous month's data shifted forward)
  const totalExpectedCustomerCount = useMemo(() => {
    const uniqueCustomers = new Set();
    filteredData.forEach(row => {
      if (row.customer_id) {
        uniqueCustomers.add(row.customer_id);
      }
    });
    return uniqueCustomers.size;
  }, [filteredData]);

  // Total Actual Customer Count (for the selected date range)
  const totalActualCustomerCount = useMemo(() => {
    const uniqueCustomers = new Set();
    if (dateRange.startDate && dateRange.endDate) {
      const startDateStr = format(dateRange.startDate, "yyyy-MM-dd");
      const endDateStr = format(endOfDay(dateRange.endDate), "yyyy-MM-dd");
      nyData.forEach(row => {
        if (row.customer_id && row.created_at) {
          const itemDateStr = extractDateOnly(row.created_at);
          if (itemDateStr >= startDateStr && itemDateStr <= endDateStr) {
            uniqueCustomers.add(row.customer_id);
          }
        }
      });
    }
    return uniqueCustomers.size;
  }, [nyData, dateRange.startDate, dateRange.endDate]);

  // List of Expected Customers (from previous month's data, grouped by date)
  const customersByDate = useMemo(() => {
    const dateCustomerMap: Record<string, any[]> = {};

    filteredData.forEach((row) => {
      if (row.created_at && row.customer_email && row.customer_id && row.amount) {
        const originalDate = extractDateOnly(row.created_at);
        const displayDate = shiftDateForwardOneMonth(originalDate);
        
        if (!dateCustomerMap[displayDate]) dateCustomerMap[displayDate] = [];
        
        // Convert amount to number and divide by 100
        const amount = typeof row.amount === 'string' ? Number(row.amount) : row.amount;
        
        dateCustomerMap[displayDate].push({
          email: row.customer_email,
          id: row.customer_id,
          amount: amount / 100
        });
      }
    });

    return Object.entries(dateCustomerMap)
      .map(([date, customers]) => ({
        date,
        customers
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredData]);

  // List of Actual Customers who paid (in the selected date range)
  const actualCustomersByDate = useMemo(() => {
    const dateCustomerMap: Record<string, any[]> = {};

    if (dateRange.startDate && dateRange.endDate) {
      const startDateStr = format(dateRange.startDate, "yyyy-MM-dd");
      const endDateStr = format(endOfDay(dateRange.endDate), "yyyy-MM-dd");

      nyData.filter(item => {
        if (!item.created_at) return false;
        const itemDateStr = extractDateOnly(item.created_at);
        return itemDateStr >= startDateStr && itemDateStr <= endDateStr;
      }).forEach((row) => {
        if (row.created_at && row.customer_email && row.customer_id && row.amount) {
          const date = extractDateOnly(row.created_at);
          
          if (!dateCustomerMap[date]) dateCustomerMap[date] = [];
          
          // Convert amount to number and divide by 100
          const amount = typeof row.amount === 'string' ? Number(row.amount) : row.amount;
          
          dateCustomerMap[date].push({
            email: row.customer_email,
            id: row.customer_id,
            amount: amount / 100
          });
        }
      });
    }

    return Object.entries(dateCustomerMap)
      .map(([date, customers]) => ({
        date,
        customers
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [nyData, dateRange.startDate, dateRange.endDate]);

  // Calculate the date range for display
  const displayDateRange = useMemo(() => {
    if (dateRange.startDate && dateRange.endDate) {
      return {
        start: format(dateRange.startDate, "MMM d, yyyy"),
        end: format(dateRange.endDate, "MMM d, yyyy")
      };
    }

    return { start: "N/A", end: "N/A" };
  }, [dateRange.startDate, dateRange.endDate]);

  // NEW: Calculate retained revenue, lost revenue, and new sales
  const revenueMetrics = useMemo(() => {
    if (!filteredData.length || !dateRange.startDate || !dateRange.endDate || !Array.isArray(nyData)) {
      return {
        byDay: [],
        totals: {
          retainedRevenue: 0,
          lostRevenue: 0,
          newSales: 0
        }
      };
    }

    // Get customers from previous month (filteredData contains previous month's data)
    const previousMonthCustomers = new Map();
    filteredData.forEach(row => {
      if (row.customer_email && row.amount) {
        const amount = typeof row.amount === 'string' ? Number(row.amount) : row.amount;
        previousMonthCustomers.set(row.customer_email, (previousMonthCustomers.get(row.customer_email) || 0) + (Number(amount || 0) / 100));
      }
    });

    // Get customers from current month (selected date range)
    const currentMonthData = nyData.filter(item => {
      if (!item.created_at) return false;
      const itemDateStr = extractDateOnly(item.created_at);
      const startDateStr = format(dateRange.startDate, "yyyy-MM-dd");
      const endDateStr = format(endOfDay(dateRange.endDate), "yyyy-MM-dd");
      return itemDateStr >= startDateStr && itemDateStr <= endDateStr;
    });
    
    // Group current month data by date
    const currentMonthDataByDay = new Map();
    currentMonthData.forEach(row => {
      if (row.created_at && row.customer_email && row.amount) {
        const date = extractDateOnly(row.created_at);
        if (!currentMonthDataByDay.has(date)) {
          currentMonthDataByDay.set(date, []);
        }
        currentMonthDataByDay.get(date).push(row);
      }
    });
    
    // Create a map of all current month customers
    const currentMonthCustomers = new Map();
    currentMonthData.forEach(row => {
      if (row.customer_email && row.amount) {
        const amount = typeof row.amount === 'string' ? Number(row.amount) : row.amount;
        currentMonthCustomers.set(row.customer_email, (currentMonthCustomers.get(row.customer_email) || 0) + (Number(amount || 0) / 100));
      }
    });

    // Calculate metrics by day
    const metricsByDay = Array.from(currentMonthDataByDay.entries()).map(([date, dayData]) => {
      // Group by customer for this day
      const dayCustomers = new Map();
      dayData.forEach(row => {
        if (row.customer_email && row.amount) {
          const amount = typeof row.amount === 'string' ? Number(row.amount) : row.amount;
          dayCustomers.set(row.customer_email, (dayCustomers.get(row.customer_email) || 0) + (Number(amount || 0) / 100));
        }
      });
      
      // Calculate retained and new sales for this day
      let retainedRevenue = 0;
      let newSales = 0;

      dayCustomers.forEach((amount, email) => {
        if (previousMonthCustomers.has(email)) {
          retainedRevenue += amount;
        } else {
          newSales += amount;
        }
      });

      return {
        date,
        retainedRevenue,
        newSales,
        lostRevenue: 0 // Will be filled in later
      };
    });

    // Calculate total lost revenue
    const lostRevenue = Array.from(previousMonthCustomers.entries())
      .filter(([email]) => !currentMonthCustomers.has(email))
      .reduce((sum, [_, amount]) => sum + amount, 0);

    // Distribute lost revenue evenly across days
    const daysCount = metricsByDay.length;
    if (daysCount > 0 && lostRevenue > 0) {
      const lostRevenuePerDay = lostRevenue / daysCount;
      metricsByDay.forEach(day => {
        day.lostRevenue = lostRevenuePerDay;
      });
    }

    // Sort by date
    metricsByDay.sort((a, b) => a.date.localeCompare(b.date));

    // Calculate totals
    const totals = {
      retainedRevenue: metricsByDay.reduce((sum, day) => sum + day.retainedRevenue, 0),
      lostRevenue: lostRevenue,
      newSales: metricsByDay.reduce((sum, day) => sum + day.newSales, 0)
    };

    return {
      byDay: metricsByDay,
      totals
    };
  }, [filteredData, nyData, dateRange.startDate, dateRange.endDate]);

  // Date presets handlers
  const handleDatePreset = (preset: 'today' | 'week' | 'month') => {
    const today = new Date();
    let startDate = new Date();
    const endDate = today;

    if (preset === 'today') {
      startDate = today;
    } else if (preset === 'week') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 6);
    } else if (preset === 'month') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() - 29);
    }

    setDateRange({
      startDate,
      endDate
    });
  };

  return {
    // State
    dateRange,
    setDateRange,
    lastUpdated,
    
    // Processed data
    displayDateRange,
    combinedRevenueData,
    combinedCustomerData,
    totalExpectedRevenue,
    totalActualRevenue,
    totalExpectedCustomerCount,
    totalActualCustomerCount,
    customersByDate,
    actualCustomersByDate,
    revenueMetrics,
    
    // Utility functions
    handleDatePreset,
    formatCurrency,
    formatDate,
    formatFullDate
  };
};
