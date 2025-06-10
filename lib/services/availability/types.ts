export interface AvailabilitySearchParams {
  startAtMin: Date;
  startAtMax: Date;
  locationId?: string;
  teamMemberIds?: string[];
  serviceVariationId?: string;
  duration?: number; // minutes
  maxResults?: number;
}

export interface AvailabilitySlot {
  startAt: Date;
  endAt: Date;
  durationMinutes: number;
  availableTeamMembers: string[];
  locationId?: string;
}

export interface AvailabilitySearchResult {
  availabilities: AvailabilitySlot[];
  totalResults: number;
  searchParams: AvailabilitySearchParams;
}

export interface BusinessHours {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  openTime: string; // "09:00"
  closeTime: string; // "17:00"
  isOpen: boolean;
}

export interface TeamMemberSchedule {
  teamMemberId: string;
  date: Date;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  breakTimes?: Array<{
    startTime: string;
    endTime: string;
  }>;
}

export interface AppointmentConflict {
  id: string;
  startTime: Date;
  endTime: Date;
  type: string;
  artistId?: string;
  customerName?: string;
}

export interface SuggestedSlot {
  startTime: Date;
  endTime: Date;
  duration: number;
  isAvailable: boolean;
  artistId?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface AlternativeTimeOptions {
  includeBuffer?: boolean;
  bufferMinutes?: number;
  respectBusinessHours?: boolean;
  maxSuggestions?: number;
}

export interface ExistingAppointment {
  id: string;
  startTime: Date | null;
  endTime: Date | null;
  duration: number | null;
  artistId: string | null;
  status: string | null;
}

export interface SlotGenerationParams {
  startAtMin: Date;
  startAtMax: Date;
  duration: number;
  existingAppointments: ExistingAppointment[];
  teamMemberSchedules: TeamMemberSchedule[];
  locationId?: string;
  teamMemberIds?: string[];
  maxResults: number;
} 