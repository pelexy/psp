import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Download, Phone } from "lucide-react";

interface CustomerCollection {
  id: string;
  name: string;
  accountNumber: string;
  phone: string;
  ward: string;
  street: string;
  totalBilled: number;
  totalPaid: number;
  collectionRate: number;
  lastPaymentDate: string | null;
  monthsWithoutPayment: number;
}

const CollectionRateReport = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerCollection[]>([]);
  const [threshold, setThreshold] = useState("50");

  useEffect(() => {
    fetchCollectionData();
  }, [accessToken, threshold]);

  const fetchCollectionData = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await apiService.getCollectionRateReport(accessToken, {
        threshold: parseInt(threshold),
      });
      setCustomers(response?.customers || []);
    } catch (error: any) {
      console.error("Error fetching collection rate data:", error);
      toast.error(error.message || "Failed to load collection rate report");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getRateBadge = (rate: number) => {
    if (rate < 25) return <Badge className="bg-red-600 text-white text-xs">{rate.toFixed(0)}%</Badge>;
    if (rate < 50) return <Badge className="bg-orange-500 text-white text-xs">{rate.toFixed(0)}%</Badge>;
    return <Badge className="bg-yellow-500 text-white text-xs">{rate.toFixed(0)}%</Badge>;
  };

  const criticalCount = customers.filter(c => c.collectionRate < 25).length;
  const poorCount = customers.filter(c => c.collectionRate >= 25 && c.collectionRate < 50).length;

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Collection Rate</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Customers with low payment rates
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Filter and Summary */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Show below</span>
            <Select value={threshold} onValueChange={setThreshold}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25%</SelectItem>
                <SelectItem value="50">50%</SelectItem>
                <SelectItem value="75">75%</SelectItem>
                <SelectItem value="100">All</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 font-medium">Critical (&lt;25%)</p>
                <p className="text-2xl font-bold text-red-600 mt-0.5">{criticalCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 font-medium">Poor (25-50%)</p>
                <p className="text-2xl font-bold text-orange-600 mt-0.5">{poorCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 font-medium">Total Below {threshold}%</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{customers.length}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Customer List */}
        <Card>
          <div className="border-b px-4 py-3">
            <h3 className="font-medium text-gray-900">
              Low Collection Customers
              <span className="text-gray-400 font-normal ml-2">({customers.length})</span>
            </h3>
          </div>

          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16" />)}
            </div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              No customers below {threshold}% collection rate
            </div>
          ) : (
            <div className="divide-y">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-4"
                  onClick={() => navigate(`/customers/${customer.accountNumber}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 truncate">{customer.name}</p>
                      {getRateBadge(customer.collectionRate)}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                      <span className="font-mono">{customer.accountNumber}</span>
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </span>
                      )}
                      {customer.monthsWithoutPayment > 0 && (
                        <span className="text-red-500">
                          {customer.monthsWithoutPayment}mo since payment
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm text-gray-900">
                      {formatCurrency(customer.totalPaid)} <span className="text-gray-400">of</span> {formatCurrency(customer.totalBilled)}
                    </p>
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

export default CollectionRateReport;
