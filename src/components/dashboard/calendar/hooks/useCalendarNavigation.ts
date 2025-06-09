import { useState, useMemo } from 'react';
import { 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  addWeeks, 
  subWeeks, 
  addMonths, 
  subMonths 
} from 'date-fns';

export const useCalendarNavigation = (viewMode: 'month' | 'week', onMonthChange?: (date: Date) => void) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const calendarDays = useMemo(() => {
    if (viewMode === 'week') {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    } else {
      // Month view - calculate full calendar grid
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDate = new Date(firstDay);
      const endDate = new Date(lastDay);

      // Adjust to start on Sunday
      startDate.setDate(startDate.getDate() - startDate.getDay());
      // Adjust to end on Saturday
      endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

      const days: Date[] = [];
      const current = new Date(startDate);

      while (current <= endDate) {
        days.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }

      return days;
    }
  }, [currentDate, viewMode]);

  const navigate = (direction: number) => {
    if (viewMode === 'week') {
      const newDate = direction > 0 ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1);
      setCurrentDate(newDate);
    } else {
      const newDate = direction > 0 ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
      setCurrentDate(newDate);
      onMonthChange?.(newDate);
    }
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    if (viewMode === 'month') {
      onMonthChange?.(today);
    }
  };

  return {
    currentDate,
    setCurrentDate,
    navigate,
    calendarDays,
    goToToday
  };
}; 