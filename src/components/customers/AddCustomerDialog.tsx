import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Loader2, Plus, Trash2 } from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { nigerianStates, getLGAsByState } from "@/lib/nigeriaData";
import { normalizeNigerianPhone } from "@/lib/phoneUtils";

interface AddCustomerDialogProps {
  onCustomerAdded?: () => void;
}

interface Ward {
  id: string;
  _id?: string;
  name: string;
}

interface Street {
  id: string;
  _id?: string;
  name: string;
  wardId: string | { id: string; _id?: string; name: string };
}

interface PropertyType {
  id: string;
  _id?: string;
  name: string;
  cost: number;
}

// Helper functions
const getId = (item: { id?: string; _id?: string }): string => item.id || item._id || "";

interface PropertyEntry {
  propertyTypeId: string;
  quantity: number;
}

const CUSTOMER_TYPES = [
  { value: "standalone", label: "Standalone" },
  { value: "compound", label: "Compound" },
  { value: "estate", label: "Estate" },
];

export function AddCustomerDialog({ onCustomerAdded }: AddCustomerDialogProps) {
  const { accessToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // Dropdown data
  const [wards, setWards] = useState<Ward[]>([]);
  const [streets, setStreets] = useState<Street[]>([]);
  const [filteredStreets, setFilteredStreets] = useState<Street[]>([]);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    lga: "",
    previousDebt: "",
    customerType: "standalone",
    wardId: "",
    streetId: "",
  });

  const [properties, setProperties] = useState<PropertyEntry[]>([]);
  const [selectedLGAs, setSelectedLGAs] = useState<string[]>([]);

  // Load wards, streets, and property types when dialog opens
  useEffect(() => {
    if (open && accessToken) {
      loadDropdownData();
    }
  }, [open, accessToken]);

  // Filter streets when ward changes
  useEffect(() => {
    if (formData.wardId) {
      const filtered = streets.filter((street) => {
        const wardId = typeof street.wardId === "object" ? getId(street.wardId) : street.wardId;
        return wardId === formData.wardId;
      });
      setFilteredStreets(filtered);
    } else {
      setFilteredStreets([]);
    }
    // Reset street selection when ward changes
    setFormData((prev) => ({ ...prev, streetId: "" }));
  }, [formData.wardId, streets]);

  const loadDropdownData = async () => {
    if (!accessToken) return;

    setLoadingData(true);
    try {
      const [wardsRes, streetsRes, propertyTypesRes] = await Promise.all([
        apiService.getActiveWards(accessToken),
        apiService.getStreets(accessToken),
        apiService.getActivePropertyTypes(accessToken),
      ]);

      setWards(wardsRes?.data || []);
      setStreets(streetsRes?.data || []);
      setPropertyTypes(propertyTypesRes?.data || []);
    } catch (error) {
      console.error("Failed to load dropdown data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleStateChange = (state: string) => {
    setFormData({ ...formData, state, lga: "" });
    setSelectedLGAs(getLGAsByState(state));
  };

  const handleWardChange = (wardId: string) => {
    setFormData({ ...formData, wardId, streetId: "" });
  };

  // Property management
  const addProperty = () => {
    if (propertyTypes.length === 0) {
      toast.error("No property types available. Please add property types in Settings first.");
      return;
    }
    setProperties([...properties, { propertyTypeId: "", quantity: 1 }]);
  };

  const updateProperty = (index: number, field: keyof PropertyEntry, value: string | number) => {
    const updated = [...properties];
    updated[index] = { ...updated[index], [field]: value };
    setProperties(updated);
  };

  const removeProperty = (index: number) => {
    setProperties(properties.filter((_, i) => i !== index));
  };

  // Calculate expected bill
  const calculateExpectedBill = (): number => {
    return properties.reduce((total, prop) => {
      const propertyType = propertyTypes.find((pt) => getId(pt) === prop.propertyTypeId);
      if (propertyType && prop.quantity > 0) {
        return total + propertyType.cost * prop.quantity;
      }
      return total;
    }, 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessToken) return;

    // Validation
    if (!formData.fullName || !formData.phone) {
      toast.error("Name and phone are required");
      return;
    }

    // Validate properties - required for ALL customer types
    const validProperties = properties.filter((p) => p.propertyTypeId && p.quantity > 0);
    if (validProperties.length === 0) {
      toast.error("Please add at least one property type");
      return;
    }

    setLoading(true);
    try {
      // Prepare data with previousDebt as number and normalized phone
      const customerData: any = {
        fullName: formData.fullName,
        email: formData.email,
        phone: normalizeNigerianPhone(formData.phone),
        address: formData.address,
        city: formData.city,
        state: formData.state,
        lga: formData.lga,
        previousDebt: formData.previousDebt ? parseFloat(formData.previousDebt) : 0,
        customerType: formData.customerType,
      };

      // Add ward and street if selected
      if (formData.wardId) {
        customerData.wardId = formData.wardId;
      }
      if (formData.streetId) {
        customerData.streetId = formData.streetId;
      }

      // Add properties if any
      if (validProperties.length > 0) {
        customerData.properties = validProperties;
      }

      const response = await apiService.makeAuthenticatedRequest(
        "/customers",
        {
          method: "POST",
          body: JSON.stringify(customerData),
        },
        accessToken
      );

      console.log("Add customer response:", response);
      toast.success("Customer added successfully");
      setOpen(false);
      resetForm();
      onCustomerAdded?.();
    } catch (error: any) {
      console.error("Error adding customer:", error);
      toast.error(error.message || "Failed to add customer");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      lga: "",
      previousDebt: "",
      customerType: "standalone",
      wardId: "",
      streetId: "",
    });
    setProperties([]);
    setSelectedLGAs([]);
    setFilteredStreets([]);
  };

  const expectedBill = calculateExpectedBill();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Enter customer details to add them to your system
          </DialogDescription>
        </DialogHeader>

        {loadingData ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 mt-4">
            {/* Customer Type */}
            <div className="space-y-2">
              <Label>Customer Type *</Label>
              <Select
                value={formData.customerType}
                onValueChange={(value) => setFormData({ ...formData, customerType: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer type" />
                </SelectTrigger>
                <SelectContent>
                  {CUSTOMER_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contact Person Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-gray-700">
                {formData.customerType === "standalone" ? "Customer Information" : "Contact Person Information"}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>

                {/* Phone */}
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="08012345678"
                    required
                  />
                </div>

                {/* Email */}
                <div className="col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-gray-700">Location Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {/* Ward */}
                <div>
                  <Label htmlFor="ward">Ward</Label>
                  <Select value={formData.wardId} onValueChange={handleWardChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select ward" />
                    </SelectTrigger>
                    <SelectContent>
                      {wards.map((ward) => (
                        <SelectItem key={getId(ward)} value={getId(ward)}>
                          {ward.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Street */}
                <div>
                  <Label htmlFor="street">Street</Label>
                  <Select
                    value={formData.streetId}
                    onValueChange={(value) => setFormData({ ...formData, streetId: value })}
                    disabled={!formData.wardId || filteredStreets.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select street" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredStreets.map((street) => (
                        <SelectItem key={getId(street)} value={getId(street)}>
                          {street.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Address */}
                <div className="col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Flat 5B, Block C, Estate Name"
                  />
                </div>

                {/* State */}
                <div>
                  <Label htmlFor="state">State</Label>
                  <Select value={formData.state} onValueChange={handleStateChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {nigerianStates.map((state) => (
                        <SelectItem key={state.value} value={state.value}>
                          {state.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* LGA */}
                <div>
                  <Label htmlFor="lga">LGA</Label>
                  <Select
                    value={formData.lga}
                    onValueChange={(value) => setFormData({ ...formData, lga: value })}
                    disabled={!formData.state || selectedLGAs.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select LGA" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedLGAs.map((lga) => (
                        <SelectItem key={lga} value={lga.toLowerCase().replace(/\s+/g, "-")}>
                          {lga}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* City */}
                <div className="col-span-2">
                  <Label htmlFor="city">City/Area</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Lekki, Ikeja, etc."
                  />
                </div>
              </div>
            </div>

            {/* Property Breakdown */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm text-gray-700">Property Breakdown</h3>
                <Button type="button" variant="outline" size="sm" onClick={addProperty}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Property
                </Button>
              </div>

              {properties.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">
                  No properties added. Click "Add Property" to add property types.
                </p>
              ) : (
                <div className="space-y-3">
                  {properties.map((prop, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-1">
                        <Select
                          value={prop.propertyTypeId}
                          onValueChange={(value) => updateProperty(index, "propertyTypeId", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select property type" />
                          </SelectTrigger>
                          <SelectContent>
                            {propertyTypes.map((pt) => (
                              <SelectItem key={getId(pt)} value={getId(pt)}>
                                {pt.name} - {formatCurrency(pt.cost)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24">
                        <Input
                          type="number"
                          min="1"
                          value={prop.quantity}
                          onChange={(e) => updateProperty(index, "quantity", parseInt(e.target.value) || 1)}
                          placeholder="Qty"
                        />
                      </div>
                      <div className="w-28 text-right text-sm font-medium">
                        {prop.propertyTypeId && (
                          formatCurrency(
                            (propertyTypes.find((pt) => getId(pt) === prop.propertyTypeId)?.cost || 0) * prop.quantity
                          )
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => removeProperty(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {/* Estimated Bill */}
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-green-800">Estimated Monthly Bill</span>
                        <span className="text-xl font-bold text-green-700">{formatCurrency(expectedBill)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Previous Debt */}
            <div className="space-y-2">
              <Label htmlFor="previousDebt">Previous Debt (₦)</Label>
              <Input
                id="previousDebt"
                type="number"
                min="0"
                step="0.01"
                value={formData.previousDebt}
                onChange={(e) => setFormData({ ...formData, previousDebt: e.target.value })}
                placeholder="0.00"
              />
              <p className="text-xs text-gray-500">
                Any outstanding balance from previous billing periods
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false);
                  resetForm();
                }}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Customer
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
