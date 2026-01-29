import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Recycle,
  Users,
  DollarSign,
  Calendar,
  Clock,
} from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Collections = () => {
  const { accessToken } = useAuth();
  const navigate = useNavigate();

  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Service type options
  const serviceTypes = [
    { value: "waste_collection", label: "Waste Collection" },
    { value: "bin_sale", label: "Bin Sale" },
    { value: "recycling", label: "Recycling" },
    { value: "penalty", label: "Penalty" },
  ];

  // Form state
  const [formData, setFormData] = useState({
    collectionName: "",
    serviceType: "waste_collection",
    amountType: "FIXED",
    baseAmount: "",
    billingFrequency: "weekly",
    invoiceGenerationDay: "monday",
    invoiceDueDay: "friday",
    invoiceGenerationDayOfMonth: "1",
    invoiceDueDayOfMonth: "7",
    penaltyFee: "",
    penaltyIntervalDays: "30",
    description: "",
    importAllCustomers: false,
  });

  const fetchCollections = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await apiService.getCollections(accessToken);
      console.log("===== COLLECTIONS DEBUG =====");
      console.log("Raw response:", response);
      console.log("Response type:", typeof response);
      console.log("Is array?", Array.isArray(response));

      // Handle different response formats
      let collectionsData;
      if (Array.isArray(response)) {
        collectionsData = response;
        console.log("Using direct array");
      } else if (response && response.data) {
        collectionsData = response.data;
        console.log("Using response.data");
      } else if (response && response.collections) {
        collectionsData = response.collections;
        console.log("Using response.collections");
      } else {
        collectionsData = [];
        console.log("No valid data found, using empty array");
      }

      console.log("Final collections data:", collectionsData);
      console.log("Data length:", collectionsData.length);
      if (collectionsData.length > 0) {
        console.log("First collection:", collectionsData[0]);
        console.log("First collection totalMembers:", collectionsData[0].totalMembers);
        console.log("First collection totalInvoices:", collectionsData[0].totalInvoices);
      }
      console.log("===== END DEBUG =====");

      setCollections(collectionsData);
    } catch (error: any) {
      console.error("Error fetching collections:", error);
      toast.error(error.message || "Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [accessToken]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setCreating(true);
    try {
      const payload: any = {
        collectionName: formData.collectionName,
        serviceType: formData.serviceType,
        amountType: formData.amountType,
        baseAmount: formData.amountType === "FIXED" ? parseFloat(formData.baseAmount) : 0,
        billingFrequency: formData.billingFrequency,
        description: formData.description,
        importAllCustomers: formData.importAllCustomers,
      };

      if (formData.penaltyFee) {
        payload.penaltyFee = parseFloat(formData.penaltyFee);
      }

      if (formData.penaltyIntervalDays) {
        payload.penaltyIntervalDays = parseInt(formData.penaltyIntervalDays);
      }

      if (formData.billingFrequency === "weekly") {
        payload.invoiceGenerationDay = formData.invoiceGenerationDay;
        payload.invoiceDueDay = formData.invoiceDueDay;
      } else if (formData.billingFrequency === "monthly") {
        payload.invoiceGenerationDayOfMonth = parseInt(formData.invoiceGenerationDayOfMonth);
        payload.invoiceDueDayOfMonth = parseInt(formData.invoiceDueDayOfMonth);
      }

      const response = await apiService.createCollection(accessToken, payload);
      console.log("Create collection response:", response);

      toast.success("Collection created successfully!");
      setDialogOpen(false);

      // Reset form
      setFormData({
        collectionName: "",
        serviceType: "waste_collection",
        amountType: "FIXED",
        baseAmount: "",
        billingFrequency: "weekly",
        invoiceGenerationDay: "monday",
        invoiceDueDay: "friday",
        invoiceGenerationDayOfMonth: "1",
        invoiceDueDayOfMonth: "7",
        penaltyFee: "",
        penaltyIntervalDays: "30",
        description: "",
        importAllCustomers: false,
      });

      // Refresh collections list
      fetchCollections();
    } catch (error: any) {
      console.error("Error creating collection:", error);
      toast.error(error.message || "Failed to create collection");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 md:p-6 lg:p-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading collections...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 bg-gradient-to-br from-background via-background to-accent/5 max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Collections</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Manage your recurring billing services • {collections.length} total collections
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Collection
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Collection</DialogTitle>
                <DialogDescription>
                  Set up a new recurring billing service for your customers
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleCreateCollection} className="space-y-4">
                {/* Collection Name */}
                <div>
                  <Label htmlFor="collectionName">Collection Name *</Label>
                  <Input
                    id="collectionName"
                    value={formData.collectionName}
                    onChange={(e) => setFormData({ ...formData, collectionName: e.target.value })}
                    placeholder="e.g., Waste Management, Security Fee"
                    required
                  />
                </div>

                {/* Service Type */}
                <div>
                  <Label htmlFor="serviceType">Service Type *</Label>
                  <Select
                    value={formData.serviceType}
                    onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Category of service for this collection
                  </p>
                </div>

                {/* Amount Type */}
                <div>
                  <Label htmlFor="amountType">Amount Type *</Label>
                  <Select
                    value={formData.amountType}
                    onValueChange={(value) => setFormData({ ...formData, amountType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FIXED">Fixed Amount (Same for all customers)</SelectItem>
                      <SelectItem value="VARIABLE">Variable Amount (Set per customer)</SelectItem>
                      <SelectItem value="CUSTOMER_PROPERTY">Customer Property Bill (From properties)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Base Amount - Only show for FIXED type */}
                {formData.amountType === "FIXED" && (
                  <div>
                    <Label htmlFor="baseAmount">Base Amount *</Label>
                    <Input
                      id="baseAmount"
                      type="number"
                      value={formData.baseAmount}
                      onChange={(e) => setFormData({ ...formData, baseAmount: e.target.value })}
                      placeholder="e.g., 5000"
                      required
                      min="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      This amount will be charged to all customers in this collection
                    </p>
                  </div>
                )}

                {/* VARIABLE amount type info */}
                {formData.amountType === "VARIABLE" && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-900">
                      <strong>Variable Amount:</strong> Each customer will have a different amount. You'll set individual amounts when enrolling customers.
                    </p>
                  </div>
                )}

                {/* CUSTOMER_PROPERTY amount type info */}
                {formData.amountType === "CUSTOMER_PROPERTY" && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-900">
                      <strong>Customer Property Bill:</strong> Each customer will be billed based on their property breakdown (expected bill). Make sure customers have properties assigned in their profile.
                    </p>
                  </div>
                )}

                {/* Billing Frequency */}
                <div>
                  <Label htmlFor="billingFrequency">Billing Frequency *</Label>
                  <Select
                    value={formData.billingFrequency}
                    onValueChange={(value) => setFormData({ ...formData, billingFrequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="on_demand">On Demand (Manual)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Invoice Generation Day (for weekly) */}
                {formData.billingFrequency === "weekly" && (
                  <>
                    <div>
                      <Label htmlFor="invoiceGenerationDay">Invoice Generation Day *</Label>
                      <Select
                        value={formData.invoiceGenerationDay}
                        onValueChange={(value) => setFormData({ ...formData, invoiceGenerationDay: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday">Monday</SelectItem>
                          <SelectItem value="tuesday">Tuesday</SelectItem>
                          <SelectItem value="wednesday">Wednesday</SelectItem>
                          <SelectItem value="thursday">Thursday</SelectItem>
                          <SelectItem value="friday">Friday</SelectItem>
                          <SelectItem value="saturday">Saturday</SelectItem>
                          <SelectItem value="sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Day when invoices will be automatically generated
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="invoiceDueDay">Invoice Due Day *</Label>
                      <Select
                        value={formData.invoiceDueDay}
                        onValueChange={(value) => setFormData({ ...formData, invoiceDueDay: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monday">Monday</SelectItem>
                          <SelectItem value="tuesday">Tuesday</SelectItem>
                          <SelectItem value="wednesday">Wednesday</SelectItem>
                          <SelectItem value="thursday">Thursday</SelectItem>
                          <SelectItem value="friday">Friday</SelectItem>
                          <SelectItem value="saturday">Saturday</SelectItem>
                          <SelectItem value="sunday">Sunday</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-500 mt-1">
                        Day when invoices are due for payment
                      </p>
                    </div>
                  </>
                )}

                {/* Invoice Generation Day of Month (for monthly) */}
                {formData.billingFrequency === "monthly" && (
                  <>
                    <div>
                      <Label htmlFor="invoiceGenerationDayOfMonth">Invoice Generation Day of Month (1-28) *</Label>
                      <Input
                        id="invoiceGenerationDayOfMonth"
                        type="number"
                        value={formData.invoiceGenerationDayOfMonth}
                        onChange={(e) => setFormData({ ...formData, invoiceGenerationDayOfMonth: e.target.value })}
                        min="1"
                        max="28"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Day of the month when invoices will be automatically generated (max 28 for all months)
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="invoiceDueDayOfMonth">Invoice Due Day of Month (1-28) *</Label>
                      <Input
                        id="invoiceDueDayOfMonth"
                        type="number"
                        value={formData.invoiceDueDayOfMonth}
                        onChange={(e) => setFormData({ ...formData, invoiceDueDayOfMonth: e.target.value })}
                        min="1"
                        max="28"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Day of the month when invoices are due for payment (max 28 for all months)
                      </p>
                    </div>
                  </>
                )}

                {/* Penalty Fee */}
                <div>
                  <Label htmlFor="penaltyFee">Penalty Fee (Optional)</Label>
                  <Input
                    id="penaltyFee"
                    type="number"
                    value={formData.penaltyFee}
                    onChange={(e) => setFormData({ ...formData, penaltyFee: e.target.value })}
                    placeholder="e.g., 500"
                    min="0"
                  />
                </div>

                {/* Penalty Interval Days */}
                <div>
                  <Label htmlFor="penaltyIntervalDays">Penalty Interval Days (Optional)</Label>
                  <Input
                    id="penaltyIntervalDays"
                    type="number"
                    value={formData.penaltyIntervalDays}
                    onChange={(e) => setFormData({ ...formData, penaltyIntervalDays: e.target.value })}
                    placeholder="e.g., 30"
                    min="1"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label htmlFor="description">Description (Optional, max 30 chars)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of this service"
                    rows={3}
                    maxLength={30}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/30 characters
                  </p>
                </div>

                {/* Import All Customers */}
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="importAllCustomers"
                    checked={formData.importAllCustomers}
                    onChange={(e) => setFormData({ ...formData, importAllCustomers: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="importAllCustomers" className="font-normal">
                    Auto-enroll all existing customers to this collection
                  </Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDialogOpen(false)}
                    disabled={creating}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? "Creating..." : "Create Collection"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Collections Grid */}
        {collections.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <Recycle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Collections Yet</h3>
            <p className="text-gray-500 mb-6">Create your first collection to start managing recurring billing</p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Create Collection
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer relative overflow-hidden group"
                onClick={() => navigate(`/billing/plans/${collection.id}`)}
              >
                {/* Backlog Badge */}
                {collection.isBacklog && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="text-xs">System</Badge>
                  </div>
                )}

                {/* Header */}
                <div className="mb-4">
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Recycle className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-primary transition-colors">
                        {collection.collectionName}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs capitalize">
                          {(collection.serviceType || 'waste_collection').replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {collection.billingFrequency.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {collection.description && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">{collection.description}</p>
                  )}
                </div>

                {/* Amount Badge */}
                {collection.amountType === "FIXED" && (
                  <div className="mb-4">
                    <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-semibold">
                      <DollarSign className="h-4 w-4" />
                      ₦{collection.baseAmount.toLocaleString()}
                    </div>
                  </div>
                )}
                {collection.amountType === "VARIABLE" && (
                  <div className="mb-4">
                    <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-semibold">
                      <DollarSign className="h-4 w-4" />
                      Variable Amount
                    </div>
                  </div>
                )}
                {collection.amountType === "CUSTOMER_PROPERTY" && (
                  <div className="mb-4">
                    <div className="inline-flex items-center gap-2 bg-purple-50 text-purple-700 px-3 py-1.5 rounded-lg text-sm font-semibold">
                      <DollarSign className="h-4 w-4" />
                      Customer Property Bill
                    </div>
                  </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-xs text-gray-500">Members</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{collection.totalMembers || 0}</p>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-xs text-gray-500">Invoices</span>
                    </div>
                    <p className="text-lg font-bold text-gray-900">{collection.totalInvoices || 0}</p>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="border-t border-gray-200 pt-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Billed</span>
                    <span className="text-sm font-semibold text-gray-900">
                      ₦{(collection.totalAmount || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Paid</span>
                    <span className="text-sm font-semibold text-emerald-600">
                      ₦{(collection.totalPaid || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Outstanding</span>
                    <span className="text-sm font-semibold text-red-600">
                      ₦{(collection.totalUnpaid || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-gray-600">Payment Rate</span>
                    <span className="text-xs font-semibold text-gray-900">
                      {collection.percentagePaid || 0}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${collection.percentagePaid || 0}%` }}
                    />
                  </div>
                </div>

                {/* Next Invoice Date */}
                {collection.nextInvoiceDate && !collection.isBacklog && (
                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      Next invoice: {new Date(collection.nextInvoiceDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Collections;
