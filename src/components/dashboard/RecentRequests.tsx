import Link from 'next/link';
import { getTimeAgo } from '@/src/lib/utils/dateFormatters';
import { getStatusColor } from '@/src/lib/utils/statusHelpers';

interface TattooRequest {
  id: string;
  placement: string;
  style?: string;
  status: string;
  createdAt: string;
}

interface RecentRequestsProps {
  requests: TattooRequest[];
}

export function RecentRequests({ requests }: RecentRequestsProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Recent Requests</h2>
        <Link href="/dashboard/tattoo-request" className="text-blue-600 text-sm hover:underline">
          View All
        </Link>
      </div>
      <div className="space-y-4">
        {requests.length === 0 ? (
          <p className="text-gray-500 text-sm">No new requests</p>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="border-b pb-3 last:border-0">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">Request #{request.id.slice(0, 8)}</p>
                  <p className="text-sm text-gray-500">
                    {request.placement}, {request.style || 'No style specified'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{getTimeAgo(request.createdAt)}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(request.status)}`}>
                    {request.status}
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