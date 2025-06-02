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
      confirmed: 'bg-green-500/20 text-green-400 border-green-500/30',
      pending: 'bg-[#C9A449]/20 text-[#C9A449] border-[#C9A449]/30',
      completed: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    return statusConfig[status as keyof typeof statusConfig] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="overflow-hidden rounded-xl">
      <table className="w-full">
        <thead>
          <tr>
            <th className="bg-[#080808] text-gray-400 px-5 py-3.5 text-left font-medium text-sm uppercase tracking-wider">Time</th>
            <th className="bg-[#080808] text-gray-400 px-5 py-3.5 text-left font-medium text-sm uppercase tracking-wider">Client</th>
            <th className="bg-[#080808] text-gray-400 px-5 py-3.5 text-left font-medium text-sm uppercase tracking-wider">Service</th>
            <th className="bg-[#080808] text-gray-400 px-5 py-3.5 text-left font-medium text-sm uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1a1a1a]">
          {appointments.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-8 text-gray-500 bg-[#0a0a0a]">
                No appointments scheduled for today
              </td>
            </tr>
          ) : (
            appointments.map((appointment, index) => (
              <tr key={appointment.id} className="transition-colors hover:bg-[#1a1a1a]/50">
                <td className="px-5 py-4 text-white font-medium">{appointment.time}</td>
                <td className="px-5 py-4 text-gray-300">{appointment.clientName}</td>
                <td className="px-5 py-4 text-gray-300">{appointment.service}</td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(appointment.status)}`}>
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