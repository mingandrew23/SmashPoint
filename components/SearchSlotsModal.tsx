
import React, { useState, useMemo } from 'react';
import { X, Search, Calendar, Clock, MapPin, ArrowRight, PlusCircle, Hourglass, CheckSquare, Square, Check } from 'lucide-react';
import { Booking, Court, CompanyProfile, PaymentStatus } from '../types';
import { formatTime, formatDate, HOURS } from '../constants';

interface SearchSlotsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  courts: Court[];
  companyProfile: CompanyProfile;
  currencySymbol: string;
  onBookSlot: (date: string, slots: {courtId: string, startTime: number, duration: number}[]) => void;
}

interface AvailableSlot {
  id: string; // Unique ID for selection
  date: string;
  time: number;
  courtId: string;
  courtName: string;
}

const SearchSlotsModal: React.FC<SearchSlotsModalProps> = ({
  isOpen,
  onClose,
  bookings,
  courts,
  companyProfile,
  currencySymbol,
  onBookSlot
}) => {
  // Default to today
  const todayStr = new Date().toLocaleDateString('en-CA'); // Local time ISO
  
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [startTime, setStartTime] = useState<number>(10); // Default 10:00
  const [duration, setDuration] = useState<number>(1);  // Default 1 hour
  const [endTime, setEndTime] = useState<number>(11);   // Default 11:00 (10+1)
  
  const [results, setResults] = useState<AvailableSlot[]>([]);
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<string>>(new Set());
  
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Helper to check collision for a single point in time
  const isOccupied = (date: string, time: number, courtId: string) => {
    return bookings.some(b => {
      if (b.paymentStatus === PaymentStatus.CANCELLED || b.paymentStatus === PaymentStatus.REFUNDED) return false;
      if (b.date !== date || b.courtId !== courtId) return false;
      
      const bStart = b.startTime;
      const bEnd = b.startTime + b.duration;
      // It is occupied if time >= bStart AND time < bEnd
      return time >= bStart && time < bEnd;
    });
  };

  // Helper to check if a range (start -> start+duration) is fully free
  const isRangeFree = (date: string, start: number, dur: number, courtId: string) => {
    // Check every 30-min block within the requested duration
    for (let i = 0; i < dur; i += 0.5) {
      const timeToCheck = start + i;
      
      // Check if exceeds closing time (24:00)
      if (timeToCheck >= 24) return false; 

      if (isOccupied(date, timeToCheck, courtId)) {
        return false;
      }
    }
    return true;
  };

  const handleSearch = async () => {
    setIsSearching(true);
    setHasSearched(true);
    setSelectedSlotIds(new Set()); // Reset selection
    
    // Simulate slight delay for UX
    await new Promise(r => setTimeout(r, 300));

    const foundSlots: AvailableSlot[] = [];
    
    // Generate dates
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Loop through dates
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      
      // Loop through courts
      for (const court of courts) {
        // Loop through times (using HOURS constant filtered by range)
        for (const h of HOURS) {
           const slotEnd = h + duration;

           // STRICT FILTER:
           // 1. Slot must start on or after the selected Start Time
           // 2. Slot must end on or before the selected End Time
           if (h < startTime || slotEnd > endTime) continue;
           
           // Check availability for the FULL duration
           if (isRangeFree(dateStr, h, duration, court.id)) {
             foundSlots.push({
               id: `${dateStr}-${h}-${court.id}`,
               date: dateStr,
               time: h,
               courtId: court.id,
               courtName: court.name
             });
           }
        }
      }
    }

    setResults(foundSlots);
    setIsSearching(false);
  };

  // Auto-calculate End Time
  const updateEndTime = (newStart: number, newDuration: number) => {
    // End time is start + duration, capped at 24:00
    const calculated = newStart + newDuration;
    setEndTime(Math.min(24, calculated));
  };

  const handleStartTimeChange = (val: number) => {
    setStartTime(val);
    updateEndTime(val, duration);
  };

  const handleDurationChange = (val: number) => {
    setDuration(val);
    updateEndTime(startTime, val);
  };

  const toggleSlotSelection = (id: string) => {
    const newSet = new Set(selectedSlotIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedSlotIds(newSet);
  };

  const handleBookSelected = () => {
    if (selectedSlotIds.size === 0) return;

    const selectedSlots = results.filter(r => selectedSlotIds.has(r.id));
    
    // Validation: All slots must be on the same date
    const uniqueDates = new Set(selectedSlots.map(s => s.date));
    if (uniqueDates.size > 1) {
      alert("Batch booking is currently limited to a single date. Please select slots for the same day only.");
      return;
    }

    const dateToBook = selectedSlots[0].date;
    const formattedSlots = selectedSlots.map(s => ({
      courtId: s.courtId,
      startTime: s.time,
      duration: duration
    }));

    onBookSlot(dateToBook, formattedSlots);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-indigo-900 p-4 flex justify-between items-center text-white shrink-0">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Search size={20} className="text-indigo-300" />
            Search Available Slots
          </h2>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
           
           {/* Sidebar: Filters */}
           <div className="w-full md:w-80 bg-gray-50 p-5 border-r border-gray-200 flex flex-col gap-5 shrink-0 overflow-y-auto">
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Date Range</label>
                 <div className="space-y-2">
                    <div>
                       <span className="text-xs text-gray-400 mb-1 block">From</span>
                       <input 
                         type="date" 
                         value={startDate}
                         onChange={(e) => setStartDate(e.target.value)}
                         className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                       />
                    </div>
                    <div>
                       <span className="text-xs text-gray-400 mb-1 block">To</span>
                       <input 
                         type="date" 
                         value={endDate}
                         onChange={(e) => setEndDate(e.target.value)}
                         className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                       />
                    </div>
                 </div>
              </div>

              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Time & Duration</label>
                 <div className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="flex-1">
                           <span className="text-xs text-gray-400 mb-1 block">Starts After</span>
                           <select 
                             value={startTime}
                             onChange={(e) => handleStartTimeChange(Number(e.target.value))}
                             className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm"
                           >
                              {HOURS.map(h => (
                                 <option key={h} value={h}>{formatTime(h, companyProfile.timeFormat)}</option>
                              ))}
                           </select>
                        </div>
                        <ArrowRight size={14} className="text-gray-300 mt-5" />
                        <div className="flex-1">
                           <span className="text-xs text-gray-400 mb-1 block">Ends By</span>
                           <select 
                             value={endTime}
                             onChange={(e) => setEndTime(Number(e.target.value))}
                             className="w-full border border-gray-300 rounded-lg px-2 py-2 text-sm"
                           >
                              {HOURS.map(h => (
                                 <option key={h} value={h}>{formatTime(h, companyProfile.timeFormat)}</option>
                              ))}
                           </select>
                        </div>
                    </div>

                    <div>
                       <span className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Hourglass size={12}/> Duration Required</span>
                       <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden">
                          <input 
                            type="number"
                            min="0.5"
                            step="0.5"
                            max="24"
                            value={duration}
                            onChange={(e) => handleDurationChange(parseFloat(e.target.value) || 0.5)}
                            className="w-full px-3 py-2 text-sm outline-none"
                          />
                          <span className="bg-gray-100 text-gray-500 text-xs px-3 py-2 border-l font-medium">Hours</span>
                       </div>
                    </div>
                 </div>
              </div>

              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="mt-auto w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                 {isSearching ? 'Searching...' : 'Find Slots'}
              </button>
           </div>

           {/* Results Area */}
           <div className="flex-1 bg-white flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-5">
                {!hasSearched ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                      <Search size={64} className="mb-4 text-indigo-100" />
                      <p>Select dates, times, and duration to find open courts.</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                      <div className="bg-gray-50 p-4 rounded-full mb-4">
                        <X size={32} />
                      </div>
                      <p>No slots found matching <strong>{duration}hr(s)</strong> strictly within this time range.</p>
                      <button onClick={() => setHasSearched(false)} className="mt-2 text-indigo-600 hover:underline text-sm">Try different filters</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-bold text-slate-700">Available Slots Found ({results.length})</h3>
                        <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded font-medium">Duration: {duration} Hours</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {results.map((slot) => {
                            const isSelected = selectedSlotIds.has(slot.id);
                            return (
                              <div
                                key={slot.id}
                                onClick={() => toggleSlotSelection(slot.id)}
                                className={`flex flex-col items-start border rounded-xl p-3 text-left transition-all group shadow-sm cursor-pointer relative ${
                                  isSelected 
                                    ? 'bg-indigo-50 border-indigo-300 ring-2 ring-indigo-300' 
                                    : 'bg-white border-gray-200 hover:border-emerald-500 hover:shadow-md'
                                }`}
                              >
                                <div className="absolute top-3 right-3 pointer-events-none">
                                    {/* Visual Tick Box */}
                                    <input 
                                      type="checkbox" 
                                      checked={isSelected} 
                                      readOnly 
                                      className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                                    />
                                </div>

                                <div className="mb-2 pr-6">
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide inline-block ${isSelected ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-600'}`}>
                                      {formatDate(slot.date, companyProfile.dateFormat)}
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2 text-slate-700 font-bold text-sm mb-1">
                                    <Clock size={14} className="text-gray-400" />
                                    {formatTime(slot.time, companyProfile.timeFormat)} - {formatTime(slot.time + duration, companyProfile.timeFormat)}
                                </div>
                                
                                <div className="flex items-center gap-2 text-gray-500 text-xs">
                                    <MapPin size={14} className="text-gray-300" />
                                    {slot.courtName}
                                </div>
                              </div>
                            );
                        })}
                      </div>
                  </div>
                )}
              </div>

              {/* Footer for Bulk Action */}
              {results.length > 0 && selectedSlotIds.size > 0 && (
                 <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] z-10 flex justify-between items-center animate-in slide-in-from-bottom-2">
                    <div className="text-sm">
                       <span className="font-bold text-indigo-700">{selectedSlotIds.size}</span> slot(s) selected
                    </div>
                    <button
                      onClick={handleBookSelected}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md flex items-center gap-2 transition-transform active:scale-95"
                    >
                       <Check size={18} />
                       Book Selected
                    </button>
                 </div>
              )}
           </div>

        </div>
      </div>
    </div>
  );
};

export default SearchSlotsModal;
