import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const Footer = () => {
  return (
    <div className="bg-card border-t border-border py-8 sm:py-12 col-span-full">
      <div className="container mx-auto px-4 sm:px-6 text-center">
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-4 sm:mt-6 flex-wrap">
            <span className="text-sm sm:text-lg text-white font-normal" style={{ fontFamily: 'taberna' }}>
              A
            </span>
            <span
              className="text-sm sm:text-lg font-extrabold tracking-wide bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 text-transparent bg-clip-text"
              style={{ fontFamily: "'Merlin', cursive" }}
            >
              misterutsav
            </span>
            <span className="text-sm sm:text-lg text-white font-normal" style={{ fontFamily: 'taberna' }}>
              PRODUCT
            </span>
            <Heart className="h-3 w-3 sm:h-4 sm:w-4 text-red-500 fill-red-500 animate-pulse" />
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mb-6 sm:mb-8 text-xs sm:text-sm">
          {[
            { href: '/', label: 'Home' },
            { href: '/about', label: 'About' },
            { href: '/services', label: 'Services' },
            { href: '/portfolio', label: 'Portfolio' },
            { href: '/contact', label: 'Contact' },
          ].map((link, i) => (
            <span key={link.href} className="flex items-center gap-3 sm:gap-6">
              {i > 0 && <span className="text-foreground/40 hidden sm:inline">|</span>}
              <Link to={link.href} className="text-foreground/60 hover:text-primary transition-colors">
                {link.label}
              </Link>
            </span>
          ))}
        </div>

        <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mb-6 sm:mb-8 text-xs sm:text-sm">
          {[
            { href: 'https://careers.thrylos.in', label: 'Careers', external: true },
            { href: '/privacy-policy', label: 'Privacy Policy' },
            { href: '/terms-of-service', label: 'Terms of Service' },
            { href: '/payment-policy', label: 'Payment Policy' },
          ].map((link, i) => (
            <span key={link.href} className="flex items-center gap-3 sm:gap-6">
              {i > 0 && <span className="text-foreground/40 hidden sm:inline">|</span>}
              {link.external ? (
                <a href={link.href} className="text-foreground/60 hover:text-primary transition-colors">
                  {link.label}
                </a>
              ) : (
                <Link to={link.href} className="text-foreground/60 hover:text-primary transition-colors">
                  {link.label}
                </Link>
              )}
            </span>
          ))}
        </div>

        <div className="border-t border-border pt-6 sm:pt-8">
          <p className="text-xs sm:text-sm text-muted-foreground">
            © {new Date().getFullYear()} THRYLOS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Footer;
