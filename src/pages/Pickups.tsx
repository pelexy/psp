import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DataTable } from "@/components/shared";
import type { Column } from "@/components/shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Filter, X, Search } from "lucide-react";

const Pickups = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();
  const [pickups, setPickups] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setLoadingAgents] = useState(true);

  // Filters
  const [limit, setLimit] = useState(50);
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchAgents();
  }, [accessToken]);

  useEffect(() => {
    fetchPickups();
  }, [accessToken, limit, selectedAgent, startDate, endDate]);

  const fetchAgents = async () => {
    if (!accessToken) return;

    setLoadingAgents(true);
    try {
      const response = await apiService.getAllStaff(accessToken);
      setAgents(response || []);
    } catch (error: any) {
      console.error("Error fetching agents:", error);
    } finally {
      setLoadingAgents(false);
    }
  };

  const fetchPickups = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await apiService.getAllPickups(accessToken, {
        limit,
        staffId: selectedAgent || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      setPickups(response || []);
    } catch (error: any) {
      console.error("Error fetching pickups:", error);
      toast.error(error.message || "Failed to load pickups");
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedAgent("");
    setStartDate("");
    setEndDate("");
  };

  const hasActiveFilters = selectedAgent || startDate || endDate;

  const columns: Column<any>[] = [
    {
      key: "collectionDate",
      header: "Date & Time",
      accessor: (pickup) => (
        <div>
          <p className="font-medium text-gray-900">
            {pickup.collectionDate ? format(new Date(pickup.collectionDate), "MMM dd, yyyy") : 'N/A'}
          </p>
          <p className="text-xs text-gray-500">
            {pickup.collectionDate ? format(new Date(pickup.collectionDate), "HH:mm") : ''}
          </p>
        </div>
      ),
    },
    {
      key: "customer",
      header: "Customer",
      accessor: (pickup) => (
        <div
          className={pickup.customer?.id ? "cursor-pointer hover:bg-gray-50 -m-2 p-2 rounded transition-colors" : ""}
          onClick={(e) => {
            if (pickup.customer?.id) {
              e.stopPropagation();
              navigate(`/customers/${pickup.customer.id}`);
            }
          }}
        >
          <p className={`font-medium ${pickup.customer?.id ? "text-blue-600 hover:text-blue-800" : "text-gray-900"}`}>
            {pickup.customer?.name || 'N/A'}
          </p>
          <p className="text-xs text-gray-500">{pickup.customer?.phone || ''}</p>
        </div>
      ),
    },
    {
      key: "staff",
      header: "Agent",
      accessor: (pickup) => (
        <div>
          <p className="font-medium text-gray-900">{pickup.staff?.name || 'N/A'}</p>
          <p className="text-xs text-gray-500 font-mono">{pickup.staff?.staffId || ''}</p>
        </div>
      ),
    },
    {
      key: "location",
      header: "Location",
      accessor: (pickup) => (
        <span className="text-gray-700 text-sm">{pickup.location || 'N/A'}</span>
      ),
    },
    {
      key: "notes",
      header: "Notes",
      accessor: (pickup) => (
        <span className="text-gray-600 text-sm italic">
          {pickup.notes || '-'}
        </span>
      ),
    },
    {
      key: "emailSent",
      header: "Email Status",
      accessor: (pickup) => (
        <div className="flex items-center gap-1">
          {pickup.emailSent ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-xs text-green-600 font-medium">Sent</span>
            </>
          ) : (
            <>
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-xs text-red-600 font-medium">Failed</span>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 lg:space-y-8 bg-gradient-to-br from-background via-background to-accent/5 max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Waste Collection Pickups</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              All pickups confirmed by field agents • {pickups.length} pickups
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={showFilters ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filters
              {hasActiveFilters && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-white text-blue-600 rounded-full">
                  {[selectedAgent, startDate, endDate].filter(Boolean).length}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="animate-in fade-in slide-in-from-top-2 duration-300">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Agent Filter */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Field Agent</Label>
                  <Select value={selectedAgent || "all"} onValueChange={(val) => setSelectedAgent(val === "all" ? "" : val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Agents" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Agents</SelectItem>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.id}>
                          {agent.fullName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">From Date</Label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">To Date</Label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>

                {/* Limit */}
                <div className="space-y-2">
                  <Label className="text-sm text-gray-600">Records</Label>
                  <Select value={limit.toString()} onValueChange={(value) => setLimit(Number(value))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Limit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25 records</SelectItem>
                      <SelectItem value="50">50 records</SelectItem>
                      <SelectItem value="100">100 records</SelectItem>
                      <SelectItem value="200">200 records</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filter Actions */}
              {hasActiveFilters && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Search className="h-4 w-4" />
                    Showing filtered results
                  </div>
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-gray-500">
                    <X className="h-4 w-4" />
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-full overflow-hidden">
          {/* Data Table */}
          <DataTable
            columns={columns}
            data={pickups}
            loading={loading}
            emptyMessage={
              hasActiveFilters
                ? "No pickups found matching your filters."
                : "No pickups found. Pickups will appear here when agents confirm waste collections."
            }
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Pickups;
