import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { DataTable } from "@/components/shared";
import type { Column } from "@/components/shared";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";
import { CheckCircle2, XCircle } from "lucide-react";

const Pickups = () => {
  const { accessToken } = useAuth();
  const [pickups, setPickups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);

  useEffect(() => {
    fetchPickups();
  }, [accessToken, limit]);

  const fetchPickups = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await apiService.getAllPickups(accessToken, limit);
      setPickups(response || []);
    } catch (error: any) {
      console.error("Error fetching pickups:", error);
      toast.error(error.message || "Failed to load pickups");
    } finally {
      setLoading(false);
    }
  };

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
        <div>
          <p className="font-medium text-gray-900">{pickup.customer?.name || 'N/A'}</p>
          <p className="text-xs text-gray-500 font-mono">{pickup.customer?.accountNumber || ''}</p>
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
            <Select value={limit.toString()} onValueChange={(value) => setLimit(Number(value))}>
              <SelectTrigger className="w-32">
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

        {/* Main Content Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-full overflow-hidden">
          {/* Data Table */}
          <DataTable
            columns={columns}
            data={pickups}
            loading={loading}
            emptyMessage="No pickups found. Pickups will appear here when agents confirm waste collections."
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Pickups;
