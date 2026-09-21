// src/hooks/useSpeechRecognition.ts
import { useEffect, useRef, useState, useCallback } from 'react';

type SpeechLang = 'auto' | 'hi' | 'or' | 'en';

const LOCALE_MAP: Record<'hi' | 'or' | 'en', string> = {
  hi: 'hi-IN',
  or: 'or-IN',
  en: 'en-IN',
};

interface Options {
  selectedLang: SpeechLang;
  uiLang: string;          // i18n.language
  onResult: (transcript: string) => void;
}

export function useSpeechRecognition({ selectedLang, uiLang, onResult }: Options) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult; // always fresh — kills the stale-closure bug

  const resolveLocale = useCallback((): string => {
    if (selectedLang === 'auto') {
      return uiLang === 'or' ? 'or-IN' : uiLang === 'hi' ? 'hi-IN' : 'en-IN';
    }
    return LOCALE_MAP[selectedLang];
  }, [selectedLang, uiLang]);

  // Create the recognition object ONCE. No more re-creation on every
  // language switch, no more orphaned instances.
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      setVoiceError(null);
      onResultRef.current(event.results[0][0].transcript);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      switch (event.error) {
        case 'not-allowed':
        case 'service-not-allowed':
          setVoiceError('Microphone access was denied. Please allow the microphone permission for this site.');
          break;
        case 'no-speech':
          setVoiceError('No speech detected. Please try again.');
          break;
        case 'audio-capture':
          setVoiceError('No microphone found. Please connect a microphone.');
          break;
        case 'language-not-supported':
          setVoiceError('Voice input for this language isn\u2019t supported by your browser yet. Try Hindi/English, or type your question.');
          break;
        case 'network':
          setVoiceError('Network error during voice recognition. Check your connection and try again.');
          break;
        default:
          setVoiceError('Voice recognition failed. Please try again or type your question.');
      }
    };

    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try { recognition.abort(); } catch { /* already stopped */ }
      recognitionRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      setVoiceError('Speech recognition isn\u2019t supported in this browser. Use Chrome/Edge, or type your question.');
      return;
    }
    if (isListening) return;

    setVoiceError(null);
    recognition.lang = resolveLocale();
    try {
      recognition.start();
      setIsListening(true);
    } catch (err) {
      console.warn('SpeechRecognition failed to start:', err);
      setIsListening(false);
      setVoiceError('Could not start voice recognition. Please try again.');
    }
  }, [isListening, resolveLocale]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggle = useCallback(() => (isListening ? stop() : start()), [isListening, start, stop]);

  return { isListening, isSupported, voiceError, toggle };
}