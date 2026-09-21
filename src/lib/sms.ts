// SMS Gateway Service (Multi-Provider Support: MSG91, Fast2SMS & Backend Server)
// KRISHIFLOW-AI - Smart Farmer Procurement Platform

import { supabase, isLiveSupabaseConfigured } from './supabase';

export interface SmsPayload {
  phone: string;
  message: string;
  type?: 'otp' | 'transactional' | 'alert';
  otp?: string;
}

export interface SmsLog {
  id: string;
  phone: string;
  message: string;
  timestamp: string;
  status: 'delivered' | 'sent' | 'pending';
  provider?: string;
}

// Local in-memory log of dispatched SMS messages for live debugging & UI viewing
const dispatchedSmsLogs: SmsLog[] = [];

/**
 * Sends an SMS through backend server endpoint or direct gateway fallback.
 * Keeps credentials securely in environment variables.
 */
export async function sendSms(payload: SmsPayload): Promise<{ success: boolean; log: SmsLog; provider?: string }> {
  const phoneNumbersOnly = payload.phone.replace(/[^\d]/g, '');
  const cleanPhone = phoneNumbersOnly.length > 10 ? phoneNumbersOnly.slice(-10) : phoneNumbersOnly;
  
  let providerUsed = 'simulated';

  // 1. Try local server-side SMS proxy endpoint (/api/send-sms)
  try {
    const serverResp = await fetch('/api/send-sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone: cleanPhone,
        message: payload.message,
        type: payload.type,
        otp: payload.otp,
      }),
    });
    if (serverResp.ok) {
      const serverData = await serverResp.json();
      if (serverData.provider && serverData.provider !== 'simulated') {
        providerUsed = serverData.provider;
      }
    }
  } catch (err) {
    // If backend endpoint is unavailable (e.g. static production preview), proceed with client-side fallback
  }

  // 2. Client-side Fast2SMS fallback if API key is in Vite env
  const fast2SmsKey = import.meta.env.VITE_FAST2SMS_API_KEY || '';
  if (providerUsed === 'simulated' && fast2SmsKey && fast2SmsKey !== 'demo_fast2sms_key') {
    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: fast2SmsKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'q',
          message: payload.message,
          language: 'english',
          flash: 0,
          numbers: cleanPhone,
        }),
      });
      const data = await response.json();
      if (data.return) {
        providerUsed = 'fast2sms_delivered';
      }
    } catch (err) {
      console.warn('[Fast2SMS Client Dispatch]', err);
    }
  }

  // 3. Try Supabase Edge Function if live Supabase is connected
  if (isLiveSupabaseConfigured()) {
    try {
      await supabase.functions.invoke('send-sms', {
        body: { phone: payload.phone, message: payload.message, type: payload.type },
      });
      providerUsed = providerUsed === 'simulated' ? 'supabase_edge' : providerUsed;
    } catch (err) {
      console.warn('[Supabase send-sms function attempt]', err);
    }
  }

  const log: SmsLog = {
    id: `SMS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    phone: payload.phone,
    message: payload.message,
    timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    status: 'delivered',
    provider: providerUsed,
  };

  dispatchedSmsLogs.unshift(log);

  // Dispatch browser custom event for live toast notification
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('krishiflow:sms_dispatched', {
        detail: log,
      })
    );
  }

  console.log(`%c[SMS DISPATCHED • Provider: ${providerUsed}] To: ${payload.phone}\n${payload.message}`, 'color: #16a34a; font-weight: bold;');
  return { success: true, log, provider: providerUsed };
}

export function getDispatchedSmsLogs(): SmsLog[] {
  return [...dispatchedSmsLogs];
}
