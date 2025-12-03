
import { Booking, PaymentStatus, Court, User } from './types';

export const OPENING_HOUR = 0; // 00:00
export const CLOSING_HOUR = 24; // 24:00

// Generate time slots in 0.5 (30 min) intervals
// e.g. [0, 0.5, 1, 1.5, ..., 23.5]
export const HOURS = Array.from(
  { length: (CLOSING_HOUR - OPENING_HOUR) * 2 }, 
  (_, i) => OPENING_HOUR + (i * 0.5)
);

export const INITIAL_COURTS: Court[] = [
  { id: 'Court 1', name: 'Court 1' },
  { id: 'Court 2', name: 'Court 2' },
  { id: 'Court 3', name: 'Court 3' },
  { id: 'Court 4', name: 'Court 4' },
];

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'MYR', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: '1',
    customerName: 'John Doe',
    phoneNumber: '555-0123',
    date: new Date().toISOString().split('T')[0],
    startTime: 10,
    duration: 2,
    courtId: 'Court 1',
    paymentStatus: PaymentStatus.PAID,
    notes: 'Regular training',
    createdAt: Date.now(),
    hourlyRate: 20,
    totalAmount: 40
  },
  {
    id: '2',
    customerName: 'Jane Smith',
    phoneNumber: '555-0987',
    date: new Date().toISOString().split('T')[0],
    startTime: 14,
    duration: 1.5, // Example of 1.5 hours
    courtId: 'Court 2',
    paymentStatus: PaymentStatus.UNPAID,
    notes: 'First time visitor',
    createdAt: Date.now() - 10000,
    hourlyRate: 20,
    totalAmount: 30
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'admin-001',
    username: 'admin',
    password: 'admin123',
    name: 'System Administrator',
    role: 'admin',
    permissions: [], // Admin has implicit all permissions
    isActive: true
  }
];

// Handles 24h (default) or 12h format
// Supports float hours (e.g. 10.5 -> 10:30)
export const formatTime = (timeValue: number, format: '24h' | '12h' = '24h'): string => {
  // Normalize 24.0 or 24.5 to 0.0, 0.5 etc for display
  let displayTime = timeValue % 24;
  
  const hour = Math.floor(displayTime);
  const minutes = (displayTime % 1) === 0.5 ? '30' : '00';

  if (format === '12h') {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h12 = hour % 12 || 12; // Convert 0 to 12
    return `${h12}:${minutes} ${ampm}`;
  }

  // 24h Format
  const h = hour.toString().padStart(2, '0');
  return `${h}:${minutes}`;
};

// Handles Date Formatting
export const formatDate = (dateStr: string, format: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' = 'YYYY-MM-DD'): string => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  
  if (format === 'DD/MM/YYYY') {
    return `${d}/${m}/${y}`;
  }
  if (format === 'MM/DD/YYYY') {
    return `${m}/${d}/${y}`;
  }
  return dateStr; // Default ISO
};

export const getStatusColor = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.PAID:
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    case PaymentStatus.UNPAID:
      return 'bg-red-100 text-red-800 border-red-200';
    case PaymentStatus.PARTIAL:
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case PaymentStatus.CANCELLED:
      return 'bg-gray-100 text-gray-500 border-gray-200 decoration-gray-400 line-through decoration-1';
    case PaymentStatus.REFUNDED:
      return 'bg-purple-100 text-purple-800 border-purple-200 decoration-purple-900/30 line-through decoration-1';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
