import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DataTable } from "@/components/shared";
import type { Column } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Eye } from "lucide-react";
import { CreateInvoiceDialog } from "@/components/invoices/CreateInvoiceDialog";
import { InvoiceFilterPanel } from "@/components/invoices/InvoiceFilterPanel";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const Invoices = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  // State
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    sortBy: "createdAt",
    sortOrder: "desc",
    source: "all",
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch invoices
  const fetchInvoices = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const apiFilters: any = {};

      if (debouncedSearch?.trim()) {
        apiFilters.searchTerm = debouncedSearch.trim();
      }

      if (filters.status && filters.status !== "all") {
        apiFilters.status = filters.status;
      }

      if (filters.sortBy) {
        apiFilters.sortBy = filters.sortBy;
      }

      if (filters.sortOrder) {
        apiFilters.sortOrder = filters.sortOrder;
      }

      if (filters.source && filters.source !== "all") {
        apiFilters.source = filters.source;
      }

      const response = await apiService.getInvoices(
        accessToken,
        currentPage,
        pageSize,
        apiFilters
      );

      setInvoices(response.invoices || response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalItems(response.pagination?.total || 0);
    } catch (error: any) {
      console.error("Error fetching invoices:", error);
      toast.error(error.message || "Failed to load invoices");
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      status: "all",
      sortBy: "createdAt",
      sortOrder: "desc",
      source: "all",
    });
  };

  useEffect(() => {
    fetchInvoices();
  }, [currentPage, pageSize, debouncedSearch, filters, accessToken]);

  // Table columns
  const columns: Column<any>[] = useMemo(
    () => [
      {
        key: "invoiceNumber",
        header: "Invoice Number",
        accessor: (invoice) => (
          <span className="font-mono text-sm font-medium">{invoice.invoiceNumber || 'N/A'}</span>
        ),
      },
      {
        key: "customer",
        header: "Customer",
        accessor: (invoice) => (
          <div>
            <p className="font-medium text-gray-900">{invoice.customer?.fullName || 'N/A'}</p>
            <p className="text-xs text-gray-500">{invoice.customer?.accountNumber || ''}</p>
          </div>
        ),
      },
      {
        key: "service",
        header: "Service",
        accessor: (invoice) => <span className="text-gray-700">{invoice.collection?.collectionName || 'N/A'}</span>,
      },
      {
        key: "amount",
        header: "Amount",
        accessor: (invoice) => (
          <span className="font-semibold text-gray-900">
            ₦{(invoice.amount || 0).toLocaleString()}
          </span>
        ),
      },
      {
        key: "dueDate",
        header: "Due Date",
        accessor: (invoice) => (
          <span className="text-gray-700">
            {invoice.dueDate ? format(new Date(invoice.dueDate), "MMM dd, yyyy") : 'N/A'}
          </span>
        ),
      },
      {
        key: "source",
        header: "Source",
        accessor: (invoice) => (
          <Badge variant="outline" className="text-xs">
            {invoice.source === 'manual' ? 'Manual' : 'Auto'}
          </Badge>
        ),
      },
      {
        key: "status",
        header: "Status",
        accessor: (invoice) => {
          const status = invoice.status || 'pending';
          const variant =
            status === 'paid' ? 'default' :
            status === 'overdue' ? 'destructive' :
            status === 'partially_paid' ? 'secondary' :
            'outline';

          // Format status for display
          const displayStatus = status === 'partially_paid' ? 'Partially Paid' :
                               status.charAt(0).toUpperCase() + status.slice(1);

          return (
            <Badge variant={variant} className="font-medium capitalize">
              {displayStatus}
            </Badge>
          );
        },
      },
      {
        key: "createdAt",
        header: "Created",
        accessor: (invoice) => (
          <span className="text-sm text-gray-600">
            {invoice.createdAt ? format(new Date(invoice.createdAt), "MMM dd, yyyy") : 'N/A'}
          </span>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        accessor: (invoice) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={() => navigate(`/billing/invoices/${invoice.invoiceNumber}`)}
              title="View Invoice"
            >
              <Eye className="h-4 w-4 mr-1" />
              View
            </Button>
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
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Invoices</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Manage all invoices • {totalItems} total invoices
            </p>
          </div>

          <CreateInvoiceDialog onInvoiceCreated={fetchInvoices} />
        </div>

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-full overflow-hidden">
          {/* Search and Filters */}
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by invoice number, customer, or account number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>

              <InvoiceFilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={handleClearFilters}
              />
            </div>
          </div>

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={invoices}
            pagination={{
              currentPage,
              totalPages,
              totalItems,
              itemsPerPage: pageSize,
            }}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            loading={loading}
            emptyMessage="No invoices found. Create your first invoice to get started."
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Invoices;
