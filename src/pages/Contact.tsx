import { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subject: '', message: '',
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.from('contact_messages').insert([formData]);
      if (error) throw error;
      toast({ title: 'Message Sent!', description: 'We\'ll get back to you as soon as possible.' });
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to send message.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <section className="py-12 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 sm:w-96 h-48 sm:h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold">
              Get in <span className="gradient-text">Touch</span>
            </h1>
            <p className="text-base sm:text-xl text-muted-foreground">
              Have a project in mind? We'd love to hear from you.
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12">
            {/* Contact Info */}
            <div className="space-y-6 sm:space-y-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">
                  Let's <span className="gradient-text">Connect</span>
                </h2>
                <p className="text-sm sm:text-base text-muted-foreground">
                  Whether you have a question about our services, pricing, or just want to say hello, we're here to help.
                </p>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {[
                  { icon: Mail, title: 'Email', value: 'support@thrylos.in' },
                  { icon: Phone, title: 'Phone', value: '+91 XXXXX XXXXX' },
                  { icon: MapPin, title: 'Location', value: 'New Delhi, India' },
                ].map(({ icon: Icon, title, value }) => (
                  <div key={title} className="flex items-start gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base">{title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Form */}
            <div className="glass-card p-5 sm:p-8 rounded-xl">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Name</label>
                    <Input placeholder="Your name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Email</label>
                    <Input type="email" placeholder="your@email.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Phone</label>
                    <Input placeholder="+91 XXX XXX XXXX" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Subject</label>
                    <Input placeholder="Project inquiry" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} />
                  </div>
                </div>

                <div>
                  <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">Message</label>
                  <Textarea placeholder="Tell us about your project..." rows={4} value={formData.message} onChange={(e) => setFormData({ ...formData, message: e.target.value })} required />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : (<>Send Message <Send className="ml-2 w-4 h-4" /></>)}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Contact;
