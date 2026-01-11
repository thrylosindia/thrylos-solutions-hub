import { useEffect, useState, useRef } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { 
  FileText, Briefcase, Mail, Users, LogOut, 
  Plus, Edit, Trash2, Eye, X, Loader2, MessageSquare, Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ADMIN_PASSWORD = '628400@thrylosindia';

// Admin API helper
const adminApi = async (action: string, table: string, options: {
  data?: Record<string, unknown>;
  id?: string;
  filters?: Record<string, unknown>;
} = {}) => {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/admin-api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-password': ADMIN_PASSWORD,
    },
    body: JSON.stringify({ action, table, ...options }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'API request failed');
  }
  
  return response.json();
};

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  price_range: string;
  is_active: boolean;
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
  user_name?: string;
  user_email?: string;
  service_type?: string;
  color_theme?: string;
  budget_range?: string;
  timeline?: string;
  company_name?: string;
  contact_email?: string;
  contact_phone?: string;
}

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  project_url: string;
  technologies: string[];
  category: string;
  is_featured: boolean;
}

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  is_read: boolean;
  is_replied: boolean;
  created_at: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  image_url: string;
  order_index: number;
  is_active: boolean;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

const AdminDashboard = () => {
  const { isAdminAuthenticated, adminLogout, loading: authLoading, getAdminToken } = useAdminAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Data states
  const [services, setServices] = useState<Service[]>([]);
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  // Dialog states
  const [serviceDialog, setServiceDialog] = useState(false);
  const [portfolioDialog, setPortfolioDialog] = useState(false);
  const [teamDialog, setTeamDialog] = useState(false);
  const [responseDialog, setResponseDialog] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [editingPortfolio, setEditingPortfolio] = useState<PortfolioItem | null>(null);
  const [editingTeam, setEditingTeam] = useState<TeamMember | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [adminResponseText, setAdminResponseText] = useState('');

  // Upload states
  const [uploading, setUploading] = useState(false);
  const portfolioImageRef = useRef<HTMLInputElement>(null);
  const teamImageRef = useRef<HTMLInputElement>(null);

  // Form states
  const [serviceForm, setServiceForm] = useState({
    title: '', description: '', icon: 'Code', features: '', price_range: '', is_active: true
  });
  const [portfolioForm, setPortfolioForm] = useState({
    title: '', description: '', image_url: '', project_url: '', technologies: '', category: '', is_featured: false
  });
  const [teamForm, setTeamForm] = useState({
    name: '', role: '', bio: '', image_url: '', order_index: 0, is_active: true
  });

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchAllData();
    }
  }, [isAdminAuthenticated]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchServices(),
        fetchRequests(),
        fetchPortfolio(),
        fetchMessages(),
        fetchTeamMembers(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({ title: 'Error loading data', variant: 'destructive' });
    }
    setLoading(false);
  };

  const fetchServices = async () => {
    const data = await adminApi('select', 'services', {
      filters: { order: { column: 'created_at', ascending: false } }
    });
    setServices(data.map((s: Service) => ({ ...s, features: s.features || [] })));
  };

  const fetchRequests = async () => {
    const data = await adminApi('select', 'service_requests', {
      filters: { order: { column: 'created_at', ascending: false } }
    });
    
    // Fetch profiles separately
    const profiles = await adminApi('select', 'profiles', {
      data: { select: 'user_id, full_name, email' }
    });
    const profileMap = new Map(profiles?.map((p: Profile) => [p.user_id, p]) || []);
    
    const enrichedRequests = data.map((req: ServiceRequest) => ({
      ...req,
      user_name: (profileMap.get(req.user_id) as Profile | undefined)?.full_name || 'Unknown',
      user_email: (profileMap.get(req.user_id) as Profile | undefined)?.email || req.user_id,
    }));
    setRequests(enrichedRequests);
  };

  const fetchPortfolio = async () => {
    const data = await adminApi('select', 'portfolio_items', {
      filters: { order: { column: 'created_at', ascending: false } }
    });
    setPortfolio(data.map((p: PortfolioItem) => ({ ...p, technologies: p.technologies || [] })));
  };

  const fetchMessages = async () => {
    const data = await adminApi('select', 'contact_messages', {
      filters: { order: { column: 'created_at', ascending: false } }
    });
    setMessages(data);
  };

  const fetchTeamMembers = async () => {
    const data = await adminApi('select', 'team_members', {
      filters: { order: { column: 'order_index', ascending: true } }
    });
    setTeamMembers(data);
  };

  // File upload handler (uses public bucket, no RLS issue)
  const uploadImage = async (file: File, folder: string): Promise<string | null> => {
    setUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(fileName, file, { cacheControl: '3600', upsert: false });

    setUploading(false);

    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      return null;
    }

    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
    return publicUrl;
  };

  const handlePortfolioImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, 'portfolio');
    if (url) setPortfolioForm(prev => ({ ...prev, image_url: url }));
  };

  const handleTeamImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file, 'team');
    if (url) setTeamForm(prev => ({ ...prev, image_url: url }));
  };

  // Service CRUD
  const handleSaveService = async () => {
    try {
      const features = serviceForm.features.split(',').map(f => f.trim()).filter(Boolean);
      const payload = { ...serviceForm, features };

      if (editingService) {
        await adminApi('update', 'services', { data: payload, id: editingService.id });
        toast({ title: 'Service updated' });
      } else {
        await adminApi('insert', 'services', { data: payload });
        toast({ title: 'Service created' });
      }

      setServiceDialog(false);
      setEditingService(null);
      setServiceForm({ title: '', description: '', icon: 'Code', features: '', price_range: '', is_active: true });
      fetchServices();
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Delete this service?')) return;
    try {
      await adminApi('delete', 'services', { id });
      toast({ title: 'Service deleted' });
      fetchServices();
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const editService = (service: Service) => {
    setEditingService(service);
    setServiceForm({
      title: service.title,
      description: service.description || '',
      icon: service.icon || 'Code',
      features: service.features.join(', '),
      price_range: service.price_range || '',
      is_active: service.is_active,
    });
    setServiceDialog(true);
  };

  // Portfolio CRUD
  const handleSavePortfolio = async () => {
    try {
      const technologies = portfolioForm.technologies.split(',').map(t => t.trim()).filter(Boolean);
      const payload = { ...portfolioForm, technologies };

      if (editingPortfolio) {
        await adminApi('update', 'portfolio_items', { data: payload, id: editingPortfolio.id });
        toast({ title: 'Portfolio item updated' });
      } else {
        await adminApi('insert', 'portfolio_items', { data: payload });
        toast({ title: 'Portfolio item created' });
      }

      setPortfolioDialog(false);
      setEditingPortfolio(null);
      setPortfolioForm({ title: '', description: '', image_url: '', project_url: '', technologies: '', category: '', is_featured: false });
      fetchPortfolio();
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleDeletePortfolio = async (id: string) => {
    if (!confirm('Delete this portfolio item?')) return;
    try {
      await adminApi('delete', 'portfolio_items', { id });
      toast({ title: 'Portfolio item deleted' });
      fetchPortfolio();
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const editPortfolioItem = (item: PortfolioItem) => {
    setEditingPortfolio(item);
    setPortfolioForm({
      title: item.title,
      description: item.description || '',
      image_url: item.image_url || '',
      project_url: item.project_url || '',
      technologies: item.technologies.join(', '),
      category: item.category || '',
      is_featured: item.is_featured,
    });
    setPortfolioDialog(true);
  };

  // Team CRUD
  const handleSaveTeam = async () => {
    try {
      const payload = { ...teamForm };

      if (editingTeam) {
        await adminApi('update', 'team_members', { data: payload, id: editingTeam.id });
        toast({ title: 'Team member updated' });
      } else {
        await adminApi('insert', 'team_members', { data: payload });
        toast({ title: 'Team member added' });
      }

      setTeamDialog(false);
      setEditingTeam(null);
      setTeamForm({ name: '', role: '', bio: '', image_url: '', order_index: 0, is_active: true });
      fetchTeamMembers();
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('Delete this team member?')) return;
    try {
      await adminApi('delete', 'team_members', { id });
      toast({ title: 'Team member deleted' });
      fetchTeamMembers();
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const editTeamMember = (member: TeamMember) => {
    setEditingTeam(member);
    setTeamForm({
      name: member.name,
      role: member.role,
      bio: member.bio || '',
      image_url: member.image_url || '',
      order_index: member.order_index,
      is_active: member.is_active,
    });
    setTeamDialog(true);
  };

  // Request management
  const updateRequestStatus = async (id: string, status: string) => {
    try {
      await adminApi('update', 'service_requests', { data: { status }, id });
      toast({ title: 'Status updated' });
      fetchRequests();
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const openResponseDialog = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setAdminResponseText(request.admin_response || '');
    setResponseDialog(true);
  };

  const sendAdminResponse = async () => {
    if (!selectedRequest) return;
    try {
      await adminApi('update', 'service_requests', { 
        data: { admin_response: adminResponseText }, 
        id: selectedRequest.id 
      });
      toast({ title: 'Response sent' });
      setResponseDialog(false);
      fetchRequests();
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    }
  };

  const deleteRequest = async (id: string) => {
    if (!confirm('Delete this request?')) return;
    try {
      await adminApi('delete', 'service_requests', { id });
      toast({ title: 'Request deleted' });
      fetchRequests();
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    }
  };

  // Message management
  const markMessageAsRead = async (id: string) => {
    try {
      await adminApi('update', 'contact_messages', { data: { is_read: true }, id });
      fetchMessages();
    } catch (error) {
      console.error(error);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Delete this message?')) return;
    try {
      await adminApi('delete', 'contact_messages', { id });
      toast({ title: 'Message deleted' });
      fetchMessages();
    } catch (error) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    return <Navigate to="/coordinator-admin" replace />;
  }

  const stats = {
    totalRequests: requests.length,
    pendingRequests: requests.filter(r => r.status === 'pending').length,
    activeServices: services.filter(s => s.is_active).length,
    unreadMessages: messages.filter(m => !m.is_read).length,
    teamMembers: teamMembers.filter(t => t.is_active).length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">T</span>
            </div>
            <span className="font-bold gradient-text">THRYLOS Admin</span>
          </Link>
          <Button variant="ghost" size="sm" onClick={adminLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{stats.totalRequests}</p>
                      <p className="text-xs text-muted-foreground">Total Requests</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-8 h-8 text-yellow-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.pendingRequests}</p>
                      <p className="text-xs text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.activeServices}</p>
                      <p className="text-xs text-muted-foreground">Services</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.unreadMessages}</p>
                      <p className="text-xs text-muted-foreground">Unread</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="glass-card">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Users className="w-8 h-8 text-purple-500" />
                    <div>
                      <p className="text-2xl font-bold">{stats.teamMembers}</p>
                      <p className="text-xs text-muted-foreground">Team</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6 flex-wrap">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="requests">Requests ({requests.length})</TabsTrigger>
                <TabsTrigger value="services">Services</TabsTrigger>
                <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                <TabsTrigger value="team">Team</TabsTrigger>
                <TabsTrigger value="messages">Messages</TabsTrigger>
              </TabsList>

              {/* Overview */}
              <TabsContent value="overview">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="glass-card">
                    <CardHeader><CardTitle className="text-lg">Recent Requests</CardTitle></CardHeader>
                    <CardContent>
                      {requests.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No requests yet</p>
                      ) : (
                        requests.slice(0, 5).map((req) => (
                          <div key={req.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                            <div>
                              <p className="font-medium text-sm">{req.title}</p>
                              <p className="text-xs text-muted-foreground">{req.user_email}</p>
                            </div>
                            <Badge variant="outline">{req.status}</Badge>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                  <Card className="glass-card">
                    <CardHeader><CardTitle className="text-lg">Recent Messages</CardTitle></CardHeader>
                    <CardContent>
                      {messages.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No messages yet</p>
                      ) : (
                        messages.slice(0, 5).map((msg) => (
                          <div key={msg.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                            <div>
                              <p className="font-medium text-sm">{msg.name}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{msg.subject || msg.message}</p>
                            </div>
                            {!msg.is_read && <Badge className="bg-primary">New</Badge>}
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Requests Tab */}
              <TabsContent value="requests">
                <div className="space-y-4">
                  {requests.length === 0 ? (
                    <Card className="glass-card">
                      <CardContent className="py-12 text-center">
                        <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No service requests yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    requests.map((req) => (
                      <Card key={req.id} className="glass-card">
                        <CardContent className="p-6">
                          <div className="flex flex-col gap-4">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2 flex-wrap">
                                  <h3 className="font-semibold">{req.title}</h3>
                                  <Badge variant="outline">{req.status}</Badge>
                                  <Badge variant="secondary">{req.priority}</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">{req.description}</p>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 my-3 text-xs">
                                  {req.service_type && (
                                    <div className="bg-muted/30 p-2 rounded">
                                      <span className="text-muted-foreground">Type:</span>{' '}
                                      <span className="font-medium">{req.service_type.replace(/_/g, ' ')}</span>
                                    </div>
                                  )}
                                  {req.color_theme && (
                                    <div className="bg-muted/30 p-2 rounded">
                                      <span className="text-muted-foreground">Theme:</span>{' '}
                                      <span className="font-medium">{req.color_theme}</span>
                                    </div>
                                  )}
                                  {req.budget_range && (
                                    <div className="bg-muted/30 p-2 rounded">
                                      <span className="text-muted-foreground">Budget:</span>{' '}
                                      <span className="font-medium">{req.budget_range.replace(/_/g, ' ')}</span>
                                    </div>
                                  )}
                                  {req.timeline && (
                                    <div className="bg-muted/30 p-2 rounded">
                                      <span className="text-muted-foreground">Timeline:</span>{' '}
                                      <span className="font-medium">{req.timeline.replace(/_/g, ' ')}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="text-xs text-muted-foreground space-y-1">
                                  <p>From: <span className="text-foreground">{req.user_name}</span> ({req.user_email})</p>
                                  {req.company_name && <p>Company: <span className="text-foreground">{req.company_name}</span></p>}
                                  {req.contact_phone && <p>Phone: <span className="text-foreground">{req.contact_phone}</span></p>}
                                  <p>Submitted: {new Date(req.created_at).toLocaleString()}</p>
                                </div>

                                {req.admin_response && (
                                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                                    <p className="text-xs text-muted-foreground mb-1">Your Response:</p>
                                    <p className="text-sm">{req.admin_response}</p>
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <Select onValueChange={(value) => updateRequestStatus(req.id, value)}>
                                  <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Update Status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button size="sm" variant="outline" onClick={() => openResponseDialog(req)}>
                                  <MessageSquare className="w-4 h-4 mr-1" />
                                  Respond
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => deleteRequest(req.id)}>
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              {/* Services Tab */}
              <TabsContent value="services">
                <div className="flex justify-end mb-4">
                  <Dialog open={serviceDialog} onOpenChange={setServiceDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90" onClick={() => {
                        setEditingService(null);
                        setServiceForm({ title: '', description: '', icon: 'Code', features: '', price_range: '', is_active: true });
                      }}>
                        <Plus className="w-4 h-4 mr-2" />Add Service
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-border max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingService ? 'Edit Service' : 'Add New Service'}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div><Label>Title</Label><Input value={serviceForm.title} onChange={(e) => setServiceForm({ ...serviceForm, title: e.target.value })} /></div>
                        <div><Label>Description</Label><Textarea rows={3} value={serviceForm.description} onChange={(e) => setServiceForm({ ...serviceForm, description: e.target.value })} /></div>
                        <div><Label>Icon</Label>
                          <Select value={serviceForm.icon} onValueChange={(value) => setServiceForm({ ...serviceForm, icon: value })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Code">Code</SelectItem>
                              <SelectItem value="Smartphone">Smartphone</SelectItem>
                              <SelectItem value="Cloud">Cloud</SelectItem>
                              <SelectItem value="Cpu">CPU/AI</SelectItem>
                              <SelectItem value="Shield">Shield</SelectItem>
                              <SelectItem value="Zap">Zap</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div><Label>Features (comma separated)</Label><Input value={serviceForm.features} onChange={(e) => setServiceForm({ ...serviceForm, features: e.target.value })} /></div>
                        <div><Label>Price Range</Label><Input value={serviceForm.price_range} onChange={(e) => setServiceForm({ ...serviceForm, price_range: e.target.value })} /></div>
                        <div className="flex items-center gap-2">
                          <Switch checked={serviceForm.is_active} onCheckedChange={(checked) => setServiceForm({ ...serviceForm, is_active: checked })} />
                          <Label>Active</Label>
                        </div>
                        <Button onClick={handleSaveService} className="w-full bg-primary">Save Service</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {services.map((service) => (
                    <Card key={service.id} className="glass-card">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold">{service.title}</h3>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => editService(service)}><Edit className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteService(service.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{service.description}</p>
                        <p className="text-xs text-primary mb-2">{service.price_range}</p>
                        <Badge variant={service.is_active ? 'default' : 'secondary'}>{service.is_active ? 'Active' : 'Inactive'}</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Portfolio Tab */}
              <TabsContent value="portfolio">
                <div className="flex justify-end mb-4">
                  <Dialog open={portfolioDialog} onOpenChange={setPortfolioDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90" onClick={() => {
                        setEditingPortfolio(null);
                        setPortfolioForm({ title: '', description: '', image_url: '', project_url: '', technologies: '', category: '', is_featured: false });
                      }}>
                        <Plus className="w-4 h-4 mr-2" />Add Portfolio Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-border max-h-[90vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>{editingPortfolio ? 'Edit Portfolio Item' : 'Add New Portfolio Item'}</DialogTitle></DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div><Label>Title</Label><Input value={portfolioForm.title} onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })} /></div>
                        <div><Label>Description</Label><Textarea rows={3} value={portfolioForm.description} onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })} /></div>
                        <div>
                          <Label>Image</Label>
                          <input ref={portfolioImageRef} type="file" accept="image/*" onChange={handlePortfolioImageUpload} className="hidden" />
                          <Button type="button" variant="outline" onClick={() => portfolioImageRef.current?.click()} disabled={uploading} className="w-full">
                            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                            {uploading ? 'Uploading...' : 'Upload Image'}
                          </Button>
                          {portfolioForm.image_url && (
                            <div className="relative mt-2">
                              <img src={portfolioForm.image_url} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                              <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-6 w-6" onClick={() => setPortfolioForm({ ...portfolioForm, image_url: '' })}><X className="w-3 h-3" /></Button>
                            </div>
                          )}
                        </div>
                        <div><Label>Project URL</Label><Input value={portfolioForm.project_url} onChange={(e) => setPortfolioForm({ ...portfolioForm, project_url: e.target.value })} /></div>
                        <div><Label>Technologies (comma separated)</Label><Input value={portfolioForm.technologies} onChange={(e) => setPortfolioForm({ ...portfolioForm, technologies: e.target.value })} /></div>
                        <div><Label>Category</Label>
                          <Select value={portfolioForm.category} onValueChange={(value) => setPortfolioForm({ ...portfolioForm, category: value })}>
                            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Web Development">Web Development</SelectItem>
                              <SelectItem value="Mobile Apps">Mobile Apps</SelectItem>
                              <SelectItem value="E-commerce">E-commerce</SelectItem>
                              <SelectItem value="AI/ML">AI/ML</SelectItem>
                              <SelectItem value="Cloud Solutions">Cloud Solutions</SelectItem>
                              <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Switch checked={portfolioForm.is_featured} onCheckedChange={(checked) => setPortfolioForm({ ...portfolioForm, is_featured: checked })} />
                          <Label>Featured</Label>
                        </div>
                        <Button onClick={handleSavePortfolio} className="w-full bg-primary" disabled={uploading}>Save Portfolio Item</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {portfolio.map((item) => (
                    <Card key={item.id} className="glass-card overflow-hidden">
                      {item.image_url && <div className="aspect-video"><img src={item.image_url} alt={item.title} className="w-full h-full object-cover" /></div>}
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div><h3 className="font-semibold">{item.title}</h3><p className="text-xs text-muted-foreground">{item.category}</p></div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => editPortfolioItem(item)}><Edit className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeletePortfolio(item.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                          </div>
                        </div>
                        {item.is_featured && <Badge className="bg-primary">Featured</Badge>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Team Tab */}
              <TabsContent value="team">
                <div className="flex justify-end mb-4">
                  <Dialog open={teamDialog} onOpenChange={setTeamDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-primary hover:bg-primary/90" onClick={() => {
                        setEditingTeam(null);
                        setTeamForm({ name: '', role: '', bio: '', image_url: '', order_index: teamMembers.length, is_active: true });
                      }}>
                        <Plus className="w-4 h-4 mr-2" />Add Team Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="glass-card border-border max-h-[90vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>{editingTeam ? 'Edit Team Member' : 'Add New Team Member'}</DialogTitle></DialogHeader>
                      <div className="space-y-4 mt-4">
                        <div><Label>Name *</Label><Input value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} /></div>
                        <div><Label>Role *</Label><Input value={teamForm.role} onChange={(e) => setTeamForm({ ...teamForm, role: e.target.value })} /></div>
                        <div><Label>Bio</Label><Textarea rows={3} value={teamForm.bio} onChange={(e) => setTeamForm({ ...teamForm, bio: e.target.value })} /></div>
                        <div>
                          <Label>Photo</Label>
                          <input ref={teamImageRef} type="file" accept="image/*" onChange={handleTeamImageUpload} className="hidden" />
                          <Button type="button" variant="outline" onClick={() => teamImageRef.current?.click()} disabled={uploading} className="w-full">
                            {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                            {uploading ? 'Uploading...' : 'Upload Photo'}
                          </Button>
                          {teamForm.image_url && (
                            <div className="relative w-32 h-32 mx-auto mt-2">
                              <img src={teamForm.image_url} alt="Preview" className="w-full h-full object-cover rounded-full" />
                              <Button size="icon" variant="destructive" className="absolute top-0 right-0 h-6 w-6" onClick={() => setTeamForm({ ...teamForm, image_url: '' })}><X className="w-3 h-3" /></Button>
                            </div>
                          )}
                        </div>
                        <div><Label>Display Order</Label><Input type="number" value={teamForm.order_index} onChange={(e) => setTeamForm({ ...teamForm, order_index: parseInt(e.target.value) || 0 })} /></div>
                        <div className="flex items-center gap-2">
                          <Switch checked={teamForm.is_active} onCheckedChange={(checked) => setTeamForm({ ...teamForm, is_active: checked })} />
                          <Label>Active</Label>
                        </div>
                        <Button onClick={handleSaveTeam} className="w-full bg-primary" disabled={uploading}>Save Team Member</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {teamMembers.map((member) => (
                    <Card key={member.id} className={`glass-card ${!member.is_active ? 'opacity-60' : ''}`}>
                      <CardContent className="p-4 text-center">
                        {member.image_url ? (
                          <img src={member.image_url} alt={member.name} className="w-24 h-24 rounded-full object-cover mx-auto mb-4" />
                        ) : (
                          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                            <Users className="w-10 h-10 text-muted-foreground" />
                          </div>
                        )}
                        <h3 className="font-semibold">{member.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{member.role}</p>
                        <div className="flex justify-center gap-2">
                          <Button size="sm" variant="ghost" onClick={() => editTeamMember(member)}><Edit className="w-4 h-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteTeam(member.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                        </div>
                        {!member.is_active && <Badge variant="secondary" className="mt-2">Inactive</Badge>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Messages Tab */}
              <TabsContent value="messages">
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <Card className="glass-card">
                      <CardContent className="py-12 text-center">
                        <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">No messages yet</p>
                      </CardContent>
                    </Card>
                  ) : (
                    messages.map((msg) => (
                      <Card key={msg.id} className={`glass-card ${!msg.is_read ? 'border-primary/50' : ''}`}>
                        <CardContent className="p-6">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{msg.name}</h3>
                                {!msg.is_read && <Badge className="bg-primary">New</Badge>}
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">{msg.email} {msg.phone && `• ${msg.phone}`}</p>
                              {msg.subject && <p className="text-sm font-medium mb-2">{msg.subject}</p>}
                              <p className="text-sm">{msg.message}</p>
                              <p className="text-xs text-muted-foreground mt-2">{new Date(msg.created_at).toLocaleString()}</p>
                            </div>
                            <div className="flex gap-2">
                              {!msg.is_read && (
                                <Button size="sm" variant="outline" onClick={() => markMessageAsRead(msg.id)}>
                                  <Eye className="w-4 h-4 mr-1" />Mark Read
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" onClick={() => deleteMessage(msg.id)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>

            {/* Admin Response Dialog */}
            <Dialog open={responseDialog} onOpenChange={setResponseDialog}>
              <DialogContent className="glass-card border-border">
                <DialogHeader><DialogTitle>Respond to Request</DialogTitle></DialogHeader>
                <div className="space-y-4 mt-4">
                  {selectedRequest && (
                    <div className="bg-muted/30 p-3 rounded-lg">
                      <p className="font-medium text-sm">{selectedRequest.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{selectedRequest.description}</p>
                    </div>
                  )}
                  <div>
                    <Label>Your Response</Label>
                    <Textarea rows={4} value={adminResponseText} onChange={(e) => setAdminResponseText(e.target.value)} />
                  </div>
                  <Button onClick={sendAdminResponse} className="w-full bg-primary">Send Response</Button>
                </div>
              </DialogContent>
            </Dialog>
          </>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
