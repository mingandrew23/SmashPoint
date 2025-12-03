
import React, { useState, useMemo, useEffect } from 'react';
import { X, Search, Calendar, Clock, Edit3, Save, CheckSquare, Square, AlertCircle, ChevronLeft, ChevronRight, Wallet, RotateCcw, Check } from 'lucide-react';
import { Booking, Court, CompanyProfile, PaymentStatus } from '../types';
import { formatTime, formatDate, HOURS } from '../constants';

interface BatchAmendModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  courts: Court[];
  companyProfile: CompanyProfile;
  currencySymbol: string;
  onBatchUpdate: (
    ids: string[], 
    globalChanges: { dateShift?: number, date?: string, courtId?: string, startTime?: string, duration?: number },
    overrides: Record<string, { date?: string, courtId?: string, startTime?: string, duration?: number }>
  ) => { success: boolean, error?: string };
  onBatchRefund: (ids: string[]) => { success: boolean, error?: string, count?: number };
}

const BatchAmendModal: React.FC<BatchAmendModalProps> = ({
  isOpen,
  onClose,
  bookings,
  courts,
  companyProfile,
  currencySymbol,
  onBatchUpdate,
  onBatchRefund
}) => {
  // Action Mode: Amend vs Refund
  const [actionType, setActionType] = useState<'amend' | 'refund'>('amend');

  // Filter Mode
  const [filterMode, setFilterMode] = useState<'search' | 'calendar'>('search');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Calendar Filter State
  const [filterDates, setFilterDates] = useState<string[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Edit States (Global)
  const [dateMode, setDateMode] = useState<'fixed' | 'shift' | 'pick'>('shift');
  const [newDate, setNewDate] = useState('');
  const [dateShift, setDateShift] = useState<number | ''>('');
  
  // Target Dates (for Pick Mode)
  const [targetDates, setTargetDates] = useState<string[]>([]);
  const [targetCalendarMonth, setTargetCalendarMonth] = useState(new Date());
  
  const [newCourtId, setNewCourtId] = useState('');
  const [newStartTime, setNewStartTime] = useState('');
  const [newDuration, setNewDuration] = useState('');

  // Row Overrides State
  const [overrides, setOverrides] = useState<Record<string, { date?: string, courtId?: string, startTime?: string, duration?: number }>>({});
  const [editRowId, setEditRowId] = useState<string | null>(null);

  // Success Overlay
  const [successMessage, setSuccessMessage] = useState('');

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setActionType('amend');
      setSelectedIds(new Set());
      setOverrides({});
      setSuccessMessage('');
      setTargetDates([]);
      setDateMode('shift');
      setDateShift('');
      setNewDate('');
      setFilterDates([]);
      setSearchTerm('');
      
      // Fix calendar initialization to avoid timezone shift
      const today = new Date();
      const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      setCalendarMonth(localToday);
      setTargetCalendarMonth(localToday);
    }
  }, [isOpen]);

  // --- FILTER LOGIC ---
  const toggleFilterDate = (dateStr: string) => {
    if (filterDates.includes(dateStr)) {
      setFilterDates(prev => prev.filter(d => d !== dateStr));
    } else {
      setFilterDates(prev => [...prev, dateStr]);
    }
  };

  const filteredBookings = useMemo(() => {
    let list = bookings.filter(b => b.paymentStatus !== PaymentStatus.CANCELLED && b.paymentStatus !== PaymentStatus.REFUNDED);

    if (filterMode === 'search') {
      if (!searchTerm) return [];
      const lower = searchTerm.toLowerCase();
      list = list.filter(b => 
        b.customerName.toLowerCase().includes(lower) || 
        b.phoneNumber.includes(lower) || 
        (b.batchId && b.batchId.toLowerCase().includes(lower)) ||
        (b.receiptNumber && b.receiptNumber.toLowerCase().includes(lower))
      );
    } else {
      // Calendar Mode
      if (filterDates.length === 0) return [];
      list = list.filter(b => filterDates.includes(b.date));
    }

    return list.sort((a, b) => a.date.localeCompare(b.date) || a.startTime - b.startTime);
  }, [bookings, filterMode, searchTerm, filterDates]);

  // --- SELECTION ---
  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredBookings.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredBookings.map(b => b.id)));
    }
  };

  // --- CALENDAR RENDERER ---
  const renderGenericCalendar = (
    currentMonth: Date, 
    setMonth: React.Dispatch<React.SetStateAction<Date>>,
    selectedDates: string[],
    toggleDate: (d: string) => void,
    indicators: string[] = [] // Dates that have bookings (dots)
  ) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const changeMonth = (delta: number) => {
      const newDate = new Date(currentMonth);
      newDate.setDate(1); // Reset to 1st to prevent skipping months
      newDate.setMonth(newDate.getMonth() + delta);
      setMonth(newDate);
    };

    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} />);

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr: string = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isSelected = selectedDates.includes(dateStr);
      const hasIndicator = indicators.includes(dateStr);

      days.push(
        <button
          key={dateStr}
          onClick={() => toggleDate(dateStr)}
          className={`h-7 w-7 rounded-full text-xs flex items-center justify-center relative ${
            isSelected ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-indigo-50 text-gray-700'
          }`}
        >
          {d}
          {hasIndicator && !isSelected && (
            <span className="absolute bottom-0.5 w-1 h-1 bg-emerald-500 rounded-full"></span>
          )}
        </button>
      );
    }

    return (
      <div className="bg-white border rounded-lg p-2">
        <div className="flex justify-between items-center mb-2">
           <button onClick={() => changeMonth(-1)}><ChevronLeft size={16}/></button>
           <span className="text-xs font-bold">{currentMonth.toLocaleDateString('en-US', {month: 'short', year: 'numeric'})}</span>
           <button onClick={() => changeMonth(1)}><ChevronRight size={16}/></button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-gray-400 font-bold mb-1">
           {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
           {days}
        </div>
      </div>
    );
  };

  // --- ACTIONS ---
  const handleUpdate = () => {
    if (selectedIds.size === 0) return;

    // Validation for Pick Dates Mode
    if (dateMode === 'pick') {
      const selectedBookingsList = bookings.filter(b => selectedIds.has(b.id));
      const uniqueOriginalDays = Array.from(new Set(selectedBookingsList.map(b => b.date))).sort();
      
      if (targetDates.length !== uniqueOriginalDays.length) {
        alert(`Mismatch: You selected bookings from ${uniqueOriginalDays.length} unique days, but picked ${targetDates.length} new target dates.`);
        return;
      }
    }

    const globalChanges: { dateShift?: number; date?: string; courtId?: string; startTime?: string; duration?: number } = {};
    
    if (dateMode === 'fixed' && newDate) globalChanges.date = newDate;
    if (dateMode === 'shift' && dateShift !== '') {
        // Safe conversion to number to avoid type errors
        globalChanges.dateShift = Number(dateShift);
    }
    
    // Pick Mode Logic: Map unique sorted original dates to unique sorted target dates
    const computedOverrides = { ...overrides };
    
    if (dateMode === 'pick' && targetDates.length > 0) {
       const selectedBookingsList = bookings.filter(b => selectedIds.has(b.id));
       // Use explicit generic for Array.from to prevent 'unknown' inference
       const uniqueOriginalDays = Array.from<string>(new Set(selectedBookingsList.map(b => b.date))).sort();
       const sortedTargets = [...targetDates].sort();

       // Map old date -> new date
       const dateMap = new Map<string, string>();
       uniqueOriginalDays.forEach((originalDate, index) => {
         const target = sortedTargets[index];
         if (typeof target === 'string') {
            dateMap.set(originalDate, target);
         }
       });

       // Apply to overrides
       selectedBookingsList.forEach(b => {
          const mappedDate = dateMap.get(b.date);
          if (typeof mappedDate === 'string') {
             computedOverrides[b.id] = {
                ...(computedOverrides[b.id] || {}),
                date: mappedDate
             };
          }
       });
    }

    if (newCourtId) globalChanges.courtId = newCourtId;
    if (newStartTime) globalChanges.startTime = newStartTime;
    if (newDuration) globalChanges.duration = parseFloat(newDuration);

    const result = onBatchUpdate(Array.from(selectedIds), globalChanges, computedOverrides);
    
    if (result.success) {
      setSuccessMessage('Successfully Amended!');
      setTimeout(() => onClose(), 1500);
    } else {
      alert(result.error || 'Update failed');
    }
  };

  const handleRefund = () => {
    if (selectedIds.size === 0) return;
    const result = onBatchRefund(Array.from(selectedIds));
    if (result.success) {
      setSuccessMessage('Batch Refund Successful!');
      setTimeout(() => onClose(), 1500);
    } else {
      alert(result.error || 'Refund failed');
    }
  };

  // Calculations for Refund Summary
  const refundTotal = useMemo(() => {
    let total = 0;
    bookings.forEach(b => {
       if (selectedIds.has(b.id)) {
         if (b.paymentStatus === PaymentStatus.PAID) total += b.totalAmount;
         if (b.paymentStatus === PaymentStatus.PARTIAL) total += (b.paidAmount || 0);
       }
    });
    return total;
  }, [selectedIds, bookings]);

  // Unique days selected count for UI
  const uniqueSelectedDaysCount = useMemo(() => {
    const dates = new Set<string>();
    bookings.forEach(b => {
      if (selectedIds.has(b.id)) dates.add(b.date);
    });
    return dates.size;
  }, [selectedIds, bookings]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex overflow-hidden relative animate-in zoom-in duration-200">
        
        {/* SUCCESS OVERLAY */}
        {successMessage && (
          <div className="absolute inset-0 z-50 bg-white/90 backdrop-blur flex flex-col items-center justify-center animate-in fade-in">
             <div className="bg-emerald-100 p-6 rounded-full mb-4 animate-bounce">
               <Check size={48} className="text-emerald-600" />
             </div>
             <h2 className="text-2xl font-bold text-emerald-800">{successMessage}</h2>
          </div>
        )}

        {/* LEFT PANEL: SEARCH & SELECTION */}
        <div className="w-1/3 border-r border-gray-200 bg-gray-50 flex flex-col min-w-[300px]">
           <div className="p-4 border-b border-gray-200 bg-white">
              <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2">
                 <Search size={18}/> Find Bookings
              </h3>
              
              <div className="flex bg-gray-100 p-1 rounded-lg mb-3">
                 <button 
                   onClick={() => setFilterMode('search')}
                   className={`flex-1 py-1 text-xs font-medium rounded ${filterMode === 'search' ? 'bg-white shadow text-slate-800' : 'text-gray-500'}`}
                 >
                   Text Search
                 </button>
                 <button 
                   onClick={() => setFilterMode('calendar')}
                   className={`flex-1 py-1 text-xs font-medium rounded ${filterMode === 'calendar' ? 'bg-white shadow text-slate-800' : 'text-gray-500'}`}
                 >
                   Calendar Filter
                 </button>
              </div>

              {filterMode === 'search' ? (
                 <input 
                   type="text" 
                   placeholder="Search name, phone, or Receipt..." 
                   className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
              ) : (
                 <div className="mb-2">
                    {renderGenericCalendar(
                      calendarMonth, 
                      setCalendarMonth, 
                      filterDates, 
                      toggleFilterDate, 
                      bookings.map(b => b.date) // Dot indicators
                    )}
                    <div className="mt-2 text-[10px] text-gray-500 text-center">
                       {filterDates.length} dates selected
                    </div>
                 </div>
              )}
           </div>

           <div className="flex-1 overflow-y-auto p-2">
              <div className="flex justify-between items-center px-2 mb-2">
                 <span className="text-xs font-bold text-gray-400 uppercase">{filteredBookings.length} Found</span>
                 <button onClick={toggleSelectAll} className="text-xs text-indigo-600 font-medium hover:underline">
                    {selectedIds.size === filteredBookings.length ? 'Deselect All' : 'Select All'}
                 </button>
              </div>
              
              <div className="space-y-2">
                 {filteredBookings.map(b => (
                    <div 
                      key={b.id} 
                      onClick={() => toggleSelection(b.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedIds.has(b.id) ? 'bg-indigo-50 border-indigo-300 ring-1 ring-indigo-300' : 'bg-white border-gray-200 hover:border-indigo-200'}`}
                    >
                       <div className="flex justify-between items-start mb-1">
                          <div className="font-semibold text-sm text-slate-700">{formatDate(b.date, companyProfile.dateFormat)}</div>
                          {selectedIds.has(b.id) ? <CheckSquare size={16} className="text-indigo-600"/> : <Square size={16} className="text-gray-300"/>}
                       </div>
                       <div className="text-xs text-gray-600 mb-1">
                          {formatTime(b.startTime, companyProfile.timeFormat)} - {formatTime(b.startTime + b.duration, companyProfile.timeFormat)} • <span className="font-medium text-emerald-600">{courts.find(c => c.id === b.courtId)?.name || b.courtId}</span>
                       </div>
                       <div className="text-xs text-gray-500 border-t border-gray-100 pt-1 mt-1 flex justify-between items-center">
                          <span className="truncate max-w-[120px] font-medium">{b.customerName}</span>
                          <span className="bg-gray-100 px-1 rounded text-[10px]">{b.receiptNumber || b.batchId || '-'}</span>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* RIGHT PANEL: ACTIONS */}
        <div className="flex-1 flex flex-col bg-white">
           {/* Header / Mode Switch */}
           <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="flex bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
                 <button
                   onClick={() => setActionType('amend')}
                   className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${actionType === 'amend' ? 'bg-amber-100 text-amber-800 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                 >
                    <Edit3 size={16} /> Batch Amend
                 </button>
                 <button
                   onClick={() => setActionType('refund')}
                   className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${actionType === 'refund' ? 'bg-purple-100 text-purple-800 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                 >
                    <RotateCcw size={16} /> Batch Refund
                 </button>
              </div>
              <button onClick={onClose} className="hover:bg-gray-200 p-2 rounded-full"><X size={20}/></button>
           </div>

           {/* Content */}
           <div className="flex-1 overflow-y-auto p-6">
              
              {selectedIds.size === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <AlertCircle size={48} className="mb-2 opacity-20"/>
                    <p>Select bookings from the list to begin.</p>
                 </div>
              ) : (
                 <div className="space-y-6">
                    <div className="bg-blue-50 text-blue-800 px-4 py-3 rounded-lg text-sm font-medium flex items-center justify-between">
                       <span>Editing {selectedIds.size} selected item(s)</span>
                       <span className="text-xs bg-white/50 px-2 py-1 rounded">Across {uniqueSelectedDaysCount} unique day(s)</span>
                    </div>

                    {/* AMEND FORM */}
                    {actionType === 'amend' && (
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-2">
                          
                          {/* 1. Date Controls */}
                          <div className="space-y-4 border p-4 rounded-xl bg-gray-50/50">
                             <h4 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                                <Calendar size={16} className="text-emerald-600"/> Date Changes
                             </h4>
                             
                             <div className="flex gap-2 mb-2">
                                <button onClick={() => setDateMode('shift')} className={`flex-1 py-1.5 text-xs border rounded ${dateMode === 'shift' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white'}`}>Shift Dates</button>
                                <button onClick={() => setDateMode('pick')} className={`flex-1 py-1.5 text-xs border rounded ${dateMode === 'pick' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white'}`}>Pick Dates</button>
                                <button onClick={() => setDateMode('fixed')} className={`flex-1 py-1.5 text-xs border rounded ${dateMode === 'fixed' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white'}`}>Fixed Date</button>
                             </div>

                             {dateMode === 'shift' && (
                                <div>
                                   <label className="text-xs text-gray-500 font-bold">Shift by Days (+/-)</label>
                                   <input 
                                     type="number" 
                                     placeholder="e.g. 7 (next week)"
                                     className="w-full border rounded p-2 mt-1"
                                     value={dateShift}
                                     onChange={(e) => setDateShift(e.target.value === '' ? '' : Number(e.target.value))}
                                   />
                                   <p className="text-[10px] text-gray-400 mt-1">Preserves the day pattern (e.g. all Mondays stay Mondays)</p>
                                </div>
                             )}

                             {dateMode === 'fixed' && (
                                <div>
                                   <label className="text-xs text-gray-500 font-bold">Set New Date</label>
                                   <input 
                                     type="date" 
                                     className="w-full border rounded p-2 mt-1"
                                     value={newDate}
                                     onChange={(e) => setNewDate(e.target.value)}
                                   />
                                </div>
                             )}

                             {dateMode === 'pick' && (
                                <div>
                                   <label className="text-xs text-gray-500 font-bold mb-2 block">Pick {uniqueSelectedDaysCount} New Target Date(s)</label>
                                   {renderGenericCalendar(
                                     targetCalendarMonth, 
                                     setTargetCalendarMonth, 
                                     targetDates, 
                                     (d: string) => {
                                        if (targetDates.includes(d)) setTargetDates(prev => prev.filter(x => x !== d));
                                        else setTargetDates(prev => [...prev, d].sort());
                                     }
                                   )}
                                   <p className="text-[10px] text-emerald-600 mt-1 font-medium text-center">
                                      {targetDates.length} / {uniqueSelectedDaysCount} selected
                                   </p>
                                </div>
                             )}
                          </div>

                          {/* 2. Slot Controls */}
                          <div className="space-y-4 border p-4 rounded-xl bg-gray-50/50">
                             <h4 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                                <Clock size={16} className="text-blue-600"/> Time & Court
                             </h4>
                             
                             <div>
                                <label className="text-xs text-gray-500 font-bold">Change Court</label>
                                <select 
                                  className="w-full border rounded p-2 mt-1 text-sm"
                                  value={newCourtId}
                                  onChange={(e) => setNewCourtId(e.target.value)}
                                >
                                   <option value="">(Keep Original)</option>
                                   {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                             </div>

                             <div className="flex gap-2">
                                <div className="flex-1">
                                   <label className="text-xs text-gray-500 font-bold">Start Time</label>
                                   <select
                                      className="w-full border rounded p-2 mt-1 text-sm"
                                      value={newStartTime}
                                      onChange={(e) => setNewStartTime(e.target.value)}
                                    >
                                      <option value="">(Keep Orig)</option>
                                      {HOURS.map(h => (
                                        <option key={h} value={h}>{formatTime(h, companyProfile.timeFormat)}</option>
                                      ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                   <label className="text-xs text-gray-500 font-bold">Duration</label>
                                   <input
                                      type="number"
                                      min="0.5" step="0.5"
                                      placeholder="(Keep)"
                                      className="w-full border rounded p-2 mt-1 text-sm"
                                      value={newDuration}
                                      onChange={(e) => setNewDuration(e.target.value)}
                                    />
                                </div>
                             </div>
                          </div>
                       </div>
                    )}

                    {/* REFUND SUMMARY */}
                    {actionType === 'refund' && (
                       <div className="bg-purple-50 border border-purple-100 p-6 rounded-xl text-center space-y-4 animate-in slide-in-from-right-2">
                          <Wallet size={48} className="mx-auto text-purple-300" />
                          <div>
                             <h3 className="text-lg font-bold text-purple-900">Batch Refund Summary</h3>
                             <p className="text-sm text-purple-700">You are about to refund {selectedIds.size} bookings.</p>
                          </div>
                          <div className="bg-white p-4 rounded-lg inline-block shadow-sm border border-purple-100 min-w-[200px]">
                             <div className="text-xs text-gray-500 uppercase font-bold">Total Refund Amount</div>
                             <div className="text-3xl font-bold text-slate-800 mt-1">{currencySymbol}{refundTotal.toFixed(2)}</div>
                          </div>
                          <p className="text-xs text-gray-500 italic max-w-sm mx-auto">
                             Unpaid bookings will be skipped. A combined Payment Voucher will be generated automatically.
                          </p>
                       </div>
                    )}

                    {/* TABLE PREVIEW (Inline Editing) */}
                    <div className="mt-6">
                       <h4 className="font-bold text-sm text-gray-600 mb-2">Selected Items (Review & Inline Edit)</h4>
                       <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <table className="w-full text-sm text-left">
                             <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
                                <tr>
                                   <th className="px-3 py-2">Customer</th>
                                   <th className="px-3 py-2">Date</th>
                                   <th className="px-3 py-2">Court</th>
                                   <th className="px-3 py-2">Time</th>
                                   <th className="px-3 py-2">Action</th>
                                </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100">
                                {bookings.filter(b => selectedIds.has(b.id)).slice(0, 10).map(b => (
                                   <tr key={b.id} className="hover:bg-gray-50">
                                      <td className="px-3 py-2">
                                         <div className="font-bold text-slate-700">{b.customerName}</div>
                                         <div className="text-[10px] text-gray-400">{b.receiptNumber || b.batchId || '-'}</div>
                                      </td>
                                      
                                      {/* Inline Edit Row */}
                                      {editRowId === b.id ? (
                                         <>
                                           <td className="px-1 py-1">
                                              <input type="date" className="w-full text-xs border rounded p-1" defaultValue={b.date} 
                                                onChange={(e) => setOverrides({...overrides, [b.id]: {...overrides[b.id], date: e.target.value}})}
                                              />
                                           </td>
                                           <td className="px-1 py-1">
                                              <select className="w-full text-xs border rounded p-1" defaultValue={b.courtId}
                                                onChange={(e) => setOverrides({...overrides, [b.id]: {...overrides[b.id], courtId: e.target.value}})}
                                              >
                                                {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                              </select>
                                           </td>
                                           <td className="px-1 py-1">
                                              <div className="flex gap-1">
                                                <select className="w-full text-xs border rounded p-1" defaultValue={b.startTime}
                                                   onChange={(e) => setOverrides({...overrides, [b.id]: {...overrides[b.id], startTime: e.target.value}})}
                                                >
                                                   {HOURS.map(h => <option key={h} value={h}>{formatTime(h, companyProfile.timeFormat)}</option>)}
                                                </select>
                                              </div>
                                           </td>
                                           <td className="px-3 py-2 text-center">
                                              <button onClick={() => setEditRowId(null)} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded"><Save size={14}/></button>
                                           </td>
                                         </>
                                      ) : (
                                         <>
                                            <td className="px-3 py-2 text-gray-600">
                                               {overrides[b.id]?.date ? <span className="text-amber-600 font-bold">{formatDate(overrides[b.id].date!, companyProfile.dateFormat)}</span> : formatDate(b.date, companyProfile.dateFormat)}
                                            </td>
                                            <td className="px-3 py-2 text-gray-600">
                                               {overrides[b.id]?.courtId ? <span className="text-amber-600 font-bold">{courts.find(c => c.id === overrides[b.id].courtId)?.name}</span> : courts.find(c => c.id === b.courtId)?.name}
                                            </td>
                                            <td className="px-3 py-2 text-gray-600">
                                               {overrides[b.id]?.startTime ? <span className="text-amber-600 font-bold">{formatTime(parseFloat(overrides[b.id].startTime!), companyProfile.timeFormat)}</span> : formatTime(b.startTime, companyProfile.timeFormat)}
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                               <button onClick={() => setEditRowId(b.id)} className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1 rounded"><Edit3 size={14}/></button>
                                            </td>
                                         </>
                                      )}
                                   </tr>
                                ))}
                             </tbody>
                          </table>
                          {selectedIds.size > 10 && (
                             <div className="bg-gray-50 p-2 text-center text-xs text-gray-500 italic">
                                + {selectedIds.size - 10} more items...
                             </div>
                          )}
                       </div>
                    </div>
                 </div>
              )}
           </div>

           {/* Footer Actions */}
           <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition">Cancel</button>
              {actionType === 'amend' ? (
                 <button 
                   onClick={handleUpdate}
                   disabled={selectedIds.size === 0}
                   className="px-6 py-2 text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition flex items-center gap-2"
                 >
                    <Save size={16} /> Confirm Batch Update
                 </button>
              ) : (
                 <button 
                   onClick={handleRefund}
                   disabled={selectedIds.size === 0}
                   className="px-6 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg shadow-sm transition flex items-center gap-2"
                 >
                    <Check size={16} /> Confirm Refund
                 </button>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default BatchAmendModal;
