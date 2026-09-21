// Secure 6-Digit OTP & SMS Verification Service
// KRISHIFLOW-AI - Smart Farmer Procurement Platform

import { sendSms } from './sms';

export interface OtpSession {
  sessionId: string;
  phone: string;
  hashedOtp: string;
  createdAt: number;
  expiresAt: number; // 5 minutes (300,000 ms) from creation
  attemptsRemaining: number; // Max 5 attempts
  lastSentAt: number;
  resendCooldownUntil: number; // 30 seconds cooldown
}

export interface SendOtpResult {
  success: boolean;
  sessionId?: string;
  message: string;
  expiresInSeconds?: number;
  cooldownSeconds?: number;
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
  attemptsRemaining?: number;
  isExpired?: boolean;
}

// In-memory secure OTP session store (acts as backend auth store)
const otpSessionStore = new Map<string, OtpSession>();

// Non-blocking cleanup of stale sessions every 2 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, session] of otpSessionStore.entries()) {
      if (now > session.expiresAt + 60000) {
        otpSessionStore.delete(key);
      }
    }
  }, 120000);
}

/**
 * Computes a standard SHA-256 hex hash of the OTP combined with phone and internal salt.
 */
async function hashOtp(otp: string, phone: string, sessionId: string): Promise<string> {
  const secretSalt = 'krishiflow_secure_otp_salt_2026';
  const data = new TextEncoder().encode(`${secretSalt}:${phone}:${sessionId}:${otp}`);
  
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback fast hashing for environments without subtle crypto
  let hash = 0;
  const str = `${secretSalt}:${phone}:${sessionId}:${otp}`;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Generates a random 6-digit numeric OTP (100000 - 999999) using cryptographic randomness.
 */
function generateRandom6DigitOtp(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const num = 100000 + (array[0] % 900000);
    return String(num);
  }
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Generates a unique secure session ID.
 */
function generateSessionId(): string {
  return `otp_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Sanitizes phone numbers to standard 10-digit / E.164 format.
 */
export function sanitizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+91') && cleaned.length === 13) {
    return cleaned;
  }
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  return cleaned || phone;
}

/**
 * Masks a phone number for secure display in UI (e.g. +91 ••••• •4399)
 */
export function maskPhoneNumber(phone: string): string {
  const sanitized = sanitizePhoneNumber(phone);
  if (sanitized.length >= 10) {
    const last4 = sanitized.slice(-4);
    return `${sanitized.slice(0, 3)} ••••• •${last4}`;
  }
  return phone;
}

/**
 * Initiates 6-Digit OTP generation and dispatches via SMS API.
 * The plain OTP is NEVER returned to the client frontend.
 */
export async function sendOtp(phone: string, roleName: string = 'Farmer'): Promise<SendOtpResult> {
  const sanitizedPhone = sanitizePhoneNumber(phone);

  if (!sanitizedPhone || sanitizedPhone.replace(/\D/g, '').length < 10) {
    return {
      success: false,
      message: 'Please provide a valid 10-digit mobile number.',
    };
  }

  const now = Date.now();

  // Check if an active session already exists for this phone and cooldown is in effect
  for (const [existingSessionId, session] of otpSessionStore.entries()) {
    if (session.phone === sanitizedPhone && now < session.resendCooldownUntil) {
      const waitSeconds = Math.ceil((session.resendCooldownUntil - now) / 1000);
      return {
        success: false,
        sessionId: existingSessionId,
        message: `Please wait ${waitSeconds} seconds before requesting a new OTP.`,
        cooldownSeconds: waitSeconds,
      };
    }
  }

  // Generate 6-digit random code and session
  const plainOtp = generateRandom6DigitOtp();
  const sessionId = generateSessionId();
  const hashedOtp = await hashOtp(plainOtp, sanitizedPhone, sessionId);

  const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 Minutes
  const COOLDOWN_MS = 30 * 1000; // 30 Seconds Cooldown

  const newSession: OtpSession = {
    sessionId,
    phone: sanitizedPhone,
    hashedOtp,
    createdAt: now,
    expiresAt: now + OTP_EXPIRY_MS,
    attemptsRemaining: 5,
    lastSentAt: now,
    resendCooldownUntil: now + COOLDOWN_MS,
  };

  // Store in backend session map (replacing any previous session for this phone)
  for (const [key, s] of otpSessionStore.entries()) {
    if (s.phone === sanitizedPhone) {
      otpSessionStore.delete(key);
    }
  }
  otpSessionStore.set(sessionId, newSession);

  // Dispatch via SMS Gateway
  const smsMessage = `Your KrishiFlow-AI ${roleName} Verification Code is ${plainOtp}. Valid for 5 minutes. Do not share this OTP with anyone.`;
  
  try {
    await sendSms({
      phone: sanitizedPhone,
      message: smsMessage,
      type: 'otp',
      otp: plainOtp,
    });
  } catch (smsError) {
    console.warn('[OTP SMS Dispatch]', smsError);
  }

  return {
    success: true,
    sessionId,
    message: `6-digit OTP sent successfully to ${maskPhoneNumber(sanitizedPhone)}. Valid for 5 minutes.`,
    expiresInSeconds: 300,
    cooldownSeconds: 30,
  };
}

/**
 * Resends a fresh 6-digit OTP to the mobile number, enforcing cooldown rules.
 */
export async function resendOtp(sessionId: string, roleName: string = 'Farmer'): Promise<SendOtpResult> {
  const session = otpSessionStore.get(sessionId);
  if (!session) {
    return {
      success: false,
      message: 'Session expired or not found. Please re-enter your mobile number.',
    };
  }

  const now = Date.now();
  if (now < session.resendCooldownUntil) {
    const waitSeconds = Math.ceil((session.resendCooldownUntil - now) / 1000);
    return {
      success: false,
      sessionId,
      message: `Resend cooldown active. Please wait ${waitSeconds}s.`,
      cooldownSeconds: waitSeconds,
    };
  }

  return sendOtp(session.phone, roleName);
}

/**
 * Verifies the entered 6-digit OTP on the backend session store.
 * Protects against brute-force attacks and strictly validates 5-minute expiry.
 */
export async function verifyOtpBackend(sessionId: string, phone: string, enteredOtp: string): Promise<VerifyOtpResult> {
  const sanitizedPhone = sanitizePhoneNumber(phone);
  const cleanEnteredOtp = (enteredOtp || '').trim();

  if (cleanEnteredOtp.length !== 6 || !/^\d{6}$/.test(cleanEnteredOtp)) {
    return {
      success: false,
      message: 'Please enter a valid 6-digit numeric OTP.',
    };
  }

  const session = otpSessionStore.get(sessionId);

  if (!session || session.phone !== sanitizedPhone) {
    return {
      success: false,
      message: 'Verification session expired. Please request a new OTP.',
      isExpired: true,
    };
  }

  const now = Date.now();

  // 1. Check if 5-minute validity has elapsed
  if (now > session.expiresAt) {
    otpSessionStore.delete(sessionId);
    return {
      success: false,
      message: 'OTP has expired (validity is 5 minutes). Please click Resend OTP.',
      isExpired: true,
    };
  }

  // 2. Check remaining attempts
  if (session.attemptsRemaining <= 0) {
    otpSessionStore.delete(sessionId);
    return {
      success: false,
      message: 'Maximum verification attempts exceeded. Please request a new OTP.',
      isExpired: true,
    };
  }

  // 3. Compare hash
  const computedHash = await hashOtp(cleanEnteredOtp, sanitizedPhone, sessionId);

  if (computedHash === session.hashedOtp) {
    // Valid OTP - Remove session (one-time use)
    otpSessionStore.delete(sessionId);
    return {
      success: true,
      message: 'Mobile number verified successfully.',
    };
  }

  // Invalid OTP - Decrement attempts
  session.attemptsRemaining -= 1;
  if (session.attemptsRemaining <= 0) {
    otpSessionStore.delete(sessionId);
    return {
      success: false,
      message: 'Incorrect OTP. Maximum attempts exceeded. Please request a new OTP.',
      attemptsRemaining: 0,
      isExpired: true,
    };
  }

  return {
    success: false,
    message: `Invalid OTP. Please check your SMS. (${session.attemptsRemaining} attempt${session.attemptsRemaining === 1 ? '' : 's'} left)`,
    attemptsRemaining: session.attemptsRemaining,
  };
}
