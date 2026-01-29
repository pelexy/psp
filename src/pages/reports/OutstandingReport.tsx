import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Search, Download, Phone, MapPin } from "lucide-react";

interface OutstandingCustomer {
  id: string;
  name: string;
  accountNumber: string;
  phone: string;
  address: string;
  ward: string;
  street: string;
  totalDebt: number;
  totalPaid: number;
  currentBalance: number;
  lastPaymentDate: string | null;
}

const OutstandingReport = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<OutstandingCustomer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("currentBalance");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    fetchOutstandingData();
  }, [accessToken, sortBy, sortOrder]);

  const fetchOutstandingData = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await apiService.getOutstandingReport(accessToken, {
        sortBy,
        sortOrder,
      });
      setCustomers(response?.customers || []);
    } catch (error: any) {
      console.error("Error fetching outstanding data:", error);
      toast.error(error.message || "Failed to load outstanding report");
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(query) ||
      c.accountNumber.toLowerCase().includes(query) ||
      c.phone?.includes(query) ||
      c.ward?.toLowerCase().includes(query) ||
      c.street?.toLowerCase().includes(query)
    );
  });

  const totalOutstanding = filteredCustomers.reduce((sum, c) => sum + c.currentBalance, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Outstanding Balances</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              All customers with unpaid balances
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 font-medium">Total Outstanding</p>
              <p className="text-2xl font-bold text-red-600 mt-0.5">{formatCurrency(totalOutstanding)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-gray-500 font-medium">Customers</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{filteredCustomers.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Sort */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search name, account, phone, ward..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={`${sortBy}-${sortOrder}`} onValueChange={(v) => {
            const [field, order] = v.split("-");
            setSortBy(field);
            setSortOrder(order);
          }}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="currentBalance-desc">Highest balance</SelectItem>
              <SelectItem value="currentBalance-asc">Lowest balance</SelectItem>
              <SelectItem value="lastPaymentDate-asc">Oldest payment</SelectItem>
              <SelectItem value="fullName-asc">Name A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Customer List */}
        <Card>
          <div className="border-b px-4 py-3">
            <h3 className="font-medium text-gray-900">
              Customers
              <span className="text-gray-400 font-normal ml-2">({filteredCustomers.length})</span>
            </h3>
          </div>

          {loading ? (
            <div className="p-4 space-y-2">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-16" />
              ))}
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              No customers match your search
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
                    <p className="font-medium text-gray-900 truncate">{customer.name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-500">
                      <span className="font-mono">{customer.accountNumber}</span>
                      {customer.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </span>
                      )}
                      {customer.ward && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {customer.ward}
                        </span>
                      )}
                    </div>
                    {customer.lastPaymentDate && (
                      <p className="text-xs text-gray-400 mt-0.5">
                        Last paid: {new Date(customer.lastPaymentDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-red-600">{formatCurrency(customer.currentBalance)}</p>
                    <p className="text-xs text-gray-400">of {formatCurrency(customer.totalDebt)}</p>
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

export default OutstandingReport;
