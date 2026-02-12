import { useEffect, useState, useRef } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { ArrowLeft, Camera, Loader2, Phone, User, Lock, Eye, EyeOff, KeyRound, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator } from '@/components/ui/input-otp';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

const Settings = () => {
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState({ full_name: '', phone: '', avatar_url: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Change password with OTP
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [changePwdStep, setChangePwdStep] = useState<'send' | 'otp' | 'password'>('send');
  const [otp, setOtp] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('full_name, phone, avatar_url')
      .eq('user_id', user.id)
      .maybeSingle();
    if (data) setProfile({
      full_name: data.full_name || '',
      phone: data.phone || '',
      avatar_url: data.avatar_url || '',
    });
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: profile.full_name, phone: profile.phone, avatar_url: profile.avatar_url })
      .eq('user_id', user.id);
    if (error) {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    } else {
      toast({ title: 'Profile Updated!', description: 'Your changes have been saved' });
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `avatars/${user.id}-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('uploads')
      .upload(fileName, file, { cacheControl: '3600', upsert: true });

    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(fileName);
    setProfile(prev => ({ ...prev, avatar_url: publicUrl }));

    // Auto-save avatar
    await supabase
      .from('profiles')
      .update({ avatar_url: publicUrl })
      .eq('user_id', user.id);

    toast({ title: 'Photo Updated!' });
    setUploading(false);
  };

  // Change password flow
  const sendChangeOtp = async () => {
    if (!user?.email) return;
    setChangingPwd(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, isSignup: false, isPasswordReset: true }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
      toast({ title: 'OTP Sent!', description: 'Check your email for the verification code' });
      setChangePwdStep('otp');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send OTP';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setChangingPwd(false);
    }
  };

  const verifyChangeOtp = () => {
    if (otp.length !== 6) {
      toast({ title: 'Error', description: 'Enter 6-digit code', variant: 'destructive' });
      return;
    }
    setChangePwdStep('password');
  };

  const submitNewPassword = async () => {
    if (!newPwd || newPwd.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters', variant: 'destructive' });
      return;
    }
    if (newPwd !== confirmPwd) {
      toast({ title: 'Error', description: 'Passwords do not match', variant: 'destructive' });
      return;
    }
    setChangingPwd(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user?.email, otp, newPassword: newPwd }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to change password');
      toast({ title: 'Password Changed!', description: 'Your password has been updated' });
      setChangePwdOpen(false);
      resetChangePwd();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setChangingPwd(false);
    }
  };

  const resetChangePwd = () => {
    setChangePwdStep('send');
    setOtp('');
    setNewPwd('');
    setConfirmPwd('');
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back to Dashboard</Button>
          </Link>
          <h1 className="text-lg font-semibold">Account Settings</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-8">
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-4">
              <div className="relative">
                <div className="w-28 h-28 rounded-full overflow-hidden bg-muted border-2 border-border">
                  {profile.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg hover:bg-primary/90 transition"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </div>
              <p className="text-sm text-muted-foreground">Click camera icon to upload photo</p>
            </div>

            {/* Profile Info */}
            <div className="glass-card rounded-xl p-6 space-y-5">
              <h2 className="text-lg font-semibold flex items-center gap-2"><User className="w-5 h-5" /> Profile Information</h2>
              <div>
                <Label>Full Name</Label>
                <Input value={profile.full_name} onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))} placeholder="Your Name" />
              </div>
              <div>
                <Label>Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={user.email || ''} disabled className="pl-10 opacity-60" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>
              <div>
                <Label>Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={profile.phone} onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))} placeholder="+91 XXXXX XXXXX" className="pl-10" />
                </div>
              </div>
              <Button onClick={handleSaveProfile} disabled={saving} className="w-full">
                {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Saving...</> : 'Save Changes'}
              </Button>
            </div>

            {/* Change Password */}
            <div className="glass-card rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold flex items-center gap-2"><KeyRound className="w-5 h-5" /> Security</h2>
              <p className="text-sm text-muted-foreground">Change your password via email OTP verification</p>
              <Button variant="outline" onClick={() => { setChangePwdOpen(true); resetChangePwd(); }} className="w-full">
                <Lock className="w-4 h-4 mr-2" /> Change Password
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Change Password Dialog */}
      <Dialog open={changePwdOpen} onOpenChange={(open) => { setChangePwdOpen(open); if (!open) resetChangePwd(); }}>
        <DialogContent className="glass-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><KeyRound className="w-5 h-5" /> Change Password</DialogTitle>
          </DialogHeader>

          {changePwdStep === 'send' && (
            <div className="space-y-4 mt-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7 text-primary" />
              </div>
              <p className="text-sm text-muted-foreground">We'll send a verification code to <span className="font-medium text-foreground">{user?.email}</span></p>
              <Button onClick={sendChangeOtp} className="w-full" disabled={changingPwd}>
                {changingPwd ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : 'Send Verification Code'}
              </Button>
            </div>
          )}

          {changePwdStep === 'otp' && (
            <div className="space-y-5 mt-4">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                  <KeyRound className="w-7 h-7 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground mb-1">Code sent to</p>
                <p className="font-medium">{user?.email}</p>
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
              <Button onClick={verifyChangeOtp} className="w-full" disabled={otp.length !== 6}>Verify & Continue</Button>
              <button onClick={sendChangeOtp} disabled={changingPwd} className="w-full text-center text-sm text-primary hover:underline disabled:opacity-50">
                Resend Code
              </button>
            </div>
          )}

          {changePwdStep === 'password' && (
            <div className="space-y-4 mt-4">
              <div>
                <Label>New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="Min 6 characters"
                    className="pl-10 pr-10"
                    value={newPwd}
                    onChange={(e) => setNewPwd(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label>Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="password" placeholder="Confirm password" className="pl-10" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
                </div>
              </div>
              <Button onClick={submitNewPassword} className="w-full" disabled={changingPwd}>
                {changingPwd ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Changing...</> : 'Change Password'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
