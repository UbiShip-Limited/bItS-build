/**
 * Mock Analytics Data Service
 * Provides sample data for dashboard components during development and testing
 */

export interface MockDashboardMetrics {
  revenue: {
    today: { amount: number; change: number };
    week: { amount: number; change: number };
    month: { amount: number; change: number };
  };
  appointments: {
    today: { count: number; change: number };
    week: { count: number; change: number };
    month: { count: number; change: number };
  };
  customers: {
    total: number;
    new: number;
    returning: number;
  };
  requests: {
    pending: number;
    approved: number;
    converted: number;
  };
}

/**
 * Generate mock dashboard metrics for testing and development
 */
export function generateMockDashboardMetrics(): MockDashboardMetrics {
  const baseRevenue = 1500;
  const baseAppointments = 12;
  
  return {
    revenue: {
      today: { 
        amount: baseRevenue + Math.random() * 500,
        change: (Math.random() - 0.5) * 20
      },
      week: { 
        amount: (baseRevenue + Math.random() * 500) * 7,
        change: (Math.random() - 0.5) * 30
      },
      month: { 
        amount: (baseRevenue + Math.random() * 500) * 30,
        change: (Math.random() - 0.5) * 50
      }
    },
    appointments: {
      today: { 
        count: baseAppointments + Math.floor(Math.random() * 5),
        change: Math.floor((Math.random() - 0.5) * 4)
      },
      week: { 
        count: (baseAppointments + Math.floor(Math.random() * 5)) * 7,
        change: Math.floor((Math.random() - 0.5) * 10)
      },
      month: { 
        count: (baseAppointments + Math.floor(Math.random() * 5)) * 30,
        change: Math.floor((Math.random() - 0.5) * 20)
      }
    },
    customers: {
      total: 150 + Math.floor(Math.random() * 50),
      new: 8 + Math.floor(Math.random() * 5),
      returning: 25 + Math.floor(Math.random() * 10)
    },
    requests: {
      pending: 5 + Math.floor(Math.random() * 8),
      approved: 12 + Math.floor(Math.random() * 6),
      converted: 3 + Math.floor(Math.random() * 4)
    }
  };
}

/**
 * Generate mock revenue data for charts
 */
export function generateMockRevenueData(days: number = 30): Array<{ date: string; amount: number }> {
  const data: Array<{ date: string; amount: number }> = [];
  const baseAmount = 500;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      amount: baseAmount + Math.random() * 1000
    });
  }
  
  return data;
}

/**
 * Generate mock appointment data for charts
 */
export function generateMockAppointmentData(days: number = 30): Array<{ date: string; count: number }> {
  const data: Array<{ date: string; count: number }> = [];
  const baseCount = 8;
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    data.push({
      date: date.toISOString().split('T')[0],
      count: baseCount + Math.floor(Math.random() * 8)
    });
  }
  
  return data;
} 