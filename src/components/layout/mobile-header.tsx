import { useRef, useEffect } from "react";
import Link from "next/link";
import { X, Instagram, AtSign } from "lucide-react";

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

  if (!isMenuOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-white z-[60] flex flex-col" 
      style={{ 
        backgroundColor: '#ffffff', 
        width: '100vw', 
        height: '100vh',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      data-testid="mobile-header"
    >
      {/* Ornamental top border */}
      <div className="absolute top-0 left-0 w-full h-[0.5px] bg-white"></div>
      
      <div ref={menuRef} className="container mx-auto px-4 pt-20 pb-8 flex flex-col h-full">
        <nav className="flex flex-col space-y-5 items-center text-center">
          {[
            { name: "Home", path: "/" },
            { name: "Artists", path: "/artists" },
            { name: "Gallery", path: "/gallery" },
            { name: "Services", path: "/services" },
            { name: "About", path: "/about" },
            { name: "Contact", path: "/contact" },
          ].map((item) => (
            <Link 
              key={item.name} 
              href={item.path}
              className="font-heading text-xl text-[#080808] hover:text-[#C9A449] transition-colors duration-300 relative group"
              onClick={() => setIsMenuOpen(false)}
            >
              {item.name}
              {/* Subtle decorative element */}
              <div className="absolute -bottom-1 left-1/2 w-0 h-[1px] bg-[#C9A449] group-hover:w-full transition-all duration-300 -translate-x-1/2"></div>
            </Link>
          ))}
          
          {/* Mobile booking button */}
          <Link 
            href="/booking"
            className="font-body text-[#080808] text-sm tracking-widest uppercase mt-4 px-6 py-3 border border-[#C9A449]/30 hover:bg-[#C9A449]/10 hover:border-[#C9A449] transition-all duration-300 relative overflow-hidden"
            onClick={() => setIsMenuOpen(false)}
          >
            <span className="relative z-10">Book a Consultation</span>
            <div className="absolute inset-0 bg-gradient-to-r from-[#C9A449]/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
        </nav>

        {/* Ornamental divider */}
        <div className="my-8 flex items-center justify-center">
          <div className="w-16 h-[0.5px] bg-gradient-to-r from-transparent to-[#C9A449]/40"></div>
          <div className="mx-4 w-2 h-2 border border-[#C9A449]/50 rotate-45"></div>
          <div className="w-16 h-[0.5px] bg-gradient-to-l from-transparent to-[#C9A449]/40"></div>
        </div>

        {/* Close Button */}
        <div className="mb-8 flex justify-center">
          <button
            onClick={() => setIsMenuOpen(false)}
            className="flex items-center justify-center space-x-2 px-5 py-2 border border-[#080808]/20 bg-[#080808] text-white hover:bg-white hover:text-[#080808] hover:border-[#C9A449] transition-all duration-300 font-body text-xs tracking-widest uppercase"
          >
            <X size={14} />
            <span>Close</span>
          </button>
        </div>

        <div className="mt-auto">
          <div className="flex justify-center space-x-4 mb-6">
            <Link 
              href="https://instagram.com/bowenislandtattoo" 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-9 h-9 flex items-center justify-center border border-[#080808]/20 text-[#080808] hover:bg-[#C9A449]/10 hover:text-[#C9A449] hover:border-[#C9A449] transition-all duration-300"
            >
              <Instagram size={16} />
            </Link>
            <Link 
              href="mailto:info@bowenislandtattoo.com"
              className="w-9 h-9 flex items-center justify-center border border-[#080808]/20 text-[#080808] hover:bg-[#C9A449]/10 hover:text-[#C9A449] hover:border-[#C9A449] transition-all duration-300"
            >
              <AtSign size={16} />
            </Link>
          </div>
          <div className="text-center text-[#444444] text-xs font-body">
            <p>Bowen Island, BC, Canada</p>
            <p className="mt-1 text-[#C9A449]/70">By Appointment Only</p>
          </div>
        </div>
      </div>
    </div>
  );
} 