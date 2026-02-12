import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Mail, User, Loader2, ArrowLeft, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { z } from 'zod';

const emailSchema = z.string().email('Invalid email address');
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

type AuthStep = 'form' | 'otp' | 'forgot' | 'forgot-otp' | 'reset-password';

const Auth = () => {
  const [step, setStep] = useState<AuthStep>('form');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  if (user) return <Navigate to="/dashboard" replace />;

  const handleLogin = async () => {
    try { emailSchema.parse(email); } catch {
      toast({ title: 'Error', description: 'Please enter a valid email', variant: 'destructive' });
      return;
    }
    if (!password) {
      toast({ title: 'Error', description: 'Please enter your password', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast({ title: 'Welcome back!', description: 'You have been logged in' });
      setTimeout(() => navigate('/dashboard'), 500);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const sendSignupOtp = async () => {
    try { emailSchema.parse(email); } catch {
      toast({ title: 'Error', description: 'Please enter a valid email', variant: 'destructive' });
      return;
    }
    if (!fullName.trim()) {
      toast({ title: 'Error', description: 'Full name is required', variant: 'destructive' });
      return;
    }
    if (!password || password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, isSignup: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
      toast({ title: 'OTP Sent!', description: 'Check your email for the verification code' });
      setStep('otp');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send OTP';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const verifySignupOtp = async () => {
    if (otp.length !== 6) {
      toast({ title: 'Error', description: 'Please enter the 6-digit code', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, fullName, password, isSignup: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Verification failed');

      toast({ title: 'Account Created!', description: 'You can now login with your password' });
      setStep('form');
      setIsSignup(false);
      setOtp('');
      setFullName('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const sendForgotOtp = async () => {
    try { emailSchema.parse(email); } catch {
      toast({ title: 'Error', description: 'Please enter a valid email', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, isSignup: false, isPasswordReset: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
      toast({ title: 'OTP Sent!', description: 'Check your email for the reset code' });
      setStep('forgot-otp');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send OTP';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const verifyForgotOtp = async () => {
    if (otp.length !== 6) {
      toast({ title: 'Error', description: 'Please enter the 6-digit code', variant: 'destructive' });
      return;
    }
    setStep('reset-password');
  };

  const resetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Password reset failed');
      toast({ title: 'Password Reset!', description: 'You can now login with your new password' });
      setStep('form');
      setIsSignup(false);
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Password reset failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => { setStep('form'); setOtp(''); setNewPassword(''); setConfirmPassword(''); };

  return (
    <MainLayout showFooter={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-6 sm:py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">
                Welcome to <span className="gradient-text">THRYLOS</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {step === 'form' ? 'Sign in or create an account' :
                 step === 'otp' ? 'Verify your email to create account' :
                 step === 'forgot' ? 'Enter your email to reset password' :
                 step === 'forgot-otp' ? 'Enter the code sent to your email' :
                 'Set your new password'}
              </p>
            </div>

            <div className="glass-card p-5 sm:p-8 rounded-xl">
              {step === 'form' ? (
                <Tabs defaultValue={isSignup ? 'signup' : 'login'} onValueChange={(v) => setIsSignup(v === 'signup')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-4 sm:mb-6">
                    <TabsTrigger value="login" className="text-xs sm:text-sm">Login</TabsTrigger>
                    <TabsTrigger value="signup" className="text-xs sm:text-sm">Sign Up</TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="email" placeholder="your@email.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter password"
                            className="pl-10 pr-10"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <Button onClick={handleLogin} className="w-full" disabled={loading}>
                        {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing In...</>) : 'Sign In'}
                      </Button>
                      <div className="text-center">
                        <button
                          onClick={() => setStep('forgot')}
                          className="text-xs sm:text-sm text-primary hover:underline"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="signup">
                    <div className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Full Name</label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="text" placeholder="Your Name" className="pl-10" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input type="email" placeholder="your@email.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Min 6 characters"
                            className="pl-10 pr-10"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendSignupOtp()}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <Button onClick={sendSignupOtp} className="w-full" disabled={loading}>
                        {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending Code...</>) : 'Create Account'}
                      </Button>
                      <p className="text-[10px] sm:text-xs text-center text-muted-foreground">We'll send a verification code to your email</p>
                    </div>
                  </TabsContent>
                </Tabs>
              ) : step === 'otp' || step === 'forgot-otp' ? (
                <div className="space-y-4 sm:space-y-6">
                  <Button variant="ghost" size="sm" onClick={resetFlow} className="mb-1 sm:mb-2 -ml-2">
                    <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />Back
                  </Button>
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                      <KeyRound className="w-7 h-7 text-primary" />
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground mb-0.5 sm:mb-1">Code sent to</p>
                    <p className="font-medium text-sm sm:text-base break-all">{email}</p>
                  </div>
                  <div className="flex justify-center">
                    <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} className="w-12 h-14 text-lg border-2 rounded-lg" />
                        <InputOTPSlot index={1} className="w-12 h-14 text-lg border-2 rounded-lg" />
                        <InputOTPSlot index={2} className="w-12 h-14 text-lg border-2 rounded-lg" />
                      </InputOTPGroup>
                      <InputOTPSeparator />
                      <InputOTPGroup>
                        <InputOTPSlot index={3} className="w-12 h-14 text-lg border-2 rounded-lg" />
                        <InputOTPSlot index={4} className="w-12 h-14 text-lg border-2 rounded-lg" />
                        <InputOTPSlot index={5} className="w-12 h-14 text-lg border-2 rounded-lg" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <Button
                    onClick={step === 'otp' ? verifySignupOtp : verifyForgotOtp}
                    className="w-full"
                    disabled={loading || otp.length !== 6}
                  >
                    {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</>) : 'Verify & Continue'}
                  </Button>
                  <div className="text-center">
                    <button
                      onClick={step === 'otp' ? sendSignupOtp : sendForgotOtp}
                      disabled={loading}
                      className="text-xs sm:text-sm text-primary hover:underline disabled:opacity-50"
                    >
                      Didn't receive the code? Resend
                    </button>
                  </div>
                </div>
              ) : step === 'forgot' ? (
                <div className="space-y-4 sm:space-y-6">
                  <Button variant="ghost" size="sm" onClick={resetFlow} className="mb-1 sm:mb-2 -ml-2">
                    <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />Back
                  </Button>
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                      <KeyRound className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold mb-1">Reset Password</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">Enter your email to receive a reset code</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="email" placeholder="your@email.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendForgotOtp()} />
                    </div>
                  </div>
                  <Button onClick={sendForgotOtp} className="w-full" disabled={loading}>
                    {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending Code...</>) : 'Send Reset Code'}
                  </Button>
                </div>
              ) : step === 'reset-password' ? (
                <div className="space-y-4 sm:space-y-6">
                  <Button variant="ghost" size="sm" onClick={resetFlow} className="mb-1 sm:mb-2 -ml-2">
                    <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />Back
                  </Button>
                  <div className="text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                      <Lock className="w-7 h-7 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold mb-1">Set New Password</h2>
                    <p className="text-xs sm:text-sm text-muted-foreground">Choose a strong password for your account</p>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Min 6 characters"
                        className="pl-10 pr-10"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="Confirm password"
                        className="pl-10"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && resetPassword()}
                      />
                    </div>
                  </div>
                  <Button onClick={resetPassword} className="w-full" disabled={loading}>
                    {loading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Resetting...</>) : 'Reset Password'}
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Auth;
