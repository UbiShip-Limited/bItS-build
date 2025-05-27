import { ReactNode } from 'react';
import Link from 'next/link';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md">
        <div className="p-6">
          <h1 className="text-xl font-bold">Bowen Island Tattoo</h1>
          <p className="text-sm text-gray-500">Admin Dashboard</p>
        </div>
        <nav className="mt-6">
          <ul className="space-y-2 px-4">
            <li>
              <Link 
                href="/dashboard" 
                className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <span className="mr-3">📊</span>
                <span>Overview</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/appointments" 
                className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <span className="mr-3">📅</span>
                <span>Appointments</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/customers" 
                className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <span className="mr-3">👥</span>
                <span>Customers</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/tattoo-request" 
                className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <span className="mr-3">🖌️</span>
                <span>Tattoo Requests</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/payments" 
                className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <span className="mr-3">💳</span>
                <span>Payments</span>
              </Link>
            </li>
            <li>
              <Link 
                href="/dashboard/settings" 
                className="flex items-center p-2 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <span className="mr-3">⚙️</span>
                <span>Settings</span>
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        {children}
      </main>
    </div>
  );
}
