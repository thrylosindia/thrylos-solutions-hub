import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Code, Smartphone, Cloud, Cpu, Shield, Zap, ArrowRight, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  price_range: string;
}

const iconMap: Record<string, any> = { Code, Smartphone, Cloud, Cpu, Shield, Zap };

const Services = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      setLoading(true);
      const { data } = await supabase.from('services').select('*').eq('is_active', true);
      if (data) {
        setServices(data.map(s => ({ ...s, features: s.features || [], price_range: s.price_range || '' })));
      }
      setLoading(false);
    };
    fetchServices();
  }, []);

  return (
    <MainLayout>
      <section className="py-12 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold">
              Our <span className="gradient-text">Services</span>
            </h1>
            <p className="text-base sm:text-xl text-muted-foreground">
              Comprehensive technology solutions tailored to accelerate your business growth
            </p>
          </div>
        </div>
      </section>

      <section className="py-8 sm:py-16">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No services available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              {services.map((service) => {
                const IconComponent = iconMap[service.icon] || Code;
                return (
                  <div key={service.id} className="glass-card rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 group">
                    <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <IconComponent className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                      </div>
                      <h3 className="text-lg sm:text-xl font-semibold">{service.title}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">{service.description}</p>
                      <ul className="space-y-1.5 sm:space-y-2">
                        {service.features.map((feature, index) => (
                          <li key={index} className="flex items-center gap-2 text-xs sm:text-sm">
                            <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary flex-shrink-0" />
                            <span className="text-muted-foreground">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      {service.price_range && (
                        <div className="pt-3 sm:pt-4 border-t border-border">
                          <span className="text-primary font-semibold text-sm sm:text-base">{service.price_range}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="py-12 sm:py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              Need a <span className="gradient-text">Custom Solution</span>?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              We specialize in creating tailored solutions that perfectly fit your unique business requirements.
            </p>
            <div className="pt-2 sm:pt-4">
              <Link to="/auth">
                <Button size="lg" className="group w-full sm:w-auto">
                  Request a Quote
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Services;
