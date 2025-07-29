import { apiClient } from '../apiClient';

export interface BusinessHours {
  id: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isOpen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SpecialHours {
  id: string;
  date: string;
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BusinessHoursCheck {
  isOpen: boolean;
  hours: {
    openTime: string;
    closeTime: string;
    reason?: string;
  } | null;
  specialHours: boolean;
}

class BusinessHoursService {
  async getBusinessHours(): Promise<{ businessHours: BusinessHours[]; source: string }> {
    const response = await apiClient.get('/business-hours');
    return response as { businessHours: BusinessHours[]; source: string };
  }

  async updateBusinessHours(dayOfWeek: number, hours: Partial<BusinessHours>): Promise<BusinessHours> {
    const response = await apiClient.put(`/business-hours/${dayOfWeek}`, hours);
    return (response as any).businessHours;
  }

  async getSpecialHours(startDate?: string, endDate?: string): Promise<SpecialHours[]> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const response = await apiClient.get(`/business-hours/special?${params.toString()}`);
    return (response as any).specialHours;
  }

  async createSpecialHours(specialHours: Omit<SpecialHours, 'id' | 'createdAt' | 'updatedAt'>): Promise<SpecialHours> {
    const response = await apiClient.post('/business-hours/special', specialHours);
    return (response as any).specialHours;
  }

  async updateSpecialHours(date: string, updates: Partial<SpecialHours>): Promise<SpecialHours> {
    const response = await apiClient.put(`/business-hours/special/${date}`, updates);
    return (response as any).specialHours;
  }

  async deleteSpecialHours(date: string): Promise<void> {
    await apiClient.delete(`/business-hours/special/${date}`);
  }

  async checkBusinessHours(date: string, time?: string): Promise<BusinessHoursCheck> {
    const params = time ? `?time=${time}` : '';
    const response = await apiClient.get(`/business-hours/check/${date}${params}`);
    return response as BusinessHoursCheck;
  }

  getDayName(dayOfWeek: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
  }

  formatTime(time: string): string {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  }
}

export const businessHoursService = new BusinessHoursService();