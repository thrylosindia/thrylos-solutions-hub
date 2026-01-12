import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, LogIn, LogOut, Menu, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setShowMobileMenu(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name, avatar_url, username')
      .eq('id', userId)
      .maybeSingle();

    if (data) setProfile(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setShowUserMenu(false);
    setShowMobileMenu(false);
    navigate('/');
  };

  const navItems = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Portfolio", href: "/portfolio" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`relative flex items-center justify-between gap-4 px-4 sm:px-6 py-3 rounded-2xl w-full max-w-6xl transition-all duration-300 mx-auto z-50
        ${isScrolled ? 'sticky top-4 bg-[#1A1A1A] shadow-xl backdrop-blur-md' : 'mt-6 bg-[#0F0F0F]/80 shadow-md backdrop-blur-md'}
      `}
    >
      
      {/* Logo */}
      <div
        className="text-2xl font-extrabold tracking-wide bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 text-transparent bg-clip-text cursor-pointer"
        style={{ fontFamily: "'Nixmat', sans-serif" }}
        onClick={() => navigate('/')}
      >
        THRYLOS
      </div>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center space-x-8">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.href;

          return (
            <motion.button
              key={item.name}
              onClick={() => navigate(item.href)}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative font-medium transition-all duration-300 group
                ${isActive ? "text-white" : "text-white/80 hover:text-white"}
              `}
            >
              {item.name}
              <span
                className={`absolute -bottom-1 left-0 h-0.5 bg-blue-500 transition-all duration-300
                  ${isActive ? "w-full" : "w-0 group-hover:w-full"}`}
              />
            </motion.button>
          );
        })}
      </div>

      {/* Desktop actions */}
      <div className="hidden md:flex items-center space-x-3 ml-4">
        <motion.button 
          onClick={() => navigate('/get-started')}
          className="px-5 py-2 rounded-md bg-[#2196F3] text-white hover:bg-blue-600 transition-colors"
        >
          Get Started
        </motion.button>

        {user ? (
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-card/50 hover:bg-card transition-colors"
            >
              <div className="w-8 h-8 rounded-md overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
              </div>
              <span className="text-sm font-medium text-foreground max-w-[100px] truncate hidden sm:block">
                {profile?.full_name || profile?.username || 'User'}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 bg-card border border-border rounded-xl shadow-lg p-3 min-w-[200px] z-50 space-y-2">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2.5 rounded-lg border border-red-500/50 text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white transition flex gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => navigate('/auth')}
            className="px-5 py-2 rounded-md border border-blue-500 text-white bg-transparent hover:bg-blue-500 transition flex items-center gap-2"
          >
            <LogIn className="w-4 h-4" />
            Login
          </button>
        )}
      </div>

      {/* Mobile */}
      <div className="flex items-center gap-2 md:hidden">
        <button
          onClick={() => setShowMobileMenu(prev => !prev)}
          className="p-2 rounded-md border border-border bg-card/60 hover:bg-card transition-colors"
        >
          {showMobileMenu ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {showMobileMenu && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute left-4 right-4 top-full mt-3 md:hidden z-50"
        >
          <div className="rounded-2xl bg-[#0F0F0F]/95 border border-border shadow-xl p-4 space-y-3">
            {navItems.map(item => (
              <button
                key={item.name}
                onClick={() => {
                  navigate(item.href);
                  setShowMobileMenu(false);
                }}
                className="w-full text-left px-4 py-2 rounded-lg bg-white/5 text-white hover:bg-white/10 transition"
              >
                {item.name}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Navbar;
