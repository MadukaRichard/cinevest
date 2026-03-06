/**
 * ===========================================
 * Admin Page
 * ===========================================
 * 
 * Admin dashboard for platform management.
 * Only accessible by users with admin role.
 * Requires password re-confirmation (AdminAuthGate)
 * before rendering admin UI.
 */

import { Routes, Route } from 'react-router-dom';
import SEO from '../components/ui/SEO';
import AdminAuthGate from '../components/admin/AdminAuthGate';
import AdminLayout from '../components/admin/AdminLayout';
import AdminDashboard from '../components/admin/AdminDashboard';
import UserManagement from '../components/admin/UserManagement';
import FilmManagement from '../components/admin/FilmManagement';
import FeaturedManagement from '../components/admin/FeaturedManagement';
import InvestmentManagement from '../components/admin/InvestmentManagement';
import WalletManagement from '../components/admin/WalletManagement';
import ChatManagement from '../components/admin/ChatManagement';

function Admin() {
  return (
    <AdminAuthGate>
      <SEO title="Admin" noIndex />
      <AdminLayout>
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="films" element={<FilmManagement />} />
          <Route path="featured" element={<FeaturedManagement />} />
          <Route path="investments" element={<InvestmentManagement />} />
          <Route path="wallets" element={<WalletManagement />} />
          <Route path="chat" element={<ChatManagement />} />
        </Routes>
      </AdminLayout>
    </AdminAuthGate>
  );
}

export default Admin;
