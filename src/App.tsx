import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { Loader2 } from 'lucide-react';
import { Toaster } from 'sonner';
import { ThemeProvider } from './components/ThemeProvider';
import { SettingsProvider } from './contexts/SettingsContext';
import { Layout } from './components/Layout';

const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const WorkOrders = lazy(() => import('./pages/WorkOrders').then(module => ({ default: module.WorkOrders })));
const Customers = lazy(() => import('./pages/Customers').then(module => ({ default: module.Customers })));
const Vehicles = lazy(() => import('./pages/Vehicles').then(module => ({ default: module.Vehicles })));
const Inventory = lazy(() => import('./pages/Inventory').then(module => ({ default: module.Inventory })));
const Billing = lazy(() => import('./pages/Billing').then(module => ({ default: module.Billing })));
const Reports = lazy(() => import('./pages/Reports').then(module => ({ default: module.Reports })));
const Technicians = lazy(() => import('./pages/Technicians').then(module => ({ default: module.Technicians })));
const Messages = lazy(() => import('./pages/Messages').then(module => ({ default: module.Messages })));
const ServiceReminders = lazy(() => import('./pages/ServiceReminders').then(module => ({ default: module.ServiceReminders })));
const Bookings = lazy(() => import('./pages/Bookings').then(module => ({ default: module.Bookings })));
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })));
const Estimates = lazy(() => import('./pages/Estimates').then(module => ({ default: module.Estimates })));
const ApproveEstimate = lazy(() => import('./pages/ApproveEstimate').then(module => ({ default: module.ApproveEstimate })));
const Help = lazy(() => import('./pages/Help').then(module => ({ default: module.Help })));

// Portal Components
const PortalLayout = lazy(() => import('./layouts/PortalLayout').then(module => ({ default: module.PortalLayout })));
const PortalHome = lazy(() => import('./pages/portal/PortalHome').then(module => ({ default: module.PortalHome })));
const PortalVehicles = lazy(() => import('./pages/portal/PortalVehicles').then(module => ({ default: module.PortalVehicles })));
const PortalHistory = lazy(() => import('./pages/portal/PortalHistory').then(module => ({ default: module.PortalHistory })));
const PortalBooking = lazy(() => import('./pages/portal/PortalBooking').then(module => ({ default: module.PortalBooking })));

const PublicInspection = lazy(() => import('./pages/PublicInspection').then(module => ({ default: module.PublicInspection })));

import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/react-query';

// ... (imports remain)

function App() {
  return (
    <ThemeProvider>
      <Toaster position="top-right" richColors closeButton />
      <SettingsProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <Suspense
              fallback={
                <div className="h-screen w-screen flex items-center justify-center bg-background">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              }
            >
              <Routes>
                <Route path="/estimate-approval/:token" element={<ApproveEstimate />} />
                <Route path="/inspection/:token" element={<PublicInspection />} />

                {/* Customer Portal Routes */}
                <Route path="/portal/:token" element={<PortalLayout />}>
                  <Route index element={<PortalHome />} />
                  <Route path="vehicles" element={<PortalVehicles />} />
                  <Route path="history" element={<PortalHistory />} />
                  <Route path="booking" element={<PortalBooking />} />
                </Route>

                <Route
                  path="/*"
                  element={
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/work-orders" element={<WorkOrders />} />
                        <Route path="/customers" element={<Customers />} />
                        <Route path="/vehicles" element={<Vehicles />} />
                        <Route path="/inventory" element={<Inventory />} />

                        <Route path="/billing" element={<Billing />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/technicians" element={<Technicians />} />
                        <Route path="/messages" element={<Messages />} />
                        <Route path="/reminders" element={<ServiceReminders />} />
                        <Route path="/bookings" element={<Bookings />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/estimates" element={<Estimates />} />
                        <Route path="/help" element={<Help />} />
                      </Routes>
                    </Layout>
                  }
                />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </QueryClientProvider>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
