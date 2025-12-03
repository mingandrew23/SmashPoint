
import React, { useState, useRef, useEffect } from 'react';
import { X, Download, Upload, Database, ShieldAlert, AlertTriangle, Loader2, FolderOutput, FolderOpen, Save as SaveIcon, Eraser } from 'lucide-react';
import { CompanyProfile, Court, Booking, PromotionRule } from '../types';
import { CURRENCIES } from '../constants';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  courts: Court[];
  setCourts: React.Dispatch<React.SetStateAction<Court[]>>;
  companyProfile: CompanyProfile;
  setCompanyProfile: React.Dispatch<React.SetStateAction<CompanyProfile>>;
  currency: string;
  setCurrency: (code: string) => void;
  hourlyRate: number;
  setHourlyRate: (rate: number) => void;
  promotionRules: PromotionRule[];
  setPromotionRules: React.Dispatch<React.SetStateAction<PromotionRule[]>>;
  onFactoryReset: () => void;
  onWipeData: () => void;
  initialAction?: 'wipe' | 'reset';
}

const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  bookings,
  setBookings,
  courts,
  setCourts,
  companyProfile,
  setCompanyProfile,
  currency,
  setCurrency,
  hourlyRate,
  setHourlyRate,
  promotionRules,
  setPromotionRules,
  onFactoryReset,
  onWipeData,
  initialAction
}) => {
  // File Input Ref for Restore
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Backup Configuration State
  const [isBackupConfigOpen, setIsBackupConfigOpen] = useState(false);
  const [backupFilename, setBackupFilename] = useState('');
  const [backupDirHandle, setBackupDirHandle] = useState<any>(null);
  const [backupDirName, setBackupDirName] = useState<string>('');
  const [directoryPickerError, setDirectoryPickerError] = useState<string | null>(null);
  const [useSaveAs, setUseSaveAs] = useState(false);
  const [isFileSystemSupported, setIsFileSystemSupported] = useState(true);

  // Backup Progress State
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [backupStatus, setBackupStatus] = useState('');

  // Restore State
  const [pendingRestoreFile, setPendingRestoreFile] = useState<File | null>(null);
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [restoreStatus, setRestoreStatus] = useState('');

  // Security Prompt State
  const [isResetPromptOpen, setIsResetPromptOpen] = useState(false);
  const [promptAction, setPromptAction] = useState<'reset' | 'wipe' | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState(false);

  // Reset UI states when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialAction === 'wipe') {
        initiateAction('wipe');
      } else if (initialAction === 'reset') {
        initiateAction('reset');
      } else {
        setIsResetPromptOpen(false);
        setPromptAction(null);
      }

      setIsRestoreConfirmOpen(false);
      setIsBackupConfigOpen(false);
      setPasswordInput('');
      setPasswordError(false);
      setIsRestoring(false);
      setIsBackingUp(false);
      setRestoreProgress(0);
      setPendingRestoreFile(null);
      setBackupFilename(`smashpoint-backup-${new Date().toISOString().slice(0,10)}`);
      setBackupDirHandle(null);
      setBackupDirName('');
      setDirectoryPickerError(null);
      setUseSaveAs(false);
      setIsFileSystemSupported(true);
    }
  }, [isOpen, initialAction]);

  if (!isOpen) return null;

  // --- BACKUP HANDLERS ---
  const handleOpenBackup = () => {
    // Reset filename suggestion
    setBackupFilename(`smashpoint-backup-${new Date().toISOString().slice(0,10)}`);
    setBackupDirHandle(null);
    setBackupDirName('');
    setDirectoryPickerError(null);
    setUseSaveAs(false);
    setIsBackupConfigOpen(true);
    setIsFileSystemSupported(true);
  };

  const handleSelectDirectory = async () => {
    setDirectoryPickerError(null);
    
    // Feature detection
    if (!('showDirectoryPicker' in window)) {
      setDirectoryPickerError("Folder selection not supported by this browser.");
      setIsFileSystemSupported(false);
      return;
    }

    try {
      const handle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
      });
      
      if (handle) {
        setBackupDirHandle(handle);
        setBackupDirName(handle.name);
        setUseSaveAs(false); // Uncheck "Save As" if a directory is explicitly picked
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;

      console.warn('Directory selection failed:', err);
      if (err.name === 'SecurityError' || err.message?.includes('Cross origin')) {
         setDirectoryPickerError("Browser security prevented folder selection. Click 'Export' to download manually.");
         setIsFileSystemSupported(false);
      } else {
         setDirectoryPickerError(`Could not select folder: ${err.message}`);
      }
    }
  };

  const executeBackup = async () => {
    setIsBackupConfigOpen(false);
    setIsBackingUp(true);
    setBackupProgress(10);
    setBackupStatus('Preparing Data...');

    // Simulate async data preparation
    await new Promise(r => setTimeout(r, 500));

    const dataToBackup = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      appData: {
        companyProfile,
        currency,
        hourlyRate,
        promotionRules,
        courts,
        bookings
      }
    };

    setBackupProgress(40);
    setBackupStatus('Generating JSON...');
    await new Promise(r => setTimeout(r, 300));

    const finalName = backupFilename.endsWith('.json') ? backupFilename : `${backupFilename}.json`;
    const blob = new Blob([JSON.stringify(dataToBackup, null, 2)], { type: 'application/json' });

    setBackupProgress(70);
    setBackupStatus('Saving File...');

    // FAST PATH: If we already know security is blocking pickers, go straight to legacy download
    if (!isFileSystemSupported || (directoryPickerError && directoryPickerError.includes('security'))) {
        downloadLegacy(blob, finalName);
        return;
    }

    try {
      // 1. DIRECT DIRECTORY WRITE (If folder was picked)
      if (backupDirHandle) {
        try {
            const fileHandle = await backupDirHandle.getFileHandle(finalName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(blob);
            await writable.close();
            finishBackup("Backup saved successfully to folder!");
            return;
        } catch (err) {
            console.error("Direct write failed", err);
        }
      }

      // 2. SAVE AS DIALOG (If requested or if direct write failed)
      if (useSaveAs && 'showSaveFilePicker' in window) {
        try {
            const handle = await (window as any).showSaveFilePicker({
            suggestedName: finalName,
            types: [{
                description: 'JSON Backup File',
                accept: { 'application/json': ['.json'] },
            }],
            });
            const writable = await handle.createWritable();
            await writable.write(blob);
            await writable.close();
            finishBackup("Backup saved successfully!");
            return;
        } catch (err: any) {
             if (err.name === 'AbortError') {
                 setIsBackingUp(false);
                 return;
             }
             throw err;
        }
      }

      // 3. LEGACY DOWNLOAD (Fallback)
      downloadLegacy(blob, finalName);

    } catch (err: any) {
      console.warn('Advanced save failed, falling back to legacy download:', err);
      downloadLegacy(blob, finalName);
    }
  };

  const downloadLegacy = (blob: Blob, name: string) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      finishBackup("Backup downloaded successfully!");
  };

  const finishBackup = (msg: string) => {
      setBackupProgress(100);
      setBackupStatus('Complete!');
      setTimeout(() => {
          setIsBackingUp(false);
          alert(msg);
      }, 500);
  };

  // --- RESTORE HANDLERS ---
  const handleRestoreClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingRestoreFile(file);
    setIsRestoreConfirmOpen(true);
    e.target.value = ''; 
  };

  const executeRestore = () => {
    if (!pendingRestoreFile) return;

    setIsRestoreConfirmOpen(false);
    setIsRestoring(true);
    setRestoreProgress(5);
    setRestoreStatus('Initializing restore...');

    const reader = new FileReader();
    reader.onload = (event) => {
      setTimeout(() => {
        try {
          setRestoreProgress(30);
          setRestoreStatus('Reading file...');
          
          const result = event.target?.result as string;
          const json = JSON.parse(result);
          
          setRestoreProgress(50);
          setRestoreStatus('Validating data...');

          if (!json.appData) {
            throw new Error("Invalid backup format: Missing appData.");
          }

          const { appData } = json;

          setTimeout(() => {
            setRestoreProgress(75);
            setRestoreStatus('Applying settings...');

            if (appData.companyProfile) setCompanyProfile(appData.companyProfile);
            if (appData.currency) setCurrency(appData.currency);
            if (appData.hourlyRate !== undefined) setHourlyRate(appData.hourlyRate);
            if (appData.promotionRules) setPromotionRules(appData.promotionRules);
            if (appData.courts) setCourts(appData.courts);
            if (appData.bookings) setBookings(appData.bookings);

            setTimeout(() => {
              setRestoreProgress(100);
              setRestoreStatus('Restore Complete!');
              
              setTimeout(() => {
                alert("Data restored successfully!");
                setIsRestoring(false);
                setPendingRestoreFile(null);
                onClose();
              }, 500);
            }, 800);
          }, 500);

        } catch (err) {
          console.error(err);
          alert("Failed to restore data. The file appears to be corrupted or incompatible.");
          setIsRestoring(false);
          setPendingRestoreFile(null);
        }
      }, 500);
    };

    reader.readAsText(pendingRestoreFile);
  };

  // --- FACTORY RESET & WIPE HANDLERS ---
  const initiateAction = (action: 'reset' | 'wipe') => {
    setPromptAction(action);
    setIsResetPromptOpen(true);
    setPasswordError(false);
    setPasswordInput('');
  };

  const confirmSecurityAction = () => {
    if (passwordInput === 'admin888') {
      if (promptAction === 'wipe') {
        onWipeData();
        alert("Booking data has been wiped successfully.");
      } else {
        onFactoryReset();
        alert("System has been fully reset successfully.");
      }
      setIsResetPromptOpen(false);
      onClose();
    } else {
      setPasswordError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[1050] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 relative">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database size={20} className="text-emerald-400" />
            Backup & Restore
          </h2>
          <button onClick={onClose} className="hover:bg-slate-700 p-1 rounded-full transition">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-6">
           <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4">
              <p className="text-sm text-gray-500 mb-2">Manage your system data securely.</p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                 <button 
                   onClick={handleOpenBackup}
                   className="flex-1 bg-white border border-slate-300 hover:border-emerald-500 hover:text-emerald-700 text-slate-700 px-4 py-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                 >
                   <Download size={18} /> Backup Data
                 </button>
                 <button 
                   onClick={handleRestoreClick}
                   className="flex-1 bg-slate-800 hover:bg-slate-900 text-white px-4 py-4 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                 >
                   <Upload size={18} /> Restore Data
                 </button>
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   onChange={handleFileChange} 
                   accept=".json" 
                   className="hidden" 
                 />
              </div>
              
              <div className="pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
                  <button 
                     onClick={() => initiateAction('wipe')}
                     className="flex-1 bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                     <Eraser size={16} /> Wipe Booking Data
                  </button>
                  <button 
                     onClick={() => initiateAction('reset')}
                     className="flex-1 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-4 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                     <AlertTriangle size={16} /> Factory Reset (All)
                  </button>
              </div>
           </div>
        </div>

        {/* --- OVERLAYS --- */}

        {/* Backup Configuration */}
        {isBackupConfigOpen && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur z-[60] flex flex-col items-center p-4 overflow-y-auto">
             <div className="w-full max-w-sm space-y-4 my-auto py-8">
               <div className="flex flex-col items-center">
                 <div className="bg-emerald-50 p-4 rounded-full mb-4">
                   <FolderOutput size={32} className="text-emerald-600" />
                 </div>
                 <h3 className="text-lg font-bold text-slate-800 mb-2">Create Backup</h3>
               </div>
             
               {/* Filename Input */}
               <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Filename</label>
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
                     <input 
                       type="text" 
                       value={backupFilename}
                       onChange={(e) => setBackupFilename(e.target.value)}
                       className="flex-1 px-3 py-2 text-sm outline-none text-gray-700 min-w-0"
                       placeholder="Enter filename"
                     />
                     <span className="bg-gray-100 text-gray-500 px-3 py-2 text-xs font-medium border-l shrink-0">.json</span>
                  </div>
               </div>

               {/* Directory Selection */}
               <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Destination Folder</label>
                  <div className="flex gap-2">
                     <div className="flex-1 bg-gray-50 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-600 truncate min-w-0">
                        {backupDirName ? (
                          <span className="font-semibold text-emerald-600 flex items-center gap-1 truncate">
                             <FolderOpen size={14} className="shrink-0"/> <span className="truncate">{backupDirName}</span>
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">
                            Default (Downloads Folder)
                          </span>
                        )}
                     </div>
                     <button 
                       type="button"
                       onClick={handleSelectDirectory}
                       className="px-3 rounded-lg flex items-center justify-center bg-gray-200 hover:bg-gray-300 text-gray-700 shrink-0"
                       title="Browse Folder"
                     >
                       <FolderOpen size={16} />
                     </button>
                  </div>
                  {directoryPickerError && (
                    <div className="p-2 bg-orange-50 border border-orange-100 rounded text-xs text-orange-600 mt-2 flex items-start gap-2">
                       <AlertTriangle size={14} className="shrink-0 mt-0.5" /> 
                       <span>{directoryPickerError}</span>
                    </div>
                  )}
               </div>

               {/* Save As Option */}
               {!backupDirHandle && (
                  <div className="flex items-center gap-2">
                     <input 
                       type="checkbox" 
                       id="saveAs" 
                       checked={useSaveAs}
                       onChange={(e) => setUseSaveAs(e.target.checked)}
                       disabled={!isFileSystemSupported}
                       className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50 shrink-0"
                     />
                     <label htmlFor="saveAs" className="text-xs text-gray-600 select-none cursor-pointer disabled:opacity-50">
                        Prompt for "Save As" location
                     </label>
                  </div>
               )}

               <div className="flex gap-3 pt-6 pb-2">
                  <button 
                    onClick={() => setIsBackupConfigOpen(false)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={executeBackup}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg shadow-sm transition flex items-center justify-center gap-2"
                  >
                    <Download size={16} /> Export
                  </button>
               </div>
             </div>
          </div>
        )}
        
        {/* Backup Progress Overlay */}
        {isBackingUp && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur z-[60] flex flex-col items-center justify-center p-8 animate-in fade-in">
             <div className="mb-4 relative">
                <Database size={48} className="text-emerald-600 animate-pulse" />
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow">
                   <Loader2 size={16} className="animate-spin text-emerald-600" />
                </div>
             </div>
             <h3 className="text-lg font-bold text-slate-800 mb-2">Backing Up Data</h3>
             <p className="text-sm text-gray-500 mb-6">{backupStatus}</p>
             
             <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 mb-1 overflow-hidden">
                <div 
                  className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${backupProgress}%` }}
                ></div>
             </div>
             <p className="text-xs text-gray-400 font-medium">{backupProgress}%</p>
          </div>
        )}

        {/* Restore Confirmation Overlay */}
        {isRestoreConfirmOpen && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur z-[60] flex flex-col items-center justify-center p-8 animate-in fade-in">
             <div className="bg-orange-50 p-4 rounded-full mb-4">
               <AlertTriangle size={32} className="text-orange-600" />
             </div>
             <h3 className="text-lg font-bold text-slate-800 mb-2">Confirm Restore</h3>
             <p className="text-sm text-gray-500 text-center mb-6 max-w-xs">
               This will <strong className="text-orange-600">overwrite</strong> all current bookings, customer data, and settings. This cannot be undone.
             </p>
             <div className="flex gap-3 w-full max-w-xs">
                <button 
                  onClick={() => { setIsRestoreConfirmOpen(false); setPendingRestoreFile(null); }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={executeRestore}
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 rounded-lg shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Upload size={16} /> Restore Now
                </button>
             </div>
          </div>
        )}

        {/* Restore Progress Overlay */}
        {isRestoring && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur z-[60] flex flex-col items-center justify-center p-8 animate-in fade-in">
             <div className="mb-4 relative">
                <Database size={48} className="text-orange-500 animate-pulse" />
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow">
                   <Loader2 size={16} className="animate-spin text-orange-500" />
                </div>
             </div>
             <h3 className="text-lg font-bold text-slate-800 mb-2">Restoring Database</h3>
             <p className="text-sm text-gray-500 mb-6">{restoreStatus}</p>
             
             <div className="w-full max-w-xs bg-gray-200 rounded-full h-2.5 mb-1 overflow-hidden">
                <div 
                  className="bg-orange-500 h-2.5 rounded-full transition-all duration-500 ease-out" 
                  style={{ width: `${restoreProgress}%` }}
                ></div>
             </div>
             <p className="text-xs text-gray-400 font-medium">{restoreProgress}%</p>
          </div>
        )}

        {/* Security Overlay for Reset/Wipe */}
        {isResetPromptOpen && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur z-50 flex flex-col items-center justify-center p-8 animate-in fade-in">
             <div className="bg-red-50 p-4 rounded-full mb-4">
               {promptAction === 'wipe' ? <Eraser size={32} className="text-orange-600"/> : <ShieldAlert size={32} className="text-red-600" />}
             </div>
             <h3 className="text-lg font-bold text-slate-800 mb-2">Security Verification</h3>
             <p className="text-sm text-gray-500 text-center mb-6 max-w-xs">
               {promptAction === 'wipe' ? (
                 <>This action will <strong className="text-orange-600">erase all booking history</strong>. Company settings will be preserved.</>
               ) : (
                 <>This action will <strong className="text-red-600">permanently erase</strong> all data and reset system to factory state.</>
               )}
             </p>
             <div className="w-full max-w-xs space-y-3">
                <input 
                  type="password" 
                  placeholder="Enter Admin Password"
                  value={passwordInput}
                  onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
                  className={`w-full border rounded-lg p-3 text-center tracking-widest ${passwordError ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                />
                {passwordError && <p className="text-xs text-red-500 text-center font-bold">Incorrect password</p>}
                
                <p className="text-[10px] text-gray-400 text-center mt-2">(Default: admin888)</p>

                <div className="flex gap-2 pt-2">
                   <button 
                     onClick={() => setIsResetPromptOpen(false)}
                     className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 rounded-lg transition"
                  >
                     Cancel
                   </button>
                   <button 
                     onClick={confirmSecurityAction}
                     className={`flex-1 text-white font-medium py-2 rounded-lg shadow-sm transition ${promptAction === 'wipe' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-red-600 hover:bg-red-700'}`}
                   >
                     {promptAction === 'wipe' ? 'Confirm Wipe' : 'Confirm Reset'}
                   </button>
                </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default BackupRestoreModal;
