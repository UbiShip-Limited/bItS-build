import { useRef, useEffect } from "react";
import Link from "next/link";
import { X, Instagram, AtSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/src/components/ui/button";

interface MobileHeaderProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (isOpen: boolean) => void;
}

export function MobileHeader({ isMenuOpen, setIsMenuOpen }: MobileHeaderProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (isMenuOpen && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    // Prevent body scroll when menu is open
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      // Restore scroll when component unmounts
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen, setIsMenuOpen]);

  return (
    <AnimatePresence>
      {isMenuOpen && (
        <motion.div 
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
          className="fixed inset-0 bg-black z-[60] flex flex-col overflow-hidden" 
          data-testid="mobile-header"
        >
          {/* Top accent with gold line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gold/20 via-gold to-gold/20"></div>
      
          <div ref={menuRef} className="container mx-auto px-8 pt-24 pb-8 flex flex-col h-full">
            <nav className="flex flex-col space-y-8 items-center text-center">
          {[
            { name: "Home", path: "/" },
            { name: "Artists", path: "/artists" },
            { name: "Gallery", path: "/gallery" },
            { name: "Services", path: "/services" },
            { name: "FAQ", path: "#faq" },
            { name: "Aftercare", path: "#aftercare" },
            { name: "About", path: "/about" },
            { name: "Contact", path: "/contact" },
          ].map((item) => (
            <Link 
              key={item.name} 
              href={item.path}
              className="font-heading text-2xl text-white hover:text-gold transition-all duration-300 relative group tracking-[0.02em]"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.name}
              {/* Enhanced decorative element */}
              <div className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent group-hover:w-full transition-all duration-300 -translate-x-1/2"></div>
            </Link>
          ))}
          
          {/* Mobile booking button */}
          <Button 
            href="/tattooRequest"
            variant="primary"
            size="lg"
            className="mt-8"
            onClick={() => setIsMenuOpen(false)}
          >
            Book a Consultation
          </Button>
        </nav>

            {/* Elegant divider */}
            <div className="my-12 flex items-center justify-center">
              <div className="w-20 h-px bg-gradient-to-r from-transparent to-gold"></div>
              <div className="mx-4 w-3 h-3 border-2 border-gold rotate-45"></div>
              <div className="w-20 h-px bg-gradient-to-l from-transparent to-gold"></div>
            </div>

            {/* Close Button - Now floating */}
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-full border-2 border-white/20 text-white hover:border-gold hover:text-gold transition-all duration-300 hover:rotate-90"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>

            <div className="mt-auto">
              <div className="flex justify-center space-x-6 mb-8">
                <a 
                  href="https://instagram.com/bowenislandtattoo" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 p-0 rounded-full border border-white/20 hover:border-gold text-white hover:text-gold transition-all duration-300 flex items-center justify-center"
                >
                  <Instagram size={20} />
                </a>
                <a 
                  href="mailto:info@bowenislandtattoo.com"
                  className="w-12 h-12 p-0 rounded-full border border-white/20 hover:border-gold text-white hover:text-gold transition-all duration-300 flex items-center justify-center"
                >
                  <AtSign size={20} />
                </a>
              </div>
              <div className="text-center text-white/70 text-sm font-body">
                <p>Bowen Island, BC, Canada</p>
                <p className="mt-2 text-gold">By Appointment Only</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 