import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { nigerianStates, getLGAsByState } from "@/lib/nigeriaData";
import { normalizeNigerianPhone } from "@/lib/phoneUtils";

interface AddCustomerDialogProps {
  onCustomerAdded?: () => void;
}

export function AddCustomerDialog({ onCustomerAdded }: AddCustomerDialogProps) {
  const { accessToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
  });

  const [selectedLGAs, setSelectedLGAs] = useState<string[]>([]);

  const handleStateChange = (state: string) => {
    setFormData({ ...formData, state, lga: "" });
    setSelectedLGAs(getLGAsByState(state));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessToken) return;

    // Validation
    if (!formData.fullName || !formData.phone) {
      toast.error("Name and phone are required");
      return;
    }

    setLoading(true);
    try {
      // Prepare data with previousDebt as number and normalized phone
      const customerData = {
        ...formData,
        phone: normalizeNigerianPhone(formData.phone), // Normalize to 234XXXXXXXXXX
        previousDebt: formData.previousDebt ? parseFloat(formData.previousDebt) : 0,
      };

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
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        lga: "",
        previousDebt: "",
      });
      setSelectedLGAs([]);
      onCustomerAdded?.();
    } catch (error: any) {
      console.error("Error adding customer:", error);
      toast.error(error.message || "Failed to add customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Customer
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
          <DialogDescription>
            Enter customer details to add them to your system
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="col-span-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="John Doe"
                required
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="08012345678"
                required
              />
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
            <div>
              <Label htmlFor="city">City/Area</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Lekki, Ikeja, etc."
              />
            </div>

            {/* Previous Debt */}
            <div>
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
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
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
      </DialogContent>
    </Dialog>
  );
}
