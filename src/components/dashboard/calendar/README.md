# 📅 Modular Appointment Calendar System

## Overview

The Appointment Calendar has been refactored into a modular, component-based architecture that promotes reusability, maintainability, and testability. The system is designed to maximize shop owner productivity through efficient appointment management.

## 🏗️ Architecture

### Main Component
- **`AppointmentCalendar.tsx`** - Main orchestrator component that uses all modular pieces

### View Components
- **`CalendarHeader.tsx`** - Navigation, view toggle, and refresh controls
- **`CalendarFilters.tsx`** - Search and status filtering
- **`MonthView.tsx`** - Month grid layout
- **`WeekView.tsx`** - Week layout with time slots
- **`DayCell.tsx`** - Individual day cell in month view
- **`AppointmentCard.tsx`** - Reusable appointment display component
- **`AppointmentTooltip.tsx`** - Detailed hover information
- **`QuickActionsMenu.tsx`** - Context menu for status changes
- **`CalendarLegend.tsx`** - Status legend and keyboard shortcuts

### Custom Hooks
- **`useCalendarNavigation`** - Date navigation and calendar day calculations
- **`useAppointmentFiltering`** - Search and status filtering logic
- **`useCalendarStats`** - Daily and overall statistics calculations
- **`useKeyboardShortcuts`** - Keyboard shortcuts and auto-refresh

### Utilities
- **`calendarUtils.ts`** - Shared utility functions for dates, colors, and formatting

## 🚀 Key Features

### Productivity Enhancements
- **Week View** with hourly time slots (8 AM - 8 PM)
- **Quick status changes** via right-click context menu
- **Real-time search** across customer names, emails, and notes
- **Status filtering** dropdown
- **Keyboard shortcuts** for power users
- **Auto-refresh** every 5 minutes
- **Hover tooltips** with detailed appointment info

### Visual Improvements
- **Today highlighting** with brand colors
- **Status color coding** with proper contrast
- **Daily statistics** showing appointment count and revenue
- **Loading states** and error handling
- **Responsive design** for different screen sizes

### Developer Benefits
- **Modular components** for easy testing and maintenance
- **Custom hooks** for reusable logic
- **TypeScript interfaces** for type safety
- **Consistent styling** with utility classes
- **Clear separation of concerns**

## 🔧 Usage

### Basic Implementation
```tsx
import AppointmentCalendar from '@/src/components/dashboard/AppointmentCalendar';

<AppointmentCalendar
  appointments={appointments}
  onDateClick={handleDateClick}
  onAppointmentClick={handleAppointmentClick}
  onCreateClick={handleCreateClick}
  onStatusChange={handleStatusChange}
  onRefresh={loadAppointments}
  loading={loading}
/>
```

### Using Individual Components
```tsx
import { 
  CalendarHeader, 
  MonthView, 
  useCalendarNavigation,
  useAppointmentFiltering 
} from '@/src/components/dashboard/calendar';

function CustomCalendar() {
  const { currentDate, navigate } = useCalendarNavigation('month');
  const { filteredAppointments } = useAppointmentFiltering(appointments);
  
  return (
    <div>
      <CalendarHeader
        currentDate={currentDate}
        viewMode="month"
        onNavigate={navigate}
        onToday={() => setCurrentDate(new Date())}
        onViewModeChange={setViewMode}
      />
      <MonthView
        calendarDays={calendarDays}
        currentDate={currentDate}
        appointmentsByDateTime={appointmentsByDateTime}
        dayStats={dayStats}
        onDateClick={onDateClick}
        onCreateClick={onCreateClick}
        onAppointmentClick={onAppointmentClick}
      />
    </div>
  );
}
```

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `←` `→` | Navigate previous/next month or week |
| `T` | Go to today |
| `M` | Switch to month view |
| `W` | Switch to week view |
| `Ctrl+R` | Refresh appointments |
| `Esc` | Close modals/menus |

## 🎨 Status Colors

| Status | Color | Description |
|--------|-------|-------------|
| Pending | Yellow | Awaiting confirmation |
| Scheduled | Blue | Booked but not confirmed |
| Confirmed | Green | Confirmed by customer |
| Completed | Gray | Appointment finished |
| Cancelled | Red | Cancelled appointment |
| No Show | Orange | Customer didn't show |

## 📊 Statistics

Each day cell shows:
- **Total appointments** count
- **Revenue** for confirmed/completed appointments
- **Quick visual indicators** for busy days

## 🔄 Auto-Refresh

The calendar automatically refreshes every 5 minutes to keep data current in multi-user environments. Manual refresh is available via the refresh button or `Ctrl+R`.

## 🛠️ Customization

### Adding New Views
1. Create a new view component in `calendar/`
2. Add to the main `AppointmentCalendar` component
3. Update the view mode type and handlers

### Custom Hooks
The modular hook system allows easy extension:
```tsx
// Custom hook example
export const useCustomCalendarFeature = (appointments) => {
  // Your custom logic here
  return { customData };
};
```

### Styling
Components use Tailwind CSS with the existing design system. Custom styles can be added by:
1. Extending utility classes in `calendarUtils.ts`
2. Modifying component styles directly
3. Adding new design tokens

## 🧪 Testing

The modular structure makes testing easier:
```tsx
// Test individual components
import { CalendarHeader } from '@/src/components/dashboard/calendar';

// Test custom hooks
import { useCalendarNavigation } from '@/src/components/dashboard/calendar/hooks';
```

## 📦 File Structure
```
src/components/dashboard/
├── AppointmentCalendar.tsx          # Main component
├── calendar/
│   ├── CalendarHeader.tsx           # Navigation & controls
│   ├── CalendarFilters.tsx          # Search & filtering
│   ├── CalendarLegend.tsx           # Status legend
│   ├── MonthView.tsx                # Month grid
│   ├── WeekView.tsx                 # Week grid
│   ├── DayCell.tsx                  # Individual day
│   ├── AppointmentCard.tsx          # Appointment display
│   ├── AppointmentTooltip.tsx       # Hover details
│   ├── QuickActionsMenu.tsx         # Context menu
│   ├── hooks/
│   │   ├── useCalendarNavigation.ts # Date navigation
│   │   ├── useAppointmentFiltering.ts # Search & filter
│   │   ├── useCalendarStats.ts      # Statistics
│   │   └── useKeyboardShortcuts.ts  # Keyboard handling
│   ├── index.ts                     # Exports
│   └── README.md                    # This file
└── utils/
    └── calendarUtils.ts             # Shared utilities
```

## 🎯 Future Enhancements

- **Drag & drop** appointment rescheduling
- **Multi-select** for batch operations
- **Print view** for daily schedules
- **Export** to calendar applications
- **Notifications** for upcoming appointments
- **Recurring appointments** support
- **Mobile optimization** for touch interfaces 