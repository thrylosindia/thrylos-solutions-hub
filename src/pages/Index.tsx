import { Link } from 'react-router-dom';
import { ArrowRight, Code, Smartphone, Cloud, Cpu, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';
import { useRef, useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import handPhone from "@/assets/thhands.webp";

const Index = () => {
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: false, amount: 0.3 });

  const [indianTime, setIndianTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let time = now.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      time = time.replace(/\b(am|pm)\b/i, (m) => m.toUpperCase());
      setIndianTime(time);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: Code, title: 'Web Development', description: 'Custom websites and web applications built with modern technologies.' },
    { icon: Smartphone, title: 'Mobile Apps', description: 'Native and cross-platform mobile applications for iOS and Android.' },
    { icon: Cloud, title: 'Cloud Solutions', description: 'Scalable cloud infrastructure and deployment solutions.' },
    { icon: Cpu, title: 'AI Integration', description: 'Intelligent automation and AI-powered solutions for your business.' },
    { icon: Shield, title: 'Cybersecurity', description: 'Comprehensive security audits and protection services.' },
    { icon: Zap, title: 'Digital Strategy', description: 'Strategic consulting to transform your digital presence.' },
  ];

  return (
    <MainLayout>
      {/* HERO SECTION */}
      <section
        ref={sectionRef}
        className="relative min-h-[70vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-primary/20 blur-3xl rounded-full" />
          <div className="absolute bottom-1/4 right-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-blue-600/10 blur-3xl rounded-full" />
        </div>
        
        {/* Particles - reduce count on mobile */}
        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
          {[...Array(40)].map((_, i) => {
            const size = 1 + Math.floor(Math.random() * 8);
            const left = Math.random() * 100;
            const delay = Math.random() * 1.2;
            const duration = 1.2 + Math.random() * 1.6;
            const opacity = 0.4 + Math.random() * 0.6;
            return (
              <motion.div
                key={i}
                className="absolute rounded-full"
                style={{
                  width: `${size}px`,
                  height: `${size}px`,
                  left: `${left}%`,
                  bottom: `${-10 - Math.random() * 20}%`,
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(173,216,230,0.9))',
                  opacity,
                  filter: 'blur(0.6px)',
                }}
                animate={{ translateY: [-10, -1200] }}
                transition={{ duration, delay, repeat: Infinity, ease: 'linear', repeatType: 'loop' }}
              />
            );
          })}
        </div>

        {/* Main Content */}
        <div className="relative z-20 w-full flex flex-col items-center justify-center">
          {/* BEYOND */}
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -100 }}
            transition={{ duration: 1 }}
            className="absolute top-[10%] sm:top-[10%] left-0 px-2 sm:px-6"
          >
            <h1 className="text-[2.5rem] sm:text-[6rem] md:text-[10rem] lg:text-[14rem] font-black text-white leading-none tracking-tight">
              BEYOND
            </h1>
          </motion.div>

          {/* Phone */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="relative z-30"
          >
            <div className="absolute top-[4%] left-[61%] -translate-x-1/2 z-40">
              <span className="text-white text-[5px] sm:text-[8px] font-medium">
                {indianTime}
              </span>
            </div>
            <img
              src={handPhone}
              alt="Phone"
              className="w-36 sm:w-72 md:w-96 lg:w-[28rem] h-auto object-contain drop-shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
            />
          </motion.div>

          {/* TECH */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }}
            transition={{ duration: 1 }}
            className="absolute bottom-[10%] sm:bottom-[8%] right-0 px-2 sm:px-6"
          >
            <h1 className="text-[2.5rem] sm:text-[6rem] md:text-[10rem] lg:text-[14rem] font-black text-white leading-none tracking-tight text-right">
              TECH
            </h1>
          </motion.div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="py-12 sm:py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">
              <span className="gradient-text">Our Services</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
              Comprehensive technology solutions tailored to your business needs
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="glass-card p-4 sm:p-6 rounded-xl hover:border-primary/50 transition-all duration-300 group"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3 sm:mb-4 group-hover:bg-primary/20 transition-colors">
                  <feature.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold mb-1.5 sm:mb-2">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-12 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
            {[
              { value: '50+', label: 'Projects Completed' },
              { value: '30+', label: 'Happy Clients' },
              { value: '5+', label: 'Years Experience' },
              { value: '24/7', label: 'Support' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text mb-1 sm:mb-2">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm md:text-base text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold">
              Ready to <span className="gradient-text">Start Your Project</span>?
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              Let's discuss how THRYLOS Tech can help transform your business.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg" className="w-full sm:w-auto">Contact Us</Button>
              </Link>
              <Link to="/portfolio">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">View Our Work</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Index;
