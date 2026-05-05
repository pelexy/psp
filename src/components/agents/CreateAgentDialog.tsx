import { useEffect, useMemo, useState } from "react";
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
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Loader2,
  Copy,
  Check,
  Smartphone,
  Shield,
  MapPin,
  ChevronDown,
  ChevronRight,
  Users,
  UserPlus,
  ScanLine,
  Receipt,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CreateAgentDialogProps {
  onAgentCreated: () => void;
}

interface Ward {
  id?: string;
  _id?: string;
  name: string;
}

interface Street {
  id?: string;
  _id?: string;
  name: string;
  wardId: string | { id?: string; _id?: string; name: string };
}

interface Permission {
  key: PermissionKey;
  label: string;
  hint: string;
  icon: LucideIcon;
}

const PERMISSIONS: Permission[] = [
  {
    key: "canManageCustomers",
    label: "View customers",
    hint: "See customer details, debt and history",
    icon: Users,
  },
  {
    key: "canEnumerateCustomers",
    label: "Enumerate",
    hint: "Add new customers in the field",
    icon: UserPlus,
  },
  {
    key: "canScanBarcodes",
    label: "Scan barcodes",
    hint: "Look up customers by barcode",
    icon: ScanLine,
  },
  {
    key: "canViewInvoices",
    label: "View invoices",
    hint: "See pending invoices and debt",
    icon: Receipt,
  },
  {
    key: "canRecordPayments",
    label: "Record payments",
    hint: "Mark payments collected in the field",
    icon: Wallet,
  },
];

type PermissionKey =
  | "canManageCustomers"
  | "canEnumerateCustomers"
  | "canScanBarcodes"
  | "canViewInvoices"
  | "canRecordPayments";

const getId = (item: { id?: string; _id?: string }) =>
  item.id || item._id || "";

const initialPermissions: Record<PermissionKey, boolean> = {
  canManageCustomers: true,
  canEnumerateCustomers: true,
  canScanBarcodes: true,
  canViewInvoices: false,
  canRecordPayments: false,
};

