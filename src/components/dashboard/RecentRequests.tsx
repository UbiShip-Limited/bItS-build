import { format } from 'date-fns';
import Link from 'next/link';

interface TattooRequest {
  id: string;
  clientName: string;
  style: string;
  size: string;
  placement: string;
  createdAt: string;
  status: 'new' | 'reviewing' | 'quoted' | 'approved';
}

interface RecentRequestsProps {
  requests: TattooRequest[];
}

export default function RecentRequests({ requests }: RecentRequestsProps) {
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
    <div className="card bg-smoke-100 shadow-smoke hover:shadow-smoke-lg transition-all duration-300 border border-smoke-200">
      <div className="card-body">
        <h2 className="card-title flex justify-between items-center text-smoke-900">
          <span>Recent Tattoo Requests</span>
          <Link href="/dashboard/tattoo-request" className="btn btn-ghost btn-sm text-smoke-600 hover:text-smoke-900 hover:bg-smoke-200">
            View All →
          </Link>
        </h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="border-smoke-300">
                <th className="bg-gradient-to-r from-smoke-800 to-smoke-900 text-smoke-50">Client</th>
                <th className="bg-gradient-to-r from-smoke-800 to-smoke-900 text-smoke-50">Style</th>
                <th className="bg-gradient-to-r from-smoke-800 to-smoke-900 text-smoke-50">Details</th>
                <th className="bg-gradient-to-r from-smoke-800 to-smoke-900 text-smoke-50">Status</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-smoke-50 transition-colors border-smoke-200">
                  <td className="font-medium text-smoke-700">{request.clientName}</td>
                  <td className="text-smoke-600">{request.style}</td>
                  <td className="text-smoke-600">
                    <div className="text-sm">{request.size} • {request.placement}</div>
                    <div className="text-xs text-smoke-500">{format(new Date(request.createdAt), 'MMM dd')}</div>
                  </td>
                  <td>
                    <span className={`badge ${getStatusBadge(request.status)} badge-sm`}>
                      {request.status}
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