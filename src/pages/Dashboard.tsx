import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { MetricCard } from "@/components/MetricCard";
import { RevenueChart } from "@/components/RevenueChart";
import { FinancialOverview } from "@/components/FinancialOverview";
import { TopCustomers } from "@/components/TopCustomers";
import { RecentTransactions } from "@/components/RecentTransactions";
import { StaffPerformance } from "@/components/StaffPerformance";
import { CollectionServices } from "@/components/CollectionServices";
import { TimeFilter } from "@/components/TimeFilter";
import { BillingStatus } from "@/components/BillingStatus";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import type { DateRangeType } from "@/utils/dateRanges";
import { getDateRangeParams } from "@/utils/dateRanges";
import { formatCurrency } from "@/utils/formatCurrency";
import {
  Users,
  Trash2,
  CheckCircle2,
  HandCoins,
} from "@/lib/icons";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRangeType>("this-month");
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
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
          apiService.getPerformanceMetrics(accessToken, selectedYear),
          apiService.getRevenuePerformance(accessToken, selectedYear),
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
  }, [dateRange, selectedYear, accessToken]); // Re-fetch when date range, year, or token changes

  const handleDateRangeChange = (newRange: DateRangeType) => {
    setDateRange(newRange);
  };

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
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
      <div className="w-full max-w-full overflow-x-hidden p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
          <div className="w-full sm:w-auto">
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground truncate">
              {dashboardData.pspInfo?.companyName || psp?.companyName || "Dashboard Overview"}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Welcome back — here's your collection performance at a glance
            </p>
          </div>
          <div className="w-full sm:w-auto">
            <TimeFilter
              selectedRange={dateRange}
              onRangeChange={handleDateRangeChange}
              selectedYear={selectedYear}
              onYearChange={handleYearChange}
              showYearFilter={true}
            />
          </div>
        </div>

        {/* Operations Metrics */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Waste Collections"
            subtitle={`Year ${selectedYear}`}
            value={performanceData ? performanceData.wasteCollections.thisMonth.total.toLocaleString() : "0"}
            change={performanceData ? `Avg ${performanceData.wasteCollections.thisMonth.averagePerDay.toFixed(1)} per day` : "Loading..."}
            changeType="neutral"
            icon={Trash2}
            iconColor="primary"
          />
          <MetricCard
            title="Pickup Success Rate"
            subtitle={`Year ${selectedYear}`}
            value={performanceData ? `${performanceData.pickupSuccessRate.percentage.toFixed(1)}%` : "0%"}
            change={performanceData ? `${performanceData.pickupSuccessRate.confirmedPickups} of ${performanceData.pickupSuccessRate.totalPickups} confirmed` : "0 pickups"}
            changeType={performanceData?.pickupSuccessRate.percentage >= 50 ? "positive" : "negative"}
            icon={CheckCircle2}
            iconColor="success"
          />
          <MetricCard
            title="Customers"
            subtitle={`Year ${selectedYear}`}
            value={comprehensiveData ? (comprehensiveData.activeCustomers?.total ?? 0).toLocaleString() : "0"}
            change={comprehensiveData ? `${comprehensiveData.activeCustomers?.active ?? 0} active` : "0 active"}
            changeType="neutral"
            icon={Users}
            iconColor="primary"
          />
          <MetricCard
            title="Outstanding"
            subtitle="Owed on customer ledgers"
            value={comprehensiveData ? formatCurrency(comprehensiveData.billingSummary?.outstanding || 0) : "₦0"}
            change={comprehensiveData ? `${(comprehensiveData.billingSummary?.customersOwing || 0).toLocaleString()} customer${comprehensiveData.billingSummary?.customersOwing === 1 ? "" : "s"} owing` : "0 customers"}
            changeType="neutral"
            icon={HandCoins}
            iconColor="warning"
          />
        </div>

        {/* Bill generation status */}
        <BillingStatus />

        {/* Financial Overview - Wallet & Invoice Combined */}
        <FinancialOverview comprehensiveData={comprehensiveData} />

        {/* Revenue Chart - Full Width */}
        <RevenueChart revenueData={revenuePerformance} />

        {/* Staff Performance & Collection Services */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <StaffPerformance agentsData={topAgents} />
          <CollectionServices servicesData={collectionServices} />
        </div>

        {/* Customers & Transactions */}
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <TopCustomers customersData={topCustomers} />
          <RecentTransactions transactionsData={recentTransactions} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
