
import React, { useState } from 'react';
import { User, Lock, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
  error?: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, error }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setLoading(true);
    // Simulate slight network delay for better UX feel
    await new Promise(r => setTimeout(r, 500));
    await onLogin(username, password);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black p-6">
      <div className="bg-white rounded-3xl shadow-2xl shadow-emerald-500/10 w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in duration-500">
        
        {/* Header Branding */}
        <div className="bg-slate-950 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden">
           <div className="absolute inset-0 bg-emerald-500/10" style={{ backgroundImage: 'radial-gradient(rgba(16, 185, 129, 0.2) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
           
           <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-slate-800 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white mb-4 relative z-10">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-10 h-10">
                 <path d="M12 20V13" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
                 <path d="M12 20C12 21.1 11.1 22 10 22H14C12.9 22 12 21.1 12 20Z" fill="white" fillOpacity="0.3" stroke="none"/>
                 <path d="M10 22H14C12.9 22 12 21.1 12 20" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
                 <path d="M12 13L8 4H16L12 13Z" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
                 <path d="M8 4L6 2" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
                 <path d="M16 4L18 2" stroke="white" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
           </div>
           
           <h1 className="text-2xl font-bold text-white tracking-tight relative z-10">SmashPoint</h1>
           <p className="text-xs text-emerald-500 font-bold uppercase tracking-[0.3em] relative z-10 mt-1">Court System</p>
        </div>

        {/* Login Form */}
        <div className="p-8 pt-10">
           <div className="mb-6 text-center">
              <h2 className="text-lg font-bold text-slate-800">Welcome Back</h2>
              <p className="text-slate-500 text-sm">Please sign in to your account</p>
           </div>

           <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase ml-1">Username</label>
                 <div className="relative">
                    <User size={18} className="absolute left-3 top-3.5 text-slate-400" />
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-transparent transition-all outline-none"
                      placeholder="Enter username"
                      autoFocus
                    />
                 </div>
              </div>

              <div className="space-y-1">
                 <label className="text-xs font-bold text-slate-500 uppercase ml-1">Password</label>
                 <div className="relative">
                    <Lock size={18} className="absolute left-3 top-3.5 text-slate-400" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-transparent transition-all outline-none"
                      placeholder="Enter password"
                    />
                 </div>
              </div>

              {error && (
                 <div className="bg-red-50 text-red-600 text-xs font-semibold p-3 rounded-lg flex items-center justify-center gap-2 animate-in slide-in-from-top-2">
                    <ShieldCheck size={14} /> {error}
                 </div>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all active:scale-95 mt-4 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                 {loading ? 'Authenticating...' : 'Sign In'} 
                 {!loading && <ArrowRight size={18} />}
              </button>
           </form>
           
           <div className="mt-8 text-center">
              <p className="text-xs text-slate-400">
                 Protected by NEOTECH Security
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
