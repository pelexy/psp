import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Loader2,
  ArrowLeft,
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  Users,
  Truck,
  Wallet,
  X,
  Save,
  Calendar,
  Clock,
  CheckCircle,
} from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

interface Ward {
  _id: string;
  name: string;
}

interface Street {
  _id: string;
  name: string;
  wardId: string | { _id: string; name: string };
}

const AgentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<any>(null);

  // Territory editing
  const [wards, setWards] = useState<Ward[]>([]);
  const [streets, setStreets] = useState<Street[]>([]);
  const [selectedWards, setSelectedWards] = useState<string[]>([]);
  const [selectedStreets, setSelectedStreets] = useState<string[]>([]);
  const [isEditingTerritory, setIsEditingTerritory] = useState(false);
  const [saving, setSaving] = useState(false);

  // Collections pagination
  const [collectionsPage, setCollectionsPage] = useState(1);
  const collectionsPerPage = 10;

  useEffect(() => {
    if (id && accessToken) {
      loadAgentDetails();
      loadWardAndStreets();
    }
  }, [id, accessToken]);

  const loadAgentDetails = async () => {
    if (!accessToken || !id) return;

    setLoading(true);
    try {
      const response = await apiService.getStaffById(accessToken, id);
      setAgent(response);
      setSelectedWards(response.assignedWards?.map((w: any) => w._id) || []);
      setSelectedStreets(response.assignedStreets?.map((s: any) => s._id) || []);
    } catch (error: any) {
      console.error("Error loading agent:", error);
      toast.error(error.message || "Failed to load agent details");
    } finally {
      setLoading(false);
    }
  };

  const loadWardAndStreets = async () => {
    if (!accessToken) return;

    try {
      const [wardsRes, streetsRes] = await Promise.all([
        apiService.getActiveWards(accessToken),
        apiService.getStreets(accessToken),
      ]);

      setWards(wardsRes?.data || []);
      setStreets(streetsRes?.data || []);
    } catch (error) {
      console.error("Failed to load wards/streets:", error);
    }
  };

  const handleSaveTerritory = async () => {
    if (!accessToken || !id) return;

    setSaving(true);
    try {
      await apiService.updateStaffTerritory(accessToken, id, {
        assignedWards: selectedWards,
        assignedStreets: selectedStreets,
      });

      toast.success("Territory updated successfully");
      setIsEditingTerritory(false);
      // Reload without showing full loading state
      const response = await apiService.getStaffById(accessToken, id);
      setAgent(response);
    } catch (error: any) {
      console.error("Error updating territory:", error);
      toast.error(error.message || "Failed to update territory");
    } finally {
      setSaving(false);
    }
  };

  const handleAddWard = (wardId: string) => {
    if (!selectedWards.includes(wardId)) {
      setSelectedWards([...selectedWards, wardId]);
    }
  };

  const handleRemoveWard = (wardId: string) => {
    setSelectedWards(selectedWards.filter((wid) => wid !== wardId));
  };

  const handleAddStreet = (streetId: string) => {
    if (!selectedStreets.includes(streetId)) {
      setSelectedStreets([...selectedStreets, streetId]);
    }
  };

  const handleRemoveStreet = (streetId: string) => {
    setSelectedStreets(selectedStreets.filter((sid) => sid !== streetId));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Paginated collections
  const paginatedCollections = agent?.recentCollections?.slice(
    (collectionsPage - 1) * collectionsPerPage,
    collectionsPage * collectionsPerPage
  ) || [];

  const totalCollectionPages = Math.ceil((agent?.recentCollections?.length || 0) / collectionsPerPage);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </DashboardLayout>
    );
  }

  if (!agent) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Button variant="ghost" onClick={() => navigate("/agents")} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
          <div className="text-center py-12">
            <p className="text-gray-500">Agent not found</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate("/agents")} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Agents
        </Button>

        {/* Agent Header Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {agent.fullName
                    ?.split(" ")
                    .map((n: string) => n[0])
                    .join("")
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{agent.fullName}</h1>
                  <p className="text-sm text-gray-500 font-mono">{agent.staffId}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getStatusColor(agent.status)}>
                      {agent.status}
                    </Badge>
                    <span className="text-xs text-gray-400">
                      Joined {agent.createdAt ? format(new Date(agent.createdAt), "MMM dd, yyyy") : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400" />
                  {agent.email}
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400" />
                  {agent.phone}
                </div>
                {agent.address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {agent.address}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Truck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{agent.performance?.totalPickups || 0}</p>
                  <p className="text-sm text-gray-500">Total Pickups</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{agent.performance?.pickupsThisMonth || 0}</p>
                  <p className="text-sm text-gray-500">This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{agent.performance?.uniqueCustomersServed || 0}</p>
                  <p className="text-sm text-gray-500">Customers Served</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold">{agent.performance?.customersInTerritory || 0}</p>
                  <p className="text-sm text-gray-500">In Territory</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="territory" className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="territory">Territory</TabsTrigger>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="collections">Collections</TabsTrigger>
          </TabsList>

          {/* Territory Tab */}
          <TabsContent value="territory">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Assigned Territory
                </CardTitle>
                {!isEditingTerritory ? (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingTerritory(true)}>
                    Edit Territory
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingTerritory(false);
                        setSelectedWards(agent.assignedWards?.map((w: any) => w._id) || []);
                        setSelectedStreets(agent.assignedStreets?.map((s: any) => s._id) || []);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveTerritory} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                      Save Changes
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {isEditingTerritory ? (
                  <div className="space-y-6">
                    {/* Ward Selection */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Assigned Wards</Label>
                      <Select onValueChange={handleAddWard}>
                        <SelectTrigger className="w-full md:w-80">
                          <SelectValue placeholder="Add a ward..." />
                        </SelectTrigger>
                        <SelectContent>
                          {wards
                            .filter((w) => !selectedWards.includes(w._id))
                            .map((ward) => (
                              <SelectItem key={ward._id} value={ward._id}>
                                {ward.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-2">
                        {selectedWards.map((wardId) => {
                          const ward = wards.find((w) => w._id === wardId);
                          return ward ? (
                            <Badge key={wardId} variant="secondary" className="flex items-center gap-1 py-1 px-3">
                              {ward.name}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-red-500 ml-1"
                                onClick={() => handleRemoveWard(wardId)}
                              />
                            </Badge>
                          ) : null;
                        })}
                        {selectedWards.length === 0 && (
                          <span className="text-sm text-gray-400 italic">No wards assigned</span>
                        )}
                      </div>
                    </div>

                    {/* Street Selection */}
                    <div className="space-y-3">
                      <Label className="text-base font-medium">Assigned Streets</Label>
                      <Select onValueChange={handleAddStreet}>
                        <SelectTrigger className="w-full md:w-80">
                          <SelectValue placeholder="Add a street..." />
                        </SelectTrigger>
                        <SelectContent>
                          {streets
                            .filter((s) => !selectedStreets.includes(s._id))
                            .map((street) => (
                              <SelectItem key={street._id} value={street._id}>
                                {street.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <div className="flex flex-wrap gap-2">
                        {selectedStreets.map((streetId) => {
                          const street = streets.find((s) => s._id === streetId);
                          return street ? (
                            <Badge key={streetId} variant="outline" className="flex items-center gap-1 py-1 px-3">
                              {street.name}
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-red-500 ml-1"
                                onClick={() => handleRemoveStreet(streetId)}
                              />
                            </Badge>
                          ) : null;
                        })}
                        {selectedStreets.length === 0 && (
                          <span className="text-sm text-gray-400 italic">No streets assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <Label className="text-gray-500 text-sm">Wards ({agent.assignedWards?.length || 0})</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {agent.assignedWards?.length > 0 ? (
                          agent.assignedWards.map((ward: any) => (
                            <Badge key={ward._id} variant="secondary" className="py-1 px-3">
                              {ward.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400 italic">No wards assigned</span>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-500 text-sm">Streets ({agent.assignedStreets?.length || 0})</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {agent.assignedStreets?.length > 0 ? (
                          agent.assignedStreets.map((street: any) => (
                            <Badge key={street._id} variant="outline" className="py-1 px-3">
                              {street.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400 italic">No streets assigned</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Revenue Tab */}
          <TabsContent value="revenue">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  Territory Revenue Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agent.performance?.customersInTerritory > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Total Billed</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatCurrency(agent.performance.totalRevenueInTerritory)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        From {agent.performance.customersInTerritory} customers
                      </p>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Total Collected</p>
                      <p className="text-2xl font-bold text-green-600">
                        {formatCurrency(agent.performance.totalPaidInTerritory)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Payments received</p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-500 mb-1">Collection Rate</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {agent.performance.collectionRate}%
                      </p>
                      <p className="text-xs text-gray-400 mt-1">Paid vs Billed</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Wallet className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No territory assigned yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Assign wards or streets to see revenue breakdown
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Waste Collections History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agent.recentCollections?.length > 0 ? (
                  <div className="space-y-4">
                    {/* Collections List */}
                    <div className="space-y-2">
                      {paginatedCollections.map((col: any) => (
                        <div
                          key={col.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-full">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{col.customerName}</p>
                              <p className="text-xs text-gray-500 font-mono">{col.customerAccount}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm text-gray-700">
                              <Calendar className="h-3 w-3" />
                              {col.collectionDate
                                ? format(new Date(col.collectionDate), "MMM dd, yyyy")
                                : "N/A"}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {col.collectionDate
                                ? format(new Date(col.collectionDate), "h:mm a")
                                : ""}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalCollectionPages > 1 && (
                      <div className="flex items-center justify-between pt-4 border-t">
                        <p className="text-sm text-gray-500">
                          Showing {(collectionsPage - 1) * collectionsPerPage + 1} to{" "}
                          {Math.min(collectionsPage * collectionsPerPage, agent.recentCollections.length)} of{" "}
                          {agent.recentCollections.length}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCollectionsPage((p) => Math.max(1, p - 1))}
                            disabled={collectionsPage === 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCollectionsPage((p) => Math.min(totalCollectionPages, p + 1))}
                            disabled={collectionsPage === totalCollectionPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Truck className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No collections recorded yet</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Collections will appear here once this agent confirms pickups
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default AgentDetails;
