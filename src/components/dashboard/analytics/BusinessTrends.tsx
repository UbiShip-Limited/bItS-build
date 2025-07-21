'use client';

import { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BusinessTrendsProps {
  revenue: Array<{ date: string; amount: number }>;
  appointments: Array<{ date: string; count: number }>;
  customers: Array<{ date: string; count: number }>;
}

export default function BusinessTrends({ revenue, appointments, customers }: BusinessTrendsProps) {
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'appointments' | 'customers'>('revenue');

  const getChartData = () => {
    const data = selectedMetric === 'revenue' ? revenue : 
                 selectedMetric === 'appointments' ? appointments : customers;

    const labels = data.map(d => 
      new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    );

    const values = selectedMetric === 'revenue' 
      ? data.map(d => d.amount)
      : data.map(d => d.count);

    return {
      labels,
      datasets: [
        {
          label: selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1),
          data: values,
          borderColor: '#C9A449',
          backgroundColor: 'rgba(201, 164, 73, 0.1)',
          tension: 0.4,
          fill: true,
        }
      ]
    };
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
          label: (context: any) => {
            if (selectedMetric === 'revenue') {
              return `$${context.parsed.y.toFixed(2)}`;
            }
            return `${context.parsed.y} ${selectedMetric}`;
          }
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
          callback: (value: any) => {
            if (selectedMetric === 'revenue') {
              return `$${value}`;
            }
            return value;
          }
        }
      }
    }
  };

  // Calculate trend
  const calculateTrend = (data: any[]) => {
    if (data.length < 2) return { trend: 'stable', percentage: 0 };
    
    const recentValue = selectedMetric === 'revenue' ? data[data.length - 1].amount : data[data.length - 1].count;
    const previousValue = selectedMetric === 'revenue' ? data[data.length - 2].amount : data[data.length - 2].count;
    
    const percentage = ((recentValue - previousValue) / previousValue) * 100;
    const trend = percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'stable';
    
    return { trend, percentage: Math.abs(percentage) };
  };

  const currentData = selectedMetric === 'revenue' ? revenue : 
                     selectedMetric === 'appointments' ? appointments : customers;
  const { trend, percentage } = calculateTrend(currentData);

  return (
    <div className="card bg-base-200 border border-[#C9A449]/20">
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Business Trends</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedMetric('revenue')}
              className={`btn btn-sm ${selectedMetric === 'revenue' ? 'btn-primary' : 'btn-ghost'}`}
            >
              Revenue
            </button>
            <button
              onClick={() => setSelectedMetric('appointments')}
              className={`btn btn-sm ${selectedMetric === 'appointments' ? 'btn-primary' : 'btn-ghost'}`}
            >
              Appointments
            </button>
            <button
              onClick={() => setSelectedMetric('customers')}
              className={`btn btn-sm ${selectedMetric === 'customers' ? 'btn-primary' : 'btn-ghost'}`}
            >
              Customers
            </button>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className="mb-4 p-4 bg-base-300 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Current Trend</span>
            <div className={`flex items-center gap-2 ${
              trend === 'up' ? 'text-success' : 
              trend === 'down' ? 'text-error' : 'text-gray-400'
            }`}>
              {trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
               trend === 'down' ? <TrendingDown className="w-4 h-4" /> :
               <Minus className="w-4 h-4" />}
              <span className="font-semibold">{percentage.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <Line data={getChartData()} options={options} />
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <p className="text-xs text-gray-400">Average</p>
            <p className="text-sm font-semibold text-white">
              {selectedMetric === 'revenue' 
                ? `$${(revenue.reduce((sum, d) => sum + d.amount, 0) / revenue.length).toFixed(0)}`
                : selectedMetric === 'appointments'
                ? (appointments.reduce((sum, d) => sum + d.count, 0) / appointments.length).toFixed(0)
                : (customers.reduce((sum, d) => sum + d.count, 0) / customers.length).toFixed(0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Peak</p>
            <p className="text-sm font-semibold text-white">
              {selectedMetric === 'revenue' 
                ? `$${Math.max(...revenue.map(d => d.amount))}`
                : selectedMetric === 'appointments'
                ? Math.max(...appointments.map(d => d.count))
                : Math.max(...customers.map(d => d.count))}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-sm font-semibold text-white">
              {selectedMetric === 'revenue' 
                ? `$${revenue.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}`
                : selectedMetric === 'appointments'
                ? appointments.reduce((sum, d) => sum + d.count, 0).toLocaleString()
                : customers.reduce((sum, d) => sum + d.count, 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}