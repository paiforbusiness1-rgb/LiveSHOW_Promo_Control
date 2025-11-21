export enum RegistrationStatus {
  PENDING = 'PENDING',
  VALIDATED = 'VALIDATED',
  CANCELLED = 'CANCELLED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

export interface User {
  id: string;
  username: string;
  password: string; // En producción, esto debería ser un hash
  role: UserRole;
  name: string;
  createdAt: string;
}

export interface Registration {
  id: string;
  name: string;
  email: string;
  ticketType: 'VIP' | 'GENERAL' | 'PROMO';
  status: RegistrationStatus;
  validationTime?: string;
  validatedBy?: string; // Tracks which operator performed the validation
  qrCodeValue: string;
}

export interface ScanResult {
  success: boolean;
  message: string;
  registration?: Registration;
}

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
}

// Global type for jsQR loaded via CDN
declare global {
  interface Window {
    jsQR: (data: Uint8ClampedArray, width: number, height: number) => { data: string } | null;
  }
}