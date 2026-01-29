import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Navigation,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Papa from "papaparse";

interface Ward {
  _id: string;
  name: string;
  isActive: boolean;
}

interface Street {
  _id: string;
  name: string;
  description?: string;
  wardId: {
    _id: string;
    name: string;
  } | string;
  isActive: boolean;
  createdAt: string;
}

interface BulkUploadResult {
  successCount: number;
  failedCount: number;
  errors: Array<{ row: number; name: string; error: string }>;
}

export function StreetSettings() {
  const { accessToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [wards, setWards] = useState<Ward[]>([]);
  const [streets, setStreets] = useState<Street[]>([]);
  const [selectedWardFilter, setSelectedWardFilter] = useState<string>("all");

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBulkUploadDialog, setShowBulkUploadDialog] = useState(false);
  const [showBulkResultDialog, setShowBulkResultDialog] = useState(false);

  const [selectedStreet, setSelectedStreet] = useState<Street | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    wardId: "",
    name: "",
    description: "",
  });

  const [bulkWardId, setBulkWardId] = useState<string>("");
  const [parsedStreets, setParsedStreets] = useState<Array<{ name: string; description?: string }>>([]);
  const [bulkResult, setBulkResult] = useState<BulkUploadResult | null>(null);

  useEffect(() => {
    loadData();
  }, [accessToken]);

  const loadData = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const [wardsRes, streetsRes] = await Promise.all([
        apiService.getWards(accessToken),
        apiService.getStreets(accessToken),
      ]);
      setWards(wardsRes?.data || []);
      setStreets(streetsRes?.data || []);
    } catch (error: any) {
      console.error("Failed to load data:", error);
      toast.error(error.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadStreets = async (wardId?: string) => {
    if (!accessToken) return;

    try {
      const response = await apiService.getStreets(accessToken, wardId === "all" ? undefined : wardId);
      setStreets(response?.data || []);
    } catch (error: any) {
      console.error("Failed to load streets:", error);
    }
  };

  const handleWardFilterChange = (wardId: string) => {
    setSelectedWardFilter(wardId);
    loadStreets(wardId);
  };

  const getWardName = (street: Street): string => {
    if (typeof street.wardId === "object" && street.wardId !== null) {
      return street.wardId.name;
    }
    const ward = wards.find(w => w._id === street.wardId);
    return ward?.name || "Unknown";
  };

  const handleAdd = () => {
    setFormData({ wardId: wards[0]?._id || "", name: "", description: "" });
    setShowAddDialog(true);
  };

  const handleEdit = (street: Street) => {
    setSelectedStreet(street);
    const wardId = typeof street.wardId === "object" ? street.wardId._id : street.wardId;
    setFormData({
      wardId,
      name: street.name,
      description: street.description || "",
    });
    setShowEditDialog(true);
  };

  const handleDelete = (street: Street) => {
    setSelectedStreet(street);
    setShowDeleteDialog(true);
  };

  const handleToggleActive = async (street: Street) => {
    if (!accessToken) return;

    try {
      await apiService.updateStreet(accessToken, street._id, { isActive: !street.isActive });
      setStreets(prev =>
        prev.map(s => (s._id === street._id ? { ...s, isActive: !s.isActive } : s))
      );
      toast.success(`Street ${!street.isActive ? "activated" : "deactivated"} successfully`);
    } catch (error: any) {
      console.error("Failed to update street:", error);
      toast.error(error.message || "Failed to update street");
    }
  };

  const handleSaveAdd = async () => {
    if (!accessToken) return;

    if (!formData.wardId) {
      toast.error("Please select a ward");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("Street name is required");
      return;
    }

    setSaving(true);
    try {
      await apiService.createStreet(accessToken, {
        wardId: formData.wardId,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });

      await loadStreets(selectedWardFilter);
      setShowAddDialog(false);
      toast.success("Street created successfully");
    } catch (error: any) {
      console.error("Failed to create street:", error);
      toast.error(error.message || "Failed to create street");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!accessToken || !selectedStreet) return;

    if (!formData.name.trim()) {
      toast.error("Street name is required");
      return;
    }

    setSaving(true);
    try {
      await apiService.updateStreet(accessToken, selectedStreet._id, {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });

      await loadStreets(selectedWardFilter);
      setShowEditDialog(false);
      setSelectedStreet(null);
      toast.success("Street updated successfully");
    } catch (error: any) {
      console.error("Failed to update street:", error);
      toast.error(error.message || "Failed to update street");
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!accessToken || !selectedStreet) return;

    setSaving(true);
    try {
      await apiService.deleteStreet(accessToken, selectedStreet._id);
      setStreets(prev => prev.filter(s => s._id !== selectedStreet._id));
      setShowDeleteDialog(false);
      setSelectedStreet(null);
      toast.success("Street deleted successfully");
    } catch (error: any) {
      console.error("Failed to delete street:", error);
      toast.error(error.message || "Failed to delete street");
    } finally {
      setSaving(false);
    }
  };

  // Bulk Upload Functions
  const handleBulkUploadClick = () => {
    setBulkWardId(wards[0]?._id || "");
    setParsedStreets([]);
    setShowBulkUploadDialog(true);
  };

  const downloadTemplate = () => {
    const csvContent = "name,description\nMain Street,Central business district\nOak Avenue,Residential area";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "street_upload_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("Template downloaded");
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(csv)$/)) {
      toast.error("Please upload a CSV file");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const streets: Array<{ name: string; description?: string }> = [];
        const errors: string[] = [];

        results.data.forEach((row: any, index: number) => {
          if (!row.name || !row.name.trim()) {
            errors.push(`Row ${index + 2}: Street name is required`);
            return;
          }
          streets.push({
            name: row.name.trim(),
            description: row.description?.trim() || undefined,
          });
        });

        if (errors.length > 0) {
          toast.error(`Found ${errors.length} validation errors. Please fix and try again.`);
          console.error("Validation errors:", errors);
        }

        if (streets.length > 0) {
          setParsedStreets(streets);
          toast.success(`${streets.length} street(s) ready for upload`);
        } else {
          toast.error("No valid streets found in file");
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        toast.error("Failed to parse CSV file");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      },
    });
  };

  const handleBulkUpload = async () => {
    if (!accessToken || !bulkWardId || parsedStreets.length === 0) return;

    setUploading(true);
    try {
      const response = await apiService.bulkUploadStreets(accessToken, bulkWardId, parsedStreets);
      setBulkResult(response.data);
      setShowBulkUploadDialog(false);
      setShowBulkResultDialog(true);
      await loadStreets(selectedWardFilter);
    } catch (error: any) {
      console.error("Failed to bulk upload streets:", error);
      toast.error(error.message || "Failed to bulk upload streets");
    } finally {
      setUploading(false);
    }
  };

  const filteredStreets = selectedWardFilter === "all"
    ? streets
    : streets.filter(s => {
        const wardId = typeof s.wardId === "object" ? s.wardId._id : s.wardId;
        return wardId === selectedWardFilter;
      });

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (wards.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Navigation className="h-12 w-12 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No wards available</h3>
          <p className="text-gray-500 mt-1">
            Please create at least one ward before adding streets
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0 pb-4">
          <div>
            <CardTitle>Streets</CardTitle>
            <CardDescription>Manage streets within your wards</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedWardFilter} onValueChange={handleWardFilterChange}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by ward" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Wards</SelectItem>
                {wards.map((ward) => (
                  <SelectItem key={ward._id} value={ward._id}>
                    {ward.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleBulkUploadClick}>
              <Upload className="h-4 w-4 mr-2" />
              Bulk Upload
            </Button>
            <Button onClick={handleAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Street
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStreets.length === 0 ? (
            <div className="text-center py-12">
              <Navigation className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No streets yet</h3>
              <p className="text-gray-500 mt-1">
                {selectedWardFilter === "all"
                  ? "Get started by adding your first street"
                  : "No streets in this ward"}
              </p>
              <div className="flex justify-center gap-2 mt-4">
                <Button variant="outline" onClick={handleBulkUploadClick}>
                  <Upload className="h-4 w-4 mr-2" />
                  Bulk Upload
                </Button>
                <Button onClick={handleAdd}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Street
                </Button>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Ward</TableHead>
                    <TableHead className="hidden md:table-cell">Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStreets.map((street) => (
                    <TableRow key={street._id}>
                      <TableCell className="font-medium">{street.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getWardName(street)}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-gray-500">
                        {street.description || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={street.isActive}
                            onCheckedChange={() => handleToggleActive(street)}
                          />
                          <Badge variant={street.isActive ? "default" : "secondary"}>
                            {street.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(street)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleDelete(street)}
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
            <DialogTitle>Add Street</DialogTitle>
            <DialogDescription>Create a new street in a ward</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="add-ward">Ward *</Label>
              <Select
                value={formData.wardId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, wardId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a ward" />
                </SelectTrigger>
                <SelectContent>
                  {wards.map((ward) => (
                    <SelectItem key={ward._id} value={ward._id}>
                      {ward.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-name">Street Name *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter street name"
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
                "Create Street"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Street</DialogTitle>
            <DialogDescription>Update street information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Ward</Label>
              <Input
                value={wards.find(w => w._id === formData.wardId)?.name || ""}
                disabled
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">Ward cannot be changed</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Street Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter street name"
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
            <AlertDialogTitle>Delete Street</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedStreet?.name}"? This action cannot be undone.
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

      {/* Bulk Upload Dialog */}
      <Dialog open={showBulkUploadDialog} onOpenChange={setShowBulkUploadDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Upload Streets</DialogTitle>
            <DialogDescription>
              Upload multiple streets at once using a CSV file
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Ward *</Label>
              <Select value={bulkWardId} onValueChange={setBulkWardId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a ward" />
                </SelectTrigger>
                <SelectContent>
                  {wards.map((ward) => (
                    <SelectItem key={ward._id} value={ward._id}>
                      {ward.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={downloadTemplate} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>

              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="bulk-street-upload"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select CSV File
                </Button>
              </div>
            </div>

            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
              <FileSpreadsheet className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-2 text-center font-medium">
                CSV Format Requirements:
              </p>
              <ul className="text-xs text-gray-500 space-y-1">
                <li><strong>Required:</strong> name</li>
                <li><strong>Optional:</strong> description</li>
              </ul>
            </div>

            {parsedStreets.length > 0 && (
              <div className="space-y-2">
                <Label>Preview ({parsedStreets.length} streets)</Label>
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedStreets.slice(0, 10).map((street, index) => (
                        <TableRow key={index}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>{street.name}</TableCell>
                          <TableCell className="text-gray-500">
                            {street.description || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {parsedStreets.length > 10 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-gray-500">
                            ... and {parsedStreets.length - 10} more
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowBulkUploadDialog(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkUpload}
              disabled={uploading || !bulkWardId || parsedStreets.length === 0}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                `Upload ${parsedStreets.length} Streets`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Upload Results Dialog */}
      <Dialog open={showBulkResultDialog} onOpenChange={setShowBulkResultDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Results</DialogTitle>
            <DialogDescription>Summary of bulk street upload</DialogDescription>
          </DialogHeader>
          {bulkResult && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-green-100 p-2">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{bulkResult.successCount}</p>
                        <p className="text-sm text-gray-600">Successful</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-red-100 p-2">
                        <XCircle className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{bulkResult.failedCount}</p>
                        <p className="text-sm text-gray-600">Failed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {bulkResult.errors.length > 0 && (
                <div>
                  <Label className="mb-2">Errors</Label>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {bulkResult.errors.map((error, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-red-200 bg-red-50 p-2 text-sm"
                      >
                        <span className="font-medium">Row {error.row}:</span>{" "}
                        <span className="text-gray-700">{error.name}</span> -{" "}
                        <span className="text-red-600">{error.error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowBulkResultDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
