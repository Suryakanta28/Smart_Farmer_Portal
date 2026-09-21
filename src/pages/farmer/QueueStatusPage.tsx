// Live Queue Status Page for Farmer with Real-Time Token Calling Subscription
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Hourglass, Clock, Bell, CheckCircle2, Ticket, ArrowRight, Calendar, AlertCircle } from 'lucide-react';
import { db, QueueItem, Booking, Farmer } from '../../lib/db';
import { useAuth } from '../../context/AuthContext';
import { formatTimeAgo, formatLiveTime } from '../../lib/dateUtils';

export const QueueStatusPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [farmer, setFarmer] = useState<Farmer>(() => db.getFarmerByUserId(user?.id));
  const [myBooking, setMyBooking] = useState<Booking | null>(null);
  const [myQueueItem, setMyQueueItem] = useState<QueueItem | null>(null);
  const [queueItems, setQueueItems] = useState<QueueItem[]>([]);

  const avgMinutesPerFarmer = 15;

  useEffect(() => {
    const refreshQueue = () => {
      const currentFarmer = db.getFarmerByUserId(user?.id);
      setFarmer(currentFarmer);

      const allBookings = db.getCollection<Booking>('bookings');
      const myBookings = allBookings.filter(
        (b) => b.farmer_id === currentFarmer.id || b.farmer_id === user?.id
      );
      const activeB = myBookings[0] || null;
      setMyBooking(activeB);

      const allQueue = db.getCollection<QueueItem>('queue');
      setQueueItems(allQueue);

      if (activeB) {
        const myItem = allQueue.find(
          (q) =>
            q.token_code === activeB.token_code ||
            q.booking_id === activeB.id ||
            q.farmer_id === currentFarmer.id ||
            q.farmer_id === user?.id
        );
        setMyQueueItem(myItem || null);
      } else {
        setMyQueueItem(null);
      }
    };

    refreshQueue();

    // Subscribe to realtime queue and booking events
    const unsubQueue = db.subscribe('table:queue', refreshQueue);
    const unsubBookings = db.subscribe('table:bookings', refreshQueue);
    const unsubFarmers = db.subscribe('table:farmers', refreshQueue);

    return () => {
      unsubQueue();
      unsubBookings();
      unsubFarmers();
    };
  }, [user?.id]);

  const hasBooking = !!myBooking;
  const currentPos = myQueueItem ? myQueueItem.position : null;
  const estimatedWaitMins = currentPos ? currentPos * avgMinutesPerFarmer : 0;
  const isCalled = myQueueItem?.status === 'called';

  const calledHistory = queueItems.filter((q) => q.status === 'called' || q.status === 'completed');

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
            {t('queue.telemetryTag', 'Live Mandi Telemetry')}
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1">
            {t('queue.title', 'Queue & Token Status')}
          </h2>
          <p className="text-xs text-slate-500">
            {t('queue.subtitle', 'Real-time weighbridge sequence synchronized with Sambalpur Mandi gate pass system')}
          </p>
        </div>

      </div>

      {/* If No Active Booking Exists for Logged in Farmer */}
      {!hasBooking && (
        <div className="bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto shadow-inner">
            <Ticket className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="text-lg font-extrabold text-slate-900">
              {t('queue.noActiveToken', 'No Active Token or Slot Booked')}
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              {t('queue.noActiveDesc', 'Aapne abhi tak koi Mandi slot ya Gate Pass Token book nahi kiya hai. Weighbridge live queue status prapt karne ke liye pehle Procurement Flow se slot book karein.')}
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/farmer/procurement"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
            >
              <span>{t('farmerDashboard.bookSlotBtn', '🌾 Book Mandi Slot Now')}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Alert if Farmer's Own Token is CALLED */}
      {hasBooking && isCalled && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-center justify-between animate-pulse">
          <div className="flex items-center gap-3">
            <Bell className="w-6 h-6 text-rose-600 animate-bounce" />
            <div>
              <h4 className="font-extrabold text-sm">🔔 {t('queue.tokenCalledAlert', 'YOUR TOKEN HAS BEEN CALLED!')}</h4>
              <p className="text-xs text-rose-700 mt-0.5">
                {t('queue.tokenCalledDesc', 'Proceed to Computerized Weighbridge Bay 1 immediately with your QR Token.')}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-rose-600 text-white font-bold text-xs rounded-xl">
            {t('queue.activeCall', 'Active Call')}
          </span>
        </div>
      )}

      {/* Large Counter Cards (Only when farmer has an active booking) */}
      {hasBooking && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Queue Position */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
              {t('queue.yourPosition', 'Your Queue Position')}
            </span>
            <div className="text-7xl sm:text-8xl font-black text-emerald-600 tracking-tighter">
              {currentPos !== null ? `#${currentPos}` : '—'}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {t('queue.tokenCode', 'Token Code')}: <b className="text-slate-800">{myBooking?.token_code || myQueueItem?.token_code || '—'}</b>
            </p>
            <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-200">
              {currentPos !== null ? (
                currentPos === 1 ? 'You are next in queue!' : `${currentPos - 1} farmers ahead of you`
              ) : (
                `Scheduled: ${myBooking?.date} • ${myBooking?.time_slot}`
              )}
            </div>
          </div>

          {/* Estimated Wait Time */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center space-y-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block">
              {t('queue.estimatedWait', 'Estimated Wait Time')}
            </span>
            <div className="text-6xl sm:text-7xl font-black text-amber-500 tracking-tighter">
              {currentPos !== null ? (
                <>
                  ~{estimatedWaitMins}
                  <span className="text-2xl text-slate-400 font-bold ml-1">{t('farmerDashboard.mins', 'mins')}</span>
                </>
              ) : (
                <span className="text-3xl text-slate-400 font-bold">On Arrival</span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {currentPos !== null
                ? `Based on ${avgMinutesPerFarmer} mins average weighment and moisture testing`
                : 'Queue activates when your vehicle arrives at Mandi gate'}
            </p>
            <div className="inline-block px-3 py-1 bg-amber-50 text-amber-800 text-xs font-semibold rounded-full border border-amber-200">
              Auto-recalculated in real-time
            </div>
          </div>
        </div>
      )}

      {/* Token Calling History at Mandi */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-md space-y-4">
        <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-600" />
          Recent Mandi Token Call History
        </h3>

        <div className="divide-y divide-slate-100 text-xs">
          {calledHistory.length === 0 ? (
            <p className="py-4 text-center text-slate-400">No token calls in the last hour yet.</p>
          ) : (
            calledHistory.map((item) => (
              <div key={item.id} className="py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    #{item.token_number}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">{item.token_code}</h4>
                    <p className="text-[11px] text-slate-500">{item.farmer_name}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                    {item.status.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium block mt-0.5">
                    {item.called_at ? formatTimeAgo(item.called_at) : 'Recently'}
                  </span>
                  {item.called_at && (
                    <span className="text-[9px] text-slate-400 block font-mono">
                      {formatLiveTime(item.called_at, false)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
