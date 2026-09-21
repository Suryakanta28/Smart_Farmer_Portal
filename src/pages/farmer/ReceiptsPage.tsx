// Receipts & Official Procurement Gate Pass Slips for Farmer
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, FileDown, CheckCircle2, ShieldCheck, QrCode, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { db, Procurement, Payment, Farmer } from '../../lib/db';
import { useAuth } from '../../context/AuthContext';
import { generatePaymentReceiptPdf, buildReceiptVerificationUrl } from '../../lib/pdf';
import { formatLiveDateTime, formatTimeAgo } from '../../lib/dateUtils';

export const ReceiptsPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [farmer, setFarmer] = useState<Farmer>(() => db.getFarmerByUserId(user?.id));
  const [procurements, setProcurements] = useState<Procurement[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const refresh = () => {
      const currentFarmer = db.getFarmerByUserId(user?.id);
      setFarmer(currentFarmer);
      const allProcs = db.getCollection<Procurement>('procurements');
      const allPayments = db.getCollection<Payment>('payments');
      const myProcs = allProcs.filter(
        (p) => p.farmer_id === currentFarmer.id || p.farmer_id === user?.id || (currentFarmer.name && p.farmer_name?.toLowerCase() === currentFarmer.name.toLowerCase())
      );
      setProcurements(myProcs);
      setPayments(allPayments);
    };
    refresh();
    const unsubFarmers = db.subscribe('table:farmers', refresh);
    const unsubProcs = db.subscribe('table:procurements', refresh);
    return () => {
      unsubFarmers();
      unsubProcs();
    };
  }, [user?.id]);

  const handleDownload = (proc: Procurement) => {
    const pay = payments.find((p) => p.procurement_id === proc.id) || payments[0];
    generatePaymentReceiptPdf({
      receiptId: proc.id,
      farmerName: farmer.name || proc.farmer_name,
      village: farmer.village || 'Sambalpur Rural',
      cropType: proc.crop_type,
      grossWeightKg: proc.gross_weight_kg,
      tareWeightKg: proc.tare_weight_kg,
      netWeightKg: proc.net_weight_kg,
      moisturePercentage: proc.moisture_percentage,
      qualityGrade: proc.quality_grade,
      mspRatePerQuintal: proc.msp_rate_per_quintal,
      totalAmount: proc.total_amount,
      pfmsTxnId: pay?.pfms_transaction_id || 'PFMS-OD-2026-98124',
      bankRef: pay?.bank_ref_number || 'SBIN0029381923',
      date: new Date(proc.created_at).toLocaleDateString('en-IN'),
      gatePassNumber: proc.gate_pass_number,
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          {t('receipts.title', 'Official Receipts & Gate Slips')}
        </h2>
        <p className="text-xs text-slate-500">
          {t('receipts.subtitle', 'Digitally signed certificates of weighment, moisture grading, and DBT clearance')}
        </p>
      </div>

      {procurements.length > 0 ? (
        <div className="space-y-4">
          {procurements.map((p) => {
            const pay = payments.find((pym) => pym.procurement_id === p.id) || payments[0];
            const verificationUrl = buildReceiptVerificationUrl({
              receiptId: p.id,
              farmerName: farmer.name || p.farmer_name,
              village: farmer.village || 'Sambalpur Rural',
              cropType: p.crop_type,
              grossWeightKg: p.gross_weight_kg,
              tareWeightKg: p.tare_weight_kg,
              netWeightKg: p.net_weight_kg,
              moisturePercentage: p.moisture_percentage,
              qualityGrade: p.quality_grade,
              mspRatePerQuintal: p.msp_rate_per_quintal,
              totalAmount: p.total_amount,
              pfmsTxnId: pay?.pfms_transaction_id || 'PFMS-OD-2026-98124',
              bankRef: pay?.bank_ref_number || 'SBIN0029381923',
              date: new Date(p.created_at).toLocaleDateString('en-IN'),
              gatePassNumber: p.gate_pass_number,
            });

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                      {p.gate_pass_number}
                    </span>
                    <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                      🕒 {formatLiveDateTime(p.created_at)} ({formatTimeAgo(p.created_at)})
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Scannable QR Embedded
                    </span>
                  </div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {p.crop_type} • {p.net_weight_kg} kg ({(p.net_weight_kg / 100).toFixed(2)} {t('crops.quintals', 'Quintals')})
                  </h3>
                  <p className="text-xs text-slate-500">
                    {t('receipts.grade', 'Grade')}: <b className="text-emerald-700">{p.quality_grade}</b> • {t('receipts.moisture', 'Moisture')}: <b>{p.moisture_percentage}%</b> • {t('receipts.msp', 'MSP')}: ₹ {p.msp_rate_per_quintal}/Q
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">{t('receipts.settledAmount', 'Settled Amount')}</span>
                    <span className="text-lg font-black text-emerald-600">
                      ₹ {p.total_amount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={verificationUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all"
                      title="View Digital Slip"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                      <span className="hidden sm:inline">Verify Slip</span>
                    </a>

                    <button
                      onClick={() => handleDownload(p)}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>{t('receipts.pdfReceipt', 'Re-download PDF')}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-base text-slate-900">No Procurement Slips Found</h4>
            <p className="text-xs text-slate-500 mt-1">
              Official digital weighment slips and gate passes are automatically generated when your grain arrival is processed at the Mandi.
            </p>
          </div>
          <Link
            to="/farmer/procurement"
            className="inline-flex px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md"
          >
            🌾 Book Mandi Arrival Slot
          </Link>
        </div>
      )}
    </div>
  );
};
