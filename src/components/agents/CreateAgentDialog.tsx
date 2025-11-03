import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Copy, Check } from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CreateAgentDialogProps {
  onAgentCreated: () => void;
}

export function CreateAgentDialog({ onAgentCreated }: CreateAgentDialogProps) {
  const { accessToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  console.log('CreateAgentDialog rendered, open:', open);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    state: "",
    lga: "",
    city: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await apiService.createStaff(accessToken, formData);
      toast.success("Agent created successfully!");
      setCredentials(response.credentials);
      onAgentCreated();

      // Reset form
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        address: "",
        state: "",
        lga: "",
        city: "",
      });
    } catch (error: any) {
      console.error("Error creating agent:", error);
      toast.error(error.message || "Failed to create agent");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPassword = () => {
    if (credentials?.temporaryPassword) {
      navigator.clipboard.writeText(credentials.temporaryPassword);
      setCopied(true);
      toast.success("Password copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Only clear credentials when closing
      setCredentials(null);
      setCopied(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2" onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Agent
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Field Agent</DialogTitle>
          <DialogDescription>
            Add a new field agent. They will receive login credentials via email.
          </DialogDescription>
        </DialogHeader>

        {credentials ? (
          // Show credentials after successful creation
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Agent Created Successfully!</h3>
              <p className="text-sm text-green-700">
                Login credentials have been sent to <strong>{credentials.email}</strong>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-gray-700">Email</Label>
                <Input value={credentials.email} readOnly className="bg-gray-50" />
              </div>

              <div>
                <Label className="text-gray-700">Temporary Password</Label>
                <div className="flex gap-2">
                  <Input
                    value={credentials.temporaryPassword}
                    readOnly
                    className="bg-gray-50 font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyPassword}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Agent must change this password on first login
                </p>
              </div>
            </div>

            <Button onClick={() => handleOpenChange(false)} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          // Show form
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="John Doe"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="agent@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="08012345678"
                  required
                  disabled={loading}
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="123 Main Street"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="Lagos"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="lga">LGA</Label>
                <Input
                  id="lga"
                  value={formData.lga}
                  onChange={(e) => setFormData({ ...formData, lga: e.target.value })}
                  placeholder="Ikeja"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Ikeja"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Agent"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
