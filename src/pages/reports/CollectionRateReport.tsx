import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Filter, FileSpreadsheet, AlertTriangle, Users, TrendingDown, Percent, ChevronLeft, ChevronRight } from "lucide-react";

interface CustomerCollection {
  id: string;
  name: string;
  accountNumber: string;
  phone: string;
  ward: string;
  street: string;
  agent: string | null;
  totalBilled: number;
  totalPaid: number;
  collectionRate: number;
  lastPaymentDate: string | null;
  monthsWithoutPayment: number;
}

interface Ward {
  _id: string;
  name: string;
}

interface Street {
  _id: string;
  name: string;
}

interface Staff {
  _id: string;
  fullName: string;
}

const ITEMS_PER_PAGE = 50;

const CollectionRateReport = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerCollection[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Filters - default 50% threshold
  const [threshold, setThreshold] = useState<string>("50");
  const [wardId, setWardId] = useState<string>("");
  const [streetId, setStreetId] = useState<string>("");
  const [agentId, setAgentId] = useState<string>("");

  // Dropdown data
  const [wards, setWards] = useState<Ward[]>([]);
  const [streets, setStreets] = useState<Street[]>([]);
  const [agents, setAgents] = useState<Staff[]>([]);

  const extractArray = (res: any, ...keys: string[]): any[] => {
    if (Array.isArray(res)) return res;
    for (const key of keys) {
      if (res?.[key] && Array.isArray(res[key])) return res[key];
    }
    return [];
  };

  useEffect(() => {
    const fetchFilterOptions = async () => {
      if (!accessToken) return;
      try {
        const [wardsRes, streetsRes, staffRes] = await Promise.all([
          apiService.getActiveWards(accessToken),
          apiService.getStreets(accessToken),
          apiService.getAllStaff(accessToken),
        ]);
        setWards(extractArray(wardsRes, 'wards', 'data'));
        setStreets(extractArray(streetsRes, 'streets', 'data'));
        setAgents(extractArray(staffRes, 'staff', 'data'));
      } catch (error) {
        console.error("Error fetching filter options:", error);
      }
    };
    fetchFilterOptions();
  }, [accessToken]);

  useEffect(() => {
    fetchCollectionData();
  }, [accessToken, threshold, wardId, streetId, agentId]);

  const fetchCollectionData = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await apiService.getCollectionRateReport(accessToken, {
        threshold: parseInt(threshold),
        wardId: wardId || undefined,
        streetId: streetId || undefined,
        agentId: agentId || undefined,
      });
      setCustomers(response?.customers || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to load report");
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [threshold, wardId, streetId, agentId]);

  // Pagination
  const totalPages = Math.ceil(customers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCustomers = customers.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Summary stats
  const criticalCount = customers.filter(c => c.collectionRate < 25).length;
  const poorCount = customers.filter(c => c.collectionRate >= 25 && c.collectionRate < 50).length;
  const belowAvgCount = customers.filter(c => c.collectionRate >= 50 && c.collectionRate < 75).length;
  const totalOutstanding = customers.reduce((sum, c) => sum + (c.totalBilled - c.totalPaid), 0);
  const avgCollectionRate = customers.length > 0
    ? customers.reduce((sum, c) => sum + c.collectionRate, 0) / customers.length
    : 0;

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "S/N",
      "Account Number",
      "Customer Name",
      "Phone",
      "Ward",
      "Street",
      "Agent",
      "Total Billed (NGN)",
      "Total Paid (NGN)",
      "Outstanding (NGN)",
      "Collection Rate (%)",
      "Last Payment Date",
      "Months Without Payment"
    ];

    const rows = customers.map((c, index) => [
      index + 1,
      c.accountNumber,
      c.name,
      c.phone || "-",
      c.ward || "-",
      c.street || "-",
      c.agent || "-",
      c.totalBilled,
      c.totalPaid,
      c.totalBilled - c.totalPaid,
      c.collectionRate.toFixed(1),
      c.lastPaymentDate ? new Date(c.lastPaymentDate).toLocaleDateString() : "Never",
      c.monthsWithoutPayment
    ]);

    const csvContent = [
      `COLLECTION RATE REPORT`,
      `Generated: ${new Date().toLocaleString()}`,
      `Filter: Below ${threshold}% collection rate`,
      `Total Customers: ${customers.length}`,
      `Average Collection Rate: ${avgCollectionRate.toFixed(1)}%`,
      `Total Outstanding: ${formatCurrency(totalOutstanding)}`,
      ``,
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `collection_rate_report_below_${threshold}pct_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Report exported successfully");
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Collection Rate Report</h1>
            <p className="text-sm text-gray-500 mt-1">
              Customers with low payment collection rates
            </p>
          </div>
          <Button onClick={exportToCSV} className="gap-2" disabled={loading || customers.length === 0}>
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Critical (&lt;25%)</p>
                    <p className="text-2xl font-bold text-red-600 mt-1">{criticalCount}</p>
                    <p className="text-xs text-gray-500">customers</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-red-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Poor (25-50%)</p>
                    <p className="text-2xl font-bold text-orange-600 mt-1">{poorCount}</p>
                    <p className="text-xs text-gray-500">customers</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-orange-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Below Avg (50-75%)</p>
                    <p className="text-2xl font-bold text-yellow-600 mt-1">{belowAvgCount}</p>
                    <p className="text-xs text-gray-500">customers</p>
                  </div>
                  <Percent className="h-8 w-8 text-yellow-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Avg. Collection</p>
                    <p className="text-2xl font-bold text-blue-600 mt-1">{avgCollectionRate.toFixed(1)}%</p>
                    <p className="text-xs text-gray-500">rate</p>
                  </div>
                  <Percent className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Total Outstanding</p>
                    <p className="text-lg font-bold text-purple-600 mt-1">{formatCurrency(totalOutstanding)}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-500 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Report Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Collection Rate Below</label>
                <Select value={threshold} onValueChange={setThreshold}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25% (Critical)</SelectItem>
                    <SelectItem value="50">50% (Poor)</SelectItem>
                    <SelectItem value="75">75% (Below Avg)</SelectItem>
                    <SelectItem value="100">100% (All)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Ward</label>
                <Select value={wardId || "all"} onValueChange={(v) => setWardId(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Wards" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Wards</SelectItem>
                    {wards.map((ward) => (
                      <SelectItem key={ward._id} value={ward._id}>{ward.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Street</label>
                <Select value={streetId || "all"} onValueChange={(v) => setStreetId(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Streets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Streets</SelectItem>
                    {streets.map((street) => (
                      <SelectItem key={street._id} value={street._id}>{street.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Collection Agent</label>
                <Select value={agentId || "all"} onValueChange={(v) => setAgentId(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Agents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent._id} value={agent._id}>{agent.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Table */}
        <Card>
          <CardHeader className="border-b bg-gray-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Low Collection Rate Customers
                <span className="text-gray-400 font-normal ml-2">
                  ({customers.length.toLocaleString()} records below {threshold}%)
                </span>
              </CardTitle>
              <p className="text-sm font-semibold text-blue-600">
                Avg Rate: {avgCollectionRate.toFixed(1)}%
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : customers.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No customers found below {threshold}% collection rate</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-16 font-semibold">S/N</TableHead>
                      <TableHead className="font-semibold">Account No.</TableHead>
                      <TableHead className="font-semibold">Customer Name</TableHead>
                      <TableHead className="font-semibold">Phone</TableHead>
                      <TableHead className="font-semibold">Ward</TableHead>
                      <TableHead className="font-semibold">Street</TableHead>
                      <TableHead className="font-semibold">Agent</TableHead>
                      <TableHead className="text-right font-semibold">Total Billed</TableHead>
                      <TableHead className="text-right font-semibold">Total Paid</TableHead>
                      <TableHead className="text-center font-semibold">Collection Rate</TableHead>
                      <TableHead className="text-center font-semibold">Months No Pay</TableHead>
                      <TableHead className="font-semibold">Last Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedCustomers.map((customer, index) => (
                      <TableRow
                        key={customer.id}
                        className="hover:bg-blue-50 cursor-pointer"
                        onClick={() => navigate(`/customers/${customer.accountNumber}`)}
                      >
                        <TableCell className="font-mono text-gray-500">{startIndex + index + 1}</TableCell>
                        <TableCell className="font-mono text-sm text-blue-600 hover:underline">{customer.accountNumber}</TableCell>
                        <TableCell className="font-medium">{customer.name}</TableCell>
                        <TableCell className="text-gray-600">{customer.phone || "-"}</TableCell>
                        <TableCell className="text-gray-600">{customer.ward || "-"}</TableCell>
                        <TableCell className="text-gray-600">{customer.street || "-"}</TableCell>
                        <TableCell className="text-gray-600">{customer.agent || "-"}</TableCell>
                        <TableCell className="text-right text-gray-600">
                          {formatCurrency(customer.totalBilled)}
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          {formatCurrency(customer.totalPaid)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            customer.collectionRate < 25 ? 'bg-red-100 text-red-800' :
                            customer.collectionRate < 50 ? 'bg-orange-100 text-orange-800' :
                            customer.collectionRate < 75 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {customer.collectionRate.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {customer.monthsWithoutPayment > 0 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              {customer.monthsWithoutPayment} mo
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-gray-600">{formatDate(customer.lastPaymentDate)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(endIndex, customers.length)} of {customers.length.toLocaleString()} records
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <div className="flex items-center gap-1">
                        {currentPage > 2 && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => goToPage(1)}>1</Button>
                            {currentPage > 3 && <span className="px-2 text-gray-400">...</span>}
                          </>
                        )}
                        {currentPage > 1 && (
                          <Button variant="outline" size="sm" onClick={() => goToPage(currentPage - 1)}>
                            {currentPage - 1}
                          </Button>
                        )}
                        <Button variant="default" size="sm">{currentPage}</Button>
                        {currentPage < totalPages && (
                          <Button variant="outline" size="sm" onClick={() => goToPage(currentPage + 1)}>
                            {currentPage + 1}
                          </Button>
                        )}
                        {currentPage < totalPages - 1 && (
                          <>
                            {currentPage < totalPages - 2 && <span className="px-2 text-gray-400">...</span>}
                            <Button variant="outline" size="sm" onClick={() => goToPage(totalPages)}>
                              {totalPages}
                            </Button>
                          </>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CollectionRateReport;
