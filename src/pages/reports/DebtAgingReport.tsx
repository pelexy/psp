import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Download, Phone } from "lucide-react";

interface CustomerDebt {
  id: string;
  name: string;
  accountNumber: string;
  phone: string;
  totalDebt: number;
  oldestInvoiceDate: string | null;
  daysOverdue: number;
  bucket: string;
}

interface BucketSummary {
  count: number;
  amount: number;
}

const DebtAgingReport = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerDebt[]>([]);
  const [summary, setSummary] = useState<{
    current: BucketSummary;
    overdue30: BucketSummary;
    overdue60: BucketSummary;
    overdue90: BucketSummary;
  } | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>("all");

  useEffect(() => {
    fetchDebtAgingData();
  }, [accessToken]);

  const fetchDebtAgingData = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await apiService.getDebtAgingReport(accessToken);
      setCustomers(response?.customers || []);
      setSummary({
        current: response?.current || { count: 0, amount: 0 },
        overdue30: response?.overdue30 || { count: 0, amount: 0 },
        overdue60: response?.overdue60 || { count: 0, amount: 0 },
        overdue90: response?.overdue90 || { count: 0, amount: 0 },
      });
    } catch (error: any) {
      console.error("Error fetching debt aging data:", error);
      toast.error(error.message || "Failed to load debt aging report");
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = activeFilter === "all"
    ? customers
    : customers.filter(c => c.bucket === activeFilter);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getBucketBadge = (bucket: string, days: number) => {
    if (bucket === "Critical") return <Badge className="bg-red-600 text-white text-xs">{days}d</Badge>;
    if (bucket === "Seriously Overdue") return <Badge className="bg-orange-500 text-white text-xs">{days}d</Badge>;
    if (bucket === "Overdue") return <Badge className="bg-yellow-500 text-white text-xs">{days}d</Badge>;
    return <Badge variant="secondary" className="text-xs">{days}d</Badge>;
  };

  const totalDebt = summary
    ? summary.current.amount + summary.overdue30.amount + summary.overdue60.amount + summary.overdue90.amount
    : 0;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Debt Aging</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Customers grouped by overdue period
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <Card
              className={`cursor-pointer border-2 transition-colors ${activeFilter === "all" ? "border-gray-900 bg-gray-50" : "border-transparent hover:bg-gray-50"}`}
              onClick={() => setActiveFilter("all")}
            >
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 font-medium">Total</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{formatCurrency(totalDebt)}</p>
                <p className="text-xs text-gray-400">{customers.length} customers</p>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer border-2 transition-colors ${activeFilter === "Current" ? "border-gray-400 bg-gray-50" : "border-transparent hover:bg-gray-50"}`}
              onClick={() => setActiveFilter("Current")}
            >
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 font-medium">0-30 days</p>
                <p className="text-lg font-bold text-gray-700 mt-0.5">{formatCurrency(summary?.current.amount || 0)}</p>
                <p className="text-xs text-gray-400">{summary?.current.count || 0} customers</p>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer border-2 transition-colors ${activeFilter === "Overdue" ? "border-yellow-500 bg-yellow-50" : "border-transparent hover:bg-yellow-50/50"}`}
              onClick={() => setActiveFilter("Overdue")}
            >
              <CardContent className="p-4">
                <p className="text-xs text-yellow-600 font-medium">31-60 days</p>
                <p className="text-lg font-bold text-yellow-700 mt-0.5">{formatCurrency(summary?.overdue30.amount || 0)}</p>
                <p className="text-xs text-yellow-600/70">{summary?.overdue30.count || 0} customers</p>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer border-2 transition-colors ${activeFilter === "Seriously Overdue" ? "border-orange-500 bg-orange-50" : "border-transparent hover:bg-orange-50/50"}`}
              onClick={() => setActiveFilter("Seriously Overdue")}
            >
              <CardContent className="p-4">
                <p className="text-xs text-orange-600 font-medium">61-90 days</p>
                <p className="text-lg font-bold text-orange-700 mt-0.5">{formatCurrency(summary?.overdue60.amount || 0)}</p>
                <p className="text-xs text-orange-600/70">{summary?.overdue60.count || 0} customers</p>
              </CardContent>
            </Card>

            <Card
              className={`cursor-pointer border-2 transition-colors ${activeFilter === "Critical" ? "border-red-500 bg-red-50" : "border-transparent hover:bg-red-50/50"}`}
              onClick={() => setActiveFilter("Critical")}
            >
              <CardContent className="p-4">
                <p className="text-xs text-red-600 font-medium">90+ days</p>
                <p className="text-lg font-bold text-red-700 mt-0.5">{formatCurrency(summary?.overdue90.amount || 0)}</p>
                <p className="text-xs text-red-600/70">{summary?.overdue90.count || 0} customers</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Customer List */}
        <Card>
          <div className="border-b px-4 py-3 flex items-center justify-between">
            <h3 className="font-medium text-gray-900">
              {activeFilter === "all" ? "All Customers" : activeFilter}
              <span className="text-gray-400 font-normal ml-2">({filteredCustomers.length})</span>
            </h3>
            {activeFilter !== "all" && (
              <Button variant="ghost" size="sm" onClick={() => setActiveFilter("all")}>
                Show all
              </Button>
            )}
          </div>

          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              No customers in this category
            </div>
          ) : (
            <div className="divide-y">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-4"
                  onClick={() => navigate(`/customers/${customer.accountNumber}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{customer.name}</p>
                      {getBucketBadge(customer.bucket, customer.daysOverdue)}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-sm text-gray-500">
                      <span className="font-mono text-xs">{customer.accountNumber}</span>
                      {customer.phone && (
                        <span className="flex items-center gap-1 text-xs">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-gray-900">{formatCurrency(customer.totalDebt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DebtAgingReport;