export function CreateAgentDialog({ onAgentCreated }: CreateAgentDialogProps) {
  const { accessToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const [wards, setWards] = useState<Ward[]>([]);
  const [streets, setStreets] = useState<Street[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    state: "",
    lga: "",
    city: "",
  });

  const [canUseMobileApp, setCanUseMobileApp] = useState(true);
  const [assignAllAreas, setAssignAllAreas] = useState(true);
  const [selectedStreetIds, setSelectedStreetIds] = useState<string[]>([]);
  const [expandedWardIds, setExpandedWardIds] = useState<string[]>([]);
  const [permissions, setPermissions] =
    useState<Record<PermissionKey, boolean>>(initialPermissions);

  useEffect(() => {
    if (!open || !accessToken) return;
    let cancelled = false;
    (async () => {
      setLoadingRefs(true);
      try {
        const [wardsRes, streetsRes] = await Promise.all([
          apiService.getActiveWards(accessToken),
          apiService.getStreets(accessToken),
        ]);
        if (cancelled) return;
        setWards(wardsRes?.data ?? []);
        setStreets(streetsRes?.data ?? []);
      } catch (err) {
        console.error("Failed to load wards/streets:", err);
      } finally {
        if (!cancelled) setLoadingRefs(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, accessToken]);

  const streetsByWard = useMemo(() => {
    const map = new Map<string, Street[]>();
    for (const s of streets) {
      const wardId =
        typeof s.wardId === "object" ? getId(s.wardId) : s.wardId;
      if (!wardId) continue;
      const list = map.get(wardId) ?? [];
      list.push(s);
      map.set(wardId, list);
    }
    return map;
  }, [streets]);

  const derivedWardIds = useMemo(() => {
    const set = new Set<string>();
    for (const s of streets) {
      const id = getId(s);
      if (!selectedStreetIds.includes(id)) continue;
      const wardId =
        typeof s.wardId === "object" ? getId(s.wardId) : s.wardId;
      if (wardId) set.add(wardId);
    }
    return Array.from(set);
  }, [streets, selectedStreetIds]);

  const toggleStreet = (id: string) => {
    setSelectedStreetIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleWardExpanded = (wardId: string) => {
    setExpandedWardIds((prev) =>
      prev.includes(wardId)
        ? prev.filter((x) => x !== wardId)
        : [...prev, wardId],
    );
  };

  const toggleAllStreetsInWard = (wardId: string) => {
    const wardStreets = streetsByWard.get(wardId) ?? [];
    const wardStreetIds = wardStreets.map(getId);
    const allSelected = wardStreetIds.every((id) =>
      selectedStreetIds.includes(id),
    );
    setSelectedStreetIds((prev) => {
      if (allSelected) {
        return prev.filter((id) => !wardStreetIds.includes(id));
      }
      const merged = new Set(prev);
      for (const id of wardStreetIds) merged.add(id);
      return Array.from(merged);
    });
  };

  const togglePermission = (key: PermissionKey) => {
    setPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetForm = () => {
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      address: "",
      state: "",
      lga: "",
      city: "",
    });
    setCanUseMobileApp(true);
    setAssignAllAreas(true);
    setSelectedStreetIds([]);
    setExpandedWardIds([]);
    setPermissions(initialPermissions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    if (!assignAllAreas && selectedStreetIds.length === 0) {
      toast.error("Pick at least one street, or enable 'All areas'.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        assignAllWards: assignAllAreas,
        assignAllStreets: assignAllAreas,
        assignedWards: assignAllAreas ? [] : derivedWardIds,
        assignedStreets: assignAllAreas ? [] : selectedStreetIds,
        permissions: {
          canUseMobileApp,
          ...permissions,
        },
      };

      const response = await apiService.createStaff(accessToken, payload);
      toast.success("Agent created successfully!");
      setCredentials(response.credentials);
      onAgentCreated();
      resetForm();
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
            Add a new field agent and choose what they can do in the mobile app.
          </DialogDescription>
        </DialogHeader>

        {credentials ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-success/30 bg-success/10">
              <h3 className="font-semibold text-success-foreground/90 mb-2">
                Agent Created Successfully!
              </h3>
              <p className="text-sm text-muted-foreground">
                Login credentials have been sent to{" "}
                <strong className="text-foreground">{credentials.email}</strong>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label>Email</Label>
                <Input value={credentials.email} readOnly />
              </div>

              <div>
                <Label>Temporary Password</Label>
                <div className="flex gap-2">
                  <Input
                    value={credentials.temporaryPassword}
                    readOnly
                    className="font-mono"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleCopyPassword}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-success" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Agent must change this password on first login
                </p>
              </div>
            </div>

            <Button onClick={() => handleOpenChange(false)} className="w-full">
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ─── Basic info ───────────────────────────────────────── */}
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Agent details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="123 Main Street"
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    placeholder="Lagos"
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="lga">LGA</Label>
                  <Input
                    id="lga"
                    value={formData.lga}
                    onChange={(e) =>
                      setFormData({ ...formData, lga: e.target.value })
                    }
                    placeholder="Ikeja"
                    disabled={loading}
                  />
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="Ikeja"
                    disabled={loading}
                  />
                </div>
              </div>
            </section>

            <hr className="border-border" />

            {/* ─── Mobile app access ────────────────────────────────── */}
            <section className="space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-lg bg-primary/10 p-2 text-primary">
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Mobile app access
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Master switch — turn off to revoke all field-app access
                    </p>
                  </div>
                </div>
                <Switch
                  checked={canUseMobileApp}
                  onCheckedChange={setCanUseMobileApp}
                  disabled={loading}
                />
              </div>
            </section>

            {canUseMobileApp && (
              <>
                <hr className="border-border" />

                {/* ─── Permissions (tile grid, Xenia-style) ───────── */}
                <section className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-primary/10 p-2 text-primary">
                      <Shield className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">
                        Permissions
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Tap to enable each capability for this agent
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PERMISSIONS.map((p) => {
                      const active = permissions[p.key];
                      const Icon = p.icon;
                      return (
                        <button
                          type="button"
                          key={p.key}
                          onClick={() => togglePermission(p.key)}
                          disabled={loading}
                          className={
                            "text-left rounded-lg border p-3 transition relative " +
                            (active
                              ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                              : "border-border bg-muted/40 hover:bg-muted/70")
                          }
                        >
                          <div className="flex items-start gap-2">
                            <Icon
                              className={
                                "h-4 w-4 mt-0.5 shrink-0 " +
                                (active
                                  ? "text-primary"
                                  : "text-muted-foreground")
                              }
                            />
                            <div className="min-w-0">
                              <p
                                className={
                                  "text-sm font-medium " +
                                  (active ? "text-primary" : "text-foreground")
                                }
                              >
                                {p.label}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {p.hint}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>

                <hr className="border-border" />

                {/* ─── Territory ─────────────────────────────────── */}
                <section className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-lg bg-primary/10 p-2 text-primary">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Territory
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Pick the streets this agent can see customers from
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-muted-foreground">
                        All areas
                      </span>
                      <Switch
                        checked={assignAllAreas}
                        onCheckedChange={setAssignAllAreas}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {!assignAllAreas && (
                    <div className="rounded-lg border border-border bg-muted/30 divide-y divide-border max-h-72 overflow-y-auto">
                      {loadingRefs ? (
                        <p className="text-xs text-muted-foreground p-3">
                          Loading…
                        </p>
                      ) : wards.length === 0 ? (
                        <p className="text-xs text-muted-foreground p-3">
                          No wards configured yet.
                        </p>
                      ) : (
                        wards.map((w) => {
                          const wardId = getId(w);
                          const wardStreets = streetsByWard.get(wardId) ?? [];
                          const wardStreetIds = wardStreets.map(getId);
                          const selectedInWard = wardStreetIds.filter((id) =>
                            selectedStreetIds.includes(id),
                          ).length;
                          const allInWard =
                            wardStreetIds.length > 0 &&
                            selectedInWard === wardStreetIds.length;
                          const someInWard =
                            selectedInWard > 0 && !allInWard;
                          const expanded = expandedWardIds.includes(wardId);

                          return (
                            <div key={wardId}>
                              <button
                                type="button"
                                onClick={() => toggleWardExpanded(wardId)}
                                className="w-full flex items-center justify-between p-3 hover:bg-muted/60 transition text-left"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  {expanded ? (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                                  )}
                                  <span className="text-sm font-medium text-foreground truncate">
                                    {w.name}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span
                                    className={
                                      "text-xs " +
                                      (allInWard
                                        ? "text-primary font-semibold"
                                        : someInWard
                                          ? "text-warning font-medium"
                                          : "text-muted-foreground")
                                    }
                                  >
                                    {selectedInWard}/{wardStreetIds.length}
                                  </span>
                                </div>
                              </button>

                              {expanded && (
                                <div className="bg-background/40 px-3 pb-3 pt-1 space-y-2">
                                  {wardStreetIds.length > 0 && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        toggleAllStreetsInWard(wardId)
                                      }
                                      className="text-xs font-medium text-primary hover:underline pl-6"
                                    >
                                      {allInWard
                                        ? "Deselect all in ward"
                                        : "Select all in ward"}
                                    </button>
                                  )}
                                  {wardStreets.length === 0 ? (
                                    <p className="text-xs text-muted-foreground pl-6">
                                      No streets in this ward yet.
                                    </p>
                                  ) : (
                                    <div className="space-y-1">
                                      {wardStreets.map((s) => {
                                        const id = getId(s);
                                        const checked =
                                          selectedStreetIds.includes(id);
                                        return (
                                          <label
                                            key={id}
                                            className="flex items-center gap-2 pl-6 py-1 cursor-pointer text-sm text-foreground/90 hover:text-foreground"
                                          >
                                            <input
                                              type="checkbox"
                                              className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary"
                                              checked={checked}
                                              onChange={() => toggleStreet(id)}
                                            />
                                            <span className="select-none">
                                              {s.name}
                                            </span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {!assignAllAreas && (
                    <p className="text-xs text-muted-foreground">
                      {selectedStreetIds.length} street
                      {selectedStreetIds.length === 1 ? "" : "s"} selected
                      across {derivedWardIds.length} ward
                      {derivedWardIds.length === 1 ? "" : "s"}.
                    </p>
                  )}
                </section>
              </>
            )}

            <div className="flex gap-3 pt-2">
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
