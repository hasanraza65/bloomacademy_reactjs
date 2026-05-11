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
  classrooms?: any[];
  teacher?: any;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
  errors?: Record<string, string[]>;
}

export type AuthMode = 'login' | 'signup-parent' | 'signup-teacher';

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
  teacher_id: number;
  child_id: number;
  pair_id: number;
  status: string;
  whiteboard_uuid: string | null;
  whiteboard_token: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
  active_material_id: number | null;
  current_page: number;
  scroll_position: number;
  is_whiteboard_active: number;
  teacher: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: number;
    phone: string;
    address: string;
    lat: number | null;
    lng: number | null;
    board_status: string;
    position: number;
    user_status: number;
    created_at: string;
    updated_at: string;
  };
  child: {
    id: number;
    child_name: string;
    user_id: number;
    external_id: string | null;
    dob: string;
    created_at: string;
    updated_at: string;
  };
}
