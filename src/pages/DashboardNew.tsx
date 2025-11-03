import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import type { DashboardStatsResponse } from "@/services/api";
import {
  Users,
  Wallet,
  FileText,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

const DashboardNew = () => {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<DashboardStatsResponse["data"] | null>(null);
  const [dateFilter, setDateFilter] = useState("30d");

  const fetchData = async () => {
    if (!accessToken) return;

    try {
      const endDate = new Date();
      const startDate = new Date();

      if (dateFilter === "7d") startDate.setDate(startDate.getDate() - 7);
      else if (dateFilter === "14d") startDate.setDate(startDate.getDate() - 14);
      else startDate.setDate(startDate.getDate() - 30);

      const response = await apiService.getDashboardStats(
        accessToken,
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      );

      setStats(response.data);
    } catch (error: any) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateFilter, accessToken]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = () => {
    const end = new Date();
    const start = new Date();

    if (dateFilter === "7d") start.setDate(start.getDate() - 7);
    else if (dateFilter === "14d") start.setDate(start.getDate() - 14);
    else start.setDate(start.getDate() - 30);

    return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} to ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  };

  const overview = stats?.overview;
  const invoices = stats?.invoiceBreakdown;
  const transactions = stats?.transactionStats;
  const revenue = stats?.revenueMetrics;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Platform overview from {formatDate()}
            </p>
          </div>

          {/* Date Filter */}
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg p-1">
            {["7d", "14d", "30d", "custom"].map((filter) => (
              <button
                key={filter}
                onClick={() => setDateFilter(filter)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  dateFilter === filter
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Last {filter === "7d" ? "7" : filter === "14d" ? "14" : filter === "30d" ? "30" : ""} days
                {filter === "custom" && "Custom"}
              </button>
            ))}
            <button
              onClick={fetchData}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              <TrendingUp className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Customers */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-500">
                  {overview?.collectionRate?.toFixed(1) || 0}%
                </span>
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">
              Total Customers
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {overview?.totalCustomers || 0}
            </p>
            <p className="text-sm text-emerald-600 mt-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {overview?.activeCustomers || 0} active
            </p>
          </div>

          {/* Total Revenue */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-emerald-50 rounded-lg">
                <Wallet className="h-6 w-6 text-emerald-600" />
              </div>
              <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-medium rounded">
                Active
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">
              Total Revenue
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(overview?.totalRevenue || 0)}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Collected: {formatCurrency(overview?.totalCollected || 0)}
            </p>
          </div>

          {/* Total Invoices */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-50 rounded-lg">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">
                {invoices?.overdue || 0} overdue
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">
              Total Invoices
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {overview?.totalInvoices || 0}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Paid: {invoices?.paid || 0} • Pending: {invoices?.pending || 0}
            </p>
          </div>

          {/* Collection Rate */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-orange-50 rounded-lg">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                Target 85%
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">
              Collection Rate
            </h3>
            <p className="text-3xl font-bold text-gray-900">
              {overview?.collectionRate?.toFixed(1) || 0}%
            </p>
            <div className="mt-2 w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-orange-600 h-2 rounded-full transition-all"
                style={{ width: `${Math.min(overview?.collectionRate || 0, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Transaction Summary */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Transaction Summary
              </h2>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {/* Paid Invoices */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 font-medium">
                    PAID INVOICES
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {invoices?.paid || 0}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(invoices?.paidAmount || 0)}
                </p>
              </div>

              {/* Pending Invoices */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 font-medium">
                    PENDING
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {invoices?.pending || 0}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(invoices?.pendingAmount || 0)}
                </p>
              </div>

              {/* Overdue */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 font-medium">
                    OVERDUE
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {invoices?.overdue || 0}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(invoices?.overdueAmount || 0)}
                </p>
              </div>

              {/* Transactions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 font-medium">
                    TRANSACTIONS
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {transactions?.totalTransactions || 0}
                  </span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(transactions?.totalTransactionValue || 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Outstanding Amount */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">
                  Outstanding Amount
                </h3>
                <p className="text-xs text-gray-500">Needs attention</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(overview?.totalOutstanding || 0)}
            </p>
          </div>

          {/* Collection Efficiency */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">
                  Collection Efficiency
                </h3>
                <p className="text-xs text-gray-500">Performance metric</p>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {revenue?.collectionEfficiency?.toFixed(1) || 0}%
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DashboardNew;
