import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DataTable } from "@/components/shared";
import type { Column } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  ArrowLeft,
  Users,
  Download,
  Upload,
  UserPlus,
  Calendar,
  DollarSign,
  FileText,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  SlidersHorizontal,
  X,
  Search,
} from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface Customer {
  id: string;
  accountNumber: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  lga: string;
}

const CollectionDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [collection, setCollection] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [billingCycles, setBillingCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cyclesLoading, setCyclesLoading] = useState(true);
  const [customersDropdown, setCustomersDropdown] = useState<Customer[]>([]);

  // Single enrollment state
  const [singleDialogOpen, setSingleDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [singleAmount, setSingleAmount] = useState("");
  const [enrollingSingle, setEnrollingSingle] = useState(false);

  // Bulk enrollment state
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [uploadingBulk, setUploadingBulk] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);

  // Pagination for members
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const pageSize = 20;

  // Member filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [memberFilters, setMemberFilters] = useState({
    isActive: "all",
    autoGenerateInvoices: "all",
    cycleJoined: "",
    sortBy: "enrollmentDate",
    sortOrder: "desc" as "asc" | "desc",
  });

  useEffect(() => {
    if (id && accessToken) {
      fetchCollectionDetails();
      fetchCustomersDropdown();
    }
  }, [id, accessToken]);

  useEffect(() => {
    if (id && accessToken) {
      fetchMembers();
    }
  }, [id, accessToken, currentPage, memberFilters, searchQuery]);

  useEffect(() => {
    if (id && accessToken) {
      fetchBillingCycles();
    }
  }, [id, accessToken]);

  const fetchCollectionDetails = async () => {
    if (!accessToken || !id) return;

    try {
      const response = await apiService.getCollection(accessToken, id);
      setCollection(response);
    } catch (error: any) {
      console.error("Error fetching collection:", error);
      toast.error(error.message || "Failed to load collection details");
    }
  };

  const fetchMembers = async () => {
    if (!accessToken || !id) return;

    setLoading(true);
    try {
      // Build filter object
      const filters: any = {
        sortBy: memberFilters.sortBy,
        sortOrder: memberFilters.sortOrder,
      };

      // Add search if provided
      if (searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      if (memberFilters.isActive !== "all") {
        filters.isActive = memberFilters.isActive === "true";
      }

      if (memberFilters.autoGenerateInvoices !== "all") {
        filters.autoGenerateInvoices = memberFilters.autoGenerateInvoices === "true";
      }

      if (memberFilters.cycleJoined) {
        filters.cycleJoined = parseInt(memberFilters.cycleJoined);
      }

      const response = await apiService.getCollectionMembers(
        accessToken,
        id,
        currentPage,
        pageSize,
        filters
      );

      console.log("Members response:", response);

      // Handle response format: {status, message, data: [...], pagination: {...}}
      const membersData = response.data || [];
      const pagination = response.pagination || {};

      setMembers(membersData);
      setTotalPages(pagination.totalPages || 1);
      setTotalItems(pagination.total || 0);
    } catch (error: any) {
      console.error("Error fetching members:", error);
      toast.error(error.message || "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingCycles = async () => {
    if (!accessToken || !id) return;

    setCyclesLoading(true);
    try {
      const response = await apiService.getCollectionBillingCycles(accessToken, id);

      console.log("Billing cycles response:", response);

      // Handle response format: {status, message, data: [...]}
      const cyclesData = response.data || response || [];

      setBillingCycles(cyclesData);
    } catch (error: any) {
      console.error("Error fetching billing cycles:", error);
      toast.error(error.message || "Failed to load billing cycles");
    } finally {
      setCyclesLoading(false);
    }
  };

  const fetchCustomersDropdown = async () => {
    if (!accessToken) return;

    try {
      const response = await apiService.getCustomersDropdown(accessToken);
      console.log("Customers dropdown response:", response);

      // Handle response format: {status, message, data: [...]}
      const customersData = response.data || response.customers || response || [];

      console.log("Customers data:", customersData);
      setCustomersDropdown(customersData);
    } catch (error: any) {
      console.error("Error fetching customers dropdown:", error);
    }
  };

  const handleSingleEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !id) return;

    setEnrollingSingle(true);
    try {
      const customer = customersDropdown.find(c => c.accountNumber === selectedCustomer);
      if (!customer) {
        toast.error("Please select a customer");
        return;
      }

      const enrollmentData = {
        accountNumber: customer.accountNumber,
        amount: collection.amountType === "FIXED" ? collection.baseAmount : parseFloat(singleAmount),
      };

      await apiService.enrollCustomers(accessToken, id, [enrollmentData]);

      toast.success(`${customer.name} enrolled successfully!`);
      setSingleDialogOpen(false);
      setSelectedCustomer("");
      setSingleAmount("");

      // Refresh data
      fetchCollectionDetails();
      fetchMembers();
    } catch (error: any) {
      console.error("Error enrolling customer:", error);
      toast.error(error.message || "Failed to enroll customer");
    } finally {
      setEnrollingSingle(false);
    }
  };

  const handleDownloadTemplate = () => {
    if (customersDropdown.length === 0) {
      toast.error("No customers available");
      return;
    }

    // Create CSV content with full customer details
    let csvContent = "accountNumber,name,phone,email,address,city,state,lga,amount\n";

    customersDropdown.forEach(customer => {
      const amount = collection.amountType === "FIXED" ? collection.baseAmount : "";
      const fullAddress = `${customer.address} ${customer.city} ${customer.state}`.trim();
      csvContent += `${customer.accountNumber},"${customer.name}","${customer.phone}","${customer.email}","${fullAddress}","${customer.city}","${customer.state}","${customer.lga}",${amount}\n`;
    });

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${collection.collectionName}_enrollment_template.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Template downloaded with all customer details!");
  };

  // Table columns
  const columns: Column<any>[] = useMemo(
    () => [
      {
        key: "customer",
        header: "Customer",
        accessor: (row) => (
          <div>
            <p className="font-medium text-gray-900">{row.customer.fullName}</p>
            <p className="text-sm text-gray-500">{row.customer.accountNumber}</p>
          </div>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        accessor: (row) => (
          <span className="font-semibold text-gray-900">
            ₦{(row.enrollmentDetails.amount || 0).toLocaleString()}
          </span>
        ),
      },
      {
        key: "cycleJoined",
        header: "Cycle Joined",
        accessor: (row) => (
          <span className="text-gray-900">Cycle {row.enrollmentDetails.cycleJoined}</span>
        ),
      },
      {
        key: "status",
        header: "Status",
        accessor: (row) => (
          <Badge variant={row.enrollmentDetails.isActive ? "default" : "secondary"}>
            {row.enrollmentDetails.isActive ? "Active" : "Inactive"}
          </Badge>
        ),
      },
      {
        key: "autoGenerate",
        header: "Auto-Generate",
        accessor: (row) => (
          <Badge variant={row.enrollmentDetails.autoGenerateInvoices ? "default" : "outline"}>
            {row.enrollmentDetails.autoGenerateInvoices ? "Enabled" : "Disabled"}
          </Badge>
        ),
      },
      {
        key: "invoices",
        header: "Invoices",
        accessor: (row) => (
          <span className="text-gray-900">{row.stats.totalInvoicesGenerated || 0}</span>
        ),
      },
      {
        key: "outstanding",
        header: "Outstanding",
        accessor: (row) => (
          <span className="font-semibold text-red-600">
            ₦{(row.stats.outstandingBalance || 0).toLocaleString()}
          </span>
        ),
      },
      {
        key: "enrollmentDate",
        header: "Enrollment Date",
        accessor: (row) => (
          <span className="text-sm text-gray-600">
            {new Date(row.enrollmentDetails.enrollmentDate).toLocaleDateString()}
          </span>
        ),
      },
    ],
    []
  );

  // Billing Cycles table columns
  const cyclesColumns: Column<any>[] = useMemo(
    () => [
      {
        key: "cycleNumber",
        header: "Cycle",
        accessor: (row) => (
          <span className="font-semibold text-gray-900">Cycle {row.cycleNumber || 'N/A'}</span>
        ),
      },
      {
        key: "period",
        header: "Period",
        accessor: (row) => (
          <span className="text-sm text-gray-900">
            {row.cycleStartDate ? new Date(row.cycleStartDate).toLocaleDateString() : 'N/A'}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        accessor: (row) => {
          if (!row.cycleStatus) return <span className="text-gray-500">N/A</span>;
          const variant =
            row.cycleStatus === "ACTIVE" ? "default" :
            row.cycleStatus === "COMPLETED" ? "secondary" :
            "outline";
          return (
            <Badge variant={variant}>
              {row.cycleStatus.charAt(0) + row.cycleStatus.slice(1).toLowerCase()}
            </Badge>
          );
        },
      },
      {
        key: "invoices",
        header: "Invoices",
        accessor: (row) => (
          <span className="text-gray-900">{row.autoGeneratedInvoices || 0}</span>
        ),
      },
      {
        key: "totalBilled",
        header: "Total Billed",
        accessor: (row) => (
          <span className="font-semibold text-gray-900">
            ₦{(row.totalAmountBilled || 0).toLocaleString()}
          </span>
        ),
      },
      {
        key: "paid",
        header: "Paid",
        accessor: (row) => (
          <span className="font-semibold text-green-600">
            ₦{(row.totalAmountPaid || 0).toLocaleString()}
          </span>
        ),
      },
      {
        key: "outstanding",
        header: "Outstanding",
        accessor: (row) => (
          <span className="font-semibold text-red-600">
            ₦{(row.totalOutstanding || 0).toLocaleString()}
          </span>
        ),
      },
      {
        key: "paymentRate",
        header: "Payment Rate",
        accessor: (row) => {
          const rate = row.percentagePaid || 0;
          const colorClass = rate >= 75 ? "text-green-600" : rate >= 50 ? "text-amber-600" : "text-red-600";
          return (
            <span className={`font-semibold ${colorClass}`}>
              {rate}%
            </span>
          );
        },
      },
    ],
    []
  );

  const handleClearFilters = () => {
    setSearchQuery("");
    setMemberFilters({
      isActive: "all",
      autoGenerateInvoices: "all",
      cycleJoined: "",
      sortBy: "enrollmentDate",
      sortOrder: "desc",
    });
    setCurrentPage(1);
  };

  const updateFilter = (key: keyof typeof memberFilters, value: any) => {
    setMemberFilters({ ...memberFilters, [key]: value });
  };

  const activeFilterCount = Object.entries(memberFilters).filter(([key, value]) => {
    if (key === "sortBy" && value === "enrollmentDate") return false;
    if (key === "sortOrder" && value === "desc") return false;
    return value && value !== "all" && value !== "";
  }).length;

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken || !id || !bulkFile) return;

    setUploadingBulk(true);
    try {
      const fileContent = await bulkFile.text();
      const lines = fileContent.split("\n").filter(line => line.trim());

      // Skip header row
      const dataLines = lines.slice(1);

      const enrollmentData = dataLines.map(line => {
        // CSV format: accountNumber,name,phone,email,address,city,state,lga,amount
        const columns = line.split(",");
        const accountNumber = columns[0]?.trim();
        const amount = columns[8]?.trim(); // 9th column (index 8) is amount

        return {
          accountNumber: accountNumber || "",
          amount: parseFloat(amount) || 0,
        };
      }).filter(item => item.accountNumber && item.amount > 0);

      if (enrollmentData.length === 0) {
        toast.error("No valid data found in file. Please check the amount column.");
        return;
      }

      console.log("Enrolling customers:", enrollmentData);

      await apiService.enrollCustomers(accessToken, id, enrollmentData);

      toast.success(`${enrollmentData.length} customer(s) enrolled successfully!`);
      setBulkDialogOpen(false);
      setBulkFile(null);

      // Refresh data
      fetchCollectionDetails();
      fetchMembers();
    } catch (error: any) {
      console.error("Error bulk enrolling:", error);
      toast.error(error.message || "Failed to enroll customers");
    } finally {
      setUploadingBulk(false);
    }
  };

  if (loading && !collection) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 lg:p-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading collection details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!collection) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 lg:p-8">
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Collection Not Found</h3>
            <Button onClick={() => navigate("/collections")} className="mt-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Collections
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/collections")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  {collection.collectionName}
                </h1>
                {collection.isBacklog && (
                  <Badge variant="secondary">System</Badge>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">{collection.description}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {/* Single Enrollment */}
            <Dialog open={singleDialogOpen} onOpenChange={setSingleDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Customer</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Enroll Customer</DialogTitle>
                  <DialogDescription>
                    Add a single customer to this collection
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSingleEnrollment} className="space-y-4">
                  <div>
                    <Label htmlFor="customer">Select Customer *</Label>
                    <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a customer" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {customersDropdown.map((customer) => (
                          <SelectItem key={customer.accountNumber} value={customer.accountNumber}>
                            <div className="flex flex-col">
                              <span className="font-semibold">{customer.name}</span>
                              <span className="text-xs text-gray-500">
                                {customer.accountNumber} • {customer.phone}
                              </span>
                              <span className="text-xs text-gray-400">
                                {customer.address}, {customer.city}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedCustomer && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {(() => {
                          const customer = customersDropdown.find(c => c.accountNumber === selectedCustomer);
                          return customer ? (
                            <div className="space-y-1 text-sm">
                              <p className="font-semibold text-gray-900">{customer.name}</p>
                              <p className="text-gray-600 flex items-center gap-2">
                                <Phone className="h-3 w-3" /> {customer.phone}
                              </p>
                              <p className="text-gray-600 flex items-center gap-2">
                                <Mail className="h-3 w-3" /> {customer.email}
                              </p>
                              <p className="text-gray-600 flex items-center gap-2">
                                <MapPin className="h-3 w-3" /> {customer.address}, {customer.city}, {customer.state}
                              </p>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}
                  </div>

                  {collection.amountType === "VARIABLE" && (
                    <div>
                      <Label htmlFor="amount">Amount *</Label>
                      <Input
                        id="amount"
                        type="number"
                        value={singleAmount}
                        onChange={(e) => setSingleAmount(e.target.value)}
                        placeholder="Enter amount"
                        required
                        min="0"
                      />
                    </div>
                  )}

                  {collection.amountType === "FIXED" && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-900">
                        <strong>Fixed Amount:</strong> ₦{collection.baseAmount.toLocaleString()} will be charged per cycle
                      </p>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setSingleDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={enrollingSingle}>
                      {enrollingSingle ? "Enrolling..." : "Enroll Customer"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            {/* Bulk Enrollment */}
            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline">Bulk Upload</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bulk Enroll Customers</DialogTitle>
                  <DialogDescription>
                    Upload a CSV file to enroll multiple customers at once
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {/* Download Template */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h4 className="font-semibold text-sm mb-2">Step 1: Download Template</h4>
                    <p className="text-xs text-gray-600 mb-3">
                      Download the CSV template with all customers pre-filled
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDownloadTemplate}
                      className="gap-2 w-full"
                    >
                      <Download className="h-4 w-4" />
                      Download Template
                    </Button>
                  </div>

                  {/* Upload File */}
                  <form onSubmit={handleBulkUpload} className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <h4 className="font-semibold text-sm mb-2">Step 2: Fill & Upload</h4>
                      <p className="text-xs text-gray-600 mb-3">
                        {collection.amountType === "FIXED"
                          ? "Review the template and upload (amounts are pre-filled)"
                          : "Fill in the amount column for each customer and upload"}
                      </p>
                      <Input
                        type="file"
                        accept=".csv"
                        onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                        className="cursor-pointer"
                      />
                      {bulkFile && (
                        <p className="text-xs text-green-600 mt-2">
                          Selected: {bulkFile.name}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setBulkDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={uploadingBulk || !bulkFile}>
                        {uploadingBulk ? "Uploading..." : "Upload & Enroll"}
                      </Button>
                    </div>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-2xl">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="members">Members ({collection.totalMembers || 0})</TabsTrigger>
            <TabsTrigger value="billing-cycles">Billing Cycles</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Grid with Pie Chart */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Overview with Pie Chart */}
          <div className="lg:col-span-1 bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Payment Overview</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Paid", value: collection.totalPaid || 0, color: "#22c55e" },
                    { name: "Outstanding", value: collection.totalUnpaid || 0, color: "#ef4444" },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip
                  formatter={(value: any) => `₦${value.toLocaleString()}`}
                  contentStyle={{ backgroundColor: "white", border: "1px solid #e5e7eb", borderRadius: "8px" }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  <span className="text-sm text-gray-600">Paid</span>
                </div>
                <span className="text-sm font-semibold text-green-600">
                  ₦{(collection.totalPaid || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-gray-600">Outstanding</span>
                </div>
                <span className="text-sm font-semibold text-red-600">
                  ₦{(collection.totalUnpaid || 0).toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">Payment Rate</span>
                  <span className="text-lg font-bold text-primary">
                    {collection.percentagePaid || 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Members</p>
                  <p className="text-2xl font-bold text-gray-900">{collection.totalMembers || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Billed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₦{(collection.totalAmount || 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                  <FileText className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Invoices</p>
                  <p className="text-2xl font-bold text-gray-900">{collection.totalInvoices || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                  <Calendar className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Cycle</p>
                  <p className="text-2xl font-bold text-gray-900">Cycle {collection.currentCycle}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Collection Info */}
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Collection Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500 mb-1">Amount Type</p>
              <Badge variant={collection.amountType === "FIXED" ? "default" : "secondary"}>
                {collection.amountType}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Billing Frequency</p>
              <p className="font-semibold">
                {collection.billingFrequency.replace("_", " ").toUpperCase()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Current Cycle</p>
              <p className="font-semibold">Cycle {collection.currentCycle}</p>
            </div>
            {collection.amountType === "FIXED" && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Base Amount</p>
                <p className="font-semibold text-emerald-600">
                  ₦{collection.baseAmount.toLocaleString()}
                </p>
              </div>
            )}
            {collection.nextInvoiceDate && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Next Invoice</p>
                <p className="font-semibold">
                  {new Date(collection.nextInvoiceDate).toLocaleDateString()}
                </p>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500 mb-1">Payment Rate</p>
              <p className="font-semibold">{collection.percentagePaid || 0}%</p>
            </div>
          </div>
        </div>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            {/* Main Content Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Search and Filters */}
              <div className="p-4 md:p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-1 w-full relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by customer name, phone, email, or account number..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-10"
                    />
                  </div>

                  {/* Filter Sheet */}
                  <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters
                        {activeFilterCount > 0 && (
                          <span className="ml-1 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs font-medium">
                            {activeFilterCount}
                          </span>
                        )}
                      </Button>
                    </SheetTrigger>
                    <SheetContent className="w-full sm:max-w-md overflow-y-auto">
                      <SheetHeader>
                        <SheetTitle className="flex items-center justify-between">
                          <span>Filter & Sort</span>
                          {activeFilterCount > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleClearFilters}
                              className="h-8 gap-2 text-muted-foreground hover:text-foreground"
                            >
                              <X className="h-4 w-4" />
                              Clear All
                            </Button>
                          )}
                        </SheetTitle>
                        <SheetDescription>
                          Filter and sort collection members by status, auto-generate, cycle, and more
                        </SheetDescription>
                      </SheetHeader>

                      <div className="mt-6 space-y-6">
                        {/* Status Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-900">Status</Label>
                          <Select
                            value={memberFilters.isActive}
                            onValueChange={(value) => updateFilter("isActive", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Members</SelectItem>
                              <SelectItem value="true">Active Only</SelectItem>
                              <SelectItem value="false">Inactive Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Auto-Generate Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-900">Auto-Generate Invoices</Label>
                          <Select
                            value={memberFilters.autoGenerateInvoices}
                            onValueChange={(value) => updateFilter("autoGenerateInvoices", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select option" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All</SelectItem>
                              <SelectItem value="true">Enabled Only</SelectItem>
                              <SelectItem value="false">Disabled Only</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Cycle Joined Filter */}
                        <div className="space-y-2">
                          <Label className="text-sm font-semibold text-gray-900">Cycle Joined</Label>
                          <Input
                            type="number"
                            placeholder="Filter by cycle number"
                            value={memberFilters.cycleJoined}
                            onChange={(e) => updateFilter("cycleJoined", e.target.value)}
                            min="1"
                          />
                        </div>

                        <div className="border-t pt-6">
                          <h3 className="text-sm font-semibold text-gray-900 mb-4">Sort By</h3>

                          <div className="space-y-2 mb-4">
                            <Label className="text-sm text-gray-700">Field</Label>
                            <Select
                              value={memberFilters.sortBy}
                              onValueChange={(value) => updateFilter("sortBy", value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Choose field" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="enrollmentDate">Enrollment Date</SelectItem>
                                <SelectItem value="customerName">Customer Name</SelectItem>
                                <SelectItem value="totalAmountPaid">Total Amount Paid</SelectItem>
                                <SelectItem value="outstandingBalance">Outstanding Balance</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-2">
                            <Label className="text-sm text-gray-700">Order</Label>
                            <Select
                              value={memberFilters.sortOrder}
                              onValueChange={(value: "asc" | "desc") => updateFilter("sortOrder", value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="asc">Ascending (A-Z, Low-High)</SelectItem>
                                <SelectItem value="desc">Descending (Z-A, High-Low)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6 pt-6 border-t flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setFilterSheetOpen(false)}
                        >
                          Close
                        </Button>
                        <Button
                          className="flex-1"
                          onClick={() => setFilterSheetOpen(false)}
                        >
                          Apply Filters
                        </Button>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>

              {/* Data Table */}
              <DataTable
                columns={columns}
                data={members}
                loading={loading}
                pagination={{
                  currentPage: currentPage,
                  totalPages: totalPages,
                  totalItems: totalItems,
                  itemsPerPage: pageSize,
                }}
                onPageChange={setCurrentPage}
                emptyMessage="No members enrolled in this collection yet"
              />
            </div>
          </TabsContent>

          {/* Billing Cycles Tab */}
          <TabsContent value="billing-cycles" className="space-y-6">
            {/* Main Content Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              {/* Data Table */}
              <DataTable
                columns={cyclesColumns}
                data={billingCycles}
                loading={cyclesLoading}
                emptyMessage="No billing cycles found"
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default CollectionDetails;
