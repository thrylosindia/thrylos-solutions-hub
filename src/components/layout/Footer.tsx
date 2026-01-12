import { Link } from 'react-router-dom';
import { Zap, Mail, Phone, MapPin, Heart } from 'lucide-react';

const Footer = () => {
  return (
    <>
      {/* Footer */}
      <div className="bg-card border-t border-border py-12 col-span-full">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3 mt-6">
              <span className="text-lg text-white font-normal" style={{ fontFamily: 'taberna' }}>
                A
              </span>
              <span
                className="text-lg font-extrabold tracking-wide bg-gradient-to-r from-orange-500 via-pink-500 to-blue-500 text-transparent bg-clip-text"
                style={{ fontFamily: "'Merlin', cursive" }}
              >
                misterutsav
              </span>
              <span className="text-lg text-white font-normal" style={{ fontFamily: 'taberna' }}>
                PRODUCT
              </span>
              <Heart className="h-4 w-4 text-red-500 fill-red-500 animate-pulse" />
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <a href="/home" className="text-foreground/60 hover:text-primary transition-colors">
              Home
            </a>
            <span className="text-foreground/40">|</span>
            <a href="/about" className="text-foreground/60 hover:text-primary transition-colors">
              About
            </a>
            <span className="text-foreground/40">|</span>
            <a href="/services" className="text-foreground/60 hover:text-primary transition-colors">
              Services
            </a>
            <span className="text-foreground/40">|</span>
            <a href="/portfolio" className="text-foreground/60 hover:text-primary transition-colors">
              Portfolio
            </a>
            <span className="text-foreground/40">|</span>
            <a href="/contact" className="text-foreground/60 hover:text-primary transition-colors">
              Contact
            </a>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm">
            <a href="https://careers.thrylos.in" className="text-foreground/60 hover:text-primary transition-colors">
              Careers
            </a>
            <span className="text-foreground/40">|</span>
            <a href="/privacy-policy" className="text-foreground/60 hover:text-primary transition-colors">
              Privacy Policy
            </a>
            <span className="text-foreground/40">|</span>
            <a href="/terms-of-service" className="text-foreground/60 hover:text-primary transition-colors">
              Terms of Service
            </a>
            <span className="text-foreground/40">|</span>
            <a href="/payment-policy" className="text-foreground/60 hover:text-primary transition-colors">
              Payment Policy
            </a>
          </div>


          <div className="border-t border-border pt-8">
            <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} THRYLOS. All rights reserved.
          </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Footer;
