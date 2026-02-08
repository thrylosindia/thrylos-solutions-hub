import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Loader2, LogOut, Briefcase, Clock, CheckCircle, AlertCircle,
  MessageSquare, ChevronDown, ChevronUp, User2, Mail, Phone, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const PM_SESSION_KEY = 'thrylos_pm_session';

interface PMData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  specialization: string | null;
  is_available: boolean;
}

interface ServiceRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  admin_response: string | null;
  notes: string | null;
  created_at: string;
  service_type: string | null;
  color_theme: string | null;
  budget_range: string | null;
  timeline: string | null;
  company_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  user_id: string;
}

interface Profile {
  user_id: string;
  full_name: string | null;
  email: string | null;
}

const PMDashboard = () => {
  const [pm, setPm] = useState<PMData | null>(null);
  const [projects, setProjects] = useState<ServiceRequest[]>([]);
  const [profiles, setProfiles] = useState<Map<string, Profile>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const session = sessionStorage.getItem(PM_SESSION_KEY);
    if (!session) {
      navigate('/pm/login');
      return;
    }
    const pmData = JSON.parse(session) as PMData;
    setPm(pmData);
    fetchProjects(pmData.id);
  }, [navigate]);

  const fetchProjects = async (pmId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('assigned_pm_id', pmId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      toast({ title: 'Error', description: 'Failed to load projects', variant: 'destructive' });
    }

    if (data) {
      setProjects(data);
      // Fetch profiles for user names
      const userIds = [...new Set(data.map(d => d.user_id))];
      if (userIds.length > 0) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds);
        if (profileData) {
          const map = new Map(profileData.map(p => [p.user_id, p]));
          setProfiles(map);
        }
      }
    }
    setLoading(false);
  };

  const updateStatus = async (projectId: string, newStatus: string) => {
    const { error } = await supabase
      .from('service_requests')
      .update({ status: newStatus as 'pending' | 'in_progress' | 'completed' | 'cancelled' })
      .eq('id', projectId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } else {
      toast({ title: 'Status updated' });
      if (pm) fetchProjects(pm.id);
    }
  };

  const saveNote = async (projectId: string) => {
    if (!noteText.trim()) return;
    setSavingNote(true);

    const project = projects.find(p => p.id === projectId);
    const existingNotes = project?.notes || '';
    const timestamp = new Date().toLocaleString();
    const updatedNotes = existingNotes
      ? `${existingNotes}\n\n[${timestamp}] ${noteText}`
      : `[${timestamp}] ${noteText}`;

    const { error } = await supabase
      .from('service_requests')
      .update({ notes: updatedNotes })
      .eq('id', projectId);

    if (error) {
      toast({ title: 'Error', description: 'Failed to save note', variant: 'destructive' });
    } else {
      toast({ title: 'Note added' });
      setNoteText('');
      if (pm) fetchProjects(pm.id);
    }
    setSavingNote(false);
  };

  const logout = () => {
    sessionStorage.removeItem(PM_SESSION_KEY);
    navigate('/pm/login');
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending': return { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30', icon: Clock };
      case 'in_progress': return { color: 'bg-blue-500/10 text-blue-500 border-blue-500/30', icon: Loader2 };
      case 'completed': return { color: 'bg-green-500/10 text-green-500 border-green-500/30', icon: CheckCircle };
      case 'cancelled': return { color: 'bg-red-500/10 text-red-500 border-red-500/30', icon: AlertCircle };
      default: return { color: 'bg-muted text-muted-foreground', icon: Clock };
    }
  };

  if (!pm) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'in_progress').length,
    pending: projects.filter(p => p.status === 'pending').length,
    completed: projects.filter(p => p.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src="/thrylosindia.png" alt="Thrylos" className="w-6 h-6 object-contain" />
            <span className="text-lg sm:text-xl font-extrabold bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 text-transparent bg-clip-text" style={{ fontFamily: "'Nixmat', sans-serif" }}>
              THRYLOS PM
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium">{pm.name}</p>
              <p className="text-xs text-muted-foreground">{pm.specialization || 'Project Manager'}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* PM Profile Card */}
        <Card className="glass-card overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500" />
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <User2 className="w-7 h-7 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold">Welcome, {pm.name}</h1>
                <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {pm.email}</span>
                  {pm.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {pm.phone}</span>}
                  {pm.specialization && <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> {pm.specialization}</span>}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Total Projects', value: stats.total, icon: Briefcase, color: 'text-primary' },
            { label: 'Active', value: stats.active, icon: Loader2, color: 'text-blue-500' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-yellow-500' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-green-500' },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label} className="glass-card">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-muted/50 flex items-center justify-center ${color}`}>
                    <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-bold">{value}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">{label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Projects */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Assigned Projects</h2>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : projects.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-12 text-center">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-1">No projects assigned yet</h3>
                <p className="text-sm text-muted-foreground">Projects assigned to you will appear here</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => {
                const statusConfig = getStatusConfig(project.status);
                const StatusIcon = statusConfig.icon;
                const isExpanded = expandedProject === project.id;
                const clientProfile = profiles.get(project.user_id);

                return (
                  <Card key={project.id} className="glass-card overflow-hidden">
                    <div className="cursor-pointer" onClick={() => setExpandedProject(isExpanded ? null : project.id)}>
                      <CardContent className="p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base truncate">{project.title}</h3>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge className={`${statusConfig.color} border text-xs`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {project.status.replace(/_/g, ' ')}
                              </Badge>
                              <Badge variant="secondary" className="capitalize text-xs">{project.priority}</Badge>
                              {project.service_type && (
                                <Badge variant="outline" className="text-xs hidden sm:inline-flex">{project.service_type}</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-muted-foreground hidden sm:block">
                              {new Date(project.created_at).toLocaleDateString()}
                            </span>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </CardContent>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-border">
                        <CardContent className="p-4 sm:p-5 space-y-4">
                          {/* Description */}
                          <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
                            <p className="text-xs text-muted-foreground uppercase mb-1">Description</p>
                            <p className="text-sm leading-relaxed">{project.description || 'No description'}</p>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {project.budget_range && (
                              <div className="bg-muted/20 p-3 rounded-lg">
                                <p className="text-xs text-muted-foreground">Budget</p>
                                <p className="font-medium capitalize">{project.budget_range.replace(/_/g, ' ')}</p>
                              </div>
                            )}
                            {project.timeline && (
                              <div className="bg-muted/20 p-3 rounded-lg">
                                <p className="text-xs text-muted-foreground">Timeline</p>
                                <p className="font-medium capitalize">{project.timeline.replace(/_/g, ' ')}</p>
                              </div>
                            )}
                            {project.color_theme && (
                              <div className="bg-muted/20 p-3 rounded-lg">
                                <p className="text-xs text-muted-foreground">Theme</p>
                                <p className="font-medium capitalize">{project.color_theme}</p>
                              </div>
                            )}
                            {project.service_type && (
                              <div className="bg-muted/20 p-3 rounded-lg">
                                <p className="text-xs text-muted-foreground">Service</p>
                                <p className="font-medium capitalize">{project.service_type}</p>
                              </div>
                            )}
                          </div>

                          {/* Client Info */}
                          <div className="bg-muted/30 rounded-lg p-3 sm:p-4">
                            <p className="text-xs text-muted-foreground uppercase mb-2">Client Info</p>
                            <div className="space-y-1 text-sm">
                              <p><span className="text-muted-foreground">Name:</span> {clientProfile?.full_name || 'N/A'}</p>
                              <p><span className="text-muted-foreground">Email:</span> {project.contact_email || clientProfile?.email || 'N/A'}</p>
                              {project.contact_phone && <p><span className="text-muted-foreground">Phone:</span> {project.contact_phone}</p>}
                              {project.company_name && <p><span className="text-muted-foreground">Company:</span> {project.company_name}</p>}
                            </div>
                          </div>

                          {/* Status Update */}
                          <div className="flex flex-col sm:flex-row gap-3">
                            <Select onValueChange={(value) => updateStatus(project.id, value)}>
                              <SelectTrigger className="w-full sm:w-48">
                                <SelectValue placeholder="Update Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="in_progress">In Progress</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Notes */}
                          {project.notes && (
                            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 sm:p-4">
                              <p className="text-xs text-blue-400 uppercase mb-2 flex items-center gap-1">
                                <MessageSquare className="w-3.5 h-3.5" /> Notes
                              </p>
                              <pre className="text-sm whitespace-pre-wrap font-sans">{project.notes}</pre>
                            </div>
                          )}

                          {/* Admin Response */}
                          {project.admin_response && (
                            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 sm:p-4">
                              <p className="text-xs text-primary uppercase mb-1">Admin Response</p>
                              <p className="text-sm">{project.admin_response}</p>
                            </div>
                          )}

                          {/* Add Note */}
                          <div className="space-y-2">
                            <Textarea
                              placeholder="Add a note or update..."
                              value={noteText}
                              onChange={(e) => setNoteText(e.target.value)}
                              rows={2}
                            />
                            <Button
                              size="sm"
                              onClick={() => saveNote(project.id)}
                              disabled={savingNote || !noteText.trim()}
                            >
                              {savingNote ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-1" />}
                              Add Note
                            </Button>
                          </div>
                        </CardContent>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PMDashboard;
