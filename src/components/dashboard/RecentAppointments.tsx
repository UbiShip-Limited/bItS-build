import Link from 'next/link';
import { type AppointmentData } from '@/src/lib/api/services/appointmentService';
import { formatDateTime } from '@/src/lib/utils/dateFormatters';
import { getStatusColor } from '@/src/lib/utils/statusHelpers';

interface RecentAppointmentsProps {
  appointments: AppointmentData[];
}

export function RecentAppointments({ appointments }: RecentAppointmentsProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Recent Appointments</h2>
        <Link href="/dashboard/appointments" className="text-blue-600 text-sm hover:underline">
          View All
        </Link>
      </div>
      <div className="space-y-4">
        {appointments.length === 0 ? (
          <p className="text-gray-500 text-sm">No upcoming appointments</p>
        ) : (
          appointments.map((appointment) => (
            <div key={appointment.id} className="border-b pb-3 last:border-0">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">
                    {appointment.customer?.name || 'Anonymous'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {appointment.type.replace('_', ' ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-500">
                    {formatDateTime(appointment.startTime)}
                  </p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(appointment.status)}`}>
                    {appointment.status}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
} 