import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DataTable } from "@/components/shared";
import type { Column } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, X, CreditCard, Wallet, Building2, HandCoins } from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface Transaction {
  _id: string;
  transactionReference: string;
  amount: number;
  type: string;
  status: string;
  paymentChannel: string;
  description?: string;
  customerId: {
    _id: string;
    fullName: string;
    customerAccountNumber: string;
    phone?: string;
  };
  invoiceId?: {
    _id: string;
    invoiceNumber: string;
  };
  paidAt?: string;
  createdAt: string;
  balanceBefore?: number;
  balanceAfter?: number;
}

const Transactions = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  // State
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    paymentChannel: "all",
    startDate: "",
    endDate: "",
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch transactions
  const fetchTransactions = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const apiFilters: any = {
        page: currentPage,
        limit: pageSize,
      };

      if (debouncedSearch?.trim()) {
        apiFilters.searchTerm = debouncedSearch.trim();
      }

      if (filters.status && filters.status !== "all") {
        apiFilters.status = filters.status;
      }

      if (filters.paymentChannel && filters.paymentChannel !== "all") {
        apiFilters.paymentChannel = filters.paymentChannel;
      }

      if (filters.startDate) {
        apiFilters.startDate = filters.startDate;
      }

      if (filters.endDate) {
        apiFilters.endDate = filters.endDate;
      }

      const response = await apiService.getPayments(accessToken, apiFilters);

      // Handle different response formats
      const txData = Array.isArray(response) ? response : (response.data || response.transactions || []);
      setTransactions(txData);
      setTotalPages(response.pagination?.totalPages || Math.ceil(txData.length / pageSize) || 1);
      setTotalItems(response.pagination?.total || txData.length || 0);
    } catch (error: any) {
      console.error("Error fetching transactions:", error);
      toast.error(error.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      status: "all",
      paymentChannel: "all",
      startDate: "",
      endDate: "",
    });
    setSearchQuery("");
  };

  useEffect(() => {
    fetchTransactions();
  }, [currentPage, pageSize, debouncedSearch, filters, accessToken]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "success":
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Success</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status || "Unknown"}</Badge>;
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel?.toLowerCase()) {
      case "wallet":
        return <Wallet className="h-4 w-4 text-purple-500" />;
      case "transfer":
        return <Building2 className="h-4 w-4 text-blue-500" />;
      case "online":
        return <CreditCard className="h-4 w-4 text-green-500" />;
      case "manual":
        return <HandCoins className="h-4 w-4 text-orange-500" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-500" />;
    }
  };

  const hasActiveFilters = filters.status !== "all" || filters.paymentChannel !== "all" || filters.startDate || filters.endDate;

  // Table columns
  const columns: Column<Transaction>[] = useMemo(
    () => [
      {
        key: "transactionReference",
        header: "Reference",
        accessor: (tx) => (
          <span className="font-mono text-sm font-medium text-primary">{tx.transactionReference || "N/A"}</span>
        ),
      },
      {
        key: "customer",
        header: "Customer",
        accessor: (tx) => (
          <div
            className="cursor-pointer hover:text-primary transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              if (tx.customerId?.customerAccountNumber) {
                navigate(`/customers/${tx.customerId.customerAccountNumber}`);
              }
            }}
          >
            <p className="font-medium text-gray-900">{tx.customerId?.fullName || "N/A"}</p>
            <p className="text-xs text-gray-500">{tx.customerId?.customerAccountNumber || ""}</p>
          </div>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        accessor: (tx) => (
          <span className="font-semibold text-gray-900">
            ₦{(tx.amount || 0).toLocaleString()}
          </span>
        ),
      },
      {
        key: "paymentChannel",
        header: "Channel",
        accessor: (tx) => (
          <div className="flex items-center gap-2">
            {getChannelIcon(tx.paymentChannel)}
            <span className="text-sm capitalize">{tx.paymentChannel || "N/A"}</span>
          </div>
        ),
      },
      {
        key: "invoice",
        header: "Invoice",
        accessor: (tx) => (
          <span className="text-sm text-gray-600 font-mono">
            {tx.invoiceId?.invoiceNumber || "-"}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        accessor: (tx) => getStatusBadge(tx.status),
      },
      {
        key: "date",
        header: "Date",
        accessor: (tx) => (
          <div className="text-sm">
            <p className="text-gray-900">
              {tx.paidAt ? format(new Date(tx.paidAt), "MMM dd, yyyy") : format(new Date(tx.createdAt), "MMM dd, yyyy")}
            </p>
            <p className="text-xs text-gray-500">
              {tx.paidAt ? format(new Date(tx.paidAt), "hh:mm a") : format(new Date(tx.createdAt), "hh:mm a")}
            </p>
          </div>
        ),
      },
    ],
    [navigate]
  );

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 lg:space-y-8 bg-gradient-to-br from-background via-background to-accent/5 max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Payments</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              View all payment transactions • {totalItems} total payments
            </p>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-full overflow-hidden">
          {/* Search and Filters */}
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by reference, customer name, or account number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>

              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="gap-2"
              >
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-1 h-5 w-5 rounded-full bg-primary-foreground text-primary text-xs flex items-center justify-center">
                    !
                  </span>
                )}
              </Button>
            </div>

            {/* Filter Panel */}
            {showFilters && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <Select
                      value={filters.status}
                      onValueChange={(value) => setFilters({ ...filters, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Channel Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Payment Channel</label>
                    <Select
                      value={filters.paymentChannel}
                      onValueChange={(value) => setFilters({ ...filters, paymentChannel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="All channels" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Channels</SelectItem>
                        <SelectItem value="wallet">Wallet</SelectItem>
                        <SelectItem value="transfer">Bank Transfer</SelectItem>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Start Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">From Date</label>
                    <Input
                      type="date"
                      value={filters.startDate}
                      onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      className="h-10"
                    />
                  </div>

                  {/* End Date */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">To Date</label>
                    <Input
                      type="date"
                      value={filters.endDate}
                      onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      className="h-10"
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearFilters}
                      className="gap-2 text-gray-500"
                    >
                      <X className="h-4 w-4" />
                      Clear all filters
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={transactions}
            pagination={{
              currentPage,
              totalPages,
              totalItems,
              itemsPerPage: pageSize,
            }}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            loading={loading}
            emptyMessage="No payments found. Payments will appear here once customers make transactions."
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Transactions;
