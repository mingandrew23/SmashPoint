import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Wallet, Filter, Calendar, Search, FileText, ChevronDown } from 'lucide-react';
import { Booking, PaymentStatus, Court, CompanyProfile, User } from '../types';
import { formatTime, formatDate } from '../constants';
import { printBookingReceipt, printCustomerHistory } from '../utils/printReceipt';

interface SettlementModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  courts: Court[];
  customerPhone?: string; // Optional: If not provided, we show Search UI
  customerName?: string;  // Optional
  onSettle: (bookingIds: string[]) => string; // Return the new receipt number
  currencySymbol: string;
  companyProfile: CompanyProfile;
  currentUser?: User | null;
}

const SettlementModal: React.FC<SettlementModalProps> = ({
  isOpen,
  onClose,
  bookings,
  courts,
  customerPhone,
  customerName,
  onSettle,
  currencySymbol,
  companyProfile,
  currentUser
}) => {
  // State for internal selection if no props passed
  const [activeCustomer, setActiveCustomer] = useState<{name: string, phone: string} | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Filter States
  const [viewAll, setViewAll] = useState(true); // Default to viewing ALL outstanding
  const [filterMonth, setFilterMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM

  // Reset logic when modal opens
  useEffect(() => {
    if (isOpen) {
      if (customerPhone && customerName) {
        setActiveCustomer({ name: customerName, phone: customerPhone });
      } else {
        setActiveCustomer(null); // Search Mode
      }
      setSelectedIds(new Set());
      setSearchTerm('');
      setViewAll(true); // Reset to view all
    }
  }, [isOpen, customerPhone, customerName]);

  // Unique Customers List for Search Mode
  const uniqueCustomers = useMemo(() => {
    if (customerPhone) return []; // Not needed if pre-selected
    
    // Map to store customer details + all associated batch IDs
    const customersMap = new Map<string, { name: string, phone: string, batchIds: Set<string> }>();

    bookings.forEach(b => {
      const key = `${b.customerName.trim()}|${b.phoneNumber.trim()}`;
      
      if (!customersMap.has(key)) {
        customersMap.set(key, { 
          name: b.customerName, 
          phone: b.phoneNumber, 
          batchIds: new Set() 
        });
      }
      
      if (b.batchId) {
        customersMap.get(key)!.batchIds.add(b.batchId.toLowerCase());
      }
    });

    return Array.from(customersMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [bookings, customerPhone]);

  const filteredCustomers = uniqueCustomers.filter(c => {
    const lowerTerm = searchTerm.toLowerCase();
    // Check Name, Phone, OR any Batch ID
    return (
      c.name.toLowerCase().includes(lowerTerm) || 
      c.phone.includes(lowerTerm) ||
      Array.from(c.batchIds).some((bid: string) => bid.includes(lowerTerm))
    );
  });

  // Find all unpaid/partial items for the ACTIVE customer
  const outstandingBookings = useMemo(() => {
    if (!activeCustomer) return [];

    return bookings.filter(b => {
      // Must match customer
      if (b.phoneNumber !== activeCustomer.phone) return false;
      // Strict Name match to avoid cross-data
      if (b.customerName !== activeCustomer.name) return false;
      
      // Must be Unpaid or Partial
      if (b.paymentStatus !== PaymentStatus.UNPAID && b.paymentStatus !== PaymentStatus.PARTIAL) return false;
      
      // Filter by Month (Only if NOT viewing all)
      if (!viewAll && !b.date.startsWith(filterMonth)) return false;

      return true;
    }).sort((a, b) => a.date.localeCompare(b.date) || a.startTime - b.startTime);
  }, [bookings, activeCustomer, filterMonth, viewAll]);

  // Auto-Select All when list changes (Straight away select outstanding)
  useEffect(() => {
    if (outstandingBookings.length > 0) {
      const allIds = new Set(outstandingBookings.map(b => b.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  }, [outstandingBookings]);

  // --- Helper for Custom Date Selector ---
  // Generate years from 2000 to 2999
  const years = Array.from({length: 1000}, (_, i) => 2000 + i);
  
  const months = [
    { val: '01', label: 'January' },
    { val: '02', label: 'February' },
    { val: '03', label: 'March' },
    { val: '04', label: 'April' },
    { val: '05', label: 'May' },
    { val: '06', label: 'June' },
    { val: '07', label: 'July' },
    { val: '08', label: 'August' },
    { val: '09', label: 'September' },
    { val: '10', label: 'October' },
    { val: '11', label: 'November' },
    { val: '12', label: 'December' }
  ];

  const [fYear, fMonth] = filterMonth.split('-');

  const handleYearChange = (y: string) => setFilterMonth(`${y}-${fMonth}`);
  const handleMonthChange = (m: string) => setFilterMonth(`${fYear}-${m}`);

  if (!isOpen) return null;

  const getCourtName = (id: string) => courts.find(c => c.id === id)?.name || id;

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleAll = () => {
    if (selectedIds.size === outstandingBookings.length) {
      setSelectedIds(new Set());
    } else {
      const newSet = new Set(outstandingBookings.map(b => b.id));
      setSelectedIds(newSet);
    }
  };

  const calculateTotalDue = () => {
    let total = 0;
    outstandingBookings.forEach(b => {
      if (selectedIds.has(b.id)) {
        const amt = b.totalAmount - (b.paidAmount || 0);
        total += amt;
      }
    });
    return total;
  };

  const handleConfirmSettle = () => {
    if (selectedIds.size === 0) return;
    
    const idsToSettle = Array.from(selectedIds);
    
    // Update App State first to generate the receipt number
    const newReceiptNumber = onSettle(idsToSettle);

    // Prepare data for receipt
    const settledBookings = bookings.filter(b => idsToSettle.includes(b.id));
    
    // Simulate the new PAID status and assign the new receipt number for the printout
    const updatedForPrint = settledBookings.map(b => ({ 
        ...b, 
        paymentStatus: PaymentStatus.PAID, 
        paidAmount: undefined,
        receiptNumber: newReceiptNumber
    }));

    // Trigger Print immediately with the specific settled items
    if (updatedForPrint.length > 0) {
        printBookingReceipt(updatedForPrint[0], bookings, courts, companyProfile, currencySymbol, updatedForPrint, currentUser?.name);
    }
    
    onClose();
  };

  const handlePrintStatement = () => {
     if (!activeCustomer) return;
     // Print Statement for specific customer
     printCustomerHistory(
        bookings, 
        courts, 
        companyProfile, 
        currencySymbol, 
        activeCustomer.phone, 
        undefined, 
        undefined, 
        activeCustomer.name,
        currentUser?.name
     );
  };

  const totalDue = calculateTotalDue();

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-indigo-900 p-4 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Wallet size={20} /> Check & Settle Account
            </h2>
            {activeCustomer ? (
               <p className="text-xs text-indigo-200">{activeCustomer.name} ({activeCustomer.phone})</p>
            ) : (
               <p className="text-xs text-indigo-200">Search for a customer to view balance</p>
            )}
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* --- SEARCH MODE UI --- */}
        {!activeCustomer && (
           <div className="p-6 flex-1 overflow-y-auto">
              <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="Search Customer Name, Phone, or Batch ID..." 
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>

              <div className="space-y-2">
                 {filteredCustomers.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 italic">
                       No matching customers found.
                    </div>
                 ) : (
                    filteredCustomers.map((c, idx) => (
                       <button
                         key={idx}
                         onClick={() => setActiveCustomer(c)}
                         className="w-full text-left p-3 hover:bg-indigo-50 rounded-lg border border-gray-100 flex justify-between items-center group transition-colors"
                       >
                          <div>
                             <div className="font-semibold text-slate-700">{c.name}</div>
                             <div className="text-xs text-gray-500">{c.phone}</div>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 text-indigo-600 bg-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                             Select
                          </div>
                       </button>
                    ))
                 )}
              </div>
           </div>
        )}

        {/* --- SETTLEMENT MODE UI --- */}
        {activeCustomer && (
          <>
            {/* Filter Bar */}
            <div className="bg-gray-50 p-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                       <Filter size={14} className="text-gray-400"/>
                       <label className="text-xs font-medium text-gray-600 flex items-center gap-1 cursor-pointer select-none">
                          <input 
                            type="checkbox" 
                            checked={viewAll}
                            onChange={(e) => setViewAll(e.target.checked)}
                            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          Show All History
                       </label>
                    </div>

                    {!viewAll && (
                       <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                          <span className="text-gray-300">|</span>
                          {/* Month Select */}
                          <div className="relative">
                            <select 
                              value={fMonth}
                              onChange={(e) => handleMonthChange(e.target.value)}
                              className="appearance-none bg-white border border-gray-300 hover:border-indigo-400 rounded-md py-1 pl-2 pr-6 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                            >
                              {months.map(m => (
                                <option key={m.val} value={m.val}>{m.label}</option>
                              ))}
                            </select>
                            <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                          </div>

                          {/* Year Select */}
                          <div className="relative">
                            <select 
                              value={fYear}
                              onChange={(e) => handleYearChange(e.target.value)}
                              className="appearance-none bg-white border border-gray-300 hover:border-indigo-400 rounded-md py-1 pl-2 pr-6 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                            >
                              {years.map(y => (
                                <option key={y} value={y}>{y}</option>
                              ))}
                            </select>
                            <ChevronDown size={12} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                          </div>
                       </div>
                    )}
                </div>

                <div className="flex items-center gap-3 ml-auto">
                    <button 
                       onClick={() => setActiveCustomer(null)}
                       className="text-xs text-indigo-600 hover:text-indigo-800 underline font-medium"
                    >
                       Change Customer
                    </button>
                    <div className="text-xs text-gray-400 italic border-l pl-3 hidden sm:block">
                        {outstandingBookings.length} items found
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-0">
                {outstandingBookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                        <Check size={48} className="mb-2 opacity-20" />
                        <p className="text-sm">No outstanding debts found.</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-gray-100 text-gray-600 sticky top-0 shadow-sm z-10">
                            <tr>
                                <th className="px-4 py-3 w-10 text-center">
                                    <input 
                                        type="checkbox" 
                                        checked={outstandingBookings.length > 0 && selectedIds.size === outstandingBookings.length}
                                        onChange={toggleAll}
                                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                    />
                                </th>
                                <th className="px-4 py-3 font-semibold">Batch ID</th>
                                <th className="px-4 py-3 font-semibold">Date & Time</th>
                                <th className="px-4 py-3 font-semibold">Court</th>
                                <th className="px-4 py-3 font-semibold text-right">Balance Due</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {outstandingBookings.map(b => {
                                const balance = b.totalAmount - (b.paidAmount || 0);
                                return (
                                    <tr 
                                        key={b.id} 
                                        className={`hover:bg-indigo-50 transition-colors cursor-pointer ${selectedIds.has(b.id) ? 'bg-indigo-50/50' : ''}`}
                                        onClick={() => toggleSelection(b.id)}
                                    >
                                        <td className="px-4 py-3 text-center">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.has(b.id)}
                                                onChange={() => {}} // Handled by tr click
                                                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 pointer-events-none"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">
                                              {b.batchId || '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-700">{formatDate(b.date, companyProfile.dateFormat)}</div>
                                            <div className="text-xs text-gray-500">{formatTime(b.startTime, companyProfile.timeFormat)} - {formatTime(b.startTime + b.duration, companyProfile.timeFormat)}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {getCourtName(b.courtId)}
                                        </td>
                                        <td className="px-4 py-3 text-right font-medium text-slate-800">
                                            <div className="text-red-600">{currencySymbol}{balance.toFixed(2)}</div>
                                            {b.paymentStatus === PaymentStatus.PARTIAL && (
                                                <div className="text-[10px] text-blue-500">Partial (Pd: {currencySymbol}{b.paidAmount})</div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center shadow-lg z-20 gap-4">
                <div className="text-sm">
                    <span className="text-gray-500">Total Selected:</span>
                    <div className="text-2xl font-bold text-slate-800">{currencySymbol}{totalDue.toFixed(2)}</div>
                </div>
                
                <div className="flex gap-2">
                   <button 
                      onClick={handlePrintStatement}
                      className="bg-white border border-gray-300 hover:bg-gray-50 text-slate-700 px-4 py-3 rounded-xl font-bold shadow-sm flex items-center gap-2 transition-all"
                   >
                      <FileText size={18} />
                      Print Statement
                   </button>
                   <button 
                      onClick={handleConfirmSettle}
                      disabled={selectedIds.size === 0}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold shadow-md flex items-center gap-2 transition-all active:scale-95"
                   >
                      <Wallet size={18} />
                      Confirm Payment
                   </button>
                </div>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default SettlementModal;