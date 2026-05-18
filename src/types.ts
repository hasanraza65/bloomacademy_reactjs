export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
}

export interface DaySchedule {
  day: string;
  slots: TimeSlot[];
}

export interface ChildData {
  id: string;
  child_name?: string;
  dob: string;
  schedule: DaySchedule[];
}

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const INITIAL_SCHEDULE: DaySchedule[] = DAYS.map(day => ({
  day,
  slots: []
}));

// Programmatically generate 24-hour time slots (00:00 - 24:00)
export const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const start = i.toString().padStart(2, '0');
  const end = (i + 1).toString().padStart(2, '0');
  return `${start}h - ${end}h`;
});

export type UserRole = 2 | 3; // 2 = Teacher, 3 = Parent

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  avatar?: string;
  children?: any[];
  teacher?: any;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  errors?: Record<string, string[]>;
}

export type AuthMode = 'login' | 'signup-parent' | 'signup-teacher' | 'forgot-password';

export interface ClassroomConnection {
  classroom_id: number;
  channel_name: string;
  token: string;
  app_id: string;
  uid: number;
  role: 'host' | 'audience';
}

export interface AgoraParticipant {
  uid: string | number;
  audioTrack?: any;
  videoTrack?: any;
  hasAudio: boolean;
  hasVideo: boolean;
  name?: string;
}

export interface ClassroomData {
  id: number;
  channel_name: string;
  child?: {
    child_name: string;
  };
  teacher?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}
