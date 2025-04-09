import React, { useState } from 'react';
import SessionForm from '@/components/SessionForm';
import DataTable from '@/components/DataTable';
import Dashboard from '@/components/Dashboard';
import { oxygenRTablesApi } from '@/services/api';
import { Loader2 } from 'lucide-react';

const Index = () => {
  const [clientId, setClientId] = useState<string | null>(null);
  const [tableId, setTableId] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]); // Store only the result array
  const [schema, setSchema] = useState<any | null>(null); // Store schema data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // Store error messages
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

  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Expected Revenue vs Days in Advance</h1>
      </header>

      {/* If no session is active, show the SessionForm */}
      {!clientId ? (
        <SessionForm onSessionCreated={handleSessionCreated} />
      ) : (
        <div className="space-y-6">
          {/* Show loader while fetching data */}
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-lg text-muted-foreground">Loading schema and data...</p>
            </div>
          ) : error ? (
            // Show error message if there's an error
            <div className="flex flex-col items-center justify-center p-12">
              <p className="text-lg text-red-500">{error}</p>
              <button 
                onClick={() => fetchSchemaAndData(tableId!)} 
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Retry
              </button>
            </div>
          ) : view === 'table' ? (
            // Show DataTable if view is table
            <DataTable 
              data={data} 
              schema={schema} 
              onViewDashboard={toggleView} 
            />
          ) : (
            // Show Dashboard if view is dashboard
            <Dashboard 
              data={data} 
              schema={schema} 
              onBack={toggleView} 
            />
          )}
        </div>
      )}
    </div>
  );
};

export default Index;
