'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import ThemeSwitcher from '@/src/components/ThemeSwitcher';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Palette, 
  CreditCard, 
  Settings,
  LogOut,
  Bell,
  ChevronLeft,
  Loader2,
  BarChart3,
  Clock,
  Menu,
  X,
  Mail
} from 'lucide-react';
import NotificationCenter from '@/src/components/dashboard/NotificationCenter';
import { analyticsService } from '@/src/lib/api/services/analyticsService';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, session, loading, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [notificationCounts, setNotificationCounts] = useState({
    appointments: 0,
    tattooRequests: 0,
    payments: 0
  });

  useEffect(() => {
    // Only redirect if we're done loading AND have no session at all
    if (!loading && !session) {
      console.log('🚪 No session found in DashboardLayout, redirecting to login');
      router.push('/auth/login');
    }
  }, [session, loading, router]);

  // Connect to SSE for real-time notification counts
  useEffect(() => {
    if (!user || loading) return;

    // Load initial counts from analytics API
    const loadInitialCounts = async () => {
      try {
        console.log('🔄 Loading initial notification counts...');
        const response = await analyticsService.getDashboardMetrics('today');
        
        if (response) {
          // Extract notification counts from the analytics response
          const newCounts = {
            appointments: response.appointments?.today?.remaining || 0,
            tattooRequests: response.requests?.pending?.count || 0,
            payments: 0 // TODO: Add payment pending count when available in analytics
          };
          
          console.log('✅ Loaded initial counts:', newCounts);
          setNotificationCounts(newCounts);
        }
      } catch (error) {
        console.error('❌ Error loading initial counts:', error);
        // Continue with default counts if API fails
      }
    };

    loadInitialCounts();

    const apiUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL || 'http://localhost:3001';
    const eventSource = new EventSource(`${apiUrl}/events?userId=${user.id || 'admin-user'}`);

    // Update counts based on events
    eventSource.addEventListener('appointment_created', () => {
      setNotificationCounts(prev => ({ ...prev, appointments: prev.appointments + 1 }));
    });

    eventSource.addEventListener('request_submitted', () => {
      setNotificationCounts(prev => ({ ...prev, tattooRequests: prev.tattooRequests + 1 }));
    });

    eventSource.addEventListener('payment_received', () => {
      setNotificationCounts(prev => ({ ...prev, payments: prev.payments + 1 }));
    });

    // Also listen for status changes that might reduce counts
    eventSource.addEventListener('appointment_approved', () => {
      if (!pathname?.includes('/appointments')) {
        setNotificationCounts(prev => ({ 
          ...prev, 
          appointments: Math.max(0, prev.appointments - 1) 
        }));
      }
    });

    eventSource.addEventListener('request_reviewed', () => {
      if (!pathname?.includes('/tattoo-request')) {
        setNotificationCounts(prev => ({ 
          ...prev, 
          tattooRequests: Math.max(0, prev.tattooRequests - 1) 
        }));
      }
    });

    // Reset counts when navigating to the respective pages
    if (pathname?.includes('/appointments')) {
      setNotificationCounts(prev => ({ ...prev, appointments: 0 }));
    }
    if (pathname?.includes('/tattoo-request')) {
      setNotificationCounts(prev => ({ ...prev, tattooRequests: 0 }));
    }
    if (pathname?.includes('/payments')) {
      setNotificationCounts(prev => ({ ...prev, payments: 0 }));
    }

    return () => {
      eventSource.close();
    };
  }, [user, loading, pathname]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#C9A449] mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/auth/login');
  };

  const navItems = [
    // Operations Section
    {
      section: 'Operations',
      items: [
        { 
          href: '/dashboard', 
          icon: LayoutDashboard, 
          label: 'Overview',
          exact: true
        },
        { 
          href: '/dashboard/analytics', 
          icon: BarChart3, 
          label: 'Analytics',
          badge: 'NEW',
          badgeColor: 'badge-success'
        },
        { 
          href: '/dashboard/appointments', 
          icon: Calendar, 
          label: 'Appointments',
          badge: notificationCounts.appointments || undefined
        },
      ]
    },
    // Management Section
    {
      section: 'Management',
      items: [
        { 
          href: '/dashboard/customers', 
          icon: Users, 
          label: 'Customers' 
        },
        { 
          href: '/dashboard/tattoo-request', 
          icon: Palette, 
          label: 'Tattoo Requests',
          badge: notificationCounts.tattooRequests || undefined,
          badgeColor: 'badge-warning'
        },
        { 
          href: '/dashboard/payments', 
          icon: CreditCard, 
          label: 'Payments',
          badge: notificationCounts.payments || undefined,
          badgeColor: 'badge-info'
        },
      ]
    },
    // Settings Section
    {
      section: 'Settings',
      items: [
        { 
          href: '/dashboard/business-hours', 
          icon: Clock, 
          label: 'Business Hours' 
        },
        { 
          href: '/dashboard/email-templates', 
          icon: Mail, 
          label: 'Email Templates' 
        },
        { 
          href: '/dashboard/email-automation', 
          icon: Mail, 
          label: 'Email Automation',
          badge: 'NEW',
          badgeColor: 'badge-primary'
        },
        { 
          href: '/dashboard/notifications', 
          icon: Bell, 
          label: 'Notifications' 
        },
        { 
          href: '/dashboard/settings', 
          icon: Settings, 
          label: 'Settings' 
        },
      ]
    }
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (!pathname) return false;
    
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-base-300">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        ${isCollapsed ? 'w-20' : 'w-72'} 
        bg-[#080808] shadow-2xl
        transition-all duration-300 ease-in-out
        relative flex flex-col border-r border-[#1a1a1a]
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 fixed lg:relative z-50 h-full
      `}>
        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-9 z-10 w-8 h-8 bg-[#080808] border border-[#C9A449]/20
                     rounded-full flex items-center justify-center shadow-xl hover:border-[#C9A449]/40
                     transition-all duration-200 group hidden lg:flex"
        >
          <ChevronLeft className={`w-4 h-4 text-[#C9A449] transition-transform duration-200 
                                  ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute right-4 top-6 z-10 w-8 h-8 lg:hidden"
        >
          <X className="w-6 h-6 text-gray-400" />
        </button>

        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className="p-6 border-b border-[#1a1a1a] bg-gradient-to-b from-[#080808] to-[#0a0a0a]">
            <div className={`transition-all duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
              <h1 className="text-2xl font-heading font-bold text-white tracking-wider">
                BOWEN ISLAND
              </h1>
              <p className="text-sm text-[#C9A449] mt-1 tracking-widest uppercase">
                Tattoo Studio
              </p>
            </div>
            {isCollapsed && (
              <div className="text-2xl font-bold text-[#C9A449] text-center font-heading">B</div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-3 overflow-y-auto">
            <div className="space-y-8">
              {navItems.map((section, sectionIndex) => (
                <div key={section.section}>
                  {/* Section Header */}
                  {!isCollapsed && (
                    <h3 className="px-4 mb-3 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {section.section}
                    </h3>
                  )}
                  {isCollapsed && sectionIndex > 0 && (
                    <div className="mx-4 mb-3 border-t border-[#1a1a1a]"></div>
                  )}
                  
                  {/* Section Items */}
                  <ul className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href, item.exact);
                      
                      return (
                        <li key={item.href}>
                          <Link 
                            href={item.href}
                            className={`
                              flex items-center gap-4 px-4 py-3.5 rounded-lg text-gray-400
                              transition-all duration-200 group relative overflow-hidden
                              ${active 
                                ? 'bg-[#C9A449]/10 text-[#C9A449] border border-[#C9A449]/20' 
                                : 'hover:bg-white/5 hover:text-white'
                              }
                            `}
                          >
                            {/* Active indicator */}
                            {active && (
                              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#C9A449]"></div>
                            )}
                            
                            {/* Icon */}
                            <div className={`relative ${active ? 'text-[#C9A449]' : ''}`}>
                              <Icon className={`w-5 h-5 transition-all duration-200 
                                             ${active ? '' : 'group-hover:scale-110'}`} />
                            </div>
                            
                            {/* Label */}
                            {!isCollapsed && (
                              <span className={`font-medium text-sm tracking-wide transition-all duration-200 
                                             ${active ? 'text-[#C9A449]' : ''}`}>
                                {item.label}
                              </span>
                            )}
                            
                            {/* Badge */}
                            {item.badge && !isCollapsed && (
                              <span className={`ml-auto px-2 py-0.5 text-xs rounded-full
                                              ${active 
                                                ? 'bg-[#C9A449] text-[#080808]' 
                                                : 'bg-[#C9A449]/20 text-[#C9A449]'
                                              }`}>
                                {item.badge}
                              </span>
                            )}
                            
                            {/* Collapsed badge */}
                            {item.badge && isCollapsed && (
                              <span className="absolute top-2 right-2 w-2 h-2 bg-[#C9A449] rounded-full"></span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          {/* Bottom Section */}
          <div className="mt-auto">
            {/* User Section */}
            <div className="p-4 border-t border-[#1a1a1a] bg-gradient-to-t from-[#050505] to-transparent">
              <div className={`
                flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 
                transition-all duration-200 cursor-pointer group
                ${isCollapsed ? 'justify-center' : ''}
              `}>
                <div className="avatar">
                  <div className="w-10 rounded-full ring ring-[#C9A449]/20 ring-offset-2 ring-offset-[#080808]">
                    <div className="bg-gradient-to-br from-[#C9A449] to-[#8B7635] w-full h-full rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-[#080808]">AD</span>
                    </div>
                  </div>
                </div>
                
                {!isCollapsed && (
                  <>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{user?.role || session?.user?.user_metadata?.role || 'Artist'}</p>
                      <p className="text-xs text-gray-500">{user?.email || session?.user?.email || 'User'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThemeSwitcher />
                      <div className="divider divider-horizontal m-0 before:bg-[#1a1a1a] after:bg-[#1a1a1a]"></div>
                      <button 
                        onClick={handleSignOut}
                        className="btn btn-ghost btn-xs btn-circle text-gray-400 
                                         hover:text-white hover:bg-white/10 group"
                        title="Sign Out"
                      >
                        <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              {isCollapsed && (
                <div className="mt-2 flex justify-center gap-2">
                  <ThemeSwitcher />
                  <button 
                    onClick={handleSignOut}
                    className="btn btn-ghost btn-xs btn-circle text-gray-400 
                                     hover:text-white hover:bg-white/10"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-[#0a0a0a] overflow-x-hidden">
        <div className="min-h-screen">
          {/* Top Bar */}
          <div className="bg-[#080808]/50 backdrop-blur-xl border-b border-[#1a1a1a] px-4 lg:px-8 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden p-2 text-gray-400 hover:text-white"
                >
                  <Menu className="w-6 h-6" />
                </button>
                
                <div>
                  <h2 className="text-xl lg:text-2xl font-heading font-bold text-white tracking-wide">
                  {(() => {
                    for (const section of navItems) {
                      const activeItem = section.items.find(item => {
                        const exact = 'exact' in item ? item.exact : undefined;
                        return isActive(item.href, exact);
                      });
                      if (activeItem) return activeItem.label;
                    }
                    return 'Dashboard';
                  })()}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1 hidden lg:block">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                  </p>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center gap-2 lg:gap-3">
                <NotificationCenter userId="admin-user" />
                <button className="hidden sm:flex btn btn-ghost btn-sm text-gray-400 hover:text-white 
                                 border border-transparent hover:border-gold/20 tracking-wider uppercase text-xs lg:text-sm">
                  Quick Add
                </button>
                <button className="btn btn-sm bg-gold hover:bg-gold/90 text-obsidian 
                                 border-0 font-medium shadow-elegant tracking-wider uppercase text-xs lg:text-sm">
                  <span className="hidden sm:inline">New</span> Appointment
                </button>
              </div>
            </div>
          </div>
          
          {/* Page Content */}
          <div className="animate-fadeIn p-4 lg:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
