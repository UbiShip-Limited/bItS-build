import { format } from 'date-fns';
import { TattooRequest } from '../../lib/api/services/tattooRequestApiClient';

interface TattooRequestsTableProps {
  requests: TattooRequest[];
}

export default function TattooRequestsTable({ requests }: TattooRequestsTableProps) {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      new: 'bg-[#C9A449]/20 text-[#C9A449] border-[#C9A449]/30',
      reviewed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      approved: 'bg-green-500/20 text-green-400 border-green-500/30',
      rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return statusConfig[status as keyof typeof statusConfig] || 'bg-gray-500/20 text-gray-400';
  };

  return (
    <div className="overflow-hidden rounded-xl">
      <table className="w-full">
        <thead>
          <tr>
            <th className="bg-[#080808] text-gray-400 px-5 py-3.5 text-left font-medium text-sm uppercase tracking-wider">Client</th>
            <th className="bg-[#080808] text-gray-400 px-5 py-3.5 text-left font-medium text-sm uppercase tracking-wider">Design</th>
            <th className="bg-[#080808] text-gray-400 px-5 py-3.5 text-left font-medium text-sm uppercase tracking-wider">Date</th>
            <th className="bg-[#080808] text-gray-400 px-5 py-3.5 text-left font-medium text-sm uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1a1a1a]">
          {requests.length === 0 ? (
            <tr>
              <td colSpan={4} className="text-center py-8 text-gray-500 bg-[#0a0a0a]">
                No new tattoo requests
              </td>
            </tr>
          ) : (
            requests.map((request, index) => (
              <tr key={request.id} className="transition-colors hover:bg-[#1a1a1a]/50">
                <td className="px-5 py-4 text-white font-medium">
                  {request.customer?.name || 'Anonymous'}
                </td>
                <td className="px-5 py-4 text-gray-300">{request.description}</td>
                <td className="px-5 py-4 text-gray-300">
                  {format(new Date(request.createdAt), 'MMM dd')}
                </td>
                <td className="px-5 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadge(request.status)}`}>
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