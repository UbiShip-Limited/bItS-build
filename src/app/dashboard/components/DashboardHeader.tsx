'use client';

export function DashboardHeader() {
  return (
    <div className="mb-8 border border-[#C9A449]/20 bg-gradient-to-r from-[#080808]/80 to-[#0a0a0a]/40 rounded-xl p-6 backdrop-blur-sm">
      <h1 className="text-3xl font-heading font-bold text-white mb-2 tracking-wide">
        Dashboard Overview
      </h1>
      <p className="text-base text-gray-400">
        Welcome back! Here's what's happening at your shop today.
      </p>
    </div>
  );
} 