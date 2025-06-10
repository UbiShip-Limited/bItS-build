'use client';

import Link from 'next/link';
import AppointmentsTable from '@/src/components/dashboard/AppointmentsTable';
import TattooRequestsTable from '@/src/components/dashboard/TattooRequestsTable';
import CustomersTable from '@/src/components/dashboard/CustomersTable';
import { Appointment, RecentCustomer } from '../hooks/useDashboardData';
import { TattooRequest } from '@/src/lib/api/services/tattooRequestApiClient';

interface DashboardContentProps {
  appointments: Appointment[];
  requests: TattooRequest[];
  customers: RecentCustomer[];
}

export function DashboardContent({ appointments, requests, customers }: DashboardContentProps) {
  return (
    <div className="space-y-8">
      {/* Row 1: Appointments and Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Appointments Card */}
        <div className="bg-[#111111] border border-[#C9A449]/20 rounded-2xl p-6 transition-all duration-300 hover:border-[#C9A449]/30 backdrop-blur-sm">
          <div className="mb-5 pb-4 border-b border-[#1a1a1a]">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Today's Appointments</h2>
              <Link 
                href="/dashboard/appointments" 
                className="text-sm text-[#C9A449] font-medium transition-all duration-200 hover:text-[#E5B563] group flex items-center gap-1"
              >
                View details 
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>
          </div>
          <div>
            <AppointmentsTable appointments={appointments} />
          </div>
        </div>

        {/* Recent Tattoo Requests Card */}
        <div className="bg-[#111111] border border-[#C9A449]/20 rounded-2xl p-6 transition-all duration-300 hover:border-[#C9A449]/30 backdrop-blur-sm">
          <div className="mb-5 pb-4 border-b border-[#1a1a1a]">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">Recent Tattoo Requests</h2>
              <Link 
                href="/dashboard/tattoo-request" 
                className="text-sm text-[#C9A449] font-medium transition-all duration-200 hover:text-[#E5B563] group flex items-center gap-1"
              >
                View details 
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </Link>
            </div>
          </div>
          <div>
            <TattooRequestsTable requests={requests} />
          </div>
        </div>
      </div>

      {/* Row 2: Recent Customers - Full Width */}
      <div className="bg-[#111111] border border-[#C9A449]/20 rounded-2xl p-6 transition-all duration-300 hover:border-[#C9A449]/30 backdrop-blur-sm">
        <div className="mb-5 pb-4 border-b border-[#1a1a1a]">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Recent Customers</h2>
            <Link 
              href="/dashboard/customers" 
              className="text-sm text-[#C9A449] font-medium transition-all duration-200 hover:text-[#E5B563] group flex items-center gap-1"
            >
              View details 
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>
        </div>
        <div>
          <CustomersTable customers={customers} />
        </div>
      </div>
    </div>
  );
} 