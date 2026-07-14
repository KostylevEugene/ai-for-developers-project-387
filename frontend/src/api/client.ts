import axios from 'axios';
import type {
  AppointmentType,
  Booking,
  CreateBookingRequest,
  LoginRequest,
} from './types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost';
const PORT = import.meta.env.PORT || '7100';
const API_BASE_URL = PORT && PORT !== 'false' ? `${BACKEND_URL}:${PORT}` : BACKEND_URL;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor for handling errors globally or injecting authorization headers if needed
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const customError = error.response?.data || {
      code: error.response?.status || 500,
      message: error.message || 'Unknown network error',
    };
    return Promise.reject(customError);
  }
);

export const api = {
  // Authentication
  login: async (body: LoginRequest): Promise<void> => {
    await apiClient.post('/auth/login', body);
  },

  // Bookings
  createBooking: async (body: CreateBookingRequest): Promise<Booking> => {
    const response = await apiClient.post<Booking>('/booking', body);
    return response.data;
  },

  // Appointment Types
  listAppointmentTypes: async (): Promise<AppointmentType[]> => {
    const response = await apiClient.get<AppointmentType[]>('/appointment-types');
    return response.data;
  },

  readAppointmentType: async (id: string): Promise<AppointmentType> => {
    const response = await apiClient.get<AppointmentType>(`/appointment-types/${id}`);
    return response.data;
  },

  createAppointmentType: async (
    body: Omit<AppointmentType, 'id' | 'slots'>
  ): Promise<AppointmentType> => {
    const response = await apiClient.post<AppointmentType>('/appointment-types', body);
    return response.data;
  },

  updateAppointmentType: async (
    id: string,
    body: Partial<Omit<AppointmentType, 'id' | 'slots'>>
  ): Promise<AppointmentType> => {
    const response = await apiClient.patch<AppointmentType>(`/appointment-types/${id}`, body);
    return response.data;
  },

  deleteAppointmentType: async (id: string): Promise<void> => {
    await apiClient.delete(`/appointment-types/${id}`);
  },
};
