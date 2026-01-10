import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeProvider';
import { SettingsProvider } from './contexts/SettingsContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { WorkOrders } from './pages/WorkOrders';
import { Customers } from './pages/Customers';
import { Vehicles } from './pages/Vehicles';
import { Inventory } from './pages/Inventory';
import { Billing } from './pages/Billing';
import { Reports } from './pages/Reports';
import { Technicians } from './pages/Technicians';
import { Messages } from './pages/Messages';
import { ServiceReminders } from './pages/ServiceReminders';
import { Bookings } from './pages/Bookings';
import { Settings } from './pages/Settings';

function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <BrowserRouter>
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
            </Routes>
          </Layout>
        </BrowserRouter>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;
