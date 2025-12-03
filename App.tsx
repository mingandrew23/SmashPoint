
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  LayoutGrid, 
  List, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  Printer, 
  Menu, 
  Edit3, 
  Wallet, 
  Eraser, 
  CheckCircle, 
  AlertCircle, 
  DollarSign, 
  Search, 
  ChevronDown, 
  Coins, 
  Lock, 
  Clock, 
  ArrowRight, 
  TrendingUp, 
  Activity, 
  BarChart3, 
  Users, 
  Building2 
} from 'lucide-react';
import BookingGrid from './components/BookingGrid';
import BookingList from './components/BookingList';
import BookingModal from './components/BookingModal';
import CourtSettingsModal from './components/CourtSettingsModal';
import ReportModal from './components/ReportModal';
import SettlementModal from './components/SettlementModal';
import SidebarMenu from './components/SidebarMenu'; 
import AIAssistant from './components/AIAssistant';
import BatchAmendModal from './components/BatchAmendModal';
import BackupRestoreModal from './components/BackupRestoreModal'; 
import SearchSlotsModal from './components/SearchSlotsModal';
import ActivationModal from './components/ActivationModal'; 
import CashCollectionModal from './components/CashCollectionModal';
import ReIndexModal from './components/ReIndexModal';
import LoginScreen from './components/LoginScreen'; 
import UserManagementModal from './components/UserManagementModal';
import { Booking, BookingFormData, ViewMode, Court, CompanyProfile, PaymentStatus, PromotionRule, BookingSlot, User, Permission } from './types';
import { INITIAL_BOOKINGS, INITIAL_COURTS, CURRENCIES, INITIAL_USERS, formatTime, formatDate } from './constants';
import { printPaymentVoucher } from './utils/printReceipt';
import { verifyLicenseKey } from './utils/licenseGenerator';

