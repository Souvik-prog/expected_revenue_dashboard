import { toast } from "sonner";

const API_BASE_URL = "/OxygenRTables/api/_FFFFFFFFFFFFFF00001713960477110008_";

export interface SessionData {
  attributionId: string;
  role: string;
  componentId: string;
  tableId: string;
  email?: string;
  phone?: string;
  contextPE?: string;
  meetingId?: string;
}

export interface GetDataParams {
  tableId: string;
  role: string;
  conditions?: Record<string, any>;
}

export interface AddRowParams {
  tableId: string;
  rowData: Record<string, any>;
}

export interface UpdateRowParams {
  tableId: string;
  rowId: string; // Primary key or unique identifier of the row
  updatedData: Record<string, any>;
}

export interface DeleteRowParams {
  tableId: string;
  rowId: string; // Primary key or unique identifier of the row
}

class OxygenRTablesApi {
  private clientId: string | null = null;

  /** Create a session and store the clientId */
  async createSession(data: SessionData): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/createSession`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to create session');
      this.clientId = result.result; // Store the clientId
      return this.clientId;
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create session');
      throw error;
    }
  }

  /** Fetch schema for a specific table */
  async getSchema(tableId: string): Promise<any> {
    if (!this.clientId) throw new Error('No active session. Call createSession first.');
    try {
      const response = await fetch(`${API_BASE_URL}/getSchema`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: this.clientId,
          tableId,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to fetch schema');
      return result;
    } catch (error) {
      console.error('Error fetching schema:', error);
      toast.error('Failed to fetch schema');
      throw error;
    }
  }

  /** Fetch data from a specific table */
  async getData(params: GetDataParams): Promise<any> {
    if (!this.clientId) throw new Error('No active session. Call createSession first.');
    try {
      const response = await fetch(`${API_BASE_URL}/getData`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: this.clientId,
          tableId: params.tableId,
          role: params.role,
          conditions: params.conditions || {},
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to fetch data');
      return result;
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
      throw error;
    }
  }

  /** Add a new row to the specified table */
  async addRow(params: AddRowParams): Promise<any> {
    if (!this.clientId) throw new Error('No active session. Call createSession first.');
    try {
      const response = await fetch(`${API_BASE_URL}/addRow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: this.clientId,
          tableId: params.tableId,
          rowData: params.rowData,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to add row');
      return result;
    } catch (error) {
      console.error('Error adding row:', error);
      toast.error('Failed to add row');
      throw error;
    }
  }

  /** Update an existing row in the specified table */
  async updateRow(params: UpdateRowParams): Promise<any> {
    if (!this.clientId) throw new Error('No active session. Call createSession first.');
    try {
      const response = await fetch(`${API_BASE_URL}/updateRow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: this.clientId,
          tableId: params.tableId,
          rowId: params.rowId,
          updatedData: params.updatedData,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to update row');
      return result;
    } catch (error) {
      console.error('Error updating row:', error);
      toast.error('Failed to update row');
      throw error;
    }
  }

  /** Delete a specific row from the specified table */
  async deleteRow(params: DeleteRowParams): Promise<any> {
    if (!this.clientId) throw new Error('No active session. Call createSession first.');
    try {
      const response = await fetch(`${API_BASE_URL}/deleteRow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: this.clientId,
          tableId: params.tableId,
          rowId: params.rowId,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to delete row');
      return result;
    } catch (error) {
      console.error('Error deleting row:', error);
      toast.error('Failed to delete row');
      throw error;
    }
  }

  /** Lock a specific row for editing */
  async lockRow(tableId: string, rowId: string): Promise<any> {
    if (!this.clientId) throw new Error('No active session. Call createSession first.');
    try {
      const response = await fetch(`${API_BASE_URL}/lockRow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: this.clientId,
          tableId,
          rowId,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to lock row');
      return result;
    } catch (error) {
      console.error('Error locking row:', error);
      toast.error('Failed to lock row');
      throw error;
    }
  }

  /** Unlock a specific locked row */
  async unlockRow(tableId: string, rowId: string): Promise<any> {
    if (!this.clientId) throw new Error('No active session. Call createSession first.');
    try {
      const response = await fetch(`${API_BASE_URL}/unlockRow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: this.clientId,
          tableId,
          rowId,
        }),
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Failed to unlock row');
      return result;
    } catch (error) {
      console.error('Error unlocking row:', error);
      toast.error('Failed to unlock row');
      throw error;
    }
  }

  /** Connect and automatically call getSchema and getData */
  async connectAndFetch(sessionData: SessionData): Promise<{ schema?: any; data?: any }> {
    try {
      // Step 1 - Create a session
      const clientID = await this.createSession(sessionData);

      // Step 2 - Fetch schema
      const schema = await this.getSchema(sessionData.tableId);

      // Step 3 - Fetch data
      const data = await this.getData({
        tableId: sessionData.tableId,
        role: sessionData.role,
        conditions: {},
      });

      return { schema, data };
    } catch (error) {
      console.error("Error during connectAndFetch:", error);
      toast.error("Failed to connect and fetch data");
      
throw error;}
}
}

export const oxygenRTablesApi= new OxygenRTablesApi();
