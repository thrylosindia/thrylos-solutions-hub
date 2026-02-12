import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';

const GetStarted = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    company: '',
    phone: '',
    projectDescription: '',
    selectedService: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const services = [
    'Web Development',
    'Mobile App Development',
    'Cloud Solutions',
    'AI & ML Integration',
    'Cybersecurity',
    'Digital Strategy',
  ];

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create user account
      const { error: signupError } = await signUp(
        formData.email,
        formData.password,
        formData.fullName
      );

      if (signupError) throw signupError;

      // Wait a bit for the profile to be created
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get the user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Update profile with additional info
        await supabase
          .from('profiles')
          .update({
            company: formData.company,
            phone: formData.phone,
          })
          .eq('user_id', user.id);

        // Create initial service request if project description provided
        if (formData.projectDescription) {
          await supabase
            .from('service_requests')
            .insert([{
              user_id: user.id,
              title: `New Project - ${formData.selectedService || 'General Inquiry'}`,
              description: formData.projectDescription,
              status: 'pending',
            }]);
        }
      }

      toast({
        title: 'Welcome to THRYLOS!',
        description: 'Your account has been created successfully.',
      });

      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout showFooter={false}>
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 mb-4">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm">Step {step} of 3</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">
                Get Started with <span className="gradient-text">THRYLOS</span>
              </h1>
              <p className="text-muted-foreground">
                Tell us about yourself and your project
              </p>
            </div>

            {/* Progress Bar */}
            <div className="flex gap-2 mb-8">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    s <= step ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            {/* Form */}
            <div className="glass-card p-8 rounded-xl">
              <form onSubmit={handleSubmit}>
                {step === 1 && (
                  <div className="space-y-6 animate-fade-in">
                    <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Full Name *</label>
                      <Input
                        placeholder="Your Name"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Email *</label>
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Password *</label>
                      <Input
                        type="password"
                        placeholder="Min. 6 characters"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Phone</label>
                      <Input
                        placeholder="+91 XXX XXX XXXX"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-6 animate-fade-in">
                    <h2 className="text-xl font-semibold mb-4">Company & Service</h2>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Company Name</label>
                      <Input
                        placeholder="Your company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">What service are you interested in?</label>
                      <div className="grid grid-cols-2 gap-3">
                        {services.map((service) => (
                          <button
                            key={service}
                            type="button"
                            onClick={() => setFormData({ ...formData, selectedService: service })}
                            className={`p-3 rounded-lg border text-left text-sm transition-colors ${
                              formData.selectedService === service
                                ? 'border-primary bg-primary/10'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {formData.selectedService === service && (
                                <Check className="w-4 h-4 text-primary" />
                              )}
                              {service}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-6 animate-fade-in">
                    <h2 className="text-xl font-semibold mb-4">Project Details</h2>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Tell us about your project</label>
                      <Textarea
                        placeholder="Describe your project requirements, goals, and timeline..."
                        rows={6}
                        value={formData.projectDescription}
                        onChange={(e) => setFormData({ ...formData, projectDescription: e.target.value })}
                      />
                    </div>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex justify-between mt-8">
                  {step > 1 ? (
                    <Button type="button" variant="outline" onClick={handleBack}>
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}

                  {step < 3 ? (
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="bg-primary hover:bg-primary/90"
                      disabled={
                        (step === 1 && (!formData.fullName || !formData.email || !formData.password))
                      }
                    >
                      Continue
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      className="bg-primary hover:bg-primary/90"
                      disabled={loading}
                    >
                      {loading ? 'Creating Account...' : 'Complete Setup'}
                    </Button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default GetStarted;
