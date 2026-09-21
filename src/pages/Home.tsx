// Public Landing Page (No Login Required)
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Leaf, Users, Scale, Truck, DollarSign, ArrowRight, ShieldCheck, 
  MapPin, Phone, MessageCircle, Mail, Send, ChevronDown, CheckCircle2, 
  Clock, Navigation, Award, BarChart3, HelpCircle, UserPlus, Calendar, TrendingUp, Bot 
} from 'lucide-react';
import { Navbar } from '../components/common/Navbar';
import { Footer } from '../components/common/Footer';
import { WeatherWidget } from '../components/common/WeatherWidget';
import { FloatingAiAssistant } from '../components/common/FloatingAiAssistant';
import { InteractiveMap } from '../components/map/InteractiveMap';
import { db } from '../lib/db';
import { sendSms } from '../lib/sms';

export const Home: React.FC = () => {
  const { t } = useTranslation();

  // Real-time animated counters state
  const [metrics, setMetrics] = useState({
    totalFarmersToday: 0,
    totalProcurementToday: 0,
    activeVehiclesCount: 0,
    totalPaymentsToday: 0,
  });

  const [faqOpen, setFaqOpen] = useState<number | null>(0);

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  // Fetch live procurement metrics every 30s as specified
  useEffect(() => {
    const updateMetrics = () => {
      const live = db.getLiveMetrics();
      setMetrics(live);
    };

    updateMetrics();
    const interval = setInterval(updateMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.phone) return;

    // Save contact message to database audit logs
    const logs = db.getCollection('audit_logs');
    logs.push({
      id: `contact-${Date.now()}`,
      action: 'contact_form_submitted',
      entity: 'support',
      details: contactForm,
      created_at: new Date().toISOString(),
    });
    db.setCollection('audit_logs', logs);

    // Trigger SMS acknowledgement
    sendSms({
      phone: contactForm.phone,
      message: `Dear ${contactForm.name}, your query has been received by Support Desk. Reference: #KF-${Date.now().toString().slice(-4)}. Helpline: 1800-180-2026.`,
      type: 'transactional',
    });

    setContactSubmitted(true);
    setContactForm({ name: '', phone: '', email: '', message: '' });
  };

  const faqs = [
    {
      q: t('faq.q1', 'How does the automated slot booking work for farmers?'),
      a: t('faq.a1', 'Farmers can select their crop and transport method. If you choose Self Transport, you can directly book any available 30-minute slot at your mandi. If you choose Vehicle Pickup, a nearby vehicle is automatically allocated to your village first, and your slot is scheduled after arrival.'),
    },
    {
      q: t('faq.q2', 'What if a farmer does not have a smartphone or internet access?'),
      a: t('faq.a2', 'The platform provides an 8-Step Offline Assistance module for Primary Agricultural Cooperative Society (PACS) officers. Officers enter the farmer’s Aadhaar and crop details, assign a transport trolley, and generate a physical printed token slip with QR code while sending SMS updates to an alternate family contact.'),
    },
    {
      q: t('faq.q3', 'How are DBT payments cleared through PFMS?'),
      a: t('faq.a3', 'Immediately after automated digital weighment and computer-graded moisture analysis, a Gate Pass is created. The Direct Benefit Transfer (DBT) payment instruction is sent via the PFMS gateway directly to the farmer’s Aadhaar-linked bank account, crediting funds within 48 to 72 hours.'),
    },
    {
      q: t('faq.q4', 'How can I track the vehicle carrying my crop?'),
      a: t('faq.a4', 'The platform integrates real-time GPS tracking using Leaflet and OSRM routing. Both farmers and mandi officers can view live vehicle markers moving every 10 seconds, check live ETAs, and call the driver directly from the dashboard.'),
    },
    {
      q: t('faq.q5', 'What crops are eligible under MSP procurement?'),
      a: t('faq.a5', 'The system supports all primary kharif and rabi staples including Paddy (Common & Grade A), Wheat (Sharbati & Standard), Maize, Mustard, and Pulses, according to the official state MSP procurement guidelines.'),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5]">
      <Navbar />

      {/* HERO SECTION: Warm, High-Conversion Editorial Layout */}
      <section id="home" className="relative pt-6 pb-12 lg:pt-10 lg:pb-16 overflow-hidden scroll-mt-20">
        {/* Soft Background Warm Ambiance */}
        <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-amber-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 left-0 w-[450px] h-[450px] bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Content Column (7 cols on lg) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Badge: SMART FARMER PROCUREMENT */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#F5EBE1] border border-[#E9DACB] text-[#7C4A1E] text-[11px] font-bold uppercase tracking-wider shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                <span>{t('hero.tagBadge', 'SMART FARMER PROCUREMENT')}</span>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-serif font-black text-slate-900 tracking-tight leading-[1.12]">
                {t('hero.mainTitle', 'From Harvest To Fair Payment')}
              </h1>

              {/* Subheadline / Description */}
              <p className="text-base sm:text-lg text-slate-600 max-w-xl font-normal leading-relaxed">
                {t('hero.mainSubtitle', 'FPP connects farmers with procurement centres through simple slot booking, reliable transport and transparent payments.')}
              </p>

              {/* CTAs Row */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <Link
                  to="/register"
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95"
                >
                  <span>{t('hero.registerLogin', 'Register / Login')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#how-it-works"
                  className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 font-bold text-sm shadow-sm transition-all hover:border-emerald-300"
                >
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <span>{t('hero.bookMandiSlot', 'Book Mandi Slot')}</span>
                </a>

                <Link
                  to="/track"
                  className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-slate-800 font-bold text-sm shadow-sm transition-all hover:border-emerald-300"
                >
                  <Truck className="w-4 h-4 text-emerald-600" />
                  <span>{t('hero.trackVehicleQueue', 'Track Vehicle & Queue')}</span>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap items-center gap-y-2.5 gap-x-6 pt-3 text-xs font-semibold text-slate-700">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('hero.trust1', 'Zero Middlemen Deductions')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('hero.trust2', 'Instant Digital Token Slip')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('hero.trust3', 'Direct Bank Transfer (DBT)')}</span>
                </div>
              </div>
            </div>

            {/* Right Card Column (5 cols on lg) */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/80 bg-slate-100 group">
                <img
                  src="/hero_crop_field.jpg"
                  alt="Agricultural Harvest Field"
                  className="w-full h-[270px] sm:h-[320px] lg:h-[340px] object-cover object-center transform group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                {/* Floating Overlay Card */}
                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl shadow-lg border border-white/80 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-sm">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-slate-500 block">
                        {t('hero.mspTag', 'Government MSP Today')}
                      </span>
                      <span className="text-sm sm:text-base font-extrabold text-slate-900">
                        {t('hero.mspValue', 'Paddy Grade A: ₹2,320 / Qtl')}
                      </span>
                    </div>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-extrabold px-3 py-1 rounded-full shrink-0">
                    {t('hero.mspProtected', '100% Protected')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FLOATING STATS METRICS BAR */}
      <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-2 sm:-mt-4 mb-8 w-full">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {/* Stat 1: Verified Farmers */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                {t('liveStatus.farmersToday', 'VERIFIED FARMERS')}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block">
                {metrics.totalFarmersToday > 0 ? `${metrics.totalFarmersToday}+` : '4+'}
              </span>
              <span className="text-xs text-slate-500 font-medium block mt-0.5">
                {t('liveStatus.farmersSub', 'Directly onboarded in Odisha')}
              </span>
            </div>
          </div>

          {/* Stat 2: Quintals Procured */}
          <div className="flex items-start gap-4 sm:pl-6 pt-4 sm:pt-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                {t('liveStatus.procurementToday', 'QUINTALS PROCURED')}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block">
                {metrics.totalProcurementToday > 0 ? `${metrics.totalProcurementToday} Qtl` : '119 Qtl'}
              </span>
              <span className="text-xs text-slate-500 font-medium block mt-0.5">
                {t('liveStatus.procurementSub', 'Weighed and certified')}
              </span>
            </div>
          </div>

          {/* Stat 3: Active Fleet Vehicles */}
          <div className="flex items-start gap-4 lg:pl-6 pt-4 sm:pt-0">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 shadow-sm">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                {t('liveStatus.activeVehicles', 'ACTIVE FLEET VEHICLES')}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight block">
                {metrics.activeVehiclesCount > 0 ? metrics.activeVehiclesCount : '2'}
              </span>
              <span className="text-xs text-slate-500 font-medium block mt-0.5">
                {t('liveStatus.activeVehiclesSub', 'Smart GPS allocated trucks')}
              </span>
            </div>
          </div>

          {/* Stat 4: DBT Direct Payments */}
          <div className="flex items-start gap-4 lg:pl-6 pt-4 sm:pt-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
                {t('liveStatus.paymentsToday', 'DBT DIRECT PAYMENTS')}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight block">
                {metrics.totalPaymentsToday > 0 ? `₹${(metrics.totalPaymentsToday / 100000).toFixed(1)} Lakhs` : '₹1.8 Lakhs'}
              </span>
              <span className="text-xs text-slate-500 font-medium block mt-0.5">
                {t('liveStatus.paymentsSub', 'Directly to bank accounts')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Integrated Roles Direct Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 w-full">
        <div className="p-3.5 rounded-2xl bg-white/70 backdrop-blur-sm border border-slate-200/80 shadow-sm flex flex-wrap items-center justify-center gap-2.5 text-xs text-slate-600">
          <span className="font-bold text-slate-800">{t('hero.rolesTitle', '5 Integrated Roles:')}</span>
          <Link to="/farmer/dashboard" className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-xl font-bold transition-all hover:scale-105">🌾 {t('hero.roleFarmer', 'Farmer')}</Link>
          <Link to="/society/dashboard" className="px-3 py-1 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-900 rounded-xl font-bold transition-all hover:scale-105">🏘️ {t('hero.roleSociety', 'Society PACS')}</Link>
          <Link to="/officer/dashboard" className="px-3 py-1 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 rounded-xl font-bold transition-all hover:scale-105">🏢 {t('hero.roleOfficer', 'Procurement Mandi')}</Link>
          <Link to="/driver/dashboard" className="px-3 py-1 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 rounded-xl font-bold transition-all hover:scale-105">🚚 {t('hero.roleDriver', 'Vehicle Driver')}</Link>
          <Link to="/manager/dashboard" className="px-3 py-1 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 rounded-xl font-bold transition-all hover:scale-105">👨💼 {t('hero.roleManager', 'State Manager')}</Link>
        </div>
      </section>

      {/* FEATURE 1: FIND PROCUREMENT CENTRE (INTERACTIVE MAP & LIST) */}
      <section id="centres" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full scroll-mt-20">
        <div className="text-center mb-8">
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
            {t('centres.tag', 'Interactive GIS Locator')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {t('centres.title', 'Find Procurement Centre')}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl mx-auto">
            {t('centres.subtitle', 'Locate authorized Mandis with live queue tracking, wait times, and direct turn-by-turn OSRM routing')}
          </p>
        </div>

        <InteractiveMap showBookSlotButton={false} />
      </section>

      {/* FEATURE: CORE PLATFORM SERVICES */}
      <section id="services" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full scroll-mt-20">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider mb-2 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
            <span>{t('servicesSection.tag', 'Core Platform Services')}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 mt-1">
            {t('servicesSection.title', 'Services Designed For Modern Agriculture')}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-2xl mx-auto leading-relaxed">
            {t('servicesSection.subtitle', 'End-to-end transparent tools from slot booking and GPS transport to instant digital weighment and DBT settlements.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Automated Slot Booking */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-300 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Calendar className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {t('servicesSection.card1Tag', 'Zero Waiting')}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {t('servicesSection.card1Title', 'Automated Mandi Slot Booking')}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {t('servicesSection.card1Desc', 'Book verified 30-minute procurement slots at your preferred mandi yard within a 7-day calendar window to avoid long queues.')}
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>7-Day interactive time calendar</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Guaranteed mandi entry pass</span>
                </li>
              </ul>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100">
              <a href="#how-it-works" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors">
                <span>{t('servicesSection.card1Action', 'Book Mandi Slot')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Card 2: Free Vehicle Pickup & GPS Fleet */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-300 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Truck className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {t('servicesSection.card2Tag', 'Doorstep Fleet')}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {t('servicesSection.card2Title', 'Vehicle Pickup & Live GPS Tracking')}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {t('servicesSection.card2Desc', 'Haversine distance matching assigns nearest available tractor/truck to your village with live 10-second GPS map updates.')}
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Real-time OSRM route tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Direct driver calling from dashboard</span>
                </li>
              </ul>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100">
              <Link to="/track" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors">
                <span>{t('servicesSection.card2Action', 'Track Live Vehicles')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 3: Digital Weighment & Quality Assurance */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-300 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Scale className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {t('servicesSection.card3Tag', 'Zero Deductions')}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {t('servicesSection.card3Title', 'Digital Weighbridge & Quality Test')}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {t('servicesSection.card3Desc', 'Automated weighbridge integration and computerized moisture analysis ensure 100% fair procurement without unauthorized deductions.')}
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Instant digital weighment receipt</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Transparent QA certification slip</span>
                </li>
              </ul>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100">
              <a href="#how-it-works" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors">
                <span>{t('servicesSection.card3Action', 'View Procurement Steps')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Card 4: Direct DBT Bank Settlement via PFMS */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-300 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <DollarSign className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {t('servicesSection.card4Tag', 'Direct to Bank')}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {t('servicesSection.card4Title', 'Direct DBT Settlement (PFMS)')}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {t('servicesSection.card4Desc', 'Direct Benefit Transfer (DBT) clears official MSP funds directly into the farmer’s Aadhaar-linked bank account within 48 to 72 hours.')}
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>100% official MSP rates guaranteed</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Instant transactional SMS alert</span>
                </li>
              </ul>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100">
              <a href="#about" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors">
                <span>{t('servicesSection.card4Action', 'Payment FAQs & Rules')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          {/* Card 5: PACS Offline Inclusivity Assistance */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-300 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {t('servicesSection.card5Tag', 'Non-Smartphone')}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {t('servicesSection.card5Title', '8-Step PACS Offline Assistance')}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {t('servicesSection.card5Desc', 'Dedicated cooperative society module for non-smartphone farmers: officers enter details, assign transport, and print QR tokens.')}
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Physical QR code token slip</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Alternate family contact SMS</span>
                </li>
              </ul>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100">
              <Link to="/society/dashboard" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors">
                <span>{t('servicesSection.card5Action', 'Society PACS Portal')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Card 6: Multilingual AI Advisory & 24/7 Helpline */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 hover:border-emerald-300 transition-all flex flex-col justify-between group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Bot className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {t('servicesSection.card6Tag', 'Voice & Chat')}
                </span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  {t('servicesSection.card6Title', 'Multilingual AI Agro Advisory')}
                </h3>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {t('servicesSection.card6Desc', 'Voice-enabled AI assistant providing instant guidance in English, Hindi & Odia for MSP rates, nearest mandis, and weather alerts.')}
                </p>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Multilingual voice speech input/output</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Toll-free 1800-180-2026 helpline</span>
                </li>
              </ul>
            </div>
            <div className="pt-5 mt-4 border-t border-slate-100">
              <a href="#about" className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors">
                <span>{t('servicesSection.card6Action', 'Contact Helpdesk')}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS: CRITICAL TRANSPORT MODE FLOW */}
      <section id="how-it-works" className="py-16 bg-white border-y border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
              {t('howItWorks.tag', 'End-to-End Workflow')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {t('howItWorks.title', 'How Platform Automates Procurement')}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {t('howItWorks.subtitle', 'Dynamic path selection based on farmer transport needs')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Flow A: Self Transport */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  🚜
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {t('howItWorks.optionATitle', 'Option A: Self Transport')}
                  </h3>
                  <span className="text-xs text-emerald-700 font-semibold">{t('howItWorks.optionASub', 'Direct 7-Day Slot Booking')}</span>
                </div>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t('howItWorks.optionABullet1', 'Farmer selects crop and procurement mandi yard.')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t('howItWorks.optionABullet2', 'Immediate calendar grid (7 days × 30-min intervals) to pick slot.')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t('howItWorks.optionABullet3', 'Generates official token (e.g. #KFA-1024) + QR code + PDF download.')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{t('howItWorks.optionABullet4', 'Automatic SMS sent via MSG91 with turn directions.')}</span>
                </li>
              </ul>
            </div>

            {/* Flow B: Vehicle Pickup Request */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  🚚
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {t('howItWorks.optionBTitle', 'Option B: Request Vehicle Pickup')}
                  </h3>
                  <span className="text-xs text-blue-700 font-semibold">{t('howItWorks.optionBSub', 'Smart Nearest Fleet Assignment First')}</span>
                </div>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>{t('howItWorks.optionBBullet1', 'Farmer requests free vehicle pickup with preferred morning hour (7:00-8:00 AM).')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>{t('howItWorks.optionBBullet2', 'Haversine algorithm matches nearest available vehicle with capacity.')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>{t('howItWorks.optionBBullet3', 'Slot is locked to ≥ 2 hours after pickup to prevent mandi bottleneck.')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <span>{t('howItWorks.optionBBullet4', 'Farmer tracks driver on real-time GPS map with 10-second updates.')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURE 4: AGRICULTURAL WEATHER WIDGET */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <WeatherWidget />
      </section>

      {/* FEATURE 5: CONTACT & FAQ SECTION */}
      <section id="about" className="py-16 bg-white border-t border-slate-200 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Contact Details & SendGrid Form */}
            <div className="space-y-6">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
                  {t('contact.tag', 'Direct Support Network')}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                  {t('contact.title', 'Connect with Procurement Desk')}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {t('contact.subtitle', '24/7 Toll-free assistance, WhatsApp chat, or direct message')}
                </p>
              </div>

              {/* Quick Helpline Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="tel:18001802026"
                  className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 hover:bg-emerald-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">{t('contact.helplineTitle', 'Toll-Free Helpline')}</span>
                    <span className="text-sm font-extrabold">1800-180-2026</span>
                  </div>
                </a>

                <a
                  href="https://wa.me/919876543201?text=Hello%20Support"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 text-green-900 hover:bg-green-100 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-green-600 text-white flex items-center justify-center shrink-0">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">{t('contact.whatsappTitle', 'WhatsApp Desk')}</span>
                    <span className="text-sm font-extrabold">+91 98765 43201</span>
                  </div>
                </a>
              </div>

              {/* Contact Form */}
              <form onSubmit={handleContactSubmit} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">
                  {t('contact.formTitle', 'Send a Direct Message to Mandi Control Room:')}
                </span>

                {contactSubmitted && (
                  <div className="p-3 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {t('contact.formSuccess', 'Thank you! Your message has been routed and SMS confirmation sent.')}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <input
                    type="text"
                    placeholder={t('contact.namePlaceholder', 'Farmer / Citizen Name *')}
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="p-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <input
                    type="tel"
                    placeholder={t('contact.phonePlaceholder', 'Mobile Number (for SMS) *')}
                    required
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="p-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <input
                  type="email"
                  placeholder={t('contact.emailPlaceholder', 'Email Address (Optional)')}
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <textarea
                  rows={3}
                  placeholder={t('contact.messagePlaceholder', 'Your procurement query or grievance...')}
                  required
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500"
                />

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {t('contact.submitButton', 'Submit Message (SendGrid & SMS)')}
                </button>
              </form>
            </div>

            {/* FAQ Accordion (5 Questions) */}
            <div className="space-y-4">
              <div>
                <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
                  {t('faq.tag', 'Knowledge Base')}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
                  {t('faq.title', 'Frequently Asked Questions')}
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  {t('faq.subtitle', 'Key answers regarding procurement rules, tokens, and PFMS payments')}
                </p>
              </div>

              <div className="space-y-2.5">
                {faqs.map((faq, i) => (
                  <div
                    key={i}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 transition-all"
                  >
                    <button
                      onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                      className="w-full p-4 text-left flex items-center justify-between text-xs font-bold text-slate-800 hover:bg-slate-100"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          faqOpen === i ? 'rotate-180 text-emerald-600' : ''
                        }`}
                      />
                    </button>
                    {faqOpen === i && (
                      <div className="px-4 pb-4 text-xs text-slate-600 leading-relaxed bg-white border-t border-slate-100">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Floating AI Assistant Widget */}
      <FloatingAiAssistant />

      <Footer />
    </div>
  );
};
