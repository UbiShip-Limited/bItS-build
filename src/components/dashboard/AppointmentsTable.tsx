interface Appointment {
  id: string;
  clientName: string;
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
      confirmed: 'badge-success',
      pending: 'badge-warning',
      completed: 'badge-info',
    };
    return statusConfig[status as keyof typeof statusConfig] || 'badge-ghost';
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#D2D4D7] shadow-[0_4px_16px_rgba(32,33,36,0.08)]">
      <table className="w-full">
        <thead>
          <tr>
            <th className="bg-gradient-to-r from-[#202124] to-[#171717] text-[#F7F8FA] px-5 py-4 text-left font-semibold text-sm border-b border-[#3C4043]">Time</th>
            <th className="bg-gradient-to-r from-[#202124] to-[#171717] text-[#F7F8FA] px-5 py-4 text-left font-semibold text-sm border-b border-[#3C4043]">Client</th>
            <th className="bg-gradient-to-r from-[#202124] to-[#171717] text-[#F7F8FA] px-5 py-4 text-left font-semibold text-sm border-b border-[#3C4043]">Service</th>
            <th className="bg-gradient-to-r from-[#202124] to-[#171717] text-[#F7F8FA] px-5 py-4 text-left font-semibold text-sm border-b border-[#3C4043]">Status</th>
          </tr>
        </thead>
        <tbody>
          {appointments.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-8 text-[#9AA0A6] bg-[#E8EAED]">
                No appointments scheduled for today
              </td>
            </tr>
          ) : (
            appointments.map((appointment, index) => (
              <tr key={appointment.id} className="transition-colors hover:bg-[#F1F3F4]">
                <td className="px-5 py-4 text-[#3C4043] font-medium bg-[#E8EAED] border-b border-[#D2D4D7]">{appointment.time}</td>
                <td className="px-5 py-4 text-[#3C4043] bg-[#E8EAED] border-b border-[#D2D4D7]">{appointment.clientName}</td>
                <td className="px-5 py-4 text-[#3C4043] bg-[#E8EAED] border-b border-[#D2D4D7]">{appointment.service}</td>
                <td className="px-5 py-4 bg-[#E8EAED] border-b border-[#D2D4D7]">
                  <span className={`badge ${getStatusBadge(appointment.status)} badge-sm font-medium`}>
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