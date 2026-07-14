export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface ErrorModel {
  code: number;
  message: string;
}

export interface Guest {
  id: number;
  phone: string;
  firstName: string;
  lastName: string;
}

export interface Slot {
  date: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  time: string; // HH:mm:ss or HH:mm
  reserved: boolean;
}

export interface AppointmentType {
  id: string;
  name: string;
  startTime: string; // ISO 8601 Date Time string
  endTime: string; // ISO 8601 Date Time string
  slotDurationMinutes: number;
  slots?: Slot[];
}

export interface Booking {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  time: string; // HH:mm:ss
  userId: number;
  appointmentTypeId: string;
}

export interface CreateBookingRequest {
  appointmentTypeId: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  time: string; // HH:mm:ss
  phone: string;
  firstName: string;
  lastName: string;
}

export interface LoginRequest {
  password: string;
}
