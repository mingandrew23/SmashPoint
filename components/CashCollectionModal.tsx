
import React, { useState, useEffect, useMemo } from 'react';
import { X, Coins, Calculator, CheckSquare, Square, Printer, Calendar, ArrowRight, Smartphone, CreditCard } from 'lucide-react';
import { Booking, PaymentStatus, CompanyProfile } from '../types';
import { formatTime, formatDate } from '../constants';
import { printCashCollectionReport } from '../utils/printReceipt';

interface CashCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  companyProfile: CompanyProfile;
  currencySymbol: string;
  onMarkReconciled: (bookingIds: string[]) => void; // New Prop
  currentUser?: { name: string };
}

const DENOMINATIONS = [100, 50, 20, 10, 5, 1];

const CashCollectionModal: React.FC<CashCollectionModalProps> = ({
  isOpen,
  onClose,
  bookings,
  companyProfile,
  currencySymbol,
  onMarkReconciled,
  currentUser
}) => {
  // Date State
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toLocaleDateString('en-CA')); // Local YYYY-MM-DD

  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Cash Counter State
  const [cashCounts, setCashCounts] = useState<Record<number, string>>({
    100: '', 50: '', 20: '', 10: '', 5: '', 1: ''
  });

  // Digital Payment Manual Inputs
  const [onlineAmount, setOnlineAmount] = useState<string>('');
  const [qrAmount, setQrAmount] = useState<string>('');

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setSelectedDate(new Date().toLocaleDateString('en-CA'));
      setCashCounts({ 100: '', 50: '', 20: '', 10: '', 5: '', 1: '' });
      setOnlineAmount('');
      setQrAmount('');
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  // Filter Transactions for Selected Date (Same logic as print report)
  const collectionList = useMemo(() => {
    return bookings.filter(b => {
      // STRICT FILTER: Only allow PAID or PARTIAL
      if (b.paymentStatus !== PaymentStatus.PAID && b.paymentStatus !== PaymentStatus.PARTIAL) return false;

      // PARTIAL CHECK: If Partial, must have paidAmount > 0
      if (b.paymentStatus === PaymentStatus.PARTIAL && (!b.paidAmount || b.paidAmount <= 0)) return false;
      
      // EXCLUDE RECONCILED TRANSACTIONS
      if (b.isReconciled) return false;

      const timestamp = b.paymentDate || b.createdAt;
      if (!timestamp) return false;

      const d = new Date(timestamp);
      // Construct local YYYY-MM-DD manually to match input
      const localDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      
      return localDateStr === selectedDate;
    }).sort((a, b) => (a.paymentDate || 0) - (b.paymentDate || 0));
  }, [bookings, selectedDate]);

  // Auto-Select All when date changes
  useEffect(() => {
    setSelectedIds(new Set(collectionList.map(b => b.id)));
  }, [collectionList]);

  // --- HANDLERS ---

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === collectionList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(collectionList.map(b => b.id)));
    }
  };

  const handleCountChange = (denom: number, val: string) => {
    setCashCounts(prev => ({ ...prev, [denom]: val }));
  };

  // --- CALCULATIONS ---

  // 1. System Total (From Ticked Items)
  const systemTotal = useMemo(() => {
    return collectionList.reduce((sum, b) => {
      if (!selectedIds.has(b.id)) return sum;
      if (b.paymentStatus === PaymentStatus.PAID) return sum + b.totalAmount;
      if (b.paymentStatus === PaymentStatus.PARTIAL) return sum + (b.paidAmount || 0);
      return sum;
    }, 0);
  }, [collectionList, selectedIds]);

  // 2. Physical Cash Total (From Calculator)
  const physicalTotal = useMemo(() => {
    return DENOMINATIONS.reduce((sum, denom) => {
      const count = parseInt(cashCounts[denom] || '0', 10);
      return sum + (count * denom);
    }, 0);
  }, [cashCounts]);

  // 3. Digital Totals
  const digitalTotal = (parseFloat(onlineAmount) || 0) + (parseFloat(qrAmount) || 0);

  // 4. Grand Total Collected
  const grandTotalCollected = physicalTotal + digitalTotal;

  // 5. Variance
  const variance = grandTotalCollected - systemTotal;

  const handlePrint = () => {
    const selectedBookings = collectionList.filter(b => selectedIds.has(b.id));
    // Prepare breakdown object for print function
    const breakdown = DENOMINATIONS.map(d => ({
        denom: d,
        count: parseInt(cashCounts[d] || '0', 10),
        total: d * parseInt(cashCounts[d] || '0', 10)
    }));

    const digitalBreakdown = {
      online: parseFloat(onlineAmount) || 0,
      qr: parseFloat(qrAmount) || 0
    };

    printCashCollectionReport(
        selectedDate,
        selectedBookings, 
        [], // Courts not needed for simple list
        companyProfile,
        currencySymbol,
        breakdown, 
        physicalTotal,
        digitalBreakdown,
        currentUser?.name
    );

    // MARK AS RECONCILED AFTER PRINTING
    if (selectedIds.size > 0) {
       onMarkReconciled(Array.from(selectedIds));
    }
    
    // Close modal
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="bg-emerald-900 p-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-emerald-800 p-2 rounded-lg">
                <Coins size={24} className="text-emerald-300" />
             </div>
             <div>
                <h2 className="text-lg font-bold">Cash Collection Reconciliation</h2>
                <p className="text-xs text-emerald-300 opacity-80">Verify cash received against system records</p>
             </div>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-1 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex flex-1 overflow-hidden">
           
           {/* LEFT: TRANSACTION LIST */}
           <div className="w-3/5 flex flex-col border-r border-gray-200 bg-gray-50/50">
              {/* Date Filter */}
              <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
                 <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-gray-400"/>
                    <label className="text-xs font-bold text-gray-500">Collection Date:</label>
                    <input 
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1 text-sm font-medium focus:ring-emerald-500 focus:border-emerald-500"
                    />
                 </div>
                 <div className="text-xs text-gray-400 italic">
                    {collectionList.length} transactions found
                 </div>
              </div>

              {/* List Header */}
              <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-100 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase">
                 <div className="col-span-1 text-center">
                    <button onClick={toggleSelectAll}>
                       {selectedIds.size === collectionList.length && collectionList.length > 0 ? <CheckSquare size={16} className="text-emerald-600"/> : <Square size={16}/>}
                    </button>
                 </div>
                 <div className="col-span-2">Time</div>
                 <div className="col-span-3">Receipt / Ref</div>
                 <div className="col-span-4">Customer</div>
                 <div className="col-span-2 text-right">Amount</div>
              </div>

              {/* List Content */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                 {collectionList.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                       <Square size={48} className="mb-2"/>
                       <p>No unreconciled collections found for this date.</p>
                    </div>
                 ) : (
                    collectionList.map(b => {
                       const amount = b.paymentStatus === PaymentStatus.PAID ? b.totalAmount : (b.paidAmount || 0);
                       const time = b.paymentDate ? new Date(b.paymentDate).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'}) : '00:00';
                       
                       return (
                          <div 
                            key={b.id} 
                            onClick={() => toggleSelection(b.id)}
                            className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-gray-100 items-center cursor-pointer transition-colors text-sm ${selectedIds.has(b.id) ? 'bg-emerald-50/50' : 'hover:bg-gray-50'}`}
                          >
                             <div className="col-span-1 text-center">
                                {selectedIds.has(b.id) ? <CheckSquare size={16} className="text-emerald-600"/> : <Square size={16} className="text-gray-300"/>}
                             </div>
                             <div className="col-span-2 text-gray-500 text-xs">{time}</div>
                             <div className="col-span-3 font-mono text-xs text-slate-600 truncate">{b.receiptNumber || b.batchId || '-'}</div>
                             <div className="col-span-4 truncate font-medium text-slate-700">{b.customerName}</div>
                             <div className="col-span-2 text-right font-bold text-emerald-700">{currencySymbol}{amount.toFixed(2)}</div>
                          </div>
                       );
                    })
                 )}
              </div>

              {/* System Total Footer */}
              <div className="p-4 bg-white border-t border-gray-200 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
                 <div className="text-xs text-gray-500">
                    Selected: <strong className="text-slate-800">{selectedIds.size}</strong> items
                 </div>
                 <div className="text-right">
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">System Total (Expected)</div>
                    <div className="text-2xl font-bold text-slate-800">{currencySymbol}{systemTotal.toFixed(2)}</div>
                 </div>
              </div>
           </div>

           {/* RIGHT: CASH CALCULATOR */}
           <div className="w-2/5 flex flex-col bg-white">
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                 <h3 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                    <Calculator size={16} className="text-emerald-600"/> Cash & Digital Calculator
                 </h3>
              </div>

              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                 <div className="space-y-4">
                    
                    {/* Physical Cash Section */}
                    <div>
                       <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Physical Cash Notes</div>
                       <div className="space-y-2">
                          {DENOMINATIONS.map(denom => {
                             const count = parseInt(cashCounts[denom] || '0', 10);
                             const subtotal = count * denom;
                             
                             return (
                                <div key={denom} className="flex items-center gap-2 bg-white border border-gray-200 p-2 rounded-lg shadow-sm">
                                   <div className="w-16 text-right font-bold text-slate-700 text-sm">
                                      {currencySymbol}{denom}
                                   </div>
                                   <div className="text-gray-300 text-xs">x</div>
                                   <div className="flex-1">
                                      <input 
                                        type="number" 
                                        min="0"
                                        placeholder="0"
                                        value={cashCounts[denom]}
                                        onChange={(e) => handleCountChange(denom, e.target.value)}
                                        className="w-full border border-gray-300 rounded px-2 py-1 text-center font-bold text-slate-800 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                                      />
                                   </div>
                                   <div className="w-20 text-right font-mono font-medium text-emerald-600 bg-emerald-50 py-1 px-2 rounded border border-emerald-100 text-xs">
                                      {subtotal > 0 ? subtotal.toFixed(0) : '-'}
                                   </div>
                                </div>
                             );
                          })}
                       </div>
                       <div className="mt-2 text-right text-xs font-bold text-slate-500">
                          Cash Subtotal: <span className="text-emerald-700 text-sm">{currencySymbol}{physicalTotal.toFixed(2)}</span>
                       </div>
                    </div>

                    {/* Digital / Other Section */}
                    <div className="pt-4 border-t border-gray-200">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Digital / Bank Collections</div>
                        
                        <div className="space-y-2">
                           <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg flex items-center gap-2">
                              <div className="p-1.5 bg-white rounded text-blue-500"><CreditCard size={14}/></div>
                              <div className="flex-1 text-xs font-medium text-blue-900">Online Transfer</div>
                              <div className="w-24">
                                 <input 
                                    type="number" 
                                    min="0"
                                    placeholder="0.00"
                                    value={onlineAmount}
                                    onChange={(e) => setOnlineAmount(e.target.value)}
                                    className="w-full border border-blue-200 rounded px-2 py-1 text-right font-bold text-blue-700 text-sm focus:ring-blue-500"
                                 />
                              </div>
                           </div>

                           <div className="bg-purple-50 border border-purple-100 p-2 rounded-lg flex items-center gap-2">
                              <div className="p-1.5 bg-white rounded text-purple-500"><Smartphone size={14}/></div>
                              <div className="flex-1 text-xs font-medium text-purple-900">QR / E-Wallet</div>
                              <div className="w-24">
                                 <input 
                                    type="number" 
                                    min="0"
                                    placeholder="0.00"
                                    value={qrAmount}
                                    onChange={(e) => setQrAmount(e.target.value)}
                                    className="w-full border border-purple-200 rounded px-2 py-1 text-right font-bold text-purple-700 text-sm focus:ring-purple-500"
                                 />
                              </div>
                           </div>
                        </div>
                    </div>

                 </div>
              </div>

              {/* Calculator Footer */}
              <div className="p-4 bg-slate-50 border-t border-gray-200 space-y-3">
                 
                 <div className="flex justify-between items-center border-b border-gray-200 pb-2">
                    <span className="text-xs font-bold text-gray-600 uppercase">Grand Total Collected</span>
                    <span className="text-xl font-bold text-emerald-700">{currencySymbol}{grandTotalCollected.toFixed(2)}</span>
                 </div>

                 {/* Comparison Logic */}
                 <div className={`p-3 rounded-lg flex justify-between items-center ${variance === 0 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-bold uppercase">Variance</span>
                       {variance !== 0 && <span className="text-xs">(collected - system)</span>}
                    </div>
                    <div className="font-bold font-mono text-lg">
                       {variance > 0 ? '+' : ''}{currencySymbol}{variance.toFixed(2)}
                    </div>
                 </div>

                 <button 
                   onClick={handlePrint}
                   className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 text-sm"
                 >
                    <Printer size={16} />
                    Confirm & Print Report
                 </button>
              </div>
           </div>

        </div>
      </div>
    </div>
  );
};

export default CashCollectionModal;
