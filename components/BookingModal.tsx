import React, { useState, useEffect } from 'react';
import { X, Save, Clock, User, Phone, AlertCircle, Calculator, Home, Printer, Plus, Trash2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check, Ban, RotateCcw, Wallet, Lock } from 'lucide-react';
import { Booking, BookingFormData, PaymentStatus, Court, CompanyProfile, BookingSlot, PromotionRule, User as UserType } from '../types';
import { HOURS, formatTime, formatDate } from '../constants';
import { printBookingReceipt, printPaymentVoucher } from '../utils/printReceipt';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: BookingFormData) => { success: boolean; conflict?: Booking; bookings?: Booking[] };
  onCancel?: (id: string) => void;
  onRefund?: (id: string) => Booking | undefined; // Return updated booking for printing
  onOpenSettlement?: (name: string, phone: string) => void; 
  initialDate: string;
  initialTime?: number;
  initialCourtId?: string;
  initialDuration?: number;
  initialSlots?: BookingSlot[]; // Added support for multiple slots initialization
  existingBooking?: Booking | null;
  allBookings: Booking[];
  courts: Court[];
  hourlyRate: number;
  promotionRules?: PromotionRule[];
  currencySymbol: string;
  companyProfile: CompanyProfile;
  currentUser?: UserType | null;
}

