// Real-Time Live Clock & Date Badge Component (Ticking Every Second)
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React, { useState, useEffect } from 'react';
import { Clock, Calendar } from 'lucide-react';

interface LiveClockProps {
  showDate?: boolean;
  showTime?: boolean;
  showSeconds?: boolean;
  showIcon?: boolean;
  compact?: boolean;
  variant?: 'light' | 'dark' | 'glass' | 'minimal';
  className?: string;
}

export const LiveClock: React.FC<LiveClockProps> = ({
  showDate = true,
  showTime = true,
  showSeconds = true,
  showIcon = true,
  compact = false,
  variant = 'light',
  className = '',
}) => {
  const [time, setTime] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formattedDate = time.toLocaleDateString('en-IN', {
    weekday: compact ? 'short' : 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const formattedTime = time.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: showSeconds ? '2-digit' : undefined,
    hour12: true,
  });

  const variantStyles = {
    light: 'bg-slate-100/90 text-slate-800 border-slate-200/80 shadow-xs',
    dark: 'bg-slate-800/90 text-slate-100 border-slate-700/80 shadow-xs',
    glass: 'bg-white/10 backdrop-blur-md text-white border-white/20 shadow-sm',
    minimal: 'bg-transparent text-slate-600 border-transparent',
  };

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl border text-xs font-semibold tracking-tight transition-colors ${
        variantStyles[variant]
      } ${className}`}
      title="Real-time Indian Standard Time (IST) Clock"
    >
      {showIcon && (
        <span className="relative flex h-2 w-2 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
      )}

      {showDate && (
        <span className="inline-flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{formattedDate}</span>
          {showTime && <span className="opacity-40">•</span>}
        </span>
      )}

      {showTime && (
        <span className="inline-flex items-center gap-1 font-mono font-bold text-slate-900 dark:text-white">
          <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{formattedTime}</span>
        </span>
      )}

      <span className="hidden md:inline-block text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-100/80 text-emerald-800 border border-emerald-300/40">
        IST
      </span>
    </div>
  );
};
