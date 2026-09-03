import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, X } from "@/lib/icons";
import { nigerianStates, getLGAsByState } from "@/lib/nigeriaData";
import { useState } from "react";
import type { FilterOptions } from "@/types";

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
}

const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "-");

export function FilterPanel({ filters, onFiltersChange, onClearFilters }: FilterPanelProps) {
  const [open, setOpen] = useState(false);

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    let finalValue = value;
    if (value === "all-states" || value === "all-lgas" || value === "default" || value === "any") {
      finalValue = "";
    }
    onFiltersChange({ ...filters, [key]: finalValue });
  };

  // Applying several fields at once (used by quick presets)
  const applyPreset = (patch: Partial<FilterOptions>) => {
    onFiltersChange({ ...filters, ...patch });
  };

  const activeFilterCount = Object.entries(filters).filter(
    ([k, v]) => v && v !== "all" && v !== "" && !(k === "sortOrder" && v === "asc")
  ).length;

  const lgas = filters.state ? getLGAsByState(filters.state) : [];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-1 rounded-full bg-primary text-primary-foreground px-2 py-0.5 text-xs font-medium">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Filter & Sort</span>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-8 gap-2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            Filter and sort customers by status, location, debt, and more
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Quick presets */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900">Quick views</Label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  applyPreset({ hasOutstanding: "true", sortBy: "currentBalance", sortOrder: "desc" })
                }
              >
                Top debtors
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset({ hasOutstanding: "true", paymentBehavior: "needs_attention" })}
              >
                Needs attention
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset({ paymentBehavior: "excellent", hasOutstanding: "all" })}
              >
                Fully paid
              </Button>
            </div>
          </div>

          {/* Account Status */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900">Account Status</Label>
            <Select value={filters.isActive || "all"} onValueChange={(v: any) => updateFilter("isActive", v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="true">Active Only</SelectItem>
                <SelectItem value="false">Inactive Only</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer Type */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900">Customer Type</Label>
            <Select value={filters.customerType || "all"} onValueChange={(v: any) => updateFilter("customerType", v)}>
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="standalone">Standalone</SelectItem>
                <SelectItem value="compound">Compound</SelectItem>
                <SelectItem value="estate">Estate</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Debt / payment section */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Debt & Payment</h3>

            <div className="space-y-2">
              <Label className="text-sm text-gray-700">Balance</Label>
              <Select
                value={filters.hasOutstanding || "all"}
                onValueChange={(v: any) => updateFilter("hasOutstanding", v === "all" ? "all" : v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All balances</SelectItem>
                  <SelectItem value="true">Owing only (deficit &gt; 0)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-700">Payment behaviour</Label>
              <Select
                value={filters.paymentBehavior || "any"}
                onValueChange={(v) => updateFilter("paymentBehavior", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="excellent">Excellent — fully paid</SelectItem>
                  <SelectItem value="good">Good — owes under half</SelectItem>
                  <SelectItem value="needs_attention">Needs attention — owes over half</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location section */}
          <div className="border-t pt-6 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900">Location</h3>

            <div className="space-y-2">
              <Label className="text-sm text-gray-700">State</Label>
              <Select
                value={filters.state || "all-states"}
                onValueChange={(v) => onFiltersChange({ ...filters, state: v === "all-states" ? "" : v, lga: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-states">All States</SelectItem>
                  {nigerianStates.map((state) => (
                    <SelectItem key={state.value} value={state.value}>
                      {state.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-700">LGA</Label>
              <Select
                value={filters.lga || "all-lgas"}
                onValueChange={(v) => updateFilter("lga", v)}
                disabled={!filters.state || lgas.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={filters.state ? "Select LGA" : "Select a state first"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-lgas">All LGAs</SelectItem>
                  {lgas.map((lga) => (
                    <SelectItem key={lga} value={slug(lga)}>
                      {lga}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sort */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Sort By</h3>

            <div className="space-y-2 mb-4">
              <Label className="text-sm text-gray-700">Field</Label>
              <Select value={filters.sortBy || "default"} onValueChange={(v) => updateFilter("sortBy", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default (date added)</SelectItem>
                  <SelectItem value="fullName">Name / Address</SelectItem>
                  <SelectItem value="currentBalance">Amount owed (deficit)</SelectItem>
                  <SelectItem value="totalDebt">Total billed</SelectItem>
                  <SelectItem value="totalPaid">Total paid</SelectItem>
                  <SelectItem value="createdAt">Date created</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-700">Order</Label>
              <Select value={filters.sortOrder || "asc"} onValueChange={(v: any) => updateFilter("sortOrder", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">Highest first (High → Low, newest)</SelectItem>
                  <SelectItem value="asc">Lowest first (Low → High, oldest)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t flex gap-2">
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
