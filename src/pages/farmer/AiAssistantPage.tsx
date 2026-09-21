import { useSpeechRecognition } from '../../hooks/useSpeechRecognition';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Mic, MicOff, Send, Sparkles, User, RefreshCw, Volume2, 
  VolumeX, Globe, Copy, Check, Info 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { 
  generateMultilingualAiResponse, detectQueryLanguage, 
  getSpeechLanguageCode, DetectedLanguage 
} from '../../lib/aiAdvisory';
import { useAuth } from '../../context/AuthContext';
import { db, Farmer } from '../../lib/db';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  lang?: DetectedLanguage;
}

export const AiAssistantPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [farmer, setFarmer] = useState<Farmer>(() => db.getFarmerByUserId(user?.id));
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'auto' | 'hi' | 'or' | 'en'>('auto');
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const refresh = () => setFarmer(db.getFarmerByUserId(user?.id));
    refresh();
    const unsub = db.subscribe('table:farmers', refresh);
    return () => unsub();
  }, [user?.id]);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: t('ai.welcome', 'Welcome Farmer! I am FPP AI Assistant. You can ask about Paddy/Wheat MSP rates, nearest procurement centres, slot booking, or DBT payment status in English, Hindi, or Odia.'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lang: 'en',
    },
  ]);

  // Update initial welcome message when language changes if no user conversation yet
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        const currentLang = (selectedLang !== 'auto' ? selectedLang : i18n.language) as DetectedLanguage;
        let welcomeText = t('ai.welcome', 'Welcome Farmer! I am FPP AI Assistant. You can ask about Paddy/Wheat MSP rates, nearest procurement centres, slot booking, or DBT payment status in English, Hindi, or Odia.');
        
        if (selectedLang === 'hi') {
          welcomeText = 'नमस्ते किसान भाई! मैं कृषि-फ्लो एआई सहायक हूँ। आप हिंदी, इंग्लिश या ओडिया में बोलकर या लिखकर फसल एमएसपी दर, नजदीकी मंडी, स्लॉट बुकिंग और PFMS डीबीटी भुगतान के बारे में पूछ सकते हैं।';
        } else if (selectedLang === 'or') {
          welcomeText = 'ନମସ୍କାର ଚାଷୀ ଭାଇ! ମୁଁ କୃଷି-ଫ୍ଲୋ AI ସହାୟକ। ଆପଣ ଓଡ଼ିଆ, ହିନ୍ଦୀ କିମ୍ବା ଇଂରାଜୀରେ କହି ବା ଲେଖି ଧାନ ଏମଏସପି ଦର, ମଣ୍ଡି ସ୍ଲଟ୍ ବୁକିଂ, ସରକାରୀ ଗାଡ଼ି ପିକଅପ୍ ଓ DBT ପେମେଣ୍ଟ ବିଷୟରେ ପଚାରିପାରିବେ।';
        }

        return [
          {
            ...prev[0],
            text: welcomeText,
            lang: currentLang,
          },
        ];
      }
      return prev;
    });
  }, [i18n.language, selectedLang, t]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Web Speech API with selected language
    const { isListening, isSupported, voiceError, toggle: toggleVoiceInput } = useSpeechRecognition({
    selectedLang,
    uiLang: i18n.language,
    onResult: (transcript) => {
      setInputText(transcript);
      handleSend(transcript, true);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speakText = (text: string, msgId: string, lang: DetectedLanguage = 'en') => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in this browser.');
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = getSpeechLanguageCode(lang);
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // .

  const handleSend = (customText?: string, wasSpoken: boolean = false) => {
    const text = customText || inputText;
    if (!text.trim()) return;

    // Detect language of the input query
    const detectedInputLang = detectQueryLanguage(
      text, 
      selectedLang !== 'auto' ? selectedLang : i18n.language
    );

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lang: detectedInputLang,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    setTimeout(() => {
      // Generate response in the exact same language as input
      const reply = generateMultilingualAiResponse(text, detectedInputLang);
      const aiMsgId = `ai-${Date.now()}`;

      const aiMsg: Message = {
        id: aiMsgId,
        sender: 'assistant',
        text: reply,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        lang: detectedInputLang,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsLoading(false);

      // If auto-speak enabled or input was spoken, speak out response
      if (autoSpeak || wasSpoken) {
        speakText(reply, aiMsgId, detectedInputLang);
      }
    }, 500);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPromptsByLang = {
    hi: [
      'धान और गेहूं का सरकारी MSP भाव क्या है?',
      'मंडी स्लॉट और टोकन कैसे बुक करें?',
      'निःशुल्क सरकारी वाहन पिकअप कैसे मिलेगा?',
      'डीबीटी भुगतान रसीद और QR कोड कैसे स्कैन करें?',
    ],
    or: [
      'ଧାନ ଏବଂ ଗହମର ସରକାରୀ ଏମଏସପି ଦର କେତେ?',
      'ମଣ୍ଡି ସ୍ଲଟ୍ ଓ ଟୋକନ୍ କିପରି ବୁକ୍ କରିବି?',
      'ମାଗଣା ସରକାରୀ ଗାଡ଼ି ପିକଅପ୍ କିପରି ମିଳିବ?',
      'DBT ପେମେଣ୍ଟ ରସିଦ୍ ଓ QR କୋଡ୍ କିପରି ସ୍କାନ୍ କରିବି?',
    ],
    en: [
      'What are the 2026 Paddy & Wheat MSP rates?',
      'How to book a 30-minute Mandi slot & get QR token?',
      'How to request free government vehicle pickup?',
      'How to check PFMS DBT payment and scan receipt QR code?',
    ],
  };

  const currentPrompts = selectedLang === 'hi' 
    ? quickPromptsByLang.hi 
    : selectedLang === 'or' 
    ? quickPromptsByLang.or 
    : quickPromptsByLang.en;

  const getLanguageLabel = (lang?: DetectedLanguage) => {
    switch (lang) {
      case 'hi':
        return '🇮🇳 हिन्दी';
      case 'or':
        return '🌾 ଓଡ଼ିଆ';
      case 'hinglish':
        return '🇮🇳 Hinglish';
      case 'en':
      default:
        return '🇬🇧 English';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 h-[calc(100vh-140px)] flex flex-col font-sans">
      {/* Top Header & Language Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🤖</span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              {t('ai.chatTitle', 'FPP Multilingual AI Assistant')}
            </h2>
            <span className="hidden sm:inline-flex text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
              🌾 {farmer.name} • {farmer.village}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Personalized advisory for {farmer.name} ({farmer.land_area_hectares} Ha • {farmer.district}). Ask in English, Hindi, or Odia.
          </p>
        </div>

        {/* Language Mode Selector */}
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200 shrink-0">
          <span className="text-[11px] font-bold text-slate-500 pl-2 hidden md:inline flex items-center gap-1">
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            Language:
          </span>
          <button
            onClick={() => setSelectedLang('auto')}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
              selectedLang === 'auto'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            Auto Detect
          </button>
          <button
            onClick={() => setSelectedLang('hi')}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
              selectedLang === 'hi'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            🇮🇳 हिन्दी
          </button>
          <button
            onClick={() => setSelectedLang('or')}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
              selectedLang === 'or'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            🌾 ଓଡ଼ିଆ
          </button>
          <button
            onClick={() => setSelectedLang('en')}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
              selectedLang === 'en'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            🇬🇧 English
          </button>
        </div>
      </div>

      {/* Main Chat Box Container */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col min-h-0">
        
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50/80">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Bot className="w-5 h-5" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-sm space-y-2 ${
                  m.sender === 'user'
                    ? 'bg-emerald-600 text-white rounded-br-none'
                    : 'bg-white text-slate-800 border border-slate-200/90 rounded-bl-none'
                }`}
              >
                {/* Language Tag on AI response */}
                {m.sender === 'assistant' && (
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 text-[10px]">
                    <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      {getLanguageLabel(m.lang)} Response
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => speakText(m.text, m.id, m.lang)}
                        className={`px-2 py-1 rounded-md font-bold text-[10px] flex items-center gap-1 transition-all ${
                          speakingMsgId === m.id
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                        title="Listen to audio reply"
                      >
                        {speakingMsgId === m.id ? (
                          <>
                            <VolumeX className="w-3 h-3" /> Stop Audio
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3 text-emerald-600" /> 🔊 Suno / Listen
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleCopy(m.text, m.id)}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded"
                        title="Copy text"
                      >
                        {copiedId === m.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                )}

                <p className="whitespace-pre-line text-slate-900 font-normal">
                  {m.text}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  {m.sender === 'user' ? (
                    <span className="text-emerald-100 text-[10px] font-medium bg-emerald-700/50 px-1.5 py-0.2 rounded">
                      Input: {getLanguageLabel(m.lang)}
                    </span>
                  ) : <span />}
                  <span className={m.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'}>
                    {m.time}
                  </span>
                </div>
              </div>

              {m.sender === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-slate-600 bg-white p-3 rounded-2xl border border-slate-200 w-fit text-xs shadow-sm">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
              <span className="font-semibold">
                AI is generating response in {selectedLang === 'hi' ? 'Hindi' : selectedLang === 'or' ? 'Odia' : 'your language'}...
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Prompts */}
        <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-extrabold text-slate-400 shrink-0 uppercase tracking-wider">
            Quick Ask:
          </span>
          {currentPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              className="text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 transition-colors shrink-0 font-medium cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input & Voice Bar */}
        <div className="p-4 bg-white border-t border-slate-200 space-y-2">
          <div className="flex items-center gap-2">
            {/* Voice Mic Button */}
            <button
              onClick={toggleVoiceInput}
              className={`p-3 rounded-2xl transition-all flex items-center justify-center cursor-pointer shadow-sm ${
                isListening
                  ? 'bg-rose-600 text-white ring-4 ring-rose-200 animate-pulse'
                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}
              title={
                isListening
                  ? 'Listening... Click to stop'
                  : `Voice Input (${selectedLang === 'hi' ? 'Hindi' : selectedLang === 'or' ? 'Odia' : 'Auto / Current'})`
              }
            >
              {isListening ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-emerald-700" />}
            </button>

            {/* Input Field */}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={
                isListening
                  ? selectedLang === 'hi'
                    ? '🎤 सुन रहा हूँ... हिंदी में बोलिए'
                    : selectedLang === 'or'
                    ? '🎤 ଶୁଣୁଛି... ଓଡ଼ିଆରେ କୁହନ୍ତୁ'
                    : '🎤 Listening... Speak in Hindi, Odia, or English'
                  : selectedLang === 'hi'
                  ? 'हिंदी या हिंगलिश में पूछें (जैसे: धान का भाव क्या है?)...'
                  : selectedLang === 'or'
                  ? 'ଓଡ଼ିଆରେ ପଚାରନ୍ତୁ (ଯଥା: ଧାନ ଦର କେତେ?)...'
                  : 'Type or speak in Hindi, Odia, or English (e.g. Dhaan ka bhav, MSP rates)...'
              }
              className="flex-1 bg-slate-50 border border-slate-300 rounded-2xl px-4 py-3 text-xs sm:text-sm text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-inner"
            />

            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={!inputText.trim()}
              className="p-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white transition-all shadow-md cursor-pointer disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {voiceError && (
  <p className="text-[11px] text-rose-600 px-1">{voiceError}</p>
)}

          {/* Voice status feedback bar */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
              {isListening 
                ? `Voice Active: Speaking in ${selectedLang === 'hi' ? 'Hindi' : selectedLang === 'or' ? 'Odia' : 'selected language'}...`
                : `Active Mode: ${selectedLang === 'auto' ? 'Auto Language Matching' : selectedLang === 'hi' ? 'Hindi (हिंदी)' : selectedLang === 'or' ? 'Odia (ଓଡ଼ିଆ)' : 'English'}`
              }
            </span>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-600 hover:text-slate-900">
              <input
                type="checkbox"
                checked={autoSpeak}
                onChange={(e) => setAutoSpeak(e.target.checked)}
                className="w-3.5 h-3.5 accent-emerald-600 rounded cursor-pointer"
              />
              <span className="text-[11px] font-semibold">🔊 Auto-speak replies</span>
            </label>
          </div>
        </div>

      </div>
    </div>
  );
};

