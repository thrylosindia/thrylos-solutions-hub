import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image_url: string;
  project_url: string;
  technologies: string[];
  category: string;
  is_featured: boolean;
}

const defaultPortfolio: PortfolioItem[] = [
  {
    id: '1',
    title: 'E-Commerce Platform',
    description: 'A full-featured e-commerce solution with inventory management and payment integration.',
    image_url: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop',
    project_url: '#',
    technologies: ['React', 'Node.js', 'PostgreSQL', 'Stripe'],
    category: 'Web Development',
    is_featured: true,
  },
  {
    id: '2',
    title: 'Healthcare App',
    description: 'A mobile application for patient management and telemedicine consultations.',
    image_url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=600&h=400&fit=crop',
    project_url: '#',
    technologies: ['React Native', 'Firebase', 'Twilio'],
    category: 'Mobile App',
    is_featured: true,
  },
  {
    id: '3',
    title: 'AI Chatbot System',
    description: 'An intelligent customer service chatbot powered by natural language processing.',
    image_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop',
    project_url: '#',
    technologies: ['Python', 'TensorFlow', 'OpenAI', 'FastAPI'],
    category: 'AI/ML',
    is_featured: false,
  },
  {
    id: '4',
    title: 'Cloud Infrastructure',
    description: 'Scalable cloud architecture for a growing SaaS platform with 100k+ users.',
    image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop',
    project_url: '#',
    technologies: ['AWS', 'Kubernetes', 'Terraform', 'Docker'],
    category: 'Cloud',
    is_featured: false,
  },
  {
    id: '5',
    title: 'Fintech Dashboard',
    description: 'Real-time financial analytics dashboard with advanced charting and reporting.',
    image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop',
    project_url: '#',
    technologies: ['Vue.js', 'D3.js', 'Python', 'Redis'],
    category: 'Web Development',
    is_featured: true,
  },
  {
    id: '6',
    title: 'IoT Monitoring System',
    description: 'Industrial IoT platform for real-time equipment monitoring and predictive maintenance.',
    image_url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=400&fit=crop',
    project_url: '#',
    technologies: ['Node.js', 'MQTT', 'InfluxDB', 'Grafana'],
    category: 'IoT',
    is_featured: false,
  },
];

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState<PortfolioItem[]>(defaultPortfolio);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...new Set(portfolio.map(item => item.category))];

  useEffect(() => {
    const fetchPortfolio = async () => {
      const { data } = await supabase
        .from('portfolio_items')
        .select('*')
        .order('is_featured', { ascending: false });

      if (data && data.length > 0) {
        setPortfolio(data.map(p => ({
          ...p,
          technologies: p.technologies || [],
        })));
      }
    };

    fetchPortfolio();
  }, []);

  const filteredPortfolio = selectedCategory === 'All'
    ? portfolio
    : portfolio.filter(item => item.category === selectedCategory);

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-4xl md:text-6xl font-bold">
              Our <span className="gradient-text">Portfolio</span>
            </h1>
            <p className="text-xl text-muted-foreground">
              Showcasing our best work and successful projects
            </p>
          </div>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-3">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Portfolio Grid */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPortfolio.map((item) => (
              <div
                key={item.id}
                className="glass-card rounded-xl overflow-hidden hover:border-primary/50 transition-all duration-300 group"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {item.is_featured && (
                    <Badge className="absolute top-3 left-3 bg-primary">Featured</Badge>
                  )}
                </div>
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                    {item.project_url && item.project_url !== '#' && (
                      <a
                        href={item.project_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-muted transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {item.technologies.map((tech, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};

export default Portfolio;
