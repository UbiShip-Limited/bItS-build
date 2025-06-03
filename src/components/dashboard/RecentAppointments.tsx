import { format } from 'date-fns';
import Link from 'next/link';

interface Appointment {
  id: string;
  clientName: string;
  date: string;
  time: string;
  service: string;
  status: 'confirmed' | 'pending' | 'completed';
}

interface RecentAppointmentsProps {
  appointments: Appointment[];
}

export default function RecentAppointments({ appointments }: RecentAppointmentsProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: 'badge-success',
      pending: 'badge-warning',
      completed: 'badge-info',
    };
    return statusConfig[status as keyof typeof statusConfig] || 'badge-ghost';
  };

  return (
    <div className="card bg-smoke-100 shadow-smoke hover:shadow-smoke-lg transition-all duration-300 border border-smoke-200">
      <div className="card-body">
        <h2 className="card-title flex justify-between items-center text-smoke-900">
          <span>Recent Appointments</span>
          <Link href="/dashboard/appointments" className="btn btn-ghost btn-sm text-smoke-600 hover:text-smoke-900 hover:bg-smoke-200">
            View All →
          </Link>
        </h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="border-smoke-300">
                <th className="bg-gradient-to-r from-smoke-800 to-smoke-900 text-smoke-50">Date</th>
                <th className="bg-gradient-to-r from-smoke-800 to-smoke-900 text-smoke-50">Client</th>
                <th className="bg-gradient-to-r from-smoke-800 to-smoke-900 text-smoke-50">Service</th>
                <th className="bg-gradient-to-r from-smoke-800 to-smoke-900 text-smoke-50">Status</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-smoke-50 transition-colors border-smoke-200">
                  <td className="text-smoke-700">
                    <div className="font-medium">{appointment.date}</div>
                    <div className="text-sm text-smoke-500">{appointment.time}</div>
                  </td>
                  <td className="font-medium text-smoke-700">{appointment.clientName}</td>
                  <td className="text-smoke-600">{appointment.service}</td>
                  <td>
                    <span className={`badge ${getStatusBadge(appointment.status)} badge-sm`}>
                      {appointment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 