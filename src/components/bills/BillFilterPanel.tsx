import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, X } from "@/lib/icons";
import { useState } from "react";

export type BillFilters = {
  wardId: string;
  streetId: string;
  status: string;
  billCycleId: string;
  dateFrom: string;
  dateTo: string;
};

interface BillFilterPanelProps {
  filters: BillFilters;
  onFiltersChange: (f: BillFilters) => void;
  onClear: () => void;
  wards: any[];
  streets: any[];
  cycles: any[];
}

const getId = (item: any): string => item?.id || item?._id || "";

export function BillFilterPanel({ filters, onFiltersChange, onClear, wards, streets, cycles }: BillFilterPanelProps) {
  const [open, setOpen] = useState(false);

  const set = (patch: Partial<BillFilters>) => onFiltersChange({ ...filters, ...patch });

  const activeCount = [
    filters.wardId,
    filters.streetId,
    filters.status,
    filters.billCycleId,
    filters.dateFrom,
    filters.dateTo,
  ].filter(Boolean).length;

  const visibleStreets = streets.filter((s) => {
    if (!filters.wardId) return true;
    const w = s.wardId ?? s.ward;
    const wid = typeof w === "object" ? getId(w) : w;
    return !wid || wid === filters.wardId;
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeCount > 0 && (
            <span className="ml-1 rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Filter Bills</span>
            {activeCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="h-8 gap-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>Filter generated bills by status, cycle, location and date.</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Status & Type */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Status &amp; Cycle</h3>

            <div className="space-y-2">
              <Label className="text-sm text-gray-700">Status</Label>
              <Select value={filters.status || "all"} onValueChange={(v) => set({ status: v === "all" ? "" : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-700">Bill cycle</Label>
              <Select
                value={filters.billCycleId || "all"}
                onValueChange={(v) => set({ billCycleId: v === "all" ? "" : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All cycles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cycles</SelectItem>
                  {cycles.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Location</h3>

            <div className="space-y-2">
              <Label className="text-sm text-gray-700">Ward</Label>
              <Select
                value={filters.wardId || "all"}
                onValueChange={(v) => set({ wardId: v === "all" ? "" : v, streetId: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All wards" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All wards</SelectItem>
                  {wards.map((w) => (
                    <SelectItem key={getId(w)} value={getId(w)}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-700">Street</Label>
              <Select
                value={filters.streetId || "all"}
                onValueChange={(v) => set({ streetId: v === "all" ? "" : v })}
                disabled={visibleStreets.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All streets" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All streets</SelectItem>
                  {visibleStreets.map((s) => (
                    <SelectItem key={getId(s)} value={getId(s)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generated date range */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Generated date</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">From</Label>
                <Input type="date" value={filters.dateFrom} onChange={(e) => set({ dateFrom: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-gray-700">To</Label>
                <Input type="date" value={filters.dateTo} onChange={(e) => set({ dateTo: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2 border-t pt-6">
          <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button className="flex-1" onClick={() => setOpen(false)}>
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
