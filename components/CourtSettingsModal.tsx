
import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Save, LayoutGrid, Building2, MapPin, Phone, Check, RotateCcw, DollarSign, Settings2, Tag, FileText, Clock, Key, Lock, Unlock, ShieldAlert, MessageSquare } from 'lucide-react';
import { Court, CompanyProfile, PromotionRule, Booking } from '../types';
import { CURRENCIES, formatTime } from '../constants';

interface CourtSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  courts: Court[];
  setCourts: React.Dispatch<React.SetStateAction<Court[]>>;
  currency: string;
  setCurrency: (code: string) => void;
  companyProfile: CompanyProfile;
  setCompanyProfile: React.Dispatch<React.SetStateAction<CompanyProfile>>;
  hourlyRate: number;
  setHourlyRate: (rate: number) => void;
  promotionRules: PromotionRule[];
  setPromotionRules: React.Dispatch<React.SetStateAction<PromotionRule[]>>;
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  onFactoryReset: () => void;
  isActivated?: boolean;
}

const CourtSettingsModal: React.FC<CourtSettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  courts, 
  setCourts,
  currency,
  setCurrency,
  companyProfile,
  setCompanyProfile,
  hourlyRate,
  setHourlyRate,
  promotionRules,
  setPromotionRules,
  bookings,
  setBookings,
  onFactoryReset,
  isActivated = false
}) => {
  const [activeTab, setActiveTab] = useState<'courts' | 'pricing' | 'general'>('pricing');
  
  // Court Management State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [newCourtName, setNewCourtName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Pricing & Promotion State
  const [isEditingPricing, setIsEditingPricing] = useState(false);
  const [localHourlyRate, setLocalHourlyRate] = useState(hourlyRate);
  const [localCurrency, setLocalCurrency] = useState(currency);
  
  const [newPromo, setNewPromo] = useState<{name: string, start: string, end: string, rate: string}>({
    name: '', start: '09', end: '12', rate: ''
  });

  // General Settings State
  const [isEditingGeneral, setIsEditingGeneral] = useState(false);
  const [localProfile, setLocalProfile] = useState<CompanyProfile>(companyProfile);
  
  // Security / Unlock State for Company Name
  const [isNameUnlocked, setIsNameUnlocked] = useState(false);
  const [isUnlockPromptOpen, setIsUnlockPromptOpen] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState(false);

  // Effect 1: Reset UI states ONLY when the modal is first opened
  useEffect(() => {
    if (isOpen) {
      setIsEditingGeneral(false);
      setIsEditingPricing(false);
      setDeletingId(null);
      setEditingId(null);
      setIsNameUnlocked(false);
      setIsUnlockPromptOpen(false);
      setUnlockPassword('');
      setUnlockError(false);
    }
  }, [isOpen]);

  // Effect 2: Sync local state with global props whenever they change
  useEffect(() => {
    setLocalProfile(companyProfile);
    setLocalCurrency(currency);
    setLocalHourlyRate(hourlyRate);
  }, [companyProfile, currency, hourlyRate]);

  if (!isOpen) return null;

  const getSymbol = (code: string) => CURRENCIES.find(c => c.code === code)?.symbol || '$';

  // --- Court Handlers ---

  const handleAddCourt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourtName.trim()) return;

    const newCourt: Court = {
      id: `court-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: newCourtName.trim()
    };
    
    setCourts(prev => [...prev, newCourt]);
    setNewCourtName('');
  };

  const handleStartEdit = (court: Court) => {
    setEditingId(court.id);
    setEditName(court.name);
    setDeletingId(null);
  };

  const handleSaveEdit = (id: string) => {
    if (!editName.trim()) return;
    setCourts(prev => prev.map(c => c.id === id ? { ...c, name: editName.trim() } : c));
    setEditingId(null);
  };

  const requestDelete = (id: string) => {
    setDeletingId(id);
    setEditingId(null);
  };

  const confirmDelete = (id: string) => {
    setCourts(prev => prev.filter(c => c.id !== id));
    setDeletingId(null);
  };

  const cancelDelete = () => {
    setDeletingId(null);
  };

  // --- Pricing Handlers ---
  
  const handleSavePricing = () => {
    setHourlyRate(localHourlyRate);
    setCurrency(localCurrency);
    setIsEditingPricing(false);
  };

  const handleAddPromo = () => {
    if (!newPromo.name || !newPromo.rate) return;
    const start = parseFloat(newPromo.start);
    const end = parseFloat(newPromo.end);
    
    if (start >= end) {
      alert("End time must be after start time");
      return;
    }

    const newRule: PromotionRule = {
      id: Date.now().toString(),
      name: newPromo.name,
      startTime: start,
      endTime: end,
      rate: parseFloat(newPromo.rate),
      isActive: true
    };
    
    setPromotionRules([...promotionRules, newRule]);
    setNewPromo({ name: '', start: '09', end: '12', rate: '' });
  };

  const deletePromo = (id: string) => {
    setPromotionRules(promotionRules.filter(p => p.id !== id));
  };

  // --- General Settings Handlers ---

  const handleSaveGeneral = () => {
    setCompanyProfile(localProfile);
    setIsEditingGeneral(false);
    setIsNameUnlocked(false); // Re-lock after saving
  };

  const handleUnlockName = () => {
    if (unlockPassword === 'NEOTECH-MASTER') {
       setIsNameUnlocked(true);
       setIsUnlockPromptOpen(false);
       setUnlockPassword('');
       setUnlockError(false);
    } else {
       setUnlockError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 relative">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            System Settings
          </h2>
          <button onClick={onClose} className="hover:bg-slate-700 p-1 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('pricing')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'pricing' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <DollarSign size={16} /> Pricing
          </button>
          <button 
            onClick={() => setActiveTab('courts')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'courts' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <LayoutGrid size={16} /> Courts
          </button>
          <button 
            onClick={() => setActiveTab('general')}
            className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'general' ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Settings2 size={16} /> General
          </button>
        </div>

        <div className="p-6 min-h-[400px] overflow-y-auto max-h-[600px] custom-scrollbar relative">

          {/* PRICING TAB */}
          {activeTab === 'pricing' && (
             <div className="animate-in fade-in slide-in-from-right-4 duration-200 space-y-6">
                
                {/* Standard Rates */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                   <div className="flex justify-between items-center mb-4">
                     <h3 className="font-semibold text-slate-800 text-sm">Standard Rates</h3>
                     <button 
                       onClick={() => isEditingPricing ? handleSavePricing() : setIsEditingPricing(true)}
                       className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${isEditingPricing ? 'bg-emerald-600 text-white' : 'bg-white text-emerald-700 border border-emerald-200'}`}
                     >
                       {isEditingPricing ? <><Check size={12} /> Save</> : <><Edit2 size={12} /> Edit</>}
                     </button>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-xs font-medium text-gray-500 mb-1">Currency</label>
                         <select 
                           value={localCurrency}
                           onChange={(e) => setLocalCurrency(e.target.value)}
                           disabled={!isEditingPricing}
                           className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm disabled:bg-gray-100"
                         >
                            {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>)}
                         </select>
                      </div>
                      <div>
                         <label className="block text-xs font-medium text-gray-500 mb-1">Base Hourly Rate</label>
                         <input 
                            type="number"
                            min="0"
                            value={localHourlyRate}
                            onChange={(e) => setLocalHourlyRate(parseFloat(e.target.value))}
                            disabled={!isEditingPricing}
                            className="w-full border border-gray-200 rounded-lg px-2 py-2 text-sm disabled:bg-gray-100"
                         />
                      </div>
                   </div>
                </div>

                {/* Promotional Rates Section */}
                <div>
                   <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                     <Tag size={16} className="text-emerald-600"/> 
                     Promotional Rates (Time-Based)
                   </h3>
                   
                   {/* List of Rules */}
                   <div className="space-y-2 mb-4">
                     {promotionRules.map(rule => (
                       <div key={rule.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                          <div>
                             <div className="font-medium text-sm text-slate-700">{rule.name}</div>
                             <div className="text-xs text-gray-500">
                               {formatTime(rule.startTime, companyProfile.timeFormat)} - {formatTime(rule.endTime, companyProfile.timeFormat)} • <span className="text-emerald-600 font-bold">{getSymbol(currency)}{rule.rate}</span>/hr
                             </div>
                          </div>
                          <button onClick={() => deletePromo(rule.id)} className="text-gray-400 hover:text-red-500 p-1">
                             <Trash2 size={16} />
                          </button>
                       </div>
                     ))}
                     {promotionRules.length === 0 && (
                       <div className="text-center p-4 border border-dashed border-gray-200 rounded-lg text-xs text-gray-400">
                         No active promotions. Standard rate applies all day.
                       </div>
                     )}
                   </div>

                   {/* Add New Rule Form */}
                   <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="text-xs font-bold text-gray-600 mb-2">Add New Promotion Rule</div>
                      <div className="grid grid-cols-4 gap-2 mb-2">
                         <div className="col-span-4 sm:col-span-2">
                            <input 
                              type="text" 
                              placeholder="Name (e.g. Happy Hour)"
                              value={newPromo.name}
                              onChange={(e) => setNewPromo({...newPromo, name: e.target.value})}
                              className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs"
                            />
                         </div>
                         <div className="col-span-2 sm:col-span-1">
                            <input 
                              type="number" 
                              placeholder="Rate"
                              value={newPromo.rate}
                              onChange={(e) => setNewPromo({...newPromo, rate: e.target.value})}
                              className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs"
                            />
                         </div>
                         <div className="col-span-2 sm:col-span-1 flex items-center justify-center text-xs font-bold text-gray-400">
                            {getSymbol(currency)} / hr
                         </div>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                         <div className="flex-1">
                            <label className="block text-[10px] text-gray-400 mb-0.5">Start Time</label>
                            <select 
                              value={newPromo.start}
                              onChange={(e) => setNewPromo({...newPromo, start: e.target.value})}
                              className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs"
                            >
                               {Array.from({length: 48}, (_, i) => i * 0.5).map((val) => (
                                 <option key={val} value={val}>{formatTime(val, companyProfile.timeFormat)}</option>
                               ))}
                            </select>
                         </div>
                         <div className="flex-1">
                            <label className="block text-[10px] text-gray-400 mb-0.5">End Time</label>
                            <select 
                              value={newPromo.end}
                              onChange={(e) => setNewPromo({...newPromo, end: e.target.value})}
                              className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs"
                            >
                               {Array.from({length: 48}, (_, i) => i * 0.5).map((val) => (
                                 <option key={val} value={val}>{formatTime(val, companyProfile.timeFormat)}</option>
                               ))}
                            </select>
                         </div>
                      </div>
                      <button 
                        onClick={handleAddPromo}
                        disabled={!newPromo.name || !newPromo.rate}
                        className="w-full bg-slate-800 text-white py-1.5 rounded text-xs font-medium hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        + Add Rule
                      </button>
                   </div>
                </div>

             </div>
          )}
          
          {/* COURTS TAB */}
          {activeTab === 'courts' && (
            <div className="animate-in fade-in slide-in-from-left-4 duration-200">
               <form onSubmit={handleAddCourt} className="flex gap-2 mb-6">
                <input 
                  type="text" 
                  placeholder="e.g. VIP Court 1" 
                  value={newCourtName}
                  onChange={(e) => setNewCourtName(e.target.value)}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button 
                  type="submit" 
                  disabled={!newCourtName.trim()}
                  className="bg-emerald-600 text-white p-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition"
                >
                  <Plus size={20} />
                </button>
              </form>

              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                {courts.map(court => (
                  <div key={court.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 group">
                    {editingId === court.id ? (
                      <div className="flex-1 flex items-center gap-2 mr-2">
                        <input 
                          type="text" 
                          value={editName}
                          autoFocus
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full border border-emerald-300 rounded px-2 py-1 text-sm"
                        />
                        <button onClick={() => handleSaveEdit(court.id)} className="text-emerald-600 hover:bg-emerald-50 p-1 rounded">
                          <Save size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="font-medium text-slate-700 text-sm">{court.name}</span>
                    )}
                    
                    {deletingId === court.id ? (
                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                             <span className="text-[10px] text-red-600 font-bold">Delete?</span>
                             <button 
                                onClick={() => confirmDelete(court.id)}
                                className="p-1 bg-red-600 text-white rounded hover:bg-red-700 shadow-sm"
                                title="Confirm Delete"
                              >
                                <Check size={14} />
                              </button>
                              <button 
                                onClick={cancelDelete}
                                className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                                title="Cancel"
                              >
                                <X size={14} />
                              </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1">
                          {editingId !== court.id && (
                            <button 
                              type="button"
                              onClick={() => handleStartEdit(court)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Edit name"
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          <button 
                            type="button"
                            onClick={() => requestDelete(court.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete court"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-200 space-y-6">
               <div className="flex items-center justify-between pb-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Company Info</span>
                  <div className="flex items-center gap-1">
                     {isEditingGeneral ? (
                       <>
                         <button 
                           onClick={() => { setIsEditingGeneral(false); setLocalProfile(companyProfile); setIsNameUnlocked(false); }}
                           className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                         >
                           <RotateCcw size={14} /> Cancel
                         </button>
                         <button 
                           onClick={handleSaveGeneral}
                           className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                         >
                           <Check size={14} /> Save Changes
                         </button>
                       </>
                     ) : (
                       <button 
                         onClick={() => setIsEditingGeneral(true)}
                         className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                       >
                         <Edit2 size={14} /> Edit
                       </button>
                     )}
                   </div>
               </div>

               <div>
                 <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                   <Building2 size={16} className="text-emerald-600"/> 
                   Company Profile
                 </h3>
                 <div className="space-y-3">
                   <div>
                     <label className="block text-xs font-medium text-gray-500 mb-1 flex justify-between">
                       Company Name
                       {isActivated && !isNameUnlocked && (
                         <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1"><Lock size={10} /> LICENSED</span>
                       )}
                     </label>
                     <div className="relative">
                       <input 
                         type="text" 
                         value={localProfile.name}
                         onChange={(e) => setLocalProfile({...localProfile, name: e.target.value})}
                         disabled={!isEditingGeneral || (isActivated && !isNameUnlocked)}
                         className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${
                            !isEditingGeneral || (isActivated && !isNameUnlocked)
                              ? 'bg-gray-100 text-gray-500 border-gray-200' 
                              : 'border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500 bg-white'
                         }`}
                       />
                       {/* Unlock Button for Activated Apps */}
                       {isEditingGeneral && isActivated && !isNameUnlocked && (
                          <button 
                            type="button"
                            onClick={() => setIsUnlockPromptOpen(true)}
                            className="absolute right-2 top-2 text-gray-400 hover:text-red-500 transition-colors"
                            title="Unlock Name (Admin Only)"
                          >
                             <Lock size={14} />
                          </button>
                       )}
                       {isEditingGeneral && isActivated && isNameUnlocked && (
                          <div className="absolute right-2 top-2 text-emerald-500" title="Unlocked">
                             <Unlock size={14} />
                          </div>
                       )}
                     </div>
                   </div>
                   <div>
                     <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                     <div className="relative">
                       <MapPin size={14} className={`absolute left-3 top-2.5 ${isEditingGeneral ? 'text-gray-400' : 'text-gray-300'}`} />
                       <input 
                         type="text" 
                         value={localProfile.address}
                         onChange={(e) => setLocalProfile({...localProfile, address: e.target.value})}
                         disabled={!isEditingGeneral}
                         className={`w-full border rounded-lg pl-9 pr-3 py-2 text-sm transition-colors ${isEditingGeneral ? 'border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                       />
                     </div>
                   </div>
                   <div>
                     <label className="block text-xs font-medium text-gray-500 mb-1">Phone Number</label>
                     <div className="relative">
                       <Phone size={14} className={`absolute left-3 top-2.5 ${isEditingGeneral ? 'text-gray-400' : 'text-gray-300'}`} />
                       <input 
                         type="tel" 
                         value={localProfile.phone}
                         onChange={(e) => setLocalProfile({...localProfile, phone: e.target.value})}
                         disabled={!isEditingGeneral}
                         className={`w-full border rounded-lg pl-9 pr-3 py-2 text-sm transition-colors ${isEditingGeneral ? 'border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                       />
                     </div>
                   </div>
                   
                   {/* Footer Message Field */}
                   <div>
                     <label className="block text-xs font-medium text-gray-500 mb-1">Report Footer Message (Optional)</label>
                     <div className="relative">
                       <MessageSquare size={14} className={`absolute left-3 top-3 ${isEditingGeneral ? 'text-gray-400' : 'text-gray-300'}`} />
                       <textarea 
                         value={localProfile.footerMessage || ''}
                         onChange={(e) => setLocalProfile({...localProfile, footerMessage: e.target.value})}
                         disabled={!isEditingGeneral}
                         placeholder="e.g. Bank Info, Thank you message..."
                         className={`w-full border rounded-lg pl-9 pr-3 py-2 text-sm transition-colors h-16 resize-none ${isEditingGeneral ? 'border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                       />
                     </div>
                     <p className="text-[10px] text-gray-400 mt-1">This message will appear at the bottom of Receipts and Statements.</p>
                   </div>
                 </div>
               </div>

               {/* AI API KEY SECTION */}
               <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                   <Key size={16} className="text-emerald-600"/> 
                   Gemini AI Configuration
                 </h3>
                 <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Google Gemini API Key</label>
                    <input 
                      type="password" 
                      placeholder="Paste your API key here"
                      value={localProfile.apiKey || ''}
                      onChange={(e) => setLocalProfile({...localProfile, apiKey: e.target.value})}
                      disabled={!isEditingGeneral}
                      className={`w-full border rounded-lg px-3 py-2 text-sm transition-colors ${isEditingGeneral ? 'border-emerald-300 focus:ring-emerald-500 focus:border-emerald-500 bg-white' : 'border-gray-200 bg-gray-50 text-gray-600'}`}
                    />
                    <p className="text-[10px] text-gray-400 mt-1">
                       Required for the Smart Assistant to work. The key is saved locally on this device.
                    </p>
                 </div>
               </div>

               {/* DATE & TIME FORMAT SETTINGS */}
               <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                   <Clock size={16} className="text-emerald-600"/> 
                   Date & Time Format
                 </h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Date Format</label>
                      <select 
                        value={localProfile.dateFormat || 'YYYY-MM-DD'}
                        onChange={(e) => setLocalProfile({...localProfile, dateFormat: e.target.value as any})}
                        disabled={!isEditingGeneral}
                        className={`w-full border rounded px-2 py-2 text-sm ${isEditingGeneral ? 'bg-white' : 'bg-gray-100 text-gray-500'}`}
                      >
                         <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                         <option value="DD/MM/YYYY">DD/MM/YYYY (UK/Euro)</option>
                         <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Time Format</label>
                      <select 
                        value={localProfile.timeFormat || '24h'}
                        onChange={(e) => setLocalProfile({...localProfile, timeFormat: e.target.value as any})}
                        disabled={!isEditingGeneral}
                        className={`w-full border rounded px-2 py-2 text-sm ${isEditingGeneral ? 'bg-white' : 'bg-gray-100 text-gray-500'}`}
                      >
                         <option value="24h">24-Hour (14:00)</option>
                         <option value="12h">12-Hour (2:00 PM)</option>
                      </select>
                    </div>
                 </div>
               </div>

               {/* DOCUMENT NUMBERING SETTINGS */}
               <div className="pt-4 border-t border-gray-100">
                  <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                   <FileText size={16} className="text-emerald-600"/> 
                   Document Numbering
                 </h3>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                       <div className="text-xs font-bold text-gray-600 mb-2">Official Receipt</div>
                       <div className="space-y-2">
                          <div>
                            <label className="block text-[10px] text-gray-400">Prefix</label>
                            <input 
                              type="text" 
                              value={localProfile.documentSettings?.receiptPrefix || 'OR-'}
                              onChange={(e) => setLocalProfile(prev => ({
                                ...prev, 
                                documentSettings: { 
                                    ...(prev.documentSettings || { voucherPrefix: 'PV-', voucherNextNumber: 5000, receiptNextNumber: 1000 }),
                                    receiptPrefix: e.target.value 
                                }
                              }))}
                              disabled={!isEditingGeneral}
                              className={`w-full border rounded px-2 py-1 text-sm ${isEditingGeneral ? 'bg-white' : 'bg-gray-100 text-gray-500'}`}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-400">Next Number</label>
                            <input 
                              type="number" 
                              value={localProfile.documentSettings?.receiptNextNumber || 1000}
                              onChange={(e) => setLocalProfile(prev => ({
                                ...prev, 
                                documentSettings: { 
                                    ...(prev.documentSettings || { voucherPrefix: 'PV-', voucherNextNumber: 5000, receiptPrefix: 'OR-' }),
                                    receiptNextNumber: parseInt(e.target.value) || 0
                                }
                              }))}
                              disabled={!isEditingGeneral}
                              className={`w-full border rounded px-2 py-1 text-sm ${isEditingGeneral ? 'bg-white' : 'bg-gray-100 text-gray-500'}`}
                            />
                          </div>
                       </div>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                       <div className="text-xs font-bold text-gray-600 mb-2">Payment Voucher</div>
                       <div className="space-y-2">
                          <div>
                            <label className="block text-[10px] text-gray-400">Prefix</label>
                            <input 
                              type="text" 
                              value={localProfile.documentSettings?.voucherPrefix || 'PV-'}
                              onChange={(e) => setLocalProfile(prev => ({
                                ...prev, 
                                documentSettings: { 
                                    ...(prev.documentSettings || { receiptPrefix: 'OR-', receiptNextNumber: 1000, voucherNextNumber: 5000 }),
                                    voucherPrefix: e.target.value 
                                }
                              }))}
                              disabled={!isEditingGeneral}
                              className={`w-full border rounded px-2 py-1 text-sm ${isEditingGeneral ? 'bg-white' : 'bg-gray-100 text-gray-500'}`}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-gray-400">Next Number</label>
                            <input 
                              type="number" 
                              value={localProfile.documentSettings?.voucherNextNumber || 5000}
                              onChange={(e) => setLocalProfile(prev => ({
                                ...prev, 
                                documentSettings: { 
                                    ...(prev.documentSettings || { receiptPrefix: 'OR-', receiptNextNumber: 1000, voucherPrefix: 'PV-' }),
                                    voucherNextNumber: parseInt(e.target.value) || 0
                                }
                              }))}
                              disabled={!isEditingGeneral}
                              className={`w-full border rounded px-2 py-1 text-sm ${isEditingGeneral ? 'bg-white' : 'bg-gray-100 text-gray-500'}`}
                            />
                          </div>
                       </div>
                    </div>
                 </div>
               </div>

            </div>
          )}

        </div>

        {/* Override Password Prompt */}
        {isUnlockPromptOpen && (
           <div className="absolute inset-0 bg-white/95 backdrop-blur z-50 flex flex-col items-center justify-center p-8 animate-in fade-in">
              <div className="bg-orange-50 p-4 rounded-full mb-4">
                 <ShieldAlert size={32} className="text-orange-600"/>
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Admin Override</h3>
              <p className="text-sm text-gray-500 text-center mb-6 max-w-xs">
                 The Company Name is locked to your license. Enter the Master Password to edit.
              </p>
              <div className="w-full max-w-xs space-y-3">
                 <input 
                   type="password" 
                   placeholder="Master Password"
                   autoFocus
                   value={unlockPassword}
                   onChange={(e) => { setUnlockPassword(e.target.value); setUnlockError(false); }}
                   className={`w-full border rounded-lg p-3 text-center tracking-widest ${unlockError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                 />
                 {unlockError && <p className="text-xs text-red-500 text-center font-bold">Incorrect Master Password</p>}
                 
                 <div className="flex gap-2 pt-2">
                    <button 
                      type="button"
                      onClick={() => setIsUnlockPromptOpen(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition"
                   >
                      Cancel
                    </button>
                    <button 
                      type="button"
                      onClick={handleUnlockName}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 rounded-lg shadow-sm transition"
                    >
                      Unlock
                    </button>
                 </div>
              </div>
           </div>
        )}

      </div>
    </div>
  );
};

export default CourtSettingsModal;