function App() {
  // --- PERSISTENCE HELPERS ---
  const loadState = <T,>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch (e) {
      console.error(`Failed to load ${key}`, e);
      return fallback;
    }
  };

  // --- STATE INITIALIZATION ---
  
  // User & Auth State
  const [users, setUsers] = useState<User[]>(() => loadState('users', INITIAL_USERS));
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [bookings, setBookings] = useState<Booking[]>(() => 
    loadState('bookings', INITIAL_BOOKINGS.map(b => ({
      ...b,
      totalAmount: b.totalAmount || (b.duration * (b.hourlyRate || 20)) 
    })))
  );

  const [courts, setCourts] = useState<Court[]>(() => 
    loadState('courts', INITIAL_COURTS)
  );

  const [currencyCode, setCurrencyCode] = useState(() => loadState('currencyCode', 'USD'));
  const [hourlyRate, setHourlyRate] = useState<number>(() => loadState('hourlyRate', 20)); 
  const [promotionRules, setPromotionRules] = useState<PromotionRule[]>(() => loadState('promotionRules', []));
  
  const DEFAULT_PROFILE: CompanyProfile = {
    name: 'Your Sports Centre',
    address: '123 Sports Complex Blvd',
    phone: '+1 (555) 123-4567',
    documentSettings: {
      receiptPrefix: 'OR-',
      receiptNextNumber: 1001,
      voucherPrefix: 'PV-',
      voucherNextNumber: 5001
    },
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h'
  };

  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    const loaded = loadState('companyProfile', DEFAULT_PROFILE);
    if (!loaded.documentSettings) {
      loaded.documentSettings = DEFAULT_PROFILE.documentSettings;
    }
    return loaded;
  });

  const [isActivated, setIsActivated] = useState<boolean>(() => loadState('app_activated', false));

  // --- AUTO-SAVE EFFECT ---
  // Note: app_activated is REMOVED from here to prevent overwrite on startup race conditions
  useEffect(() => {
    localStorage.setItem('bookings', JSON.stringify(bookings));
    localStorage.setItem('courts', JSON.stringify(courts));
    localStorage.setItem('currencyCode', JSON.stringify(currencyCode));
    localStorage.setItem('hourlyRate', JSON.stringify(hourlyRate));
    localStorage.setItem('promotionRules', JSON.stringify(promotionRules));
    localStorage.setItem('companyProfile', JSON.stringify(companyProfile));
    localStorage.setItem('users', JSON.stringify(users));
  }, [bookings, courts, currencyCode, hourlyRate, promotionRules, companyProfile, users]);


  // Initialize date using local time
  const [currentDate, setCurrentDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCourtSettingsOpen, setIsCourtSettingsOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false); 
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [isBatchAmendOpen, setIsBatchAmendOpen] = useState(false); 
  const [isBackupRestoreOpen, setIsBackupRestoreOpen] = useState(false);
  const [isSearchSlotsOpen, setIsSearchSlotsOpen] = useState(false);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(false);
  const [isCashCollectionOpen, setIsCashCollectionOpen] = useState(false);
  const [isReIndexOpen, setIsReIndexOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  
  const [backupModalMode, setBackupModalMode] = useState<'default' | 'wipe'>('default');

  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [loginError, setLoginError] = useState<string | undefined>();
  
  const [modalDefaults, setModalDefaults] = useState<{
    date: string, 
    time?: number, 
    courtId?: string,
    duration?: number,
    slots?: BookingSlot[] 
  } | null>(null);

  const [settleCustomer, setSettleCustomer] = useState<{name: string, phone: string} | undefined>(undefined);

  const getCurrencySymbol = () => {
    return CURRENCIES.find(c => c.code === currencyCode)?.symbol || '$';
  };

  // --- AUTHENTICATION & PERMISSIONS ---

  const handleLogin = async (u: string, p: string) => {
    const user = users.find(user => user.username === u && user.password === p && user.isActive);
    if (user) {
      setCurrentUser(user);
      setLoginError(undefined);
      return true;
    } else {
      setLoginError("Invalid username or password");
      return false;
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsSidebarOpen(false);
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions.includes(permission);
  };

  const checkAccess = (permission: Permission, action: () => void) => {
    if (hasPermission(permission)) {
      action();
    } else {
      alert("Access Denied. You do not have permission for this action.");
    }
  };

  // --- ACTIONS ---

  const checkLicense = (action: () => void) => {
    if (isActivated) {
      action();
    } else {
      setIsActivationModalOpen(true);
    }
  };

  const handleActivateApp = (code: string, registeredName: string, address: string) => {
    // Legacy Master Key Support (optional)
    if (code === 'X7F2A-9K3M1-P8Q4L-W2R5J-Z6N9Y') {
        setIsActivated(true);
        // FORCE SAVE IMMEDIATELY
        localStorage.setItem('app_activated', 'true');
        setCompanyProfile(prev => ({ ...prev, name: registeredName, address: address }));
        return true;
    }

    // New Dynamic Key Verification (NAME ONLY)
    // We update the function to verify based on NAME, but we still capture Address for the profile
    const isValid = verifyLicenseKey(registeredName, code);
    
    if (isValid) {
      setIsActivated(true);
      // FORCE SAVE IMMEDIATELY
      localStorage.setItem('app_activated', 'true');
      setCompanyProfile(prev => ({ ...prev, name: registeredName, address: address }));
      return true;
    }
    
    return false;
  };

  // Helper: Generate next Receipt Number
  const generateReceiptNumber = () => {
    const prefix = companyProfile.documentSettings?.receiptPrefix || 'OR-';
    const nextNum = companyProfile.documentSettings?.receiptNextNumber || 1000;
    
    // Auto-increment in background (will be saved via setCompanyProfile)
    const newSettings = { ...companyProfile.documentSettings!, receiptNextNumber: nextNum + 1 };
    setCompanyProfile(prev => ({ ...prev, documentSettings: newSettings }));
    
    return `${prefix}${nextNum}`;
  };

  const generateVoucherNumber = () => {
    const prefix = companyProfile.documentSettings?.voucherPrefix || 'PV-';
    const nextNum = companyProfile.documentSettings?.voucherNextNumber || 5000;
    
    const newSettings = { ...companyProfile.documentSettings!, voucherNextNumber: nextNum + 1 };
    setCompanyProfile(prev => ({ ...prev, documentSettings: newSettings }));
    
    return `${prefix}${nextNum}`;
  };

  const handleNewBooking = () => {
    checkAccess('manage_bookings', () => {
      setEditingBooking(null);
      setModalDefaults({ date: currentDate });
      setIsModalOpen(true);
    });
  };

  const handleSlotClick = (courtId: string, time: number) => {
    if (!hasPermission('manage_bookings')) return;
    
    checkLicense(() => {
      setEditingBooking(null);
      setModalDefaults({ date: currentDate, time, courtId });
      setIsModalOpen(true);
    });
  };

  const handleEditBooking = (booking: Booking) => {
    if (!hasPermission('manage_bookings')) return;

    checkLicense(() => {
      setEditingBooking(booking);
      setModalDefaults(null);
      setIsModalOpen(true);
    });
  };

  const handleBookFromSearch = (date: string, slots: {courtId: string, startTime: number, duration: number}[]) => {
    const mappedSlots: BookingSlot[] = slots.map(s => ({
        courtId: s.courtId,
        startTime: s.startTime.toString(),
        duration: s.duration
    }));

    setModalDefaults({
      date,
      slots: mappedSlots,
      time: slots[0].startTime,
      courtId: slots[0].courtId,
      duration: slots[0].duration
    });
    setIsSearchSlotsOpen(false);
    setIsModalOpen(true);
  };

  const handleSaveBooking = (data: BookingFormData) => {
    const proposedBookings: any[] = [];
    const batchId = `BID-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const now = Date.now();
    
    let sharedReceiptNumber: string | undefined = undefined;
    let paymentDate: number | undefined = undefined;

    if (data.paymentStatus === PaymentStatus.PAID || data.paymentStatus === PaymentStatus.PARTIAL) {
       sharedReceiptNumber = generateReceiptNumber();
       paymentDate = now;
    }

    const dates = data.selectedDates && data.selectedDates.length > 0 ? data.selectedDates : [data.date];
    let remainingPartial = data.paidAmount || 0;

    for (const d of dates) {
      for (const s of data.slots) {
         let slotCost = 0;
         const start = parseFloat(s.startTime);
         for(let i=0; i<s.duration; i+=0.5) {
            const seg = start + i;
            const promo = promotionRules.find(p => p.isActive && seg >= p.startTime && seg < p.endTime);
            slotCost += promo ? (promo.rate/2) : (hourlyRate/2);
         }

         let thisBookingPaid = 0;
         if (data.paymentStatus === PaymentStatus.PAID) {
            thisBookingPaid = slotCost;
         } else if (data.paymentStatus === PaymentStatus.PARTIAL) {
            const take = Math.min(remainingPartial, slotCost);
            thisBookingPaid = take;
            remainingPartial -= take;
         }

         proposedBookings.push({
            id: editingBooking && dates.length === 1 && data.slots.length === 1 ? editingBooking.id : Date.now().toString() + Math.random(),
            batchId: editingBooking ? editingBooking.batchId : batchId,
            customerName: data.customerName,
            phoneNumber: data.phoneNumber,
            residentUnitNo: data.residentUnitNo,
            date: d,
            startTime: parseFloat(s.startTime),
            duration: s.duration,
            courtId: s.courtId,
            paymentStatus: data.paymentStatus,
            notes: data.notes,
            createdAt: editingBooking ? editingBooking.createdAt : now,
            paymentDate: paymentDate,
            hourlyRate: hourlyRate,
            totalAmount: slotCost,
            paidAmount: data.paymentStatus === PaymentStatus.PARTIAL ? thisBookingPaid : undefined,
            receiptNumber: sharedReceiptNumber,
         });
      }
    }

    for (const proposed of proposedBookings) {
       const conflict = bookings.find(b => {
          if (b.id === proposed.id) return false; 
          if (b.paymentStatus === PaymentStatus.CANCELLED || b.paymentStatus === PaymentStatus.REFUNDED) return false;
          if (b.date !== proposed.date || b.courtId !== proposed.courtId) return false;
          
          const start = b.startTime;
          const end = b.startTime + b.duration;
          const pStart = proposed.startTime;
          const pEnd = proposed.startTime + proposed.duration;

          return (pStart < end && pEnd > start);
       });

       if (conflict) {
          return { success: false, conflict: conflict };
       }
    }

    if (editingBooking && dates.length === 1 && data.slots.length === 1) {
       setBookings(prev => prev.map(b => b.id === editingBooking.id ? proposedBookings[0] : b));
       return { success: true, bookings: [proposedBookings[0]] };
    } else {
       setBookings(prev => [...prev, ...proposedBookings]);
       return { success: true, bookings: proposedBookings };
    }
  };

  const handleCancelBooking = (id: string) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, paymentStatus: PaymentStatus.CANCELLED } : b));
    setIsModalOpen(false);
  };

  const handleRefundBooking = (id: string) => {
    // Only available to admin or manage_payments
    if (!hasPermission('manage_payments')) {
        alert("Permission Denied: Refund");
        return undefined;
    }

    const voucherNo = generateVoucherNumber();
    let updatedBooking: Booking | undefined;

    setBookings(prev => prev.map(b => {
      if (b.id === id) {
        updatedBooking = { ...b, paymentStatus: PaymentStatus.REFUNDED, voucherNumber: voucherNo };
        return updatedBooking;
      }
      return b;
    }));
    return updatedBooking;
  };

  const handleBulkSettle = (ids: string[]) => {
    const receiptNo = generateReceiptNumber();
    const now = Date.now();

    setBookings(prev => prev.map(b => {
      if (ids.includes(b.id)) {
        return { 
            ...b, 
            paymentStatus: PaymentStatus.PAID, 
            paidAmount: undefined,
            receiptNumber: receiptNo,
            paymentDate: now
        };
      }
      return b;
    }));
    return receiptNo;
  };

  const handleDeleteBooking = (id: string) => {
    if (!hasPermission('manage_bookings')) {
        alert("Permission Denied: Delete");
        return;
    }
    setBookings(prev => prev.filter(b => b.id !== id));
  };

  const handleBatchAmend = (
    ids: string[], 
    globalChanges: { dateShift?: number, date?: string, courtId?: string, startTime?: string, duration?: number },
    overrides: Record<string, { date?: string, courtId?: string, startTime?: string, duration?: number }>
  ) => {
    const predictedBookings = bookings.map(b => {
        if (!ids.includes(b.id)) return b;

        const override = overrides[b.id] || {};
        let newDate = b.date;
        if (override.date) newDate = override.date;
        else if (globalChanges.date) newDate = globalChanges.date;
        else if (globalChanges.dateShift) {
            const d = new Date(b.date);
            d.setDate(d.getDate() + globalChanges.dateShift);
            newDate = d.toISOString().split('T')[0];
        }

        const newCourtId = override.courtId || globalChanges.courtId || b.courtId;
        const newStartTime = override.startTime ? parseFloat(override.startTime) : (globalChanges.startTime ? parseFloat(globalChanges.startTime) : b.startTime);
        const newDuration = override.duration || globalChanges.duration || b.duration;

        return {
            ...b,
            date: newDate,
            courtId: newCourtId,
            startTime: newStartTime,
            duration: newDuration
        };
    });

    for (const id of ids) {
        const proposed = predictedBookings.find(b => b.id === id)!;
        const conflict = predictedBookings.find(b => {
            if (b.id === proposed.id) return false;
            if (b.paymentStatus === PaymentStatus.CANCELLED || b.paymentStatus === PaymentStatus.REFUNDED) return false;
            if (b.date !== proposed.date || b.courtId !== proposed.courtId) return false;
            return (proposed.startTime < (b.startTime + b.duration) && (proposed.startTime + proposed.duration) > b.startTime);
        });

        if (conflict) {
            return { success: false, error: `Conflict detected on ${proposed.date} at ${formatTime(proposed.startTime)} (Court: ${proposed.courtId}).` };
        }
    }

    setBookings(predictedBookings);
    return { success: true };
  };

  const handleBatchRefund = (ids: string[]) => {
     const validIds = bookings.filter(b => ids.includes(b.id) && (b.paymentStatus === PaymentStatus.PAID || b.paymentStatus === PaymentStatus.PARTIAL)).map(b => b.id);
     
     if (validIds.length === 0) return { success: false, error: "No refundable bookings selected." };

     const voucherNo = generateVoucherNumber();
     
     setBookings(prev => prev.map(b => {
        if (validIds.includes(b.id)) {
            return { ...b, paymentStatus: PaymentStatus.REFUNDED, voucherNumber: voucherNo };
        }
        return b;
     }));

     const refundedItems = bookings.filter(b => validIds.includes(b.id)).map(b => ({ ...b, paymentStatus: PaymentStatus.REFUNDED, voucherNumber: voucherNo }));
     printPaymentVoucher(refundedItems, companyProfile, getCurrencySymbol(), courts);

     return { success: true, count: validIds.length };
  };

  const handleFactoryReset = () => {
    setBookings([]);
    setCourts(INITIAL_COURTS);
    setCompanyProfile(DEFAULT_PROFILE);
    setHourlyRate(20);
    setPromotionRules([]);
    setCurrencyCode('USD');
    setUsers(INITIAL_USERS); // Reset users to default admin
    setIsActivated(false);
    localStorage.removeItem('app_activated'); // Clean activation from storage explicitly
  };

  const handleWipeData = () => {
    setBookings([]);
  };

  const handleReIndexData = () => {
    setIsReIndexOpen(true);
  };

  const performReIndex = () => {
    const sorted = [...bookings].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime - b.startTime;
    });
    const cleaned = sorted.filter(b => b.date && b.startTime !== undefined);
    setBookings(cleaned);
  };

  const handleOpenSettlement = (name?: string, phone?: string) => {
    checkAccess('manage_payments', () => {
        if (name && phone) {
           setSettleCustomer({ name, phone });
        } else {
           setSettleCustomer(undefined);
        }
        setIsSettlementModalOpen(true);
    });
  };

  const handleReconcile = (bookingIds: string[]) => {
     const now = Date.now();
     setBookings(prev => prev.map(b => {
        if (bookingIds.includes(b.id)) {
           return { ...b, isReconciled: true, paymentDate: b.paymentDate || now };
        }
        return b;
     }));
  };

  // --- USER MGMT HANDLERS ---
  const handleAddUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const handleDeleteUser = (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  };

  // --- RENDER HELPERS ---
  
  const StatCard = ({ title, value, icon: Icon, colorClass, bgClass, trend }: any) => (
     <div className="bg-white p-6 rounded-2xl shadow-lg shadow-slate-200/50 border border-slate-50 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300">
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors duration-300 ${colorClass.replace('text-', 'bg-')}`}></div>
        <div className="flex justify-between items-start pl-3">
           <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
              <h3 className="text-3xl font-light text-slate-800 tracking-tight">{value}</h3>
           </div>
           <div className={`p-3 rounded-xl ${bgClass} ${colorClass}`}>
              <Icon size={22} />
           </div>
        </div>
     </div>
  );

  // --- AUTH CHECK RENDER ---
  if (!currentUser) {
    return <LoginScreen onLogin={handleLogin} error={loginError} />;
  }

  return (
    <div className="min-h-screen bg-slate-200 text-slate-900 font-sans flex flex-col">
      
      {/* HEADER: Floating Glass Style */}
      <header className="fixed top-0 left-0 right-0 z-[200] bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm transition-all duration-300">
        <div className="max-w-[1920px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600">
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-3">
               {/* Custom Logo */}
               <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20 text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                     <path d="M12 20V13" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
                     <path d="M12 20C12 21.1 11.1 22 10 22H14C12.9 22 12 21.1 12 20Z" fill="white" fillOpacity="0.3" stroke="none"/>
                     <path d="M10 22H14C12.9 22 12 21.1 12 20" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
                     <path d="M12 13L8 4H16L12 13Z" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
                     <path d="M8 4L6 2" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
                     <path d="M16 4L18 2" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
                     <path d="M12 13L5 6" stroke="white" strokeOpacity="0.5"/>
                     <path d="M12 13L19 6" stroke="white" strokeOpacity="0.5"/>
                  </svg>
               </div>
               <div>
                  <h1 className="text-lg font-extrabold tracking-tight text-slate-900 leading-none">SmashPoint</h1>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.2em]">Court System</span>
               </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Venue Indicator */}
             <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-lg border border-slate-200">
                <Building2 size={14} className="text-slate-400" />
                <span className="text-xs font-semibold text-slate-600">{companyProfile.name}</span>
             </div>

             {/* User Indicator */}
             <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className={`w-2 h-2 rounded-full ${currentUser.role === 'admin' ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                <span className="text-xs font-bold text-slate-600 uppercase">{currentUser.name}</span>
             </div>

             {/* Trial Mode Indicator */}
             {!isActivated && (
                <div onClick={() => setIsActivationModalOpen(true)} className="hidden sm:flex items-center gap-2 bg-rose-50 border border-rose-100 text-rose-600 px-4 py-1.5 rounded-full text-xs font-bold cursor-pointer hover:bg-rose-100 transition shadow-sm hover:shadow-md">
                   <Lock size={12} /> ACTIVATE LICENSE
                </div>
             )}
             
             {/* Date Display */}
             <div className="hidden md:flex items-center gap-2 text-slate-500 text-sm font-medium bg-slate-50/50 px-4 py-2 rounded-full border border-slate-100">
                <Calendar size={14} className="text-slate-400" />
                <span>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</span>
             </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 max-w-[1920px] mx-auto w-full p-6 sm:p-8 space-y-8 mt-16">
        
        {/* STATS OVERVIEW */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
           <StatCard 
             title="Daily Bookings" 
             value={bookings.filter(b => b.date === currentDate && b.paymentStatus !== 'Cancelled').length}
             icon={Calendar}
             colorClass="text-indigo-600"
             bgClass="bg-indigo-50"
             trend={true}
           />
           <StatCard 
             title="Revenue Collected" 
             value={`${getCurrencySymbol()}${bookings
                .filter(b => b.date === currentDate && b.paymentStatus === 'Paid')
                .reduce((sum, b) => sum + b.totalAmount, 0)
                .toFixed(2)}`}
             icon={DollarSign}
             colorClass="text-emerald-600"
             bgClass="bg-emerald-50"
             trend={true}
           />
           <StatCard 
             title="Outstanding / Unpaid" 
             value={bookings.filter(b => b.date === currentDate && b.paymentStatus === 'Unpaid').length}
             icon={AlertCircle}
             colorClass="text-rose-600"
             bgClass="bg-rose-50"
           />
           <StatCard 
             title="Utilization Rate" 
             value={`${Math.round((bookings.filter(b => b.date === currentDate && b.paymentStatus !== 'Cancelled').reduce((acc, b) => acc + b.duration, 0) / (courts.length * 12)) * 100)}%`}
             icon={Activity}
             colorClass="text-amber-600"
             bgClass="bg-amber-50"
           />
        </div>

        {/* FLOATING COMMAND BAR */}
        <div className="bg-white p-4 rounded-3xl shadow-xl shadow-slate-200/60 border border-white flex flex-col xl:flex-row items-center gap-4 sticky top-20 z-[150] transition-all duration-300">
           
           {/* Date Navigator */}
           <div className="flex items-center bg-slate-50 rounded-2xl p-1 w-full xl:w-auto relative group shadow-inner">
              <button 
                onClick={() => {
                  const d = new Date(currentDate);
                  d.setDate(d.getDate() - 1);
                  setCurrentDate(d.toISOString().split('T')[0]);
                }}
                className="p-3 hover:bg-white hover:shadow-sm rounded-xl text-slate-400 hover:text-slate-800 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div className="flex-1 text-center px-6 font-bold text-slate-700 text-sm relative cursor-pointer hover:text-indigo-600 transition-colors">
                 <input 
                   type="date" 
                   value={currentDate} 
                   onChange={(e) => setCurrentDate(e.target.value)}
                   onClick={(e) => e.currentTarget.showPicker()} 
                   className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                 />
                 <span className="flex items-center justify-center gap-2 pointer-events-none">
                    {formatDate(currentDate, companyProfile.dateFormat)}
                    <ChevronDown size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                 </span>
              </div>

              <button 
                onClick={() => {
                  const d = new Date(currentDate);
                  d.setDate(d.getDate() + 1);
                  setCurrentDate(d.toISOString().split('T')[0]);
                }}
                className="p-3 hover:bg-white hover:shadow-sm rounded-xl text-slate-400 hover:text-slate-800 transition-all"
              >
                <ChevronRight size={18} />
              </button>
           </div>

           <div className="h-8 w-px bg-slate-100 hidden xl:block"></div>

           {/* View Toggles */}
           <div className="flex bg-slate-50 p-1 rounded-2xl w-full xl:w-auto shadow-inner">
              <button
                onClick={() => setViewMode('grid')}
                className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <LayoutGrid size={16} /> Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-900' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <List size={16} /> List
              </button>
           </div>

           <div className="h-8 w-px bg-slate-100 hidden xl:block"></div>

           {/* ACTIONS - Scrollable Row */}
           <div className="flex items-center gap-3 overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 hide-scrollbar xl:flex-1 xl:justify-end">
              
              <button 
                onClick={() => checkLicense(() => handleNewBooking())}
                className="h-11 min-w-[150px] bg-slate-900 hover:bg-slate-800 text-white px-6 rounded-2xl text-sm font-bold shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2 transition-all active:scale-95 hover:-translate-y-0.5"
              >
                <Plus size={18} /> New Booking
              </button>

              <button 
                onClick={() => checkLicense(() => {
                    checkAccess('manage_bookings', () => setIsSearchSlotsOpen(true))
                })}
                className="h-11 min-w-[130px] bg-white border border-slate-100 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/50 text-slate-600 px-5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Search size={16} /> Find Slot
              </button>

              <button 
                onClick={() => checkLicense(() => handleOpenSettlement())}
                className="h-11 min-w-[130px] bg-white border border-slate-100 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50/50 text-slate-600 px-5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Wallet size={16} /> Payments
              </button>

              <button 
                onClick={() => checkLicense(() => {
                    checkAccess('view_reports', () => setIsReportModalOpen(true))
                })}
                className="h-11 min-w-[130px] bg-white border border-slate-100 hover:border-emerald-200 hover:text-emerald-600 hover:bg-emerald-50/50 text-slate-600 px-5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Printer size={16} /> Reports
              </button>

              <button 
                onClick={() => checkLicense(() => {
                    checkAccess('batch_tools', () => setIsBatchAmendOpen(true))
                })}
                className="h-11 min-w-[130px] bg-white border border-slate-100 hover:border-amber-200 hover:text-amber-600 hover:bg-amber-50/50 text-slate-600 px-5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Edit3 size={16} /> Batch Tools
              </button>

              <div className="h-6 w-px bg-slate-200 mx-2"></div>

              <button 
                onClick={() => checkLicense(() => {
                    checkAccess('manage_payments', () => setIsCashCollectionOpen(true))
                })}
                className="h-11 w-11 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center transition-all shadow-sm"
                title="Cash Reconciliation"
              >
                <Coins size={20} />
              </button>
              
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="h-11 min-w-[100px] bg-white border border-slate-100 hover:border-slate-300 text-slate-600 px-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <Menu size={16} /> Menu
              </button>
           </div>
        </div>

        {/* VIEW AREA */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
          {viewMode === 'grid' ? (
            <BookingGrid 
              bookings={bookings} 
              courts={courts} 
              currentDate={currentDate}
              onSlotClick={handleSlotClick}
              onBookingClick={handleEditBooking}
              currencySymbol={getCurrencySymbol()}
              defaultHourlyRate={hourlyRate}
              companyProfile={companyProfile}
            />
          ) : (
            <BookingList 
              bookings={bookings} 
              courts={courts}
              onEdit={handleEditBooking}
              onDelete={handleDeleteBooking}
              currentDate={currentDate}
              currencySymbol={getCurrencySymbol()}
              defaultHourlyRate={hourlyRate}
              companyProfile={companyProfile}
              currentUser={currentUser}
            />
          )}
        </div>
      </main>

      <footer className="mt-auto py-10 bg-white border-t border-slate-100 text-slate-500">
        <div className="max-w-[1920px] mx-auto px-8 md:pr-32 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
           <div className="text-left">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-2">
                 <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-slate-900 rounded-md flex items-center justify-center text-white shadow-sm">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                       <path d="M12 20V13" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
                       <path d="M12 20C12 21.1 11.1 22 10 22H14C12.9 22 12 21.1 12 20Z" fill="white" fillOpacity="0.3" stroke="none"/>
                       <path d="M10 22H14C12.9 22 12 21.1 12 20" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
                       <path d="M12 13L8 4H16L12 13Z" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
                       <path d="M8 4L6 2" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
                       <path d="M16 4L18 2" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
                       <path d="M12 13L5 6" stroke="white" strokeOpacity="0.5"/>
                       <path d="M12 13L19 6" stroke="white" strokeOpacity="0.5"/>
                    </svg>
                 </div>
                 SmashPoint Court System
              </h3>
              <p className="text-xs">
                 Copyright © {new Date().getFullYear()} NEOTECH. All Rights Reserved.
              </p>
              <p className="text-[10px] mt-2 text-slate-400 max-w-lg leading-relaxed">
                 Unauthorized reproduction or distribution of this program, or any portion of it, may result in severe civil and criminal penalties, and will be prosecuted to the maximum extent possible under the law.
              </p>
           </div>
           
           <div className="text-left md:text-right text-xs bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="mb-2 font-bold text-slate-800 uppercase tracking-widest text-[10px]">Technical Support</div>
              <p className="mb-1 flex items-center gap-2 md:justify-end">
                 <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span> 
                 <span className="font-mono text-slate-700">011-6785 0766</span>
              </p>
              <p className="flex items-center gap-2 md:justify-end">
                 <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                 <a href="mailto:andrew@neotechkk.com" className="text-indigo-600 hover:underline">andrew@neotechkk.com</a>
              </p>
           </div>
        </div>
      </footer>

      {/* --- MODALS --- */}
      
      <BookingModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveBooking}
        onCancel={editingBooking ? handleCancelBooking : undefined}
        onRefund={editingBooking ? handleRefundBooking : undefined}
        onOpenSettlement={handleOpenSettlement}
        initialDate={modalDefaults?.date || currentDate}
        initialTime={modalDefaults?.time}
        initialCourtId={modalDefaults?.courtId}
        initialDuration={modalDefaults?.duration}
        initialSlots={modalDefaults?.slots} // Pass slots here
        existingBooking={editingBooking}
        allBookings={bookings}
        courts={courts}
        hourlyRate={hourlyRate}
        promotionRules={promotionRules}
        currencySymbol={getCurrencySymbol()}
        companyProfile={companyProfile}
        currentUser={currentUser}
      />

      <CourtSettingsModal
        isOpen={isCourtSettingsOpen}
        onClose={() => setIsCourtSettingsOpen(false)}
        courts={courts}
        setCourts={setCourts}
        currency={currencyCode}
        setCurrency={setCurrencyCode}
        companyProfile={companyProfile}
        setCompanyProfile={setCompanyProfile}
        hourlyRate={hourlyRate}
        setHourlyRate={setHourlyRate}
        promotionRules={promotionRules}
        setPromotionRules={setPromotionRules}
        bookings={bookings}
        setBookings={setBookings}
        onFactoryReset={handleFactoryReset}
        isActivated={isActivated}
      />

      <ReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        bookings={bookings}
        courts={courts}
        companyProfile={companyProfile}
        currencySymbol={getCurrencySymbol()}
        initialDate={currentDate}
        currentUser={currentUser}
      />

      <SettlementModal 
        isOpen={isSettlementModalOpen}
        onClose={() => setIsSettlementModalOpen(false)}
        bookings={bookings}
        courts={courts}
        customerName={settleCustomer?.name}
        customerPhone={settleCustomer?.phone}
        onSettle={handleBulkSettle}
        currencySymbol={getCurrencySymbol()}
        companyProfile={companyProfile}
        currentUser={currentUser}
      />

      <BatchAmendModal 
        isOpen={isBatchAmendOpen}
        onClose={() => setIsBatchAmendOpen(false)}
        bookings={bookings}
        courts={courts}
        companyProfile={companyProfile}
        currencySymbol={getCurrencySymbol()}
        onBatchUpdate={handleBatchAmend}
        onBatchRefund={handleBatchRefund}
      />

      <BackupRestoreModal 
        isOpen={isBackupRestoreOpen}
        onClose={() => setIsBackupRestoreOpen(false)}
        bookings={bookings}
        setBookings={setBookings}
        courts={courts}
        setCourts={setCourts}
        companyProfile={companyProfile}
        setCompanyProfile={setCompanyProfile}
        currency={currencyCode}
        setCurrency={setCurrencyCode}
        hourlyRate={hourlyRate}
        setHourlyRate={setHourlyRate}
        promotionRules={promotionRules}
        setPromotionRules={setPromotionRules}
        onFactoryReset={handleFactoryReset}
        onWipeData={handleWipeData}
        initialAction={backupModalMode === 'wipe' ? 'wipe' : undefined}
      />

      <SearchSlotsModal 
        isOpen={isSearchSlotsOpen}
        onClose={() => setIsSearchSlotsOpen(false)}
        bookings={bookings}
        courts={courts}
        companyProfile={companyProfile}
        currencySymbol={getCurrencySymbol()}
        onBookSlot={handleBookFromSearch}
      />

      <ActivationModal 
        isOpen={isActivationModalOpen}
        onClose={() => setIsActivationModalOpen(false)}
        onActivate={handleActivateApp}
      />

      <CashCollectionModal 
        isOpen={isCashCollectionOpen}
        onClose={() => setIsCashCollectionOpen(false)}
        bookings={bookings}
        companyProfile={companyProfile}
        currencySymbol={getCurrencySymbol()}
        onMarkReconciled={handleReconcile}
        currentUser={currentUser}
      />

      <ReIndexModal 
        isOpen={isReIndexOpen}
        onClose={() => setIsReIndexOpen(false)}
        onComplete={performReIndex}
      />

      <UserManagementModal 
        isOpen={isUserManagementOpen}
        onClose={() => setIsUserManagementOpen(false)}
        users={users}
        onAddUser={handleAddUser}
        onUpdateUser={handleUpdateUser}
        onDeleteUser={handleDeleteUser}
        currentUser={currentUser}
      />

      <SidebarMenu 
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        companyProfile={companyProfile}
        currentUser={currentUser}
        onNewBooking={() => checkLicense(() => handleNewBooking())}
        onOpenReports={() => checkLicense(() => {
            checkAccess('view_reports', () => setIsReportModalOpen(true))
        })}
        onOpenSettings={() => checkLicense(() => {
            checkAccess('manage_settings', () => setIsCourtSettingsOpen(true))
        })}
        onOpenBatchAmend={() => checkLicense(() => {
            checkAccess('batch_tools', () => setIsBatchAmendOpen(true))
        })}
        onOpenBackupRestore={() => checkLicense(() => {
            checkAccess('system_maintenance', () => {
                setBackupModalMode('default'); setIsBackupRestoreOpen(true);
            })
        })}
        onWipeData={() => checkLicense(() => { 
            checkAccess('system_maintenance', () => {
                setBackupModalMode('wipe'); setIsBackupRestoreOpen(true); 
            })
        })}
        onFactoryReset={() => checkLicense(() => { 
            checkAccess('system_maintenance', () => {
                setBackupModalMode('default'); setIsBackupRestoreOpen(true); 
            })
        })}
        onReIndexData={() => checkLicense(() => {
            checkAccess('system_maintenance', () => handleReIndexData())
        })}
        isActivated={isActivated}
        onOpenActivation={() => setIsActivationModalOpen(true)}
        onOpenUserManagement={() => {
            if (currentUser?.role === 'admin') setIsUserManagementOpen(true);
        }}
        onLogout={handleLogout}
      />

      <AIAssistant 
        bookings={bookings}
        courts={courts}
        currentDate={currentDate}
        companyProfile={companyProfile}
      />

    </div>
  );
}

export default App;
