import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DataTable } from "@/components/shared";
import type { Column } from "@/components/shared";
import { AddCustomerDialog } from "@/components/customers/AddCustomerDialog";
import { QuickLookup } from "@/components/customers/QuickLookup";
import { BulkUpload } from "@/components/customers/BulkUpload";
import { FilterPanel } from "@/components/customers/FilterPanel";
import type { FilterOptions } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Search, Upload as UploadIcon, FileSearch, Eye, Download } from "@/lib/icons";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Customer } from "@/types";
import { toast } from "sonner";

const Customers = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  // State
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<FilterOptions>({
    isActive: "all",
    sortOrder: "asc",
  });

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Single source of truth for the filters we send to the API — used by BOTH the
  // table fetch and the export, so export always respects the active filters.
  const buildApiFilters = () => {
    const apiFilters: any = {};
    if (debouncedSearch?.trim()) apiFilters.searchTerm = debouncedSearch.trim();
    if (filters.isActive && filters.isActive !== "all") apiFilters.isActive = filters.isActive === "true";
    if (filters.state?.trim()) apiFilters.state = filters.state.trim();
    if (filters.lga?.trim()) apiFilters.lga = filters.lga.trim();
    if (filters.hasOutstanding === "true") apiFilters.hasOutstanding = true;
    if (filters.paymentBehavior) apiFilters.paymentBehavior = filters.paymentBehavior;
    if (filters.sortBy?.trim()) apiFilters.sortBy = filters.sortBy.trim();
    if (filters.sortOrder) apiFilters.sortOrder = filters.sortOrder;
    return apiFilters;
  };

  // Fetch customers
  const fetchCustomers = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const apiFilters = buildApiFilters();

      const response = await apiService.getCustomers(
        accessToken,
        currentPage,
        pageSize,
        apiFilters
      );

      setCustomers(response.customers);
      setTotalPages(response.pagination.totalPages);
      setTotalItems(response.pagination.total);
    } catch (error: any) {
      console.error("Error fetching customers:", error);
      console.error("Error details:", error.message, error.statusCode);
      toast.error(error.message || "Failed to load customers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [currentPage, pageSize, debouncedSearch, filters, accessToken]);

  // Export EVERYTHING that matches the current search/filters — not just this page.
  const handleExport = async () => {
    if (!accessToken) return;
    setExporting(true);
    try {
      // Same filters as the table (location, debt, status, sort) — export respects them all.
      const apiFilters = buildApiFilters();

      toast.info("Preparing export…");
      const response = await apiService.getCustomers(accessToken, 1, 1000000, apiFilters);
      const rows: any[] = response.customers || [];
      if (rows.length === 0) {
        toast.error("No customers to export");
        return;
      }

      const headers = [
        "Account Number", "Address", "Contact Name", "Contact Phone", "Contact Email",
        "City", "State", "LGA", "Billed", "Total Paid", "Deficit", "Status", "Created",
      ];
      const esc = (v: any) => {
        const s = v == null ? "" : String(v);
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      };
      const lines = rows.map((c) =>
        [
          c.accountNumber || c.customerAccountNumber,
          c.address || c.fullName,
          c.contactName,
          c.contactPhone || c.phone,
          c.contactEmail || c.email,
          c.city, c.state, c.lga,
          c.totalDebt || 0,
          c.totalPaid || 0,
          c.currentBalance || 0,
          c.isActive ? "Active" : "Inactive",
          c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : "",
        ]
          .map(esc)
          .join(",")
      );
      const csv = [headers.join(","), ...lines].join("\n");

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `customers-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Exported ${rows.length.toLocaleString()} customers`);
    } catch (e: any) {
      toast.error(e.message || "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      isActive: "all",
      sortOrder: "asc",
    });
    setSearchQuery("");
  };

  // Memoized table columns
  const columns: Column<Customer>[] = useMemo(
    () => [
      {
        key: "account",
        header: "Account",
        accessor: (customer) => (
          <div>
            <p className="font-mono text-sm font-medium text-foreground">
              {customer.accountNumber || customer.customerAccountNumber || 'N/A'}
            </p>
            <p className="text-sm text-muted-foreground">
              {customer.address || customer.fullName || '—'}
            </p>
          </div>
        ),
      },
      {
        key: "contact",
        header: "Contact Person",
        accessor: (customer) => (
          <div className="text-sm">
            <p className="font-medium text-foreground">{customer.contactName || 'N/A'}</p>
            <p className="text-muted-foreground">{customer.contactPhone || customer.phone || 'N/A'}</p>
            {(customer.contactEmail || customer.email) && (
              <p className="text-muted-foreground">{customer.contactEmail || customer.email}</p>
            )}
          </div>
        ),
      },
      {
        key: "location",
        header: "Location",
        accessor: (customer) => (
          <div className="text-sm">
            <p className="text-foreground">{customer.city || customer.location || 'N/A'}</p>
            <p className="text-muted-foreground">{customer.state || ''}</p>
          </div>
        ),
      },
      {
        key: "created",
        header: "Created",
        accessor: (customer) => (
          <span className="text-sm text-muted-foreground">
            {customer.createdAt
              ? new Date(customer.createdAt).toLocaleDateString("en-NG", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </span>
        ),
      },
      {
        key: "billed",
        header: "Billed",
        accessor: (customer) => (
          <span className="font-semibold tabular-nums text-foreground">
            ₦{(customer.totalDebt || 0).toLocaleString()}
          </span>
        ),
      },
      {
        key: "totalPaid",
        header: "Total Paid",
        accessor: (customer) => (
          <span className="font-semibold tabular-nums text-success">
            ₦{(customer.totalPaid || 0).toLocaleString()}
          </span>
        ),
      },
      {
        key: "deficit",
        header: "Deficit",
        accessor: (customer) => {
          const deficit = customer.currentBalance || customer.balance || 0;
          return (
            <span
              className={`font-semibold tabular-nums ${deficit > 0 ? "text-destructive" : "text-success"}`}
            >
              ₦{deficit.toLocaleString()}
            </span>
          );
        },
      },
      {
        key: "status",
        header: "Status",
        accessor: (customer) => (
          <Badge variant={customer.isActive ? "default" : "secondary"} className="font-medium">
            {customer.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        key: "actions",
        header: "Actions",
        accessor: (customer) => {
          const accountNumber = customer.accountNumber || customer.customerAccountNumber;
          return (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (accountNumber) {
                  navigate(`/customers/${accountNumber}`);
                }
              }}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
          );
        },
      },
    ],
    [navigate]
  );

  const handleCustomerSelect = (customer: Customer) => {
    const accountNumber = customer.accountNumber || customer.customerAccountNumber;
    if (accountNumber) {
      navigate(`/customers/${accountNumber}`);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-background max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
              Customers
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your customer accounts and subscriptions · {totalItems} total customers
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handleExport} disabled={exporting}>
              <Download className="h-4 w-4" />
              {exporting ? "Exporting…" : "Export"}
            </Button>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <FileSearch className="h-4 w-4" />
                  Quick Lookup
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle>Quick Customer Lookup</SheetTitle>
                  <SheetDescription>
                    Search for a customer by account number
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <QuickLookup onCustomerSelect={handleCustomerSelect} />
                </div>
              </SheetContent>
            </Sheet>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <UploadIcon className="h-4 w-4" />
                  Bulk Upload
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                  <SheetTitle>Bulk Customer Upload</SheetTitle>
                  <SheetDescription>
                    Upload multiple customers from Excel or CSV file
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6">
                  <BulkUpload onCustomersAdded={fetchCustomers} />
                </div>
              </SheetContent>
            </Sheet>

            <AddCustomerDialog onCustomerAdded={fetchCustomers} />
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-card rounded-lg shadow-card border border-border max-w-full overflow-hidden">
          {/* Search and Filters */}
          <div className="p-4 border-b border-border">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by address, contact, phone, email, account number, street, or ward..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-10"
                />
              </div>

              <FilterPanel
                filters={filters}
                onFiltersChange={setFilters}
                onClearFilters={handleClearFilters}
              />
            </div>
          </div>

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={customers}
            pagination={{
              currentPage,
              totalPages,
              totalItems,
              itemsPerPage: pageSize,
            }}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            loading={loading}
            emptyMessage="No customers found. Try adjusting your search or filters."
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Customers;
