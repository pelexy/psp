import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { UserPlus, Loader2, Plus, Trash2 } from "@/lib/icons";
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
  isCommercial?: boolean;
  allowPriceOverride?: boolean;
}

// Helper functions
const getId = (item: { id?: string; _id?: string }): string => item.id || item._id || "";

interface PropertyEntry {
  propertyTypeId: string;
  quantity: number;
  costPerUnit?: number | string; // set only when the type allows a price override
  occupiedUnits?: number | string; // how many of the units are occupied (optional)
  billVacant?: boolean; // bill the vacant units too? (default off)
}

// How many units are actually billed for a property line. Occupancy is optional
// — a blank occupied count means all units are treated as occupied. Vacant units
// are billed by default; they're excluded only when "Bill vacant units" is off.
const billableUnitsFor = (prop: PropertyEntry): number => {
  const qty = Number(prop.quantity) || 0;
  const hasOcc =
    prop.occupiedUnits !== undefined && prop.occupiedUnits !== null && prop.occupiedUnits !== "";
  let occ = hasOcc ? Number(prop.occupiedUnits) : qty;
  if (!Number.isFinite(occ) || occ < 0) occ = 0;
  if (occ > qty) occ = qty;
  return prop.billVacant !== false ? qty : occ;
};

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
  const [streetSearch, setStreetSearch] = useState("");
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [billCycles, setBillCycles] = useState<{ id: string; name: string; active: boolean }[]>([]);

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
    oldAccountNumber: "",
    billCycleId: "",
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
      const [wardsRes, streetsRes, propertyTypesRes, cyclesRes] = await Promise.all([
        apiService.getActiveWards(accessToken),
        apiService.getStreets(accessToken),
        apiService.getActivePropertyTypes(accessToken),
        apiService.getBillCycles(accessToken).catch(() => ({ data: [] })),
      ]);

      setWards(wardsRes?.data || []);
      setStreets(streetsRes?.data || []);
      setPropertyTypes(propertyTypesRes?.data || []);
      setBillCycles((cyclesRes?.data || []).filter((c: any) => c.active));
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
    setProperties([...properties, { propertyTypeId: "", quantity: 1, billVacant: true }]);
  };

  const updateProperty = (index: number, field: keyof PropertyEntry, value: string | number | boolean) => {
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
        const overridden =
          propertyType.allowPriceOverride && prop.costPerUnit !== undefined && prop.costPerUnit !== "";
        const unit = overridden ? Number(prop.costPerUnit) : propertyType.cost;
        return total + unit * billableUnitsFor(prop);
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

    // Validation — the address is the account identity; the contact person is who we reach.
    if (!formData.address.trim()) {
      toast.error("Address is required — it is the account name");
      return;
    }
    if (!formData.fullName || !formData.phone) {
      toast.error("Contact name and phone are required");
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
      // The account IS the property: the account name is the ADDRESS, and the
      // person is stored as the contact (primary property user) — not the account name.
      const contactPhone = normalizeNigerianPhone(formData.phone);
      const customerData: any = {
        fullName: formData.address.trim(), // account name = the property address
        email: formData.email,
        phone: contactPhone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        lga: formData.lga,
        previousDebt: formData.previousDebt ? parseFloat(formData.previousDebt) : 0,
        customerType: formData.customerType,
        // Contact person for this property (drives WhatsApp/SMS bill delivery)
        users: [
          {
            fullName: formData.fullName.trim(),
            phone: contactPhone,
            email: formData.email || undefined,
            isPrimary: true,
          },
        ],
      };

      const trimmedOldAcct = formData.oldAccountNumber.trim();
      if (trimmedOldAcct) {
        customerData.oldAccountNumber = trimmedOldAcct;
      }

      // Add ward and street if selected
      if (formData.wardId) {
        customerData.wardId = formData.wardId;
      }
      if (formData.streetId) {
        customerData.streetId = formData.streetId;
      }

      // Add properties if any. Send costPerUnit only when the type allows an
      // override and a value was entered — otherwise the backend uses the default.
      if (validProperties.length > 0) {
        customerData.properties = validProperties.map((p) => {
          const pt = propertyTypes.find((t) => getId(t) === p.propertyTypeId);
          const out: any = { propertyTypeId: p.propertyTypeId, quantity: p.quantity };
          if (pt?.allowPriceOverride && p.costPerUnit !== undefined && p.costPerUnit !== "") {
            out.costPerUnit = Number(p.costPerUnit);
          }
          // Occupancy is optional — only send it when the agent entered a count.
          if (p.occupiedUnits !== undefined && p.occupiedUnits !== null && p.occupiedUnits !== "") {
            out.occupiedUnits = Number(p.occupiedUnits);
          }
          out.billVacant = p.billVacant !== false;
          return out;
        });
      }

      // Assign to a bill cycle if chosen (activates billing on the backend)
      if (formData.billCycleId) {
        customerData.billCycleId = formData.billCycleId;
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
      oldAccountNumber: "",
      billCycleId: "",
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

            {/* Property Address — the property IS the account (BuyPower-style: the account is the address) */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm text-gray-700">Property Address</h3>
                <p className="text-xs text-gray-500">
                  The property is the account — its address becomes the account name.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Address (this is the account name) */}
                <div className="col-span-2">
                  <Label htmlFor="address">Address *</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Flat 5B, Block C, Estate Name"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This becomes the account name on bills and in the customer list.
                  </p>
                </div>

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
                    onOpenChange={(o) => { if (!o) setStreetSearch(""); }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select street" />
                    </SelectTrigger>
                    <SelectContent>
                      <div className="sticky top-0 z-10 -mx-1 -mt-1 mb-1 border-b bg-popover p-1.5">
                        <Input
                          autoFocus
                          placeholder="Search streets…"
                          value={streetSearch}
                          onChange={(e) => setStreetSearch(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          onPointerDown={(e) => e.stopPropagation()}
                          className="h-8"
                        />
                      </div>
                      {(() => {
                        const q = streetSearch.trim().toLowerCase();
                        const visible = q
                          ? filteredStreets.filter((s) => s.name.toLowerCase().includes(q))
                          : filteredStreets;
                        return visible.length > 0 ? (
                          visible.map((street) => (
                            <SelectItem key={getId(street)} value={getId(street)}>
                              {street.name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                            No streets found
                          </div>
                        );
                      })()}
                    </SelectContent>
                  </Select>
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

            {/* Contact Person — the person we reach for this property */}
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-sm text-gray-700">Contact Person</h3>
                <p className="text-xs text-gray-500">
                  Who we reach for this property — used to deliver bills via WhatsApp/SMS.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {/* Contact Name */}
                <div className="col-span-2 sm:col-span-1">
                  <Label htmlFor="fullName">Contact Name *</Label>
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
                  {properties.map((prop, index) => {
                    const pt = propertyTypes.find((p) => getId(p) === prop.propertyTypeId);
                    const canOverride = !!pt?.allowPriceOverride;
                    const overridden = canOverride && prop.costPerUnit !== undefined && prop.costPerUnit !== "";
                    const unit = overridden ? Number(prop.costPerUnit) : pt?.cost || 0;
                    const lineTotal = unit * billableUnitsFor(prop);
                    const qty = Number(prop.quantity) || 0;
                    const hasOcc =
                      prop.occupiedUnits !== undefined && prop.occupiedUnits !== null && prop.occupiedUnits !== "";
                    const occ = hasOcc ? Math.min(Math.max(Number(prop.occupiedUnits) || 0, 0), qty) : qty;
                    const vacant = qty - occ;
                    return (
                      <div key={index} className="space-y-2 rounded-lg border border-gray-100 bg-gray-50/50 p-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <Select
                            value={prop.propertyTypeId}
                            onValueChange={(value) => {
                              // Prefill the editable price for override-enabled types
                              const chosen = propertyTypes.find((p) => getId(p) === value);
                              const updated = [...properties];
                              updated[index] = {
                                ...updated[index],
                                propertyTypeId: value,
                                costPerUnit: chosen?.allowPriceOverride ? chosen.cost : undefined,
                              };
                              setProperties(updated);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select property type" />
                            </SelectTrigger>
                            <SelectContent>
                              {propertyTypes.map((p) => (
                                <SelectItem key={getId(p)} value={getId(p)}>
                                  {p.name}{p.isCommercial ? " (Commercial)" : ""} - {formatCurrency(p.cost)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="w-16">
                          <Input
                            type="number"
                            min="1"
                            value={prop.quantity}
                            onChange={(e) => updateProperty(index, "quantity", parseInt(e.target.value) || 1)}
                            placeholder="Qty"
                          />
                        </div>
                        <div className="w-32">
                          {canOverride ? (
                            <div className="relative">
                              <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-500">₦</span>
                              <Input
                                type="number"
                                min="0"
                                className="pl-5"
                                value={prop.costPerUnit ?? ""}
                                placeholder={String(pt?.cost ?? 0)}
                                onChange={(e) =>
                                  updateProperty(index, "costPerUnit", e.target.value === "" ? "" : parseFloat(e.target.value))
                                }
                                title="Custom price per unit"
                              />
                            </div>
                          ) : (
                            <div className="text-right text-sm text-gray-500">
                              {pt ? formatCurrency(pt.cost) : ""}
                            </div>
                          )}
                        </div>
                        <div className="w-24 text-right text-sm font-medium">
                          {prop.propertyTypeId ? formatCurrency(lineTotal) : ""}
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

                      {/* Occupancy — how many of the units are occupied vs vacant */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pl-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-gray-500">Occupied</Label>
                          <Input
                            type="number"
                            min="0"
                            max={qty || undefined}
                            className="h-8 w-16"
                            value={prop.occupiedUnits ?? ""}
                            placeholder={String(qty)}
                            onChange={(e) =>
                              updateProperty(index, "occupiedUnits", e.target.value === "" ? "" : parseInt(e.target.value))
                            }
                            title={`Occupied out of ${qty} unit(s)`}
                          />
                          <span className="text-xs text-gray-400">of {qty}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          Vacant: <span className="font-medium text-gray-700">{vacant}</span>
                        </div>
                        <label className="flex items-center gap-2 text-xs text-gray-600">
                          <Switch
                            checked={prop.billVacant !== false}
                            onCheckedChange={(checked) => updateProperty(index, "billVacant", checked)}
                            disabled={vacant === 0}
                          />
                          Bill vacant units
                        </label>
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
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>

            {/* Old Account Number */}
            <div className="space-y-2">
              <Label htmlFor="oldAccountNumber">Old Account Number (Optional)</Label>
              <Input
                id="oldAccountNumber"
                value={formData.oldAccountNumber}
                onChange={(e) =>
                  setFormData({ ...formData, oldAccountNumber: e.target.value })
                }
                placeholder="e.g. LEG-12345"
              />
              <p className="text-xs text-gray-500">
                Reference to the customer's account number from a previous/legacy system.
              </p>
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

            {/* Billing */}
            <div className="space-y-2 pt-4 border-t">
              <Label htmlFor="billCycle">Bill Cycle (Optional)</Label>
              <Select
                value={formData.billCycleId || "none"}
                onValueChange={(value) =>
                  setFormData({ ...formData, billCycleId: value === "none" ? "" : value })
                }
              >
                <SelectTrigger id="billCycle">
                  <SelectValue placeholder="Not assigned — won't be billed automatically" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Not assigned</SelectItem>
                  {billCycles.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                {billCycles.length === 0
                  ? "No bill cycles yet — create one under Billing → Bills to bill this customer automatically."
                  : "Assign to a cycle so bills generate on its schedule. Leave unassigned to bill manually later."}
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
