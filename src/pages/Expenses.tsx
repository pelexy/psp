import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/services/api";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Filter, Edit, Trash2 } from "lucide-react";
import { AddExpenseDialog } from "@/components/expenses/AddExpenseDialog";
import { EditExpenseDialog } from "@/components/expenses/EditExpenseDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ExpenseCategory {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

interface Expense {
  _id: string;
  title: string;
  description?: string;
  amount: number;
  categoryId: {
    _id: string;
    name: string;
  };
  expenseDate: string;
  paymentMethod: string;
  paymentReference?: string;
  vendor?: string;
  notes?: string;
  recordedBy?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

export default function Expenses() {
  const { accessToken } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  // Pagination and filters
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    categoryId: "",
    startDate: "",
    endDate: "",
    paymentMethod: "",
    vendor: "",
  });

  // Summary stats
  const [summary, setSummary] = useState<any[]>([]);
  const [totalExpenses, setTotalExpenses] = useState(0);

  useEffect(() => {
    loadExpenses();
    loadCategories();
    loadSummary();
  }, [currentPage, filters]);

  const loadExpenses = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);

      // Remove empty filter values
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== "")
      );

      const response = await apiService.getExpenses(accessToken, {
        page: currentPage,
        limit: 20,
        ...cleanFilters,
      });

      if (response.success) {
        setExpenses(response.data);
        setTotal(response.pagination.total);
        setTotalPages(response.pagination.totalPages);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    if (!accessToken) return;

    try {
      const response = await apiService.getExpenseCategories(accessToken);
      if (response.success) {
        setCategories(response.data);
      }
    } catch (error: any) {
      toast.error("Failed to load categories");
    }
  };

  const loadSummary = async () => {
    if (!accessToken) return;

    try {
      const response = await apiService.getExpenseSummary(
        accessToken,
        filters.startDate || undefined,
        filters.endDate || undefined
      );
      if (response.success) {
        setSummary(response.data || []);
        const total = (response.data || []).reduce((sum: number, item: any) => sum + item.total, 0);
        setTotalExpenses(total);
      }
    } catch (error: any) {
      console.error("Failed to load expense summary:", error);
      setSummary([]);
      setTotalExpenses(0);
    }
  };

  const handleDelete = async () => {
    if (!selectedExpense || !accessToken) return;

    try {
      await apiService.deleteExpense(accessToken, selectedExpense._id);
      toast.success("Expense deleted successfully");
      loadExpenses();
      loadSummary();
      setShowDeleteDialog(false);
      setSelectedExpense(null);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete expense");
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      categoryId: "",
      startDate: "",
      endDate: "",
      paymentMethod: "",
      vendor: "",
    });
    setCurrentPage(1);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-NG", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getPaymentMethodBadge = (method: string) => {
    const colors: Record<string, string> = {
      cash: "bg-green-100 text-green-800",
      pos: "bg-blue-100 text-blue-800",
      transfer: "bg-purple-100 text-purple-800",
      cheque: "bg-yellow-100 text-yellow-800",
      other: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={colors[method] || colors.other}>
        {method.toUpperCase()}
      </Badge>
    );
  };

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
            <p className="text-sm text-gray-500 mt-1">
              Track and manage your business expenses
            </p>
          </div>
          <Button
            onClick={() => setShowAddDialog(true)}
            className="w-full lg:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Expense
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                Total Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-500">
                Categories Used
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Select
                value={filters.categoryId || "all"}
                onValueChange={(value) => handleFilterChange("categoryId", value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category._id} value={category._id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="Start Date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
              />

              <Input
                type="date"
                placeholder="End Date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
              />

              <Select
                value={filters.paymentMethod || "all"}
                onValueChange={(value) => handleFilterChange("paymentMethod", value === "all" ? "" : value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="pos">POS</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Search vendor..."
                value={filters.vendor}
                onChange={(e) => handleFilterChange("vendor", e.target.value)}
              />
            </div>

            <div className="flex justify-end">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Expenses Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading expenses...</div>
            ) : categories.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-amber-600 bg-amber-50 border border-amber-200 rounded-md p-4 max-w-md mx-auto">
                  <p className="font-medium mb-2">No Expense Categories</p>
                  <p className="text-sm">
                    Before you can add expenses, you need to create expense categories first.
                    Go to Settings → Expenses tab to create categories like "Office Supplies", "Rent", "Utilities", etc.
                  </p>
                </div>
              </div>
            ) : expenses.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No expenses found. Click "Add Expense" to create one.
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Vendor</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {expenses.map((expense) => (
                        <TableRow key={expense._id}>
                          <TableCell className="font-medium">
                            {formatDate(expense.expenseDate)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{expense.title}</p>
                              {expense.description && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {expense.description}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {expense.categoryId.name}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {formatCurrency(expense.amount)}
                          </TableCell>
                          <TableCell>
                            {getPaymentMethodBadge(expense.paymentMethod)}
                          </TableCell>
                          <TableCell>{expense.vendor || "-"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedExpense(expense);
                                  setShowEditDialog(true);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedExpense(expense);
                                  setShowDeleteDialog(true);
                                }}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t">
                    <div className="text-sm text-gray-500">
                      Page {currentPage} of {totalPages} ({total} total)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialogs */}
      <AddExpenseDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSuccess={() => {
          loadExpenses();
          loadSummary();
          setShowAddDialog(false);
        }}
        categories={categories}
      />

      {selectedExpense && (
        <EditExpenseDialog
          open={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setSelectedExpense(null);
          }}
          onSuccess={() => {
            loadExpenses();
            loadSummary();
            setShowEditDialog(false);
            setSelectedExpense(null);
          }}
          expense={selectedExpense}
          categories={categories}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedExpense?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedExpense(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
