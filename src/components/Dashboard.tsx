import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ComposedChart, Line, Legend
} from 'recharts';
import { ArrowLeft, Calendar, RefreshCw, DollarSign, Users, TrendingUp, Check, Clock, BarChart2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

// Import the logic hooks and utilities
import { 
  COLORS, 
  useDashboardData, 
  formatCurrency, 
  formatFullDate, 
  formatDate 
} from './DashboardLogic';

interface DashboardProps {
  data: any[]; // The result array from getData
  schema: any; // Schema of the table
  onBack: () => void; // Callback to switch back to DataTable view
}

// Custom tooltip component for enhanced styling
const CustomTooltip = ({ active, payload, label, formatter, labelFormatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{
        backgroundColor: '#fff',
        border: '1px solid #e2e8f0',
        padding: '12px 16px',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        maxWidth: '300px'
      }}>
        <p className="tooltip-label" style={{
          margin: '0 0 10px 0',
          fontWeight: 'bold',
          fontSize: '14px',
          color: '#1e293b',
          borderBottom: '1px solid #f1f5f9',
          paddingBottom: '6px'
        }}>{labelFormatter ? labelFormatter(label) : label}</p>
        <div className="tooltip-content">
          {payload.map((entry: any, index: number) => {
            const formattedValue = formatter 
              ? formatter(entry.value, entry.name)
              : entry.value;
            
            return (
              <div key={`item-${index}`} className="tooltip-item" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                margin: '8px 0',
                fontSize: '13px'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center' 
                }}>
                  <div style={{ 
                    width: '10px', 
                    height: '10px', 
                    backgroundColor: entry.color,
                    marginRight: '8px',
                    borderRadius: '50%' 
                  }}></div>
                  <span style={{ 
                    color: '#64748b',
                    fontWeight: 500
                  }}>
                    {entry.name}:
                  </span>
                </div>
                <span style={{ 
                  fontWeight: 'bold',
                  color: '#1e293b',
                  marginLeft: '12px'
                }}>
                  {Array.isArray(formattedValue) ? formattedValue[0] : formattedValue}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ data, schema, onBack }) => {
  // Use our custom dashboard data hook
  const {
    dateRange,
    setDateRange,
    lastUpdated,
    displayDateRange,
    combinedRevenueData,
    totalExpectedRevenue,
    totalActualRevenue,
    customersByDate,
    actualCustomersByDate,
    revenueMetrics,
    handleDatePreset
  } = useDashboardData(data, schema);

  // Main component render
  return (
    <div className="flex flex-col w-full">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-1 text-gray-600 shadow-sm hover:shadow-md transition-shadow"
          >
            <ArrowLeft size={16} />
            Back
          </Button>
          <h1 className="text-xl font-semibold text-gray-800">
            Expected Revenue vs Days in Advance
          </h1>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-500">
          <RefreshCw size={14} className="animate-pulse" />
          <span>Last updated: {lastUpdated}</span>
        </div>
      </div>

      {/* Date Filter */}
      <Card className="mb-6 shadow-md border-0 hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar size={18} className="text-indigo-500" />
            Select Date Range
          </CardTitle>
          {dateRange.startDate && dateRange.endDate && (
            <CardDescription className="text-sm text-gray-600">
              Selected date range: {displayDateRange.start} to {displayDateRange.end}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 border rounded-lg px-3 py-2 shadow-sm hover:shadow transition-shadow"
                style={{ minWidth: "180px" }}
              >
                <Calendar size={16} />
                {dateRange.startDate ? format(dateRange.startDate, "MMM d, yyyy") : "Pick a start date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 shadow-xl">
              <CalendarComponent
                mode="single"
                selected={dateRange.startDate}
                onSelect={date => date && setDateRange({ ...dateRange, startDate: date })}
                className="rounded-md"
                classNames={{
                  root: "bg-white",
                  day_selected: `bg-[${COLORS.primary}] text-white`,
                  day_today: `text-[${COLORS.primary}]`
                }}
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex items-center gap-2 border rounded-lg px-3 py-2 shadow-sm hover:shadow transition-shadow"
                style={{ minWidth: "180px" }}
              >
                <Calendar size={16} />
                {dateRange.endDate ? format(dateRange.endDate, "MMM d, yyyy") : "Pick an end date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 shadow-xl">
              <CalendarComponent
                mode="single"
                selected={dateRange.endDate}
                onSelect={date => date && setDateRange({ ...dateRange, endDate: date })}
                className="rounded-md"
                classNames={{
                  root: "bg-white",
                  day_selected: `bg-[${COLORS.primary}] text-white`,
                  day_today: `text-[${COLORS.primary}]`
                }}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            onClick={() => handleDatePreset('today')}
            className="shadow-sm hover:shadow transition-shadow"
            style={{
              borderColor: COLORS.neutralBorder,
              color: COLORS.textSecondary,
              backgroundColor: COLORS.white,
              borderRadius: '8px',
              fontWeight: 500,
              fontSize: '0.875rem',
            }}
          >
            Today
          </Button>

          <Button
            variant="outline"
            onClick={() => handleDatePreset('week')}
            className="shadow-sm hover:shadow transition-shadow"
            style={{
              borderColor: COLORS.neutralBorder,
              color: COLORS.textSecondary,
              backgroundColor: COLORS.white,
              borderRadius: '8px',
              fontWeight: 500,
              fontSize: '0.875rem',
            }}
          >
            Last 7 Days
          </Button>

          <Button
            variant="outline"
            onClick={() => handleDatePreset('month')}
            className="shadow-sm hover:shadow transition-shadow"
            style={{
              borderColor: COLORS.neutralBorder,
              color: COLORS.textSecondary,
              backgroundColor: COLORS.white,
              borderRadius: '8px',
              fontWeight: 500,
              fontSize: '0.875rem',
            }}
          >
            Last 30 Days
          </Button>

          <Button
            variant="link"
            onClick={() => setDateRange({ startDate: null, endDate: null })}
            style={{
              color: COLORS.primary,
              fontWeight: 600,
              fontSize: '0.875rem',
              borderRadius: '8px',
            }}
          >
            Reset
          </Button>
        </CardContent>
      </Card>

      {/* Daily Charts Section - MOVED BEFORE KPI CARDS */}
      {/* Expected vs Actual Revenue Chart - CONVERTED TO BAR CHART AND ENHANCED */}
      <Card className="mb-6 shadow-lg border-0 overflow-hidden bg-gradient-to-b from-white to-gray-50">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <CardTitle className="text-lg font-semibold">Daily Revenue: Expected vs Actual</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Updated {format(new Date(), "MMM d, yyyy")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={combinedRevenueData}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                barGap={5}
                barCategoryGap="20%"
                className="drop-shadow-xl"
              >
                <defs>
                  <linearGradient id="expectedRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.chartExpectedGradient[0]} stopOpacity={1} />
                    <stop offset="100%" stopColor={COLORS.chartExpectedGradient[1]} stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="actualRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.chartActualGradient[0]} stopOpacity={1} />
                    <stop offset="100%" stopColor={COLORS.chartActualGradient[1]} stopOpacity={0.8} />
                  </linearGradient>
                  <filter id="shadow" height="200%">
                    <feDropShadow dx="0" dy="4" stdDeviation="8" floodColor="rgba(0, 0, 0, 0.2)" />
                  </filter>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={COLORS.neutralBorder} 
                  vertical={false}
                  opacity={0.5}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                  stroke={COLORS.neutralBorder}
                  tickMargin={10}
                  axisLine={{ stroke: COLORS.neutralBorder }}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  tickFormatter={(value) => `$${value}`}
                  tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                  stroke={COLORS.neutralBorder}
                  tickMargin={10}
                  axisLine={{ stroke: COLORS.neutralBorder }}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  content={<CustomTooltip formatter={formatCurrency} labelFormatter={formatFullDate} />}
                  cursor={{ fill: COLORS.neutral, opacity: 0.2 }}
                  animationDuration={300}
                />
                <Legend
                  verticalAlign="top"
                  wrapperStyle={{ paddingBottom: 10 }}
                  iconType="circle"
                  iconSize={10}
                />
                <Bar 
                  dataKey="expectedRevenue" 
                  name="Expected Revenue" 
                  fill="url(#expectedRevenueGradient)" 
                  barSize={28}
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                  filter="url(#shadow)"
                  strokeWidth={0}
                />
                <Bar 
                  dataKey="actualRevenue" 
                  name="Actual Revenue" 
                  fill="url(#actualRevenueGradient)"
                  barSize={28}
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                  filter="url(#shadow)"
                  strokeWidth={0}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* NEW: Revenue Metrics Chart (Retained, Lost, New) - CONVERTED TO BAR CHART AND ENHANCED */}
      <Card className="mb-6 shadow-lg border-0 overflow-hidden bg-gradient-to-b from-white to-gray-50">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <CardTitle className="text-lg font-semibold">Revenue Retention and Analysis</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Updated {format(new Date(), "MMM d, yyyy")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueMetrics.byDay}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                barGap={5}
                barCategoryGap="10%"
                className="drop-shadow-xl"
              >
                <defs>
                  <linearGradient id="retainedRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.successGradient[0]} stopOpacity={1} />
                    <stop offset="100%" stopColor={COLORS.successGradient[1]} stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="lostRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.dangerGradient[0]} stopOpacity={1} />
                    <stop offset="100%" stopColor={COLORS.dangerGradient[1]} stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="newSalesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.primaryGradient[0]} stopOpacity={1} />
                    <stop offset="100%" stopColor={COLORS.primaryGradient[1]} stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={COLORS.neutralBorder} 
                  vertical={false}
                  opacity={0.5}
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatDate}
                  tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                  stroke={COLORS.neutralBorder}
                  tickMargin={10}
                  axisLine={{ stroke: COLORS.neutralBorder }}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  tickFormatter={(value) => `$${value}`}
                  tick={{ fill: COLORS.textSecondary, fontSize: 12 }}
                  stroke={COLORS.neutralBorder}
                  tickMargin={10}
                  axisLine={{ stroke: COLORS.neutralBorder }}
                  domain={[0, 'auto']}
                />
                <Tooltip
                  content={<CustomTooltip formatter={formatCurrency} labelFormatter={formatFullDate} />}
                  cursor={{ fill: COLORS.neutral, opacity: 0.2 }}
                  animationDuration={300}
                />
                <Legend
                  verticalAlign="top"
                  wrapperStyle={{ paddingBottom: 10 }}
                  iconType="circle"
                  iconSize={10}
                />
                <Bar 
                  dataKey="retainedRevenue" 
                  name="Retained Revenue" 
                  fill="url(#retainedRevenueGradient)"
                  barSize={20}
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                  animationBegin={0}
                  animationEasing="ease-in-out"
                  filter="url(#shadow)"
                  strokeWidth={0}
                />
                <Bar 
                  dataKey="lostRevenue" 
                  name="Lost Revenue" 
                  fill="url(#lostRevenueGradient)"
                  barSize={20}
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                  animationBegin={200}
                  animationEasing="ease-in-out"
                  filter="url(#shadow)"
                  strokeWidth={0}
                />
                <Bar 
                  dataKey="newSales" 
                  name="New Sales" 
                  fill="url(#newSalesGradient)"
                  barSize={20}
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                  animationBegin={400}
                  animationEasing="ease-in-out"
                  filter="url(#shadow)"
                  strokeWidth={0}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards - MOVED AFTER DAILY CHARTS AND ENHANCED */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Expected Revenue KPI Card */}
        <Card className="shadow-md border-0 hover:shadow-lg transition-shadow bg-gradient-to-br from-indigo-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="rounded-full bg-indigo-100 p-1.5">
                <DollarSign size={18} className="text-indigo-600" />
              </div>
              Expected Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-indigo-700">
              ${totalExpectedRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </span>
          </CardContent>
        </Card>

        {/* Actual Revenue KPI Card */}
        <Card className="shadow-md border-0 hover:shadow-lg transition-shadow bg-gradient-to-br from-emerald-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="rounded-full bg-emerald-100 p-1.5">
                <DollarSign size={18} className="text-emerald-600" />
              </div>
              Actual Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-emerald-700">
              ${totalActualRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </span>
          </CardContent>
        </Card>

        {/* NEW: Retained Revenue KPI Card */}
        <Card className="shadow-md border-0 hover:shadow-lg transition-shadow bg-gradient-to-br from-green-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="rounded-full bg-green-100 p-1.5">
                <Check size={18} className="text-green-600" />
              </div>
              Retained Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-green-700">
              ${revenueMetrics.totals.retainedRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </span>
          </CardContent>
        </Card>

        {/* NEW: Lost Revenue and New Sales KPI Card */}
        <Card className="shadow-md border-0 hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="rounded-full bg-blue-100 p-1.5">
                <TrendingUp size={18} className="text-blue-600" />
              </div>
              New & Lost Revenue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span className="font-medium text-red-600">Lost:</span>
              </span>
              <span className="text-lg font-semibold text-red-700">
                ${revenueMetrics.totals.lostRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span className="font-medium text-blue-600">New:</span>
              </span>
              <span className="text-lg font-semibold text-blue-700">
                ${revenueMetrics.totals.newSales.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List of Customers By Date - Combined Expected and Actual - ENHANCED */}
      <Card className="shadow-lg border-0 overflow-hidden bg-gradient-to-b from-white to-gray-50">
        <CardHeader className="border-b border-gray-100">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Users size={18} className="text-gray-700" />
            Customer Payment Activity - Daywise List
          </CardTitle>
          <CardDescription className="text-sm text-gray-500">
            Customers expected to pay and actual payments in the selected date range
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {customersByDate.length > 0 || actualCustomersByDate.length > 0 ? (
            <div className="space-y-0.5 p-4">
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
                    <div key={dateGroup.date} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow mb-4 bg-white">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-medium text-gray-700 flex items-center gap-2">
                          <Calendar size={16} className="text-indigo-500" />
                          {format(new Date(dateGroup.date), "MMMM d, yyyy")}
                        </h3>
                        <div className="flex gap-4">
                          {dateGroup.expected.length > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                              {dateGroup.expected.length} expected
                            </span>
                          )}
                          {dateGroup.actual.length > 0 && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                              {dateGroup.actual.length} paid
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Grid layout for expected and actual columns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                        {/* Expected Customers */}
                        <div className="p-4">
                          <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <Clock size={16} className="text-blue-500" />
                            Expected Payments
                          </h4>
                          {dateGroup.expected.length > 0 ? (
                            <div className="space-y-2">
                              {dateGroup.expected.map((customer, idx) => (
                                <div key={idx} className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-medium shadow-sm">
                                      {customer.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="font-medium text-blue-900">{customer.email}</div>
                                      <div className="text-xs text-blue-700">ID: {customer.id}</div>
                                    </div>
                                  </div>
                                  <div className="font-semibold text-blue-900 bg-white py-1 px-2 rounded-md shadow-sm border border-blue-100">
                                    ${customer.amount.toFixed(2)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
                              <Clock size={24} className="mx-auto text-gray-300 mb-2" />
                              None expected
                            </div>
                          )}
                        </div>

                        {/* Actual Customers */}
                        <div className="p-4">
                          <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                            <Check size={16} className="text-green-500" />
                            Actual Payments
                          </h4>
                          {dateGroup.actual.length > 0 ? (
                            <div className="space-y-2">
                              {dateGroup.actual.map((customer, idx) => (
                                <div key={idx} className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors">
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-medium shadow-sm">
                                      {customer.email.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="font-medium text-green-900">{customer.email}</div>
                                      <div className="text-xs text-green-700">ID: {customer.id}</div>
                                    </div>
                                  </div>
                                  <div className="font-semibold text-green-900 bg-white py-1 px-2 rounded-md shadow-sm border border-green-100">
                                    ${customer.amount.toFixed(2)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
                              <DollarSign size={24} className="mx-auto text-gray-300 mb-2" />
                              None paid
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ));
              })()}
            </div>
          ) : (
            <div className="text-center py-10">
              <BarChart2 size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-1">No customer payment activity in selected date range</h3>
              <p className="text-gray-500">Try selecting a different date range</p>
            </div>
          )}

          {!(dateRange.startDate && dateRange.endDate) && (
            <div className="text-center py-10">
              <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-1">Choose a date range</h3>
              <p className="text-gray-500">Choose a start and end date above to view customer activity</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
