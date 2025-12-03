
import React from 'react';
import { 
  X, 
  LayoutDashboard, 
  PlusCircle, 
  FileText, 
  Settings, 
  Database, 
  RotateCcw,
  Wallet,
  Printer,
  ChevronRight,
  Edit3,
  Eraser,
  ShieldCheck,
  Lock,
  RefreshCw,
  LogOut,
  UserCircle,
  Briefcase,
  Users,
  Key
} from 'lucide-react';
import { CompanyProfile, User } from '../types';

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
  companyProfile: CompanyProfile;
  currentUser: User | null;
  onNewBooking: () => void;
  onOpenReports: () => void;
  onOpenSettings: () => void;
  onOpenBatchAmend?: () => void;
  onOpenBackupRestore?: () => void; 
  onWipeData?: () => void;
  onFactoryReset: () => void;
  onReIndexData?: () => void;
  isActivated?: boolean;
  onOpenActivation?: () => void;
  onOpenUserManagement?: () => void;
  onLogout: () => void;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({
  isOpen,
  onClose,
  companyProfile,
  currentUser,
  onNewBooking,
  onOpenReports,
  onOpenSettings,
  onOpenBatchAmend,
  onOpenBackupRestore,
  onWipeData,
  onFactoryReset,
  onReIndexData,
  isActivated = false,
  onOpenActivation,
  onOpenUserManagement,
  onLogout
}) => {
  const backdropClass = isOpen 
    ? "opacity-100 pointer-events-auto" 
    : "opacity-0 pointer-events-none";
  
  const drawerClass = isOpen 
    ? "translate-x-0 shadow-2xl" 
    : "-translate-x-full";

  const NavItem = ({ icon: Icon, label, onClick, highlight = false, description }: { icon: any, label: string, onClick: () => void, highlight?: boolean, description?: string }) => (
    <button 
      onClick={() => { onClose(); onClick(); }}
      className={`w-full flex items-center gap-4 px-5 py-4 mx-0 transition-all group relative overflow-hidden ${
        highlight 
          ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/30' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-white border-l-4 border-transparent hover:border-emerald-500'
      }`}
    >
      <Icon size={20} className={`shrink-0 ${highlight ? 'text-white' : 'text-slate-500 group-hover:text-emerald-400 transition-colors'}`} />
      <div className="text-left flex-1 min-w-0">
        <span className={`block font-medium text-sm tracking-wide truncate ${highlight ? 'text-white' : ''}`}>{label}</span>
        {description && <span className={`block text-[10px] truncate mt-0.5 font-normal opacity-80`}>{description}</span>}
      </div>
      {!highlight && <ChevronRight size={14} className="ml-auto opacity-0 group-hover:opacity-50 transition-all duration-300 -translate-x-2 group-hover:translate-x-0" />}
    </button>
  );

  const SectionHeader = ({ label }: { label: string }) => (
    <div className="px-6 mt-8 mb-4 flex items-center gap-3">
      <div className="h-px bg-slate-800 flex-1"></div>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
      <div className="h-px bg-slate-800 flex-1"></div>
    </div>
  );

  const hasPermission = (perm: string) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    return currentUser.permissions.includes(perm as any);
  };

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-950/80 z-[1000] transition-opacity duration-300 backdrop-blur-sm ${backdropClass}`}
        onClick={onClose}
      />

      <div className={`fixed top-0 left-0 h-full w-80 bg-[#0f172a] z-[1010] transform transition-transform duration-300 ease-in-out flex flex-col border-r border-slate-900 ${drawerClass}`}>
        
        {/* Branding Header */}
        <div className="p-8 border-b border-slate-800 bg-[#0f172a] relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
             <Briefcase size={120} />
          </div>
          
          <div className="flex justify-between items-start mb-6 relative z-10">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-slate-900 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-900/20 text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
                     <path d="M12 20V13" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
                     <path d="M12 20C12 21.1 11.1 22 10 22H14C12.9 22 12 21.1 12 20Z" fill="white" fillOpacity="0.3" stroke="none"/>
                     <path d="M10 22H14C12.9 22 12 21.1 12 20" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
                     <path d="M12 13L8 4H16L12 13Z" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
                     <path d="M8 4L6 2" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
                     <path d="M16 4L18 2" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
                     <path d="M12 13L5 6" stroke="white" strokeOpacity="0.5"/>
                     <path d="M12 13L19 6" stroke="white" strokeOpacity="0.5"/>
                  </svg>
                </div>
                <div className="overflow-hidden">
                    <h2 className="font-bold text-lg text-white leading-tight truncate tracking-tight">SmashPoint</h2>
                    <p className="text-[10px] text-emerald-500 font-bold tracking-widest uppercase flex items-center gap-1.5 mt-1">
                       Court System
                    </p>
                </div>
             </div>
             <button onClick={onClose} className="text-slate-500 hover:text-white p-2 transition">
                <X size={20} />
             </button>
          </div>

          {/* Licensed To */}
          <div className="mb-4">
             <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Licensed Venue</p>
             <p className="text-xs text-slate-300 font-medium truncate">{companyProfile.name}</p>
          </div>

          {/* License Widget */}
          <div 
             onClick={() => { if(!isActivated && onOpenActivation) onOpenActivation(); }}
             className={`relative overflow-hidden flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer group z-10 ${
                isActivated 
                  ? 'bg-slate-900/50 border-slate-800 hover:border-emerald-500/30' 
                  : 'bg-rose-950/20 border-rose-900 hover:border-rose-500/40'
             }`}
           >
              <div className={`p-2 rounded-lg ${isActivated ? 'bg-emerald-500/20 text-emerald-500' : 'bg-rose-500/20 text-rose-500'}`}>
                 {isActivated ? <ShieldCheck size={16} /> : <Lock size={16} />}
              </div>
              <div className="text-left flex-1 min-w-0">
                 <div className={`text-[10px] font-bold uppercase tracking-wider ${isActivated ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {isActivated ? 'Enterprise' : 'Trial Version'}
                 </div>
                 <div className="text-[11px] text-slate-400 truncate">
                    {isActivated ? 'License Active' : 'Activation Required'}
                 </div>
              </div>
           </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-2 custom-scrollbar">
          
          <NavItem icon={LayoutDashboard} label="Dashboard" onClick={() => {}} />
          
          {hasPermission('manage_bookings') && (
            <NavItem icon={PlusCircle} label="New Reservation" description="Create booking" onClick={onNewBooking} highlight />
          )}
          
          {(hasPermission('batch_tools') || hasPermission('manage_payments')) && (
             <SectionHeader label="Operations" />
          )}
          
          {hasPermission('batch_tools') && (
            <NavItem icon={Edit3} label="Batch Amendment" onClick={() => onOpenBatchAmend && onOpenBatchAmend()} />
          )}
          
          {hasPermission('manage_payments') && (
            <NavItem icon={RotateCcw} label="Refund Management" onClick={onOpenReports} />
          )}

          {hasPermission('view_reports') && (
            <>
              <SectionHeader label="Reporting" />
              <NavItem icon={FileText} label="Financial Reports" onClick={onOpenReports} />
              <NavItem icon={Printer} label="Reprint Documents" onClick={onOpenReports} />
            </>
          )}

          <SectionHeader label="System" />
          
          {hasPermission('manage_settings') && (
            <NavItem icon={Settings} label="Global Settings" onClick={onOpenSettings} />
          )}
          
          {hasPermission('system_maintenance') && (
            <>
              <NavItem icon={Database} label="Backup & Restore" onClick={() => onOpenBackupRestore && onOpenBackupRestore()} />
              <NavItem icon={RefreshCw} label="Optimize Database" onClick={() => onReIndexData && onReIndexData()} />
              <NavItem icon={Eraser} label="Wipe Data" onClick={() => onWipeData && onWipeData()} />
            </>
          )}

          {currentUser?.role === 'admin' && (
             <>
               <NavItem icon={Users} label="User Management" onClick={() => onOpenUserManagement && onOpenUserManagement()} />
             </>
          )}

        </div>

        {/* Footer User Profile */}
        <div className="p-5 bg-[#0b1120] border-t border-slate-900">
           <div className="flex items-center gap-4 p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer group shadow-lg">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-white border-2 border-slate-800 shadow-md group-hover:scale-105 transition-transform">
                 <UserCircle size={24} />
              </div>
              <div className="flex-1 min-w-0">
                 <div className="text-sm font-bold text-white truncate">{currentUser?.name || 'Guest'}</div>
                 <div className="text-[10px] text-slate-400 truncate capitalize">{currentUser?.role || 'Access'}</div>
              </div>
              <button 
                onClick={onLogout}
                className="text-slate-500 hover:text-rose-500 transition-colors"
                title="Logout"
              >
                 <LogOut size={18} />
              </button>
           </div>
        </div>
      </div>
    </>
  );
};

export default SidebarMenu;
