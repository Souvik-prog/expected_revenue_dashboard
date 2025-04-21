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

// Define expected data structure interfaces
interface RevenueDataPoint {
  date: string;
  expectedRevenue: number;
}

interface CustomerData {
  email: string;
  id: string | number;
  amount: number;
  paid?: boolean;
  paidAmount?: number;
  // Added date fields
  expectedDate?: string;
  paymentDate?: string;
  status?: 'actual' | 'paid'; // Added status field for grouped display
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
  
  // Chart colors - Updated to match requirements
  chartExpected: '#f97316', // Orange for Expected Revenue
  chartExpectedGradient: ['#f97316', '#fb923c'],
  
  chartActual: '#3b82f6', // Light Blue for New Sales
  chartActualGradient: ['#3b82f6', '#60a5fa'],
  
  chartRetained: '#10b981', // Green for Retained Revenue
  chartRetainedGradient: ['#10b981', '#34d399'],
  
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

// Helper function for comparing dates (returns a positive value for descending order)
export const compareDatesDescending = (dateStrA: string | undefined, dateStrB: string | undefined): number => {
  // Handle undefined or empty dates
  if (!dateStrA && !dateStrB) return 0;
  if (!dateStrA) return 1; // Place undefined dates at the end
  if (!dateStrB) return -1;
  
  const dateA = new Date(dateStrA);
  const dateB = new Date(dateStrB);
  
  // Check for invalid dates
  if (isNaN(dateA.getTime()) && isNaN(dateB.getTime())) return 0;
  if (isNaN(dateA.getTime())) return 1;
  if (isNaN(dateB.getTime())) return -1;
  
  // Return positive for descending order (newer dates first)
  return dateB.getTime() - dateA.getTime();
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
  
  // Revenue metrics calculation (Expected, Retained, New Sales, Lost)
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
    const previousMonthCustomers = new Map<string, number>();
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
    const currentMonthDataByDay = new Map<string, any[]>();
    currentMonthData.forEach(row => {
      if (row.created_at && row.customer_email && row.amount) {
        const date = extractDateOnly(row.created_at);
        if (!currentMonthDataByDay.has(date)) {
          currentMonthDataByDay.set(date, []);
        }
        currentMonthDataByDay.get(date)?.push(row);
      }
    });
    
    // Create a map of all current month customers
    const currentMonthCustomers = new Map<string, number>();
    currentMonthData.forEach(row => {
      if (row.customer_email && row.amount) {
        const amount = typeof row.amount === 'string' ? Number(row.amount) : row.amount;
        currentMonthCustomers.set(row.customer_email, (currentMonthCustomers.get(row.customer_email) || 0) + (Number(amount || 0) / 100));
      }
    });
    
    // Calculate metrics by day
    const metricsByDay = Array.from(currentMonthDataByDay.entries()).map(([date, dayData]) => {
      // Group by customer for this day
      const dayCustomers = new Map<string, number>();
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
  
  // Total Revenue for the selected date range
  const totalRevenue = useMemo(() => {
    if (!dateRange.startDate || !dateRange.endDate || !Array.isArray(nyData)) return 0;
    
    const startDateStr = format(dateRange.startDate, "yyyy-MM-dd");
    const endDateStr = format(endOfDay(dateRange.endDate), "yyyy-MM-dd");
    
    return nyData.reduce((sum, row) => {
      if (!row.created_at || !row.amount) return sum;
      
      const itemDateStr = extractDateOnly(row.created_at);
      if (itemDateStr >= startDateStr && itemDateStr <= endDateStr) {
        const amount = typeof row.amount === 'string' ? Number(row.amount) : row.amount;
        return sum + (Number(amount || 0) / 100);
      }
      
      return sum;
    }, 0);
  }, [nyData, dateRange.startDate, dateRange.endDate]);
  
  // Expected revenue per day (from previous month, shifted forward)
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
  
  // Combine data for Chart 1: Expected Revenue vs New Sales vs Retained Revenue
  const chart1Data = useMemo(() => {
    const dataMap = new Map<string, {
      date: string;
      expectedRevenue: number;
      newSales: number;
      retainedRevenue: number;
    }>();
    
    // Add expected revenue data
    expectedRevenuePerDay.forEach(item => {
      dataMap.set(item.date, { 
        date: item.date, 
        expectedRevenue: item.expectedRevenue,
        newSales: 0,
        retainedRevenue: 0
      });
    });
    
    // Add revenue metrics (new sales and retained revenue)
    if (revenueMetrics.byDay && revenueMetrics.byDay.length > 0) {
      revenueMetrics.byDay.forEach(item => {
        if (dataMap.has(item.date)) {
          const existing = dataMap.get(item.date)!;
          existing.newSales = item.newSales;
          existing.retainedRevenue = item.retainedRevenue;
        } else {
          dataMap.set(item.date, {
            date: item.date,
            expectedRevenue: 0,
            newSales: item.newSales,
            retainedRevenue: item.retainedRevenue
          });
        }
      });
    }
    
    return Array.from(dataMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [expectedRevenuePerDay, revenueMetrics.byDay]);
  
  // Combine data for Chart 2: Expected Revenue vs Retained Revenue
  const chart2Data = useMemo(() => {
    const dataMap = new Map<string, {
      date: string;
      expectedRevenue: number;
      retainedRevenue: number;
    }>();
    
    // Add expected revenue data
    expectedRevenuePerDay.forEach(item => {
      dataMap.set(item.date, { 
        date: item.date, 
        expectedRevenue: item.expectedRevenue,
        retainedRevenue: 0
      });
    });
    
    // Add retained revenue data
    if (revenueMetrics.byDay && revenueMetrics.byDay.length > 0) {
      revenueMetrics.byDay.forEach(item => {
        if (dataMap.has(item.date)) {
          const existing = dataMap.get(item.date)!;
          existing.retainedRevenue = item.retainedRevenue;
        } else {
          dataMap.set(item.date, {
            date: item.date,
            expectedRevenue: 0,
            retainedRevenue: item.retainedRevenue
          });
        }
      });
    }
    
    return Array.from(dataMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [expectedRevenuePerDay, revenueMetrics.byDay]);
  
  // Expected customers segregated into "actual" and "paid" - WITH IMPROVED DESCENDING DATE SORTING
  const expectedCustomersSegregated = useMemo(() => {
    // Start with empty arrays for both categories
    const result = {
      actual: [] as CustomerData[], // Not paid
      paid: [] as CustomerData[]    // Paid
    };
    
    if (!filteredData.length || !dateRange.startDate || !dateRange.endDate || !Array.isArray(nyData)) {
      return result;
    }
    
    // Get expected customers from the previous month
    const expectedCustomers = new Map<string, CustomerData>();
    filteredData.forEach(row => {
      if (row.customer_email && row.amount && row.customer_id) {
        const amount = typeof row.amount === 'string' ? Number(row.amount) : row.amount;
        const originalDate = row.created_at;
        // Calculate expected payment date (shift the date forward one month)
        const expectedDate = shiftDateForwardOneMonth(extractDateOnly(originalDate));
        
        expectedCustomers.set(row.customer_email, {
          email: row.customer_email,
          id: row.customer_id,
          amount: Number(amount || 0) / 100,
          paid: false,
          paidAmount: 0,
          expectedDate: format(new Date(expectedDate), 'MMM d, yyyy'), // Format for display
        });
      }
    });
    
    // Check which expected customers have paid in the current month
    if (dateRange.startDate && dateRange.endDate) {
      const startDateStr = format(dateRange.startDate, "yyyy-MM-dd");
      const endDateStr = format(endOfDay(dateRange.endDate), "yyyy-MM-dd");
      
      nyData.filter(item => {
        if (!item.created_at) return false;
        const itemDateStr = extractDateOnly(item.created_at);
        return itemDateStr >= startDateStr && itemDateStr <= endDateStr;
      }).forEach(row => {
        if (row.customer_email && row.amount && expectedCustomers.has(row.customer_email)) {
          const customer = expectedCustomers.get(row.customer_email)!;
          const amount = typeof row.amount === 'string' ? Number(row.amount) : row.amount;
          customer.paid = true;
          customer.paidAmount = (customer.paidAmount || 0) + (Number(amount || 0) / 100);
          // Add actual payment date
          customer.paymentDate = format(new Date(row.created_at), 'MMM d, yyyy');
        }
      });
    }
    
    // Divide customers into "actual" and "paid" categories
    expectedCustomers.forEach(customer => {
      if (customer.paid) {
        result.paid.push(customer);
      } else {
        result.actual.push(customer);
      }
    });
    
    // Sort both "actual" and "paid" arrays in descending order by expectedDate using the helper function
    result.actual.sort((a, b) => compareDatesDescending(a.expectedDate, b.expectedDate));
    result.paid.sort((a, b) => compareDatesDescending(a.expectedDate, b.expectedDate));
    
    return result;
  }, [filteredData, nyData, dateRange.startDate, dateRange.endDate]);
  
  // Group expected customers by date, with both actual (unpaid) and paid customers together
  const groupedExpectedCustomers = useMemo(() => {
    const grouped: Record<string, Array<CustomerData & { status: 'actual' | 'paid' }>> = {};
    
    // Add actual customers to the grouped object with status
    expectedCustomersSegregated.actual.forEach(customer => {
      const date = customer.expectedDate || '';
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push({ ...customer, status: 'actual' });
    });
    
    // Add paid customers to the grouped object with status
    expectedCustomersSegregated.paid.forEach(customer => {
      const date = customer.expectedDate || '';
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push({ ...customer, status: 'paid' });
    });
    
    // Sort dates in descending order using proper date comparison
    const sortedDates = Object.keys(grouped).sort((a, b) => {
      return compareDatesDescending(a, b);
    });
    
    // Create final result with dates in sorted order
    const result: Record<string, Array<CustomerData & { status: 'actual' | 'paid' }>> = {};
    sortedDates.forEach(date => {
      result[date] = grouped[date];
    });
    
    return result;
  }, [expectedCustomersSegregated]);
  
  // New sales customers (customers who weren't in the previous month) - NOW WITH DATES
  const newSalesCustomers = useMemo(() => {
    if (!filteredData.length || !dateRange.startDate || !dateRange.endDate || !Array.isArray(nyData)) {
      return [] as CustomerData[];
    }
    
    // Get previous month customers
    const previousCustomerEmails = new Set<string>();
    filteredData.forEach(row => {
      if (row.customer_email) {
        previousCustomerEmails.add(row.customer_email);
      }
    });
    
    // Find new customers in the current month
    const newCustomers = new Map<string, CustomerData>();
    
    if (dateRange.startDate && dateRange.endDate) {
      const startDateStr = format(dateRange.startDate, "yyyy-MM-dd");
      const endDateStr = format(endOfDay(dateRange.endDate), "yyyy-MM-dd");
      
      nyData.filter(item => {
        if (!item.created_at) return false;
        const itemDateStr = extractDateOnly(item.created_at);
        return itemDateStr >= startDateStr && itemDateStr <= endDateStr;
      }).forEach(row => {
        if (row.customer_email && row.amount && !previousCustomerEmails.has(row.customer_email)) {
          if (!newCustomers.has(row.customer_email)) {
            const amount = typeof row.amount === 'string' ? Number(row.amount) : row.amount;
            newCustomers.set(row.customer_email, {
              email: row.customer_email,
              id: row.customer_id,
              amount: Number(amount || 0) / 100,
              // Add payment date (which is the created_at date for new customers)
              paymentDate: format(new Date(row.created_at), 'MMM d, yyyy')
            });
          } else {
            const customer = newCustomers.get(row.customer_email)!;
            const amount = typeof row.amount === 'string' ? Number(row.amount) : row.amount;
            customer.amount += Number(amount || 0) / 100;
            // If multiple payments, use the most recent date
            const newDate = new Date(row.created_at);
            const existingDate = customer.paymentDate ? new Date(customer.paymentDate) : null;
            if (!existingDate || newDate > existingDate) {
              customer.paymentDate = format(newDate, 'MMM d, yyyy');
            }
          }
        }
      });
    }
    
    // Sort new sales customers by payment date in descending order (newest first)
    return Array.from(newCustomers.values())
      .sort((a, b) => compareDatesDescending(a.paymentDate, b.paymentDate));
  }, [filteredData, nyData, dateRange.startDate, dateRange.endDate]);
  
  // Lost revenue customers (customers who were in the previous month but not in the current month)
  const lostRevenueCustomers = useMemo(() => {
    if (!filteredData.length || !dateRange.startDate || !dateRange.endDate || !Array.isArray(nyData)) {
      return [] as CustomerData[];
    }
    
    // Get previous month customers with their amounts
    const previousCustomers = new Map<string, CustomerData>();
    filteredData.forEach(row => {
      if (row.customer_email && row.amount && row.customer_id) {
        const amount = typeof row.amount === 'string' ? Number(row.amount) : row.amount;
        const originalDate = row.created_at;
        // Calculate expected payment date (shift the date forward one month)
        const expectedDate = shiftDateForwardOneMonth(extractDateOnly(originalDate));
        
        if (!previousCustomers.has(row.customer_email)) {
          previousCustomers.set(row.customer_email, {
            email: row.customer_email,
            id: row.customer_id,
            amount: Number(amount || 0) / 100,
            expectedDate: format(new Date(expectedDate), 'MMM d, yyyy') // Format for display
          });
        } else {
          const customer = previousCustomers.get(row.customer_email)!;
          customer.amount += Number(amount || 0) / 100;
        }
      }
    });
    
    // Get current month customer emails
    const currentCustomerEmails = new Set<string>();
    if (dateRange.startDate && dateRange.endDate) {
      const startDateStr = format(dateRange.startDate, "yyyy-MM-dd");
      const endDateStr = format(endOfDay(dateRange.endDate), "yyyy-MM-dd");
      
      nyData.filter(item => {
        if (!item.created_at) return false;
        const itemDateStr = extractDateOnly(item.created_at);
        return itemDateStr >= startDateStr && itemDateStr <= endDateStr;
      }).forEach(row => {
        if (row.customer_email) {
          currentCustomerEmails.add(row.customer_email);
        }
      });
    }
    
    // Find customers who were in the previous month but not in the current month
    const lostCustomers = Array.from(previousCustomers.entries())
      .filter(([email]) => !currentCustomerEmails.has(email))
      .map(([_, customer]) => customer);
    
    // Sort lost customers in descending order by amount
    lostCustomers.sort((a, b) => b.amount - a.amount);
    
    return lostCustomers;
  }, [filteredData, nyData, dateRange.startDate, dateRange.endDate]);
  
  // Total Expected Revenue (fixed to properly type and handle the values)
  const totalExpectedRevenue = useMemo(() => {
    return expectedRevenuePerDay.reduce((sum, item) => {
      // Type assertion to ensure expectedRevenue is treated as a number
      const revenue = typeof item.expectedRevenue === 'number' 
        ? item.expectedRevenue 
        : Number(item.expectedRevenue || 0);
      return sum + revenue;
    }, 0);
  }, [expectedRevenuePerDay]);
  
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
    
    // Chart data
    chart1Data,
    chart2Data,
    
    // Customer lists
    expectedCustomersSegregated,
    groupedExpectedCustomers, // Added new grouped customers by date
    newSalesCustomers,
    lostRevenueCustomers,
    
    // Revenue metrics
    revenueMetrics,
    totalExpectedRevenue,
    totalRevenue,
    
    // Display data
    displayDateRange,
    
    // Utility functions
    handleDatePreset,
    formatCurrency,
    formatDate,
    formatFullDate
  };
};
