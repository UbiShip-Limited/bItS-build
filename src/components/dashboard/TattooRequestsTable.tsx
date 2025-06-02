import { format } from 'date-fns';

interface DashboardTattooRequest {
  id: string;
  clientName: string;
  design: string;
  submittedAt: string;
  status: 'new' | 'reviewing' | 'quoted' | 'approved';
}

interface TattooRequestsTableProps {
  requests: DashboardTattooRequest[];
}

export default function TattooRequestsTable({ requests }: TattooRequestsTableProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: 'badge-primary',
      reviewing: 'badge-secondary',
      quoted: 'badge-accent',
      approved: 'badge-success',
    };
    return statusConfig[status as keyof typeof statusConfig] || 'badge-ghost';
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[#D2D4D7] shadow-[0_4px_16px_rgba(32,33,36,0.08)]">
      <table className="w-full">
        <thead>
          <tr>
            <th className="bg-gradient-to-r from-[#202124] to-[#171717] text-[#F7F8FA] px-5 py-4 text-left font-semibold text-sm border-b border-[#3C4043]">Client</th>
            <th className="bg-gradient-to-r from-[#202124] to-[#171717] text-[#F7F8FA] px-5 py-4 text-left font-semibold text-sm border-b border-[#3C4043]">Design</th>
            <th className="bg-gradient-to-r from-[#202124] to-[#171717] text-[#F7F8FA] px-5 py-4 text-left font-semibold text-sm border-b border-[#3C4043]">Date</th>
            <th className="bg-gradient-to-r from-[#202124] to-[#171717] text-[#F7F8FA] px-5 py-4 text-left font-semibold text-sm border-b border-[#3C4043]">Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-8 text-[#9AA0A6] bg-[#E8EAED]">
                No new tattoo requests
              </td>
            </tr>
          ) : (
            requests.map((request, index) => (
              <tr key={request.id} className="transition-colors hover:bg-[#F1F3F4]">
                <td className="px-5 py-4 text-[#3C4043] font-medium bg-[#E8EAED] border-b border-[#D2D4D7]">{request.clientName}</td>
                <td className="px-5 py-4 text-[#3C4043] bg-[#E8EAED] border-b border-[#D2D4D7]">{request.design}</td>
                <td className="px-5 py-4 text-[#3C4043] bg-[#E8EAED] border-b border-[#D2D4D7]">
                  {format(new Date(request.submittedAt), 'MMM dd')}
                </td>
                <td className="px-5 py-4 bg-[#E8EAED] border-b border-[#D2D4D7]">
                  <span className={`badge ${getStatusBadge(request.status)} badge-sm font-medium`}>
                    {request.status}
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