import { useEffect, useState } from 'react';
import { Users, Target, Award, Lightbulb } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';

interface TeamMember {
  id: string;
  name: string;
  role: string;
  bio: string | null;
  image_url: string | null;
}

const About = () => {
  const [team, setTeam] = useState<TeamMember[]>([]);

  useEffect(() => {
    const fetchTeam = async () => {
      const { data } = await supabase
        .from('team_members')
        .select('id, name, role, bio, image_url')
        .eq('is_active', true)
        .order('order_index', { ascending: true });
      if (data) setTeam(data);
    };
    fetchTeam();
  }, []);

  const values = [
    { icon: Lightbulb, title: 'Innovation', description: 'We stay ahead of technology trends to deliver cutting-edge solutions.' },
    { icon: Target, title: 'Excellence', description: 'We strive for perfection in every project we undertake.' },
    { icon: Users, title: 'Collaboration', description: 'We work closely with our clients to understand their unique needs.' },
    { icon: Award, title: 'Integrity', description: 'We maintain transparency and honesty in all our dealings.' },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="py-12 sm:py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 right-1/4 w-48 sm:w-96 h-48 sm:h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-4 sm:space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold">About <span className="gradient-text">THRYLOS</span></h1>
            <p className="text-base sm:text-xl text-muted-foreground px-2">We are a team of passionate technologists dedicated to transforming businesses through innovative digital solutions.</p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-10 sm:py-16 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="space-y-4 sm:space-y-6">
              <h2 className="text-2xl sm:text-3xl font-bold">Our <span className="gradient-text">Story</span></h2>
              <p className="text-sm sm:text-base text-muted-foreground">Founded with a vision to bridge the gap between innovative technology and business needs, THRYLOS Tech has grown from a small startup to a trusted technology partner for businesses across industries.</p>
              <p className="text-sm sm:text-base text-muted-foreground">Our journey began with a simple belief: technology should empower, not complicate. Today, we continue to uphold this philosophy, delivering solutions that are not just technically excellent but also intuitive and user-friendly.</p>
              <p className="text-sm sm:text-base text-muted-foreground">With a team of experienced developers, designers, and strategists, we've successfully delivered 50+ projects, helping businesses transform their digital presence and streamline their operations.</p>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-primary/20 to-blue-600/20 p-1">
                <div className="w-full h-full rounded-2xl bg-card flex items-center justify-center">
                  <div className="text-center p-6 sm:p-8">
                    <div className="text-4xl sm:text-6xl font-bold gradient-text mb-2 sm:mb-4">5+</div>
                    <div className="text-base sm:text-xl text-muted-foreground">Years of Excellence</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-12 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Our <span className="gradient-text">Values</span></h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">The principles that guide everything we do</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {values.map((value, index) => (
              <div key={index} className="glass-card p-4 sm:p-6 rounded-xl text-center hover:border-primary/50 transition-all duration-300">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <value.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
                <h3 className="text-sm sm:text-lg font-semibold mb-1 sm:mb-2">{value.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12 sm:py-24 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4">Meet Our <span className="gradient-text">Team</span></h2>
            <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">The talented people behind THRYLOS Tech</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {team.map((member) => (
              <div key={member.id} className="text-center group">
                <div className="w-20 h-20 sm:w-32 sm:h-32 mx-auto mb-3 sm:mb-4 rounded-full overflow-hidden border-2 border-border group-hover:border-primary transition-colors">
                  {member.image_url ? (
                    <img src={member.image_url} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Users className="w-8 h-8 sm:w-12 sm:h-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-sm sm:text-base">{member.name}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{member.role}</p>
                {member.bio && <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 sm:mt-2 line-clamp-2">{member.bio}</p>}
              </div>
            ))}
          </div>
          {team.length === 0 && (
            <p className="text-center text-muted-foreground text-sm">Team members coming soon...</p>
          )}
        </div>
      </section>
    </MainLayout>
  );
};

export default About;
