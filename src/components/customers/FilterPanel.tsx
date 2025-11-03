import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, X } from "lucide-react";
import { nigerianStates } from "@/lib/nigeriaData";
import { useState } from "react";
import type { FilterOptions } from "@/types";

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  onClearFilters: () => void;
}

export function FilterPanel({ filters, onFiltersChange, onClearFilters }: FilterPanelProps) {
  const [open, setOpen] = useState(false);

  const updateFilter = (key: keyof FilterOptions, value: any) => {
    // Convert special "all" values back to empty/undefined
    let finalValue = value;
    if (value === "all-states" || value === "default") {
      finalValue = "";
    }
    onFiltersChange({ ...filters, [key]: finalValue });
  };

  const activeFilterCount = Object.values(filters).filter(
    (v) => v && v !== "all" && v !== ""
  ).length;

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
            Filter and sort customers by status, location, balance, and more
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Active Status Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900">Account Status</Label>
            <Select
              value={filters.isActive || "all"}
              onValueChange={(value: any) => updateFilter("isActive", value)}
            >
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

          {/* State Filter */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-900">State</Label>
            <Select
              value={filters.state || "all-states"}
              onValueChange={(value) => updateFilter("state", value)}
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

          <div className="border-t pt-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Sort By</h3>

            <div className="space-y-2 mb-4">
              <Label className="text-sm text-gray-700">Field</Label>
              <Select
                value={filters.sortBy || "default"}
                onValueChange={(value) => updateFilter("sortBy", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose field" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="accountNumber">Account Number</SelectItem>
                  <SelectItem value="currentBalance">Balance</SelectItem>
                  <SelectItem value="totalPaid">Total Paid</SelectItem>
                  <SelectItem value="createdAt">Date Created</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-gray-700">Order</Label>
              <Select
                value={filters.sortOrder || "asc"}
                onValueChange={(value: any) => updateFilter("sortOrder", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Ascending (A-Z, Low-High)</SelectItem>
                  <SelectItem value="desc">Descending (Z-A, High-Low)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => setOpen(false)}
          >
            Close
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              setOpen(false);
            }}
          >
            Apply Filters
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
