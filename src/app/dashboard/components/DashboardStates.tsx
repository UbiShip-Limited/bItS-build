'use client';

interface DashboardLoadingProps {
  dataLoading?: boolean;
}

export function DashboardLoading({ dataLoading = false }: DashboardLoadingProps) {
  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="text-center space-y-4">
        <span className="loading loading-spinner loading-lg text-[#C9A449]"></span>
        <p className="text-gray-400 text-lg">
          {dataLoading ? 'Refreshing dashboard...' : 'Loading dashboard...'}
        </p>
      </div>
    </div>
  );
}

interface DashboardErrorProps {
  error: string;
  onRetry: () => void;
}

export function DashboardError({ error, onRetry }: DashboardErrorProps) {
  return (
    <div className="flex items-center justify-center min-h-[600px]">
      <div className="text-center space-y-4 max-w-md">
        <div className="text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-white">Unable to Load Dashboard</h2>
        <p className="text-gray-400">{error}</p>
        <button 
          onClick={onRetry} 
          className="mt-4 bg-[#C9A449] hover:bg-[#B8934A] text-[#080808] px-6 py-3 rounded-lg font-semibold transition-all duration-300 shadow-lg shadow-[#C9A449]/20"
        >
          Try Again
        </button>
      </div>
    </div>
  );
} 