import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayoutAmber";
import { MetricCard } from "@/components/MetricCard";
import { RevenueChart } from "@/components/RevenueChart";
import { FinancialOverview } from "@/components/FinancialOverview";
import { TopCustomers } from "@/components/TopCustomers";
import { RecentTransactions } from "@/components/RecentTransactions";
import { StaffPerformance } from "@/components/StaffPerformance";
import { CollectionServices } from "@/components/CollectionServices";
import { TimeFilter } from "@/components/TimeFilter";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import type { DateRangeType } from "@/utils/dateRanges";
import { getDateRangeParams } from "@/utils/dateRanges";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  DollarSign,
  FileText,
  Users,
  TrendingUp,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRangeType>("this-month");
  const { psp, dashboardData, accessToken } = useAuth();

  // Dashboard data states
  const [comprehensiveData, setComprehensiveData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [revenuePerformance, setRevenuePerformance] = useState<any>(null);
  const [topAgents, setTopAgents] = useState<any>(null);
  const [collectionServices, setCollectionServices] = useState<any>(null);
  const [topCustomers, setTopCustomers] = useState<any>(null);
  const [recentTransactions, setRecentTransactions] = useState<any>(null);

  // Get the current date range parameters for API calls
  const dateParams = getDateRangeParams(dateRange);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!accessToken) return;

      setLoading(true);
      try {
        // Fetch all dashboard data in parallel
        const [
          comprehensive,
          performance,
          revenue,
          agents,
          services,
          customers,
          transactions,
        ] = await Promise.all([
          apiService.getComprehensiveDashboard(accessToken, dateParams.startDate, dateParams.endDate),
          apiService.getPerformanceMetrics(accessToken),
          apiService.getRevenuePerformance(accessToken, new Date().getFullYear()),
          apiService.getTopPerformingAgents(accessToken, 5),
          apiService.getCollectionServicesDashboard(accessToken, 3),
          apiService.getTopCustomersDashboard(accessToken, 5),
          apiService.getRecentTransactionsPSP(accessToken, 5),
        ]);

        setComprehensiveData(comprehensive.data);
        setPerformanceData(performance.data);
        setRevenuePerformance(revenue.data);
        setTopAgents(agents.data);
        setCollectionServices(services.data);
        setTopCustomers(customers.data);
        setRecentTransactions(transactions.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [dateRange, accessToken]); // Re-fetch when date range or token changes

  const handleDateRangeChange = (newRange: DateRangeType) => {
    setDateRange(newRange);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full max-w-full overflow-x-hidden p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 lg:space-y-8 bg-gradient-to-br from-background via-background to-accent/5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-full sm:w-auto">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
              {dashboardData.pspInfo?.companyName || psp?.companyName || "Dashboard Overview"}
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Welcome back! Here's your waste management PSP performance
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <TimeFilter
              selectedRange={dateRange}
              onRangeChange={handleDateRangeChange}
            />
          </div>
        </div>

        {/* Financial Overview - Wallet & Invoice Combined */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
          <FinancialOverview comprehensiveData={comprehensiveData} />
        </div>

        {/* Hero Metrics Grid */}
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
          <MetricCard
            title="Total Revenue Collected"
            subtitle="Current period"
            value={comprehensiveData ? formatCurrency(comprehensiveData.totalRevenue.currentPeriod.amount) : "₦0"}
            change={comprehensiveData ? `${comprehensiveData.totalRevenue.changePercentage > 0 ? '+' : ''}${comprehensiveData.totalRevenue.changePercentage.toFixed(1)}%` : "0%"}
            changeType={comprehensiveData?.totalRevenue.changePercentage > 0 ? "positive" : "negative"}
            icon={DollarSign}
            iconColor="success"
          />
          <MetricCard
            title="Outstanding Balance"
            subtitle="What customers owe"
            value={comprehensiveData ? formatCurrency(comprehensiveData.outstandingBalance.totalAmount) : "₦0"}
            change={comprehensiveData ? `${comprehensiveData.outstandingBalance.overdueInvoiceCount} invoices overdue` : "0 invoices"}
            changeType="negative"
            icon={Clock}
            iconColor="warning"
          />
          <MetricCard
            title="Active Customers"
            subtitle={comprehensiveData ? `${comprehensiveData.activeCustomers.active} active / ${comprehensiveData.activeCustomers.inactive} inactive` : "Loading..."}
            value={comprehensiveData ? comprehensiveData.activeCustomers.active.toString() : "0"}
            change={comprehensiveData ? `+${comprehensiveData.activeCustomers.newInPeriod} new this period` : "0"}
            changeType="positive"
            icon={Users}
            iconColor="primary"
          />
          <MetricCard
            title="Collection Efficiency"
            subtitle="Collected vs Invoiced"
            value={comprehensiveData ? `${comprehensiveData.collectionEfficiency.currentPeriod.percentage.toFixed(1)}%` : "0%"}
            change={comprehensiveData ? `${comprehensiveData.collectionEfficiency.improvementPercentage > 0 ? '+' : ''}${comprehensiveData.collectionEfficiency.improvementPercentage.toFixed(1)}% improvement` : "0%"}
            changeType={comprehensiveData?.collectionEfficiency.improvementPercentage > 0 ? "positive" : "negative"}
            icon={TrendingUp}
            iconColor="success"
            gradient
          />
        </div>

        {/* Revenue Chart - Full Width */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          <RevenueChart revenueData={revenuePerformance} />
        </div>

        {/* Operations Metrics */}
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[400ms]">
          <MetricCard
            title="Waste Collections"
            subtitle="This month"
            value={performanceData ? performanceData.wasteCollections.thisMonth.total.toLocaleString() : "0"}
            change={performanceData ? `Avg ${performanceData.wasteCollections.thisMonth.averagePerDay.toFixed(1)} per day` : "Loading..."}
            changeType="neutral"
            icon={Trash2}
            iconColor="primary"
          />
          <MetricCard
            title="Pickup Success Rate"
            subtitle="Confirmed pickups"
            value={performanceData ? `${performanceData.pickupSuccessRate.percentage.toFixed(1)}%` : "0%"}
            change={performanceData ? `${performanceData.pickupSuccessRate.changePercentage > 0 ? '+' : ''}${performanceData.pickupSuccessRate.changePercentage.toFixed(1)}%` : "0%"}
            changeType={performanceData?.pickupSuccessRate.changePercentage > 0 ? "positive" : "negative"}
            icon={CheckCircle2}
            iconColor="success"
          />
          <MetricCard
            title="Total Invoices"
            subtitle="Generated this period"
            value={performanceData ? performanceData.totalInvoices.thisMonth.toString() : "0"}
            change={performanceData ? `${formatCurrency(performanceData.totalInvoices.thisMonthValue)} total value` : "₦0"}
            changeType="neutral"
            icon={FileText}
            iconColor="primary"
          />
          <MetricCard
            title="Pending Invoices"
            subtitle="Awaiting payment"
            value={performanceData ? performanceData.pendingInvoices.count.toString() : "0"}
            change={performanceData ? `${formatCurrency(performanceData.pendingInvoices.totalValue)} value` : "₦0"}
            changeType="neutral"
            icon={AlertCircle}
            iconColor="warning"
          />
        </div>

        {/* Staff Performance & Collection Services */}
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[500ms]">
          <StaffPerformance agentsData={topAgents} />
          <CollectionServices servicesData={collectionServices} />
        </div>

        {/* Customers & Transactions */}
        <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-[600ms]">
          <TopCustomers customersData={topCustomers} />
          <RecentTransactions transactionsData={recentTransactions} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
