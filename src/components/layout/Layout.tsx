import React from 'react';
import Link from 'next/link';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <header className="bg-obsidian text-white">
        <div className="container mx-auto py-4 px-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-heading text-gold hover:text-gold/80">
            Bowen Island Tattoo
          </Link>
          
          <nav className="hidden md:flex space-x-8 font-body">
            <Link href="/" className="text-white hover:text-gold transition-colors">
              Home
            </Link>
            <Link href="/gallery" className="text-white hover:text-gold transition-colors">
              Gallery
            </Link>
            <Link href="/artists" className="text-white hover:text-gold transition-colors">
              Artists
            </Link>
            <Link href="/faq" className="text-white hover:text-gold transition-colors">
              FAQ
            </Link>
            <Link href="/tattoo-request" className="text-white hover:text-gold transition-colors">
              Request Tattoo
            </Link>
          </nav>
          
          <div className="md:hidden">
            <button className="text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow">
        {children}
      </main>
      
      <footer className="bg-obsidian text-white py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="font-heading text-gold text-xl mb-4">Bowen Island Tattoo</h3>
              <p className="text-slate mb-2">123 Bowen Island Drive</p>
              <p className="text-slate mb-2">Bowen Island, BC</p>
              <p className="text-slate">Canada V0N 1G0</p>
            </div>
            
            <div>
              <h3 className="font-heading text-gold text-xl mb-4">Hours</h3>
              <p className="text-slate mb-2">Tuesday - Saturday</p>
              <p className="text-slate mb-2">10:00 AM - 6:00 PM</p>
              <p className="text-slate">By appointment only</p>
            </div>
            
            <div>
              <h3 className="font-heading text-gold text-xl mb-4">Contact</h3>
              <p className="text-slate mb-2">info@bowenislandtattoo.com</p>
              <p className="text-slate mb-4">(604) 555-1234</p>
              <div className="flex space-x-4">
                <a href="#" className="text-white hover:text-gold transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a href="#" className="text-white hover:text-gold transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate/20 text-center text-slate text-sm">
            <p>© {new Date().getFullYear()} Bowen Island Tattoo Shop. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 