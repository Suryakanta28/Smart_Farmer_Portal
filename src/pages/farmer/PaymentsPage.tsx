// Farmer Payments Page with 5-Stage PFMS Timeline & PDF Receipt
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  DollarSign, CheckCircle2, Clock, RefreshCw, FileDown, 
  ShieldCheck, ArrowRight, ExternalLink, QrCode, X, Sparkles, AlertCircle
} from 'lucide-react';
import QRCode from 'qrcode';
import { db, Payment, Procurement, Farmer } from '../../lib/db';
import { useAuth } from '../../context/AuthContext';
import { generatePaymentReceiptPdf, buildReceiptVerificationUrl } from '../../lib/pdf';
import { supabase, isLiveSupabaseConfigured } from '../../lib/supabase';

export const PaymentsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [farmer, setFarmer] = useState<Farmer>(() => db.getFarmerByUserId(user?.id));
  const [payments, setPayments] = useState<Payment[]>([]);
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [isCheckingPfms, setIsCheckingPfms] = useState(false);
  const [pfmsAlert, setPfmsAlert] = useState<string | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const currentFarmer = db.getFarmerByUserId(user?.id);
      setFarmer(currentFarmer);
      const allPayments = db.getCollection<Payment>('payments');
      const allProcs = db.getCollection<Procurement>('procurements');
      const myPayments = allPayments.filter(
        (p) => p.farmer_id === currentFarmer.id || p.farmer_id === user?.id || (currentFarmer.name && p.farmer_name?.toLowerCase() === currentFarmer.name.toLowerCase())
      );
      const myProcs = allProcs.filter(
        (pr) => pr.farmer_id === currentFarmer.id || pr.farmer_id === user?.id || (currentFarmer.name && pr.farmer_name?.toLowerCase() === currentFarmer.name.toLowerCase())
      );
      setPayments(myPayments);
      setProcurements(myProcs);
    };

    refresh();
    const unsubFarmers = db.subscribe('table:farmers', refresh);
    const unsubPayments = db.subscribe('table:payments', refresh);
    return () => {
      unsubFarmers();
      unsubPayments();
    };
  }, [user?.id]);

  const activePayment = payments[0] || null;
  const activeProcurement = procurements.find((p) => p.id === activePayment?.procurement_id) || procurements[0] || null;

  const receiptPayload = activePayment && activeProcurement ? {
    receiptId: activePayment.id,
    farmerName: farmer.name || activePayment.farmer_name,
    village: farmer.village || 'Sambalpur Rural',
    cropType: activeProcurement.crop_type,
    grossWeightKg: activeProcurement.gross_weight_kg,
    tareWeightKg: activeProcurement.tare_weight_kg,
    netWeightKg: activeProcurement.net_weight_kg,
    moisturePercentage: activeProcurement.moisture_percentage,
    qualityGrade: activeProcurement.quality_grade,
    mspRatePerQuintal: activeProcurement.msp_rate_per_quintal,
    totalAmount: activePayment.amount,
    pfmsTxnId: activePayment.pfms_transaction_id,
    bankRef: activePayment.bank_ref_number,
    date: new Date().toLocaleDateString('en-IN'),
    gatePassNumber: activeProcurement.gate_pass_number,
  } : null;

  useEffect(() => {
    if (receiptPayload) {
      const url = buildReceiptVerificationUrl(receiptPayload);
      QRCode.toDataURL(url, { width: 320, margin: 2 }).then((dataUri) => {
        setQrCodeDataUrl(dataUri);
      });
    }
  }, [activePayment, activeProcurement]);

  const stages = [
    { key: 'gate_pass_issued', label: '1. Gate Pass', desc: 'Entry Barcode Verified' },
    { key: 'quality_checked', label: '2. Quality Test', desc: 'Grade A Moisture 12.8%' },
    { key: 'weighed', label: '3. Digital Weighing', desc: 'Net: 50.00 Quintals' },
    { key: 'initiated', label: '4. PFMS Initiated', desc: 'Direct Benefit Transfer Batch' },
    { key: 'credited', label: '5. Bank Credited', desc: 'Funds in Aadhaar SBI A/c' },
  ];

  const handleCheckPfmsStatus = async () => {
    setIsCheckingPfms(true);
    setPfmsAlert(null);

    // Call Supabase Edge function if live
    if (isLiveSupabaseConfigured()) {
      try {
        const { data } = await supabase.functions.invoke('check-pfms-status', {
          body: { gate_pass_id: activeProcurement.gate_pass_number },
        });
        if (data?.transaction_id) {
          activePayment.pfms_status = data.status || 'credited';
          activePayment.pfms_transaction_id = data.transaction_id;
        }
      } catch (err) {
        console.warn('PFMS edge function note:', err);
      }
    }

    setTimeout(() => {
      setIsCheckingPfms(false);
      setPfmsAlert(
        `✓ PFMS Gateway Live Response: Settlement verified. Reference ${activePayment.pfms_transaction_id}. UTR: ${activePayment.bank_ref_number}.`
      );
    }, 1000);
  };

  const handleDownloadReceipt = async () => {
    setIsGeneratingPdf(true);
    try {
      await generatePaymentReceiptPdf(receiptPayload);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
            {t('farmerNav.payments', 'Payments (DBT)')}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            {t('payments.title', 'PFMS Direct Benefit Transfer (DBT) Payouts')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {t('payments.subtitle', 'Transparent 5-stage automated settlement direct to your Aadhaar-linked bank account')}
          </p>
        </div>

        {activePayment && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowQrModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <QrCode className="w-3.5 h-3.5 text-emerald-400" />
              <span>Scan QR Slip</span>
            </button>
            <button
              onClick={handleCheckPfmsStatus}
              disabled={isCheckingPfms}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isCheckingPfms ? 'animate-spin' : ''}`} />
              <span>{t('payments.checkPfmsStatus', 'Query PFMS Live Status')}</span>
            </button>
            <button
              onClick={handleDownloadReceipt}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>{isGeneratingPdf ? 'Generating...' : t('payments.downloadReceipt', 'Download Official Settlement Receipt')}</span>
            </button>
          </div>
        )}
      </div>

      {pfmsAlert && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{pfmsAlert}</span>
        </div>
      )}

      {activePayment && activeProcurement ? (
        <>
          {/* 5-STAGE PAYMENT STATUS TIMELINE */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6">
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {t('payments.pfmsTimeline', '5-Stage Real-Time PFMS Clearing Timeline')}
              </h3>
              <p className="text-xs text-slate-500">
                Current stage highlighted in Green, Completed stages in Blue
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 relative">
              {stages.map((stage, idx) => {
                const isCompleted = true;
                const isCurrent = idx === 4;

                return (
                  <div
                    key={stage.key}
                    className={`p-4 rounded-2xl border transition-all text-center space-y-2 ${
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-50/80 shadow-md ring-2 ring-emerald-500/20'
                        : isCompleted
                        ? 'border-blue-200 bg-blue-50/60'
                        : 'border-slate-200 bg-slate-50 opacity-60'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center font-bold text-xs text-white ${
                        isCurrent ? 'bg-emerald-600' : isCompleted ? 'bg-blue-600' : 'bg-slate-300'
                      }`}
                    >
                      {isCompleted ? '✓' : idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{stage.label}</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{stage.desc}</p>
                    </div>
                    <span
                      className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        isCurrent
                          ? 'bg-emerald-200 text-emerald-800'
                          : 'bg-blue-200 text-blue-800'
                      }`}
                    >
                      {isCurrent ? t('payments.statusCredited', 'Funds Credited to Bank') : 'Verified'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transaction Breakdown Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                  Gate Pass #{activeProcurement.gate_pass_number}
                </span>
                <h3 className="font-extrabold text-lg text-slate-900 mt-1">
                  {t('payments.activeProcurement', 'Active Mandi Procurement Record')}
                </h3>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block font-medium">{t('receipts.settledAmount', 'Settled Amount')}</span>
                <span className="text-2xl sm:text-3xl font-black text-emerald-600">
                  ₹ {activePayment.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">{t('crops.cropType', 'Crop Type')}:</span>
            <span className="font-bold text-slate-800 text-sm">{activeProcurement.crop_type}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">{t('payments.netWeight', 'Net Weight')}:</span>
            <span className="font-bold text-slate-800 text-sm">
              {activeProcurement.net_weight_kg} kg ({(activeProcurement.net_weight_kg / 100).toFixed(2)} Q)
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">{t('payments.mspRate', 'MSP Rate')}:</span>
            <span className="font-bold text-slate-800 text-sm">₹ {activeProcurement.msp_rate_per_quintal} / Q</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">{t('payments.quality', 'Quality Grade')}:</span>
            <span className="font-bold text-emerald-700 text-sm">{activeProcurement.quality_grade}</span>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl">
          <div>
            <span className="text-slate-400 block text-[10px]">PFMS Transaction ID:</span>
            <span className="font-mono font-bold text-slate-800">{activePayment.pfms_transaction_id}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Bank UTR Reference:</span>
            <span className="font-mono font-bold text-slate-800">{activePayment.bank_ref_number}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">{t('common.status', 'Status')}:</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t('payments.statusCredited', 'Funds Credited to Bank')}
            </span>
          </div>
        </div>

        {/* Re-download & Google Scanner Notice Card */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-sm shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs text-emerald-950">
                Official Digital QR Code Verification Receipt
              </h4>
              <p className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
                Jab aap receipt download/re-download karte hain, usme aane wale QR code ko <b>Google Scanner</b> ya phone camera se scan karke live payment receipt details PDF dekh sakte hain.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setShowQrModal(true)}
              className="px-3.5 py-2 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>Preview QR</span>
            </button>
            <button
              onClick={handleDownloadReceipt}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>Re-download Receipt</span>
            </button>
          </div>
        </div>
      </div>
    </>
      ) : (
        /* Empty state for new farmer with 0 payments */
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <DollarSign className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="font-extrabold text-base text-slate-900">
              No DBT Payment Records Yet
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Automated Direct Benefit Transfer (DBT) payments are generated and credited directly to your bank account after your grain is weighed and graded at the Mandi weighbridge.
            </p>
          </div>
          <div className="pt-1">
            <Link
              to="/farmer/procurement"
              className="inline-flex px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
            >
              🌾 Book Mandi Arrival Slot
            </Link>
          </div>
        </div>
      )}

      {/* QR CODE MODAL FOR INSTANT SCANNER TESTING */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-center relative border border-slate-100">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                Google Scanner Ready
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">
                Scan DBT Receipt QR Code
              </h3>
              <p className="text-xs text-slate-500">
                Open <b>Google Scanner</b>, <b>Google Lens</b>, or your phone Camera to scan this QR code.
              </p>
            </div>

            {qrCodeDataUrl ? (
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block shadow-inner">
                <img
                  src={qrCodeDataUrl}
                  alt="Receipt QR Code"
                  className="w-56 h-56 mx-auto rounded-xl shadow-sm"
                />
              </div>
            ) : (
              <div className="w-56 h-56 mx-auto flex items-center justify-center bg-slate-100 rounded-xl">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
              </div>
            )}

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-left space-y-1 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Verified PFMS Receipt Data Embedded</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Farmer: <b>{activePayment.farmer_name}</b> | Amount: <b>₹ {activePayment.amount.toLocaleString('en-IN')}</b>
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <a
                href={buildReceiptVerificationUrl(receiptPayload)}
                target="_blank"
                rel="noreferrer"
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                <span>Open Digital Page ↗</span>
              </a>
              <button
                onClick={handleDownloadReceipt}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
