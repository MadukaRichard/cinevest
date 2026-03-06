/**
 * ===========================================
 * Dashboard Page
 * ===========================================
 * 
 * VIP dashboard for authenticated users.
 * Displays investment portfolio, ROI tracking,
 * and quick access to platform features.
 */

import { Routes, Route } from 'react-router-dom';
import SEO from '../components/ui/SEO';
import DashboardLayout from '../components/dashboard/DashboardLayout';
import DashboardHome from '../components/dashboard/DashboardHome';
import Investments from '../components/dashboard/Investments';
import Portfolio from '../components/dashboard/Portfolio';
import Settings from '../components/dashboard/Settings';

function Dashboard() {
  return (
    <DashboardLayout>
      <SEO title="Dashboard" description="Manage your film investments, track portfolio performance, and view ROI statistics." noIndex />
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="investments" element={<Investments />} />
        <Route path="portfolio" element={<Portfolio />} />
        <Route path="settings" element={<Settings />} />
      </Routes>
    </DashboardLayout>
  );
}

export default Dashboard;
