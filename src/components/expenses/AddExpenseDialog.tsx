import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AddExpenseDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Array<{ _id: string; name: string }>;
}

export function AddExpenseDialog({
  open,
  onClose,
  onSuccess,
  categories,
}: AddExpenseDialogProps) {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    amount: "",
    categoryId: "",
    expenseDate: new Date().toISOString().split("T")[0],
    paymentMethod: "",
    paymentReference: "",
    vendor: "",
    notes: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title || !formData.amount || !formData.categoryId || !formData.paymentMethod) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const response = await apiService.createExpense(accessToken, {
        title: formData.title,
        description: formData.description || undefined,
        amount: parseFloat(formData.amount),
        categoryId: formData.categoryId,
        expenseDate: formData.expenseDate,
        paymentMethod: formData.paymentMethod,
        paymentReference: formData.paymentReference || undefined,
        vendor: formData.vendor || undefined,
        notes: formData.notes || undefined,
      });

      if (response.success) {
        toast.success("Expense created successfully");
        onSuccess();
        setFormData({
          title: "",
          description: "",
          amount: "",
          categoryId: "",
          expenseDate: new Date().toISOString().split("T")[0],
          paymentMethod: "",
          paymentReference: "",
          vendor: "",
          notes: "",
        });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to create expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Expense</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title */}
            <div className="md:col-span-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="e.g., Office Rent - January 2026"
                required
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Additional details about this expense"
                rows={2}
              />
            </div>

            {/* Category */}
            <div>
              <Label htmlFor="categoryId">
                Category <span className="text-red-500">*</span>
              </Label>
              {categories.length === 0 ? (
                <div className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-3">
                  No expense categories found. Please go to Settings → Expenses to create categories first.
                </div>
              ) : (
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => handleChange("categoryId", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category._id} value={category._id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Amount */}
            <div>
              <Label htmlFor="amount">
                Amount (₦) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={(e) => handleChange("amount", e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            {/* Expense Date */}
            <div>
              <Label htmlFor="expenseDate">
                Expense Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="expenseDate"
                type="date"
                value={formData.expenseDate}
                onChange={(e) => handleChange("expenseDate", e.target.value)}
                required
              />
            </div>

            {/* Payment Method */}
            <div>
              <Label htmlFor="paymentMethod">
                Payment Method <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => handleChange("paymentMethod", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="pos">POS</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Payment Reference */}
            <div>
              <Label htmlFor="paymentReference">Payment Reference</Label>
              <Input
                id="paymentReference"
                value={formData.paymentReference}
                onChange={(e) => handleChange("paymentReference", e.target.value)}
                placeholder="e.g., TXN-2026-001"
              />
            </div>

            {/* Vendor */}
            <div>
              <Label htmlFor="vendor">Vendor/Supplier</Label>
              <Input
                id="vendor"
                value={formData.vendor}
                onChange={(e) => handleChange("vendor", e.target.value)}
                placeholder="e.g., ABC Property Management"
              />
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Any additional notes"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || categories.length === 0}>
              {loading ? "Creating..." : "Create Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
