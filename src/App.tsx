import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/routes/ProtectedRoute";
import { PublicRoute } from "@/components/routes/PublicRoute";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import ForgotPassword from "@/pages/ForgotPassword";
import ChangePassword from "@/pages/ChangePassword";
import FirstTimePasswordReset from "@/pages/FirstTimePasswordReset";
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import CustomerDetails from "@/pages/CustomerDetails";
import Invoices from "@/pages/Invoices";
import Transactions from "@/pages/Transactions";
import Collections from "@/pages/Collections";
import CollectionDetails from "@/pages/CollectionDetails";
import Agents from "@/pages/Agents";
import Pickups from "@/pages/Pickups";
import Reports from "@/pages/Reports";
import SettingsPage from "@/pages/SettingsPage";
import CreateInvoice from "@/pages/CreateInvoice";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes - redirect to dashboard if authenticated */}
          <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/signup" element={<PublicRoute><SignUp /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/first-time-reset-password" element={<FirstTimePasswordReset />} />

          {/* Change password route - requires authentication */}
          <Route path="/change-password" element={<ChangePassword />} />

          {/* Protected routes - require authentication */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/customers" element={<ProtectedRoute><Customers /></ProtectedRoute>} />
          <Route path="/customers/:accountNumber" element={<ProtectedRoute><CustomerDetails /></ProtectedRoute>} />
          <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
          <Route path="/invoices/create" element={<ProtectedRoute><CreateInvoice /></ProtectedRoute>} />
          <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/collections" element={<ProtectedRoute><Collections /></ProtectedRoute>} />
          <Route path="/collections/:id" element={<ProtectedRoute><CollectionDetails /></ProtectedRoute>} />
          <Route path="/agents" element={<ProtectedRoute><Agents /></ProtectedRoute>} />
          <Route path="/pickups" element={<ProtectedRoute><Pickups /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </Router>
    </AuthProvider>
  );
}

export default App;
