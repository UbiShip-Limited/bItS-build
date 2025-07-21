'use client';

import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Users, UserCheck, Star } from 'lucide-react';

ChartJS.register(ArcElement, Tooltip, Legend);

interface CustomerSegmentationProps {
  segments: {
    new: number;
    returning: number;
    vip: number;
    retentionRate: number;
  };
  retentionRate: number;
}

export default function CustomerSegmentation({ segments }: CustomerSegmentationProps) {
  const total = segments.new + segments.returning + segments.vip;

  const data = {
    labels: ['New Customers', 'Regular Customers', 'VIP Customers'],
    datasets: [
      {
        data: [segments.new, segments.returning, segments.vip],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)', // blue for new
          'rgba(34, 197, 94, 0.8)',  // green for regular
          'rgba(201, 164, 73, 0.8)'  // gold for VIP
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(201, 164, 73, 1)'
        ],
        borderWidth: 1,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          padding: 20,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    }
  };

  const segmentDetails = [
    {
      icon: Users,
      label: 'New',
      count: segments.new,
      description: '< 30 days',
      color: 'text-info'
    },
    {
      icon: UserCheck,
      label: 'Regular',
      count: segments.returning,
      description: '1-3 visits',
      color: 'text-success'
    },
    {
      icon: Star,
      label: 'VIP',
      count: segments.vip,
      description: '4+ visits',
      color: 'text-primary'
    }
  ];

  return (
    <div className="card bg-base-200 border border-[#C9A449]/20">
      <div className="card-body">
        <h3 className="text-lg font-semibold text-white mb-4">Customer Segmentation</h3>
        
        {/* Chart */}
        <div className="h-64 mb-6">
          <Doughnut data={data} options={options} />
        </div>

        {/* Segment Details */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {segmentDetails.map((segment) => (
            <div key={segment.label} className="text-center">
              <div className={`inline-flex p-2 rounded-lg bg-base-300 mb-2 ${segment.color}`}>
                <segment.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-white">{segment.count}</p>
              <p className="text-xs text-gray-400">{segment.label}</p>
              <p className="text-xs text-gray-500">{segment.description}</p>
            </div>
          ))}
        </div>

        {/* Retention Rate */}
        <div className="bg-base-300 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">Customer Retention Rate</span>
            <span className="text-lg font-semibold text-success">
              {segments.retentionRate}%
            </span>
          </div>
          <div className="w-full bg-base-100 rounded-full h-2 mt-2">
            <div 
              className="bg-success h-2 rounded-full transition-all duration-500"
              style={{ width: `${segments.retentionRate}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}