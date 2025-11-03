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
import { Search, Upload as UploadIcon, FileSearch, Eye } from "lucide-react";
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

  // Fetch customers
  const fetchCustomers = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      // Build clean filter object - only include defined values
      const apiFilters: any = {};

      if (debouncedSearch?.trim()) {
        apiFilters.searchTerm = debouncedSearch.trim();
      }

      if (filters.isActive && filters.isActive !== "all") {
        apiFilters.isActive = filters.isActive === "true";
      }

      if (filters.state?.trim()) {
        apiFilters.state = filters.state.trim();
      }

      if (filters.sortBy?.trim()) {
        apiFilters.sortBy = filters.sortBy.trim();
      }

      if (filters.sortOrder) {
        apiFilters.sortOrder = filters.sortOrder;
      }

      console.log("Fetching customers with filters:", apiFilters);

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
        key: "accountNumber",
        header: "Account Number",
        accessor: (customer) => (
          <span className="font-mono text-sm font-medium">{customer.accountNumber || customer.customerAccountNumber || 'N/A'}</span>
        ),
      },
      {
        key: "name",
        header: "Name",
        accessor: (customer) => (
          <div>
            <p className="font-medium text-gray-900">{customer.name || customer.fullName || 'N/A'}</p>
            <p className="text-sm text-gray-500">{customer.email || 'N/A'}</p>
          </div>
        ),
      },
      {
        key: "phone",
        header: "Phone",
        accessor: (customer) => <span className="text-gray-700">{customer.phone || 'N/A'}</span>,
      },
      {
        key: "location",
        header: "Location",
        accessor: (customer) => (
          <div className="text-sm">
            <p className="text-gray-700">{customer.city || customer.location || 'N/A'}</p>
            <p className="text-gray-500">{customer.state || ''}</p>
          </div>
        ),
      },
      {
        key: "balance",
        header: "Balance",
        accessor: (customer) => {
          const balance = customer.currentBalance || customer.balance || 0;
          return (
            <span
              className={`font-semibold ${
                balance > 0 ? "text-red-600" : "text-green-600"
              }`}
            >
              ₦{balance.toLocaleString()}
            </span>
          );
        },
      },
      {
        key: "totalPaid",
        header: "Total Paid",
        accessor: (customer) => {
          const totalPaid = customer.totalPaid || 0;
          return (
            <span className="text-green-600 font-semibold">
              ₦{totalPaid.toLocaleString()}
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
      <div className="p-4 md:p-6 lg:p-8 space-y-6 lg:space-y-8 bg-gradient-to-br from-background via-background to-accent/5 max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              Customers
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Manage your customer accounts and subscriptions • {totalItems} total customers
            </p>
          </div>

          <div className="flex items-center gap-2">
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-full overflow-hidden">
          {/* Search and Filters */}
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <div className="flex-1 w-full relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, email, phone, or account number..."
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
