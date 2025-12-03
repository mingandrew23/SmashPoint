import React, { useState, useMemo, useEffect } from 'react';
import { X, Calendar, FileText, Users, Printer, FileBarChart, Search, RotateCcw, History, FileCheck, CheckSquare, Square, Coins } from 'lucide-react';
import { Booking, Court, CompanyProfile, User } from '../types';
import { printDailyReport, printMonthlyReport, printCustomerDirectory, printCustomerHistory, printRefundReport, printBookingReceipt, printPaymentVoucher, printCashCollectionReport } from '../utils/printReceipt';
import { formatTime, formatDate } from '../constants';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  courts: Court[];
  companyProfile: CompanyProfile;
  currencySymbol: string;
  initialDate: string;
  currentUser?: User | null;
}

type ReportType = 'daily' | 'monthly' | 'customer' | 'refund' | 'reprint' | 'cash-collection';

const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  bookings,
  courts,
  companyProfile,
  currencySymbol,
  initialDate,
  currentUser
}) => {
  const [reportType, setReportType] = useState<ReportType>('daily');
  
  // Initialize with the dashboard's current date, not just "Today"
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedMonth, setSelectedMonth] = useState(initialDate.slice(0, 7)); // YYYY-MM
  
  // Customer & Refund Report State
  const [customerScope, setCustomerScope] = useState<'all' | 'single'>('all');
  
  // Stores JSON string of {name, phone} to ensure unique selection
  const [selectedIdentity, setSelectedIdentity] = useState<string>(''); 
  
  const [customerSearch, setCustomerSearch] = useState('');
  
  // Date Range
  const [custStartDate, setCustStartDate] = useState('');
  const [custEndDate, setCustEndDate] = useState('');

  // Reprint Selection State
  const [selectedReprintIds, setSelectedReprintIds] = useState<Set<string>>(new Set());

  // Reset internal state when modal opens or initialDate changes
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(initialDate);
      setSelectedMonth(initialDate.slice(0, 7));
      setReportType('daily');
      setSelectedIdentity('');
      setCustStartDate('');
      setCustEndDate('');
      setSelectedReprintIds(new Set());
    }
  }, [isOpen, initialDate]);

  // Reset selection when filters change
  useEffect(() => {
    setSelectedReprintIds(new Set());
  }, [reportType, selectedIdentity, custStartDate, custEndDate]);

  // Extract unique customers (Name + Phone combination)
  const uniqueCustomers = useMemo(() => {
    const list: { name: string, phone: string }[] = [];
    const seen = new Set<string>();

    bookings.forEach(b => {
      // Create a composite key to ensure different names with same phone are treated as different entries
      const key = `${b.customerName.trim()}|${b.phoneNumber.trim()}`;
      
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ 
          name: b.customerName, 
          phone: b.phoneNumber 
        });
      }
    });

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [bookings]);

  // Filter customers for the dropdown search
  const filteredCustomers = uniqueCustomers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
    c.phone.includes(customerSearch)
  );

  // Filter Transactions for REPRINT mode
  const reprintList = useMemo(() => {
    if (reportType !== 'reprint') return [];
    
    // Parse the selected identity if exists
    let filterPhone = '';
    let filterName = '';
    
    if (selectedIdentity) {
      try {
        const parsed = JSON.parse(selectedIdentity);
        filterPhone = parsed.phone;
        filterName = parsed.name;
      } catch (e) { console.error(e); }
    }

    if (!filterPhone && !custStartDate && !custEndDate) return [];

    return bookings.filter(b => {
      if (filterPhone && b.phoneNumber !== filterPhone) return false;
      // For reprint, if a user selected a specific name identity, we should probably match that too
      if (filterName && b.customerName !== filterName) return false;

      if (custStartDate && b.date < custStartDate) return false;
      if (custEndDate && b.date > custEndDate) return false;
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date) || a.startTime - b.startTime); // Ascending order
  }, [bookings, reportType, selectedIdentity, custStartDate, custEndDate]);

  const getCourtName = (id: string) => courts.find(c => c.id === id)?.name || id;

  const toggleReprintSelection = (id: string) => {
    const newSet = new Set(selectedReprintIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedReprintIds(newSet);
  };

  const toggleSelectAllReprint = () => {
    if (selectedReprintIds.size === reprintList.length) {
      setSelectedReprintIds(new Set());
    } else {
      setSelectedReprintIds(new Set(reprintList.map(b => b.id)));
    }
  };

  const handleCombinePrint = () => {
    const selectedBookings = reprintList.filter(b => selectedReprintIds.has(b.id));
    if (selectedBookings.length === 0) return;
    
    // Use the first selected booking as the "primary" context (Customer Name, etc)
    // Pass the full list as the specific bookings to include in the receipt body
    printBookingReceipt(selectedBookings[0], bookings, courts, companyProfile, currencySymbol, selectedBookings, currentUser?.name);
  };

  const handleCombineVoucher = () => {
    const selectedBookings = reprintList.filter(b => selectedReprintIds.has(b.id));
    if (selectedBookings.length === 0) return;
    printPaymentVoucher(selectedBookings, companyProfile, currencySymbol, courts, currentUser?.name);
  };

  const areAllSelectedRefunds = useMemo(() => {
    const selectedBookings = reprintList.filter(b => selectedReprintIds.has(b.id));
    return selectedBookings.length > 0 && selectedBookings.every(b => b.paymentStatus === 'Refunded');
  }, [reprintList, selectedReprintIds]);

  if (!isOpen) return null;

  const handleGenerate = () => {
    let phoneToUse = '';
    let nameToUse = '';

    if (selectedIdentity) {
      try {
        const parsed = JSON.parse(selectedIdentity);
        phoneToUse = parsed.phone;
        nameToUse = parsed.name;
      } catch (e) {}
    }

    switch (reportType) {
      case 'daily':
        printDailyReport(selectedDate, bookings, courts, companyProfile, currencySymbol, currentUser?.name);
        break;
      case 'monthly':
        printMonthlyReport(selectedMonth, bookings, courts, companyProfile, currencySymbol, currentUser?.name);
        break;
      case 'customer':
        if (customerScope === 'all') {
          printCustomerDirectory(bookings, companyProfile, currencySymbol, currentUser?.name);
        } else {
          if (!phoneToUse) {
            alert('Please select a customer.');
            return;
          }
          printCustomerHistory(
            bookings, 
            courts, 
            companyProfile, 
            currencySymbol, 
            phoneToUse,
            custStartDate, 
            custEndDate,
            nameToUse, // Pass the specific name to filter strictly
            currentUser?.name
          );
        }
        break;
      case 'refund':
        printRefundReport(
          bookings,
          courts,
          companyProfile,
          currencySymbol,
          customerScope === 'single' ? phoneToUse : undefined,
          custStartDate,
          custEndDate,
          nameToUse, // Pass specific name to ensure strict filtering
          currentUser?.name
        );
        break;
      case 'cash-collection':
        printCashCollectionReport(
          selectedDate, // We reuse selectedDate for the collection day
          bookings,
          courts,
          companyProfile,
          currencySymbol,
          undefined,
          undefined,
          undefined,
          currentUser?.name
        );
        break;
      case 'reprint':
        // No global action, handled per item
        break;
    }
    // Only close if not reprint mode
    if (reportType !== 'reprint') onClose();
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white shrink-0">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Printer size={20} /> Report & Reprint
          </h2>
          <button onClick={onClose} className="hover:bg-slate-700 p-1 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          <p className="text-sm text-gray-500 mb-4">Select report type.</p>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
            <button
              onClick={() => setReportType('daily')}
              className={`flex flex-col items-center justify-center gap-2 p-2 rounded-lg border transition-all ${
                reportType === 'daily' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileText size={20} />
              <span className="text-[10px] font-semibold text-center leading-tight">Daily<br/>Sales</span>
            </button>
            <button
              onClick={() => setReportType('cash-collection')}
              className={`flex flex-col items-center justify-center gap-2 p-2 rounded-lg border transition-all ${
                reportType === 'cash-collection' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Coins size={20} />
              <span className="text-[10px] font-semibold text-center leading-tight">Cash<br/>Collection</span>
            </button>
            <button
              onClick={() => setReportType('monthly')}
              className={`flex flex-col items-center justify-center gap-2 p-2 rounded-lg border transition-all ${
                reportType === 'monthly' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <FileBarChart size={20} />
              <span className="text-[10px] font-semibold text-center leading-tight">Monthly<br/>Sales</span>
            </button>
            <button
              onClick={() => setReportType('customer')}
              className={`flex flex-col items-center justify-center gap-2 p-2 rounded-lg border transition-all ${
                reportType === 'customer' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users size={20} />
              <span className="text-[10px] font-semibold text-center leading-tight">Customer<br/>Stmt</span>
            </button>
            <button
              onClick={() => setReportType('refund')}
              className={`flex flex-col items-center justify-center gap-2 p-2 rounded-lg border transition-all ${
                reportType === 'refund' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <RotateCcw size={20} />
              <span className="text-[10px] font-semibold text-center leading-tight">Refund<br/>History</span>
            </button>
            <button
              onClick={() => setReportType('reprint')}
              className={`flex flex-col items-center justify-center gap-2 p-2 rounded-lg border transition-all ${
                reportType === 'reprint' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <History size={20} />
              <span className="text-[10px] font-semibold text-center leading-tight">Reprint<br/>Docs</span>
            </button>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
            
            {/* DAILY SETTINGS / CASH COLLECTION SETTINGS */}
            {(reportType === 'daily' || reportType === 'cash-collection') && (
              <div className="animate-in fade-in">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {reportType === 'cash-collection' ? 'Collection Date' : 'Select Date'}
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-10 border border-gray-200 rounded-lg py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                {reportType === 'cash-collection' && (
                   <p className="text-[10px] text-gray-400 mt-1 ml-1">
                     Shows total cash received on this day, regardless of when the booking date is.
                   </p>
                )}
              </div>
            )}

            {/* MONTHLY SETTINGS */}
            {reportType === 'monthly' && (
              <div className="animate-in fade-in">
                <label className="block text-xs font-medium text-gray-500 mb-1">Select Month</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            )}

            {/* CUSTOMER / REFUND / REPRINT FILTERS */}
            {(reportType === 'customer' || reportType === 'refund' || reportType === 'reprint') && (
              <div className="animate-in fade-in space-y-4">
                
                {/* Toggle Scope (Not needed for Reprint, Reprint is always specific search) */}
                {reportType !== 'reprint' && (
                  <div className="flex bg-white rounded-lg p-1 border border-gray-200">
                    <button
                      onClick={() => setCustomerScope('all')}
                      className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${customerScope === 'all' ? 'bg-slate-800 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      {reportType === 'customer' ? 'Full Statement List' : 'All Refunds'}
                    </button>
                    <button
                      onClick={() => setCustomerScope('single')}
                      className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${customerScope === 'single' ? 'bg-slate-800 text-white' : 'text-gray-500 hover:bg-gray-50'}`}
                    >
                      Specific Customer
                    </button>
                  </div>
                )}

                {/* Specific Customer Search */}
                {(customerScope === 'single' || reportType === 'reprint') && (
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {reportType === 'reprint' ? 'Select Customer (Required)' : 'Select Customer'}
                    </label>
                    <select
                      value={selectedIdentity}
                      onChange={(e) => setSelectedIdentity(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500 mb-2"
                    >
                      <option value="">-- Choose a Customer --</option>
                      {filteredCustomers.map((c, idx) => (
                        <option key={idx} value={JSON.stringify({name: c.name, phone: c.phone})}>
                          {c.name} ({c.phone})
                        </option>
                      ))}
                    </select>
                    {uniqueCustomers.length > 5 && (
                       <div className="relative mb-3">
                          <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                          <input 
                            type="text"
                            placeholder="Search list above..."
                            value={customerSearch}
                            onChange={(e) => setCustomerSearch(e.target.value)}
                            className="w-full pl-8 border border-gray-200 rounded-lg py-1.5 text-xs bg-white"
                          />
                       </div>
                    )}
                  </div>
                )}

                {/* Date Range Selection */}
                {((customerScope === 'all' && reportType === 'refund') || customerScope === 'single' || reportType === 'reprint') && (
                  <div className={`pt-3 border-gray-200 ${reportType === 'reprint' ? '' : 'border-t'}`}>
                    <div className="text-xs font-semibold text-gray-500 mb-2">Filter by Date (Optional)</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">Start Date</label>
                        <input 
                          type="date"
                          value={custStartDate}
                          onChange={(e) => setCustStartDate(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-gray-400 mb-1">End Date</label>
                        <input 
                          type="date"
                          value={custEndDate}
                          onChange={(e) => setCustEndDate(e.target.value)}
                          className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* ACTION BUTTON (Hide in Reprint Mode) */}
          {reportType !== 'reprint' && (
            <button
              onClick={handleGenerate}
              disabled={(reportType === 'customer' || reportType === 'refund') && customerScope === 'single' && !selectedIdentity}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              <Printer size={18} />
              Generate Report
            </button>
          )}

          {/* REPRINT LIST */}
          {reportType === 'reprint' && (
             <div className="animate-in fade-in slide-in-from-bottom-2 pb-16">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Booking History Matches</h3>
                  {reprintList.length > 0 && (
                     <button onClick={toggleSelectAllReprint} className="text-xs text-emerald-600 font-medium hover:text-emerald-700">
                       {selectedReprintIds.size === reprintList.length ? 'Deselect All' : 'Select All'}
                     </button>
                  )}
                </div>
                
                {!selectedIdentity && !custStartDate && !custEndDate ? (
                   <div className="text-center py-6 text-gray-400 text-sm italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      Select a customer or date range to find documents.
                   </div>
                ) : reprintList.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      No records found for these filters.
                   </div>
                ) : (
                   <div className="space-y-2">
                      {reprintList.map(b => (
                         <div key={b.id} className={`bg-white border p-3 rounded-lg shadow-sm flex flex-col gap-2 transition-colors ${selectedReprintIds.has(b.id) ? 'border-emerald-300 ring-1 ring-emerald-300 bg-emerald-50/20' : 'border-gray-200'}`}>
                            <div className="flex gap-3 items-start">
                               <div className="pt-1">
                                  <input 
                                    type="checkbox"
                                    checked={selectedReprintIds.has(b.id)}
                                    onChange={() => toggleReprintSelection(b.id)}
                                    className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                  />
                               </div>
                               <div className="flex-1">
                                  <div className="flex justify-between items-start">
                                     <div>
                                        <div className="font-semibold text-slate-700 text-sm">
                                            {formatDate(b.date, companyProfile.dateFormat)}
                                        </div>
                                        <div className="text-xs text-gray-500">{formatTime(b.startTime, companyProfile.timeFormat)} - {formatTime(b.startTime + b.duration, companyProfile.timeFormat)} • {getCourtName(b.courtId)}</div>
                                        <div className="text-xs text-gray-400 mt-0.5">{b.customerName}</div>
                                     </div>
                                     <div className="text-right">
                                        <div className="font-bold text-slate-800 text-sm">{currencySymbol}{b.totalAmount.toFixed(2)}</div>
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
                                            b.paymentStatus === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            b.paymentStatus === 'Refunded' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                            'bg-gray-50 text-gray-600 border-gray-100'
                                        }`}>
                                          {b.paymentStatus}
                                        </span>
                                     </div>
                                  </div>
                               </div>
                            </div>
                            
                            {/* Individual Actions (if not using bulk) */}
                            <div className="flex gap-2 pt-2 border-t border-gray-50 mt-1 pl-7">
                               <button 
                                 onClick={() => printBookingReceipt(b, bookings, courts, companyProfile, currencySymbol, [b], currentUser?.name)}
                                 className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-slate-700 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                               >
                                 <FileText size={14}/> Receipt
                               </button>
                               {b.paymentStatus === 'Refunded' && (
                                 <button 
                                   onClick={() => printPaymentVoucher(b, companyProfile, currencySymbol, courts, currentUser?.name)}
                                   className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded transition-colors"
                                 >
                                   <FileCheck size={14}/> Voucher
                                 </button>
                               )}
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </div>
          )}
        </div>

        {/* COMBINE PRINT FOOTER */}
        {reportType === 'reprint' && selectedReprintIds.size > 0 && (
          <div className="bg-white border-t border-gray-200 p-4 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] flex justify-between items-center animate-in slide-in-from-bottom-5 gap-2">
             <div className="text-sm font-semibold text-slate-700">
               {selectedReprintIds.size} selected
             </div>
             <div className="flex gap-2">
                {areAllSelectedRefunds && (
                   <button
                    onClick={handleCombineVoucher}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95"
                  >
                    <FileCheck size={16} /> Combined Voucher
                  </button>
                )}
                <button
                  onClick={handleCombinePrint}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm flex items-center gap-2 transition-all active:scale-95"
                >
                  <FileText size={16} /> Combined Receipt
                </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportModal;