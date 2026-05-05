import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Save,
  Calendar,
  Clock,
  CheckCircle,
  Shield,
  Smartphone,
  UserPlus,
  ScanLine,
  Receipt,
  Globe,
  Hash,
  IdCard,
  Pencil,
  ChevronDown,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

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

const getId = (item: { id?: string; _id?: string }): string =>
  item.id || item._id || "";

const PERMISSION_DEFS: {
  key: string;
  label: string;
  hint: string;
  icon: LucideIcon;
}[] = [
  {
    key: "canUseMobileApp",
    label: "Mobile app access",
    hint: "Master switch — can sign in to the field-agent app",
    icon: Smartphone,
  },
  {
    key: "canManageCustomers",
    label: "View customers",
    hint: "See customer details, debt and history",
    icon: Users,
  },
  {
    key: "canEnumerateCustomers",
    label: "Enumerate customers",
    hint: "Add new households or businesses",
    icon: UserPlus,
  },
  {
    key: "canScanBarcodes",
    label: "Scan barcodes",
    hint: "Use camera to look up customers",
    icon: ScanLine,
  },
  {
    key: "canViewInvoices",
    label: "View invoices & debt",
    hint: "See pending invoices and outstanding amounts",
    icon: Receipt,
  },
  {
    key: "canRecordPayments",
    label: "Record payments",
    hint: "Mark payments collected in the field",
    icon: Wallet,
  },
];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount || 0);

const initials = (name: string) =>
  (name || "")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

const AgentDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { accessToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<any>(null);

  // Territory editing
  const [allWards, setAllWards] = useState<Ward[]>([]);
  const [streets, setStreets] = useState<Street[]>([]);
  const [editAllAreas, setEditAllAreas] = useState(true);
  const [editSelectedStreets, setEditSelectedStreets] = useState<string[]>([]);
  const [expandedWardIds, setExpandedWardIds] = useState<string[]>([]);
  const [isEditingTerritory, setIsEditingTerritory] = useState(false);
  const [saving, setSaving] = useState(false);

  // Tabs (controlled so Overview can jump to other tabs)
  const [activeTab, setActiveTab] = useState("overview");

  // Permissions editing
  const [isEditingPermissions, setIsEditingPermissions] = useState(false);
  const [editPermissions, setEditPermissions] = useState<Record<string, boolean>>({});
  const [savingPermissions, setSavingPermissions] = useState(false);

  // Collections pagination
  const [collectionsPage, setCollectionsPage] = useState(1);
  const collectionsPerPage = 10;

  useEffect(() => {
    if (id && accessToken) {
      loadAgentDetails();
      loadWardsAndStreets();
    }
  }, [id, accessToken]);

  const loadAgentDetails = async () => {
    if (!accessToken || !id) return;
    setLoading(true);
    try {
      const response = await apiService.getStaffById(accessToken, id);
      setAgent(response);
      const allAreas = response.assignAllWards ?? false;
      setEditAllAreas(allAreas);
      setEditSelectedStreets(
        (response.assignedStreets || []).map((s: any) => getId(s)),
      );
      setEditPermissions({ ...(response.permissions || {}) });
    } catch (error: any) {
      console.error("Error loading agent:", error);
      toast.error(error.message || "Failed to load agent details");
    } finally {
      setLoading(false);
    }
  };

  const loadWardsAndStreets = async () => {
    if (!accessToken) return;
    try {
      const [wardsRes, streetsRes] = await Promise.all([
        apiService.getActiveWards(accessToken),
        apiService.getStreets(accessToken),
      ]);
      setAllWards(wardsRes?.data || []);
      setStreets(streetsRes?.data || []);
    } catch (err) {
      console.error("Failed to load wards/streets:", err);
    }
  };

  const handleSaveTerritory = async () => {
    if (!accessToken || !id) return;
    if (!editAllAreas && editSelectedStreets.length === 0) {
      toast.error("Pick at least one street, or enable 'All areas'.");
      return;
    }
    setSaving(true);
    try {
      const derivedWardIds = Array.from(
        new Set(
          streets
            .filter((s) => editSelectedStreets.includes(getId(s)))
            .map((s) =>
              typeof s.wardId === "object" ? getId(s.wardId) : s.wardId,
            )
            .filter(Boolean) as string[],
        ),
      );
      await apiService.updateStaffTerritory(accessToken, id, {
        assignAllWards: editAllAreas,
        assignAllStreets: editAllAreas,
        assignedWards: editAllAreas ? [] : derivedWardIds,
        assignedStreets: editAllAreas ? [] : editSelectedStreets,
      });
      toast.success("Territory updated");
      setIsEditingTerritory(false);
      const fresh = await apiService.getStaffById(accessToken, id);
      setAgent(fresh);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update territory");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePermissions = async () => {
    if (!accessToken || !id) return;
    setSavingPermissions(true);
    try {
      await apiService.updateStaffPermissions(accessToken, id, editPermissions);
      toast.success("Permissions updated");
      setIsEditingPermissions(false);
      const fresh = await apiService.getStaffById(accessToken, id);
      setAgent(fresh);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to update permissions");
    } finally {
      setSavingPermissions(false);
    }
  };

  const togglePermissionEdit = (key: string) => {
    setEditPermissions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleStreet = (streetId: string) => {
    setEditSelectedStreets((prev) =>
      prev.includes(streetId)
        ? prev.filter((id) => id !== streetId)
        : [...prev, streetId],
    );
  };

  const toggleWardExpanded = (wardId: string) => {
    setExpandedWardIds((prev) =>
      prev.includes(wardId)
        ? prev.filter((x) => x !== wardId)
        : [...prev, wardId],
    );
  };

  const streetsByWard = (() => {
    const map = new Map<string, Street[]>();
    for (const s of streets) {
      const wId = typeof s.wardId === "object" ? getId(s.wardId) : s.wardId;
      if (!wId) continue;
      const list = map.get(wId) ?? [];
      list.push(s);
      map.set(wId, list);
    }
    return map;
  })();

  const toggleAllStreetsInWard = (wardId: string) => {
    const wardStreets = streetsByWard.get(wardId) ?? [];
    const ids = wardStreets.map(getId);
    const allSelected = ids.every((id) => editSelectedStreets.includes(id));
    setEditSelectedStreets((prev) => {
      if (allSelected) return prev.filter((id) => !ids.includes(id));
      return Array.from(new Set([...prev, ...ids]));
    });
  };

  const paginatedCollections = (agent?.recentCollections || []).slice(
    (collectionsPage - 1) * collectionsPerPage,
    collectionsPage * collectionsPerPage,
  );
  const totalCollectionPages = Math.ceil(
    (agent?.recentCollections?.length || 0) / collectionsPerPage,
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!agent) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/agents")}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Agents
          </Button>
          <div className="text-center py-12 text-muted-foreground">
            Agent not found
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const perm = agent.permissions || {};
  const assignAllWards = agent.assignAllWards ?? false;
  const assignAllStreets = agent.assignAllStreets ?? false;

  // Effective lists: when "All areas" is on, the agent has access to every
  // ward/street the PSP has — show those instead of an empty array.
  const effectiveWards: { id: string; name: string }[] = assignAllWards
    ? allWards.map((w) => ({ id: getId(w), name: w.name }))
    : (agent.assignedWards || []).map((w: any) => ({
        id: getId(w),
        name: w.name,
      }));

  const effectiveStreets: { id: string; name: string }[] = assignAllStreets
    ? streets.map((s) => ({ id: getId(s), name: s.name }))
    : (agent.assignedStreets || []).map((s: any) => ({
        id: getId(s),
        name: s.name,
      }));

  const wardCount = effectiveWards.length;
  const streetCount = effectiveStreets.length;
  const isFullAccess = assignAllWards && assignAllStreets;
  const collectionRate = agent.performance?.collectionRate || 0;

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-full">
        {/* Back */}
        <Button
          variant="ghost"
          onClick={() => navigate("/agents")}
          className="mb-2 -ml-3"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Agents
        </Button>

        {/* Header */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
              <div className="flex items-start gap-4 flex-1">
                <div className="h-16 w-16 rounded-xl bg-primary text-primary-foreground flex items-center justify-center text-xl font-semibold tracking-tight">
                  {initials(agent.fullName)}
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-semibold tracking-tight text-foreground">
                    {agent.fullName}
                  </h1>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <span className="font-mono">{agent.staffId}</span>
                    <span>•</span>
                    <Badge
                      variant="secondary"
                      className={
                        agent.status === "active"
                          ? "bg-success/15 text-success hover:bg-success/15 border-0"
                          : agent.status === "suspended"
                            ? "bg-destructive/15 text-destructive hover:bg-destructive/15 border-0"
                            : "border-0"
                      }
                    >
                      {agent.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Joined{" "}
                    {agent.createdAt
                      ? format(new Date(agent.createdAt), "d MMM yyyy")
                      : "—"}
                  </p>
                </div>
              </div>

              {/* Contact column + Edit dropdown */}
              <div className="flex items-start gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-3.5 w-3.5" />
                    <span className="text-foreground">
                      {agent.email || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    <span className="text-foreground">
                      {agent.phone || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="text-foreground">
                      {agent.address || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-3.5 w-3.5" />
                    <span className="text-foreground">
                      {[agent.city, agent.lga, agent.state]
                        .filter(Boolean)
                        .join(", ") || "—"}
                    </span>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" className="gap-1.5">
                      <Pencil className="h-3.5 w-3.5" />
                      Edit Agent
                      <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuLabel className="text-xs">
                      Edit
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setActiveTab("permissions");
                        setEditPermissions({ ...(agent.permissions || {}) });
                        setIsEditingPermissions(true);
                      }}
                    >
                      <Shield className="h-4 w-4 mr-2" />
                      Permissions
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setActiveTab("territory");
                        setIsEditingTerritory(true);
                      }}
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Territory
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatTile
            label="Total Pickups"
            value={agent.performance?.totalPickups ?? 0}
            icon={Truck}
          />
          <StatTile
            label="This Month"
            value={agent.performance?.pickupsThisMonth ?? 0}
            icon={TrendingUp}
          />
          <StatTile
            label="Customers Served"
            value={agent.performance?.uniqueCustomersServed ?? 0}
            icon={Users}
          />
          <StatTile
            label="In Territory"
            value={agent.performance?.customersInTerritory ?? 0}
            icon={MapPin}
          />
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="bg-muted/50 p-1 h-auto">
            <TabsTrigger value="overview" className="text-xs px-4 py-1.5">
              Overview
            </TabsTrigger>
            <TabsTrigger value="permissions" className="text-xs px-4 py-1.5">
              Permissions
            </TabsTrigger>
            <TabsTrigger value="territory" className="text-xs px-4 py-1.5">
              Territory
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs px-4 py-1.5">
              Activity
            </TabsTrigger>
          </TabsList>

          {/* OVERVIEW */}
          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
              {/* Profile */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold tracking-tight">
                    Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0 divide-y divide-border">
                  <FieldRow icon={IdCard} label="Staff ID">
                    <span className="font-mono">{agent.staffId}</span>
                  </FieldRow>
                  <FieldRow icon={Hash} label="Internal ID">
                    <span className="font-mono text-xs text-muted-foreground">
                      {agent.id}
                    </span>
                  </FieldRow>
                  <FieldRow icon={Mail} label="Email">
                    {agent.email || "—"}
                  </FieldRow>
                  <FieldRow icon={Phone} label="Phone">
                    {agent.phone || "—"}
                  </FieldRow>
                  <FieldRow icon={MapPin} label="Address">
                    {agent.address || "—"}
                  </FieldRow>
                  <FieldRow icon={Globe} label="Region">
                    {[agent.city, agent.lga, agent.state]
                      .filter(Boolean)
                      .join(", ") || "—"}
                  </FieldRow>
                  <FieldRow icon={Calendar} label="Created">
                    {agent.createdAt
                      ? format(new Date(agent.createdAt), "d MMM yyyy 'at' h:mm a")
                      : "—"}
                  </FieldRow>
                </CardContent>
              </Card>

              {/* Right column: Revenue + Territory summary stacked */}
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold tracking-tight">
                      Revenue (Territory)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <KpiRow
                      label="Total billed"
                      value={formatCurrency(
                        agent.performance?.totalRevenueInTerritory || 0,
                      )}
                      sub={`${
                        agent.performance?.customersInTerritory || 0
                      } customers`}
                    />
                    <KpiRow
                      label="Total collected"
                      value={formatCurrency(
                        agent.performance?.totalPaidInTerritory || 0,
                      )}
                      valueClassName="text-success"
                    />
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Collection rate
                        </span>
                        <span className="font-semibold">{collectionRate}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${Math.min(collectionRate, 100)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Territory summary — visible on Overview without switching tabs */}
                <Card>
                  <CardHeader className="pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5" />
                      Territory
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => setActiveTab("territory")}
                    >
                      Edit
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {isFullAccess && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <Globe className="h-3 w-3 text-primary" />
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                            Full access
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Wards</span>
                        <span className="font-semibold">{wardCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Streets</span>
                        <span className="font-semibold">{streetCount}</span>
                      </div>
                      {streetCount > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {effectiveStreets.slice(0, 4).map((s) => (
                            <Badge
                              key={s.id}
                              variant="secondary"
                              className="text-[10px] py-0 px-1.5"
                            >
                              {s.name}
                            </Badge>
                          ))}
                          {streetCount > 4 && (
                            <Badge
                              variant="outline"
                              className="text-[10px] py-0 px-1.5"
                            >
                              +{streetCount - 4} more
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Access summary */}
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-semibold tracking-tight">
                  Access at a glance
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setActiveTab("permissions")}
                >
                  Edit
                </Button>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {PERMISSION_DEFS.map((p) => {
                  const active = !!perm[p.key];
                  const Icon = p.icon;
                  return (
                    <div
                      key={p.key}
                      className={
                        "flex items-center gap-2 p-2.5 rounded-lg border " +
                        (active
                          ? "border-primary/30 bg-primary/5"
                          : "border-border bg-muted/30 opacity-60")
                      }
                    >
                      <Icon
                        className={
                          "h-3.5 w-3.5 " +
                          (active ? "text-primary" : "text-muted-foreground")
                        }
                      />
                      <span
                        className={
                          "text-xs font-medium " +
                          (active ? "text-foreground" : "text-muted-foreground")
                        }
                      >
                        {p.label}
                      </span>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          {/* PERMISSIONS */}
          <TabsContent value="permissions" className="mt-4">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Permissions
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    What this agent can do in the mobile app
                  </p>
                </div>
                {!isEditingPermissions ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditPermissions({ ...(agent.permissions || {}) });
                      setIsEditingPermissions(true);
                    }}
                  >
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingPermissions(false);
                        setEditPermissions({ ...(agent.permissions || {}) });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSavePermissions}
                      disabled={savingPermissions}
                    >
                      {savingPermissions ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PERMISSION_DEFS.map((p) => {
                    const source = isEditingPermissions
                      ? editPermissions
                      : perm;
                    const active = !!source[p.key];
                    const Icon = p.icon;
                    return (
                      <button
                        type="button"
                        key={p.key}
                        disabled={!isEditingPermissions || savingPermissions}
                        onClick={() => togglePermissionEdit(p.key)}
                        className={
                          "text-left p-3 rounded-lg border flex items-start gap-3 transition " +
                          (active
                            ? "border-primary/30 bg-primary/5"
                            : "border-border bg-muted/30") +
                          (isEditingPermissions
                            ? " cursor-pointer hover:border-primary/50"
                            : " cursor-default")
                        }
                      >
                        <div
                          className={
                            "shrink-0 h-8 w-8 rounded-lg flex items-center justify-center " +
                            (active
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground")
                          }
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p
                              className={
                                "text-sm font-medium " +
                                (active
                                  ? "text-foreground"
                                  : "text-muted-foreground")
                              }
                            >
                              {p.label}
                            </p>
                            <Badge
                              variant="secondary"
                              className={
                                active
                                  ? "bg-success/15 text-success hover:bg-success/15 border-0 text-[10px] py-0"
                                  : "bg-muted text-muted-foreground hover:bg-muted border-0 text-[10px] py-0"
                              }
                            >
                              {active ? "ON" : "OFF"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {p.hint}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {isEditingPermissions && (
                  <p className="text-xs text-muted-foreground mt-3">
                    Tap any tile to toggle. Hit Save to apply.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* TERRITORY */}
          <TabsContent value="territory" className="mt-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Assigned Territory
                </CardTitle>
                {!isEditingTerritory ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditingTerritory(true)}
                  >
                    Edit
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingTerritory(false);
                        setEditAllAreas(agent.assignAllWards ?? false);
                        setEditSelectedStreets(
                          (agent.assignedStreets || []).map((s: any) => getId(s)),
                        );
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveTerritory}
                      disabled={saving}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Save className="h-4 w-4 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {isEditingTerritory ? (
                  <div className="space-y-5">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
                      <div>
                        <p className="text-sm font-medium">
                          Give access to all areas
                        </p>
                        <p className="text-xs text-muted-foreground">
                          When on, agent sees customers from every ward and
                          street.
                        </p>
                      </div>
                      <Switch
                        checked={editAllAreas}
                        onCheckedChange={setEditAllAreas}
                      />
                    </div>

                    {!editAllAreas && (
                      <div className="space-y-2">
                        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                          Pick wards & streets
                        </Label>
                        <div className="rounded-lg border border-border bg-muted/30 divide-y divide-border max-h-80 overflow-y-auto">
                          {allWards.length === 0 ? (
                            <p className="text-xs text-muted-foreground p-3">
                              No wards configured yet.
                            </p>
                          ) : (
                            allWards.map((w) => {
                              const wardId = getId(w);
                              const wardStreets = streetsByWard.get(wardId) ?? [];
                              const wardStreetIds = wardStreets.map(getId);
                              const selectedInWard = wardStreetIds.filter((id) =>
                                editSelectedStreets.includes(id),
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
                                    <span
                                      className={
                                        "text-xs shrink-0 " +
                                        (allInWard
                                          ? "text-primary font-semibold"
                                          : someInWard
                                            ? "text-warning font-medium"
                                            : "text-muted-foreground")
                                      }
                                    >
                                      {selectedInWard}/{wardStreetIds.length}
                                    </span>
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
                                            const sid = getId(s);
                                            const checked =
                                              editSelectedStreets.includes(sid);
                                            return (
                                              <label
                                                key={sid}
                                                className="flex items-center gap-2 pl-6 py-1 cursor-pointer text-sm text-foreground/90 hover:text-foreground"
                                              >
                                                <input
                                                  type="checkbox"
                                                  className="h-4 w-4 rounded border-border bg-background text-primary focus:ring-primary"
                                                  checked={checked}
                                                  onChange={() =>
                                                    toggleStreet(sid)
                                                  }
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
                        <p className="text-xs text-muted-foreground pt-1">
                          {editSelectedStreets.length} street
                          {editSelectedStreets.length === 1 ? "" : "s"} selected
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5">
                    {isFullAccess && (
                      <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
                        <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                          <Globe className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                            Full access
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Agent can see customers from every ward and street
                            below.
                          </p>
                        </div>
                      </div>
                    )}

                    <div>
                      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Wards ({wardCount})
                      </Label>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {wardCount > 0 ? (
                          effectiveWards.map((w) => (
                            <Badge
                              key={w.id}
                              variant="secondary"
                              className="py-0.5"
                            >
                              {w.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            No wards assigned
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Streets ({streetCount})
                      </Label>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {streetCount > 0 ? (
                          effectiveStreets.map((s) => (
                            <Badge
                              key={s.id}
                              variant="outline"
                              className="py-0.5"
                            >
                              {s.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            No streets assigned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ACTIVITY */}
          <TabsContent value="activity" className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold tracking-tight flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agent.recentCollections?.length > 0 ? (
                  <div className="space-y-1">
                    {paginatedCollections.map((col: any) => (
                      <div
                        key={col.id}
                        className="flex items-center justify-between py-3 border-b border-border last:border-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                            <CheckCircle className="h-3.5 w-3.5 text-success" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {col.customerName}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono truncate">
                              {col.customerAccount}
                            </p>
                          </div>
                        </div>
                        <div className="text-right text-xs text-muted-foreground shrink-0">
                          <div className="flex items-center gap-1 justify-end">
                            <Calendar className="h-3 w-3" />
                            {col.collectionDate
                              ? format(new Date(col.collectionDate), "d MMM yyyy")
                              : "—"}
                          </div>
                          <div className="flex items-center gap-1 justify-end mt-0.5">
                            <Clock className="h-3 w-3" />
                            {col.collectionDate
                              ? format(new Date(col.collectionDate), "h:mm a")
                              : ""}
                          </div>
                        </div>
                      </div>
                    ))}

                    {totalCollectionPages > 1 && (
                      <div className="flex items-center justify-between pt-4">
                        <p className="text-xs text-muted-foreground">
                          {(collectionsPage - 1) * collectionsPerPage + 1}–
                          {Math.min(
                            collectionsPage * collectionsPerPage,
                            agent.recentCollections.length,
                          )}{" "}
                          of {agent.recentCollections.length}
                        </p>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCollectionsPage((p) => Math.max(1, p - 1))
                            }
                            disabled={collectionsPage === 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setCollectionsPage((p) =>
                                Math.min(totalCollectionPages, p + 1),
                              )
                            }
                            disabled={collectionsPage === totalCollectionPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Truck className="h-9 w-9 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-sm font-medium text-foreground">
                      No activity yet
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pickups and customer enumerations will appear here.
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

// ─── Small components ──────────────────────────────────────────────────

function StatTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </p>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <p className="text-2xl font-semibold tracking-tight text-foreground">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

function FieldRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 gap-4 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2 text-muted-foreground min-w-[140px]">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-xs font-medium uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="text-sm text-foreground text-right truncate">
        {children}
      </div>
    </div>
  );
}

function KpiRow({
  label,
  value,
  sub,
  valueClassName,
}: {
  label: string;
  value: string;
  sub?: string;
  valueClassName?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          "text-lg font-semibold tracking-tight " +
          (valueClassName || "text-foreground")
        }
      >
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

export default AgentDetails;
