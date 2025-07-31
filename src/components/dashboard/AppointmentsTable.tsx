import { typography, colors, effects, layout, components } from '@/src/lib/styles/globalStyleConstants';

interface Appointment {
  id: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  date: string;
  time: string;
  service: string;
  status: 'confirmed' | 'pending' | 'completed';
}

interface AppointmentsTableProps {
  appointments: Appointment[];
}

export default function AppointmentsTable({ appointments }: AppointmentsTableProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
      pending: `bg-gold-500/20 ${colors.textAccent} ${colors.borderDefault}`,
      completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    return statusConfig[status as keyof typeof statusConfig] || `bg-white/10 ${colors.textSecondary}`;
  };

  return (
    <div className={`overflow-hidden ${components.radius.large}`}>
      <table className="w-full">
        <thead>
          <tr>
            <th className={`bg-obsidian/50 ${colors.textSecondary} px-5 py-3.5 text-left ${typography.fontMedium} ${typography.textSm} uppercase ${typography.trackingWide}`}>Time</th>
            <th className={`bg-obsidian/50 ${colors.textSecondary} px-5 py-3.5 text-left ${typography.fontMedium} ${typography.textSm} uppercase ${typography.trackingWide}`}>Client</th>
            <th className={`bg-obsidian/50 ${colors.textSecondary} px-5 py-3.5 text-left ${typography.fontMedium} ${typography.textSm} uppercase ${typography.trackingWide}`}>Service</th>
            <th className={`bg-obsidian/50 ${colors.textSecondary} px-5 py-3.5 text-left ${typography.fontMedium} ${typography.textSm} uppercase ${typography.trackingWide}`}>Status</th>
          </tr>
        </thead>
        <tbody className={`divide-y divide-gold-500/10`}>
          {appointments.length === 0 ? (
            <tr>
              <td colSpan={4} className={`text-center py-8 ${colors.textMuted} bg-obsidian/30`}>
                No appointments scheduled for today
              </td>
            </tr>
          ) : (
            appointments.map((appointment, index) => (
              <tr key={appointment.id} className={`${effects.transitionNormal} hover:bg-white/5 group`}>
                <td className={`px-5 py-4 ${colors.textPrimary} ${typography.fontMedium}`}>{appointment.time}</td>
                <td className="px-5 py-4">
                  <div>
                    <div className={`${colors.textPrimary} ${typography.fontMedium}`}>{appointment.clientName}</div>
                    {appointment.clientPhone && (
                      <div className={`${colors.textMuted} ${typography.textSm}`}>{appointment.clientPhone}</div>
                    )}
                  </div>
                </td>
                <td className={`px-5 py-4 ${colors.textSecondary}`}>{appointment.service}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full ${typography.textXs} ${typography.fontMedium} border ${getStatusBadge(appointment.status)} ${effects.transitionNormal}`}>
                    {appointment.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
} 