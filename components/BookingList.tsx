
import React from 'react';
import { Booking, Court, PaymentStatus, CompanyProfile } from '../types';
import { formatTime, formatDate, getStatusColor } from '../constants';
import { Search, Trash2, Edit2, Phone, Calendar, MapPin, Home, Printer } from 'lucide-react';
import { printBookingReceipt } from '../utils/printReceipt';

interface BookingListProps {
  bookings: Booking[];
  courts: Court[];
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
  currentDate: string;
  currencySymbol: string;
  defaultHourlyRate: number;
  companyProfile: CompanyProfile;
  currentUser?: { name: string };
}

const BookingList: React.FC<BookingListProps> = ({ 
  bookings, 
  courts, 
  onEdit, 
  onDelete, 
  currentDate,
  currencySymbol,
  defaultHourlyRate,
  companyProfile,
  currentUser
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const getCourtName = (id: string) => {
    return courts.find(c => c.id === id)?.name || id;
  };

  const filteredBookings = bookings.filter(b => {
    // STRICT DATE FILTER: Only show bookings for the dashboard's selected date
    if (b.date !== currentDate) return false;

    // Search Filter
    return (
      b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.phoneNumber.includes(searchTerm)
    );
  }).sort((a, b) => a.startTime - b.startTime);

  const handlePrint = (booking: Booking) => {
    printBookingReceipt(booking, bookings, courts, companyProfile, currencySymbol, undefined, currentUser?.name);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        {/* Search Bar */}
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search today's list..." 
            className="w-full pl-12 pr-4 py-3.5 bg-white border-0 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 shadow-lg shadow-slate-200/50 transition-all placeholder:text-slate-400 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Context Header */}
        <div className="bg-slate-900 text-white px-5 py-2 rounded-xl text-sm font-bold shadow-lg flex items-center gap-2">
           <Calendar size={16} className="text-emerald-400"/>
           <span>Schedule for: <span className="text-emerald-400">{formatDate(currentDate, companyProfile.dateFormat)}</span></span>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-white overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="p-16 text-center">
            <div className="bg-slate-50 p-6 rounded-full inline-block mb-4 shadow-inner">
               <Calendar size={32} className="text-slate-300" />
            </div>
            <p className="text-slate-500 font-medium">No bookings scheduled for this date.</p>
            {searchTerm && <p className="text-xs text-slate-400 mt-2">Try clearing your search terms.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0f172a] text-white">
                <tr>
                  <th className="px-8 py-5 font-bold text-xs uppercase tracking-widest text-slate-400 border-r border-slate-800 last:border-r-0">Customer</th>
                  <th className="px-6 py-5 font-bold text-xs uppercase tracking-widest text-slate-400 border-r border-slate-800 last:border-r-0">Time</th>
                  <th className="px-6 py-5 font-bold text-xs uppercase tracking-widest text-slate-400 border-r border-slate-800 last:border-r-0">Court</th>
                  <th className="px-6 py-5 font-bold text-xs uppercase tracking-widest text-slate-400 border-r border-slate-800 last:border-r-0">Financials</th>
                  <th className="px-6 py-5 font-bold text-xs uppercase tracking-widest text-slate-400 border-r border-slate-800 last:border-r-0">Status</th>
                  <th className="px-8 py-5 font-bold text-xs uppercase tracking-widest text-slate-400 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((booking) => {
                  const totalAmount = booking.totalAmount !== undefined 
                    ? booking.totalAmount 
                    : booking.duration * (booking.hourlyRate || defaultHourlyRate);

                  return (
                    <tr key={booking.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-800 text-sm">{booking.customerName}</div>
                        <div className="text-xs text-slate-500 flex flex-col gap-1 mt-1">
                          <span className="flex items-center gap-1.5"><Phone size={12} /> {booking.phoneNumber}</span>
                          {booking.residentUnitNo && (
                             <span className="flex items-center gap-1.5 text-indigo-600 font-bold bg-indigo-50 w-fit px-2 py-0.5 rounded-md"><Home size={10} /> {booking.residentUnitNo}</span>
                          )}
                          {booking.batchId && (
                             <span className="text-[10px] text-slate-400 font-mono tracking-tighter">REF: {booking.batchId}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg w-fit border border-slate-200/50">
                          {formatTime(booking.startTime, companyProfile.timeFormat)} - {formatTime(booking.startTime + booking.duration, companyProfile.timeFormat)}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                          <MapPin size={14} className="text-emerald-500" />
                          {getCourtName(booking.courtId)}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="font-bold text-slate-900 text-sm">
                           {currencySymbol}{totalAmount.toFixed(2)}
                        </div>
                        {booking.paymentStatus === PaymentStatus.PARTIAL && booking.paidAmount && (
                           <div className="text-[10px] text-blue-600 font-bold mt-1 bg-blue-50 px-2 py-0.5 rounded w-fit">
                             PAID: {currencySymbol}{booking.paidAmount.toFixed(2)}
                           </div>
                        )}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`text-[10px] px-3 py-1 rounded-full border font-bold uppercase tracking-wide shadow-sm ${getStatusColor(booking.paymentStatus)}`}>
                          {booking.paymentStatus}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-3 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handlePrint(booking)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                            title="Print Receipt"
                          >
                            <Printer size={18} />
                          </button>
                          <button 
                            onClick={() => onEdit(booking)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                            title="Edit"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button 
                            onClick={() => {
                              if(window.confirm('Are you sure you want to delete this booking?')) {
                                onDelete(booking.id);
                              }
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingList;
