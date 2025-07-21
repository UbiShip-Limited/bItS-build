'use client';

import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Calendar, Clock, TrendingUp, XCircle } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AppointmentMetricsProps {
  metrics: {
    today: number;
    thisWeek: number;
    completionRate: number;
    noShowRate: number;
    utilizationRate: number;
  };
  trends: Array<{ date: string; count: number }>;
}

export default function AppointmentMetrics({ metrics, trends }: AppointmentMetricsProps) {
  const chartData = {
    labels: trends.slice(-7).map(d => 
      new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })
    ),
    datasets: [
      {
        label: 'Appointments',
        data: trends.slice(-7).map(d => d.count),
        backgroundColor: 'rgba(34, 197, 94, 0.8)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => `${context.parsed.y} appointments`
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
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
          stepSize: 1
        }
      }
    }
  };

  const metricsData = [
    {
      icon: Calendar,
      label: 'Today',
      value: metrics.today,
      suffix: 'appointments',
      color: 'text-info'
    },
    {
      icon: TrendingUp,
      label: 'Completion Rate',
      value: metrics.completionRate,
      suffix: '%',
      color: 'text-success'
    },
    {
      icon: XCircle,
      label: 'No-Show Rate',
      value: metrics.noShowRate,
      suffix: '%',
      color: 'text-error'
    },
    {
      icon: Clock,
      label: 'Utilization',
      value: metrics.utilizationRate,
      suffix: '%',
      color: 'text-warning'
    }
  ];

  return (
    <div className="card bg-base-200 border border-[#C9A449]/20">
      <div className="card-body">
        <h3 className="text-lg font-semibold text-white mb-4">Appointment Analytics</h3>
        
        {/* Weekly Trend Chart */}
        <div className="h-48 mb-6">
          <Bar data={chartData} options={options} />
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-4">
          {metricsData.map((metric) => (
            <div key={metric.label} className="bg-base-300 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-400 mb-1">{metric.label}</p>
                  <p className="text-xl font-bold text-white">
                    {metric.value}
                    <span className="text-sm text-gray-400 ml-1">{metric.suffix}</span>
                  </p>
                </div>
                <div className={`p-2 rounded-lg bg-base-200 ${metric.color}`}>
                  <metric.icon className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Utilization Indicator */}
        <div className="mt-4 p-4 bg-base-300 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-400">Booking Utilization</span>
            <span className="text-sm font-medium text-white">
              {metrics.utilizationRate}% of available slots
            </span>
          </div>
          <div className="w-full bg-base-100 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                metrics.utilizationRate > 80 ? 'bg-success' :
                metrics.utilizationRate > 60 ? 'bg-warning' : 'bg-info'
              }`}
              style={{ width: `${metrics.utilizationRate}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}