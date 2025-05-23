import Link from 'next/link';

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Welcome to your tattoo shop admin dashboard</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <SummaryCard 
          title="Appointments" 
          value="24" 
          description="Upcoming appointments" 
          linkHref="/dashboard/appointments"
          icon="📅"
        />
        <SummaryCard 
          title="New Requests" 
          value="12" 
          description="Pending tattoo requests" 
          linkHref="/dashboard/tattoo-request"
          icon="🖌️"
        />
        <SummaryCard 
          title="Messages" 
          value="18" 
          description="Unread messages" 
          linkHref="/dashboard/communications"
          icon="💬"
        />
        <SummaryCard 
          title="Revenue" 
          value="$3,250" 
          description="This month" 
          linkHref="/dashboard/settings"
          icon="💰"
        />
      </div>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Appointments */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Appointments</h2>
            <Link href="/dashboard/appointments" className="text-blue-600 text-sm hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b pb-3 last:border-0">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">Client Name {i}</p>
                    <p className="text-sm text-gray-500">Tattoo Session</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-500">Today, 2:00 PM</p>
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                      Confirmed
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Tattoo Requests */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Requests</h2>
            <Link href="/dashboard/tattoo-request" className="text-blue-600 text-sm hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-b pb-3 last:border-0">
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">Request #{i}</p>
                    <p className="text-sm text-gray-500">Arm tattoo, Traditional style</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">3 days ago</p>
                    <span className="inline-block px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Communications */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Messages</h2>
            <Link href="/dashboard/communications" className="text-blue-600 text-sm hover:underline">
              View All
            </Link>
          </div>
          <div className="space-y-4">
            <div className="border-b pb-3">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">Sarah Johnson</p>
                  <p className="text-sm text-gray-500">Via Facebook Messenger</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">2h ago</p>
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    <span className="mr-1">📘</span>FB
                  </span>
                </div>
              </div>
            </div>
            <div className="border-b pb-3">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">Mike Taylor</p>
                  <p className="text-sm text-gray-500">Via Instagram DM</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">5h ago</p>
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                    <span className="mr-1">📸</span>IG
                  </span>
                </div>
              </div>
            </div>
            <div className="border-b pb-3 last:border-0">
              <div className="flex justify-between">
                <div>
                  <p className="font-medium">Lisa Chen</p>
                  <p className="text-sm text-gray-500">Via WhatsApp</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">Yesterday</p>
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                    <span className="mr-1">📱</span>WA
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Summary Card Component
function SummaryCard({ 
  title, 
  value, 
  description, 
  linkHref, 
  icon 
}: { 
  title: string; 
  value: string; 
  description: string; 
  linkHref: string;
  icon: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-700">{title}</h3>
        <span className="text-2xl">{icon}</span>
      </div>
      <div className="mb-2">
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <Link href={linkHref} className="text-sm text-blue-600 hover:underline">
        View details →
      </Link>
    </div>
  );
}
