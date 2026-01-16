import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { 
  FileText, Clock, CheckCircle, Loader2, LogOut, 
  AlertTriangle, Phone, Mail, Building, User, 
  Calendar, MessageSquare, Briefcase, Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PMSession {
  id: string;
  email: string;
  name: string;
  specialization: string;
  token: string;
}

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  admin_response: string | null;
  created_at: string;
  user_id: string;
  service_type?: string;
  color_theme?: string;
  budget_range?: string;
  timeline?: string;
  company_name?: string;
  contact_email?: string;
  contact_phone?: string;
  pm_assigned_at?: string;
  notes?: string;
}

const PMDashboard = () => {
  const [session, setSession] = useState<PMSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [activeTab, setActiveTab] = useState('active');
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [noteDialog, setNoteDialog] = useState(false);
  const [noteText, setNoteText] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const stored = localStorage.getItem('pm_session');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSession(parsed);
        fetchAssignedProjects(parsed);
      } catch {
        localStorage.removeItem('pm_session');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAssignedProjects = async (pmSession: PMSession) => {
    try {
      const { data, error } = await supabase.functions.invoke('pm-auth', {
        body: { action: 'get-projects', pmId: pmSession.id, token: pmSession.token }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to fetch projects');
      }

      setRequests(data.projects || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast({ title: 'Error loading projects', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, status: string) => {
    if (!session) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('pm-auth', {
        body: { 
          action: 'update-status', 
          pmId: session.id, 
          token: session.token,
          requestId,
          status 
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to update status');
      }

      toast({ title: 'Status updated successfully' });
      fetchAssignedProjects(session);
    } catch (error) {
      toast({ 
        title: 'Error updating status', 
        description: (error as Error).message,
        variant: 'destructive' 
      });
    }
  };

  const addNote = async () => {
    if (!session || !selectedRequest || !noteText.trim()) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('pm-auth', {
        body: { 
          action: 'add-note', 
          pmId: session.id, 
          token: session.token,
          requestId: selectedRequest.id,
          note: noteText.trim()
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Failed to add note');
      }

      toast({ title: 'Note added successfully' });
      setNoteDialog(false);
      setNoteText('');
      fetchAssignedProjects(session);
    } catch (error) {
      toast({ 
        title: 'Error adding note', 
        description: (error as Error).message,
        variant: 'destructive' 
      });
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pm_session');
    setSession(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/pm/login" replace />;
  }

  const activeRequests = requests.filter(r => r.status === 'in_progress' || r.status === 'pending');
  const completedRequests = requests.filter(r => r.status === 'completed');
  const allRequests = requests;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-500 border-green-500/30';
      case 'in_progress': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/30';
      case 'medium': return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'low': return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const renderProjectCard = (request: ServiceRequest) => (
    <Card key={request.id} className="glass-card border-border/50 hover:border-primary/30 transition-all">
      <CardContent className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{request.title}</h3>
            {request.company_name && (
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Building className="w-3 h-3" /> {request.company_name}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge className={`${getStatusColor(request.status)} capitalize`}>
              {getStatusIcon(request.status)}
              <span className="ml-1">{request.status.replace(/_/g, ' ')}</span>
            </Badge>
            <Badge className={`${getPriorityColor(request.priority)} capitalize`}>
              {request.priority}
            </Badge>
          </div>
        </div>

        {/* Description */}
        <div className="bg-muted/30 rounded-lg p-4">
          <p className="text-sm text-muted-foreground">{request.description}</p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {request.service_type && (
            <div>
              <p className="text-xs text-muted-foreground uppercase">Service</p>
              <p className="font-medium">{request.service_type}</p>
            </div>
          )}
          {request.budget_range && (
            <div>
              <p className="text-xs text-muted-foreground uppercase">Budget</p>
              <p className="font-medium">{request.budget_range}</p>
            </div>
          )}
          {request.timeline && (
            <div>
              <p className="text-xs text-muted-foreground uppercase">Timeline</p>
              <p className="font-medium">{request.timeline}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground uppercase">Assigned</p>
            <p className="font-medium flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {request.pm_assigned_at ? new Date(request.pm_assigned_at).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        {/* Contact Info */}
        <div className="flex flex-wrap gap-4 text-sm">
          {request.contact_email && (
            <a href={`mailto:${request.contact_email}`} className="flex items-center gap-1 text-primary hover:underline">
              <Mail className="w-4 h-4" /> {request.contact_email}
            </a>
          )}
          {request.contact_phone && (
            <a href={`tel:${request.contact_phone}`} className="flex items-center gap-1 text-primary hover:underline">
              <Phone className="w-4 h-4" /> {request.contact_phone}
            </a>
          )}
        </div>

        {/* Notes */}
        {request.notes && (
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <p className="text-xs text-primary uppercase mb-1 flex items-center gap-1">
              <MessageSquare className="w-3 h-3" /> Notes
            </p>
            <p className="text-sm">{request.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
          <Select 
            value={request.status} 
            onValueChange={(value) => updateRequestStatus(request.id, value)}
          >
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Update Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={noteDialog && selectedRequest?.id === request.id} onOpenChange={(open) => {
            setNoteDialog(open);
            if (open) setSelectedRequest(request);
          }}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={() => setSelectedRequest(request)}>
                <MessageSquare className="w-4 h-4 mr-1" /> Add Note
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <DialogHeader>
                <DialogTitle>Add Note to Project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Textarea
                  placeholder="Enter your notes about this project..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  rows={4}
                />
                <Button onClick={addNote} className="w-full" disabled={!noteText.trim()}>
                  <Send className="w-4 h-4 mr-2" /> Save Note
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">PM Dashboard</h1>
              <p className="text-xs text-muted-foreground">{session.name}</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="hidden sm:flex">
              <Briefcase className="w-3 h-3 mr-1" />
              {session.specialization || 'General'}
            </Badge>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{requests.length}</p>
                  <p className="text-xs text-muted-foreground">Total Projects</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{activeRequests.length}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-2xl font-bold">{requests.filter(r => r.status === 'pending').length}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{completedRequests.length}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="active">Active ({activeRequests.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedRequests.length})</TabsTrigger>
            <TabsTrigger value="all">All ({allRequests.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeRequests.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No active projects right now</p>
                  <p className="text-sm text-muted-foreground mt-1">You're all caught up!</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {activeRequests.map(renderProjectCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedRequests.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No completed projects yet</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {completedRequests.map(renderProjectCard)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all">
            {allRequests.length === 0 ? (
              <Card className="glass-card">
                <CardContent className="py-12 text-center">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No projects assigned yet</p>
                  <p className="text-sm text-muted-foreground mt-1">Projects will appear here once assigned by the coordinator</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {allRequests.map(renderProjectCard)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default PMDashboard;