const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onCancel,
  onRefund,
  onOpenSettlement,
  initialDate,
  initialTime,
  initialCourtId,
  initialDuration = 1,
  initialSlots,
  existingBooking,
  allBookings,
  courts,
  hourlyRate,
  promotionRules = [],
  currencySymbol,
  companyProfile,
  currentUser
}) => {
  // Modes
  const [bookingMode, setBookingMode] = useState<'single' | 'multi'>('single');

  // Common Data
  const [formData, setFormData] = useState<{
    customerName: string;
    phoneNumber: string;
    residentUnitNo: string;
    date: string;
    paymentStatus: PaymentStatus;
    notes: string;
    paidAmount: number;
  }>({
    customerName: '',
    phoneNumber: '',
    residentUnitNo: '',
    date: initialDate,
    paymentStatus: PaymentStatus.UNPAID,
    notes: '',
    paidAmount: 0
  });

  // Multi-Date State
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Slots State (for multiple bookings)
  const [slots, setSlots] = useState<BookingSlot[]>([]);

  const [conflict, setConflict] = useState<Booking | null>(null);
  
  // Safety state for cancel/refund buttons
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showRefundConfirm, setShowRefundConfirm] = useState(false);

  // Lock logic: If existing booking is fully PAID, prevent editing details
  const isLocked = existingBooking?.paymentStatus === PaymentStatus.PAID;

  useEffect(() => {
    if (isOpen) {
      setConflict(null);
      setBookingMode('single');
      
      // Fix: Parse initialDate string manually to avoid timezone shift in calendar
      const [y, m, d] = initialDate.split('-').map(Number);
      setCalendarMonth(new Date(y, m - 1, d)); // Months are 0-indexed

      setShowCancelConfirm(false);
      setShowRefundConfirm(false);
      
      if (existingBooking) {
        // Edit Mode: Load single existing booking as 1 slot
        setFormData({
          customerName: existingBooking.customerName,
          phoneNumber: existingBooking.phoneNumber,
          residentUnitNo: existingBooking.residentUnitNo || '',
          date: existingBooking.date,
          paymentStatus: existingBooking.paymentStatus,
          notes: existingBooking.notes || '',
          paidAmount: existingBooking.paidAmount || 0
        });
        setSlots([{
          courtId: existingBooking.courtId,
          startTime: existingBooking.startTime.toString(),
          duration: existingBooking.duration
        }]);
        setSelectedDates([existingBooking.date]);
      } else {
        // New Booking Mode
        setFormData({
          customerName: '',
          phoneNumber: '',
          residentUnitNo: '',
          date: initialDate,
          paymentStatus: PaymentStatus.UNPAID,
          notes: '',
          paidAmount: 0
        });

        // Initialize slots from prop (if multi-select search) or single slot default
        if (initialSlots && initialSlots.length > 0) {
           setSlots(initialSlots.map(s => ({
             courtId: s.courtId,
             startTime: s.startTime.toString(),
             duration: s.duration
           })));
        } else {
           setSlots([{
             courtId: initialCourtId || (courts[0]?.id || ''),
             startTime: initialTime !== undefined ? initialTime.toString() : '10',
             duration: initialDuration
           }]);
        }
        
        // Fix: Initialize selectedDates as empty for new bookings.
        setSelectedDates([]);
      }
    }
  }, [isOpen, existingBooking, initialDate, initialTime, initialCourtId, initialDuration, initialSlots, courts]);

  // Clear conflict error when details change
  useEffect(() => {
    setConflict(null);
  }, [formData.date, slots, selectedDates, bookingMode]);

  if (!isOpen) return null;

  const handleSlotChange = (index: number, field: keyof BookingSlot, value: any) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
  };

  const addSlot = () => {
    const lastSlot = slots[slots.length - 1];
    setSlots([...slots, { ...lastSlot }]); 
  };

  const removeSlot = (index: number) => {
    if (slots.length > 1) {
      setSlots(slots.filter((_, i) => i !== index));
    }
  };

  // --- Calendar Logic ---
  const toggleDate = (dateStr: string) => {
    if (isLocked) return;
    if (selectedDates.includes(dateStr)) {
      setSelectedDates(prev => prev.filter(d => d !== dateStr));
    } else {
      setSelectedDates(prev => [...prev, dateStr].sort());
    }
  };

  const changeMonth = (delta: number) => {
    const newDate = new Date(calendarMonth);
    newDate.setDate(1); // Fix: Reset to 1st to prevent skipping months like Feb
    newDate.setMonth(newDate.getMonth() + delta);
    setCalendarMonth(newDate);
  };

  const renderCalendar = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); 

    const days = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="h-8 w-8" />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = selectedDates.includes(dateStr);
      days.push(
        <button
          key={dateStr}
          type="button"
          disabled={isLocked}
          onClick={() => toggleDate(dateStr)}
          className={`h-8 w-8 rounded-full text-xs font-medium flex items-center justify-center transition-all ${
            isSelected 
              ? 'bg-emerald-600 text-white shadow-md scale-110' 
              : isLocked ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-emerald-50'
          }`}
        >
          {d}
        </button>
      );
    }

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 w-full">
        <div className="flex items-center justify-between mb-2">
          <button type="button" onClick={() => changeMonth(-1)} className="p-1 hover:bg-gray-100 rounded">
            <ChevronLeft size={16} className="text-gray-500" />
          </button>
          <span className="text-sm font-semibold text-slate-700">
            {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button type="button" onClick={() => changeMonth(1)} className="p-1 hover:bg-gray-100 rounded">
            <ChevronRight size={16} className="text-gray-500" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
            <div key={d} className="text-[10px] text-gray-400 font-bold uppercase">{d}</div>
          ))}
          {days}
        </div>
        
        {/* Selected Dates Summary Chips */}
        <div className="mt-3 pt-3 border-t border-gray-100">
           <div className="flex justify-between items-center mb-1">
             <span className="text-xs font-semibold text-gray-500">Selected Dates ({selectedDates.length})</span>
             {selectedDates.length > 0 && !isLocked && (
                <button type="button" onClick={() => setSelectedDates([])} className="text-xs text-red-500 hover:text-red-600">Clear All</button>
             )}
           </div>
           <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto custom-scrollbar">
              {selectedDates.length === 0 ? (
                 <span className="text-xs text-gray-400 italic">No dates selected</span>
              ) : (
                selectedDates.map(date => (
                  <div key={date} className="bg-emerald-50 text-emerald-800 text-xs px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-100">
                    {formatDate(date, companyProfile.dateFormat)}
                    {!isLocked && <button type="button" onClick={() => toggleDate(date)} className="hover:text-red-500 transition-colors"><X size={12}/></button>}
                  </div>
                ))
              )}
           </div>
        </div>
      </div>
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return; // Prevent submission if locked

    const datesToSubmit = bookingMode === 'multi' ? selectedDates : [formData.date];
    if (datesToSubmit.length === 0) {
      alert("Please select at least one date.");
      return;
    }

    const finalData: BookingFormData = {
      ...formData,
      selectedDates: datesToSubmit,
      slots: slots,
      courtId: slots[0].courtId,
      startTime: slots[0].startTime,
      duration: slots[0].duration
    };

    const result = onSubmit(finalData);
    
    if (result.success && result.bookings && result.bookings.length > 0) {
      // Auto Print Receipt on Success
      const newBookings = result.bookings;
      printBookingReceipt(newBookings[0], allBookings, courts, companyProfile, currencySymbol, newBookings, currentUser?.name);
      onClose();
    } else if (result.conflict) {
      setConflict(result.conflict);
    }
  };

  const handlePrint = () => {
    if (!existingBooking) return;
    printBookingReceipt(existingBooking, allBookings, courts, companyProfile, currencySymbol, [existingBooking], currentUser?.name);
  };
  
  const handlePrintVoucher = () => {
    if (!existingBooking) return;
    printPaymentVoucher(existingBooking, companyProfile, currencySymbol, courts, currentUser?.name);
  };

  const handleConfirmRefund = () => {
    if(onRefund && existingBooking) {
      const updatedBooking = onRefund(existingBooking.id);
      if (updatedBooking) {
        printPaymentVoucher(updatedBooking, companyProfile, currencySymbol, courts, currentUser?.name);
      }
    }
  };

  // Smart Price Calculation
  const calculateTotal = () => {
    let slotTotal = 0;
    
    slots.forEach(slot => {
      const start = parseFloat(slot.startTime);
      const duration = slot.duration;
      
      // We calculate step by step for promo logic
      for (let i = 0; i < duration; i += 0.5) {
        const currentSegment = start + i;
        const promo = promotionRules.find(p => p.isActive && currentSegment >= p.startTime && currentSegment < p.endTime);
        
        // Add half of the hourly rate (since we step by 0.5)
        slotTotal += promo ? (promo.rate / 2) : (hourlyRate / 2);
      }
    });

    const numDays = bookingMode === 'multi' ? selectedDates.length : 1;
    return slotTotal * (numDays || 0);
  };

  const totalAmount = calculateTotal();

  const handleSettleAccount = () => {
    if (onOpenSettlement && formData.customerName && formData.phoneNumber) {
      onOpenSettlement(formData.customerName, formData.phoneNumber);
    }
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {existingBooking ? 'Edit Booking' : 'New Reservation'}
          </h2>
          <div className="flex items-center gap-2">
            {existingBooking && (
              <>
                {existingBooking.paymentStatus === PaymentStatus.REFUNDED ? (
                  <button 
                    onClick={handlePrintVoucher}
                    className="hover:bg-slate-700 p-1.5 rounded-full transition text-purple-400"
                    title="Print Refund Payment Voucher"
                  >
                    <Printer size={18} />
                  </button>
                ) : (
                  <button 
                    onClick={handlePrint}
                    className="hover:bg-slate-700 p-1.5 rounded-full transition text-emerald-400"
                    title="Print Official Receipt"
                  >
                    <Printer size={18} />
                  </button>
                )}
              </>
            )}
            <button onClick={onClose} className="hover:bg-slate-700 p-1 rounded-full transition">
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          
          {/* Locked Alert */}
          {isLocked && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3 animate-in fade-in">
              <Lock className="text-blue-600 shrink-0" size={18} />
              <div className="text-sm text-blue-800 font-bold">
                Booking is Fully Paid. Details are locked.
              </div>
            </div>
          )}

          {/* Conflict Alert */}
          {conflict && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-red-800">
                <p className="font-bold">Court already being booked by the customer.</p>
                <p className="mt-1">
                  On <span className="font-semibold">{formatDate(conflict.date, companyProfile.dateFormat)}</span>:
                </p>
                <div className="bg-white/50 rounded p-1 mt-1 border border-red-100">
                  <p className="font-semibold">{conflict.customerName}</p>
                  <p className="text-xs opacity-90">{conflict.phoneNumber}</p>
                  <p className="text-xs mt-0.5 font-medium">
                    {formatTime(conflict.startTime, companyProfile.timeFormat)} - {formatTime(conflict.startTime + conflict.duration, companyProfile.timeFormat)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Customer Info Section */}
          <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Customer Details</h3>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <User size={16} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Customer Name"
                    required
                    disabled={isLocked}
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    className={`w-full pl-9 border rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 p-2 ${conflict ? 'border-red-300 bg-red-50' : 'border-gray-200'} ${isLocked ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                  />
                </div>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    required
                    disabled={isLocked}
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                    className={`w-full pl-9 border-gray-200 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 border p-2 ${isLocked ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                  />
                </div>
             </div>
             <div className="relative">
                <Home size={16} className="absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Resident Unit No. (Optional)"
                  disabled={isLocked}
                  value={formData.residentUnitNo}
                  onChange={(e) => setFormData({...formData, residentUnitNo: e.target.value})}
                  className={`w-full pl-9 border-gray-200 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 border p-2 ${isLocked ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                />
              </div>
          </div>

          {/* Mode Selection */}
          {!existingBooking && (
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => setBookingMode('single')}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${bookingMode === 'single' ? 'bg-white shadow text-slate-800' : 'text-gray-500'}`}
              >
                Single Date
              </button>
              <button
                type="button"
                onClick={() => setBookingMode('multi')}
                className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${bookingMode === 'multi' ? 'bg-white shadow text-slate-800' : 'text-gray-500'}`}
              >
                Multi-Date / Monthly
              </button>
            </div>
          )}

          {/* Date Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Date Selection</label>
            {bookingMode === 'single' ? (
              <input
                type="date"
                required
                disabled={isLocked}
                value={formData.date}
                onChange={(e) => setFormData({...formData, date: e.target.value})}
                className={`w-full border-gray-200 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 border p-2 ${isLocked ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
              />
            ) : (
              <div className="space-y-2 animate-in fade-in zoom-in duration-200">
                {renderCalendar()}
              </div>
            )}
          </div>

          {/* Slots Management */}
          <div className="space-y-3">
             <div className="flex justify-between items-center">
                <label className="block text-xs font-medium text-gray-500">
                  {bookingMode === 'multi' ? 'Time Slots (Applied to all dates)' : 'Court & Time Selection'}
                </label>
                {!existingBooking && (
                  <button 
                    type="button" 
                    onClick={addSlot}
                    className="text-xs flex items-center gap-1 text-emerald-600 font-medium hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded transition-colors"
                  >
                    <Plus size={14} /> Add Court
                  </button>
                )}
             </div>

             <div className="space-y-2">
               {slots.map((slot, index) => (
                 <div key={index} className="flex flex-col sm:flex-row gap-2 items-start sm:items-center bg-white p-2 border border-gray-200 rounded-lg shadow-sm relative group">
                    <div className="flex-1 w-full sm:w-auto">
                      <select
                        value={slot.courtId}
                        disabled={isLocked}
                        onChange={(e) => handleSlotChange(index, 'courtId', e.target.value)}
                        className={`w-full border-gray-200 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500 border p-1.5 bg-gray-50/50 font-medium ${isLocked ? 'cursor-not-allowed text-gray-500' : ''}`}
                      >
                        {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="w-full sm:w-32 relative">
                       <Clock size={14} className="absolute left-2 top-2 text-gray-400" />
                       <select
                          value={slot.startTime}
                          disabled={isLocked}
                          onChange={(e) => handleSlotChange(index, 'startTime', e.target.value)}
                          className={`w-full pl-7 border-gray-200 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500 border p-1.5 ${isLocked ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                        >
                          {HOURS.map(h => (
                            <option key={h} value={h}>{formatTime(h, companyProfile.timeFormat)}</option>
                          ))}
                        </select>
                    </div>
                    <div className="w-full sm:w-28 flex items-center gap-2">
                       <input
                          type="number"
                          min="0.5"
                          max="24"
                          step="0.5" 
                          disabled={isLocked}
                          value={slot.duration}
                          onChange={(e) => handleSlotChange(index, 'duration', parseFloat(e.target.value) || 0.5)}
                          className={`w-full border-gray-200 rounded-md text-sm focus:ring-emerald-500 focus:border-emerald-500 border p-1.5 text-center ${isLocked ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
                        />
                        <span className="text-xs text-gray-400">hr(s)</span>
                    </div>

                    {!existingBooking && slots.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => removeSlot(index)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded absolute -right-2 -top-2 sm:static sm:block shadow-sm sm:shadow-none bg-white border sm:border-none border-gray-100"
                        title="Remove slot"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                 </div>
               ))}
             </div>
          </div>

          {/* Price Summary Box */}
          <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between border border-slate-100">
            <div className="text-sm text-slate-500">
              <span className="font-medium text-slate-700">Total Due:</span> 
              <div className="text-xs mt-0.5 text-gray-400">
                {bookingMode === 'multi' ? (
                  <span>{selectedDates.length} days × {slots.length} slots</span>
                ) : (
                  <span>{slots.length} slot(s)</span>
                )}
              </div>
            </div>
            <div className="text-xl font-bold text-slate-800 flex items-center gap-1">
              <span className="text-sm font-normal text-gray-400">{currencySymbol}</span>
              {totalAmount.toFixed(2)}
            </div>
          </div>

          {/* Payment */}
          <div className="space-y-3">
            <label className="block text-xs font-medium text-gray-500 mb-1">Payment Status</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(PaymentStatus).filter(s => s !== PaymentStatus.CANCELLED && s !== PaymentStatus.REFUNDED).map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={isLocked}
                  onClick={() => setFormData({...formData, paymentStatus: status})}
                  className={`text-xs py-2 rounded-lg border transition-all ${
                    formData.paymentStatus === status
                      ? 'bg-slate-800 text-white border-slate-800'
                      : isLocked ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            
            {(formData.paymentStatus === PaymentStatus.CANCELLED || formData.paymentStatus === PaymentStatus.REFUNDED) && (
              <div className={`text-center p-2 rounded border text-xs font-bold uppercase ${formData.paymentStatus === PaymentStatus.REFUNDED ? 'bg-purple-100 text-purple-600 border-purple-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                Currently: {formData.paymentStatus}
              </div>
            )}

            {formData.paymentStatus === PaymentStatus.PARTIAL && (
              <div className="animate-in fade-in slide-in-from-top-2 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-blue-600 mb-1 flex items-center gap-1">
                    <Calculator size={12} /> Total Partial Amount Paid
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500 text-sm">{currencySymbol}</span>
                    <input 
                      type="number"
                      min="0"
                      max={totalAmount}
                      disabled={isLocked}
                      value={formData.paidAmount}
                      onChange={(e) => setFormData({...formData, paidAmount: parseFloat(e.target.value) || 0})}
                      className={`w-full pl-8 pr-3 py-2 border border-blue-200 rounded-lg text-sm focus:ring-blue-500 focus:border-blue-500 bg-blue-50/50 ${isLocked ? 'cursor-not-allowed' : ''}`}
                      placeholder="Enter amount paid"
                    />
                    <div className="absolute right-3 top-2 text-xs text-gray-400">
                      of {currencySymbol}{totalAmount.toFixed(2)}
                    </div>
                  </div>
                </div>

                {existingBooking && (
                   <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-3 flex items-center justify-between shadow-sm">
                      <div>
                         <div className="text-[10px] uppercase font-bold text-blue-400 tracking-wider">Outstanding Balance</div>
                         <div className="text-lg font-bold text-slate-800 flex items-center">
                            {currencySymbol}{(totalAmount - (formData.paidAmount || 0)).toFixed(2)}
                         </div>
                      </div>
                      <button 
                        type="button"
                        onClick={handleSettleAccount}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
                      >
                         <Wallet size={14} /> Settle Account
                      </button>
                   </div>
                )}
              </div>
            )}
          </div>

          <textarea
            placeholder="Additional notes..."
            disabled={isLocked}
            value={formData.notes}
            onChange={(e) => setFormData({...formData, notes: e.target.value})}
            className={`w-full border-gray-200 rounded-lg text-sm focus:ring-emerald-500 focus:border-emerald-500 border p-2 h-20 resize-none ${isLocked ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`}
          />

          <div className="flex gap-2 mt-4">
             {existingBooking && (
                <>
                  {showCancelConfirm ? (
                    <button 
                      type="button" 
                      onClick={() => onCancel && onCancel(existingBooking.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors animate-in fade-in"
                    >
                       <Check size={18} /> Confirm
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => { setShowCancelConfirm(true); setShowRefundConfirm(false); }}
                      className="flex-1 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 font-medium py-2.5 rounded-lg border border-red-200 flex items-center justify-center gap-2 transition-colors"
                    >
                       <Ban size={18} /> Cancel
                    </button>
                  )}

                  {(existingBooking.paymentStatus === PaymentStatus.PAID || existingBooking.paymentStatus === PaymentStatus.PARTIAL) && (
                    showRefundConfirm ? (
                      <button 
                        type="button" 
                        onClick={handleConfirmRefund}
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors animate-in fade-in"
                      >
                         <Check size={18} /> Confirm
                      </button>
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => { setShowRefundConfirm(true); setShowCancelConfirm(false); }}
                        className="flex-1 bg-purple-50 text-purple-600 hover:bg-purple-100 hover:text-purple-700 font-medium py-2.5 rounded-lg border border-purple-200 flex items-center justify-center gap-2 transition-colors"
                      >
                         <RotateCcw size={18} /> Refund
                      </button>
                    )
                  )}
                </>
             )}
             
             {!isLocked && (
               <button
                 type="submit"
                 className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors"
               >
                 <Save size={18} />
                 {existingBooking ? 'Update & Print' : 'Confirm & Print'}
               </button>
             )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;