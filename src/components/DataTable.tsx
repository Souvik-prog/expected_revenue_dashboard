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

  const [activeRow, setActiveRow] = useState<number | null>(null);
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
          <div className="flex flex-col">
            <span className="font-medium">{formattedDate}</span>
            <span className="text-xs text-slate-500">{formattedTime}</span>
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
        <div className="flex items-center justify-end">
          <Badge 
            className={`${color} border px-2 py-0.5 text-xs font-medium rounded-md`}
          >
            ${numValue.toFixed(2)}
          </Badge>
        </div>
      );
    }

    if (column === 'customer_id') {
      return (
        <span className="text-sm font-mono text-slate-600">
          {String(value)}
        </span>
      );
    }

    if (column === 'customer_email') {
      return (
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mr-2 font-semibold text-xs">
            {String(value).charAt(0).toUpperCase()}
          </div>
          <span className="text-sm truncate max-w-[200px]" title={String(value)}>
            {String(value)}
          </span>
        </div>
      );
    }
    
    return String(value);
  };

  const clearDateFilters = () => {
    setDateRange({
      startDate: null,
      endDate: null
    });
  };

  const sortedData = getSortedData();

  return (
    <Card className="shadow-md border-0 overflow-hidden">
      <CardHeader className="pb-4 border-b bg-gradient-to-r from-slate-50 to-white">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl font-semibold text-slate-800 flex items-center">
              <Activity className="mr-2 h-5 w-5 text-indigo-500" />
              Transaction Data
            </CardTitle>
            <CardDescription className="text-sm text-slate-500 mt-1">
              {tableData.length > 0 
                ? `${sortedData.length} of ${tableData.length} records found` 
                : 'No data available'}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={exportToCSV}
              disabled={tableData.length === 0}
              className="flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
            >
              <Download className="h-4 w-4" />
              <span>Export</span>
            </Button>
            <Button 
              size="sm" 
              onClick={onViewDashboard}
              className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700"
            >
              <BarChart className="h-4 w-4" />
              <span>View Dashboard</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Filters Section */}
        <div className="p-4 border-b bg-white">
          <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                type="search"
                placeholder="Search records..."
                className="pl-9 bg-white rounded-md border-slate-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Date Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">Start Date</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-36 justify-start text-left bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      <Calendar className="mr-2 h-4 w-4 text-slate-500" />
                      {dateRange.startDate ? format(dateRange.startDate, 'MMM d, yyyy') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.startDate || undefined}
                      onSelect={(date) => setDateRange({ ...dateRange, startDate: date })}
                      className="rounded-md border border-slate-200"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-slate-500">End Date</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-36 justify-start text-left bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      <Calendar className="mr-2 h-4 w-4 text-slate-500" />
                      {dateRange.endDate ? format(dateRange.endDate, 'MMM d, yyyy') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={dateRange.endDate || undefined}
                      onSelect={(date) => setDateRange({ ...dateRange, endDate: date })}
                      className="rounded-md border border-slate-200"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              {(dateRange.startDate || dateRange.endDate) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearDateFilters} 
                  className="self-end text-slate-600 hover:text-slate-800"
                >
                  Clear dates
                </Button>
              )}
            </div>
            
            {/* Date Sort Controls */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Sort by Date:</span>
              <div className="flex">
                <Button
                  variant={sortConfig.key === 'created_at' && sortConfig.direction === 'ascending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortConfig({ key: 'created_at', direction: 'ascending' })}
                  className={`flex items-center gap-1 rounded-r-none border-r-0 ${
                    sortConfig.key === 'created_at' && sortConfig.direction === 'ascending'
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ChevronUp className="h-3 w-3" />
                  Oldest
                </Button>
                <Button
                  variant={sortConfig.key === 'created_at' && sortConfig.direction === 'descending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortConfig({ key: 'created_at', direction: 'descending' })}
                  className={`flex items-center gap-1 rounded-l-none ${
                    sortConfig.key === 'created_at' && sortConfig.direction === 'descending'
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ChevronDown className="h-3 w-3" />
                  Newest
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-auto">
          <Table>
            <TableHeader className="bg-slate-50 sticky top-0">
              <TableRow className="hover:bg-slate-100 border-0">
                {columns.map((column) => (
                  <TableHead 
                    key={column} 
                    className={`whitespace-nowrap py-3 px-4 text-slate-700 font-semibold text-sm ${
                      column === 'amount' ? 'text-right' : ''
                    }`}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`flex items-center gap-1 font-medium ${
                        sortConfig?.key === column ? 'text-indigo-700' : 'text-slate-700'
                      } hover:text-indigo-800 p-0`}
                      onClick={() => requestSort(column)}
                    >
                      {formatColumnName(column)}
                      {sortConfig?.key === column && (
                        <ArrowUpDown className={`h-3.5 w-3.5 ml-1 transition-transform duration-200 ${
                          sortConfig?.direction === 'ascending' ? 'rotate-180' : ''
                        }`} />
                      )}
                    </Button>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedData.length > 0 ? (
                sortedData.map((row: any, index: number) => (
                  <TableRow 
                    key={index} 
                    className={`border-b hover:bg-slate-50 transition-colors duration-150 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                    } ${activeRow === index ? 'bg-indigo-50/50' : ''} ${
                      showAnimation ? 'animate-fadeIn' : ''
                    }`}
                    onMouseEnter={() => setActiveRow(index)}
                    onMouseLeave={() => setActiveRow(null)}
                  >
                    {columns.map((column) => (
                      <TableCell 
                        key={`${index}-${column}`} 
                        className={`py-3 px-4 ${
                          column === 'created_at' ? 'font-medium text-slate-800' : ''
                        } ${column === 'amount' ? 'text-right' : ''}`}
                      >
                        {formatCellValue(row[column], column, index)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500">
                      <Search className="h-8 w-8 mb-2 text-slate-300" />
                      <p className="text-base font-medium">
                        {searchTerm || dateRange.startDate || dateRange.endDate 
                          ? 'No results found for your search or date filter' 
                          : 'No data available'}
                      </p>
                      <p className="text-sm text-slate-400 mt-1">
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
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0.7; }
          to { opacity: 1; }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </Card>
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
