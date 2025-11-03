import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpFromLine, Eye, EyeOff, Lock, Unlock } from "lucide-react";
import { WithdrawDialog } from "./WithdrawDialog";
import { WalletLockDialog } from "./WalletLockDialog";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatCurrency, formatCurrencyFull } from "@/utils/formatCurrency";

interface FinancialOverviewProps {
  comprehensiveData?: any;
}

export function FinancialOverview({ comprehensiveData }: FinancialOverviewProps) {
  const invoiceData = comprehensiveData ? [
    { name: "Paid", value: comprehensiveData.invoiceSummary.paid.amount, count: comprehensiveData.invoiceSummary.paid.count, color: "#10b981" },
    { name: "Pending", value: comprehensiveData.invoiceSummary.pending.amount, count: comprehensiveData.invoiceSummary.pending.count, color: "#f59e0b" },
    { name: "Overdue", value: comprehensiveData.invoiceSummary.overdue.amount, count: comprehensiveData.invoiceSummary.overdue.count, color: "#ef4444" },
  ] : [
    { name: "Paid", value: 0, count: 0, color: "#10b981" },
    { name: "Pending", value: 0, count: 0, color: "#f59e0b" },
    { name: "Overdue", value: 0, count: 0, color: "#ef4444" },
  ];

  const totalInvoiceAmount = invoiceData.reduce((sum, item) => sum + item.value, 0);
  const { accessToken } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [walletData, setWalletData] = useState({
    balance: 0,
    monthlyWithdrawals: 0,
    monthlyInflows: 0,
    isWalletLocked: false,
  });
  const [collectionStats, setCollectionStats] = useState({
    collectionRate: {
      percentage: 0,
      totalCollected: 0,
      totalDue: 0,
      formattedCollected: "₦0",
      formattedDue: "₦0"
    },
    onTimePayments: {
      percentage: 0,
      onTimeCount: 0,
      totalCount: 0,
      lateCount: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletBalance();
    fetchCollectionStats();
  }, [accessToken]);

  const fetchWalletBalance = async () => {
    if (!accessToken) return;

    try {
      const response = await apiService.getWalletBalance(accessToken);
      setWalletData(response.data);
    } catch (error: any) {
      console.error("Error fetching wallet balance:", error);
      toast.error(error.message || "Failed to load wallet balance");
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionStats = async () => {
    if (!accessToken) return;

    try {
      const response = await apiService.getCollectionStats(accessToken);
      setCollectionStats(response.data);
    } catch (error: any) {
      console.error("Error fetching collection stats:", error);
      // Don't show toast error for stats - it's not critical
    }
  };

  const handleToggleLock = async () => {
    if (walletData.isWalletLocked) {
      // Open unlock dialog
      setLockDialogOpen(true);
    } else {
      // Lock wallet directly
      try {
        await apiService.lockWallet(accessToken!);
        toast.success("Wallet locked successfully");
        fetchWalletBalance(); // Refresh data
      } catch (error: any) {
        console.error("Error locking wallet:", error);
        toast.error(error.message || "Failed to lock wallet");
      }
    }
  };

  return (
    <>
      <Card className="bg-white border border-gray-200 shadow-sm animate-fade-in min-h-[400px]">
        <div className="p-4 md:p-6 h-full flex flex-col">
          {/* Header */}
          <div className="mb-4 md:mb-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Financial Overview</h2>
            <p className="text-xs md:text-sm text-gray-500 mt-1">Wallet balance and invoice summary</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 flex-1">
            {/* Left Side - Wallet Balance */}
            <div className="space-y-6">
              {/* Balance Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs md:text-sm font-medium text-gray-600">
                    Available Balance
                  </p>
                  {walletData.isWalletLocked && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                      <Lock className="h-3 w-3" />
                      Locked
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 md:gap-3">
                  {showBalance ? (
                    <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
                      {formatCurrencyFull(walletData.balance)}
                    </p>
                  ) : (
                    <p className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">••••••</p>
                  )}
                  <button
                    onClick={() => setShowBalance(!showBalance)}
                    className="p-1.5 md:p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {showBalance ? (
                      <Eye className="h-4 w-4 md:h-5 md:w-5 text-gray-500" />
                    ) : (
                      <EyeOff className="h-4 w-4 md:h-5 md:w-5 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="default"
                  className="bg-primary text-white hover:bg-primary/90 shadow-sm h-11"
                  onClick={() => setWithdrawOpen(true)}
                  disabled={walletData.isWalletLocked}
                >
                  <ArrowUpFromLine className="h-4 w-4 mr-2" />
                  Withdraw
                </Button>
                <Button
                  variant={walletData.isWalletLocked ? "default" : "outline"}
                  className={`h-11 ${walletData.isWalletLocked ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                  onClick={handleToggleLock}
                >
                  {walletData.isWalletLocked ? (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Unlock
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Lock
                    </>
                  )}
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 rounded-lg bg-green-50 border border-green-100">
                    <p className="text-xs text-gray-600 font-medium mb-1">Monthly Inflows</p>
                    <p className="text-base font-bold text-green-700">
                      {formatCurrency(walletData.monthlyInflows)}
                    </p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-100">
                    <p className="text-xs text-gray-600 font-medium mb-1">Monthly Withdrawals</p>
                    <p className="text-base font-bold text-blue-700">
                      {formatCurrency(walletData.monthlyWithdrawals)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Performance Indicators */}
              <div className="pt-4 space-y-3">
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-lg p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <svg className="w-14 h-14 transform -rotate-90">
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          stroke="#e5e7eb"
                          strokeWidth="3.5"
                          fill="none"
                        />
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          stroke="#10b981"
                          strokeWidth="3.5"
                          fill="none"
                          strokeDasharray={`${collectionStats.collectionRate.percentage * 1.51} ${100 * 1.51}`}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-900">
                          {Math.round(collectionStats.collectionRate.percentage)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 mb-0.5">Collection Rate</p>
                      <p className="text-xs text-gray-500">
                        {collectionStats.collectionRate.formattedCollected} of {collectionStats.collectionRate.formattedDue}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-lg p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <svg className="w-14 h-14 transform -rotate-90">
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          stroke="#e5e7eb"
                          strokeWidth="3.5"
                          fill="none"
                        />
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          stroke="#3b82f6"
                          strokeWidth="3.5"
                          fill="none"
                          strokeDasharray={`${collectionStats.onTimePayments.percentage * 1.51} ${100 * 1.51}`}
                          strokeLinecap="round"
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-gray-900">
                          {Math.round(collectionStats.onTimePayments.percentage)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-700 mb-0.5">On-Time Payments</p>
                      <p className="text-xs text-gray-500">
                        {collectionStats.onTimePayments.onTimeCount} of {collectionStats.onTimePayments.totalCount} invoices
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Side - Invoice Summary */}
            <div className="space-y-5">
              {/* Invoice Chart */}
              <div>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Invoice Summary</h3>
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={invoiceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={70}
                        innerRadius={45}
                        fill="#8884d8"
                        dataKey="value"
                        animationBegin={0}
                        animationDuration={800}
                        strokeWidth={2}
                        stroke="#ffffff"
                      >
                        {invoiceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "6px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                          fontSize: "12px",
                          padding: "8px 12px",
                        }}
                        formatter={(value: number, name: string, props: any) => [
                          `₦${value.toLocaleString()} (${props.payload.count})`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Invoice Stats */}
              <div className="grid grid-cols-2 gap-2.5">
                {invoiceData.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center gap-2.5 p-3 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-600 font-medium">{item.name}</p>
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {formatCurrency(item.value)}
                      </p>
                      <p className="text-xs text-gray-500">{item.count} invoices</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total */}
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100">
                  <span className="text-sm font-semibold text-gray-700">Total Invoice Amount</span>
                  <span className="text-xl font-bold text-gray-900">
                    {formatCurrency(totalInvoiceAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        availableBalance={walletData.balance}
      />

      <WalletLockDialog
        open={lockDialogOpen}
        onOpenChange={setLockDialogOpen}
        onUnlockSuccess={fetchWalletBalance}
      />
    </>
  );
}
