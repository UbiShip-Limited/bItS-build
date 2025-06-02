'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  ChevronLeft
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { 
      href: '/dashboard', 
      icon: LayoutDashboard, 
      label: 'Overview',
      exact: true
    },
    { 
      href: '/dashboard/appointments', 
      icon: Calendar, 
      label: 'Appointments',
      badge: 3
    },
    { 
      href: '/dashboard/customers', 
      icon: Users, 
      label: 'Customers' 
    },
    { 
      href: '/dashboard/tattoo-request', 
      icon: Palette, 
      label: 'Tattoo Requests',
      badge: 5,
      badgeColor: 'badge-warning'
    },
    { 
      href: '/dashboard/payments', 
      icon: CreditCard, 
      label: 'Payments' 
    },
    { 
      href: '/dashboard/settings', 
      icon: Settings, 
      label: 'Settings' 
    },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex min-h-screen bg-base-300">
      {/* Sidebar */}
      <aside className={`
        ${isCollapsed ? 'w-20' : 'w-72'} 
        bg-[#080808] shadow-2xl
        transition-all duration-300 ease-in-out
        relative flex flex-col border-r border-[#1a1a1a]
      `}>
        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-4 top-9 z-10 w-8 h-8 bg-[#080808] border border-[#C9A449]/20
                     rounded-full flex items-center justify-center shadow-xl hover:border-[#C9A449]/40
                     transition-all duration-200 group"
        >
          <ChevronLeft className={`w-4 h-4 text-[#C9A449] transition-transform duration-200 
                                  ${isCollapsed ? 'rotate-180' : ''}`} />
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
            <ul className="space-y-1">
              {navItems.map((item) => {
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
          </nav>

          {/* Bottom Section */}
          <div className="mt-auto">
            {/* Notification Center */}
            <div className="px-3 py-4 border-t border-[#1a1a1a]">
              <button className={`
                w-full flex items-center gap-4 px-4 py-3.5 rounded-lg
                text-gray-400 hover:bg-white/5 hover:text-white
                transition-all duration-200 group
              `}>
                <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {!isCollapsed && (
                  <>
                    <span className="font-medium text-sm">Notifications</span>
                    <span className="ml-auto px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">2</span>
                  </>
                )}
                {isCollapsed && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
                )}
              </button>
            </div>

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
                      <p className="text-sm font-medium text-white">Admin User</p>
                      <p className="text-xs text-gray-500">admin@bowentattoo.com</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThemeSwitcher />
                      <div className="divider divider-horizontal m-0 before:bg-[#1a1a1a] after:bg-[#1a1a1a]"></div>
                      <button className="btn btn-ghost btn-xs btn-circle text-gray-400 
                                       hover:text-white hover:bg-white/10 group">
                        <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              {isCollapsed && (
                <div className="mt-2 flex justify-center gap-2">
                  <ThemeSwitcher />
                  <button className="btn btn-ghost btn-xs btn-circle text-gray-400 
                                   hover:text-white hover:bg-white/10">
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
          <div className="bg-[#080808]/50 backdrop-blur-xl border-b border-[#1a1a1a] px-8 py-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-heading font-bold text-white tracking-wide">
                  {navItems.find(item => isActive(item.href, item.exact))?.label || 'Dashboard'}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              {/* Quick Actions */}
              <div className="flex items-center gap-3">
                <button className="btn btn-ghost btn-sm text-gray-400 hover:text-white 
                                 border border-transparent hover:border-[#C9A449]/20">
                  Quick Add
                </button>
                <button className="btn btn-sm bg-[#C9A449] hover:bg-[#B8934A] text-[#080808] 
                                 border-0 font-medium shadow-lg shadow-[#C9A449]/20">
                  New Appointment
                </button>
              </div>
            </div>
          </div>
          
          {/* Page Content */}
          <div className="animate-fadeIn p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
