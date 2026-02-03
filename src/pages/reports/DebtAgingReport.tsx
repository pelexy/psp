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
import { Filter, FileSpreadsheet, AlertTriangle, Users, Banknote, ChevronLeft, ChevronRight } from "lucide-react";

interface CustomerDebt {
  id: string;
  name: string;
  accountNumber: string;
  phone: string;
  ward: string | null;
  street: string | null;
  agent: string | null;
  totalDebt: number;
  oldestInvoiceDate: string | null;
  daysOverdue: number;
  bucket: string;
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

const DebtAgingReport = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<CustomerDebt[]>([]);
  const [summary, setSummary] = useState<any>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [minDays, setMinDays] = useState<string>("30");
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
    fetchDebtAgingData();
  }, [accessToken, wardId, streetId, agentId]);

  const fetchDebtAgingData = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await apiService.getDebtAgingReport(accessToken, {
        wardId: wardId || undefined,
        streetId: streetId || undefined,
        agentId: agentId || undefined,
      });
      setCustomers(response?.customers || []);
      setSummary({
        current: response?.current || { count: 0, amount: 0 },
        overdue30: response?.overdue30 || { count: 0, amount: 0 },
        overdue60: response?.overdue60 || { count: 0, amount: 0 },
        overdue90: response?.overdue90 || { count: 0, amount: 0 },
      });
    } catch (error: any) {
      toast.error(error.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [minDays, wardId, streetId, agentId]);

  // Filter by minimum days
  const filteredCustomers = customers.filter(c => c.daysOverdue >= parseInt(minDays));

  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCustomers = filteredCustomers.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const totalDebt = filteredCustomers.reduce((sum, c) => sum + c.totalDebt, 0);

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
      "Outstanding Balance (NGN)",
      "Days Overdue",
      "Oldest Invoice Date",
      "Status"
    ];

    const rows = filteredCustomers.map((c, index) => [
      index + 1,
      c.accountNumber,
      c.name,
      c.phone || "-",
      c.ward || "-",
      c.street || "-",
      c.agent || "-",
      c.totalDebt,
      c.daysOverdue,
      c.oldestInvoiceDate ? new Date(c.oldestInvoiceDate).toLocaleDateString() : "-",
      c.bucket
    ]);

    const csvContent = [
      `DEBT AGING REPORT`,
      `Generated: ${new Date().toLocaleString()}`,
      `Filter: ${minDays}+ days overdue`,
      `Total Customers: ${filteredCustomers.length}`,
      `Total Outstanding: ${formatCurrency(totalDebt)}`,
      ``,
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `debt_aging_report_${minDays}days_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Report exported successfully");
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Debt Aging Report</h1>
            <p className="text-sm text-gray-500 mt-1">
              Analysis of outstanding customer debts by aging period
            </p>
          </div>
          <Button onClick={exportToCSV} className="gap-2" disabled={loading || filteredCustomers.length === 0}>
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Summary Cards */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Current (0-30 days)</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{formatCurrency(summary?.current.amount || 0)}</p>
                    <p className="text-xs text-gray-500 mt-1">{summary?.current.count || 0} customers</p>
                  </div>
                  <Users className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Overdue (31-60 days)</p>
                    <p className="text-xl font-bold text-yellow-600 mt-1">{formatCurrency(summary?.overdue30.amount || 0)}</p>
                    <p className="text-xs text-gray-500 mt-1">{summary?.overdue30.count || 0} customers</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-yellow-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Serious (61-90 days)</p>
                    <p className="text-xl font-bold text-orange-600 mt-1">{formatCurrency(summary?.overdue60.amount || 0)}</p>
                    <p className="text-xs text-gray-500 mt-1">{summary?.overdue60.count || 0} customers</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Critical (90+ days)</p>
                    <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(summary?.overdue90.amount || 0)}</p>
                    <p className="text-xs text-gray-500 mt-1">{summary?.overdue90.count || 0} customers</p>
                  </div>
                  <Banknote className="h-8 w-8 text-red-500 opacity-50" />
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
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Minimum Days Overdue</label>
                <Select value={minDays} onValueChange={setMinDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">All (0+ days)</SelectItem>
                    <SelectItem value="30">30+ days</SelectItem>
                    <SelectItem value="60">60+ days</SelectItem>
                    <SelectItem value="90">90+ days</SelectItem>
                    <SelectItem value="180">180+ days</SelectItem>
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
                Detailed Customer List
                <span className="text-gray-400 font-normal ml-2">
                  ({filteredCustomers.length} records)
                </span>
              </CardTitle>
              <p className="text-sm font-semibold text-red-600">
                Total: {formatCurrency(totalDebt)}
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No customers found with {minDays}+ days overdue</p>
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
                      <TableHead className="text-right font-semibold">Outstanding (NGN)</TableHead>
                      <TableHead className="text-center font-semibold">Days Overdue</TableHead>
                      <TableHead className="font-semibold">Oldest Invoice</TableHead>
                      <TableHead className="font-semibold">Status</TableHead>
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
                        <TableCell className="text-right font-semibold text-red-600">
                          {formatCurrency(customer.totalDebt)}
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            customer.daysOverdue > 90 ? 'bg-red-100 text-red-800' :
                            customer.daysOverdue > 60 ? 'bg-orange-100 text-orange-800' :
                            customer.daysOverdue > 30 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {customer.daysOverdue} days
                          </span>
                        </TableCell>
                        <TableCell className="text-gray-600">{formatDate(customer.oldestInvoiceDate)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            customer.bucket === 'Critical' ? 'bg-red-100 text-red-800' :
                            customer.bucket === 'Seriously Overdue' ? 'bg-orange-100 text-orange-800' :
                            customer.bucket === 'Overdue' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {customer.bucket}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredCustomers.length)} of {filteredCustomers.length.toLocaleString()} records
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

export default DebtAgingReport;
