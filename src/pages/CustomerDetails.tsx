import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DataTable } from "@/components/shared";
import type { Column } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  AlertCircle,
  User,
  Trash2,
  Pencil,
  Building2,
  Home,
  Navigation,
  Printer,
} from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { TrashSealPreview } from "@/components/customers/TrashSealPreview";
import { EditCustomerDialog } from "@/components/customers/EditCustomerDialog";
import { QRCodeSVG } from "qrcode.react";

const CustomerDetails = () => {
  const { accountNumber } = useParams<{ accountNumber: string }>();
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [customer, setCustomer] = useState<any | null>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const [invoicePage, setInvoicePage] = useState(1);
  const [invoiceTotal, setInvoiceTotal] = useState(0);
  const [invoiceTotalPages, setInvoiceTotalPages] = useState(1);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionTotal, setTransactionTotal] = useState(0);
  const [transactionTotalPages, setTransactionTotalPages] = useState(1);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [togglingService, setTogglingService] = useState<string | null>(null);

  // Fetch customer details
  const fetchCustomerDetails = async () => {
    if (!accountNumber || !accessToken) return;

    setLoading(true);
    try {
      const response = await apiService.getCustomerDetails(accessToken, accountNumber);
      console.log("Customer details response:", response);
      setCustomer(response);
    } catch (error) {
      console.error("Error fetching customer details:", error);
      toast.error("Failed to load customer details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerDetails();
  }, [accountNumber, accessToken]);

  // Fetch invoices when tab is active
  useEffect(() => {
    const fetchInvoices = async () => {
      if (!accountNumber || !accessToken || activeTab !== "invoices") return;

      setInvoicesLoading(true);
      try {
        const response = await apiService.getCustomerInvoices(accessToken, accountNumber, invoicePage, 20);
        console.log("Invoices response:", response);
        setInvoices(response.data || []);
        setInvoiceTotal(response.pagination?.total || 0);
        setInvoiceTotalPages(response.pagination?.totalPages || 1);
      } catch (error) {
        console.error("Error fetching invoices:", error);
        toast.error("Failed to load invoices");
      } finally {
        setInvoicesLoading(false);
      }
    };

    fetchInvoices();
  }, [accountNumber, accessToken, activeTab, invoicePage]);

  // Fetch transactions when tab is active
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!accountNumber || !accessToken || activeTab !== "transactions") {
        console.log("Transactions fetch skipped:", { accountNumber, hasToken: !!accessToken, activeTab });
        return;
      }

      console.log("Fetching transactions for:", accountNumber, "page:", transactionPage);
      setTransactionsLoading(true);
      try {
        const response = await apiService.getCustomerTransactions(accessToken, accountNumber, transactionPage, 20);
        console.log("Transactions response:", response);
        console.log("Transactions data:", response.data);
        console.log("Transactions count:", response.data?.length || 0);
        setTransactions(response.data || []);
        setTransactionTotal(response.pagination?.total || 0);
        setTransactionTotalPages(response.pagination?.totalPages || 1);
      } catch (error: any) {
        console.error("Error fetching transactions:", error);
        console.error("Error details:", error.message, error.statusCode);
        toast.error("Failed to load transactions");
      } finally {
        setTransactionsLoading(false);
      }
    };

    fetchTransactions();
  }, [accountNumber, accessToken, activeTab, transactionPage]);

  // Delete customer
  const handleDeleteCustomer = async () => {
    if (!accessToken || !customer?.customerDetails?.customerId) return;

    setDeleting(true);
    try {
      await apiService.deleteCustomer(accessToken, customer.customerDetails.customerId);
      toast.success("Customer deleted successfully");
      navigate("/customers");
    } catch (error: any) {
      console.error("Error deleting customer:", error);
      toast.error(error.message || "Failed to delete customer");
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // Toggle auto-generate for service
  const handleToggleAutoGenerate = async (collectionId: string, enrollmentId: string, currentStatus: boolean) => {
    if (!accessToken || !accountNumber) return;

    setTogglingService(enrollmentId);
    try {
      await apiService.toggleAutoGenerate(accessToken, collectionId, accountNumber);

      // Update the service in the customer data
      setCustomer((prevCustomer: any) => {
        if (!prevCustomer?.servicesEnrolled) return prevCustomer;

        return {
          ...prevCustomer,
          servicesEnrolled: prevCustomer.servicesEnrolled.map((service: any) =>
            service.enrollmentId === enrollmentId
              ? { ...service, autoGenerateInvoices: !currentStatus }
              : service
          ),
        };
      });

      toast.success(`Auto-generate ${!currentStatus ? 'enabled' : 'disabled'} successfully`);
    } catch (error: any) {
      console.error("Error toggling auto-generate:", error);
      toast.error(error.message || "Failed to toggle auto-generate");
    } finally {
      setTogglingService(null);
    }
  };

  // Memoized invoice columns
  const invoiceColumns: Column<any>[] = useMemo(
    () => [
      {
        key: "invoiceNumber",
        header: "Invoice #",
        accessor: (invoice) => (
          <span className="font-mono text-sm font-medium">{invoice.invoiceNumber}</span>
        ),
      },
      {
        key: "service",
        header: "Service",
        accessor: (invoice) => (
          <div>
            <p className="font-medium text-gray-900">{invoice.collection?.collectionName || 'N/A'}</p>
            <p className="text-xs text-gray-500">{invoice.description}</p>
          </div>
        ),
      },
      {
        key: "dates",
        header: "Issue / Due Date",
        accessor: (invoice) => (
          <div className="text-sm">
            <p className="text-gray-700">{format(new Date(invoice.issueDate), "MMM dd, yyyy")}</p>
            <p className="text-gray-500 text-xs">{format(new Date(invoice.dueDate), "MMM dd, yyyy")}</p>
          </div>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        accessor: (invoice) => (
          <span className="font-semibold text-gray-900">₦{(invoice.totalAmount || 0).toLocaleString()}</span>
        ),
      },
      {
        key: "amountPaid",
        header: "Paid",
        accessor: (invoice) => (
          <span className="text-green-600 font-medium">₦{(invoice.amountPaid || 0).toLocaleString()}</span>
        ),
      },
      {
        key: "outstanding",
        header: "Outstanding",
        accessor: (invoice) => (
          <span className="text-red-600 font-semibold">
            ₦{(invoice.balanceRemaining || 0).toLocaleString()}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        accessor: (invoice) => {
          const statusColors: any = {
            PAID: "default",
            PENDING: "secondary",
            OVERDUE: "destructive",
            PARTIALLY_PAID: "outline",
          };
          return (
            <Badge variant={statusColors[invoice.status] || "secondary"}>
              {invoice.status}
            </Badge>
          );
        },
      },
    ],
    []
  );

  // Memoized transaction columns
  const transactionColumns: Column<any>[] = useMemo(
    () => [
      {
        key: "transactionReference",
        header: "Reference",
        accessor: (txn) => <span className="font-mono text-sm font-medium">{txn.transactionReference}</span>,
      },
      {
        key: "createdAt",
        header: "Date & Time",
        accessor: (txn) => (
          <div className="text-sm">
            <p className="text-gray-900">{format(new Date(txn.paidAt || txn.createdAt), "MMM dd, yyyy")}</p>
            <p className="text-gray-500 text-xs">{format(new Date(txn.paidAt || txn.createdAt), "hh:mm a")}</p>
          </div>
        ),
      },
      {
        key: "invoice",
        header: "Invoice",
        accessor: (txn) => (
          <span className="font-mono text-sm text-gray-700">
            {txn.invoice?.invoiceNumber || "N/A"}
          </span>
        ),
      },
      {
        key: "amount",
        header: "Amount",
        accessor: (txn) => (
          <span className="font-semibold text-gray-900">₦{(txn.amount || 0).toLocaleString()}</span>
        ),
      },
      {
        key: "type",
        header: "Type",
        accessor: (txn) => (
          <Badge variant="outline">{txn.type}</Badge>
        ),
      },
      {
        key: "paymentMethod",
        header: "Method",
        accessor: (txn) => (
          <span className="capitalize text-sm text-gray-700">
            {(txn.paymentMethod || 'N/A').replace("_", " ")}
          </span>
        ),
      },
      {
        key: "status",
        header: "Status",
        accessor: (txn) => {
          const statusColors: any = {
            SUCCESS: "default",
            PENDING: "secondary",
            FAILED: "destructive",
            EXPIRED: "secondary",
          };
          return (
            <Badge variant={statusColors[txn.status] || "secondary"}>
              {txn.status}
            </Badge>
          );
        },
      },
    ],
    []
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 lg:p-8 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </DashboardLayout>
    );
  }

  if (!customer) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 lg:p-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">Customer not found</p>
            <Button onClick={() => navigate("/customers")} className="mt-4">
              Back to Customers
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const details = customer.customerDetails || {};
  const financial = customer.financialSummary || {};
  const invoiceSummary = customer.invoiceSummary || {};
  const services = customer.servicesEnrolled || [];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-gradient-to-br from-background via-background to-accent/5 max-w-full overflow-hidden">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Button variant="outline" size="icon" onClick={() => navigate("/customers")} className="shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 truncate">
                  {details.fullName}
                </h1>
                <Badge variant={details.isActive ? "default" : "secondary"} className="shrink-0">
                  {details.accountStatus?.toUpperCase() || (details.isActive ? "ACTIVE" : "INACTIVE")}
                </Badge>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 mt-1 flex-wrap text-xs sm:text-sm">
                <p className="text-gray-500 font-mono">{details.accountNumber}</p>
                <p className="text-gray-400 hidden sm:inline">•</p>
                <p className="text-gray-500">Ref: {details.customerRef}</p>
                {details.lastLogin && (
                  <>
                    <p className="text-gray-400 hidden lg:inline">•</p>
                    <p className="text-gray-500 hidden lg:inline">Last login: {format(new Date(details.lastLogin), "MMM dd, yyyy HH:mm")}</p>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <TrashSealPreview customer={customer} />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEditDialog(true)}
              className="gap-2"
            >
              <Pencil className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Edit Customer</span>
              <span className="sm:hidden">Edit</span>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="gap-2"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Delete Customer</span>
              <span className="sm:hidden">Delete</span>
            </Button>
          </div>
        </div>

        {/* Edit Customer Dialog */}
        <EditCustomerDialog
          customer={customer}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onCustomerUpdated={fetchCustomerDetails}
        />

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Customer</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{details.fullName}</strong>? This action cannot be undone. All customer data, invoices, and transactions will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCustomer}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
              >
                {deleting ? "Deleting..." : "Delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Main Content with Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-full overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b border-gray-200 bg-gray-50/50 px-3 sm:px-6 overflow-x-auto">
              <TabsList className="h-auto bg-transparent border-0 p-0 space-x-4 sm:space-x-8 w-full sm:w-auto">
                <TabsTrigger
                  value="details"
                  className="bg-transparent border-0 rounded-none px-0 pb-3 pt-3 sm:pb-4 sm:pt-4 font-semibold text-sm sm:text-base text-gray-600 hover:text-gray-900 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none transition-all whitespace-nowrap"
                >
                  <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Details</span>
                  <span className="sm:hidden">Info</span>
                </TabsTrigger>
                <TabsTrigger
                  value="invoices"
                  className="bg-transparent border-0 rounded-none px-0 pb-3 pt-3 sm:pb-4 sm:pt-4 font-semibold text-sm sm:text-base text-gray-600 hover:text-gray-900 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none transition-all whitespace-nowrap"
                >
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  Invoices
                  <span className="ml-1 sm:ml-2 text-xs bg-gray-200 text-gray-700 px-1.5 sm:px-2 py-0.5 rounded-full">
                    {invoiceSummary.total || 0}
                  </span>
                </TabsTrigger>
                <TabsTrigger
                  value="transactions"
                  className="bg-transparent border-0 rounded-none px-0 pb-3 pt-3 sm:pb-4 sm:pt-4 font-semibold text-sm sm:text-base text-gray-600 hover:text-gray-900 data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none transition-all whitespace-nowrap"
                >
                  <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Transactions</span>
                  <span className="sm:hidden">Trans</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Details Tab */}
            <TabsContent value="details" className="p-0 max-w-full">
              {/* Financial Overview */}
              <div className="p-4 sm:p-6 lg:p-8 border-b bg-white">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 sm:mb-6">Financial Overview</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {/* Current Balance */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Outstanding</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                      ₦{(financial.currentBalance || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Account Balance</p>
                  </div>

                  {/* Total Paid */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Collected</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                      ₦{(financial.totalPaid || 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">Total Paid</p>
                  </div>

                  {/* Total Debt */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Debt</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                      ₦{(financial.totalDebt || 0).toLocaleString()}
                    </p>
                    {financial.backlogAmount > 0 && (
                      <p className="text-xs text-gray-500">₦{(financial.backlogAmount || 0).toLocaleString()} backlog</p>
                    )}
                  </div>

                  {/* Collection Rate */}
                  <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5">
                    <div className="flex items-center gap-2 mb-2 sm:mb-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Collection Rate</span>
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
                      {financial.totalDebt > 0
                        ? Math.round((financial.totalPaid / financial.totalDebt) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-gray-500">Payment Efficiency</p>
                  </div>
                </div>

                {/* Print Statement Button - only show if there's outstanding balance */}
                {financial.currentBalance > 0 && (
                  <div className="mt-4 flex justify-end">
                    <Button
                      onClick={() => navigate(`/billing/customer-statement/${details.customerId}`)}
                      className="bg-green-600 hover:bg-green-700 gap-2"
                    >
                      <Printer className="h-4 w-4" />
                      Print Statement (₦{(financial.currentBalance || 0).toLocaleString()} owed)
                    </Button>
                  </div>
                )}
              </div>

              {/* Invoice Summary & Customer Info */}
              <div className="p-4 sm:p-6 lg:p-8 grid gap-4 sm:gap-6 lg:grid-cols-2 border-b">
                {/* Invoice Summary */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 sm:mb-6">Invoice Summary</h3>

                  <div className="mb-6">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Paid', value: invoiceSummary.paid || 0, color: '#10b981' },
                            { name: 'Pending', value: invoiceSummary.pending || 0, color: '#f59e0b' },
                            { name: 'Overdue', value: invoiceSummary.overdue || 0, color: '#ef4444' },
                            ...(invoiceSummary.partiallyPaid > 0 ? [{ name: 'Partially Paid', value: invoiceSummary.partiallyPaid, color: '#3b82f6' }] : [])
                          ].filter(item => item.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {[
                            { name: 'Paid', value: invoiceSummary.paid || 0, color: '#10b981' },
                            { name: 'Pending', value: invoiceSummary.pending || 0, color: '#f59e0b' },
                            { name: 'Overdue', value: invoiceSummary.overdue || 0, color: '#ef4444' },
                            ...(invoiceSummary.partiallyPaid > 0 ? [{ name: 'Partially Paid', value: invoiceSummary.partiallyPaid, color: '#3b82f6' }] : [])
                          ].filter(item => item.value > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-gray-600">Total Invoices</span>
                      <span className="text-sm font-semibold text-gray-900">{invoiceSummary.total || 0}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-sm text-gray-600">Total Amount</span>
                      <span className="text-sm font-semibold text-gray-900">₦{(invoiceSummary.totalAmount || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-sm text-gray-600">Paid</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{invoiceSummary.paid || 0} invoices</p>
                        <p className="text-xs text-gray-500">₦{(invoiceSummary.paidAmount || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                        <span className="text-sm text-gray-600">Pending</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{invoiceSummary.pending || 0} invoices</p>
                        <p className="text-xs text-gray-500">₦{(invoiceSummary.pendingAmount || 0).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="text-sm text-gray-600">Overdue</span>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{invoiceSummary.overdue || 0} invoices</p>
                        <p className="text-xs text-gray-500">₦{(invoiceSummary.overdueAmount || 0).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 sm:mb-6">Customer Information</h3>

                  <div className="space-y-4">
                    {/* QR Code Section */}
                    <div className="flex justify-center pb-4 border-b border-gray-200">
                      <div className="text-center">
                        <div className="bg-white p-3 rounded-lg border-2 border-primary/20 inline-block mb-2">
                          <QRCodeSVG
                            value={details.accountNumber}
                            size={120}
                            level="H"
                            includeMargin={false}
                            fgColor="#000000"
                            bgColor="#ffffff"
                          />
                        </div>
                        <p className="text-xs text-gray-500 font-medium">Scan for Account Info</p>
                      </div>
                    </div>

                    {/* Customer Type */}
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">Customer Type</p>
                        <Badge variant="outline" className="capitalize">
                          {details.customerType || 'standalone'}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">Email Address</p>
                        <p className="text-sm font-medium text-gray-900 truncate">{details.email || 'N/A'}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                        <p className="text-sm font-medium text-gray-900">{details.phone || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Ward & Street */}
                    <div className="flex items-start gap-3">
                      <Navigation className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">Ward / Street</p>
                        <p className="text-sm font-medium text-gray-900">
                          {details.wardId?.name || details.ward?.name || 'Not set'}
                          {(details.streetId?.name || details.street?.name) && (
                            <span className="text-gray-600"> / {details.streetId?.name || details.street?.name}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-500 mb-1">Address</p>
                        <p className="text-sm font-medium text-gray-900">{details.address || 'N/A'}</p>
                        {(details.city || details.state || details.lga) && (
                          <p className="text-sm text-gray-600 mt-1">
                            {[details.lga, details.city, details.state].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* Property Breakdown */}
              <div className="p-4 sm:p-6 lg:p-8 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-gray-900">Property Breakdown</h3>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Estimated Monthly Bill</p>
                    <p className="text-lg font-bold text-green-600">
                      ₦{(details.expectedBill || 0).toLocaleString()}
                    </p>
                  </div>
                </div>

                {details.properties && details.properties.length > 0 ? (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Property Type</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {details.properties.map((prop: any, index: number) => (
                          <tr key={index}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <Home className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">{prop.propertyTypeName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center text-sm text-gray-600">{prop.quantity}</td>
                            <td className="px-4 py-3 text-right text-sm text-gray-600">₦{(prop.costPerUnit || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">₦{(prop.subtotal || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-green-50">
                        <tr>
                          <td colSpan={3} className="px-4 py-3 text-right text-sm font-semibold text-green-800">Total Estimated Bill</td>
                          <td className="px-4 py-3 text-right text-lg font-bold text-green-700">₦{(details.expectedBill || 0).toLocaleString()}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                    <Home className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No properties configured</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Edit Customer" to add property types</p>
                  </div>
                )}
              </div>

              {/* Services Enrolled */}
              {services.length > 0 && (
                <div className="p-4 sm:p-6 lg:p-8">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4 sm:mb-6">
                    Services Enrolled ({services.length})
                  </h3>

                  <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {services.map((service: any) => (
                      <div key={service.enrollmentId} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1">{service.serviceName}</h4>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-gray-500">
                                {service.amountType}
                              </span>
                              <span className="text-xs text-gray-400">•</span>
                              <span className="text-xs text-gray-500">
                                {service.billingFrequency}
                              </span>
                            </div>
                          </div>
                          <Badge variant={service.isActive ? "default" : "secondary"} className="text-xs">
                            {service.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>

                        {/* Auto-generate Status */}
                        <div className="mb-3 pb-3 border-b">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-700">Auto-generate Invoices</span>
                            <Switch
                              checked={service.autoGenerateInvoices}
                              onCheckedChange={() => handleToggleAutoGenerate(
                                service.collectionId,
                                service.enrollmentId,
                                service.autoGenerateInvoices
                              )}
                              disabled={togglingService === service.enrollmentId}
                              className="data-[state=checked]:bg-green-600"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Amount</span>
                            <span className="font-semibold text-gray-900">₦{service.amount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Cycle Joined</span>
                            <span className="font-medium text-gray-900">{service.cycleJoined}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Enrolled Date</span>
                            <span className="font-medium text-gray-900">
                              {format(new Date(service.enrollmentDate), "MMM dd, yyyy")}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Invoices</span>
                            <span className="font-medium text-gray-900">{service.totalInvoicesPaid}/{service.totalInvoicesGenerated}</span>
                          </div>

                          <div className="pt-2 mt-2 border-t space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Total Invoiced</span>
                              <span className="text-xs font-semibold text-gray-900">₦{(service.totalAmountInvoiced || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Total Paid</span>
                              <span className="text-xs font-semibold text-gray-900">₦{(service.totalAmountPaid || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-500">Outstanding</span>
                              <span className="text-xs font-semibold text-gray-900">₦{(service.outstandingBalance || 0).toLocaleString()}</span>
                            </div>
                          </div>

                          {/* Only show next invoice date if auto-generate is ON */}
                          {service.autoGenerateInvoices && service.nextInvoiceDate && (
                            <div className="flex justify-between items-center pt-2 border-t">
                              <span className="text-xs text-gray-500">Next Invoice</span>
                              <span className="text-xs font-medium text-gray-900">{format(new Date(service.nextInvoiceDate), "MMM dd, yyyy")}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Invoices Tab */}
            <TabsContent value="invoices" className="p-0 max-w-full">
              {invoicesLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading invoices...</p>
                </div>
              ) : (
                <DataTable
                    columns={invoiceColumns}
                    data={invoices}
                    pagination={{
                    currentPage: invoicePage,
                    totalPages: invoiceTotalPages,
                    totalItems: invoiceTotal,
                    itemsPerPage: 20,
                  }}
                  onPageChange={setInvoicePage}
                  emptyMessage="No invoices found for this customer"
                />
              )}
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="p-0 max-w-full">
              {transactionsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="text-gray-500 mt-4">Loading transactions...</p>
                </div>
              ) : (
                <DataTable
                    columns={transactionColumns}
                    data={transactions}
                    pagination={{
                    currentPage: transactionPage,
                    totalPages: transactionTotalPages,
                    totalItems: transactionTotal,
                    itemsPerPage: 20,
                  }}
                  onPageChange={setTransactionPage}
                  emptyMessage="No transactions found for this customer"
                />
              )}
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default CustomerDetails;
