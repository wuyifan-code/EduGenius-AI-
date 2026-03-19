export enum UserRole {
  GUEST = 'GUEST',
  PATIENT = 'PATIENT',
  ESCORT = 'ESCORT',
  ADMIN = 'ADMIN'
}

export enum ServiceType {
  FULL_PROCESS = 'FULL_PROCESS', // 全程陪诊
  APPOINTMENT = 'APPOINTMENT', // 代约挂号
  REPORT_PICKUP = 'REPORT_PICKUP', // 代取报告
  VIP_TRANSPORT = 'VIP_TRANSPORT' // 专车接送
}

export interface EscortProfile {
  id: string;
  name: string;
  rating: number;
  completedOrders: number;
  isCertified: boolean; // 2025 Standard
  specialties: string[];
  imageUrl: string;
  distance: string;
}

export interface Order {
  id: string;
  serviceType: ServiceType;
  hospital: string;
  date: string;
  status: 'PENDING' | 'MATCHED' | 'COMPLETED';
  price: number;
}

export type PageType = 'home' | 'explore' | 'notifications' | 'messages' | 'saved' | 'profile' | 'settings' | 'login' | 'admin';

export type Language = 'zh' | 'en';

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

// Hospital type
export interface Hospital {
  id: string;
  name: string;
  department: string;
  level: string; // e.g., "三甲"
  address: string;
  phone?: string;
  rating?: number;
  distance?: string;
}

// Appointment type
export interface Appointment {
  id: string;
  patientId: string;
  escortId?: string;
  serviceType: ServiceType;
  hospital: string;
  department?: string;
  date: string;
  time?: string;
  status: 'PENDING' | 'CONFIRMED' | 'MATCHED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  price: number;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

// Hospital search params
export interface HospitalSearchParams {
  keyword?: string;
  department?: string;
  city?: string;
  level?: string;
}