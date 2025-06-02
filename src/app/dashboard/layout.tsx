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
    <div className="flex min-h-screen bg-smoke-50">
      {/* Sidebar */}
      <aside className={`
        ${isCollapsed ? 'w-20' : 'w-64'} 
         shadow-2xl border-r border-smoke-700 
        backdrop-blur-sm transition-all duration-300 ease-in-out
        relative flex flex-col
      `}>
        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 z-10 w-6 h-6 bg-smoke-700 rounded-full 
                     flex items-center justify-center shadow-lg hover:bg-smoke-600 
                     transition-all duration-200 group"
        >
          <ChevronLeft className={`w-3 h-3 text-smoke-200 transition-transform duration-200 
                                  ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>

        <div className="flex flex-col h-full">
          {/* Brand Header */}
          <div className="p-6 border-b border-smoke-700 bg-gradient-to-br from-smoke-800 to-smoke-900">
            <div className={`transition-all duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
              <h1 className="text-xl font-bold text-smoke-50 tracking-tight">
                Bowen Island Tattoo
              </h1>
              <p className="text-sm text-smoke-400 mt-1">
                Admin Dashboard
              </p>
            </div>
            {isCollapsed && (
              <div className="text-2xl font-bold text-smoke-50 text-center">B</div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href, item.exact);
                
                return (
                  <li key={item.href}>
                    <Link 
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl text-smoke-300 
                        transition-all duration-200 group relative overflow-hidden
                        ${active 
                          ? 'bg-gradient-to-r from-smoke-600 to-smoke-700 text-smoke-50 shadow-lg' 
                          : 'hover:bg-white/10 hover:text-smoke-50 hover:translate-x-1'
                        }
                      `}
                    >
                      {/* Active indicator */}
                      {active && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-smoke-50"></div>
                      )}
                      
                      {/* Icon */}
                      <div className={`relative ${active ? 'text-smoke-50' : ''}`}>
                        <Icon className={`w-5 h-5 transition-all duration-200 
                                       ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
                      </div>
                      
                      {/* Label */}
                      {!isCollapsed && (
                        <span className={`font-medium transition-all duration-200 
                                       ${active ? 'text-smoke-50' : ''}`}>
                          {item.label}
                        </span>
                      )}
                      
                      {/* Badge */}
                      {item.badge && !isCollapsed && (
                        <span className={`ml-auto badge badge-sm ${item.badgeColor || 'badge-primary'} 
                                        ${active ? 'badge-outline' : ''}`}>
                          {item.badge}
                        </span>
                      )}
                      
                      {/* Collapsed badge */}
                      {item.badge && isCollapsed && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-warning rounded-full"></span>
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
            <div className="px-4 py-3 border-t border-smoke-700">
              <button className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl
                text-smoke-300 hover:bg-white/10 hover:text-smoke-50
                transition-all duration-200 group
              `}>
                <Bell className="w-5 h-5 group-hover:scale-110 transition-transform" />
                {!isCollapsed && (
                  <>
                    <span className="font-medium">Notifications</span>
                    <span className="ml-auto badge badge-error badge-sm">2</span>
                  </>
                )}
                {isCollapsed && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-error rounded-full"></span>
                )}
              </button>
            </div>

            {/* User Section */}
            <div className="p-4 border-t border-smoke-700 bg-gradient-to-t from-smoke-900 to-transparent">
              <div className={`
                flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 
                transition-all duration-200 cursor-pointer group
                ${isCollapsed ? 'justify-center' : ''}
              `}>
                <div className="avatar placeholder">
                  <div className="bg-smoke-600 text-smoke-100 rounded-full w-10 
                                ring-2 ring-smoke-700 group-hover:ring-smoke-500 transition-all">
                    <span className="text-sm font-bold">AD</span>
                  </div>
                </div>
                
                {!isCollapsed && (
                  <>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-smoke-100">Admin User</p>
                      <p className="text-xs text-smoke-400">admin@bowentattoo.com</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <ThemeSwitcher />
                      <div className="divider divider-horizontal m-0 before:bg-smoke-700 after:bg-smoke-700"></div>
                      <button className="btn btn-ghost btn-xs btn-circle text-smoke-300 
                                       hover:text-smoke-50 hover:bg-white/10 group">
                        <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              {isCollapsed && (
                <div className="mt-2 flex justify-center gap-2">
                  <ThemeSwitcher />
                  <button className="btn btn-ghost btn-xs btn-circle text-smoke-300 
                                   hover:text-smoke-50 hover:bg-white/10">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-smoke-50 overflow-x-hidden">
        <div className="min-h-screen">
          {/* Top Bar */}
          <div className="bg-white/50 backdrop-blur-sm border-b border-smoke-200 px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-smoke-900">
                  {navItems.find(item => isActive(item.href, item.exact))?.label || 'Dashboard'}
                </h2>
                <p className="text-sm text-smoke-500 mt-1">
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
                <button className="btn btn-sm btn-ghost text-smoke-600 hover:text-smoke-900">
                  Quick Add
                </button>
                <button className="btn btn-sm btn-primary">
                  New Appointment
                </button>
              </div>
            </div>
          </div>
          
          {/* Page Content */}
          <div className="animate-fadeIn">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
