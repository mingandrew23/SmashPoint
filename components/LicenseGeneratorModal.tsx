import React, { useState, useEffect } from 'react';
import { X, Key, Copy, Check, Building2, MapPin, RefreshCw } from 'lucide-react';
import { generateLicenseKey } from '../utils/licenseGenerator';

interface LicenseGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LicenseGeneratorModal: React.FC<LicenseGeneratorModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setAddress('');
      setGeneratedKey('');
      setCopied(false);
    }
  }, [isOpen]);

  const handleGenerate = () => {
    if (!name.trim() || !address.trim()) {
      alert("Please enter Company Name and City/Address");
      return;
    }
    const key = generateLicenseKey(name); // Removed address parameter
    setGeneratedKey(key);
    setCopied(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        
        <div className="bg-slate-900 p-5 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
             <Key size={20} className="text-amber-400"/>
             <h2 className="text-lg font-bold">License Key Generator</h2>
          </div>
          <button onClick={onClose} className="hover:bg-slate-700 p-1 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
           <p className="text-sm text-gray-500">
             Enter the customer's details to generate a unique activation key locked to their company.
           </p>

           <div className="space-y-3">
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Company Name</label>
                 <div className="relative">
                    <Building2 size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. City Badminton Hall"
                      className="w-full pl-9 border rounded-lg p-2 text-sm focus:ring-amber-500 focus:border-amber-500"
                    />
                 </div>
              </div>
              <div>
                 <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City / Short Address</label>
                 <div className="relative">
                    <MapPin size={16} className="absolute left-3 top-2.5 text-gray-400"/>
                    <input 
                      type="text" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. Kuala Lumpur"
                      className="w-full pl-9 border rounded-lg p-2 text-sm focus:ring-amber-500 focus:border-amber-500"
                    />
                 </div>
                 <p className="text-[10px] text-gray-400 mt-1">The customer must enter this exactly to activate.</p>
              </div>
           </div>

           <button 
             onClick={handleGenerate}
             disabled={!name || !address}
             className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
           >
              <RefreshCw size={16} /> Generate Key
           </button>

           {generatedKey && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 animate-in slide-in-from-bottom-2">
                 <div className="text-xs font-bold text-amber-800 uppercase mb-2 text-center">Product Activation Key</div>
                 <div className="font-mono text-lg font-bold text-slate-800 text-center tracking-wider break-all">
                    {generatedKey}
                 </div>
                 <button 
                   onClick={handleCopy}
                   className="w-full mt-3 bg-white border border-amber-200 hover:bg-amber-100 text-amber-700 font-semibold py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                 >
                    {copied ? <Check size={16}/> : <Copy size={16}/>}
                    {copied ? 'Copied to Clipboard' : 'Copy Key'}
                 </button>
              </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default LicenseGeneratorModal;