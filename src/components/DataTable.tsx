import React, { useState, useEffect } from 'react';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowUpDown, Download, BarChart, Calendar, ChevronDown, ChevronUp, Activity } from 'lucide-react';
import { format, isAfter, isBefore, isValid } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";

interface DataTableProps {
  data: any[]; // The result array from getData
  schema: any; // Schema of the table
  onViewDashboard: () => void; // Callback to switch to Dashboard view
}

const DataTable: React.FC<DataTableProps> = ({ data, schema, onViewDashboard }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'ascending' | 'descending';
  }>({
    key: 'created_at', // Default sort by created_at
    direction: 'descending' // Default to newest first
  });

  // Date filter state
  const [dateRange, setDateRange] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({
    startDate: null,
    endDate: null,
  });

  const [activeRow, setActiveRow] = useState(null);
  const [showAnimation, setShowAnimation] = useState(false);

  // Ensure data is valid
  const tableData = Array.isArray(data) ? data : [];

  // Extract columns from schema if available
  const columns = schema?.fields?.map((field: any) => field.name) || [
    'created_at', 'amount', 'customer_id', 'customer_email'
  ];

  // Trigger animation when sorting changes
  useEffect(() => {
    setShowAnimation(true);
    const timer = setTimeout(() => setShowAnimation(false), 500);
    return () => clearTimeout(timer);
  }, [sortConfig]);

  // Handle sorting
  const requestSort = (key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Sort and filter data
  const getSortedData = () => {
    let filteredData = tableData.filter((item: any) =>
      Object.values(item).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    // Apply date filtering
    if (dateRange.startDate || dateRange.endDate) {
      filteredData = filteredData.filter((item: any) => {
        if (!item.created_at) return false;
        const itemDate = new Date(item.created_at);
        if (!isValid(itemDate)) return false;

        let includeRecord = true;

        if (dateRange.startDate) {
          includeRecord = includeRecord && isAfter(itemDate, dateRange.startDate);
        }

        if (dateRange.endDate) {
          const endDate = new Date(dateRange.endDate);
          endDate.setHours(23, 59, 59, 999); // Set to end of day
          includeRecord = includeRecord && isBefore(itemDate, endDate);
        }

        return includeRecord;
      });
    }

    if (sortConfig !== null) {
      return [...filteredData].sort((a, b) => {
        // Special handling for date fields
        if (sortConfig.key === 'created_at') {
          const dateA = new Date(a[sortConfig.key] || 0);
          const dateB = new Date(b[sortConfig.key] || 0);
          
          if (dateA < dateB) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          
          if (dateA > dateB) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          
          return 0;
        }

        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        
        return 0;
      });
    }

    return filteredData;
  };

  const exportToCSV = () => {
    if (!tableData || tableData.length === 0) return;
    
    const csvHeader = columns.join(',');
    const csvRows = getSortedData().map((item: any) =>
      columns.map(col => `"${String(item[col] !== undefined ? item[col] : '').replace(/"/g, '""')}"`).join(',')
    );
    
    const csvContent = [csvHeader, ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'table_data.csv');
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get high, medium, and low thresholds for amount values
  const getAmountThresholds = () => {
    const amounts = tableData
      .map(item => typeof item.amount === 'string' ? Number(item.amount) : item.amount)
      .filter(amount => !isNaN(amount));
    
    if (amounts.length === 0) return { high: 10000, medium: 5000, low: 0 };
    
    const max = Math.max(...amounts);
    return {
      high: max * 0.8,
      medium: max * 0.4,
      low: max * 0.1
    };
  };

  const { high, medium, low } = getAmountThresholds();

  // Format cell value based on column type
  const formatCellValue = (value: any, column: string, rowIndex: number) => {
    if (value === undefined || value === null) return '';
    
    if (column === 'created_at' && value) {
      try {
        const date = new Date(value);
        const formattedDate = format(date, 'MMM d, yyyy');
        const formattedTime = format(date, 'h:mm a');
        return (
          <div className="text-center">
            <div className="font-medium">{formattedDate}</div>
            <div className="text-xs text-gray-500">{formattedTime}</div>
          </div>
        );
      } catch {
        return String(value);
      }
    }

    if (column === 'amount' && (typeof value === 'number' || !isNaN(Number(value)))) {
      const numValue = Number(value) / 100;
      const color = numValue >= high
        ? 'bg-green-100 text-green-800 border-green-300'
        : numValue >= medium
          ? 'bg-blue-100 text-blue-800 border-blue-300'
          : numValue >= low
            ? 'bg-slate-100 text-slate-800 border-slate-300'
            : 'bg-slate-50 text-slate-600 border-slate-200';
      
      return (
        <div className="flex justify-center">
          <Badge variant="outline" className={`${color} font-medium`}>
            ${numValue.toFixed(2)}
          </Badge>
        </div>
      );
    }

    if (column === 'customer_id') {
      return (
        <div className="text-center">
          <span className="text-xs font-mono bg-slate-100 p-1 rounded">
            {String(value)}
          </span>
        </div>
      );
    }

    if (column === 'customer_email') {
      return (
        <div className="flex items-center justify-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium">
            {String(value).charAt(0).toUpperCase()}
          </div>
          <span>{String(value)}</span>
        </div>
      );
    }

    return <div className="text-center">{String(value)}</div>;
  };

  const clearDateFilters = () => {
    setDateRange({
      startDate: null,
      endDate: null
    });
  };

  const sortedData = getSortedData();

  return (
    <div className="w-full">
      {/* Center-aligned heading */}
      <h1 className="text-2xl font-bold text-gray-800 mb-4 text-center">
        Stripe payments data
      </h1>
      
      <Card className="w-full shadow-sm">
        <CardHeader className="flex flex-col items-center justify-between">
          <div className="text-center w-full">
            <CardTitle className="text-center">Successful Transaction Data</CardTitle>
            <CardDescription className="text-center">
              {tableData.length > 0
                ? `${sortedData.length} of ${tableData.length} records found`
                : 'No data available'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Button 
              className="flex items-center gap-2" 
              onClick={exportToCSV}
              variant="outline"
            >
              <Download size={16} />
              Export
            </Button>
            <Button 
              className="flex items-center gap-2" 
              onClick={onViewDashboard}
            >
              <BarChart size={16} />
              View Dashboard
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters Section */}
          <div className="flex flex-col md:flex-row gap-4 mb-6 justify-center">
            {/* Search */}
            <div className="relative flex-grow max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search transactions..."
                className="pl-8 bg-white text-center"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Date Filters */}
            <div className="flex flex-wrap gap-2 justify-center">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 bg-white">
                    <Calendar size={16} />
                    Start Date
                    <span className="font-normal">
                      {dateRange.startDate ? format(dateRange.startDate, 'MMM d, yyyy') : 'Select date'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.startDate || undefined}
                    onSelect={(date) => setDateRange({ ...dateRange, startDate: date })}
                    className="rounded-md border border-slate-200"
                  />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2 bg-white">
                    <Calendar size={16} />
                    End Date
                    <span className="font-normal">
                      {dateRange.endDate ? format(dateRange.endDate, 'MMM d, yyyy') : 'Select date'}
                    </span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <CalendarComponent
                    mode="single"
                    selected={dateRange.endDate || undefined}
                    onSelect={(date) => setDateRange({ ...dateRange, endDate: date })}
                    className="rounded-md border border-slate-200"
                  />
                </PopoverContent>
              </Popover>

              {(dateRange.startDate || dateRange.endDate) && (
                <Button 
                  variant="ghost"
                  size="sm"
                  onClick={clearDateFilters}
                  className="text-slate-600"
                >
                  Clear dates
                </Button>
              )}

              {/* Date Sort Controls */}
              <div className="flex ml-auto items-center gap-2 justify-center">
                <span className="text-sm text-slate-600 mr-1">Sort by Date:</span>
                <div className="flex">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortConfig({ key: 'created_at', direction: 'ascending' })}
                    className={`flex items-center gap-1 rounded-r-none border-r-0 ${
                      sortConfig.key === 'created_at' && sortConfig.direction === 'ascending'
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <ChevronUp size={14} />
                    Oldest
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortConfig({ key: 'created_at', direction: 'descending' })}
                    className={`flex items-center gap-1 rounded-l-none ${
                      sortConfig.key === 'created_at' && sortConfig.direction === 'descending'
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <ChevronDown size={14} />
                    Newest
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column} onClick={() => requestSort(column)} className="cursor-pointer hover:bg-slate-50 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {formatColumnName(column)}
                        {sortConfig?.key === column && (
                          sortConfig.direction === 'ascending' ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.length > 0 ? (
                  sortedData.map((row: any, index: number) => (
                    <TableRow 
                      key={index} 
                      className={`${activeRow === index ? 'bg-slate-50' : ''} transition-colors ${showAnimation ? 'animate-fade-in' : ''}`}
                      onMouseEnter={() => setActiveRow(index)}
                      onMouseLeave={() => setActiveRow(null)}
                    >
                      {columns.map((column) => (
                        <TableCell key={column} className="text-center">
                          {formatCellValue(row[column], column, index)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={columns.length} className="h-32 text-center">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Activity size={32} className="text-slate-300" />
                        <h3 className="font-medium text-slate-600 text-lg text-center">
                          {searchTerm || dateRange.startDate || dateRange.endDate
                            ? 'No results found for your search or date filter'
                            : 'No data available'}
                        </h3>
                        <p className="text-slate-500 text-center">
                          {searchTerm || dateRange.startDate || dateRange.endDate
                            ? 'Try adjusting your filters or search terms'
                            : 'Add some data to get started'}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Helper function to format column headers
const formatColumnName = (column: string) => {
  return column
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export default DataTable;
