import { useEffect, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Plus, Clock, CheckCircle, AlertCircle, Loader2, FileText, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: string;
  admin_response: string | null;
  created_at: string;
  service_id: string | null;
  service_type: string | null;
  color_theme: string | null;
  budget_range: string | null;
  timeline: string | null;
  company_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
}

interface Profile {
  full_name: string | null;
  email: string | null;
  company: string | null;
}

interface Service {
  id: string;
  title: string;
}

const Dashboard = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    priority: 'medium',
    service_type: '',
    color_theme: '',
    budget_range: '',
    timeline: '',
    company_name: '',
    contact_email: '',
    contact_phone: '',
  });

  useEffect(() => {
    if (user) {
      fetchData();
      subscribeToRequests();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    const [requestsRes, profileRes, servicesRes] = await Promise.all([
      supabase
        .from('service_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('profiles')
        .select('full_name, email, company')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('services')
        .select('id, title')
        .eq('is_active', true),
    ]);

    if (requestsRes.data) setRequests(requestsRes.data as ServiceRequest[]);
    if (profileRes.data) setProfile(profileRes.data);
    if (servicesRes.data) setServices(servicesRes.data);
    setLoading(false);
  };

  const subscribeToRequests = () => {
    const channel = supabase
      .channel('user-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `user_id=eq.${user?.id}`,
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    const { error } = await supabase
      .from('service_requests')
      .insert([{
        user_id: user.id,
        title: newRequest.title,
        description: newRequest.description,
        priority: newRequest.priority,
        service_type: newRequest.service_type || null,
        color_theme: newRequest.color_theme || null,
        budget_range: newRequest.budget_range || null,
        timeline: newRequest.timeline || null,
        company_name: newRequest.company_name || null,
        contact_email: newRequest.contact_email || user.email,
        contact_phone: newRequest.contact_phone || null,
        status: 'pending',
      }]);

    if (error) {
      toast({ title: 'Error', description: 'Failed to create request', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Service request created successfully' });
      setNewRequest({
        title: '',
        description: '',
        priority: 'medium',
        service_type: '',
        color_theme: '',
        budget_range: '',
        timeline: '',
        company_name: '',
        contact_email: '',
        contact_phone: '',
      });
      setDialogOpen(false);
      fetchData();
    }
    setSubmitting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'in_progress':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'in_progress':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'completed':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      default:
        return '';
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const stats = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in_progress').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">T</span>
              </div>
              <span className="font-bold gradient-text">THRYLOS</span>
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground hidden sm:block">
              Welcome, <span className="text-foreground">{profile?.full_name || user.email}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            <span className="gradient-text">Dashboard</span>
          </h1>
          <p className="text-muted-foreground">Manage your service requests and track progress</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Total Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.inProgress}</p>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.completed}</p>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Requests Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Your Requests</h2>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card border-border max-h-[90vh] overflow-y-auto max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Service Request</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateRequest} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label>Project Title *</Label>
                    <Input
                      placeholder="e.g., E-commerce Website Development"
                      value={newRequest.title}
                      onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <Label>Service Type *</Label>
                    <Select
                      value={newRequest.service_type}
                      onValueChange={(value) => setNewRequest({ ...newRequest, service_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select service type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="web_development">Web Development</SelectItem>
                        <SelectItem value="mobile_app">Mobile App Development</SelectItem>
                        <SelectItem value="ecommerce">E-commerce Solution</SelectItem>
                        <SelectItem value="ui_ux_design">UI/UX Design</SelectItem>
                        <SelectItem value="cloud_solutions">Cloud Solutions</SelectItem>
                        <SelectItem value="ai_ml">AI/ML Development</SelectItem>
                        <SelectItem value="custom_software">Custom Software</SelectItem>
                        <SelectItem value="maintenance">Maintenance & Support</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Priority *</Label>
                    <Select
                      value={newRequest.priority}
                      onValueChange={(value) => setNewRequest({ ...newRequest, priority: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Preferred Color Theme</Label>
                    <Select
                      value={newRequest.color_theme}
                      onValueChange={(value) => setNewRequest({ ...newRequest, color_theme: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select color theme" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dark">Dark Theme</SelectItem>
                        <SelectItem value="light">Light Theme</SelectItem>
                        <SelectItem value="blue">Blue Accent</SelectItem>
                        <SelectItem value="green">Green Accent</SelectItem>
                        <SelectItem value="purple">Purple Accent</SelectItem>
                        <SelectItem value="orange">Orange Accent</SelectItem>
                        <SelectItem value="red">Red Accent</SelectItem>
                        <SelectItem value="custom">Custom (specify in description)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Budget Range</Label>
                    <Select
                      value={newRequest.budget_range}
                      onValueChange={(value) => setNewRequest({ ...newRequest, budget_range: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select budget range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under_25k">Under ₹25,000</SelectItem>
                        <SelectItem value="25k_50k">₹25,000 - ₹50,000</SelectItem>
                        <SelectItem value="50k_1lac">₹50,000 - ₹1,00,000</SelectItem>
                        <SelectItem value="1lac_3lac">₹1,00,000 - ₹3,00,000</SelectItem>
                        <SelectItem value="3lac_5lac">₹3,00,000 - ₹5,00,000</SelectItem>
                        <SelectItem value="above_5lac">Above ₹5,00,000</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Expected Timeline</Label>
                    <Select
                      value={newRequest.timeline}
                      onValueChange={(value) => setNewRequest({ ...newRequest, timeline: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select timeline" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1_week">Within 1 Week</SelectItem>
                        <SelectItem value="2_weeks">Within 2 Weeks</SelectItem>
                        <SelectItem value="1_month">Within 1 Month</SelectItem>
                        <SelectItem value="2_months">Within 2 Months</SelectItem>
                        <SelectItem value="3_months">Within 3 Months</SelectItem>
                        <SelectItem value="6_months">Within 6 Months</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Company/Organization Name</Label>
                    <Input
                      placeholder="Your company name"
                      value={newRequest.company_name}
                      onChange={(e) => setNewRequest({ ...newRequest, company_name: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Contact Email</Label>
                    <Input
                      type="email"
                      placeholder="contact@company.com"
                      value={newRequest.contact_email}
                      onChange={(e) => setNewRequest({ ...newRequest, contact_email: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label>Contact Phone</Label>
                    <Input
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={newRequest.contact_phone}
                      onChange={(e) => setNewRequest({ ...newRequest, contact_phone: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label>Project Description *</Label>
                    <Textarea
                      placeholder="Describe your project requirements in detail..."
                      rows={5}
                      value={newRequest.description}
                      onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : requests.length === 0 ? (
          <Card className="glass-card">
            <CardContent className="py-12 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No requests yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first service request to get started
              </p>
              <Button onClick={() => setDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <Card key={request.id} className="glass-card hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          {getStatusIcon(request.status)}
                          <h3 className="font-semibold">{request.title}</h3>
                          <Badge variant="outline" className={getStatusColor(request.status)}>
                            {request.status.replace('_', ' ')}
                          </Badge>
                          <Badge variant="secondary" className="capitalize">
                            {request.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{request.description}</p>
                        
                        {/* Additional Details */}
                        <div className="flex flex-wrap gap-2 mt-3">
                          {request.service_type && (
                            <Badge variant="outline" className="text-xs">
                              {request.service_type.replace('_', ' ')}
                            </Badge>
                          )}
                          {request.color_theme && (
                            <Badge variant="outline" className="text-xs">
                              Theme: {request.color_theme}
                            </Badge>
                          )}
                          {request.budget_range && (
                            <Badge variant="outline" className="text-xs">
                              Budget: {request.budget_range.replace('_', ' ')}
                            </Badge>
                          )}
                          {request.timeline && (
                            <Badge variant="outline" className="text-xs">
                              Timeline: {request.timeline.replace('_', ' ')}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    {request.admin_response && (
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">Admin Response:</p>
                        <p className="text-sm">{request.admin_response}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
