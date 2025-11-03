import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

export const DashboardStats = () => {
  const { dashboardData, fetchDashboardData } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchDashboardData();
    } finally {
      setIsRefreshing(false);
    }
  };

  // If no dashboard data is available yet
  if (!dashboardData.pspInfo) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-600">PSP Dashboard data not available</p>
      </div>
    );
  }

  const { pspInfo, lastFetched } = dashboardData;

  return (
    <div className="space-y-4">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">PSP Company Information</h3>
          {lastFetched && (
            <p className="text-xs text-gray-500">
              Last updated: {new Date(lastFetched).toLocaleString()}
            </p>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Display PSP Information */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <p className="text-xs text-gray-500">Company Name</p>
          <p className="text-lg font-bold text-gray-900">
            {pspInfo.companyName}
          </p>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <p className="text-xs text-gray-500">Location</p>
          <p className="text-lg font-bold text-gray-900">
            {pspInfo.location}
          </p>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <p className="text-xs text-gray-500">State/LGA</p>
          <p className="text-lg font-bold text-gray-900">
            {pspInfo.state}, {pspInfo.lga}
          </p>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <p className="text-xs text-gray-500">Contact Person</p>
          <p className="text-lg font-bold text-gray-900">
            {pspInfo.contactPersonName}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {pspInfo.contactPersonPhone}
          </p>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <p className="text-xs text-gray-500">Commission</p>
          <p className="text-lg font-bold text-gray-900">
            {pspInfo.commissionValue}% ({pspInfo.commissionType})
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Paid by: {pspInfo.commissionPayer}
          </p>
        </div>

        <div className="p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <p className="text-xs text-gray-500">Status</p>
          <p className={`text-lg font-bold ${pspInfo.isActive ? 'text-green-600' : 'text-red-600'}`}>
            {pspInfo.isActive ? 'Active' : 'Inactive'}
          </p>
        </div>
      </div>
    </div>
  );
};
