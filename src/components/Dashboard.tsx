import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { ArrowLeft, Calendar, RefreshCw, DollarSign, Users, TrendingUp, Check, Clock } from 'lucide-react';
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
  data: any[];
  schema: any;
  onBack: () => void;
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
    chart1Data, // Expected vs New Sales vs Retained
    chart2Data, // Expected vs Retained
    totalExpectedRevenue,
    expectedCustomersSegregated, // Modified to segregated expected customers
    newSalesCustomers, // New sales customers with revenue
    revenueMetrics,
    totalRevenue, // Added totalRevenue
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
            Revenue Dashboard
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

      {/* CHART 1: Expected Revenue vs New Sales vs Retained Revenue */}
      <Card className="mb-6 shadow-lg border-0 overflow-hidden bg-gradient-to-b from-white to-gray-50">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <CardTitle className="text-lg font-semibold">Expected Revenue vs New Sales vs Retained Revenue</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Updated {format(new Date(), "MMM d, yyyy")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chart1Data}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                barGap={5}
                barCategoryGap="20%"
                className="drop-shadow-xl"
              >
                <defs>
                  <linearGradient id="expectedRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={1} />
                    <stop offset="100%" stopColor="#fb923c" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="newSalesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="retainedRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0.8} />
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
                  barSize={24}
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                  filter="url(#shadow)"
                  strokeWidth={0}
                />
                <Bar 
                  dataKey="newSales" 
                  name="New Sales" 
                  fill="url(#newSalesGradient)"
                  barSize={24}
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                  filter="url(#shadow)"
                  strokeWidth={0}
                />
                <Bar 
                  dataKey="retainedRevenue" 
                  name="Retained Revenue" 
                  fill="url(#retainedRevenueGradient)"
                  barSize={24}
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

      {/* CHART 2: Expected Revenue vs Retained Revenue */}
      <Card className="mb-6 shadow-lg border-0 overflow-hidden bg-gradient-to-b from-white to-gray-50">
        <CardHeader className="flex flex-row items-center justify-between border-b border-gray-100 pb-3">
          <div>
            <CardTitle className="text-lg font-semibold">Expected Revenue vs Retained Revenue</CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Updated {format(new Date(), "MMM d, yyyy")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-2 pt-4">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chart2Data}
                margin={{ top: 20, right: 30, left: 10, bottom: 20 }}
                barGap={5}
                barCategoryGap="20%"
                className="drop-shadow-xl"
              >
                <defs>
                  <linearGradient id="expectedRevenueGradient2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f97316" stopOpacity={1} />
                    <stop offset="100%" stopColor="#fb923c" stopOpacity={0.8} />
                  </linearGradient>
                  <linearGradient id="retainedRevenueGradient2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                    <stop offset="100%" stopColor="#34d399" stopOpacity={0.8} />
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
                  dataKey="expectedRevenue" 
                  name="Expected Revenue" 
                  fill="url(#expectedRevenueGradient2)" 
                  barSize={32}
                  radius={[4, 4, 0, 0]}
                  animationDuration={1500}
                  animationEasing="ease-in-out"
                  filter="url(#shadow)"
                  strokeWidth={0}
                />
                <Bar 
                  dataKey="retainedRevenue" 
                  name="Retained Revenue" 
                  fill="url(#retainedRevenueGradient2)"
                  barSize={32}
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

      {/* KPI Cards Section - MOVED BELOW THE CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Total Revenue KPI Card - NEWLY ADDED */}
        <Card className="shadow-md border-0 hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="rounded-full bg-purple-100 p-1.5">
                <DollarSign size={18} className="text-purple-600" />
              </div>
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-purple-700">
              ${totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </span>
          </CardContent>
        </Card>
        
        {/* Expected Revenue KPI Card */}
        <Card className="shadow-md border-0 hover:shadow-lg transition-shadow bg-gradient-to-br from-orange-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="rounded-full bg-orange-100 p-1.5">
                <DollarSign size={18} className="text-orange-600" />
              </div>
              Expected Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-orange-700">
              ${totalExpectedRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </span>
          </CardContent>
        </Card>

        {/* Retained Revenue KPI Card */}
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

        {/* New Sales KPI Card */}
        <Card className="shadow-md border-0 hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="rounded-full bg-blue-100 p-1.5">
                <TrendingUp size={18} className="text-blue-600" />
              </div>
              New Sales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-blue-700">
              ${revenueMetrics.totals.newSales.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </span>
          </CardContent>
        </Card>

        {/* Lost Revenue KPI Card */}
        <Card className="shadow-md border-0 hover:shadow-lg transition-shadow bg-gradient-to-br from-red-50 to-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <div className="rounded-full bg-red-100 p-1.5">
                <DollarSign size={18} className="text-red-600" />
              </div>
              Lost Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-3xl font-bold text-red-700">
              ${revenueMetrics.totals.lostRevenue.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Customer Lists - Segregated into Expected and New Sales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Expected Customers (Segregated as actual and paid) */}
        <Card className="shadow-lg border-0 overflow-hidden bg-gradient-to-b from-white to-gray-50">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users size={18} className="text-gray-700" />
              Expected Customers
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Customers expected from previous month
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 max-h-[600px] overflow-y-auto">
            {/* Not Paid (Actual) Customers */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2 text-sm">
                <Clock size={16} className="text-blue-500" />
                Expected (Not Paid)
              </h3>
              
              {expectedCustomersSegregated.actual.length > 0 ? (
                <div className="space-y-2">
                  {expectedCustomersSegregated.actual.map((customer, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-lg border border-blue-100 hover:bg-blue-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center text-blue-700 font-medium shadow-sm">
                          {customer.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-blue-900">{customer.email}</div>
                          <div className="text-xs text-blue-700">ID: {customer.id}</div>
                          <div className="text-xs text-blue-700 mt-1">
                            <span className="font-medium">Expected Payment: </span>
                            {customer.expectedDate || "N/A"}
                          </div>
                        </div>
                      </div>
                      <div className="font-semibold text-blue-900 bg-white py-1 px-2 rounded-md shadow-sm border border-blue-100">
                        ${customer.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
                  <p>No expected customers pending payment</p>
                </div>
              )}
            </div>
            
            {/* Paid Customers */}
            <div>
              <h3 className="font-medium text-gray-700 mb-3 flex items-center gap-2 text-sm">
                <Check size={16} className="text-green-500" />
                Expected (Paid)
              </h3>
              
              {expectedCustomersSegregated.paid.length > 0 ? (
                <div className="space-y-2">
                  {expectedCustomersSegregated.paid.map((customer, idx) => (
                    <div key={idx} className="flex items-center justify-between py-2 px-3 bg-green-50 rounded-lg border border-green-100 hover:bg-green-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-medium shadow-sm">
                          {customer.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-green-900">{customer.email}</div>
                          <div className="text-xs text-green-700">ID: {customer.id}</div>
                          <div className="text-xs text-green-700 mt-1">
                            <span className="font-medium">Expected Payment: </span>
                            {customer.expectedDate || "N/A"}
                          </div>
                          <div className="text-xs text-green-700">
                            <span className="font-medium">Payment Date: </span>
                            {customer.paymentDate || "N/A"}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="font-semibold text-green-900 bg-white py-1 px-2 rounded-md shadow-sm border border-green-100">
                          ${customer.paidAmount.toFixed(2)}
                        </div>
                        <div className="text-xs text-green-700 mt-1">
                          Expected: ${customer.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
                  <p>No expected customers have paid</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* New Sales Customers */}
        <Card className="shadow-lg border-0 overflow-hidden bg-gradient-to-b from-white to-gray-50">
          <CardHeader className="border-b border-gray-100">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              New Sales Customers
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Customers who weren't in the previous month
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 max-h-[600px] overflow-y-auto">
            {newSalesCustomers.length > 0 ? (
              <div className="space-y-2">
                {newSalesCustomers.map((customer, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 px-3 bg-indigo-50 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-medium shadow-sm">
                        {customer.email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium text-indigo-900">{customer.email}</div>
                        <div className="text-xs text-indigo-700">ID: {customer.id}</div>
                        <div className="text-xs text-indigo-700 mt-1">
                          <span className="font-medium">Payment Date: </span>
                          {customer.paymentDate || "N/A"}
                        </div>
                      </div>
                    </div>
                    <div className="font-semibold text-indigo-900 bg-white py-1 px-2 rounded-md shadow-sm border border-indigo-100">
                      ${customer.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-lg border border-gray-100">
                <p>No new sales customers in the selected period</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
