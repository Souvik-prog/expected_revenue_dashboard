import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { oxygenRTablesApi, SessionData } from '@/services/api';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface SessionFormProps {
  onSessionCreated: (clientId: string, tableId: string) => void;
}

const SessionForm: React.FC<SessionFormProps> = ({ onSessionCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<SessionData>({
    attributionId: "29912838",
    role: "admin",
    componentId: "_FFFFFFFFFFFFFF00001743272502182003_",
    tableId: "_FFFFFFFFFFFFFF00001743272502182003_"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Call createSession and get the clientId
      const clientId = await oxygenRTablesApi.createSession(formData);
      console.log('Session created:', clientId);
      toast.success('Session created successfully');
      
      // Pass clientId and tableId to parent component via onSessionCreated
      onSessionCreated(clientId, formData.tableId);
    } catch (error) {
      console.error('Session creation error:', error);
      toast.error('Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Create Session</CardTitle>
        <CardDescription>Connect to OxygenRTables API</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="attributionId">Attribution ID</Label>
            <Input
              id="attributionId"
              name="attributionId"
              value={formData.attributionId}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Input
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="componentId">Component ID</Label>
            <Input
              id="componentId"
              name="componentId"
              value={formData.componentId}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tableId">Table ID</Label>
            <Input
              id="tableId"
              name="tableId"
              value={formData.tableId}
              onChange={handleChange}
              required
            />
          </div>
        </CardContent>
        
        <CardFooter>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SessionForm;
