import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SlidersHorizontal, X } from "lucide-react";

interface InvoiceFilterPanelProps {
  filters: {
    status?: string;
    sortBy?: string;
    sortOrder?: string;
    source?: string;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
}

export function InvoiceFilterPanel({
  filters,
  onFiltersChange,
  onClearFilters,
}: InvoiceFilterPanelProps) {
  const [open, setOpen] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const activeFilterCount = Object.values(filters).filter(
    (value) => value && value !== "all"
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
          <SheetTitle>Filter Invoices</SheetTitle>
          <SheetDescription>
            Apply filters to narrow down your invoice list
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="partially_paid">Partially Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort By */}
          <div className="space-y-2">
            <Label>Sort By</Label>
            <Select
              value={filters.sortBy || "createdAt"}
              onValueChange={(value) => handleFilterChange("sortBy", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="createdAt">Date Created</SelectItem>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="invoiceNumber">Invoice Number</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <Label>Sort Order</Label>
            <Select
              value={filters.sortOrder || "desc"}
              onValueChange={(value) => handleFilterChange("sortOrder", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Order..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Invoice Source (Manual/Automatic) */}
          <div className="space-y-2">
            <Label>Invoice Source</Label>
            <Select
              value={filters.source || "all"}
              onValueChange={(value) => handleFilterChange("source", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="automatic">Automatic</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                onClearFilters();
                setOpen(false);
              }}
              className="flex-1"
            >
              <X className="mr-2 h-4 w-4" />
              Clear All
            </Button>
            <Button onClick={() => setOpen(false)} className="flex-1">
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
