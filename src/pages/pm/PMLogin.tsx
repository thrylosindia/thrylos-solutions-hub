import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, Mail, Lock, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';

const PMLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({ title: 'Please fill all fields', variant: 'destructive' });
      return;
    }

    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('pm-auth', {
        body: { action: 'login', email, password }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Login failed');
      }

      // Store PM session
      localStorage.setItem('pm_session', JSON.stringify({
        id: data.pm.id,
        email: data.pm.email,
        name: data.pm.name,
        specialization: data.pm.specialization,
        token: data.token
      }));

      toast({ title: 'Login successful', description: `Welcome back, ${data.pm.name}!` });
      navigate('/pm/dashboard');
    } catch (error) {
      toast({ 
        title: 'Login failed', 
        description: (error as Error).message,
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md glass-card border-border/50">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <UserCheck className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Project Manager Login</CardTitle>
            <CardDescription>
              Sign in to access your assigned projects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>
                Not a Project Manager?{' '}
                <Link to="/auth" className="text-primary hover:underline">
                  User Login
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default PMLogin;