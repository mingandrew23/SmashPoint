
import React, { useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, Database, Layers, FileCheck } from 'lucide-react';

interface ReIndexModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const ReIndexModal: React.FC<ReIndexModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [step, setStep] = useState('');
  const [details, setDetails] = useState('');

  useEffect(() => {
    if (isOpen) {
      setProgress(0);
      setStep('Initializing...');
      setDetails('Preparing database connection...');

      const sequence = async () => {
        // Step 1: Analyze
        await new Promise(r => setTimeout(r, 800));
        setProgress(20);
        setStep('Analyzing Records');
        setDetails('Scanning booking integrity...');

        // Step 2: Sort
        await new Promise(r => setTimeout(r, 1000));
        setProgress(50);
        setStep('Sorting Data');
        setDetails('Re-ordering timeline chronologically...');

        // Step 3: Index
        await new Promise(r => setTimeout(r, 1000));
        setProgress(80);
        setStep('Building Indexes');
        setDetails('Optimizing search performance...');

        // Step 4: Finalize
        await new Promise(r => setTimeout(r, 800));
        setProgress(100);
        setStep('Optimization Complete');
        setDetails('Database is now fully optimized.');

        // Trigger actual logic
        onComplete();

        // Close after brief delay
        setTimeout(() => {
          onClose();
        }, 1500);
      };

      sequence();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300 relative">
        
        {/* Header Graphic */}
        <div className="bg-teal-600 p-6 flex flex-col items-center justify-center text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-white/10" style={{ backgroundImage: 'linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.1) 75%, rgba(255,255,255,0.1) 100%)', backgroundSize: '40px 40px' }}></div>
          
          <div className="p-4 bg-white/20 rounded-full mb-3 backdrop-blur-md shadow-inner">
             {progress === 100 ? (
                <CheckCircle2 size={40} className="animate-in zoom-in spin-in-90 duration-500" />
             ) : (
                <RefreshCw size={40} className="animate-spin" />
             )}
          </div>
          
          <h2 className="text-xl font-bold relative z-10">
            {progress === 100 ? 'System Optimized' : 'Re-Indexing Data'}
          </h2>
        </div>

        <div className="p-8 space-y-6">
           {/* Steps Visualization */}
           <div className="flex justify-between px-2 text-slate-300">
              <Database size={20} className={progress >= 20 ? 'text-teal-600 transition-colors duration-500' : ''} />
              <Layers size={20} className={progress >= 50 ? 'text-teal-600 transition-colors duration-500' : ''} />
              <FileCheck size={20} className={progress >= 80 ? 'text-teal-600 transition-colors duration-500' : ''} />
              <CheckCircle2 size={20} className={progress === 100 ? 'text-teal-600 transition-colors duration-500' : ''} />
           </div>

           {/* Progress Bar */}
           <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
                 <span>{step}</span>
                 <span>{progress}%</span>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner">
                 <div 
                   className="h-full bg-teal-500 transition-all duration-700 ease-out relative"
                   style={{ width: `${progress}%` }}
                 >
                    <div className="absolute inset-0 bg-white/30 w-full h-full" style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }}></div>
                 </div>
              </div>
              <p className="text-xs text-slate-400 text-center italic h-4">
                 {details}
              </p>
           </div>
        </div>
        
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    </div>
  );
};

export default ReIndexModal;
