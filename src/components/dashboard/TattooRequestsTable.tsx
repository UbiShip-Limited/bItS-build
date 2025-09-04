import { format } from 'date-fns';
import { TattooRequest } from '../../lib/api/services/tattooRequestApiClient';
import { getTattooRequestDisplayName, getUserTypeBadge } from '../../lib/utils/displayNames';

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
            <th className="bg-[#080808] text-gray-400 px-5 py-3.5 text-left font-medium text-sm uppercase tracking-[0.02em]">Client</th>
            <th className="bg-[#080808] text-gray-400 px-5 py-3.5 text-left font-medium text-sm uppercase tracking-[0.02em]">Design</th>
            <th className="bg-[#080808] text-gray-400 px-5 py-3.5 text-left font-medium text-sm uppercase tracking-[0.02em]">Date</th>
            <th className="bg-[#080808] text-gray-400 px-5 py-3.5 text-left font-medium text-sm uppercase tracking-[0.02em]">Status</th>
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
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="text-white font-medium">
                        {getTattooRequestDisplayName(request)}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {request.customer?.email || request.contactEmail || 'No email'}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {(() => {
                        const badge = getUserTypeBadge(request);
                        return (
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`} title={`${badge.label} user`}>
                            {badge.icon}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <div>
                    <div className="text-gray-300 line-clamp-1">{request.description}</div>
                    <div className="text-gray-500 text-sm">
                      {[request.style, request.placement, request.size].filter(Boolean).join(' • ')}
                    </div>
                  </div>
                </td>
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