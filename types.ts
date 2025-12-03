
export enum PaymentStatus {
  PAID = 'Paid',
  UNPAID = 'Unpaid',
  PARTIAL = 'Partial',
  CANCELLED = 'Cancelled',
  REFUNDED = 'Refunded'
}

export interface Court {
  id: string;
  name: string;
}

export interface PromotionRule {
  id: string;
  name: string;
  startTime: number; // Hour 0-24
  endTime: number;   // Hour 0-24
  rate: number;      // Special rate
  isActive: boolean;
}

export interface Booking {
  id: string;
  batchId?: string; // New field to group bookings created together
  customerName: string;
  phoneNumber: string;
  residentUnitNo?: string; 
  date: string; // ISO Date string YYYY-MM-DD (The date of the game)
  startTime: number; // Hour in 24h format
  duration: number; // In hours
  courtId: string;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: number;
  
  paymentDate?: number; // Timestamp of when the payment was actually collected (Cash Flow)
  isReconciled?: boolean; // Track if this payment has been reconciled in Cash Collection

  hourlyRate?: number; // Kept for legacy reference
  totalAmount: number; // The specific total calculated at time of booking
  paidAmount?: number; // Amount paid if status is PARTIAL
  
  // Document Numbers
  receiptNumber?: string;
  voucherNumber?: string;
}

export interface BookingSlot {
  courtId: string;
  startTime: string;
  duration: number;
}

export interface BookingFormData {
  customerName: string;
  phoneNumber: string;
  residentUnitNo: string;
  date: string;
  selectedDates?: string[];
  startTime: string; 
  duration: number;
  courtId: string;
  slots: BookingSlot[];
  paymentStatus: PaymentStatus;
  notes: string;
  paidAmount?: number;
}

export interface DocumentSettings {
  receiptPrefix: string;
  receiptNextNumber: number;
  voucherPrefix: string;
  voucherNextNumber: number;
}

export interface CompanyProfile {
  name: string;
  address: string;
  phone: string;
  documentSettings?: DocumentSettings;
  dateFormat?: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
  timeFormat?: '24h' | '12h';
  apiKey?: string; // NEW: Store AI Key here
  footerMessage?: string; // NEW: Custom message for report footers
}

export type ViewMode = 'grid' | 'list';

// --- USER MANAGEMENT TYPES ---

export type UserRole = 'admin' | 'user';

export type Permission = 
  | 'manage_bookings'    // Create, Edit, Cancel
  | 'view_reports'       // Financial Reports
  | 'manage_payments'    // Settlement, Cash Collection, Refund
  | 'batch_tools'        // Batch Amend
  | 'manage_settings'    // Court Settings, Pricing
  | 'system_maintenance' // Backup, Wipe, ReIndex
  | 'manage_users';      // Create/Delete Users (Admin Only implicit usually, but good to have)

export interface User {
  id: string;
  username: string;
  password: string; // In a real app, this should be hashed. For this local app, plain text or simple encoding is used.
  name: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
}
