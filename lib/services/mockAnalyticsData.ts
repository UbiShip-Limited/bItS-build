/**
 * Mock analytics data for testing the enhanced dashboard
 * This provides realistic test data while we troubleshoot and develop
 */

export function generateMockDashboardMetrics() {
  const now = new Date();
  const randomTrend = () => (Math.random() - 0.5) * 20; // -10% to +10%
  const randomAmount = (base: number) => Math.floor(base + (Math.random() - 0.5) * base * 0.3);

  return {
    revenue: {
      today: {
        amount: randomAmount(450),
        trend: randomTrend(),
        currency: 'USD'
      },
      week: {
        amount: randomAmount(3200),
        trend: randomTrend(),
        target: 3500
      },
      month: {
        amount: randomAmount(12800),
        trend: randomTrend(),
        forecast: 14000
      },
      breakdown: {
        consultations: randomAmount(240),
        tattoos: randomAmount(8500),
        touchups: randomAmount(1200),
        deposits: randomAmount(2800)
      }
    },
    appointments: {
      today: {
        count: Math.floor(Math.random() * 8) + 2,
        completed: Math.floor(Math.random() * 4) + 1,
        remaining: Math.floor(Math.random() * 4) + 1
      },
      week: {
        scheduled: randomAmount(28),
        completed: randomAmount(22),
        cancelled: Math.floor(Math.random() * 3)
      },
      metrics: {
        averageDuration: randomAmount(120),
        conversionRate: 75 + Math.random() * 20,
        noShowRate: Math.random() * 8,
        rebookingRate: 10 + Math.random() * 15
      }
    },
    customers: {
      total: randomAmount(156),
      new: {
        today: Math.floor(Math.random() * 3),
        week: Math.floor(Math.random() * 8) + 2,
        month: Math.floor(Math.random() * 25) + 8
      },
      returning: {
        rate: 60 + Math.random() * 25,
        avgTimeBetweenVisits: 45 + Math.random() * 30
      },
      segments: {
        newCustomers: randomAmount(45),
        regularCustomers: randomAmount(78),
        vipCustomers: randomAmount(33)
      },
      lifetime: {
        averageValue: randomAmount(650),
        topSpender: {
          name: "Sarah M.",
          value: randomAmount(2400)
        }
      }
    },
    requests: {
      pending: {
        count: Math.floor(Math.random() * 12) + 3,
        urgent: Math.floor(Math.random() * 3),
        overdue: Math.floor(Math.random() * 2)
      },
      processed: {
        today: Math.floor(Math.random() * 5) + 1,
        week: Math.floor(Math.random() * 15) + 8,
        month: randomAmount(45)
      },
      conversion: {
        rate: 75 + Math.random() * 20,
        averageTimeToConvert: 2.5 + Math.random() * 2,
        topReasons: ['Design complexity', 'Pricing', 'Availability']
      }
    },
    business: {
      efficiency: {
        bookingUtilization: 70 + Math.random() * 25,
        revenuePerHour: randomAmount(85),
        customerSatisfaction: 4.2 + Math.random() * 0.7
      },
      growth: {
        customerGrowthRate: 5 + Math.random() * 15,
        revenueGrowthRate: 8 + Math.random() * 12,
        appointmentGrowthRate: 12 + Math.random() * 18
      }
    },
    _metadata: {
      generatedAt: now.toISOString(),
      isMockData: true,
      dataQuality: 'demo'
    }
  };
}

export function generateMockRealtimeEvent() {
  const eventTypes = [
    'appointment_created',
    'payment_received', 
    'request_submitted',
    'system_alert'
  ];
  
  const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  
  const eventData: Record<string, any> = {
    appointment_created: {
      appointmentId: `apt_${Date.now()}`,
      customerId: `cust_${Math.floor(Math.random() * 1000)}`,
      amount: 150 + Math.random() * 300
    },
    payment_received: {
      paymentId: `pay_${Date.now()}`,
      amount: 50 + Math.random() * 500,
      customerId: `cust_${Math.floor(Math.random() * 1000)}`
    },
    request_submitted: {
      requestId: `req_${Date.now()}`,
      customerId: `cust_${Math.floor(Math.random() * 1000)}`
    },
    system_alert: {
      message: 'System maintenance scheduled for tonight',
      priority: 'medium'
    }
  };

  return {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: eventType,
    data: eventData[eventType],
    timestamp: new Date(),
    priority: Math.random() > 0.8 ? 'high' : 'medium'
  };
} 