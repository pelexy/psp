import { useState, useEffect } from "react";
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
import { Filter, FileSpreadsheet, AlertTriangle, MapPin, TrendingDown, Banknote, ChevronLeft, ChevronRight } from "lucide-react";

interface AreaData {
  id: string;
  name: string;
  type: "ward" | "street";
  customerCount: number;
  totalDebt: number;
  totalCollected: number;
  collectionRate: number;
  debtorCount: number;
  avgDebtPerCustomer: number;
}

interface LeakageData {
  expectedRevenue: number;
  actualCollected: number;
  leakageAmount: number;
  leakagePercent: number;
}

interface Staff {
  _id: string;
  fullName: string;
}

const ITEMS_PER_PAGE = 50;

const ProblemAreasReport = () => {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [allAreas, setAllAreas] = useState<AreaData[]>([]);
  const [leakage, setLeakage] = useState<LeakageData | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [agentId, setAgentId] = useState<string>("");
  const [agents, setAgents] = useState<Staff[]>([]);

  const extractArray = (res: any, ...keys: string[]): any[] => {
    if (Array.isArray(res)) return res;
    for (const key of keys) {
      if (res?.[key] && Array.isArray(res[key])) return res[key];
    }
    return [];
  };

  useEffect(() => {
    const fetchAgents = async () => {
      if (!accessToken) return;
      try {
        const staffRes = await apiService.getAllStaff(accessToken);
        setAgents(extractArray(staffRes, 'staff', 'data'));
      } catch (error) {
        console.error("Error fetching agents:", error);
      }
    };
    fetchAgents();
  }, [accessToken]);

  useEffect(() => {
    fetchProblemAreasData();
  }, [accessToken, agentId]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, agentId]);

  const fetchProblemAreasData = async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const response = await apiService.getProblemAreasReport(accessToken, {
        agentId: agentId || undefined,
      });

      // Combine wards and streets into one array
      const wards = (response?.wards || []).map((w: any) => ({ ...w, type: "ward" as const }));
      const streets = (response?.streets || []).map((s: any) => ({ ...s, type: "street" as const }));
      const combined = [...wards, ...streets];

      // Sort by collection rate (lowest first = problem areas)
      combined.sort((a, b) => a.collectionRate - b.collectionRate);

      setAllAreas(combined);
      setLeakage(response?.leakage || null);
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

  // Filter by type
  const filteredAreas = allAreas.filter(area => {
    if (typeFilter === "all") return true;
    return area.type === typeFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAreas.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAreas = filteredAreas.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // Summary stats
  const wardCount = allAreas.filter(a => a.type === "ward").length;
  const streetCount = allAreas.filter(a => a.type === "street").length;
  const totalDebt = filteredAreas.reduce((sum, a) => sum + a.totalDebt, 0);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      "Rank",
      "Type",
      "Name",
      "Total Customers",
      "Customers with Debt",
      "Total Debt (NGN)",
      "Total Collected (NGN)",
      "Collection Rate (%)",
      "Avg Debt Per Customer (NGN)"
    ];

    const rows = filteredAreas.map((item, index) => [
      index + 1,
      item.type === "ward" ? "Ward" : "Street",
      item.name,
      item.customerCount,
      item.debtorCount,
      item.totalDebt,
      item.totalCollected,
      item.collectionRate.toFixed(1),
      item.avgDebtPerCustomer
    ]);

    const filterLabel = typeFilter === "all" ? "All Areas" : typeFilter === "ward" ? "Wards Only" : "Streets Only";

    const csvContent = [
      `PROBLEM AREAS REPORT`,
      `Generated: ${new Date().toLocaleString()}`,
      `Filter: ${filterLabel}`,
      `Total Records: ${filteredAreas.length}`,
      `Total Debt: ${formatCurrency(totalDebt)}`,
      leakage ? `Revenue Leakage: ${formatCurrency(leakage.leakageAmount)} (${leakage.leakagePercent.toFixed(1)}%)` : '',
      ``,
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `problem_areas_report_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Report exported successfully");
  };

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Problem Areas Report</h1>
            <p className="text-sm text-gray-500 mt-1">
              Geographic analysis of collection performance by ward and street
            </p>
          </div>
          <Button
            onClick={exportToCSV}
            className="gap-2"
            disabled={loading || filteredAreas.length === 0}
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* Leakage Summary */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : leakage && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Expected Revenue</p>
                    <p className="text-xl font-bold text-blue-600 mt-1">{formatCurrency(leakage.expectedRevenue)}</p>
                  </div>
                  <Banknote className="h-8 w-8 text-blue-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Actual Collected</p>
                    <p className="text-xl font-bold text-green-600 mt-1">{formatCurrency(leakage.actualCollected)}</p>
                  </div>
                  <Banknote className="h-8 w-8 text-green-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Revenue Leakage</p>
                    <p className="text-xl font-bold text-red-600 mt-1">{formatCurrency(leakage.leakageAmount)}</p>
                  </div>
                  <TrendingDown className="h-8 w-8 text-red-500 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-orange-500">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-medium">Leakage Rate</p>
                    <p className="text-xl font-bold text-orange-600 mt-1">{leakage.leakagePercent.toFixed(1)}%</p>
                  </div>
                  <AlertTriangle className="h-8 w-8 text-orange-500 opacity-50" />
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
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Area Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Areas ({wardCount + streetCount})</SelectItem>
                    <SelectItem value="ward">Wards Only ({wardCount})</SelectItem>
                    <SelectItem value="street">Streets Only ({streetCount})</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-1.5 block">Collection Agent Territory</label>
                <Select value={agentId || "all"} onValueChange={(v) => setAgentId(v === "all" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Territories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Territories</SelectItem>
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
                Problem Areas
                <span className="text-gray-400 font-normal ml-2">
                  ({filteredAreas.length} records)
                </span>
              </CardTitle>
              <p className="text-sm text-gray-500">
                Sorted by collection rate (lowest first)
              </p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 space-y-3">
                {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-12" />)}
              </div>
            ) : filteredAreas.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No area data available</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-16 font-semibold">Rank</TableHead>
                        <TableHead className="w-24 font-semibold">Type</TableHead>
                        <TableHead className="font-semibold">Name</TableHead>
                        <TableHead className="text-center font-semibold">Customers</TableHead>
                        <TableHead className="text-center font-semibold">With Debt</TableHead>
                        <TableHead className="text-right font-semibold">Total Debt</TableHead>
                        <TableHead className="text-right font-semibold">Collected</TableHead>
                        <TableHead className="text-center font-semibold">Collection Rate</TableHead>
                        <TableHead className="text-right font-semibold">Avg Debt/Customer</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedAreas.map((area, index) => (
                        <TableRow key={`${area.type}-${area.id}`} className="hover:bg-gray-50">
                          <TableCell className="font-mono text-gray-500">{startIndex + index + 1}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              area.type === "ward" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"
                            }`}>
                              {area.type === "ward" ? "Ward" : "Street"}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              {area.name}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">{area.customerCount}</TableCell>
                          <TableCell className="text-center text-red-600">{area.debtorCount}</TableCell>
                          <TableCell className="text-right text-red-600 font-medium">
                            {formatCurrency(area.totalDebt)}
                          </TableCell>
                          <TableCell className="text-right text-green-600">
                            {formatCurrency(area.totalCollected)}
                          </TableCell>
                          <TableCell className="text-center">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              area.collectionRate < 40 ? 'bg-red-100 text-red-800' :
                              area.collectionRate < 60 ? 'bg-orange-100 text-orange-800' :
                              area.collectionRate < 80 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {area.collectionRate.toFixed(1)}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right text-gray-600">
                            {formatCurrency(area.avgDebtPerCustomer)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
                    <div className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(endIndex, filteredAreas.length)} of {filteredAreas.length.toLocaleString()} records
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
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default ProblemAreasReport;
