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
import { Loader2, Plus, Pencil, Trash2, MapPin } from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Ward {
  _id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

export function WardSettings() {
  const { accessToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [wards, setWards] = useState<Ward[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedWard, setSelectedWard] = useState<Ward | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    loadWards();
  }, [accessToken]);

  const loadWards = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await apiService.getWards(accessToken);
      setWards(response?.data || []);
    } catch (error: any) {
      console.error("Failed to load wards:", error);
      toast.error(error.message || "Failed to load wards");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setFormData({ name: "", description: "" });
    setShowAddDialog(true);
  };

  const handleEdit = (ward: Ward) => {
    setSelectedWard(ward);
    setFormData({ name: ward.name, description: ward.description || "" });
    setShowEditDialog(true);
  };

  const handleDelete = (ward: Ward) => {
    setSelectedWard(ward);
    setShowDeleteDialog(true);
  };

  const handleToggleActive = async (ward: Ward) => {
    if (!accessToken) return;

    try {
      await apiService.updateWard(accessToken, ward._id, { isActive: !ward.isActive });
      setWards(prev =>
        prev.map(w => (w._id === ward._id ? { ...w, isActive: !w.isActive } : w))
      );
      toast.success(`Ward ${!ward.isActive ? "activated" : "deactivated"} successfully`);
    } catch (error: any) {
      console.error("Failed to update ward:", error);
      toast.error(error.message || "Failed to update ward");
    }
  };

  const handleSaveAdd = async () => {
    if (!accessToken) return;

    if (!formData.name.trim()) {
      toast.error("Ward name is required");
      return;
    }

    setSaving(true);
    try {
      const response = await apiService.createWard(accessToken, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });

      setWards(prev => [...prev, response.data]);
      setShowAddDialog(false);
      toast.success("Ward created successfully");
    } catch (error: any) {
      console.error("Failed to create ward:", error);
      toast.error(error.message || "Failed to create ward");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!accessToken || !selectedWard) return;

    if (!formData.name.trim()) {
      toast.error("Ward name is required");
      return;
    }

    setSaving(true);
    try {
      const response = await apiService.updateWard(accessToken, selectedWard._id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });

      setWards(prev =>
        prev.map(w => (w._id === selectedWard._id ? response.data : w))
      );
      setShowEditDialog(false);
      setSelectedWard(null);
      toast.success("Ward updated successfully");
    } catch (error: any) {
      console.error("Failed to update ward:", error);
      toast.error(error.message || "Failed to update ward");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!accessToken || !selectedWard) return;

    setSaving(true);
    try {
      await apiService.deleteWard(accessToken, selectedWard._id);
      setWards(prev => prev.filter(w => w._id !== selectedWard._id));
      setShowDeleteDialog(false);
      setSelectedWard(null);
      toast.success("Ward deleted successfully");
    } catch (error: any) {
      console.error("Failed to delete ward:", error);
      toast.error(error.message || "Failed to delete ward");
    } finally {
      setSaving(false);
    }
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
            <CardTitle>Wards</CardTitle>
            <CardDescription>Manage the wards in your service area</CardDescription>
          </div>
          <Button onClick={handleAdd}>
            <Plus className="h-4 w-4 mr-2" />
            Add Ward
          </Button>
        </CardHeader>
        <CardContent>
          {wards.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No wards yet</h3>
              <p className="text-gray-500 mt-1">Get started by adding your first ward</p>
              <Button onClick={handleAdd} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Add Ward
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wards.map((ward) => (
                    <TableRow key={ward._id}>
                      <TableCell className="font-medium">{ward.name}</TableCell>
                      <TableCell className="hidden md:table-cell text-gray-500">
                        {ward.description || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={ward.isActive}
                            onCheckedChange={() => handleToggleActive(ward)}
                          />
                          <Badge variant={ward.isActive ? "default" : "secondary"}>
                            {ward.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(ward)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(ward)}
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
            <DialogTitle>Add Ward</DialogTitle>
            <DialogDescription>
              Create a new ward for your service area
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Ward Name *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter ward name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-description">Description</Label>
              <Input
                id="add-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSaveAdd} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Ward"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ward</DialogTitle>
            <DialogDescription>
              Update the ward information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Ward Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter ward name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} disabled={saving}>
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
            <AlertDialogTitle>Delete Ward</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedWard?.name}"? This action cannot be undone
              and will also remove all streets associated with this ward.
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
