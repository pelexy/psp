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
import CustomerLedger from "@/pages/CustomerLedger";
import Transactions from "@/pages/Transactions";
import Payments from "@/pages/Payments";
import Agents from "@/pages/Agents";
import AgentDetails from "@/pages/AgentDetails";
import Pickups from "@/pages/Pickups";
import Expenses from "@/pages/Expenses";
import SettingsPage from "@/pages/SettingsPage";
import Bills from "@/pages/Bills";
import GeneratedBills from "@/pages/GeneratedBills";
import BillRuns from "@/pages/BillRuns";
import CustomerStatement from "@/pages/CustomerStatement";
import AnalyticsPage from "@/pages/analytics/AnalyticsPage";
import AnalyticsDetailPage from "@/pages/analytics/AnalyticsDetailPage";

// Report pages
import DebtAgingReport from "@/pages/reports/DebtAgingReport";
import OutstandingReport from "@/pages/reports/OutstandingReport";
import CollectionRateReport from "@/pages/reports/CollectionRateReport";
import ProblemAreasReport from "@/pages/reports/ProblemAreasReport";
import MapAnalysisReport from "@/pages/reports/MapAnalysisReport";

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
          <Route path="/customers/:accountNumber/ledger" element={<ProtectedRoute><CustomerLedger /></ProtectedRoute>} />

          {/* Billing Section */}
          <Route path="/billing" element={<Navigate to="/billing/bills" replace />} />
          <Route path="/billing/bills" element={<ProtectedRoute><Bills /></ProtectedRoute>} />
          <Route path="/billing/generated-bills" element={<ProtectedRoute><GeneratedBills /></ProtectedRoute>} />
          <Route path="/billing/runs" element={<ProtectedRoute><BillRuns /></ProtectedRoute>} />
          {/* Collections/Plans retired — billing moved to the per-customer Bill engine. */}
          <Route path="/billing/plans" element={<Navigate to="/billing/bills" replace />} />
          <Route path="/billing/plans/:id" element={<Navigate to="/billing/bills" replace />} />
          {/* Invoices retired — billing moved to the per-customer Bill engine. */}
          <Route path="/billing/invoices" element={<Navigate to="/billing/bills" replace />} />
          <Route path="/billing/invoices/create" element={<Navigate to="/billing/bills" replace />} />
          <Route path="/billing/invoices/:invoiceNumber" element={<Navigate to="/billing/bills" replace />} />
          <Route path="/billing/customer-statement/:customerId" element={<ProtectedRoute><CustomerStatement /></ProtectedRoute>} />
          {/* Payments register — every payment received by this PSP. */}
          <Route path="/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
          {/* Transactions module — payments live here now (moved out of Billing). */}
          <Route path="/transactions/payments" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
          <Route path="/billing/payments" element={<Navigate to="/transactions/payments" replace />} />
          <Route path="/billing/transactions" element={<Navigate to="/transactions/payments" replace />} />

          {/* Legacy routes - redirect to new paths */}
          <Route path="/collections" element={<Navigate to="/billing/bills" replace />} />
          <Route path="/collections/:id" element={<Navigate to="/billing/bills" replace />} />
          <Route path="/invoices" element={<Navigate to="/billing/bills" replace />} />
          <Route path="/invoices/create" element={<Navigate to="/billing/bills" replace />} />
          <Route path="/transactions" element={<Navigate to="/transactions/payments" replace />} />

          {/* Agents Section */}
          <Route path="/agents" element={<ProtectedRoute><Agents /></ProtectedRoute>} />
          <Route path="/agents/:id" element={<ProtectedRoute><AgentDetails /></ProtectedRoute>} />
          <Route path="/agents/pickups" element={<ProtectedRoute><Pickups /></ProtectedRoute>} />

          {/* Legacy pickups route */}
          <Route path="/pickups" element={<Navigate to="/agents/pickups" replace />} />

          {/* Expenses */}
          <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />

          {/* Reports Section */}
          <Route path="/reports" element={<Navigate to="/reports/debt-aging" replace />} />
          <Route path="/reports/debt-aging" element={<ProtectedRoute><DebtAgingReport /></ProtectedRoute>} />
          <Route path="/reports/outstanding" element={<ProtectedRoute><OutstandingReport /></ProtectedRoute>} />
          <Route path="/reports/collection-rate" element={<ProtectedRoute><CollectionRateReport /></ProtectedRoute>} />
          <Route path="/reports/problem-areas" element={<ProtectedRoute><ProblemAreasReport /></ProtectedRoute>} />
          <Route path="/reports/map-analysis" element={<ProtectedRoute><MapAnalysisReport /></ProtectedRoute>} />

          {/* Bill Analytics */}
          <Route path="/analytics" element={<ProtectedRoute><AnalyticsPage /></ProtectedRoute>} />
          <Route path="/analytics/:dimension" element={<ProtectedRoute><AnalyticsDetailPage /></ProtectedRoute>} />

          {/* Settings */}
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
