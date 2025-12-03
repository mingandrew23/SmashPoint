
import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Bot, X, Loader2, Sparkles } from 'lucide-react';
import { Booking, Court, CompanyProfile } from '../types';
import { askAssistant } from '../services/geminiService';

interface AIAssistantProps {
  bookings: Booking[];
  courts: Court[];
  currentDate: string;
  companyProfile: CompanyProfile; // Added to get API Key
}

interface Message {
  role: 'user' | 'assistant';
  text: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ bookings, courts, currentDate, companyProfile }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Hi! I can help check availability, customer details, or payment status. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);

    const response = await askAssistant(userMsg, bookings, courts, currentDate, companyProfile.apiKey);
    
    setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    setIsLoading(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-[500] flex flex-col items-end pointer-events-none">
      
      {/* Chat Window */}
      {isOpen && (
        <div className="pointer-events-auto bg-white rounded-2xl shadow-2xl w-80 sm:w-96 mb-4 border border-gray-100 overflow-hidden flex flex-col animate-in slide-in-from-bottom-5 duration-200">
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2">
              <div className="bg-white/20 p-1.5 rounded-full">
                <Bot size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">SmashBot</h3>
                <p className="text-[10px] opacity-80">AI Schedule Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1 rounded-full transition">
              <X size={16} />
            </button>
          </div>

          <div ref={scrollRef} className="h-80 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`
                    max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm
                    ${m.role === 'user' 
                      ? 'bg-emerald-600 text-white rounded-tr-none' 
                      : 'bg-white text-gray-700 border border-gray-100 rounded-tl-none'}
                  `}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-500 border border-gray-100 rounded-2xl rounded-tl-none px-4 py-2 text-sm shadow-sm flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Thinking...
                </div>
              </div>
            )}
          </div>

          <div className="p-3 bg-white border-t border-gray-100">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about slots..."
                className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
              <button 
                type="submit" 
                disabled={!input.trim() || isLoading}
                className="bg-emerald-600 text-white p-2 rounded-full hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 flex items-center gap-2 group"
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} className="text-yellow-300" />}
        {!isOpen && <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-sm font-medium">Ask AI Assistant</span>}
      </button>

    </div>
  );
};

export default AIAssistant;
