import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogIn, LogOut, Menu, X, LayoutDashboard } from 'lucide-react';
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

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
    setShowUserMenu(false);
  }, [location.pathname]);

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
      className={`relative flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl w-full max-w-6xl transition-all duration-300 mx-auto z-50
        ${isScrolled ? 'sticky top-2 sm:top-4 bg-[#1A1A1A] shadow-xl backdrop-blur-md' : 'mt-3 sm:mt-6 bg-[#0F0F0F]/80 shadow-md backdrop-blur-md'}
      `}
    >
      
      {/* Logo */}
      <div
        className="text-lg sm:text-2xl font-extrabold tracking-wide bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 text-transparent bg-clip-text cursor-pointer flex-shrink-0"
        style={{ fontFamily: "'Nixmat', sans-serif" }}
        onClick={() => navigate('/')}
      >
        THRYLOS
      </div>

      {/* Desktop nav */}
      <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.href;

          return (
            <motion.button
              key={item.name}
              onClick={() => navigate(item.href)}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative font-medium transition-all duration-300 group text-sm lg:text-base
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
              <span className="text-sm font-medium text-foreground max-w-[100px] truncate hidden lg:block">
                {profile?.full_name || profile?.username || 'PROFILE'}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 top-12 bg-card border border-border rounded-xl shadow-lg p-3 min-w-[200px] z-50 space-y-2">
                <button
                  onClick={() => { navigate('/dashboard'); setShowUserMenu(false); }}
                  className="w-full px-4 py-2.5 rounded-lg border border-blue-500/50 text-white bg-blue-500/10 hover:bg-blue-500 hover:border-blue-500 transition-colors duration-300 flex items-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </button>
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
            className="px-4 lg:px-5 py-2 rounded-md border border-blue-500 text-white bg-transparent hover:bg-blue-500 transition flex items-center gap-2 text-sm"
          >
            <LogIn className="w-4 h-4" />
            Login
          </button>
        )}
      </div>

      {/* Mobile actions */}
      <div className="flex items-center gap-2 md:hidden">
        {user && (
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-md border border-border bg-card/60 hover:bg-card transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-white" />
          </button>
        )}
        <button
          onClick={() => setShowMobileMenu(prev => !prev)}
          className="p-2 rounded-md border border-border bg-card/60 hover:bg-card transition-colors"
        >
          {showMobileMenu ? <X className="w-5 h-5 text-white" /> : <Menu className="w-5 h-5 text-white" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute left-2 right-2 sm:left-4 sm:right-4 top-full mt-2 md:hidden z-50"
          >
            <div className="rounded-xl sm:rounded-2xl bg-[#0F0F0F]/95 border border-border shadow-xl p-3 space-y-1.5">
              {navItems.map(item => (
                <button
                  key={item.name}
                  onClick={() => {
                    navigate(item.href);
                    setShowMobileMenu(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition
                    ${location.pathname === item.href ? 'bg-primary/20 text-primary' : 'bg-white/5 text-white hover:bg-white/10'}`}
                >
                  {item.name}
                </button>
              ))}
              
              <div className="border-t border-border/50 pt-2 mt-2">
                {user ? (
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition flex items-center gap-2 text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                ) : (
                  <button
                    onClick={() => { navigate('/auth'); setShowMobileMenu(false); }}
                    className="w-full text-left px-4 py-2.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition flex items-center gap-2 text-sm"
                  >
                    <LogIn className="w-4 h-4" />
                    Login / Sign Up
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Navbar;
