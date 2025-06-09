export interface DateRange {
  start: Date;
  end: Date;
}

export interface DateInterval {
  start: Date;
  end: Date;
}

/**
 * Utility functions for analytics calculations
 */
export class AnalyticsUtils {
  /**
   * Get date range for different periods
   */
  static getDateRange(period: string, referenceDate: Date): DateRange {
    const date = new Date(referenceDate);
    const start = new Date(date);
    const end = new Date(date);

    switch (period) {
      case 'today':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        const dayOfWeek = date.getDay();
        start.setDate(date.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'lastWeek':
        const lastWeekStart = new Date(date);
        lastWeekStart.setDate(date.getDate() - date.getDay() - 7);
        lastWeekStart.setHours(0, 0, 0, 0);
        const lastWeekEnd = new Date(lastWeekStart);
        lastWeekEnd.setDate(lastWeekStart.getDate() + 6);
        lastWeekEnd.setHours(23, 59, 59, 999);
        return { start: lastWeekStart, end: lastWeekEnd };
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(start.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'lastMonth':
        const lastMonthStart = new Date(date);
        lastMonthStart.setMonth(date.getMonth() - 1);
        lastMonthStart.setDate(1);
        lastMonthStart.setHours(0, 0, 0, 0);
        const lastMonthEnd = new Date(lastMonthStart);
        lastMonthEnd.setMonth(lastMonthStart.getMonth() + 1);
        lastMonthEnd.setDate(0);
        lastMonthEnd.setHours(23, 59, 59, 999);
        return { start: lastMonthStart, end: lastMonthEnd };
      case 'quarter':
        const quarterStart = new Date(date);
        quarterStart.setMonth(date.getMonth() - 3);
        quarterStart.setDate(1);
        quarterStart.setHours(0, 0, 0, 0);
        return { start: quarterStart, end: date };
    }

    return { start, end };
  }

  /**
   * Calculate growth rate between two values
   */
  static calculateGrowthRate(values: number[]): number {
    if (values.length < 2) return 0;
    
    const first = values[0] || 1;
    const last = values[values.length - 1] || 0;
    
    return (last - first) / first;
  }

  /**
   * Get date intervals for trend analysis
   */
  static getDateIntervals(start: Date, end: Date, period: string): DateInterval[] {
    const intervals: DateInterval[] = [];
    const current = new Date(start);
    
    while (current < end) {
      const intervalStart = new Date(current);
      const intervalEnd = new Date(current);
      
      if (period === 'month' || period === 'quarter') {
        intervalEnd.setDate(intervalEnd.getDate() + 7); // Weekly intervals
      } else {
        intervalEnd.setDate(intervalEnd.getDate() + 1); // Daily intervals
      }
      
      if (intervalEnd > end) {
        intervalEnd.setTime(end.getTime());
      }
      
      intervals.push({ start: intervalStart, end: intervalEnd });
      current.setTime(intervalEnd.getTime() + 1);
    }
    
    return intervals;
  }

  /**
   * Calculate percentage change between two values
   */
  static calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  /**
   * Calculate average from array of numbers
   */
  static calculateAverage(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }
} 