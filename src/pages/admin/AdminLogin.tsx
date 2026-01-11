import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Zap, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAdminAuth } from '@/hooks/useAdminAuth';

const AdminLogin = () => {
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { adminLogin, isAdminAuthenticated, loading } = useAdminAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && isAdminAuthenticated) {
      navigate('/coordinator-admin/dashboard');
    }
  }, [isAdminAuthenticated, loading, navigate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const success = adminLogin(password);

    if (success) {
      toast({ title: 'Welcome, Admin!', description: 'Access granted' });
      navigate('/coordinator-admin/dashboard');
    } else {
      toast({ title: 'Access Denied', description: 'Invalid password', variant: 'destructive' });
    }

    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold mb-2">
              <span className="gradient-text">Admin Access</span>
            </h1>
            <p className="text-muted-foreground">Enter coordinator password to continue</p>
          </div>

          <div className="glass-card p-8 rounded-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="Enter admin password"
                    className="pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Access Dashboard'
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
