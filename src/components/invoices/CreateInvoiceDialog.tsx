import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, Upload, Download, CheckCircle2, XCircle, FileUp } from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface CreateInvoiceDialogProps {
  onInvoiceCreated?: () => void;
}

export function CreateInvoiceDialog({ onInvoiceCreated }: CreateInvoiceDialogProps) {
  const { accessToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("single");

  // Dropdown data
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(false);

  // Single invoice form
  const [formData, setFormData] = useState({
    accountNumber: "",
    serviceName: "",
    dueDate: "",
    amount: "",
    description: "",
  });
  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [creatingInvoice, setCreatingInvoice] = useState(false);

  // Bulk upload
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);

  // Load dropdowns when dialog opens
  useEffect(() => {
    if (open) {
      loadDropdowns();
    }
  }, [open]);

  // Poll job status when jobId is set
  useEffect(() => {
    if (jobId) {
      pollJobStatus(jobId);
    }
  }, [jobId]);

  const loadDropdowns = async () => {
    if (!accessToken) return;

    setLoadingDropdowns(true);
    try {
      const [customersData, servicesData] = await Promise.all([
        apiService.getCustomersDropdown(accessToken),
        apiService.getCollectionsDropdown(accessToken),
      ]);

      setCustomers(customersData.data || []);
      setServices(servicesData.data || []);
    } catch (error: any) {
      console.error("Error loading dropdowns:", error);
      toast.error("Failed to load customers and services");
    } finally {
      setLoadingDropdowns(false);
    }
  };

  const handleServiceChange = (serviceName: string) => {
    const service = services.find((s) => s.name === serviceName);
    setSelectedService(service);
    setFormData({ ...formData, serviceName });

    if (service && service.amountType === "FIXED") {
      setFormData((prev) => ({ ...prev, amount: service.amount.toString() }));
    } else {
      setFormData((prev) => ({ ...prev, amount: "" }));
    }
  };

  const handleSingleInvoiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessToken) return;

    setCreatingInvoice(true);
    try {
      const invoiceData: any = {
        accountNumber: formData.accountNumber,
        serviceName: formData.serviceName,
        dueDate: formData.dueDate,
      };

      if (selectedService?.amountType === "VARIABLE") {
        invoiceData.amount = parseFloat(formData.amount);
      }

      if (formData.description.trim()) {
        invoiceData.description = formData.description.trim();
      }

      const response = await apiService.createSingleInvoice(accessToken, invoiceData);

      const invoiceNumber = response?.data?.invoice?.invoiceNumber ||
                           response?.invoice?.invoiceNumber ||
                           'N/A';

      toast.success(
        `Invoice ${invoiceNumber} created successfully!`
      );

      // Reset form
      setFormData({
        accountNumber: "",
        serviceName: "",
        dueDate: "",
        amount: "",
        description: "",
      });
      setSelectedService(null);

      // Close dialog and refresh parent
      setOpen(false);
      onInvoiceCreated?.();
    } catch (error: any) {
      console.error("Error creating invoice:", error);
      toast.error(error.message || "Failed to create invoice");
    } finally {
      setCreatingInvoice(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error("Please select a CSV file");
        return;
      }
      setFile(selectedFile);
      setResult(null);
    }
  };

  const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split("\n");

          const invoices = lines
            .slice(1)
            .filter((line) => line.trim())
            .map((line) => {
              const values = line.split(",").map((v) => v.trim());
              return {
                accountNumber: values[0],
                serviceName: values[1],
                dueDate: values[2],
                amount: values[3] ? parseFloat(values[3]) : undefined,
                description: values[4] || "",
              };
            });

          resolve(invoices);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  const handleBulkUpload = async () => {
    if (!file || !accessToken) {
      toast.error("Please select a CSV file");
      return;
    }

    setUploading(true);
    setProgress(0);
    setResult(null);

    try {
      const invoices = await parseCSV(file);

      if (invoices.length === 0) {
        toast.error("CSV file is empty");
        setUploading(false);
        return;
      }

      const response = await apiService.createBulkInvoices(accessToken, invoices);
      const { jobId: newJobId } = response.data;

      setJobId(newJobId);
      toast.success(`Bulk upload started. Processing ${invoices.length} invoices...`);
    } catch (error: any) {
      console.error("Bulk upload error:", error);
      toast.error(error.message || "Failed to start bulk upload");
      setUploading(false);
    }
  };

  const pollJobStatus = async (jobId: string) => {
    if (!accessToken) return;

    const interval = setInterval(async () => {
      try {
        const response = await apiService.getJobStatus(accessToken, jobId);
        const { state, progress: jobProgress, result: jobResult } = response.data;

        setProgress(jobProgress);

        if (state === "completed") {
          clearInterval(interval);
          setResult(jobResult);
          setUploading(false);
          setJobId(null);
          toast.success(
            `Upload complete! ${jobResult.summary.successful} succeeded, ${jobResult.summary.failed} failed.`
          );
          onInvoiceCreated?.();
        }

        if (state === "failed") {
          clearInterval(interval);
          setUploading(false);
          setJobId(null);
          toast.error("Bulk upload failed");
        }
      } catch (error) {
        console.error("Polling error:", error);
        clearInterval(interval);
        setUploading(false);
        setJobId(null);
      }
    }, 2000);
  };

  const downloadTemplate = () => {
    const csvContent = `accountNumber,serviceName,dueDate,amount,description
CUST531738049694,Waste Management,2025-12-15,5000,Monthly waste collection
CUST-001-2024-000002,Water Supply,2025-12-20,12500,Monthly water bill`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "invoice_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const downloadFailedRows = () => {
    if (!result || result.failed.length === 0) return;

    const header = "row,accountNumber,serviceName,error\n";
    const rows = result.failed
      .map((item: any) => `${item.row},${item.accountNumber},${item.serviceName},"${item.error}"`)
      .join("\n");

    const csvContent = header + rows;
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "failed_invoices.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const isFixedService = selectedService?.amountType === "FIXED";
  const isVariableService = selectedService?.amountType === "VARIABLE";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Create Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Invoice</DialogTitle>
          <DialogDescription>
            Create single or bulk invoices for your customers
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="single">Single Invoice</TabsTrigger>
            <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
          </TabsList>

          {/* Single Invoice Tab */}
          <TabsContent value="single" className="mt-4">
            {loadingDropdowns ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <form onSubmit={handleSingleInvoiceSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">
                    Customer <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.accountNumber}
                    onValueChange={(value) => setFormData({ ...formData, accountNumber: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.accountNumber}>
                          {customer.name} - {customer.accountNumber}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service">
                    Service <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.serviceName}
                    onValueChange={handleServiceChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.map((service) => (
                        <SelectItem key={service.id} value={service.name}>
                          <div className="flex items-center gap-2">
                            <span>{service.name}</span>
                            {service.amountType === "FIXED" ? (
                              <Badge variant="secondary" className="text-xs">
                                ₦{service.amount.toLocaleString()} (Fixed)
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs">
                                Variable
                              </Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">
                    Due Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                {isVariableService && (
                  <div className="space-y-2">
                    <Label htmlFor="amount">
                      Amount (₦) <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="Enter amount"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                )}

                {isFixedService && (
                  <div className="space-y-2">
                    <Label>Amount (₦)</Label>
                    <Input
                      type="number"
                      value={selectedService.amount}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">Fixed amount - cannot be changed</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Enter invoice description..."
                    rows={2}
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creatingInvoice}>
                    {creatingInvoice ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Invoice"
                    )}
                  </Button>
                </div>
              </form>
            )}
          </TabsContent>

          {/* Bulk Upload Tab */}
          <TabsContent value="bulk" className="mt-4 space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm text-blue-900 mb-2">
                <strong>CSV Format:</strong> accountNumber, serviceName, dueDate, amount, description
              </p>
              <Button
                type="button"
                variant="link"
                onClick={downloadTemplate}
                className="p-0 h-auto text-blue-600"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Template
              </Button>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="csvFile">Upload CSV File</Label>
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </div>

              <Button
                onClick={handleBulkUpload}
                disabled={!file || uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload & Process
                  </>
                )}
              </Button>
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing...</span>
                  <span>{progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {result && (
              <div className="space-y-3 border-t pt-4">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="border rounded p-2">
                    <p className="text-lg font-bold">{result.summary.total}</p>
                    <p className="text-xs text-gray-600">Total</p>
                  </div>
                  <div className="border rounded p-2">
                    <p className="text-lg font-bold text-green-600">{result.summary.successful}</p>
                    <p className="text-xs text-gray-600">Success</p>
                  </div>
                  <div className="border rounded p-2">
                    <p className="text-lg font-bold text-red-600">{result.summary.failed}</p>
                    <p className="text-xs text-gray-600">Failed</p>
                  </div>
                </div>

                {result.failed.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadFailedRows}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Failed Rows
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
