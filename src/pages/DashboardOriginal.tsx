import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import type { DashboardStatsResponse } from "@/services/api";
import {
  Wallet,
  Users,
  FileText,
  TrendingUp,
  Calendar,
  RefreshCw,
} from "lucide-react";

const DashboardOriginal = () => {
  const { accessToken, psp } = useAuth();
  const [stats, setStats] = useState<DashboardStatsResponse["data"] | null>(
    null
  );
  const [period, setPeriod] = useState("30");

  const fetchData = async () => {
    if (!accessToken) return;

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      const response = await apiService.getDashboardStats(
        accessToken,
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      );

      setStats(response.data);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, accessToken]);

  const formatNaira = (amount: number) => {
    return `₦${amount.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const overview = stats?.overview;
  const invoices = stats?.invoiceBreakdown;
  const revenue = stats?.revenueMetrics;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {psp?.companyName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here's what's happening with your waste collection business
          </p>
        </div>

        {/* Period Selector & Refresh */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="14">Last 14 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Wallet Balance */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <Wallet className="h-8 w-8 opacity-80" />
              <span className="text-xs font-medium bg-white/20 px-3 py-1 rounded-full">
                WALLET
              </span>
            </div>
            <p className="text-sm opacity-90 mb-2">Total Balance</p>
            <h2 className="text-3xl font-bold mb-4">
              {formatNaira(overview?.totalRevenue || 0)}
            </h2>
            <div className="flex items-center justify-between pt-4 border-t border-white/20">
              <div>
                <p className="text-xs opacity-80">Collected</p>
                <p className="text-sm font-semibold">
                  {formatNaira(overview?.totalCollected || 0)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-80">Outstanding</p>
                <p className="text-sm font-semibold">
                  {formatNaira(overview?.totalOutstanding || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Customers Card */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-50 rounded-xl">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <TrendingUp className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Customers</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-3">
              {overview?.totalCustomers || 0}
            </h2>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-green-600 font-semibold">
                {overview?.activeCustomers || 0} Active
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">
                {overview?.inactiveCustomers || 0} Inactive
              </span>
            </div>
          </div>

          {/* Collection Rate */}
          <div className="bg-white rounded-2xl p-6 border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-50 rounded-xl">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                {overview?.collectionRate?.toFixed(0) || 0}%
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">Collection Rate</p>
            <h2 className="text-4xl font-bold text-gray-900 mb-3">
              {overview?.collectionRate?.toFixed(1) || 0}%
            </h2>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-orange-500 to-orange-600 h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(overview?.collectionRate || 0, 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Invoice Breakdown */}
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-bold text-gray-900">
                Invoice Overview
              </h3>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Paid */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Paid
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {invoices?.paid || 0}
                </p>
                <p className="text-sm text-gray-600">
                  {formatNaira(invoices?.paidAmount || 0)}
                </p>
              </div>

              {/* Pending */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Pending
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {invoices?.pending || 0}
                </p>
                <p className="text-sm text-gray-600">
                  {formatNaira(invoices?.pendingAmount || 0)}
                </p>
              </div>

              {/* Overdue */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Overdue
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {invoices?.overdue || 0}
                </p>
                <p className="text-sm text-gray-600">
                  {formatNaira(invoices?.overdueAmount || 0)}
                </p>
              </div>

              {/* Partially Paid */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    Partial
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {invoices?.partiallyPaid || 0}
                </p>
                <p className="text-sm text-gray-600">
                  {formatNaira(invoices?.partiallyPaidAmount || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <p className="text-sm font-medium text-gray-600 mb-2">
              Expected Revenue
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {formatNaira(revenue?.expectedRevenue || 0)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <p className="text-sm font-medium text-gray-600 mb-2">
              Avg Revenue/Customer
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {formatNaira(revenue?.averageRevenuePerCustomer || 0)}
            </p>
          </div>

          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <p className="text-sm font-medium text-gray-600 mb-2">
              Collection Efficiency
            </p>
            <p className="text-2xl font-bold text-gray-900">
              {revenue?.collectionEfficiency?.toFixed(1) || 0}%
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardOriginal;
