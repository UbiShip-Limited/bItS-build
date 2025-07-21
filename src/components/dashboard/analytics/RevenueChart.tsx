'use client';

import { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RevenueChartProps {
  data: Array<{ date: string; amount: number }>;
  breakdown: Record<string, number>;
}

export default function RevenueChart({ data, breakdown }: RevenueChartProps) {
  const chartData = useMemo(() => {
    return {
      labels: data.map(d => new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [
        {
          label: 'Revenue',
          data: data.map(d => d.amount),
          borderColor: '#C9A449',
          backgroundColor: 'rgba(201, 164, 73, 0.1)',
          tension: 0.4,
          fill: true,
        }
      ]
    };
  }, [data]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `$${context.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)'
        }
      },
      y: {
        grid: {
          color: 'rgba(255, 255, 255, 0.1)'
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.7)',
          callback: (value: any) => `$${value}`
        }
      }
    }
  };

  // Calculate breakdown percentages
  const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);
  const breakdownPercentages = Object.entries(breakdown).map(([key, value]) => ({
    type: key.replace(/([A-Z])/g, ' $1').trim(),
    amount: value,
    percentage: ((value / total) * 100).toFixed(1)
  }));

  return (
    <div className="card bg-base-200 border border-[#C9A449]/20 col-span-full lg:col-span-1">
      <div className="card-body">
        <h3 className="text-lg font-semibold text-white mb-4">Revenue Overview</h3>
        
        {/* Chart */}
        <div className="h-64 mb-6">
          <Line data={chartData} options={options} />
        </div>

        {/* Revenue Breakdown */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-400">Revenue Breakdown</h4>
          {breakdownPercentages.map((item) => (
            <div key={item.type} className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span className="text-sm text-gray-300">{item.type}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-white">
                  ${item.amount.toLocaleString()}
                </span>
                <span className="text-xs text-gray-400 ml-2">
                  ({item.percentage}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}