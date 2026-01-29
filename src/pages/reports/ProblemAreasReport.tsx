import React, { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Download, MapPin, Users } from "lucide-react";

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

const ProblemAreasReport = () => {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [wards, setWards] = useState<AreaData[]>([]);
  const [streets, setStreets] = useState<AreaData[]>([]);
  const [leakage, setLeakage] = useState<LeakageData | null>(null);
  const [activeTab, setActiveTab] = useState("wards");

  useEffect(() => {
    fetchProblemAreasData();
  }, [accessToken]);

  const fetchProblemAreasData = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await apiService.getProblemAreasReport(accessToken);
      setWards(response?.wards || []);
      setStreets(response?.streets || []);
      setLeakage(response?.leakage || null);
    } catch (error: any) {
      console.error("Error fetching problem areas data:", error);
      toast.error(error.message || "Failed to load problem areas report");
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

  const getRateBadge = (rate: number) => {
    if (rate < 40) return <Badge className="bg-red-600 text-white text-xs">{rate.toFixed(0)}%</Badge>;
    if (rate < 60) return <Badge className="bg-orange-500 text-white text-xs">{rate.toFixed(0)}%</Badge>;
    if (rate < 80) return <Badge className="bg-yellow-500 text-white text-xs">{rate.toFixed(0)}%</Badge>;
    return <Badge className="bg-green-600 text-white text-xs">{rate.toFixed(0)}%</Badge>;
  };

  const sortedWards = [...wards].sort((a, b) => a.collectionRate - b.collectionRate);
  const sortedStreets = [...streets].sort((a, b) => a.collectionRate - b.collectionRate);

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Problem Areas</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Areas ranked by collection rate - where to deploy agents
            </p>
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Leakage Summary */}
        {loading ? (
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20" />)}
          </div>
        ) : leakage && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 font-medium">Expected</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{formatCurrency(leakage.expectedRevenue)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 font-medium">Collected</p>
                <p className="text-lg font-bold text-green-600 mt-0.5">{formatCurrency(leakage.actualCollected)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 font-medium">Uncollected</p>
                <p className="text-lg font-bold text-red-600 mt-0.5">{formatCurrency(leakage.leakageAmount)}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs text-gray-500 font-medium">Leakage Rate</p>
                <p className="text-lg font-bold text-red-600 mt-0.5">{leakage.leakagePercent.toFixed(1)}%</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs for Wards/Streets */}
        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="border-b px-4 py-3">
              <TabsList className="grid w-full grid-cols-2 max-w-xs">
                <TabsTrigger value="wards">Wards ({wards.length})</TabsTrigger>
                <TabsTrigger value="streets">Streets ({streets.length})</TabsTrigger>
              </TabsList>
            </div>

            {loading ? (
              <div className="p-4 space-y-2">
                {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : (
              <>
                <TabsContent value="wards" className="m-0">
                  {sortedWards.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">No ward data available</div>
                  ) : (
                    <div className="divide-y">
                      {sortedWards.map((ward) => (
                        <AreaRow key={ward.id} area={ward} formatCurrency={formatCurrency} getRateBadge={getRateBadge} />
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="streets" className="m-0">
                  {sortedStreets.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">No street data available</div>
                  ) : (
                    <div className="divide-y">
                      {sortedStreets.map((street) => (
                        <AreaRow key={street.id} area={street} formatCurrency={formatCurrency} getRateBadge={getRateBadge} />
                      ))}
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        </Card>
      </div>
    </DashboardLayout>
  );
};

const AreaRow = ({
  area,
  formatCurrency,
  getRateBadge
}: {
  area: AreaData;
  formatCurrency: (amount: number) => string;
  getRateBadge: (rate: number) => React.ReactElement;
}) => (
  <div className="px-4 py-3 hover:bg-gray-50 flex items-center gap-4">
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4 text-gray-400" />
        <p className="font-medium text-gray-900 truncate">{area.name}</p>
        {getRateBadge(area.collectionRate)}
      </div>
      <div className="flex items-center gap-4 mt-0.5 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          {area.customerCount} customers
        </span>
        <span className="text-red-500">{area.debtorCount} with debt</span>
      </div>
    </div>
    <div className="text-right shrink-0">
      <p className="font-semibold text-red-600">{formatCurrency(area.totalDebt)}</p>
      <p className="text-xs text-gray-400">avg {formatCurrency(area.avgDebtPerCustomer)}/debtor</p>
    </div>
  </div>
);

export default ProblemAreasReport;
