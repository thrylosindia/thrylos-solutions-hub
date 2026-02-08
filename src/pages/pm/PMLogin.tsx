import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const PM_SESSION_KEY = 'thrylos_pm_session';

type Step = 'email' | 'otp';

const PMLogin = () => {
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [pmName, setPmName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const session = sessionStorage.getItem(PM_SESSION_KEY);
    if (session) {
      navigate('/pm/dashboard');
    }
  }, [navigate]);

  const sendOtp = async () => {
    if (!email || !email.includes('@')) {
      toast({ title: 'Error', description: 'Please enter a valid email', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/pm-send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');

      setPmName(data.pmName || '');
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
      toast({ title: 'Error', description: 'Please enter the 6-digit code', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/pm-verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Verification failed');

      sessionStorage.setItem(PM_SESSION_KEY, JSON.stringify(data.pm));
      toast({ title: `Welcome, ${data.pm.name}!`, description: 'Login successful' });
      navigate('/pm/dashboard');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Verification failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <img src="/thrylosindia.png" alt="Thrylos" className="w-8 h-8 object-contain" />
            <span className="text-xl font-extrabold bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 text-transparent bg-clip-text" style={{ fontFamily: "'Nixmat', sans-serif" }}>
              THRYLOS
            </span>
          </Link>
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-1">Project Manager Portal</h1>
          <p className="text-muted-foreground text-sm">
            {step === 'email' ? 'Sign in with your registered email' : `Enter the code sent to ${email}`}
          </p>
        </div>

        <div className="glass-card p-6 sm:p-8 rounded-2xl">
          {step === 'email' ? (
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="your-pm-email@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendOtp()}
                  />
                </div>
              </div>
              <Button onClick={sendOtp} className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending Code...</> : 'Send Login Code'}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                We'll send a 6-digit OTP to your registered PM email
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              <Button variant="ghost" size="sm" onClick={() => { setStep('email'); setOtp(''); }} className="mb-2">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back
              </Button>

              {pmName && (
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Welcome back</p>
                  <p className="font-semibold text-lg">{pmName}</p>
                </div>
              )}

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

              <Button onClick={verifyOtp} className="w-full" disabled={loading || otp.length !== 6}>
                {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</> : 'Verify & Login'}
              </Button>

              <div className="text-center">
                <button onClick={sendOtp} disabled={loading} className="text-sm text-primary hover:underline disabled:opacity-50">
                  Didn't receive the code? Resend
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PMLogin;
