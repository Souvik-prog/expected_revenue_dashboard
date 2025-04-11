import React, { useState, useEffect } from 'react';
import DataTable from '@/components/DataTable';
import Dashboard from '@/components/Dashboard';
import { oxygenRTablesApi } from '@/services/api';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [clientId, setClientId] = useState(null);
  const [tableId, setTableId] = useState(null);
  const [data, setData] = useState([]); // Store only the result array
  const [schema, setSchema] = useState(null); // Store schema data
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState(null); // Store error messages
  const [view, setView] = useState<'table' | 'dashboard'>('table');

  /**
   * Handles session creation and fetches schema and data automatically.
   */
  const handleSessionCreated = async (newClientId: string, newTableId: string) => {
    setClientId(newClientId);
    setTableId(newTableId);
    // Fetch schema and data after session creation
    await fetchSchemaAndData(newTableId);
  };

  /**
   * Fetches schema and data for the specified table ID.
   */
  const fetchSchemaAndData = async (tId: string) => {
    setLoading(true);
    setError(null); // Reset error state before fetching
    try {
      // Fetch schema
      const fetchedSchema = await oxygenRTablesApi.getSchema(tId);
      console.log('Schema fetched:', fetchedSchema);
      if (fetchedSchema) {
        setSchema(fetchedSchema); // Set schema to state
      } else {
        throw new Error('Invalid schema format');
      }

      // Fetch data
      const result = await oxygenRTablesApi.getData({
        tableId: tId,
        role: "admin",
      });
      console.log('Data fetched:', result);
      if (result && Array.isArray(result.result)) {
        setData(result.result); // Set only the result array to state
      } else {
        throw new Error('Invalid data format');
      }
    } catch (error: any) {
      console.error('Error fetching schema or data:', error.message || error);
      setError(error.message || 'An unexpected error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggles between table view and dashboard view.
   */
  const toggleView = () => {
    setView(view === 'table' ? 'dashboard' : 'table');
  };

  // Automatically create session and fetch data on component mount
  useEffect(() => {
    const autoConnect = async () => {
      try {
        // Hardcoded session parameters (same as those in SessionForm default state)
        const sessionParams = {
          attributionId: "29912838",
          role: "admin",
          componentId: "_FFFFFFFFFFFFFF00001743272502182003_",
          tableId: "_FFFFFFFFFFFFFF00001743272502182003_"
        };
        
        // Create session
        const newClientId = await oxygenRTablesApi.createSession(sessionParams);
        console.log('Auto-connected with clientId:', newClientId);
        
        // Call handleSessionCreated with the new clientId and tableId
        await handleSessionCreated(newClientId, sessionParams.tableId);
      } catch (error: any) {
        console.error('Error auto-connecting:', error.message || error);
        setError(error.message || 'An unexpected error occurred while auto-connecting.');
        setLoading(false);
      }
    };
    
    autoConnect();
  }, []); // Empty dependency array means this runs once on component mount

  return (
    // Modified container width to 90% with minimal padding on sides
    <div className="w-[90%] mx-auto px-2 py-6">
      {/* Show loader while fetching data */}
      {loading ? (
        <div className="flex flex-col items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          <p className="mt-4 text-lg text-gray-600 text-center">Loading schema and data...</p>
        </div>
      ) : error ? (
        // Show error message if there's an error
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => fetchSchemaAndData(tableId!)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      ) : view === 'table' ? (
        // Show DataTable if view is table
        <DataTable data={data} schema={schema} onViewDashboard={() => setView('dashboard')} />
      ) : (
        // Show Dashboard if view is dashboard
        <Dashboard data={data} schema={schema} onBack={() => setView('table')} />
      )}
    </div>
  );
};

export default Index;
