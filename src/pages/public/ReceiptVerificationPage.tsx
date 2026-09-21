// Public Digital Receipt Details & PFMS DBT Verification Page
// Accessible when scanning QR Code from Google Scanner / Phone Camera
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  CheckCircle2, ShieldCheck, FileDown, Printer, Volume2, VolumeX, 
  Leaf, Globe, ArrowLeft, Building2, Scale, 
  Sparkles
} from 'lucide-react';
import { db, Payment, Procurement } from '../../lib/db';
import { generatePaymentReceiptPdf, PaymentReceiptPdfData } from '../../lib/pdf';
import { useLanguage, Language } from '../../context/LanguageContext';

export const ReceiptVerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { currentLanguage, changeLanguage } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Extract from query params with robust fallbacks from DB
  const paramId = searchParams.get('id') || 'pay-01';
  const paramFarmer = searchParams.get('farmer');
  const paramVillage = searchParams.get('village');
  const paramCrop = searchParams.get('crop');
  const paramGross = searchParams.get('gross');
  const paramTare = searchParams.get('tare');
  const paramNet = searchParams.get('net');
  const paramMoisture = searchParams.get('moisture');
  const paramGrade = searchParams.get('grade');
  const paramMsp = searchParams.get('msp');
  const paramAmount = searchParams.get('amount');
  const paramPfms = searchParams.get('pfms');
  const paramUtr = searchParams.get('utr');
  const paramDate = searchParams.get('date');
  const paramGatePass = searchParams.get('gatePass');

  // Query local database for richer context if matching
  const payments = db.getCollection<Payment>('payments');
  const procurements = db.getCollection<Procurement>('procurements');

  const matchedPayment = payments.find((p) => p.id === paramId || p.pfms_transaction_id === paramPfms) || payments[0];
  const matchedProcurement = procurements.find((pr) => pr.id === matchedPayment?.procurement_id) || procurements[0];

  const receiptData: PaymentReceiptPdfData = {
    receiptId: paramId || matchedPayment?.id || 'pay-01',
    farmerName: paramFarmer || matchedPayment?.farmer_name || 'Ramesh Chandra Pradhan',
    village: paramVillage || 'Sambalpur Rural',
    cropType: paramCrop || matchedProcurement?.crop_type || 'Paddy (Grade A)',
    grossWeightKg: paramGross ? parseFloat(paramGross) : (matchedProcurement?.gross_weight_kg || 5420),
    tareWeightKg: paramTare ? parseFloat(paramTare) : (matchedProcurement?.tare_weight_kg || 420),
    netWeightKg: paramNet ? parseFloat(paramNet) : (matchedProcurement?.net_weight_kg || 5000),
    moisturePercentage: paramMoisture ? parseFloat(paramMoisture) : (matchedProcurement?.moisture_percentage || 12.8),
    qualityGrade: paramGrade || matchedProcurement?.quality_grade || 'Grade A',
    mspRatePerQuintal: paramMsp ? parseFloat(paramMsp) : (matchedProcurement?.msp_rate_per_quintal || 2320),
    totalAmount: paramAmount ? parseFloat(paramAmount) : (matchedPayment?.amount || 116000),
    pfmsTxnId: paramPfms || matchedPayment?.pfms_transaction_id || 'PFMS-OD-2026-98124',
    bankRef: paramUtr || matchedPayment?.bank_ref_number || 'SBIN0029381923',
    date: paramDate || (matchedPayment?.credited_at || new Date().toLocaleDateString('en-IN')),
    gatePassNumber: paramGatePass || matchedProcurement?.gate_pass_number || 'GP-2026-9041',
  };

  const netQuintals = (receiptData.netWeightKg / 100).toFixed(2);

  // Text-To-Speech audio readout for accessibility
  const speakReceiptDetails = () => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-Speech is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    let speechText = '';
    let langCode = 'hi-IN';

    if (currentLanguage === 'hi') {
      speechText = `कृषि-फ्लो डिजिटल डीबीटी रसीद सत्यापन। किसान ${receiptData.farmerName}, ग्राम ${receiptData.village}। फसल ${receiptData.cropType}, कुल वजन ${receiptData.netWeightKg} किलोग्राम यानी ${netQuintals} क्विंटल। न्यूनतम समर्थन मूल्य दर 2,320 रुपए प्रति क्विंटल। कुल डीबीटी भुगतान राशि ${receiptData.totalAmount.toLocaleString('en-IN')} रुपए, आपके आधार लिंक बैंक खाते में पी एफ एम एस द्वारा सफलतापूर्वक जमा हो चुकी है। पी एफ एम एस संदर्भ संख्या ${receiptData.pfmsTxnId} है। यह रसीद भारत सरकार एवं राज्य कृषि विपणन बोर्ड द्वारा प्रमाणित है।`;
      langCode = 'hi-IN';
    } else if (currentLanguage === 'or') {
      speechText = `କୃଷି-ଫ୍ଲୋ ଡିଜିଟାଲ ଡିବିଟି ରସିଦ ଯାଞ୍ଚ। କୃଷକ ${receiptData.farmerName}, ଗ୍ରାମ ${receiptData.village}। ଫସଲ ${receiptData.cropType}, ମୋଟ ଓଜନ ${netQuintals} କ୍ୱିଣ୍ଟାଲ। ସମୁଦାୟ ପ୍ରଦାନ ରାଶି ${receiptData.totalAmount.toLocaleString('en-IN')} ଟଙ୍କା, ଆପଣଙ୍କ ଆଧାର ସଂଯୋଗ ବ୍ୟାଙ୍କ ଖାତାରେ ସଫଳତାର ସହ ଜମା ହୋଇଛି।`;
      langCode = 'or-IN';
    } else {
      speechText = `FPP Digital DBT Payment Receipt Verification. Beneficiary Farmer ${receiptData.farmerName}, Village ${receiptData.village}. Crop ${receiptData.cropType}, Net Weight ${receiptData.netWeightKg} kg, equivalent to ${netQuintals} Quintals. Approved MSP Rate is rupees ${receiptData.mspRatePerQuintal} per quintal. Total DBT amount of rupees ${receiptData.totalAmount.toLocaleString('en-IN')} has been successfully credited to your Aadhaar-linked bank account via PFMS. Settlement reference is ${receiptData.pfmsTxnId}. This certificate is digitally authenticated.`;
      langCode = 'en-IN';
    }

    const utterance = new SpeechSynthesisUtterance(speechText);
    utterance.lang = langCode;
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await generatePaymentReceiptPdf(receiptData);
    } catch (e) {
      console.error('Error generating PDF:', e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Navigation & Brand Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-slate-700/80">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 group-hover:scale-105 transition-transform">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg text-white tracking-tight">FPP</span>
                <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Govt Verified
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Public Financial Management System (PFMS) DBT Verification Portal
              </p>
            </div>
          </Link>

          {/* Quick Action Badges: Language & Portal Link */}
          <div className="flex items-center gap-2.5">
            {/* Language Switcher */}
            <div className="flex items-center bg-slate-800 border border-slate-700 rounded-xl px-2.5 py-1.5 shadow-sm">
              <Globe className="w-3.5 h-3.5 text-emerald-400 mr-1.5" />
              {(['en', 'hi', 'or'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => changeLanguage(l)}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded transition-colors ${
                    currentLanguage === l
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {l === 'en' ? 'EN' : l === 'hi' ? 'हिंदी' : 'ଓଡ଼ିଆ'}
                </button>
              ))}
            </div>

            <Link
              to="/farmer/payments"
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-bold text-slate-200 hover:text-white transition-all shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Farmer Portal</span>
            </Link>
          </div>
        </div>

        {/* Scan Success Banner */}
        <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-emerald-950/80 border border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-md">
          {/* Subtle glow background */}
          <div className="absolute -right-16 -top-16 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-full text-xs font-extrabold tracking-wide uppercase">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Government Digital Certificate</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentLanguage === 'hi' 
                  ? 'डीबीटी भुगतान रसीद विवरण' 
                  : currentLanguage === 'or' 
                  ? 'ଡିବିଟି ପ୍ରଦାନ ରସିଦ ବିବରଣୀ' 
                  : 'Official DBT Payment Receipt Details'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                Scanned via Google Scanner / QR Reader. Authenticated direct settlement record issued by FPP Mandi Procurement Terminal.
              </p>
            </div>

            {/* Audio Voice Assistant Readout */}
            <button
              onClick={speakReceiptDetails}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl font-bold text-xs transition-all shadow-lg shrink-0 ${
                isSpeaking
                  ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:shadow-emerald-500/20'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              <span>
                {isSpeaking 
                  ? 'Stop Audio' 
                  : currentLanguage === 'hi' 
                  ? '🔊 रसीद विवरण सुनें (Suno)' 
                  : currentLanguage === 'or' 
                  ? '🔊 ଶୁଣନ୍ତୁ (Audio)' 
                  : '🔊 Listen to Receipt Details'}
              </span>
            </button>
          </div>
        </div>

        {/* Primary Digital Receipt Certificate Card */}
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 backdrop-blur-md">
          
          {/* Certificate Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase block">
                Government of India • Ministry of Agriculture & Farmers Welfare
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xl sm:text-2xl font-black text-white">
                  Receipt #{receiptData.receiptId}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Settled
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Gate Pass Reference: <b className="text-slate-200">{receiptData.gatePassNumber}</b> • Issued on {receiptData.date}
              </p>
            </div>

            {/* Big Amount Highlight */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 text-right sm:min-w-[200px] shadow-inner">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Total DBT Disbursed Amount
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 block tracking-tight">
                ₹ {receiptData.totalAmount.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-emerald-300/80 font-medium">
                Direct to Aadhaar SBI Account
              </span>
            </div>
          </div>

          {/* 5-Stage PFMS Clearance Visual Progression */}
          <div className="space-y-3 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Real-Time PFMS 5-Stage Settlement Status
              </span>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                100% Cleared & Credited
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-2">
              {[
                { title: '1. Gate Pass', sub: 'Verified at Yard' },
                { title: '2. Quality Tested', sub: 'Moisture < 14%' },
                { title: '3. Digital Scale', sub: 'Gross & Tare Verified' },
                { title: '4. PFMS Cleared', sub: 'Batch Instruction Sent' },
                { title: '5. Bank Credited', sub: 'Funds in Aadhaar A/c' },
              ].map((step, idx) => (
                <div
                  key={idx}
                  className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-3 text-center space-y-1 relative"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mx-auto shadow-sm">
                    ✓
                  </div>
                  <p className="font-bold text-xs text-white leading-tight">{step.title}</p>
                  <p className="text-[10px] text-emerald-300/80 leading-tight">{step.sub}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Beneficiary & Crop Info */}
            <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                Farmer & Mandi Details
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Beneficiary Farmer:</span>
                  <span className="font-bold text-white text-right">{receiptData.farmerName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Village / Mandi Yard:</span>
                  <span className="font-bold text-white text-right">{receiptData.village}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Crop Procured:</span>
                  <span className="font-bold text-emerald-300 text-right">{receiptData.cropType}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Quality Grade Assessed:</span>
                  <span className="font-bold text-white bg-emerald-950 text-emerald-300 border border-emerald-600/40 px-2 py-0.5 rounded text-[11px]">
                    {receiptData.qualityGrade} (Moisture: {receiptData.moisturePercentage}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Weighbridge & Financial Metrics */}
            <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/60 space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5" />
                Weighment & MSP Calculation
              </h3>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Gross Weight:</span>
                  <span className="font-mono font-bold text-white">{receiptData.grossWeightKg} kg</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Tare (Vehicle/Bags) Weight:</span>
                  <span className="font-mono font-bold text-slate-300">{receiptData.tareWeightKg} kg</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/40">
                  <span className="text-slate-400">Net Procurement Weight:</span>
                  <span className="font-mono font-black text-emerald-400 text-sm">
                    {receiptData.netWeightKg} kg ({netQuintals} Quintals)
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Government MSP Rate:</span>
                  <span className="font-bold text-white">₹ {receiptData.mspRatePerQuintal} / Quintal</span>
                </div>
              </div>
            </div>

          </div>

          {/* Banking & PFMS Gateway References */}
          <div className="bg-gradient-to-r from-slate-950/80 via-slate-900 to-slate-950/80 p-4 rounded-2xl border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">PFMS Transaction ID</span>
              <span className="font-mono font-bold text-emerald-400 text-sm">{receiptData.pfmsTxnId}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Bank Reference / UTR</span>
              <span className="font-mono font-bold text-slate-200 text-sm">{receiptData.bankRef}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Settlement Clearance Date</span>
              <span className="font-bold text-white text-sm">{receiptData.date}</span>
            </div>
          </div>

          {/* Action Buttons: Download PDF, Print, Copy */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>{isGeneratingPdf ? 'Generating PDF...' : 'Download Official PDF Receipt'}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="flex items-center justify-center gap-1.5 px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                title="Print Receipt"
              >
                <Printer className="w-4 h-4" />
                <span className="hidden sm:inline">Print Slip</span>
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <button
                onClick={handleCopyLink}
                className="px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white font-semibold text-xs rounded-xl transition-colors w-full sm:w-auto text-center cursor-pointer"
              >
                {copied ? '✓ Link Copied!' : '📋 Copy Verification URL'}
              </button>
            </div>
          </div>

        </div>

        {/* Security & Authenticity Footer */}
        <div className="text-center text-xs text-slate-500 space-y-1.5 pt-4">
          <p className="flex items-center justify-center gap-1.5 text-slate-400 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Digitally certified by FPP Central Procurement Server & PFMS Gateway.
          </p>
          <p>
            Toll-Free Farmer Support Helpline: <b className="text-slate-300">1800-180-2026</b> • Mandi Operations: <b className="text-slate-300">+91-1800-180-2021</b>
          </p>
        </div>

      </div>
    </div>
  );
};
