
import React, { useState } from 'react';
import { ShieldCheck, Lock, Key, CheckCircle2, XCircle, Building2, MapPin } from 'lucide-react';

interface ActivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate: (code: string, companyName: string, address: string) => boolean;
}

const ActivationModal: React.FC<ActivationModalProps> = ({ isOpen, onClose, onActivate }) => {
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [code, setCode] = useState('');
  
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Remove non-alphanumeric chars
    let raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // 2. Limit to 25 chars
    if (raw.length > 25) raw = raw.slice(0, 25);

    // 3. Add Dashes every 5 chars
    const parts = raw.match(/.{1,5}/g);
    const formatted = parts ? parts.join('-') : raw;

    setCode(formatted);
    setError(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !address.trim() || code.length < 29) {
       setError(true);
       return;
    }

    const isValid = onActivate(code, companyName, address);
    
    if (isValid) {
      setSuccess(true);
      setError(false);
      setTimeout(() => {
        onClose();
        // Reset state after close
        setTimeout(() => {
            setSuccess(false);
            setCode('');
            setCompanyName('');
            setAddress('');
        }, 300);
      }, 2000);
    } else {
      setError(true);
      setSuccess(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in duration-300">
        
        {/* Header Graphic */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 flex flex-col items-center justify-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-white/5 opacity-50" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
          
          <div className={`p-4 rounded-full mb-4 shadow-lg transition-colors duration-500 ${success ? 'bg-emerald-500 text-white' : 'bg-white/10 text-indigo-300'}`}>
            {success ? <CheckCircle2 size={48} /> : <Lock size={48} />}
          </div>
          
          <h2 className="text-2xl font-bold tracking-tight">
            {success ? 'Activation Successful!' : 'Product Activation'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {success ? 'Welcome to the full version.' : 'Enter your license details below.'}
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-5 animate-in slide-in-from-right duration-300">
                <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-100 mb-4 text-xs text-indigo-700">
                    <strong className="block mb-1">Important:</strong>
                    The Product Key is linked to your <u>Company Name</u>. Please enter it exactly as registered.
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Company Name</label>
                    <div className="relative">
                        <Building2 className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Registered Name"
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">City / Short Address</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Registered City/Address"
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Product Key</label>
                    <div className="relative">
                        <Key className="absolute left-3 top-2.5 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            value={code}
                            onChange={handleCodeChange}
                            placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg font-mono text-center text-sm uppercase tracking-widest outline-none transition-all ${error ? 'border-red-300 bg-red-50 focus:ring-red-200' : 'border-slate-200 focus:ring-2 focus:ring-indigo-500'}`}
                        />
                    </div>
                </div>

                {error && (
                    <div className="flex items-center gap-1.5 text-red-600 text-xs font-medium justify-center animate-in slide-in-from-top-1">
                        <XCircle size={14} /> Invalid Key or Company Name mismatch.
                    </div>
                )}

                <button 
                    type="submit"
                    className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <ShieldCheck size={18} /> Activate License
                </button>
            </form>
          ) : (
            <div className="text-center space-y-4 animate-in zoom-in duration-300">
               <p className="text-slate-600 text-sm">
                 Thank you for purchasing <strong>SmashPoint</strong>.<br/>
                 Licensed to: <strong className="text-indigo-600">{companyName}</strong>
               </p>
               <button 
                  onClick={onClose}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all"
                >
                  Continue to Dashboard
                </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivationModal;
