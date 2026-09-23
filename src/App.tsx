// Main Routing and Role Security Configuration
// KRISHIFLOW-AI - Smart India Hackathon 2026 (Problem ID: SIH26032)

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LanguageProvider } from './context/LanguageContext';

// Public & Auth Pages
import { Home } from './pages/Home';
import { Login } from './pages/auth/Login';
import { RegisterRole } from './pages/auth/RegisterRole';
import { RegisterFarmer } from './pages/auth/RegisterFarmer';
import { RegisterOfficer } from './pages/auth/RegisterOfficer';
import { ReceiptVerificationPage } from './pages/public/ReceiptVerificationPage';
import { SmsToastNotification } from './components/common/SmsToastNotification';

// Farmer Pages
import { FarmerLayout } from './pages/farmer/FarmerLayout';
import { FarmerDashboard } from './pages/farmer/FarmerDashboard';
import { MyCrops } from './pages/farmer/MyCrops';
import { ProcurementFlow } from './pages/farmer/ProcurementFlow';
import { TransportPage } from './pages/farmer/TransportPage';
import { VehicleTrackingPage } from './pages/farmer/VehicleTrackingPage';
import { QueueStatusPage } from './pages/farmer/QueueStatusPage';
import { PaymentsPage } from './pages/farmer/PaymentsPage';
import { SlotsTokensPage } from './pages/farmer/SlotsTokensPage';
import { ReceiptsPage } from './pages/farmer/ReceiptsPage';
import { NotificationsPage } from './pages/farmer/NotificationsPage';
import { AiAssistantPage } from './pages/farmer/AiAssistantPage';
import { WeatherPage } from './pages/farmer/WeatherPage';
import { FarmerProfilePage } from './pages/farmer/FarmerProfilePage';
import { SettingsPage } from './pages/farmer/SettingsPage';

// Society Officer Pages
import { SocietyLayout } from './pages/society/SocietyLayout';
import { SocietyDashboard } from './pages/society/SocietyDashboard';
import { OfflineFarmersPage } from './pages/society/OfflineFarmersPage';
import { FarmersListPage } from './pages/society/FarmersListPage';
import { PickupTrackingSocietyPage } from './pages/society/PickupTrackingSocietyPage';
import { SocietyReportsPage } from './pages/society/SocietyReportsPage';

// Procurement Officer Pages
import { OfficerLayout } from './pages/officer/OfficerLayout';
import { OfficerDashboard } from './pages/officer/OfficerDashboard';
import { WeightQualityPage } from './pages/officer/WeightQualityPage';

// Vehicle Driver Pages
import { DriverLayout } from './pages/driver/DriverLayout';
import { DriverDashboard } from './pages/driver/DriverDashboard';
import { AssignmentsPage } from './pages/driver/AssignmentsPage';
import { ActivePickupPage } from './pages/driver/ActivePickupPage';
import { NavigationPage } from './pages/driver/NavigationPage';
import { DriverProfilePage } from './pages/driver/DriverProfilePage';

