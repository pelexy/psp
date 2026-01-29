import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { nigerianStates, getLGAsByState } from "@/lib/nigeriaData";

interface EditCustomerDialogProps {
  customer: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerUpdated?: () => void;
}

interface Ward {
  _id: string;
  name: string;
}

interface Street {
  _id: string;
  name: string;
  wardId: string | { _id: string; name: string };
}

interface PropertyType {
  _id: string;
  name: string;
  cost: number;
}

interface PropertyEntry {
  propertyTypeId: string;
  quantity: number;
  costPerUnit?: number; // Custom cost override for this customer
}

const CUSTOMER_TYPES = [
  { value: "standalone", label: "Standalone" },
  { value: "compound", label: "Compound" },
  { value: "estate", label: "Estate" },
];

export function EditCustomerDialog({ customer, open, onOpenChange, onCustomerUpdated }: EditCustomerDialogProps) {
  const { accessToken } = useAuth();
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
    phone: "",
    address: "",
    city: "",
    state: "",
    lga: "",
    customerType: "standalone",
    wardId: "",
    streetId: "",
  });

  const [properties, setProperties] = useState<PropertyEntry[]>([]);
  const [selectedLGAs, setSelectedLGAs] = useState<string[]>([]);

  // Initialize form data when customer changes
  useEffect(() => {
    if (customer && open) {
      const details = customer.customerDetails || customer;
      setFormData({
        fullName: details.fullName || "",
        phone: details.phone || "",
        address: details.address || "",
        city: details.city || "",
        state: details.state || "",
        lga: details.lga || "",
        customerType: details.customerType || "standalone",
        wardId: details.wardId?._id || details.wardId || "",
        streetId: details.streetId?._id || details.streetId || "",
      });

      // Initialize properties
      if (details.properties && details.properties.length > 0) {
        console.log('Loading properties from customer:', details.properties);
        setProperties(details.properties.map((p: any) => ({
          propertyTypeId: p.propertyTypeId?._id || p.propertyTypeId || "",
          quantity: p.quantity || 1,
          // Keep costPerUnit if it's explicitly set (even if 0), otherwise undefined
          costPerUnit: p.costPerUnit !== undefined && p.costPerUnit !== null ? p.costPerUnit : undefined,
        })));
      } else {
        setProperties([]);
      }

      // Initialize LGAs if state is set
      if (details.state) {
        setSelectedLGAs(getLGAsByState(details.state));
      }
    }
  }, [customer, open]);

  // Load dropdown data when dialog opens
  useEffect(() => {
    if (open && accessToken) {
      loadDropdownData();
    }
  }, [open, accessToken]);

  // Filter streets when ward changes
  useEffect(() => {
    if (formData.wardId && streets.length > 0) {
      const filtered = streets.filter((street) => {
        const wardId = typeof street.wardId === "object" ? street.wardId._id : street.wardId;
        return wardId === formData.wardId;
      });
      setFilteredStreets(filtered);
    } else {
      setFilteredStreets([]);
    }
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
    setProperties([...properties, { propertyTypeId: "", quantity: 1, costPerUnit: undefined }]);
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
      const propertyType = propertyTypes.find((pt) => pt._id === prop.propertyTypeId);
      if (propertyType && prop.quantity > 0) {
        // Use custom costPerUnit if set, otherwise use default property type cost
        const cost = prop.costPerUnit !== undefined ? prop.costPerUnit : propertyType.cost;
        return total + cost * prop.quantity;
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

    if (!accessToken || !customer) return;

    const customerId = customer.customerDetails?.customerId || customer._id;
    if (!customerId) {
      toast.error("Customer ID not found");
      return;
    }

    // Validation
    if (!formData.fullName || !formData.phone) {
      toast.error("Name and phone are required");
      return;
    }

    // Validate properties for compound/estate
    const validProperties = properties.filter((p) => p.propertyTypeId && p.quantity > 0);
    console.log('Properties before save:', properties);
    console.log('Valid properties to save:', validProperties);

    if (formData.customerType !== "standalone" && validProperties.length === 0) {
      toast.error("Please add at least one property type for Compound/Estate customers");
      return;
    }

    setLoading(true);
    try {
      const updateData: any = {
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        lga: formData.lga,
        customerType: formData.customerType || "standalone",
        // Always send wardId and streetId (can be empty string to clear)
        wardId: formData.wardId || null,
        streetId: formData.streetId || null,
        // Always send properties array with costPerUnit
        properties: validProperties.map(p => ({
          propertyTypeId: p.propertyTypeId,
          quantity: p.quantity,
          costPerUnit: p.costPerUnit, // Include costPerUnit even if undefined
        })),
      };

      console.log("Updating customer ID:", customerId);
      console.log("Updating customer with data:", JSON.stringify(updateData, null, 2));

      const response = await apiService.updateCustomer(accessToken, customerId, updateData);
      console.log("Update response:", response);

      toast.success("Customer updated successfully");
      onOpenChange(false);
      onCustomerUpdated?.();
    } catch (error: any) {
      console.error("Error updating customer:", error);
      toast.error(error.message || "Failed to update customer");
    } finally {
      setLoading(false);
    }
  };

  const expectedBill = calculateExpectedBill();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
          <DialogDescription>
            Update customer details
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
                value={formData.customerType || "standalone"}
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
              </div>
            </div>

            {/* Location Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-sm text-gray-700">Location Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="ward">Ward</Label>
                  <Select
                    value={formData.wardId || "none"}
                    onValueChange={(value) => handleWardChange(value === "none" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select ward" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {wards.map((ward) => (
                        <SelectItem key={ward._id} value={ward._id}>
                          {ward.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="street">Street</Label>
                  <Select
                    value={formData.streetId || "none"}
                    onValueChange={(value) => setFormData({ ...formData, streetId: value === "none" ? "" : value })}
                    disabled={!formData.wardId || filteredStreets.length === 0}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select street" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {filteredStreets.map((street) => (
                        <SelectItem key={street._id} value={street._id}>
                          {street.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Flat 5B, Block C, Estate Name"
                  />
                </div>

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
                  {/* Header row */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 px-1">
                    <div className="col-span-4">Property Type</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-3">Cost/Unit</div>
                    <div className="col-span-2 text-right">Subtotal</div>
                    <div className="col-span-1"></div>
                  </div>

                  {properties.map((prop, index) => {
                    const propertyType = propertyTypes.find((pt) => pt._id === prop.propertyTypeId);
                    const defaultCost = propertyType?.cost || 0;
                    const effectiveCost = prop.costPerUnit !== undefined ? prop.costPerUnit : defaultCost;
                    const hasCustomCost = prop.costPerUnit !== undefined && prop.costPerUnit !== defaultCost;

                    return (
                      <div key={index} className="grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <Select
                            value={prop.propertyTypeId}
                            onValueChange={(value) => {
                              // When property type changes, reset custom cost
                              const updated = [...properties];
                              updated[index] = { ...updated[index], propertyTypeId: value, costPerUnit: undefined };
                              setProperties(updated);
                            }}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              {propertyTypes.map((pt) => (
                                <SelectItem key={pt._id} value={pt._id}>
                                  {pt.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="1"
                            className="h-9"
                            value={prop.quantity}
                            onChange={(e) => updateProperty(index, "quantity", parseInt(e.target.value) || 1)}
                            placeholder="Qty"
                          />
                        </div>
                        <div className="col-span-3">
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              className={`h-9 pr-8 ${hasCustomCost ? 'border-amber-400 bg-amber-50' : ''}`}
                              value={prop.costPerUnit !== undefined ? prop.costPerUnit : defaultCost}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                if (!isNaN(value)) {
                                  updateProperty(index, "costPerUnit", value);
                                }
                              }}
                              placeholder="Cost"
                            />
                            {hasCustomCost && (
                              <button
                                type="button"
                                className="absolute right-1 top-1/2 -translate-y-1/2 text-amber-600 hover:text-amber-800 text-xs px-1"
                                onClick={() => {
                                  const updated = [...properties];
                                  updated[index] = { ...updated[index], costPerUnit: undefined };
                                  setProperties(updated);
                                }}
                                title={`Reset to default (${formatCurrency(defaultCost)})`}
                              >
                                Reset
                              </button>
                            )}
                          </div>
                          {hasCustomCost && (
                            <p className="text-xs text-amber-600 mt-0.5">
                              Default: {formatCurrency(defaultCost)}
                            </p>
                          )}
                        </div>
                        <div className="col-span-2 text-right text-sm font-medium">
                          {prop.propertyTypeId && formatCurrency(effectiveCost * prop.quantity)}
                        </div>
                        <div className="col-span-1 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => removeProperty(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  {/* Estimated Bill */}
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-green-800">Estimated Monthly Bill</span>
                        <span className="text-xl font-bold text-green-700">{formatCurrency(expectedBill)}</span>
                      </div>
                      {properties.some(p => p.costPerUnit !== undefined && p.costPerUnit !== (propertyTypes.find(pt => pt._id === p.propertyTypeId)?.cost || 0)) && (
                        <p className="text-xs text-amber-600 mt-1">* Includes custom pricing</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
