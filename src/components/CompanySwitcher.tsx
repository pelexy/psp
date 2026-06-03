import { useState } from "react";
import { Building2, Check, ChevronsUpDown, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { apiService, type CreateCompanyRequest } from "@/services/api";

const emptyForm: CreateCompanyRequest = {
  companyName: "",
  phone: "",
  address: "",
  state: "",
  lga: "",
  contactPersonName: "",
  contactPersonPhone: "",
  contactPersonEmail: "",
};

export function CompanySwitcher() {
  const { companies, psp, accessToken, switchCompany } = useAuth();
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<CreateCompanyRequest>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const activeId = psp?._id;
  const activeName = psp?.companyName || "Company";

  const handleSwitch = async (pspId: string) => {
    if (pspId === activeId || switchingId) return;
    setSwitchingId(pspId);
    try {
      await switchCompany(pspId); // reloads the page on success
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to switch company");
      setSwitchingId(null);
    }
  };

  const update = <K extends keyof CreateCompanyRequest>(
    key: K,
    value: CreateCompanyRequest[K],
  ) => setForm((f) => ({ ...f, [key]: value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyName.trim()) return toast.error("Company name is required");
    if (!form.phone.trim()) return toast.error("Phone is required");
    if (!accessToken) return;

    setSubmitting(true);
    try {
      // Strip empty optionals so the API doesn't get blank strings.
      const payload: CreateCompanyRequest = {
        companyName: form.companyName.trim(),
        phone: form.phone.trim(),
      };
      (Object.keys(form) as (keyof CreateCompanyRequest)[]).forEach((k) => {
        const v = (form[k] as string | undefined)?.trim();
        if (v && k !== "companyName" && k !== "phone") (payload as any)[k] = v;
      });

      const created = await apiService.createCompany(accessToken, payload);
      toast.success("Company created — switching you into it…");
      // Jump straight into the new company (reloads the page).
      await switchCompany(created.id);
    } catch (err: any) {
      toast.error(err?.message ?? "Failed to create company");
      setSubmitting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors max-w-[220px]">
            <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Building2 className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold text-gray-900 truncate">
              {activeName}
            </span>
            <ChevronsUpDown className="h-4 w-4 text-gray-400 shrink-0" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel className="text-xs text-gray-500">
            Your companies
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {companies.length === 0 && (
            <DropdownMenuItem disabled className="text-sm">
              {activeName}
            </DropdownMenuItem>
          )}
          {companies.map((c) => {
            const isActive = c.pspId === activeId;
            const isSwitching = switchingId === c.pspId;
            return (
              <DropdownMenuItem
                key={c.pspId}
                disabled={isActive || !!switchingId}
                onClick={() => handleSwitch(c.pspId)}
                className="cursor-pointer flex items-center gap-2"
              >
                <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                <span className="flex-1 truncate">{c.companyName}</span>
                {isSwitching ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                ) : isActive ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : null}
              </DropdownMenuItem>
            );
          })}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setCreateOpen(true)}
            className="cursor-pointer text-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create new company
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={createOpen} onOpenChange={(o) => !submitting && setCreateOpen(o)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Create new company</DialogTitle>
            <DialogDescription>
              Adds another company under your account. It gets its own customers,
              wallet and books. Commission settings match your existing company.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cs-name">Company name *</Label>
              <Input
                id="cs-name"
                value={form.companyName}
                onChange={(e) => update("companyName", e.target.value)}
                placeholder="ABC Waste (Ibadan Branch)"
                disabled={submitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cs-phone">Phone *</Label>
              <Input
                id="cs-phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="08012345678"
                disabled={submitting}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="cs-state">State</Label>
                <Input
                  id="cs-state"
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  placeholder="Oyo"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cs-lga">LGA</Label>
                <Input
                  id="cs-lga"
                  value={form.lga}
                  onChange={(e) => update("lga", e.target.value)}
                  placeholder="Ibadan North"
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cs-address">Address</Label>
              <Input
                id="cs-address"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="123 Main Street"
                disabled={submitting}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create & switch"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CompanySwitcher;
