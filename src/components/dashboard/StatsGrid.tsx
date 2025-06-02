interface StatsGridProps {
  stats: {
    todayAppointments: number;
    weeklyRevenue: number;
    activeCustomers: number;
    pendingRequests: number;
  };
}

export default function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Today's Appointments */}
      <div className="group">
        <div className="stat bg-[#E8EAED] rounded-2xl p-6 border border-[#DADCE0] shadow-[0_2px_12px_rgba(32,33,36,0.08)] transition-all duration-300 hover:border-[#9AA0A6] hover:shadow-[0_8px_24px_rgba(32,33,36,0.12)] hover:transform hover:-translate-y-[2px] hover:bg-gradient-to-br hover:from-[#E8EAED] hover:to-[#F1F3F4]">
          <div className="stat-figure text-[#5F6368] opacity-80 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </div>
          <div className="stat-title text-[#5F6368] text-sm font-medium mb-2">Today's Appointments</div>
          <div className="stat-value text-[#171717] text-3xl font-bold mb-2">{stats.todayAppointments}</div>
          <div className="stat-desc text-[#9AA0A6] text-sm">↗︎ 2 more than yesterday</div>
        </div>
      </div>

      {/* Weekly Revenue */}
      <div className="group">
        <div className="stat bg-[#E8EAED] rounded-2xl p-6 border border-[#DADCE0] shadow-[0_2px_12px_rgba(32,33,36,0.08)] transition-all duration-300 hover:border-[#9AA0A6] hover:shadow-[0_8px_24px_rgba(32,33,36,0.12)] hover:transform hover:-translate-y-[2px] hover:bg-gradient-to-br hover:from-[#E8EAED] hover:to-[#F1F3F4]">
          <div className="stat-figure text-[#5F6368] opacity-80 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div className="stat-title text-[#5F6368] text-sm font-medium mb-2">Monthly Revenue</div>
          <div className="stat-value text-[#171717] text-3xl font-bold mb-2">${stats.weeklyRevenue.toLocaleString()}</div>
          <div className="stat-desc text-[#9AA0A6] text-sm">↗︎ 12% from last month</div>
        </div>
      </div>

      {/* Active Customers */}
      <div className="group">
        <div className="stat bg-[#E8EAED] rounded-2xl p-6 border border-[#DADCE0] shadow-[0_2px_12px_rgba(32,33,36,0.08)] transition-all duration-300 hover:border-[#9AA0A6] hover:shadow-[0_8px_24px_rgba(32,33,36,0.12)] hover:transform hover:-translate-y-[2px] hover:bg-gradient-to-br hover:from-[#E8EAED] hover:to-[#F1F3F4]">
          <div className="stat-figure text-[#5F6368] opacity-80 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
          </div>
          <div className="stat-title text-[#5F6368] text-sm font-medium mb-2">Completed Appointments</div>
          <div className="stat-value text-[#171717] text-3xl font-bold mb-2">{stats.activeCustomers}</div>
          <div className="stat-desc text-[#9AA0A6] text-sm">This month</div>
        </div>
      </div>

      {/* Pending Requests */}
      <div className="group">
        <div className="stat bg-[#E8EAED] rounded-2xl p-6 border border-[#DADCE0] shadow-[0_2px_12px_rgba(32,33,36,0.08)] transition-all duration-300 hover:border-[#9AA0A6] hover:shadow-[0_8px_24px_rgba(32,33,36,0.12)] hover:transform hover:-translate-y-[2px] hover:bg-gradient-to-br hover:from-[#E8EAED] hover:to-[#F1F3F4]">
          <div className="stat-figure text-[#5F6368] opacity-80 group-hover:opacity-100 transition-opacity">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-8 h-8 stroke-current">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
            </svg>
          </div>
          <div className="stat-title text-[#5F6368] text-sm font-medium mb-2">Pending Requests</div>
          <div className="stat-value text-[#171717] text-3xl font-bold mb-2">{stats.pendingRequests}</div>
          <div className="stat-desc text-[#9AA0A6] text-sm">↘︎ 2 reviewed today</div>
        </div>
      </div>
    </div>
  );
} 