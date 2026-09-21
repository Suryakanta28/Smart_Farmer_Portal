// Role Selection Page for Registration
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React from 'react';
import { Link } from 'react-router-dom';
import { Sprout, Building2, Truck, Users, ShieldAlert, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';

export const RegisterRole: React.FC = () => {
  const roles = [
    {
      id: 'farmer',
      title: 'Farmer Registration',
      hindi: 'किसान पंजीकरण',
      icon: Sprout,
      desc: 'Register land area, link Aadhaar & bank account, book slots, and request free pickup vehicles.',
      badge: 'Instant KYC',
      path: '/register/farmer',
      color: 'from-emerald-500 to-green-600',
    },
    {
      id: 'society_officer',
      title: 'Society Officer (PACS)',
      hindi: 'प्राथमिक कृषि सहकारी समिति',
      icon: Users,
      desc: 'Enroll offline non-smartphone farmers, print physical tokens, and oversee local cluster arrivals.',
      badge: 'Officer Approval',
      path: '/register/officer?role=society_officer',
      color: 'from-blue-500 to-indigo-600',
    },
    {
      id: 'procurement_officer',
      title: 'Procurement Officer',
      hindi: 'मंडी खरीद अधिकारी',
      icon: Building2,
      desc: 'Manage weighbridge queue, inspect digital moisture analysis, issue gate passes, and clear PFMS.',
      badge: 'Mandi Admin',
      path: '/register/officer?role=procurement_officer',
      color: 'from-teal-500 to-emerald-700',
    },
    {
      id: 'driver',
      title: 'Vehicle Logistics Driver',
      hindi: 'परिवहन वाहन चालक',
      icon: Truck,
      desc: 'Receive farm pickup dispatches, stream live GPS updates, and navigate using turn-by-turn routing.',
      badge: 'Commercial Fleet',
      path: '/register/officer?role=driver',
      color: 'from-amber-500 to-orange-600',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full">
        <div className="text-center mb-10 space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Portal Onboarding
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Select Your Registration Category
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xl mx-auto">
            Choose your official operational role to begin step-by-step verification and credentials setup.
          </p>
        </div>

        {/* 4 Role Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {roles.map((r) => {
            const Icon = r.icon;
            return (
              <Link
                key={r.id}
                to={r.path}
                className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 hover:border-emerald-500 hover:shadow-xl transition-all duration-300 group flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${r.color} text-white flex items-center justify-center shadow-md`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
                      {r.badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center gap-2">
                      {r.title}
                      <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-emerald-600" />
                    </h3>
                    <p className="text-xs text-emerald-800 font-medium">{r.hindi}</p>
                    <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                      {r.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-600">
                  <span>Start Application</span>
                  <span className="text-slate-400 font-normal">Takes ~3 mins</span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Manager Admin Notice */}
        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 flex items-start gap-3 text-xs text-amber-900 max-w-2xl mx-auto">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Important Notice regarding Manager Role:</span>
            <span>
              State Procurement Manager accounts have <b>NO public registration</b>. They are securely provisioned exclusively by State Government Administrative Officers. For testing the Manager dashboard, please use the 1-click test fill on the{' '}
              <Link to="/login" className="font-bold underline text-amber-950">
                Login Page
              </Link>.
            </span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};
