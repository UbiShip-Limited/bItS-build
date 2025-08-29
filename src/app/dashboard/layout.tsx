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
import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';
import { toast } from '@/src/lib/toast';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, session, loading, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // Initialize notification counts from sessionStorage if available
  const [notificationCounts, setNotificationCounts] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('notificationCounts');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (e) {
          console.error('Failed to parse stored notification counts:', e);
        }
      }
    }
    return {
      appointments: 0,
      tattooRequests: 0,
      payments: 0
    };
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
    eventSource.addEventListener('appointment_created', (event) => {
      setNotificationCounts(prev => ({ ...prev, appointments: prev.appointments + 1 }));
      
      // Show toast notification for new appointment
      try {
        const data = JSON.parse(event.data);
        const message = data.customerId 
          ? `New appointment created! Customer ID: ${data.customerId}`
          : 'New appointment created! Walk-in appointment';
        toast.success(message);
      } catch (e) {
        toast.success('New appointment created!');
      }
    });

    eventSource.addEventListener('request_submitted', (event) => {
      setNotificationCounts(prev => ({ ...prev, tattooRequests: prev.tattooRequests + 1 }));
      
      // Show toast notification for new tattoo request
      try {
        const data = JSON.parse(event.data);
        toast.info('New tattoo request received! Review in Tattoo Requests section');
      } catch (e) {
        toast.info('New tattoo request received!');
      }
    });

    eventSource.addEventListener('payment_received', (event) => {
      setNotificationCounts(prev => ({ ...prev, payments: prev.payments + 1 }));
      
      // Show toast notification for payment
      try {
        const data = JSON.parse(event.data);
        const amount = data.amount ? `$${(data.amount / 100).toFixed(2)}` : '';
        toast.success(`Payment received${amount ? `: ${amount}` : '!'}`);
      } catch (e) {
        toast.success('Payment received!');
      }
    });

    // Also listen for status changes that might reduce counts
    eventSource.addEventListener('appointment_approved', (event) => {
      if (!pathname?.includes('/appointments')) {
        setNotificationCounts(prev => ({ 
          ...prev, 
          appointments: Math.max(0, prev.appointments - 1) 
        }));
      }
      toast.info('Appointment approved');
    });

    eventSource.addEventListener('request_reviewed', (event) => {
      if (!pathname?.includes('/tattoo-request')) {
        setNotificationCounts(prev => ({ 
          ...prev, 
          tattooRequests: Math.max(0, prev.tattooRequests - 1) 
        }));
      }
      toast.info('Tattoo request reviewed');
    });
    
    eventSource.addEventListener('request_approved', (event) => {
      toast.success('Tattoo request approved! Ready to convert to appointment');
    });
    
    eventSource.addEventListener('request_rejected', (event) => {
      toast.warning('Tattoo request rejected');
    });

    // No automatic resetting here - will be handled differently

    return () => {
      eventSource.close();
    };
  }, [user, loading]);

  // Clear notification badges when viewing the respective pages
  // This is separate from SSE to handle page navigation properly
  useEffect(() => {
    if (!pathname) return;
    
    // Use a small delay to ensure the page has actually loaded
    const timer = setTimeout(() => {
      if (pathname.includes('/appointments')) {
        setNotificationCounts(prev => ({ ...prev, appointments: 0 }));
      } else if (pathname.includes('/tattoo-request')) {
        setNotificationCounts(prev => ({ ...prev, tattooRequests: 0 }));
      } else if (pathname.includes('/payments')) {
        setNotificationCounts(prev => ({ ...prev, payments: 0 }));
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [pathname]);

  // Persist notification counts to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('notificationCounts', JSON.stringify(notificationCounts));
    }
  }, [notificationCounts]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className={`min-h-screen ${colors.bgPrimary} flex items-center justify-center`}>
        <div className="text-center">
          <Loader2 className={`w-8 h-8 animate-spin ${colors.textAccent} mx-auto mb-4`} />
          <p className={colors.textSecondary}>Loading...</p>
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
    <div className={`min-h-screen bg-gradient-to-b from-obsidian via-obsidian/95 to-obsidian ${isMobileMenuOpen ? '' : 'lg:flex'}`}>
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        ${isCollapsed ? 'lg:w-20' : 'lg:w-72'} 
        w-72 bg-gradient-to-b from-obsidian via-obsidian/98 to-obsidian backdrop-blur-xl
        ${effects.transitionSlow}
        flex flex-col border-r ${colors.borderSubtle}
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 fixed lg:relative z-50 h-screen lg:h-full shadow-xl
      `}>
        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`absolute -right-4 top-9 z-10 w-8 h-8 ${colors.bgPrimary} border ${colors.borderSubtle}
                     rounded-full flex items-center justify-center shadow-elegant hover:${colors.borderDefault}
                     ${effects.transitionNormal} group hidden lg:flex hover:shadow-gold-glow`}
        >
          <ChevronLeft className={`w-4 h-4 ${colors.textAccent} ${effects.transitionNormal} 
                                  ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
        
        {/* Mobile Close Button */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute right-4 top-6 z-10 w-8 h-8 lg:hidden"
        >
          <X className={`w-6 h-6 ${colors.textSecondary}`} />
        </button>

        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className={`p-6 border-b ${colors.borderSubtle} bg-gradient-to-b from-obsidian via-obsidian/95 to-transparent`}>
            <div className={`${effects.transitionNormal} ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
              <h1 className={`text-2xl ${typography.fontBrand} font-bold ${colors.textPrimary} ${typography.trackingWide}`}>
                BOWEN ISLAND
              </h1>
              <p className={`${typography.textSm} ${colors.textAccentSecondary} mt-1 tracking-widest uppercase`}>
                Tattoo Studio
              </p>
            </div>
            {isCollapsed && (
              <div className={`text-2xl font-bold ${colors.textAccent} text-center ${typography.fontBrand}`}>B</div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-3 overflow-y-auto">
            <div className="space-y-8">
              {navItems.map((section, sectionIndex) => (
                <div key={section.section}>
                  {/* Section Header */}
                  {!isCollapsed && (
                    <h3 className={`px-4 mb-3 ${typography.textXs} ${typography.fontSemibold} ${colors.textMuted} uppercase ${typography.trackingWide}`}>
                      {section.section}
                    </h3>
                  )}
                  {isCollapsed && sectionIndex > 0 && (
                    <div className={`mx-4 mb-3 border-t ${colors.borderSubtle}`}></div>
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
                              flex items-center gap-4 px-4 py-3.5 ${components.radius.medium} ${colors.textSecondary}
                              ${effects.transitionNormal} group relative overflow-hidden
                              ${active 
                                ? `bg-gold-500/10 ${colors.textAccent} border ${colors.borderDefault} shadow-soft` 
                                : `hover:bg-white/5 hover:${colors.textPrimary}`
                              }
                            `}
                          >
                            {/* Active indicator */}
                            {active && (
                              <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${colors.bgAccent}`}></div>
                            )}
                            
                            {/* Icon */}
                            <div className={`relative ${active ? colors.textAccent : ''}`}>
                              <Icon className={`w-5 h-5 ${effects.transitionNormal} 
                                             ${active ? '' : 'group-hover:scale-110'}`} />
                              {active && (
                                <div className="absolute inset-0 bg-gold-500/20 rounded-full blur-sm scale-150"></div>
                              )}
                            </div>
                            
                            {/* Label */}
                            {!isCollapsed && (
                              <span className={`${typography.fontMedium} ${typography.textSm} ${typography.trackingWide} ${effects.transitionNormal} 
                                             ${active ? colors.textAccent : ''}`}>
                                {item.label}
                              </span>
                            )}
                            
                            {/* Badge */}
                            {item.badge && !isCollapsed && (
                              <span className={`ml-auto px-2 py-0.5 ${typography.textXs} rounded-full ${effects.transitionNormal}
                                              ${active 
                                                ? `${colors.bgAccent} text-obsidian` 
                                                : `bg-gold-500/20 ${colors.textAccent}`
                                              }`}>
                                {item.badge}
                              </span>
                            )}
                            
                            {/* Collapsed badge */}
                            {item.badge && isCollapsed && (
                              <span className={`absolute top-2 right-2 w-2 h-2 ${colors.bgAccent} rounded-full shadow-gold-glow`}></span>
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
            <div className={`p-4 border-t ${colors.borderSubtle} bg-gradient-to-t from-obsidian/80 to-transparent backdrop-blur-sm`}>
              <div className={`
                flex items-center gap-3 p-3 ${components.radius.medium} hover:bg-white/5 
                ${effects.transitionNormal} cursor-pointer group
                ${isCollapsed ? 'justify-center' : ''}
              `}>
                <div className="avatar">
                  <div className={`w-10 rounded-full ring ring-gold-500/20 ring-offset-2 ring-offset-obsidian`}>
                    <div className={`bg-gradient-to-br from-gold-500 to-gold-700 w-full h-full rounded-full flex items-center justify-center shadow-soft`}>
                      <span className={`${typography.textSm} ${typography.fontSemibold} text-obsidian`}>AD</span>
                    </div>
                  </div>
                </div>
                
                {!isCollapsed && (
                  <>
                    <div className="flex-1">
                      <p className={`${typography.textSm} ${typography.fontMedium} ${colors.textPrimary}`}>{user?.role || session?.user?.user_metadata?.role || 'Artist'}</p>
                      <p className={`${typography.textXs} ${colors.textMuted}`}>{user?.email || session?.user?.email || 'User'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThemeSwitcher />
                      <div className={`divider divider-horizontal m-0 before:bg-gold-500/10 after:bg-gold-500/10`}></div>
                      <button 
                        onClick={handleSignOut}
                        className={`btn btn-ghost btn-xs btn-circle ${colors.textSecondary} 
                                         hover:${colors.textPrimary} hover:bg-white/10 group`}
                        title="Sign Out"
                      >
                        <LogOut className={`w-4 h-4 group-hover:scale-110 ${effects.transitionNormal}`} />
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
                    className={`btn btn-ghost btn-xs btn-circle ${colors.textSecondary} 
                                     hover:${colors.textPrimary} hover:bg-white/10`}
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
      <main className="w-full lg:flex-1 bg-gradient-to-b from-obsidian via-obsidian/95 to-obsidian overflow-x-hidden">
        <div className="min-h-screen">
          {/* Top Bar */}
          <div className={`bg-obsidian/50 backdrop-blur-xl border-b ${colors.borderSubtle} px-4 lg:px-8 py-5`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className={`lg:hidden p-2 ${colors.textSecondary} hover:${colors.textPrimary} ${effects.transitionNormal}`}
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
                <button className={`hidden sm:flex ${components.button.base} ${components.button.sizes.small} ${components.button.variants.ghost} 
                                 border ${colors.borderSubtle} hover:${colors.borderDefault} ${typography.trackingWide} uppercase ${typography.textXs} lg:${typography.textSm}`}>
                  Quick Add
                </button>
                <button className={`${components.button.base} ${components.button.sizes.small} ${components.button.variants.primary} 
                                 shadow-elegant ${typography.trackingWide} uppercase ${typography.textXs} lg:${typography.textSm}`}>
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
