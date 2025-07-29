'use client';

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
    <div className="space-y-6">
      {/* Row 1: Appointments and Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111111] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Today's Appointments</h3>
            <a href="/dashboard/appointments" className="text-sm text-[#C9A449] hover:text-[#B8934A]">
              View all →
            </a>
          </div>
          <AppointmentsTable appointments={appointments} />
        </div>

        <div className="bg-[#111111] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Recent Tattoo Requests</h3>
            <a href="/dashboard/tattoo-request" className="text-sm text-[#C9A449] hover:text-[#B8934A]">
              View all →
            </a>
          </div>
          <TattooRequestsTable requests={requests} />
        </div>
      </div>

      {/* Row 2: Recent Customers - Full Width */}
      <div className="bg-[#111111] rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Customers</h3>
          <a href="/dashboard/customers" className="text-sm text-[#C9A449] hover:text-[#B8934A]">
            View all →
          </a>
        </div>
        <CustomersTable customers={customers} />
      </div>
    </div>
  );
} 