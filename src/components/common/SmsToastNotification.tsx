// Real-Time Mobile SMS Notification Banner
// KRISHIFLOW-AI - Smart Farmer Procurement Platform

import React, { useState, useEffect } from 'react';
import { Smartphone, CheckCircle, Copy, X, ShieldAlert, Sparkles } from 'lucide-react';
import { SmsLog } from '../../lib/sms';

export const SmsToastNotification: React.FC = () => {
  const [activeSms, setActiveSms] = useState<SmsLog | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleSmsDispatched = (event: Event) => {
      const customEvent = event as CustomEvent<SmsLog>;
      if (customEvent.detail) {
        setActiveSms(customEvent.detail);
        setCopied(false);
      }
    };

    window.addEventListener('krishiflow:sms_dispatched', handleSmsDispatched);
    return () => {
      window.removeEventListener('krishiflow:sms_dispatched', handleSmsDispatched);
    };
  }, []);

  if (!activeSms) return null;

  // Extract 6-digit OTP if present in message
  const otpMatch = activeSms.message.match(/\b\d{6}\b/);
  const detectedOtp = otpMatch ? otpMatch[0] : null;

  const handleCopyOtp = () => {
    if (detectedOtp) {
      navigator.clipboard.writeText(detectedOtp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const isRealCarrier = activeSms.provider && activeSms.provider.includes('delivered');

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-96 animate-bounce-short font-sans">
      <div className="bg-slate-900 text-white rounded-2xl shadow-2xl border-2 border-emerald-500/80 p-4 relative overflow-hidden backdrop-blur-md">
        
        {/* Top Glow bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 animate-pulse" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xs text-white">📱 SMS: KRIFLO</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                  isRealCarrier 
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/50' 
                    : 'bg-blue-500/30 text-blue-300 border border-blue-500/50'
                }`}>
                  {isRealCarrier ? 'SIM Delivered' : 'Instant Dispatch'}
                </span>
              </div>
              <span className="text-[10px] text-slate-400">To: {activeSms.phone} • {activeSms.timestamp}</span>
            </div>
          </div>

          <button
            onClick={() => setActiveSms(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* SMS Message Body */}
        <p className="text-xs text-slate-200 leading-relaxed font-sans bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 select-all">
          {activeSms.message}
        </p>

        {/* Action / OTP Quick Copy */}
        {detectedOtp && (
          <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400">Your OTP:</span>
              <span className="font-mono font-black text-emerald-400 text-sm tracking-widest bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                {detectedOtp}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCopyOtp}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all cursor-pointer"
            >
              {copied ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-white" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
