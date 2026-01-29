import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Plus, Pencil, Trash2, Home } from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PropertyType {
  _id: string;
  name: string;
  cost: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export function PropertyTypeSettings() {
  const { accessToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPropertyType, setSelectedPropertyType] = useState<PropertyType | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    cost: "",
    description: "",
  });

  useEffect(() => {
    loadPropertyTypes();
  }, [accessToken]);

  const loadPropertyTypes = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await apiService.getPropertyTypes(accessToken);
      setPropertyTypes(response?.data || []);
    } catch (error: any) {
      console.error("Failed to load property types:", error);
      toast.error(error.message || "Failed to load property types");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({ name: "", cost: "", description: "" });
    setShowAddDialog(true);
  };

  const handleEdit = (propertyType: PropertyType) => {
    setSelectedPropertyType(propertyType);
    setFormData({
      name: propertyType.name,
      cost: propertyType.cost.toString(),
      description: propertyType.description || "",
    });
    setShowEditDialog(true);
  };

  const handleDelete = (propertyType: PropertyType) => {
    setSelectedPropertyType(propertyType);
    setShowDeleteDialog(true);
  };

  const handleToggleActive = async (propertyType: PropertyType) => {
    if (!accessToken) return;

    try {
      await apiService.updatePropertyType(accessToken, propertyType._id, {
        isActive: !propertyType.isActive,
      });
      setPropertyTypes(prev =>
        prev.map(pt =>
          pt._id === propertyType._id ? { ...pt, isActive: !pt.isActive } : pt
        )
      );
      toast.success(
        `Property type ${!propertyType.isActive ? "activated" : "deactivated"} successfully`
      );
    } catch (error: any) {
      console.error("Failed to update property type:", error);
      toast.error(error.message || "Failed to update property type");
    }
  };

  const handleSaveAdd = async () => {
    if (!accessToken) return;

    if (!formData.name.trim()) {
      toast.error("Property type name is required");
      return;
    }

    const cost = parseFloat(formData.cost);
    if (isNaN(cost) || cost < 0) {
      toast.error("Please enter a valid cost");
      return;
    }

    setSaving(true);
    try {
      const response = await apiService.createPropertyType(accessToken, {
        name: formData.name.trim(),
        cost,
        description: formData.description.trim() || undefined,
      });

      setPropertyTypes(prev => [...prev, response.data]);
      setShowAddDialog(false);
      toast.success("Property type created successfully");
    } catch (error: any) {
      console.error("Failed to create property type:", error);
      toast.error(error.message || "Failed to create property type");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!accessToken || !selectedPropertyType) return;

    if (!formData.name.trim()) {
      toast.error("Property type name is required");
      return;
    }

    const cost = parseFloat(formData.cost);
    if (isNaN(cost) || cost < 0) {
      toast.error("Please enter a valid cost");
      return;
    }

    setSaving(true);
    try {
      const response = await apiService.updatePropertyType(
        accessToken,
        selectedPropertyType._id,
        {
          name: formData.name.trim(),
          cost,
          description: formData.description.trim() || undefined,
        }
      );

      setPropertyTypes(prev =>
        prev.map(pt => (pt._id === selectedPropertyType._id ? response.data : pt))
      );
      setShowEditDialog(false);
      setSelectedPropertyType(null);
      toast.success("Property type updated successfully");
    } catch (error: any) {
      console.error("Failed to update property type:", error);
      toast.error(error.message || "Failed to update property type");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!accessToken || !selectedPropertyType) return;

    setSaving(true);
    try {
      await apiService.deletePropertyType(accessToken, selectedPropertyType._id);
      setPropertyTypes(prev => prev.filter(pt => pt._id !== selectedPropertyType._id));
      setShowDeleteDialog(false);
      setSelectedPropertyType(null);
      toast.success("Property type deleted successfully");
    } catch (error: any) {
      console.error("Failed to delete property type:", error);
      toast.error(error.message || "Failed to delete property type");
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Property Types</CardTitle>
            <CardDescription>
              Manage property types and their associated costs
            </CardDescription>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Property Type
          </Button>
        </CardHeader>
        <CardContent>
          {propertyTypes.length === 0 ? (
            <div className="text-center py-12">
              <Home className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                No property types yet
              </h3>
              <p className="text-gray-500 mt-1">
                Get started by adding your first property type
              </p>
              <Button onClick={handleAdd} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Property Type
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {propertyTypes.map((propertyType) => (
                    <TableRow key={propertyType._id}>
                      <TableCell className="font-medium">
                        {propertyType.name}
                      </TableCell>
                      <TableCell className="font-semibold text-green-600">
                        {formatCurrency(propertyType.cost)}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-gray-500">
                        {propertyType.description || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={propertyType.isActive}
                            onCheckedChange={() => handleToggleActive(propertyType)}
                          />
                          <Badge
                            variant={propertyType.isActive ? "default" : "secondary"}
                          >
                            {propertyType.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(propertyType)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(propertyType)}
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
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Property Type</DialogTitle>
            <DialogDescription>
              Create a new property type with its associated cost
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Property Type Name *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Terrace, Flat, Duplex"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-cost">Cost (NGN) *</Label>
              <Input
                id="add-cost"
                type="number"
                min="0"
                value={formData.cost}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, cost: e.target.value }))
                }
                placeholder="e.g., 5000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-description">Description</Label>
              <Input
                id="add-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, description: e.target.value }))
                }
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowAddDialog(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveAdd} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Property Type"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Property Type</DialogTitle>
            <DialogDescription>Update the property type information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Property Type Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g., Terrace, Flat, Duplex"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-cost">Cost (NGN) *</Label>
              <Input
                id="edit-cost"
                type="number"
                min="0"
                value={formData.cost}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, cost: e.target.value }))
                }
                placeholder="e.g., 5000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) =>
                  setFormData(prev => ({ ...prev, description: e.target.value }))
                }
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditDialog(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Property Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedPropertyType?.name}"? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
