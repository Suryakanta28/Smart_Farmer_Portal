// Floating AI Chat Assistant with Multilingual Voice Input & Speech Output
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, X, Send, Mic, MicOff, Sparkles, User, RefreshCw, 
  Volume2, VolumeX, Globe, Copy, Check 
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { supabase, isLiveSupabaseConfigured } from '../../lib/supabase';
import { 
  generateMultilingualAiResponse, detectQueryLanguage, 
  getSpeechLanguageCode, DetectedLanguage 
} from '../../lib/aiAdvisory';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  lang?: DetectedLanguage;
}

export const FloatingAiAssistant: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'auto' | 'hi' | 'or' | 'en'>('auto');
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: t('ai.welcome', 'Welcome Farmer! I am your AI Assistant. You can ask about Paddy/Wheat MSP rates, nearest procurement centres, slot booking, or DBT payment status in English, Hindi, or Odia.'),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lang: 'en',
    },
  ]);

  // Update initial welcome message when language changes if no user conversation yet
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].id === 'welcome') {
        const currentLang = (selectedLang !== 'auto' ? selectedLang : i18n.language) as DetectedLanguage;
        let welcomeText = t('ai.welcome', 'Welcome Farmer! I am your AI Assistant. You can ask about Paddy/Wheat MSP rates, nearest procurement centres, slot booking, or DBT payment status in English, Hindi, or Odia.');
        
        if (selectedLang === 'hi') {
          welcomeText = 'नमस्ते किसान भाई! मैं एआई सहायक हूँ। आप हिंदी, इंग्लिश या ओडिया में बोलकर या लिखकर फसल एमएसपी भाव, 30-मिनट स्लॉट, सरकारी वाहन पिकअप और PFMS भुगतान के बारे में पूछ सकते हैं।';
        } else if (selectedLang === 'or') {
          welcomeText = 'ନମସ୍କାର ଚାଷୀ ଭାଇ! ମୁଁ AI ସହାୟକ। ଆପଣ ଓଡ଼ିଆ, ହିନ୍ଦୀ ବା ଇଂରାଜୀରେ କହି ବା ଲେଖି ଧାନ ଏମଏସପି ଦର, ମଣ୍ଡି ସ୍ଲଟ୍ ବୁକିଂ, ସରକାରୀ ଗାଡ଼ି ପିକଅପ୍ ଓ DBT ପେମେଣ୍ଟ ପଚାରିପାରିବେ।';
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
  const recognitionRef = useRef<any>(null);

  // Initialize Web Speech API with selected language
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;

      let speechLang = 'en-IN';
      if (selectedLang === 'hi') speechLang = 'hi-IN';
      else if (selectedLang === 'or') speechLang = 'or-IN';
      else if (selectedLang === 'en') speechLang = 'en-IN';
      else {
        speechLang = i18n.language === 'or' ? 'or-IN' : i18n.language === 'hi' ? 'hi-IN' : 'en-IN';
      }
      recognition.lang = speechLang;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
        handleSendMessage(transcript, true);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, [i18n.language, selectedLang]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Clean up speech synthesis on close or unmount
  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isOpen]);

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

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome/Edge or type your question.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      try {
        let speechLang = 'en-IN';
        if (selectedLang === 'hi') speechLang = 'hi-IN';
        else if (selectedLang === 'or') speechLang = 'or-IN';
        else if (selectedLang === 'en') speechLang = 'en-IN';
        else {
          speechLang = i18n.language === 'or' ? 'or-IN' : i18n.language === 'hi' ? 'hi-IN' : 'en-IN';
        }
        recognitionRef.current.lang = speechLang;
        recognitionRef.current.start();
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSendMessage = async (textToSend?: string, wasSpoken: boolean = false) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    // Detect language of the input query
    const detectedInputLang = detectQueryLanguage(
      query, 
      selectedLang !== 'auto' ? selectedLang : i18n.language
    );

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lang: detectedInputLang,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      if (isLiveSupabaseConfigured()) {
        const { data } = await supabase.functions.invoke('generate-ai-insights', {
          body: { query, language: detectedInputLang },
        });
        if (data?.reply) {
          addAssistantReply(data.reply, detectedInputLang, wasSpoken);
          return;
        }
      }
    } catch {
      // Fallback
    }

    setTimeout(() => {
      const reply = generateMultilingualAiResponse(query, detectedInputLang);
      addAssistantReply(reply, detectedInputLang, wasSpoken);
    }, 500);
  };

  const addAssistantReply = (text: string, lang: DetectedLanguage, wasSpoken: boolean = false) => {
    const aiMsgId = `ai-${Date.now()}`;
    const aiMsg: Message = {
      id: aiMsgId,
      sender: 'assistant',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      lang,
    };
    setMessages((prev) => [...prev, aiMsg]);
    setIsLoading(false);

    if (autoSpeak || wasSpoken) {
      speakText(text, aiMsgId, lang);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const quickPromptsByLang = {
    hi: [
      'धान का सरकारी MSP रेट क्या है?',
      'मंडी स्लॉट और टोकन कैसे बुक करें?',
      'सरकारी वाहन पिकअप कैसे मिलेगा?',
      'डीबीटी भुगतान और QR रसीद कैसे चेक करें?',
    ],
    or: [
      'ଧାନର ସରକାରୀ ଏମଏସପି ଦର କେତେ?',
      'ମଣ୍ଡି ସ୍ଲଟ୍ କିପରି ବୁକ୍ କରିବି?',
      'ମାଗଣା ସରକାରୀ ଗାଡ଼ି କିପରି ମିଳିବ?',
      'DBT ପେମେଣ୍ଟ ରସିଦ୍ ଓ QR କୋଡ୍ ଯାଞ୍ଚ',
    ],
    en: [
      'Current Paddy & Wheat MSP rates?',
      'How to book a Mandi slot & get QR token?',
      'How to request free vehicle pickup?',
      'How to scan receipt QR code & verify DBT payment?',
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
    <>
      {/* Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-4 py-3 rounded-full shadow-xl shadow-emerald-600/30 hover:shadow-2xl transition-all duration-300 group hover:scale-105 cursor-pointer"
        aria-label="Open AI Assistant"
      >
        <div className="relative">
          <Bot className="w-6 h-6 animate-bounce" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-emerald-600 animate-pulse" />
        </div>
        <span className="font-bold text-sm tracking-wide">
          {isOpen ? (t('common.close', 'Close')) : `🤖 ${t('ai.askAi', 'Ask AI')}`}
        </span>
      </button>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[94vw] sm:w-[420px] h-[590px] max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-fade-in font-sans">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-700 to-green-700 text-white p-3.5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  {t('ai.chatTitle', 'AI Assistant')}
                  <span className="text-[10px] bg-emerald-800/90 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Voice & Multilingual
                  </span>
                </h3>
                <p className="text-[11px] text-emerald-100/90">
                  Input in any language = Output in same language
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Language Mode Strip */}
          <div className="bg-slate-100/90 px-3 py-1.5 border-b border-slate-200/80 flex items-center justify-between gap-1 text-[11px]">
            <span className="font-bold text-slate-500 flex items-center gap-1">
              <Globe className="w-3 h-3 text-emerald-600" /> Language:
            </span>
            <div className="flex gap-1">
              {(['auto', 'hi', 'or', 'en'] as const).map((l) => (
                <button
                  key={l}
                  onClick={() => setSelectedLang(l)}
                  className={`px-2 py-0.5 rounded-md font-bold text-[10px] transition-all cursor-pointer ${
                    selectedLang === l
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-200/80 hover:bg-slate-300/80 text-slate-700'
                  }`}
                >
                  {l === 'auto' ? 'Auto' : l === 'hi' ? 'हिन्दी' : l === 'or' ? 'ଓଡ଼ିଆ' : 'EN'}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm space-y-1.5 ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  {m.sender === 'assistant' && (
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100 text-[10px]">
                      <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded text-[9px] border border-emerald-200">
                        {getLanguageLabel(m.lang)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => speakText(m.text, m.id, m.lang)}
                          className={`px-1.5 py-0.5 rounded font-bold text-[9px] flex items-center gap-1 transition-all cursor-pointer ${
                            speakingMsgId === m.id
                              ? 'bg-rose-600 text-white animate-pulse'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          {speakingMsgId === m.id ? <VolumeX className="w-2.5 h-2.5" /> : <Volume2 className="w-2.5 h-2.5 text-emerald-600" />}
                          <span>{speakingMsgId === m.id ? 'Stop' : 'Suno'}</span>
                        </button>
                        <button
                          onClick={() => handleCopy(m.text, m.id)}
                          className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {copiedId === m.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}

                  <p className="whitespace-pre-line text-slate-900">{m.text}</p>
                  
                  <div className="flex items-center justify-between text-[9px] pt-0.5">
                    {m.sender === 'user' ? (
                      <span className="text-emerald-200 font-medium">
                        {getLanguageLabel(m.lang)}
                      </span>
                    ) : <span />}
                    <span className={m.sender === 'user' ? 'text-emerald-200' : 'text-slate-400'}>
                      {m.time}
                    </span>
                  </div>
                </div>

                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-slate-800 text-white flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-slate-500 bg-white p-2.5 rounded-xl border border-slate-200 w-fit text-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                <span>AI is formulating reply in {selectedLang === 'hi' ? 'Hindi' : selectedLang === 'or' ? 'Odia' : 'matching language'}...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions Carousel */}
          <div className="p-2.5 bg-white border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 mb-1 block uppercase tracking-wider">
              {t('ai.quickQuestions', 'Quick Questions:')}
            </span>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {currentPrompts.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q)}
                  className="whitespace-nowrap text-[11px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200 transition-colors shrink-0 cursor-pointer font-medium"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input Footer */}
          <div className="p-3 bg-white border-t border-slate-200 space-y-1.5">
            <div className="flex items-center gap-2">
              <button
                onClick={toggleVoiceInput}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  isListening
                    ? 'bg-rose-500 text-white animate-pulse ring-2 ring-rose-200'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}
                title={isListening ? 'Listening... Click to stop' : `Voice Input (${selectedLang === 'hi' ? 'Hindi' : selectedLang === 'or' ? 'Odia' : 'Auto'})`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder={
                  isListening
                    ? selectedLang === 'hi'
                      ? '🎤 बोलिए... हिंदी में सुन रहा हूँ'
                      : selectedLang === 'or'
                      ? '🎤 କୁହନ୍ତୁ... ଓଡ଼ିଆରେ ଶୁଣୁଛି'
                      : '🎤 Listening... Speak now'
                    : selectedLang === 'hi'
                    ? 'हिंदी में पूछें (जैसे: धान का भाव क्या है?)...'
                    : selectedLang === 'or'
                    ? 'ଓଡ଼ିଆରେ ପଚାରନ୍ତୁ (ଯଥା: ଧାନ ଦର କେତେ?)...'
                    : 'Ask in Hindi, English, or Odia...'
                }
                className="flex-1 bg-slate-100 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputText.trim() || isLoading}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
              <span>
                {isListening ? '🎙️ Voice Active' : '✨ Matches query language & script'}
              </span>
              <label className="flex items-center gap-1 cursor-pointer text-slate-500 hover:text-slate-700">
                <input
                  type="checkbox"
                  checked={autoSpeak}
                  onChange={(e) => setAutoSpeak(e.target.checked)}
                  className="w-3 h-3 accent-emerald-600 rounded cursor-pointer"
                />
                <span>Auto-speak</span>
              </label>
            </div>
          </div>

        </div>
      )}
    </>
  );
};

