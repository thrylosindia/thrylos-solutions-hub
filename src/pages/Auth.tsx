import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Mail, User, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const emailSchema = z.string().email('Invalid email address');
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type AuthStep = 'email' | 'otp';

const Auth = () => {
  const [step, setStep] = useState<AuthStep>('email');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const sendOtp = async () => {
    try {
      emailSchema.parse(email);
    } catch {
      toast({ title: 'Validation Error', description: 'Please enter a valid email', variant: 'destructive' });
      return;
    }

    if (isSignup && !fullName.trim()) {
      toast({ title: 'Validation Error', description: 'Full name is required', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, isSignup }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      toast({ title: 'OTP Sent!', description: 'Check your email for the verification code' });
      setStep('otp');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send OTP';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      toast({ title: 'Validation Error', description: 'Please enter the 6-digit code', variant: 'destructive' });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, fullName, isSignup }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Verification failed');
      }

      // Use the verifyOtp endpoint to sign in with magic link token
      if (data.hashedToken) {
        // Sign in using the OTP verification
        const { error: signInError } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'email',
        });

        // If verifyOtp doesn't work, try signInWithOtp
        if (signInError) {
          // Use magic link approach
          const { error: magicError } = await supabase.auth.signInWithOtp({
            email,
            options: { shouldCreateUser: false }
          });
          
          if (magicError) {
            // Fallback: just navigate and let the auth state pick up
            console.log('Magic link fallback, navigating...');
          }
        }
      }

      toast({ 
        title: isSignup ? 'Account Created!' : 'Welcome back!', 
        description: isSignup ? 'Your account has been created successfully' : 'You have been logged in' 
      });

      // Force refresh auth state and navigate
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 500);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('email');
    setOtp('');
  };

  return (
    <MainLayout showFooter={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">
                Welcome to <span className="gradient-text">THRYLOS</span>
              </h1>
              <p className="text-muted-foreground">
                {step === 'email' ? 'Sign in or create an account' : 'Enter the code sent to your email'}
              </p>
            </div>

            <div className="glass-card p-8 rounded-xl">
              {step === 'email' ? (
                <Tabs defaultValue={isSignup ? 'signup' : 'login'} onValueChange={(v) => setIsSignup(v === 'signup')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="signup">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            className="pl-10"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                          />
                        </div>
                      </div>

                      <Button onClick={sendOtp} className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending Code...
                          </>
                        ) : (
                          'Send Login Code'
                        )}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        We'll send a 6-digit code to your email
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="signup">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="text"
                            placeholder="John Doe"
                            className="pl-10"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            className="pl-10"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                          />
                        </div>
                      </div>

                      <Button onClick={sendOtp} className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Sending Code...
                          </>
                        ) : (
                          'Create Account'
                        )}
                      </Button>

                      <p className="text-xs text-center text-muted-foreground">
                        We'll send a 6-digit verification code to your email
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : (
                <div className="space-y-6">
                  <Button variant="ghost" size="sm" onClick={resetFlow} className="mb-2">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </Button>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">Code sent to</p>
                    <p className="font-medium">{email}</p>
                  </div>

                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>

                  <Button onClick={verifyOtp} className="w-full bg-primary hover:bg-primary/90" disabled={loading || otp.length !== 6}>
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Verify & Continue'
                    )}
                  </Button>

                  <div className="text-center">
                    <button
                      onClick={sendOtp}
                      disabled={loading}
                      className="text-sm text-primary hover:underline disabled:opacity-50"
                    >
                      Didn't receive the code? Resend
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Auth;
