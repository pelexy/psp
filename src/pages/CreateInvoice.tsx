import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileUp, Receipt, Upload, Download, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const CreateInvoice = () => {
  const { accessToken } = useAuth();

  // Dropdown data
  const [customers, setCustomers] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

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

  // Load dropdowns on mount
  useEffect(() => {
    loadDropdowns();
  }, [accessToken]);

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

    // Auto-fill amount for FIXED services
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
      // Prepare invoice data
      const invoiceData: any = {
        accountNumber: formData.accountNumber,
        serviceName: formData.serviceName,
        dueDate: formData.dueDate,
      };

      // Only include amount for VARIABLE services
      if (selectedService?.amountType === "VARIABLE") {
        invoiceData.amount = parseFloat(formData.amount);
      }

      // Include description if provided
      if (formData.description.trim()) {
        invoiceData.description = formData.description.trim();
      }

      const response = await apiService.createSingleInvoice(accessToken, invoiceData);

      toast.success(
        `Invoice ${response.invoice.invoiceNumber} created successfully! Notifications sent to customer.`
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
            .slice(1) // Skip header
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
      // Parse CSV
      const invoices = await parseCSV(file);
      console.log("Parsed invoices:", invoices);

      if (invoices.length === 0) {
        toast.error("CSV file is empty");
        setUploading(false);
        return;
      }

      // Start bulk job
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
        toast.error("Failed to check upload status");
      }
    }, 2000); // Poll every 2 seconds
  };

  const downloadTemplate = () => {
    const csvContent = `accountNumber,serviceName,dueDate,amount,description
CUST531738049694,Waste Management,2025-12-15,5000,Monthly waste collection
CUST-001-2024-000002,Water Supply,2025-12-20,12500,Monthly water bill
CUST-001-2024-000003,Electricity Bill,2025-12-25,,December electricity`;

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
    <DashboardLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 lg:space-y-8 bg-gradient-to-br from-background via-background to-accent/5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Create Invoice</h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1">
              Create single or bulk invoices for your customers
            </p>
          </div>
        </div>

        {/* Main Content */}
        <Card className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Tabs defaultValue="single" className="w-full">
            <CardHeader className="border-b">
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="single" className="gap-2">
                  <Receipt className="h-4 w-4" />
                  Single Invoice
                </TabsTrigger>
                <TabsTrigger value="bulk" className="gap-2">
                  <FileUp className="h-4 w-4" />
                  Bulk Upload
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Single Invoice Tab */}
              <TabsContent value="single" className="mt-0">
                {loadingDropdowns ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <form onSubmit={handleSingleInvoiceSubmit} className="space-y-6">
                    {/* Customer Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="customer">
                        Customer <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.accountNumber}
                        onValueChange={(value) => setFormData({ ...formData, accountNumber: value })}
                        required
                      >
                        <SelectTrigger id="customer">
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                        <SelectContent>
                          {customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.accountNumber}>
                              <div className="flex flex-col">
                                <span className="font-medium">{customer.name}</span>
                                <span className="text-xs text-gray-500">{customer.accountNumber}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Service Selection */}
                    <div className="space-y-2">
                      <Label htmlFor="service">
                        Service/Collection <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.serviceName}
                        onValueChange={handleServiceChange}
                        required
                      >
                        <SelectTrigger id="service">
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
                                    Variable Amount
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Due Date */}
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

                    {/* Amount (Conditional) */}
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
                        <Label htmlFor="fixedAmount">Amount (₦)</Label>
                        <Input
                          id="fixedAmount"
                          type="number"
                          value={selectedService.amount}
                          disabled
                          className="bg-gray-50"
                        />
                        <p className="text-xs text-gray-500">Fixed amount - cannot be changed</p>
                      </div>
                    )}

                    {/* Description */}
                    <div className="space-y-2">
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Enter invoice description..."
                        rows={3}
                      />
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setFormData({
                            accountNumber: "",
                            serviceName: "",
                            dueDate: "",
                            amount: "",
                            description: "",
                          });
                          setSelectedService(null);
                        }}
                      >
                        Clear
                      </Button>
                      <Button type="submit" disabled={creatingInvoice}>
                        {creatingInvoice ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Receipt className="mr-2 h-4 w-4" />
                            Create Invoice
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </TabsContent>

              {/* Bulk Upload Tab */}
              <TabsContent value="bulk" className="mt-0 space-y-6">
                {/* Instructions */}
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">CSV Format Instructions:</h4>
                  <pre className="text-xs bg-white p-3 rounded border overflow-x-auto">
{`accountNumber,serviceName,dueDate,amount,description
CUST531738049694,Waste Management,2025-12-15,5000,Monthly waste
CUST-001-2024-000002,Water Supply,2025-12-20,12500,Water bill`}
                  </pre>
                  <p className="text-sm text-blue-800 mt-2">
                    <strong>Note:</strong> Leave amount blank for FIXED services
                  </p>
                  <Button
                    variant="link"
                    onClick={downloadTemplate}
                    className="mt-2 p-0 h-auto text-blue-600"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV Template
                  </Button>
                </div>

                {/* File Upload */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="csvFile">Upload CSV File</Label>
                    <Input
                      id="csvFile"
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                    {file && (
                      <p className="text-sm text-gray-600">
                        Selected: <span className="font-medium">{file.name}</span>
                      </p>
                    )}
                  </div>

                  <Button
                    onClick={handleBulkUpload}
                    disabled={!file || uploading}
                    className="w-full sm:w-auto"
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

                {/* Progress Bar */}
                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">Processing invoices...</span>
                      <span className="text-gray-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Results */}
                {result && (
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="text-lg font-semibold">Upload Results</h3>

                    {/* Summary */}
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <p className="text-2xl font-bold">{result.summary.total}</p>
                            <p className="text-sm text-gray-600">Total</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">
                              {result.summary.successful}
                            </p>
                            <p className="text-sm text-gray-600">Successful</p>
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="pt-6">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-red-600">{result.summary.failed}</p>
                            <p className="text-sm text-gray-600">Failed</p>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Successful Invoices */}
                    {result.successful.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-green-600 flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5" />
                          Successful Invoices ({result.successful.length})
                        </h4>
                        <div className="border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 border-b">
                                <tr>
                                  <th className="px-4 py-2 text-left">Row</th>
                                  <th className="px-4 py-2 text-left">Account Number</th>
                                  <th className="px-4 py-2 text-left">Service</th>
                                  <th className="px-4 py-2 text-left">Invoice Number</th>
                                  <th className="px-4 py-2 text-right">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {result.successful.map((item: any, index: number) => (
                                  <tr key={index} className="border-b last:border-0">
                                    <td className="px-4 py-2">{item.row}</td>
                                    <td className="px-4 py-2">{item.accountNumber}</td>
                                    <td className="px-4 py-2">{item.serviceName}</td>
                                    <td className="px-4 py-2 font-mono text-xs">
                                      {item.invoiceNumber}
                                    </td>
                                    <td className="px-4 py-2 text-right font-semibold">
                                      ₦{item.amount.toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Failed Invoices */}
                    {result.failed.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-red-600 flex items-center gap-2">
                            <XCircle className="h-5 w-5" />
                            Failed Invoices ({result.failed.length})
                          </h4>
                          <Button variant="outline" size="sm" onClick={downloadFailedRows}>
                            <Download className="mr-2 h-4 w-4" />
                            Download Failed Rows
                          </Button>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-50 border-b">
                                <tr>
                                  <th className="px-4 py-2 text-left">Row</th>
                                  <th className="px-4 py-2 text-left">Account Number</th>
                                  <th className="px-4 py-2 text-left">Service</th>
                                  <th className="px-4 py-2 text-left">Error</th>
                                </tr>
                              </thead>
                              <tbody>
                                {result.failed.map((item: any, index: number) => (
                                  <tr key={index} className="border-b last:border-0">
                                    <td className="px-4 py-2">{item.row}</td>
                                    <td className="px-4 py-2">{item.accountNumber}</td>
                                    <td className="px-4 py-2">{item.serviceName}</td>
                                    <td className="px-4 py-2 text-red-600">{item.error}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default CreateInvoice;
