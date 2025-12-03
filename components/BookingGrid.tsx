
import React from 'react';
import { Booking, Court, PaymentStatus, CompanyProfile } from '../types';
import { HOURS, formatTime, getStatusColor } from '../constants';
import { CheckCircle2, AlertCircle, PieChart } from 'lucide-react';

interface BookingGridProps {
  bookings: Booking[];
  courts: Court[];
  currentDate: string;
  onSlotClick: (courtId: string, time: number) => void;
  onBookingClick: (booking: Booking) => void;
  currencySymbol: string;
  defaultHourlyRate: number;
  companyProfile: CompanyProfile;
}

const BookingGrid: React.FC<BookingGridProps> = ({ 
  bookings, 
  courts,
  currentDate, 
  onSlotClick, 
  onBookingClick,
  currencySymbol,
  defaultHourlyRate,
  companyProfile
}) => {
  const daysBookings = bookings.filter(b => 
    b.date === currentDate && 
    b.paymentStatus !== PaymentStatus.CANCELLED && 
    b.paymentStatus !== PaymentStatus.REFUNDED
  );

  const isSlotOccupied = (courtId: string, time: number): Booking | undefined => {
    return daysBookings.find(b => {
      if (b.courtId !== courtId) return false;
      const start = b.startTime;
      const end = b.startTime + b.duration;
      return time >= start && time < end;
    });
  };

  const timeColWidth = '110px';
  const rowHeightClass = "h-12"; 

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-white overflow-hidden">
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header Row - Premium Dark Theme */}
          <div className="grid border-b border-slate-800 bg-slate-900 shadow-lg sticky top-0 z-[120]" style={{ gridTemplateColumns: `${timeColWidth} repeat(${courts.length}, 1fr)` }}>
            {/* Top Left 'Time Frame' Cell */}
            <div className="p-4 flex items-center justify-center bg-slate-950 border-r border-slate-600 sticky left-0 z-[130] shadow-[4px_0_15px_rgba(0,0,0,0.3)]">
               <span className="text-[10px] font-black text-emerald-500 tracking-[0.2em] uppercase">Time</span>
            </div>
            
            {/* Court Headers */}
            {courts.map(court => (
              <div key={court.id} className="relative p-4 flex flex-col items-center justify-center border-l border-slate-600 first:border-l-0 group transition-colors hover:bg-slate-800/30">
                <span className="text-sm font-bold text-slate-200 tracking-wide group-hover:text-white transition-colors relative z-10">
                  {court.name}
                </span>
                {/* Animated Bottom Accent */}
                <div className="absolute bottom-0 w-full h-[2px] bg-emerald-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-center opacity-80"></div>
                {/* Subtle Glow */}
                <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>

          {/* Time Rows */}
          <div className="relative bg-slate-50/30">
            {HOURS.map((hour) => (
              <div key={hour} className={`grid border-b border-slate-100 last:border-0 ${rowHeightClass} transition-colors hover:bg-white relative`} style={{ gridTemplateColumns: `${timeColWidth} repeat(${courts.length}, 1fr)`, zIndex: 100 - Math.floor(hour) }}>
                
                {/* Time Column - Sidebar Style */}
                <div className="flex items-center justify-center text-[10px] font-bold text-slate-500 sticky left-0 bg-slate-50 z-[110] border-r border-slate-200 shadow-[4px_0_10px_-5px_rgba(0,0,0,0.05)] tabular-nums tracking-tight">
                  {formatTime(hour, companyProfile.timeFormat)} - {formatTime(hour + 0.5, companyProfile.timeFormat)}
                </div>

                {/* Court Cells */}
                {courts.map((court) => {
                  const booking = isSlotOccupied(court.id, hour);
                  const isStartOfBooking = booking && booking.startTime === hour;

                  if (booking) {
                    if (!isStartOfBooking) return <div key={`${court.id}-${hour}`} className="border-l border-slate-50 bg-transparent pointer-events-none" />;

                    const heightStyle = { 
                      height: `calc(${booking.duration * 2 * 100}% + ${(booking.duration * 2) - 1}px)`,
                      zIndex: 20
                    };
                    
                    const totalAmount = booking.totalAmount !== undefined 
                      ? booking.totalAmount 
                      : booking.duration * (booking.hourlyRate || defaultHourlyRate);

                    return (
                      <div key={`${court.id}-${hour}`} className="relative border-l border-slate-50 p-1 z-10">
                        <div
                          style={heightStyle}
                          onClick={(e) => { e.stopPropagation(); onBookingClick(booking); }}
                          className={`
                            absolute top-1 left-1 right-1 rounded-xl shadow-lg cursor-pointer 
                            transition-all hover:scale-[1.02] hover:shadow-xl hover:z-30
                            flex flex-col border p-2
                            backdrop-blur-sm bg-opacity-90
                            ${getStatusColor(booking.paymentStatus)}
                          `}
                        >
                          {/* Inner Gloss */}
                          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-xl pointer-events-none"></div>

                          {/* Header */}
                          <div className="flex justify-between items-start mb-0.5 relative z-10">
                            <span className="font-bold text-xs truncate pr-1 text-slate-900">{booking.customerName}</span>
                            {booking.paymentStatus === PaymentStatus.PAID ? (
                              <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                            ) : booking.paymentStatus === PaymentStatus.PARTIAL ? (
                               <PieChart size={14} className="text-blue-600 shrink-0" />
                            ) : (
                              <AlertCircle size={14} className="text-rose-500 shrink-0" />
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold mb-0.5 flex-wrap text-slate-700 relative z-10">
                            <span>{currencySymbol}{totalAmount.toFixed(2)}</span>
                          </div>

                          {booking.duration >= 1.0 && (
                            <div className="text-[10px] opacity-75 truncate mt-auto flex flex-col gap-0.5 font-medium relative z-10">
                               <span className="flex items-center gap-1">{booking.phoneNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Empty Slot
                  return (
                    <div
                      key={`${court.id}-${hour}`}
                      onClick={() => onSlotClick(court.id, hour)}
                      className="border-l border-slate-100 cursor-pointer hover:bg-indigo-50/40 group relative transition-colors"
                    >
                      <div className="hidden group-hover:flex absolute inset-0 items-center justify-center">
                         <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingGrid;