import { ManagerLayout } from './pages/manager/ManagerLayout';
import { ManagerDashboard } from './pages/manager/ManagerDashboard';
import { ManagerAnalyticsPage } from './pages/manager/ManagerAnalyticsPage';
import { ManagerAiInsightsPage } from './pages/manager/ManagerAiInsightsPage';
import { ManagerFarmersPage } from './pages/manager/ManagerFarmersPage';
import { ManagerSocietiesPage } from './pages/manager/ManagerSocietiesPage';
import { ManagerOfficersPage } from './pages/manager/ManagerOfficersPage';
import { ManagerCentresPage } from './pages/manager/ManagerCentresPage';
import { ManagerPendingApprovalsPage } from './pages/manager/ManagerPendingApprovalsPage';
import { ScrollToTop } from './components/common/ScrollToTop';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<RegisterRole />} />
              <Route path="/register/farmer" element={<RegisterFarmer />} />
              <Route path="/register/officer" element={<RegisterOfficer />} />
              <Route path="/track" element={<VehicleTrackingPage />} />
              <Route path="/receipt-details" element={<ReceiptVerificationPage />} />
              <Route path="/verify-receipt" element={<ReceiptVerificationPage />} />

              {/* Farmer Dashboard Routes */}
              <Route path="/farmer" element={<FarmerLayout />}>
                <Route index element={<Navigate to="/farmer/dashboard" replace />} />
                <Route path="dashboard" element={<FarmerDashboard />} />
                <Route path="crops" element={<MyCrops />} />
                <Route path="procurement" element={<ProcurementFlow />} />
                <Route path="slots-tokens" element={<SlotsTokensPage />} />
                <Route path="transport" element={<TransportPage />} />
                <Route path="vehicle-tracking" element={<VehicleTrackingPage />} />
                <Route path="queue" element={<QueueStatusPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="receipts" element={<ReceiptsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="ai-assistant" element={<AiAssistantPage />} />
                <Route path="weather" element={<WeatherPage />} />
                <Route path="profile" element={<FarmerProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Society Officer Routes */}
              <Route path="/society" element={<SocietyLayout />}>
                <Route index element={<Navigate to="/society/dashboard" replace />} />
                <Route path="dashboard" element={<SocietyDashboard />} />
                <Route path="offline-farmers" element={<OfflineFarmersPage />} />
                <Route path="farmers" element={<FarmersListPage />} />
                <Route path="approvals" element={<FarmersListPage />} />
                <Route path="crops" element={<MyCrops />} />
                <Route path="requests" element={<ProcurementFlow />} />
                <Route path="slots-tokens" element={<SlotsTokensPage />} />
                <Route path="vehicle-requests" element={<AssignmentsPage />} />
                <Route path="pickup-tracking" element={<PickupTrackingSocietyPage />} />
                <Route path="farmer-status" element={<QueueStatusPage />} />
                <Route path="reports" element={<SocietyReportsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Procurement Officer Routes */}
              <Route path="/officer" element={<OfficerLayout />}>
                <Route index element={<Navigate to="/officer/dashboard" replace />} />
                <Route path="dashboard" element={<OfficerDashboard />} />
                <Route path="queue" element={<QueueStatusPage />} />
                <Route path="weight-quality" element={<WeightQualityPage />} />
                <Route path="farmers" element={<FarmersListPage />} />
                <Route path="crops" element={<MyCrops />} />
                <Route path="procurement" element={<WeightQualityPage />} />
                <Route path="slots" element={<SlotsTokensPage />} />
                <Route path="vehicles" element={<PickupTrackingSocietyPage />} />
                <Route path="offline" element={<OfflineFarmersPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="reports" element={<SocietyReportsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Vehicle Driver Routes */}
              <Route path="/driver" element={<DriverLayout />}>
                <Route index element={<Navigate to="/driver/dashboard" replace />} />
                <Route path="dashboard" element={<DriverDashboard />} />
                <Route path="assignments" element={<AssignmentsPage />} />
                <Route path="active-pickup" element={<ActivePickupPage />} />
                <Route path="live-gps" element={<ActivePickupPage />} />
                <Route path="navigation" element={<NavigationPage />} />
                <Route path="history" element={<AssignmentsPage />} />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route path="profile" element={<DriverProfilePage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* State Manager Routes */}
              <Route path="/manager" element={<ManagerLayout />}>
                <Route index element={<Navigate to="/manager/dashboard" replace />} />
                <Route path="dashboard" element={<ManagerDashboard />} />
                <Route path="pending-approvals" element={<ManagerPendingApprovalsPage />} />
                <Route path="ai-insights" element={<ManagerAiInsightsPage />} />
                <Route path="analytics" element={<ManagerAnalyticsPage />} />
                <Route path="centres" element={<ManagerCentresPage />} />
                <Route path="vehicles" element={<PickupTrackingSocietyPage />} />
                <Route path="farmers" element={<ManagerFarmersPage />} />
                <Route path="societies" element={<ManagerSocietiesPage />} />
                <Route path="officers" element={<ManagerOfficersPage />} />
                <Route path="procurements" element={<WeightQualityPage />} />
                <Route path="payments" element={<PaymentsPage />} />
                <Route path="offline" element={<OfflineFarmersPage />} />
                <Route path="alerts" element={<NotificationsPage />} />
                <Route path="reports" element={<ManagerAnalyticsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <SmsToastNotification />
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
};
export default App;
