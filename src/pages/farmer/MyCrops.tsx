// My Crops Management Page (Full CRUD Operations)
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus, Sprout, Edit2, Trash2, Calendar, Scale, CheckCircle2, X, AlertCircle, AlertTriangle, ShieldCheck } from 'lucide-react';
import { db, Crop } from '../../lib/db';
import { useAuth } from '../../context/AuthContext';

const MAX_QUOTA_KG = 10000; // 100 Quintals (10,000 kg) State Procurement Limit

export const MyCrops: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [crops, setCrops] = useState<Crop[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [formError, setFormError] = useState<string>('');

  const [formData, setFormData] = useState({
    crop_type: 'Paddy (Common)',
    expected_quantity_kg: 2500,
    harvest_date: new Date().toISOString().split('T')[0],
  });

  const loadCrops = () => {
    const currentFarmer = db.getFarmerByUserId(user?.id);
    const all = db.getCollection<Crop>('crops');
    const myCrops = all.filter((c) => c.farmer_id === currentFarmer.id || c.farmer_id === user?.id);
    setCrops(myCrops);
  };

  useEffect(() => {
    loadCrops();
    const unsub = db.subscribe('table:crops', () => loadCrops());
    return () => unsub();
  }, [user?.id]);

  const totalRegisteredKg = crops.reduce((acc, c) => acc + (Number(c.expected_quantity_kg) || 0), 0);
  const totalRegisteredQuintals = totalRegisteredKg / 100;
  const remainingQuotaKg = Math.max(0, MAX_QUOTA_KG - totalRegisteredKg);
  const remainingQuotaQuintals = remainingQuotaKg / 100;
  const quotaPercent = Math.min(100, Math.round((totalRegisteredKg / MAX_QUOTA_KG) * 100));

  const handleOpenAdd = () => {
    if (totalRegisteredKg >= MAX_QUOTA_KG) {
      alert(`State quota full: You have reached the maximum 100 Quintals (10,000 kg) crop declaration limit.`);
      return;
    }
    setEditingCrop(null);
    setFormError('');
    setFormData({
      crop_type: 'Paddy (Common)',
      expected_quantity_kg: Math.min(2500, remainingQuotaKg),
      harvest_date: new Date().toISOString().split('T')[0],
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (crop: Crop) => {
    setEditingCrop(crop);
    setFormError('');
    setFormData({
      crop_type: crop.crop_type,
      expected_quantity_kg: crop.expected_quantity_kg,
      harvest_date: crop.harvest_date,
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('crops.deleteConfirm', 'Are you sure you want to delete this registered crop?'))) {
      db.deleteCrop(id);
      loadCrops();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(formData.expected_quantity_kg);
    
    if (!qty || qty <= 0) {
      setFormError('Please enter a valid positive crop quantity.');
      return;
    }

    if (qty > MAX_QUOTA_KG) {
      setFormError('Maximum crop weight limit is 100 Quintals (10,000 kg). Cannot exceed 100 Quintals.');
      return;
    }

    const otherCropsKg = crops
      .filter((c) => editingCrop ? c.id !== editingCrop.id : true)
      .reduce((acc, c) => acc + (Number(c.expected_quantity_kg) || 0), 0);

    if (otherCropsKg + qty > MAX_QUOTA_KG) {
      const allowed = Math.max(0, MAX_QUOTA_KG - otherCropsKg);
      setFormError(`Total quota exceeded! State limit is 100 Quintals (10,000 kg). You already have ${(otherCropsKg / 100).toFixed(2)} Q registered. Maximum you can add is ${(allowed / 100).toFixed(2)} Q (${allowed} kg).`);
      return;
    }

    const currentFarmer = db.getFarmerByUserId(user?.id);
    if (editingCrop) {
      db.updateCrop(editingCrop.id, {
        crop_type: formData.crop_type,
        expected_quantity_kg: qty,
        harvest_date: formData.harvest_date,
      });
    } else {
      db.addCrop({
        farmer_id: currentFarmer.id || 'far-01',
        crop_type: formData.crop_type,
        expected_quantity_kg: qty,
        harvest_date: formData.harvest_date,
      });
    }
    setIsModalOpen(false);
    loadCrops();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {t('crops.title', 'My Registered Crops')}
          </h2>
          <p className="text-xs text-slate-500">
            {t('crops.subtitle', 'Declare your expected harvest yields to automatically enable Mandi slot allocations')}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          disabled={totalRegisteredKg >= MAX_QUOTA_KG}
          className={`flex items-center justify-center gap-1.5 px-4 py-2.5 font-bold text-xs rounded-xl shadow-md transition-all self-start sm:self-auto ${
            totalRegisteredKg >= MAX_QUOTA_KG
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          <Plus className="w-4 h-4" />
          {t('crops.addDeclaration', 'Add Crop Declaration')}
        </button>
      </div>

      {/* Quota Progress Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-teal-950 text-white rounded-2xl p-5 border border-emerald-800/40 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Government Procurement Quota
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 font-semibold">
                Max Limit: 100 Quintals (10,000 kg)
              </span>
            </div>
            <p className="text-xs text-slate-300">
              State policy limits total crop declaration to a maximum of 100 Quintals per registered farmer account.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Registered Yield</span>
              <span className="text-lg font-extrabold text-white">
                {totalRegisteredQuintals.toFixed(2)} <span className="text-xs font-normal text-emerald-300">/ 100 Q</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Available Quota</span>
              <span className="text-lg font-extrabold text-emerald-400">
                {remainingQuotaQuintals.toFixed(2)} <span className="text-xs font-normal text-emerald-200">Q</span>
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                quotaPercent >= 100 ? 'bg-rose-500' : quotaPercent >= 80 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, quotaPercent)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1.5 font-medium">
            <span>{totalRegisteredKg} kg used ({quotaPercent}%)</span>
            <span>{remainingQuotaKg} kg remaining</span>
          </div>
        </div>
      </div>

      {/* Crops List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {crops.map((crop) => (
          <div
            key={crop.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Sprout className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {crop.status.replace('_', ' ')}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-base text-slate-900">{crop.crop_type}</h3>
                <span className="text-xs text-slate-400 font-mono">ID: {crop.id}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl">
                <div>
                  <span className="text-[10px] text-slate-400 block">{t('crops.expectedQuantity', 'Expected Quantity (kg)')}</span>
                  <span className="font-bold text-slate-800">{crop.expected_quantity_kg} kg</span>
                  <span className="text-[10px] text-emerald-600 block">
                    ({(crop.expected_quantity_kg / 100).toFixed(1)} {t('crops.quintals', 'Quintals')})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">{t('crops.harvestDate', 'Expected Harvest Date')}</span>
                  <span className="font-bold text-slate-800">{crop.harvest_date}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenEdit(crop)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 text-xs font-semibold flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  {t('common.edit', 'Edit')}
                </button>
                <button
                  onClick={() => handleDelete(crop.id)}
                  className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {t('common.delete', 'Delete')}
                </button>
              </div>

              <Link
                to="/farmer/procurement"
                className="text-xs font-bold text-emerald-600 hover:underline"
              >
                {t('farmerDashboard.bookSlotBtn', '🌾 Book Mandi Slot')} →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-base text-slate-900">
                {editingCrop ? t('crops.editCrop', 'Edit Crop Declaration') : t('crops.addDeclaration', 'Add Crop Declaration')}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-xs">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('crops.cropType', 'Crop Type')} *</label>
                <select
                  value={formData.crop_type}
                  onChange={(e) => setFormData({ ...formData, crop_type: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none font-semibold"
                >
                  <option value="Paddy (Common)">Paddy (Common) - MSP ₹ 2,300/Q</option>
                  <option value="Paddy (Grade A)">Paddy (Grade A) - MSP ₹ 2,320/Q</option>
                  <option value="Wheat (Sharbati)">Wheat (Sharbati) - MSP ₹ 2,425/Q</option>
                  <option value="Wheat (Standard)">Wheat (Standard) - MSP ₹ 2,275/Q</option>
                  <option value="Maize">Maize - MSP ₹ 2,225/Q</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700 block">
                    {t('crops.expectedQuantity', 'Expected Quantity (kg)')} *
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Max: 100 Quintals (10,000 kg)
                  </span>
                </div>
                <input
                  type="number"
                  required
                  min={1}
                  max={10000}
                  value={formData.expected_quantity_kg || ''}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFormData({ ...formData, expected_quantity_kg: val });
                    if (val > 10000) {
                      setFormError('Maximum crop weight limit is 100 Quintals (10,000 kg). Cannot add crop above 100 Quintals.');
                    } else {
                      setFormError('');
                    }
                  }}
                  className={`w-full p-2.5 bg-slate-50 border rounded-xl outline-none font-bold ${
                    formData.expected_quantity_kg > 10000 ? 'border-rose-500 bg-rose-50/40 text-rose-900' : 'border-slate-300'
                  }`}
                  placeholder="Enter weight in kg (Max 10000)"
                />
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span className={`font-semibold ${formData.expected_quantity_kg > 10000 ? 'text-rose-600 font-bold' : 'text-slate-600'}`}>
                    = {(Number(formData.expected_quantity_kg || 0) / 100).toFixed(2)} {t('crops.quintals', 'Quintals')}
                  </span>
                  <span>
                    {formData.expected_quantity_kg > 10000 ? (
                      <span className="text-rose-600 font-bold">⚠️ Exceeds State Quota</span>
                    ) : (
                      `Yield quota: ${((Number(formData.expected_quantity_kg || 0) / 10000) * 100).toFixed(0)}%`
                    )}
                  </span>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">{t('crops.harvestDate', 'Expected Harvest Date')} *</label>
                <input
                  type="date"
                  required
                  value={formData.harvest_date}
                  onChange={(e) => setFormData({ ...formData, harvest_date: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {t('common.cancel', 'Cancel')}
                </button>
                <button
                  type="submit"
                  disabled={formData.expected_quantity_kg > 10000 || formData.expected_quantity_kg <= 0}
                  className={`px-5 py-2 font-bold rounded-xl shadow-md transition-all ${
                    formData.expected_quantity_kg > 10000 || formData.expected_quantity_kg <= 0
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {editingCrop ? t('common.save', 'Save') : t('crops.saveCrop', 'Save Crop Declaration')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
