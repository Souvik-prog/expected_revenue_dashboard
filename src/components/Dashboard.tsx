import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ComposedChart, Line, Legend, Label
} from 'recharts';
import { ArrowLeft, Calendar, RefreshCw, DollarSign, Users, TrendingUp, Check, Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format, subMonths, addMonths, addDays, endOfDay } from "date-fns";
import { toZonedTime } from "date-fns-tz";

interface DashboardProps {
  data: any[]; // The result array from getData
  schema: any; // Schema of the table
  onBack: () => void; // Callback to switch back to DataTable view
}

const Dashboard: React.FC<DashboardProps> = ({ data, schema, onBack }) => {
  // New York timezone definition
  const NY_TIMEZONE = "UTC";

  // Convert all dates in the `created_at` column to America/New York timezone
  const convertDatesToNYTime = (data: any[]) => {
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

  // Convert dates in the data at the beginning
  const nyData = useMemo(() => convertDatesToNYTime(data), [data]);

  // Utility function to extract date part from timestamp
  const extractDateOnly = (timestamp: string): string => {
    if (!timestamp) return '';
    // Handle format "2025-03-29 17:39:07.000"
    return timestamp.includes(' ') 
      ? timestamp.split(' ')[0] 
      : timestamp.split('T')[0]; // Fallback for ISO format
  };

  // Utility function to shift a date string forward by one month
  const shiftDateForwardOneMonth = (dateStr: string): string => {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const originalMonth = date.getMonth();
    const originalDay = date.getDate();
    
    // Create the next month date
    const nextMonthDate = addMonths(date, 1);
    
    // Handle special case: mapping ONLY January 29/30 to February's last day
    if (originalMonth === 0 && (originalDay === 29 || originalDay === 30)) { // January 29 or 30 only
      const year = nextMonthDate.getFullYear();
      const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
      const febLastDay = isLeapYear ? 29 : 28;
      
      // Set to last day of February
      nextMonthDate.setDate(febLastDay);
    }
    
    return format(nextMonthDate, "yyyy-MM-dd");
  };

  // NEW: Utility function to shift a date string backward by one month
  const shiftDateBackwardOneMonth = (dateStr) => {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    const prevMonthDate = subMonths(date, 1);
    return format(prevMonthDate, "yyyy-MM-dd");
  };
  
  // Date filter state
  const [dateRange, setDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });

  // Last updated timestamp
  const [lastUpdated, setLastUpdated] = useState<string>(
    format(new Date(), "MMM d, yyyy h:mm a")
  );

  // Filter data based on date range BUT shifted one month back
  const filteredData = useMemo(() => {
    if (!Array.isArray(nyData)) return [];
    
    // Apply date filter if dates are selected
    if (dateRange.startDate && dateRange.endDate) {
      // Create copies of dates to avoid mutation
      const startDate = new Date(dateRange.startDate);
      
      // Set end date to include the full day (fix for the end date issue)
      const endDate = endOfDay(new Date(dateRange.endDate));
      
      // Calculate the shifted month date range 
      const prevMonthStartDate = subMonths(startDate, 1);
      const prevMonthEndDate = subMonths(endDate, 1);
      
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
    
    // Second pass: create mapping with shifted dates
    const shiftedDateMap: Record<string, number> = {};
    
    Object.entries(revenueMap).forEach(([date, amount]) => {
      const shiftedDate = shiftDateForwardOneMonth(date);
      shiftedDateMap[shiftedDate] = (shiftedDateMap[shiftedDate] || 0) + amount;
    });
    
    // Convert to final array format
    return Object.entries(shiftedDateMap)
      .map(([date, amount]) => ({ 
        date, 
        expectedRevenue: amount 
      }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date
  }, [filteredData]);


  // Calculate the actual revenue for the selected date range (NEW)
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
      
      // New check: Exclude dates that are the 31st of a month
      const itemDate = new Date(itemDateStr);
      if (itemDate.getDate() === 31) {
        return false;
      }
      
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
  
  

  // Create a combined dataset for the chart (NEW)
  const combinedRevenueData = useMemo(() => {
    const dataMap = new Map();
    
    // Create a lookup for shifted dates to handle month transitions
    const shiftedDateLookup = new Map();
    
    // First, process actual revenue data to create shifted date lookup
    actualRevenuePerDay.forEach(item => {
      const shiftedDate = shiftDateForwardOneMonth(item.date);
      if (!shiftedDateLookup.has(shiftedDate)) {
        shiftedDateLookup.set(shiftedDate, []);
      }
      shiftedDateLookup.get(shiftedDate).push(item);
    });
    
    // Add expected revenue data
    expectedRevenuePerDay.forEach(item => {
      dataMap.set(item.date, {
        date: item.date,
        expectedRevenue: item.expectedRevenue,
        actualRevenue: 0
      });
    });
    
    // Add actual revenue data with proper matching
    actualRevenuePerDay.forEach(item => {
      if (dataMap.has(item.date)) {
        // If this date exists in the expected data, add the actual revenue
        const existing = dataMap.get(item.date);
        dataMap.set(item.date, {
          ...existing,
          actualRevenue: item.actualRevenue
        });
      } else {
        // If this date doesn't exist in the expected data, add it with zero expected revenue
        dataMap.set(item.date, {
          date: item.date,
          expectedRevenue: 0,
          actualRevenue: item.actualRevenue
        });
      }
    });
    
    // Convert map to array and sort by date
    return Array.from(dataMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [expectedRevenuePerDay, actualRevenuePerDay]);
  

  // 2. Customer Count per Day
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
    
    return Object.entries(customerMap)
      .map(([date, customers]) => ({
        // Shift date forward one month for display on x-axis
        date: shiftDateForwardOneMonth(date),
        expectedCustomerCount: customers.size
      }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date
  }, [filteredData]);

  // NEW: Calculate actual customer count per day
  const actualCustomerCountPerDay = useMemo(() => {
    // Only proceed if we have a valid date range selection
    if (!dateRange.startDate || !dateRange.endDate || !Array.isArray(nyData)) return [];
    
    const customerMap: Record<string, Set<string>> = {};
    
    // Filter data for the actual selected date range
    const actualDateRangeData = nyData.filter(item => {
      if (!item.created_at) return false;
      
      // Extract just the date parts for comparison
      const itemDateStr = extractDateOnly(item.created_at);
      
      // Format date range for comparison
      const startDateStr = format(dateRange.startDate, "yyyy-MM-dd");
      const endDateStr = format(endOfDay(dateRange.endDate), "yyyy-MM-dd");
      
      // Include items within the actual selected date range
      return itemDateStr >= startDateStr && itemDateStr <= endDateStr;
    });
    
    // Calculate unique customers per day for the actual date range
    actualDateRangeData.forEach((row) => {
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

  // NEW: Create a combined dataset for customer counts
  const combinedCustomerData = useMemo(() => {
    const dataMap = new Map();
    
    // Add expected customer count data (dates already shifted forward by one month)
    customerCountPerDay.forEach(item => {
      dataMap.set(item.date, { 
        date: item.date, 
        expectedCustomerCount: item.expectedCustomerCount,
        actualCustomerCount: 0 
      });
    });
    
    // Add actual customer count data
    actualCustomerCountPerDay.forEach(item => {
      if (dataMap.has(item.date)) {
        // If this date exists in the expected data, add the actual customer count
        const existing = dataMap.get(item.date);
        dataMap.set(item.date, { 
          ...existing, 
          actualCustomerCount: item.actualCustomerCount 
        });
      } else {
        // If this date doesn't exist in the expected data, add it with zero expected customers
        dataMap.set(item.date, { 
          date: item.date, 
          expectedCustomerCount: 0, 
          actualCustomerCount: item.actualCustomerCount 
        });
      }
    });
    
    // Convert map to array and sort by date
    return Array.from(dataMap.values())
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [customerCountPerDay, actualCustomerCountPerDay]);

  // 3. Total Expected Revenue in the selected date range (divide by 100)
  const totalExpectedRevenue = useMemo(() => {
    return filteredData.reduce((sum, row) => {
      // Ensure amount is a number before dividing by 100
      const amount = typeof row.amount === 'string' ? Number(row.amount) : row.amount;
      return sum + (Number(amount || 0) / 100);
    }, 0);
  }, [filteredData]);
  
  // Total Actual Revenue (NEW)
  const totalActualRevenue = useMemo(() => {
    return actualRevenuePerDay.reduce((sum, item) => sum + item.actualRevenue, 0);
  }, [actualRevenuePerDay]);
  
  // Total expected customer count
  const totalExpectedCustomerCount = useMemo(() => {
    const uniqueCustomers = new Set();
    filteredData.forEach(row => {
      if (row.customer_id) {
        uniqueCustomers.add(row.customer_id);
      }
    });
    return uniqueCustomers.size;
  }, [filteredData]);

  // NEW: Total actual customer count
  const totalActualCustomerCount = useMemo(() => {
    const uniqueCustomers = new Set();
    
    // Filter data for the actual selected date range
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

  // 4. List of Customers in the selected date range - grouped by date
  const customersByDate = useMemo(() => {
    const dateCustomerMap: Record<string, Array<{email: string, id: string, amount: number}>> = {};
    
    filteredData.forEach((row) => {
      if (row.created_at && row.customer_email && row.customer_id) {
        const date = extractDateOnly(row.created_at);
        const displayDate = shiftDateForwardOneMonth(date); // Shift to expected payment date
        
        if (!dateCustomerMap[displayDate]) dateCustomerMap[displayDate] = [];
        
        // Ensure amount is a number before dividing by 100
        const amount = typeof row.amount === 'string' ? Number(row.amount) : row.amount;
        
        dateCustomerMap[displayDate].push({
          email: row.customer_email,
          id: row.customer_id,
          // Divide amount by 100
          amount: Number(amount || 0) / 100
        });
      }
    });
    
    return Object.entries(dateCustomerMap)
      .map(([date, customers]) => ({ 
        date, 
        customers 
      }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date
  }, [filteredData]);

  // NEW: List of Actual Customers who have paid - grouped by date
  const actualCustomersByDate = useMemo(() => {
    const dateCustomerMap: Record<string, Array<{email: string, id: string, amount: number}>> = {};
    
    // Only proceed if we have a valid date range selection
    if (dateRange.startDate && dateRange.endDate) {
      // Format date range for comparison
      const startDateStr = format(dateRange.startDate, "yyyy-MM-dd");
      const endDateStr = format(endOfDay(dateRange.endDate), "yyyy-MM-dd");
      
      // Filter actual data
      nyData.filter(item => {
        if (!item.created_at) return false;
        
        // Extract just the date parts for comparison
        const itemDateStr = extractDateOnly(item.created_at);
        
        // Include items within the actual selected date range
        return itemDateStr >= startDateStr && itemDateStr <= endDateStr;
      }).forEach((row) => {
        if (row.created_at && row.customer_email && row.customer_id) {
          const date = extractDateOnly(row.created_at);
          
          if (!dateCustomerMap[date]) dateCustomerMap[date] = [];
          
          // Ensure amount is a number before dividing by 100
          const amount = typeof row.amount === 'string' ? Number(row.amount) : row.amount;
          
          dateCustomerMap[date].push({
            email: row.customer_email,
            id: row.customer_id,
            // Divide amount by 100
            amount: Number(amount || 0) / 100
          });
        }
      });
    }
    
    return Object.entries(dateCustomerMap)
      .map(([date, customers]) => ({ 
        date, 
        customers 
      }))
      .sort((a, b) => a.date.localeCompare(b.date)); // Sort by date
  }, [nyData, dateRange.startDate, dateRange.endDate]);

  // Calculate the date range for display
  const displayDateRange = useMemo(() => {
    if (dateRange.startDate && dateRange.endDate) {
      return {
        start: format(dateRange.startDate, "MMM d, yyyy"),
        end: format(dateRange.endDate, "MMM d, yyyy")
      };
    }
    return { start: "", end: "" };
  }, [dateRange.startDate, dateRange.endDate]);

  // Handle refresh
  const handleRefresh = () => {
    setLastUpdated(format(new Date(), "MMM d, yyyy h:mm a"));
  };

  // Date presets handlers
  const handleDatePreset = (preset: 'today' | 'week' | 'month') => {
    const today = new Date();
    let startDate = new Date();
    
    if (preset === 'today') {
      // Today
      startDate = today;
    } else if (preset === 'week') {
      // Last 7 days
      startDate.setDate(today.getDate() - 7);
    } else if (preset === 'month') {
      // Last 30 days
      startDate.setDate(today.getDate() - 30);
    }
    
    setDateRange({
      startDate,
      endDate: today
    });
  };

  if (!data.length) {
    return (
      <Card className="border-0 shadow-lg bg-black rounded-xl overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-indigo-500 to-purple-600 text-white pb-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack} className="text-white hover:bg-white/20">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <CardTitle>Expected Revenue Dashboard</CardTitle>
          </div>
          <CardDescription className="text-white/80">No data available to visualize</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-8 bg-black p-8 rounded-xl">
      {/* Dashboard Header */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={onBack} 
            className="rounded-full h-12 w-12 shadow-md bg-slate-800 border-slate-700 hover:bg-slate-700 text-white"
          >
            <ArrowLeft className="h-5 w-5 text-slate-300" />
          </Button>
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Expected Revenue Dashboard
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm bg-slate-800 px-4 py-2 rounded-full shadow-sm">
          <span className="text-slate-400">Last updated: {lastUpdated}</span>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleRefresh} 
            className="rounded-full hover:bg-slate-700 text-slate-400"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Date Filter */}
      <Card className="border-0 shadow-lg overflow-hidden rounded-xl bg-slate-800 border-slate-700">
        <CardHeader className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-b border-slate-700 pb-4">
          <CardTitle className="text-lg font-medium text-slate-200 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-indigo-400" />
            Select Date Range
          </CardTitle>
          <CardDescription className="text-sm text-slate-400">
            {dateRange.startDate && dateRange.endDate && (
              <p className="mt-2 font-medium text-indigo-300 bg-slate-700 py-1 px-3 rounded-full inline-block">
                Selected date range: {displayDateRange.start} to {displayDateRange.end}
              </p>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="bg-slate-800 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-300">Start Date</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-[180px] flex justify-between shadow-sm bg-slate-700 border-slate-600 text-slate-200"
                    >
                      {dateRange.startDate ? format(dateRange.startDate, "MMM d, yyyy") : "Pick a date"}
                      <Calendar className="h-4 w-4 text-indigo-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-0 shadow-md bg-slate-700 border-slate-600">
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.startDate || undefined}
                      onSelect={(date) => setDateRange({ ...dateRange, startDate: date })}
                      className="rounded-md bg-slate-700 text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-slate-300">End Date</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-[180px] flex justify-between shadow-sm bg-slate-700 border-slate-600 text-slate-200"
                    >
                      {dateRange.endDate ? format(dateRange.endDate, "MMM d, yyyy") : "Pick a date"}
                      <Calendar className="h-4 w-4 text-indigo-400" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 border-0 shadow-md bg-slate-700 border-slate-600">
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.endDate || undefined}
                      onSelect={(date) => setDateRange({ ...dateRange, endDate: date })}
                      className="rounded-md bg-slate-700 text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="flex gap-2 self-end">
              <Button 
                variant="outline" 
                onClick={() => handleDatePreset('today')} 
                className="text-sm bg-slate-700 border-slate-600 text-slate-200"
              >
                Today
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleDatePreset('week')} 
                className="text-sm bg-slate-700 border-slate-600 text-slate-200"
              >
                Last 7 Days
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleDatePreset('month')} 
                className="text-sm bg-slate-700 border-slate-600 text-slate-200"
              >
                Last 30 Days
              </Button>
              <Button 
                variant="secondary"
                onClick={() => setDateRange({ startDate: null, endDate: null })}
                className="text-sm font-medium bg-slate-700 text-slate-200"
              >
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Expected Revenue KPI Card */}
        <Card className="border-0 shadow-lg overflow-hidden rounded-xl bg-slate-800 border-slate-700">
          <CardHeader className="bg-slate-800 border-b border-slate-700 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-medium text-slate-200">Expected Revenue</CardTitle>
              </div>
              <div className="p-3 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 shadow-md">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 bg-slate-800">
            <div className="text-4xl font-bold text-center py-6 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              ${totalExpectedRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        {/* Actual Revenue KPI Card */}
        <Card className="border-0 shadow-lg overflow-hidden rounded-xl bg-slate-800 border-slate-700">
          <CardHeader className="bg-slate-800 border-b border-slate-700 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-medium text-slate-200">Actual Revenue</CardTitle>
              </div>
              <div className="p-3 rounded-full bg-gradient-to-br from-teal-500 to-emerald-600 shadow-md">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 bg-slate-800">
            <div className="text-4xl font-bold text-center py-6 bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
              ${totalActualRevenue.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        {/* Expected Customer Count KPI Card */}
        <Card className="border-0 shadow-lg overflow-hidden rounded-xl bg-slate-800 border-slate-700">
          <CardHeader className="bg-slate-800 border-b border-slate-700 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-medium text-slate-200">Expected Customers</CardTitle>
              </div>
              <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 shadow-md">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 bg-slate-800">
            <div className="text-4xl font-bold text-center py-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              {totalExpectedCustomerCount}
            </div>
          </CardContent>
        </Card>
        
        {/* Actual Customer Count KPI Card (NEW) */}
        <Card className="border-0 shadow-lg overflow-hidden rounded-xl bg-slate-800 border-slate-700">
          <CardHeader className="bg-slate-800 border-b border-slate-700 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-medium text-slate-200">Actual Customers</CardTitle>
              </div>
              <div className="p-3 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-md">
                <Users className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 bg-slate-800">
            <div className="text-4xl font-bold text-center py-6 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
              {totalActualCustomerCount}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Dashboard Content */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Expected vs Actual Revenue Chart */}
        <Card className="col-span-1 md:col-span-4 border-0 shadow-lg overflow-hidden rounded-xl bg-slate-800 border-slate-700">
          <CardHeader className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-slate-700 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg font-medium text-slate-200 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-indigo-400" />
                  Expected vs Actual Revenue Comparison
                </CardTitle>
              </div>
              <div className="bg-slate-700 px-3 py-1 rounded-full text-xs text-slate-300 shadow-sm border border-slate-600">
                Updated {format(new Date(), "MMM d, yyyy")}
              </div>
            </div>
          </CardHeader>
          <CardContent className="bg-slate-800 p-6 h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={combinedRevenueData} 
                margin={{ top: 20, right: 30, left: 70, bottom: 70 }}
              >
                <defs>
                  <linearGradient id="expectedRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.3}/>
                  </linearGradient>
                  <linearGradient id="actualRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#e2e8f0', fontSize: 11 }} 
                  axisLine={{ stroke: '#475569' }}
                  tickFormatter={(value) => format(new Date(value), "MMM d")}
                  dy={10}
                >
                  <Label 
                    value="Date" 
                    position="bottom" 
                    offset={45}
                    style={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 500 }}
                  />
                </XAxis>
                <YAxis 
                  tick={{ fill: '#e2e8f0', fontSize: 11 }} 
                  axisLine={{ stroke: '#475569' }}
                  tickFormatter={(value) => `$${value}`}
                  dx={0}
                >
                  <Label 
                    value="Revenue (USD)" 
                    angle={-90} 
                    position="left" 
                    offset={-0.1}
                    style={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 500, textAnchor: 'middle' }}
                  />
                </YAxis>
                <Tooltip 
                  formatter={(value: any, name) => {
                    if (name === 'expectedRevenue' || name === 'Expected Revenue') 
                      return [`$${Number(value).toFixed(2)}`, 'Expected Revenue'];
                    if (name === 'actualRevenue' || name === 'Actual Revenue') 
                      return [`$${Number(value).toFixed(2)}`, 'Actual Revenue'];
                    return [value, name];
                  }}
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    color: '#e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#e2e8f0' }}
                  labelFormatter={(value) => format(new Date(value), "MMMM d, yyyy")}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', color: '#e2e8f0' }} />
                <Bar 
                  name="Expected Revenue"
                  dataKey="expectedRevenue" 
                  fill="url(#expectedRevenueGradient)"
                  radius={[4, 4, 0, 0]}
                  barSize={15}
                  stackId="a"
                />
                <Bar 
                  name="Actual Revenue"
                  dataKey="actualRevenue" 
                  fill="url(#actualRevenueGradient)"
                  radius={[4, 4, 0, 0]}
                  barSize={15}
                  stackId="b"
                />
                <Line 
                  name="Expected Trend"
                  type="monotone"
                  dataKey="expectedRevenue" 
                  stroke="#818cf8" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#1e293b' }}
                  activeDot={{ r: 6, stroke: '#1e293b', strokeWidth: 2, fill: '#818cf8' }}
                />
                <Line 
                  name="Actual Trend"
                  type="monotone"
                  dataKey="actualRevenue" 
                  stroke="#34d399" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#1e293b' }}
                  activeDot={{ r: 6, stroke: '#1e293b', strokeWidth: 2, fill: '#34d399' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer Count vs Date (MODIFIED) */}
        <Card className="col-span-1 md:col-span-4 border-0 shadow-lg overflow-hidden rounded-xl bg-slate-800 border-slate-700">
          <CardHeader className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border-b border-slate-700 pb-4">
            <CardTitle className="text-lg font-medium text-slate-200 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-400" />
              Expected vs Actual Customer Comparison
            </CardTitle>
          </CardHeader>
          <CardContent className="bg-slate-800 p-6 h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart 
                data={combinedCustomerData}
                margin={{ top: 20, right: 30, left: 30, bottom: 70 }}
              >
                <defs>
                  <linearGradient id="expectedCustomerGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  </linearGradient>
                  <linearGradient id="actualCustomerGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#e2e8f0', fontSize: 11 }} 
                  axisLine={{ stroke: '#475569' }}
                  tickFormatter={(value) => format(new Date(value), "MMM d")}
                  dy={10}
                >
                  <Label 
                    value="Date" 
                    position="bottom" 
                    offset={45}
                    style={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 500 }}
                  />
                </XAxis>
                <YAxis 
                  tick={{ fill: '#e2e8f0', fontSize: 11 }} 
                  axisLine={{ stroke: '#475569' }}
                  dx={-20}
                >
                  <Label 
                    value="Number of Customers" 
                    angle={-90} 
                    position="left" 
                    offset={-2}
                    style={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 500, textAnchor: 'middle' }}
                  />
                </YAxis>
                <Tooltip 
                  formatter={(value: any, name) => {
                    if (name === 'expectedCustomerCount' || name === 'Expected Customers') 
                      return [value, 'Expected Customers'];
                    if (name === 'actualCustomerCount' || name === 'Actual Customers') 
                      return [value, 'Actual Customers'];
                    return [value, name];
                  }}
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    color: '#e2e8f0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  labelStyle={{ fontWeight: 'bold', color: '#e2e8f0' }}
                  labelFormatter={(value) => format(new Date(value), "MMMM d, yyyy")}
                />
                <Legend wrapperStyle={{ paddingTop: '10px', color: '#e2e8f0' }} />
                <Bar 
                  name="Expected Customers"
                  dataKey="expectedCustomerCount" 
                  fill="url(#expectedCustomerGradient)" 
                  radius={[4, 4, 0, 0]}
                  barSize={15}
                  stackId="a"
                />
                <Bar 
                  name="Actual Customers"
                  dataKey="actualCustomerCount" 
                  fill="url(#actualCustomerGradient)" 
                  radius={[4, 4, 0, 0]}
                  barSize={15}
                  stackId="b"
                />
                <Line 
                  name="Expected Trend"
                  type="monotone"
                  dataKey="expectedCustomerCount" 
                  stroke="#60a5fa" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#1e293b' }}
                  activeDot={{ r: 6, stroke: '#1e293b', strokeWidth: 2, fill: '#60a5fa' }}
                />
                <Line 
                  name="Actual Trend"
                  type="monotone"
                  dataKey="actualCustomerCount" 
                  stroke="#fbbf24" 
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 2, fill: '#1e293b' }}
                  activeDot={{ r: 6, stroke: '#1e293b', strokeWidth: 2, fill: '#fbbf24' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* List of Customers By Date - Combined Expected and Actual */}
        <Card className="col-span-1 md:col-span-4 border-0 shadow-lg overflow-hidden rounded-xl bg-slate-800 border-slate-700">
          <CardHeader className="bg-gradient-to-r from-purple-500/10 to-purple-500/10 border-b border-slate-700 pb-4">
            <CardTitle className="text-lg font-medium text-slate-200 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-purple-400" />
              Customer Payment Activity
            </CardTitle>
            <CardDescription className="text-sm text-slate-400">
              Customers expected to pay and actual payments in the selected date range
            </CardDescription>
          </CardHeader>
          <CardContent className="bg-slate-800 p-0 max-h-[380px] overflow-auto">
            {customersByDate.length > 0 || actualCustomersByDate.length > 0 ? (
              <div>
                {/* Create a combined list of all dates */}
                {(() => {
                  // Create a map of all dates from both expected and actual
                  const allDatesMap = new Map();
                  
                  // Add expected dates
                  customersByDate.forEach(dateGroup => {
                    allDatesMap.set(dateGroup.date, {
                      date: dateGroup.date,
                      expected: dateGroup.customers,
                      actual: []
                    });
                  });
                  
                  // Add actual dates or merge with existing
                  actualCustomersByDate.forEach(dateGroup => {
                    if (allDatesMap.has(dateGroup.date)) {
                      const existing = allDatesMap.get(dateGroup.date);
                      existing.actual = dateGroup.customers;
                    } else {
                      allDatesMap.set(dateGroup.date, {
                        date: dateGroup.date,
                        expected: [],
                        actual: dateGroup.customers
                      });
                    }
                  });
                  
                  // Convert map to array and sort by date
                  return Array.from(allDatesMap.values())
                    .sort((a, b) => a.date.localeCompare(b.date))
                    .map(dateGroup => (
                      <div key={dateGroup.date} className="border-b border-slate-700 last:border-0">
                        <div className="font-medium text-slate-200 bg-slate-700 p-4 sticky top-0 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-indigo-400" />
                          {format(new Date(dateGroup.date), "MMMM d, yyyy")}
                          <div className="flex ml-2 gap-2">
                            {dateGroup.expected.length > 0 && (
                              <span className="bg-indigo-800 text-indigo-200 text-xs py-0.5 px-2 rounded-full">
                                {dateGroup.expected.length} expected
                              </span>
                            )}
                            {dateGroup.actual.length > 0 && (
                              <span className="bg-emerald-800 text-emerald-200 text-xs py-0.5 px-2 rounded-full">
                                {dateGroup.actual.length} paid
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {/* Expected Customers */}
                        {dateGroup.expected.length > 0 && (
                          <div className="border-b border-slate-700 bg-slate-800/70">
                            <div className="px-4 py-2 text-sm font-medium text-indigo-300 bg-indigo-900/20 border-b border-slate-700">
                              <Clock className="h-3 w-3 inline-block mr-1" /> Expected Payments
                            </div>
                            {dateGroup.expected.map((customer, idx) => (
                              <div key={`expected-${customer.id}-${idx}`} className="p-4 border-t border-slate-700 hover:bg-slate-700 transition-colors">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="font-medium text-slate-200 flex items-center">
                                      <div className="w-8 h-8 rounded-full bg-indigo-900 text-indigo-300 flex items-center justify-center mr-2 font-bold">
                                        {customer.email.charAt(0).toUpperCase()}
                                      </div>
                                      {customer.email}
                                    </div>
                                    <div className="text-sm text-slate-400 mt-1 ml-10">
                                      <span className="inline-block bg-slate-700 px-2 py-1 rounded text-xs mr-2">
                                        ID: {customer.id}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                    ${customer.amount.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Actual Customers */}
                        {dateGroup.actual.length > 0 && (
                          <div>
                            <div className="px-4 py-2 text-sm font-medium text-emerald-300 bg-emerald-900/20 border-b border-slate-700">
                              <Check className="h-3 w-3 inline-block mr-1" /> Actual Payments
                            </div>
                            {dateGroup.actual.map((customer, idx) => (
                              <div key={`actual-${customer.id}-${idx}`} className="p-4 border-t border-slate-700 hover:bg-slate-700 transition-colors">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="font-medium text-slate-200 flex items-center">
                                      <div className="w-8 h-8 rounded-full bg-emerald-900 text-emerald-300 flex items-center justify-center mr-2 font-bold">
                                        {customer.email.charAt(0).toUpperCase()}
                                      </div>
                                      {customer.email}
                                    </div>
                                    <div className="text-sm text-slate-400 mt-1 ml-10">
                                      <span className="inline-block bg-slate-700 px-2 py-1 rounded text-xs mr-2">
                                        ID: {customer.id}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                                    ${customer.amount.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ));
                })()}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-slate-500" />
                </div>
                <p className="text-slate-400 font-medium">No customer payment activity in selected date range</p>
                <p className="text-slate-500 text-sm mt-2">Try selecting a different date range</p>
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Dashboard;