'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { AppointmentApiClient, BookingStatus } from '@/src/lib/api/services/appointmentApiClient';
import { TattooRequestApiClient, type TattooRequest } from '@/src/lib/api/services/tattooRequestApiClient';
import { apiClient } from '@/src/lib/api/apiClient';

export interface DashboardStats {
  todayAppointments: number;
  weeklyRevenue: number;
  activeCustomers: number;
  pendingRequests: number;
}

export interface ActionableMetrics {
  todayAppointments: {
    total: number;
    completed: number;
    remaining: number;
    nextAppointment?: string;
  };
  requests: {
    newCount: number;
    urgentCount: number;
    totalPending: number;
  };
  revenue: {
    today: number;
    thisWeek: number;
    currency: string;
  };
  actionItems: {
    overdueRequests: number;
    unconfirmedAppointments: number;
    followUpsNeeded: number;
  };
}

export interface Appointment {
  id: string;
  clientName: string;
  date: string;
  time: string;
  service: string;
  status: 'confirmed' | 'pending' | 'completed';
}

export interface RecentCustomer {
  id: string;
  name: string;
  email: string;
  lastVisit: string;
  totalSpent: number;
}

export function useDashboardData(isAuthenticated: boolean, user: any) {
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    todayAppointments: 0,
    weeklyRevenue: 0,
    activeCustomers: 0,
    pendingRequests: 0,
  });
  const [actionableMetrics, setActionableMetrics] = useState<ActionableMetrics | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [customers, setCustomers] = useState<RecentCustomer[]>([]);
  const [requests, setRequests] = useState<TattooRequest[]>([]);

  // Use a ref to track loading state to prevent dependency issues
  const dataLoadingRef = useRef(false);

  // Memoize the clients to prevent recreation on every render
  const appointmentClient = useMemo(() => new AppointmentApiClient(apiClient), []);
  const tattooRequestClient = useMemo(() => new TattooRequestApiClient(apiClient), []);

  const loadDashboardData = useCallback(async () => {
    // Prevent concurrent loads using ref instead of state
    if (dataLoadingRef.current) {
      console.log('⏳ Data already loading, skipping...');
      return;
    }

    console.log('📊 Starting optimized dashboard data load...');
    dataLoadingRef.current = true;
    setDataLoading(true);
    setLoading(true);
    setError(null);
    
    if (!isAuthenticated || !user) {
      console.log('❌ Cannot load dashboard data: not authenticated');
      setError('Authentication required');
      setLoading(false);
      setDataLoading(false);
      dataLoadingRef.current = false;
      return;
    }
    
    try {
      // Calculate all date ranges once
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endOfToday = new Date(startOfToday);
      endOfToday.setDate(endOfToday.getDate() + 1);
      
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);

      console.log('📅 Making optimized API calls...');
      
      // OPTIMIZED: Make only 3 main API calls instead of 15+
      const [
        // 1. Get ALL appointments for the month (completed + scheduled)
        monthlyAppointments,
        
        // 2. Get tattoo requests
        requestsResponse,
        
        // 3. Get upcoming appointments
        upcomingAppointments
      ] = await Promise.all([
        // Single call for all monthly appointments
        appointmentClient.getAppointments({
          from: startOfMonth.toISOString(),
          to: nextWeek.toISOString() // Get through next week
        }),
        
        // Single call for tattoo requests
        tattooRequestClient.getAll({
          status: 'new',
          limit: 10
        }),
        
        // Single call for upcoming scheduled appointments
        appointmentClient.getAppointments({
          from: now.toISOString(),
          to: nextWeek.toISOString(),
          status: BookingStatus.SCHEDULED
        })
      ]);

      console.log('✅ All API calls completed, processing data...');

      // PROCESS DATA: Extract what we need from the single API calls
      const allAppointments = monthlyAppointments.data;
      
      // Filter appointments by time periods from the single dataset
      const todayAppointments = allAppointments.filter(apt => {
        const aptDate = new Date(apt.startTime);
        return aptDate >= startOfToday && aptDate < endOfToday;
      });
      
      const completedToday = todayAppointments.filter(apt => apt.status === BookingStatus.COMPLETED);
      const remainingToday = todayAppointments.filter(apt => 
        apt.status !== BookingStatus.CANCELLED && 
        apt.status !== BookingStatus.COMPLETED &&
        apt.status !== BookingStatus.NO_SHOW
      );
      
      const completedThisWeek = allAppointments.filter(apt => {
        const aptDate = new Date(apt.startTime);
        return aptDate >= startOfWeek && 
               aptDate <= now && 
               apt.status === BookingStatus.COMPLETED;
      });
      
      const completedThisMonth = allAppointments.filter(apt => {
        const aptDate = new Date(apt.startTime);
        return aptDate >= startOfMonth && 
               aptDate <= now && 
               apt.status === BookingStatus.COMPLETED;
      });

      // Find next appointment
      const nextAppointment = remainingToday
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];
      
      // Calculate revenue
      const todayRevenue = completedToday.reduce((sum, apt) => sum + (apt.priceQuote || 0), 0);
      const weekRevenue = completedThisWeek.reduce((sum, apt) => sum + (apt.priceQuote || 0), 0);
      const monthlyRevenue = completedThisMonth.reduce((sum, apt) => sum + (apt.priceQuote || 0), 0);
      
      // Build actionable metrics
      const newActionableMetrics: ActionableMetrics = {
        todayAppointments: {
          total: todayAppointments.length,
          completed: completedToday.length,
          remaining: remainingToday.length,
          nextAppointment: nextAppointment ? format(new Date(nextAppointment.startTime), 'h:mm a') : undefined
        },
        requests: {
          newCount: requestsResponse.data.length,
          urgentCount: 0, // Could be enhanced with urgency logic
          totalPending: requestsResponse.pagination.total
        },
        revenue: {
          today: todayRevenue,
          thisWeek: weekRevenue,
          currency: '$'
        },
        actionItems: {
          overdueRequests: 0, // Could be enhanced with date analysis
          unconfirmedAppointments: remainingToday.filter(apt => apt.status === BookingStatus.PENDING).length,
          followUpsNeeded: 0 // Could be enhanced with follow-up logic
        }
      };
      
      setActionableMetrics(newActionableMetrics);
      
      // Set basic stats for fallback
      setStats({
        todayAppointments: upcomingAppointments.data.length,
        weeklyRevenue: monthlyRevenue,
        activeCustomers: completedThisMonth.length,
        pendingRequests: requestsResponse.pagination.total,
      });

      // Format recent appointments for display
      const recentAppointments = upcomingAppointments.data.slice(0, 3);
      const formattedAppointments = recentAppointments.map((appointment) => ({
        id: appointment.id,
        clientName: appointment.customer?.name || 'Anonymous',
        date: format(new Date(appointment.startTime), 'MMM dd'),
        time: format(new Date(appointment.startTime), 'h:mm a'),
        service: appointment.type.replace('_', ' '),
        status: appointment.status as 'confirmed' | 'pending' | 'completed'
      }));

      // Build customer map from completed appointments
      const customerMap = new Map<string, RecentCustomer>();
      completedThisMonth.forEach((apt) => {
        if (apt.customer?.id) {
          const existing = customerMap.get(apt.customer.id);
          if (!existing) {
            customerMap.set(apt.customer.id, {
              id: apt.customer.id,
              name: apt.customer.name || 'Anonymous',
              email: apt.customer.email || 'N/A',
              lastVisit: apt.startTime,
              totalSpent: apt.priceQuote || 0
            });
          } else {
            existing.totalSpent += apt.priceQuote || 0;
            if (new Date(apt.startTime) > new Date(existing.lastVisit)) {
              existing.lastVisit = apt.startTime;
            }
          }
        }
      });
      
      const formattedCustomers = Array.from(customerMap.values())
        .sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime())
        .slice(0, 2);

      // Set all data
      setAppointments(formattedAppointments);
      setCustomers(formattedCustomers);
      setRequests(requestsResponse.data.slice(0, 3));
      
      console.log('🎉 Dashboard data loaded successfully!');
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setDataLoading(false);
      dataLoadingRef.current = false;
    }
  }, [isAuthenticated, user, appointmentClient, tattooRequestClient]);

  const handleRefreshMetrics = useCallback(async () => {
    if (dataLoadingRef.current) {
      console.log('⏳ Refresh already in progress, skipping...');
      return;
    }
    await loadDashboardData();
  }, [loadDashboardData]);

  return {
    // State
    loading,
    dataLoading,
    error,
    stats,
    actionableMetrics,
    appointments,
    customers,
    requests,
    
    // Actions
    loadDashboardData,
    handleRefreshMetrics
  };
} 