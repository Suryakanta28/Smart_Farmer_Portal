// Weighbridge Weight & Automatic Quality Grading Calculator
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React, { useState } from 'react';
import { Scale, CheckCircle2, Calculator, ShieldCheck, Printer } from 'lucide-react';
import { db, Procurement } from '../../lib/db';
import { generatePaymentReceiptPdf } from '../../lib/pdf';

export const WeightQualityPage: React.FC = () => {
  const [tokenInput, setTokenInput] = useState('KFA-1024');
  const [farmerName, setFarmerName] = useState(() => db.getFarmerByUserId().name || 'Ramesh Chandra Pradhan');
  const [cropType, setCropType] = useState('Paddy (Common)');
  const [grossWeight, setGrossWeight] = useState<number>(5420);
  const [tareWeight, setTareWeight] = useState<number>(420);
  const [moisture, setMoisture] = useState<number>(12.8);
  const [foreignMatter, setForeignMatter] = useState<number>(0.5);

  const [savedProcurement, setSavedProcurement] = useState<Procurement | null>(null);

  React.useEffect(() => {
    const unsub = db.subscribe('table:farmers', () => {
      const f = db.getFarmerByUserId();
      if (f?.name) setFarmerName(f.name);
    });
    return () => unsub();
  }, []);

  // Auto-grade calculation logic
  const netWeight = Math.max(0, grossWeight - tareWeight);
  const netQuintals = netWeight / 100;

  const calculateGrade = () => {
    if (moisture > 17.0 || foreignMatter > 2.0) return 'Rejected';
    if (moisture <= 13.0 && foreignMatter <= 0.8) return 'Grade A';
    if (moisture <= 15.0 && foreignMatter <= 1.2) return 'Grade B';
    return 'Grade C';
  };

  const grade = calculateGrade();

  const getMspRate = () => {
    if (cropType.includes('Wheat')) return 2425;
    if (grade === 'Grade A') return 2320;
    return 2300;
  };

  const mspRate = getMspRate();
  const totalPayout = grade === 'Rejected' ? 0 : Math.round(netQuintals * mspRate);

  const handleIssueGatePass = (e: React.FormEvent) => {
    e.preventDefault();
    const newProc: Procurement = {
      id: `proc-${Date.now()}`,
      booking_id: 'book-01',
      centre_id: 'cen-03',
      farmer_id: 'far-01',
      farmer_name: farmerName,
      crop_type: `${cropType} (${grade})`,
      gross_weight_kg: grossWeight,
      tare_weight_kg: tareWeight,
      net_weight_kg: netWeight,
      moisture_percentage: moisture,
      foreign_matter_percentage: foreignMatter,
      quality_grade: grade as any,
      msp_rate_per_quintal: mspRate,
      total_amount: totalPayout,
      gate_pass_number: `GP-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      created_at: new Date().toISOString(),
    };

    const procs = db.getCollection<Procurement>('procurements');
    procs.unshift(newProc);
    db.setCollection('procurements', procs);

    // Also create initiated payment
    const payments = db.getCollection('payments');
    payments.unshift({
      id: `pay-${Date.now()}`,
      procurement_id: newProc.id,
      farmer_id: newProc.farmer_id,
      farmer_name: newProc.farmer_name,
      amount: newProc.total_amount,
      pfms_status: 'initiated',
      pfms_transaction_id: `PFMS-OD-${Date.now()}`,
      bank_ref_number: `SBIN00${Math.floor(100000 + Math.random() * 900000)}`,
      created_at: new Date().toISOString(),
    });
    db.setCollection('payments', payments);

    setSavedProcurement(newProc);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          ⚖️ Digital Weighbridge & Automated Grading
        </h2>
        <p className="text-xs text-slate-500">
          Capture computerized optical moisture analysis and issue authentic Gate Passes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form */}
        <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-md">
          <form onSubmit={handleIssueGatePass} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Mandi Token # *</label>
                <input
                  type="text"
                  required
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold font-mono outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Farmer Name *</label>
                <input
                  type="text"
                  required
                  value={farmerName}
                  onChange={(e) => setFarmerName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Crop Variety *</label>
              <select
                value={cropType}
                onChange={(e) => setCropType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-semibold outline-none"
              >
                <option value="Paddy (Common)">Paddy (Common)</option>
                <option value="Wheat (Sharbati)">Wheat (Sharbati)</option>
                <option value="Maize">Maize</option>
              </select>
            </div>

            {/* Weighbridge Inputs */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <span className="font-bold text-slate-800 block text-xs">
                Computerized Weighbridge Scale Readings (kg)
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Gross Weight (Loaded)</label>
                  <input
                    type="number"
                    required
                    value={grossWeight}
                    onChange={(e) => setGrossWeight(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Tare Weight (Empty)</label>
                  <input
                    type="number"
                    required
                    value={tareWeight}
                    onChange={(e) => setTareWeight(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Moisture & Quality Lab Readings */}
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
              <span className="font-bold text-emerald-950 block text-xs">
                Refractometer Moisture & Purity Analysis
              </span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Moisture % (Std: &lt;14%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={moisture}
                    onChange={(e) => setMoisture(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Foreign Matter % (&lt;1%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={foreignMatter}
                    onChange={(e) => setForeignMatter(Number(e.target.value))}
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-lg font-bold"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
            >
              Issue Certified Gate Pass & Initiate PFMS DBT
            </button>
          </form>
        </div>

        {/* Live Calculation & Receipt Preview */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-400">
              Live Automated Assessment
            </span>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Net Weight:</span>
                <span className="font-bold text-white text-sm font-mono">
                  {netWeight} kg ({netQuintals.toFixed(2)} Quintals)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Auto-Computed Grade:</span>
                <span className="font-bold text-emerald-400 text-sm">{grade}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Approved MSP:</span>
                <span className="font-bold text-white">₹ {mspRate} / Quintal</span>
              </div>
            </div>

            <div className="text-center py-2">
              <span className="text-xs text-slate-400 block font-medium">Calculated DBT Payout</span>
              <span className="text-4xl font-black text-emerald-400">
                ₹ {totalPayout.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          {savedProcurement && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-xl space-y-2 text-xs">
              <span className="font-bold text-emerald-300 block">
                ✓ Gate Pass Issued: #{savedProcurement.gate_pass_number}
              </span>
              <button
                onClick={() =>
                  generatePaymentReceiptPdf({
                    receiptId: savedProcurement.id,
                    farmerName: savedProcurement.farmer_name,
                    village: 'Sambalpur Rural',
                    cropType: savedProcurement.crop_type,
                    grossWeightKg: savedProcurement.gross_weight_kg,
                    tareWeightKg: savedProcurement.tare_weight_kg,
                    netWeightKg: savedProcurement.net_weight_kg,
                    moisturePercentage: savedProcurement.moisture_percentage,
                    qualityGrade: savedProcurement.quality_grade,
                    mspRatePerQuintal: savedProcurement.msp_rate_per_quintal,
                    totalAmount: savedProcurement.total_amount,
                    pfmsTxnId: 'PFMS-OD-2026-LIVE',
                    bankRef: 'SBIN0029381923',
                    date: new Date().toLocaleDateString('en-IN'),
                    gatePassNumber: savedProcurement.gate_pass_number,
                  })
                }
                className="w-full py-2 bg-emerald-500 text-slate-950 font-bold rounded-lg flex items-center justify-center gap-1.5 text-[11px]"
              >
                <Printer className="w-3.5 h-3.5" />
                Download Printed Receipt
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
