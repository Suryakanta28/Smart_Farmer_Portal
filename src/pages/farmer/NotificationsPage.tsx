// Notifications Center for Farmer & All Roles
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck, Filter, Truck, DollarSign, AlertTriangle, Info, ArrowRight } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { NotificationItem } from '../../lib/db';
import { formatTimeAgo, formatLiveDateTime } from '../../lib/dateUtils';

export const NotificationsPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { notifications, unreadCount, markAsRead, markAllAsRead, pushNotification } = useNotifications();
  const [filter, setFilter] = useState<'all' | 'unread' | 'transport' | 'payment'>('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'transport') return n.type === 'transport';
    if (filter === 'payment') return n.type === 'payment';
    return true;
  });

  const getIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'transport':
        return <Truck className="w-5 h-5 text-blue-600" />;
      case 'payment':
        return <DollarSign className="w-5 h-5 text-emerald-600" />;
      case 'urgent':
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-600" />;
      default:
        return <Info className="w-5 h-5 text-slate-600" />;
    }
  };

  const handleTriggerTestAlert = () => {
    pushNotification({
      user_id: 'usr-farmer',
      title: 'Mandi Gate Alert',
      message: 'Weighbridge Bay 2 is now open for direct paddy unloading.',
      type: 'info',
      link: '/farmer/queue',
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              {t('notifications.title', 'Notifications & Mandi Alerts')}
            </h2>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-xs font-bold">
                {unreadCount} New
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {t('notifications.subtitle', 'Real-time alerts for token turns, vehicle arrivals, weather forecasts, and bank credits')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <CheckCheck className="w-4 h-4 text-emerald-600" />
              <span>{t('notifications.markAllRead', 'Mark All as Read')}</span>
            </button>
          )}

          <button
            onClick={handleTriggerTestAlert}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all"
          >
            + Test Alert
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 text-xs font-semibold">
        {[
          { id: 'all', label: `${t('notifications.all', 'All Alerts')} (${notifications.length})` },
          { id: 'unread', label: `${t('notifications.unread', 'Unread Only')} (${unreadCount})` },
          { id: 'transport', label: `🚚 ${t('farmerNav.transportMode', 'Transport Mode')}` },
          { id: 'payment', label: `💰 ${t('farmerNav.payments', 'Payments (DBT)')}` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id as any)}
            className={`px-4 py-2 rounded-xl transition-all ${
              filter === tab.id
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-2">
            <Bell className="w-10 h-10 text-slate-300 mx-auto" />
            <h4 className="font-bold text-slate-700 text-sm">{t('notifications.noNotifications', 'No notifications found')}</h4>
            <p className="text-xs text-slate-400">You are all caught up with your procurement alerts.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                markAsRead(item.id);
                if (item.link) navigate(item.link);
              }}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-4 ${
                !item.read
                  ? 'bg-white border-emerald-300 shadow-sm ring-1 ring-emerald-500/20'
                  : 'bg-slate-50/70 border-slate-200 hover:bg-white'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className={`text-xs sm:text-sm font-extrabold ${!item.read ? 'text-slate-900' : 'text-slate-700'}`}>
                      {item.title}
                    </h4>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {item.message}
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-400">
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                      {formatTimeAgo(item.created_at)}
                    </span>
                    <span>•</span>
                    <span className="font-mono">{formatLiveDateTime(item.created_at)}</span>
                  </div>
                </div>
              </div>

              {item.link && (
                <span className="text-xs font-semibold text-emerald-600 hover:underline flex items-center gap-1 shrink-0 pt-1">
                  <span>{t('common.details', 'Details')}</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
