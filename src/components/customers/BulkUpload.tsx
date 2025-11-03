import { useState, useRef } from "react";
import { Upload, Download, FileSpreadsheet, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Papa from "papaparse";
import { nigerianStates, getLGAsByState } from "@/lib/nigeriaData";
import { normalizeNigerianPhone } from "@/lib/phoneUtils";
import type { BulkUploadResponse } from "@/types";

interface ParsedCustomer {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  state: string;
  lga: string;
  city: string;
  previousDebt?: number;
}

interface ValidationError {
  row: number;
  error: string;
  data: any;
}

interface BulkUploadProps {
  onCustomersAdded?: () => void;
}

export function BulkUpload({ onCustomersAdded }: BulkUploadProps) {
  const { accessToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [uploadResult, setUploadResult] = useState<BulkUploadResponse | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showValidationErrors, setShowValidationErrors] = useState(false);

  // Preview state
  const [parsedCustomers, setParsedCustomers] = useState<ParsedCustomer[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Validate state exists in Nigerian states
  const isValidState = (state: string): boolean => {
    const normalizedState = state.toLowerCase().trim();
    return nigerianStates.some(s => s.value === normalizedState || s.label.toLowerCase() === normalizedState);
  };

  // Get normalized state value
  const getNormalizedState = (state: string): string => {
    const normalizedState = state.toLowerCase().trim();
    const stateObj = nigerianStates.find(s => s.value === normalizedState || s.label.toLowerCase() === normalizedState);
    return stateObj?.value || normalizedState;
  };

  // Validate LGA matches state
  const isValidLGA = (state: string, lga: string): boolean => {
    const normalizedState = getNormalizedState(state);
    const lgas = getLGAsByState(normalizedState);

    // If no LGAs defined for this state, accept any LGA
    if (lgas.length === 0) return true;

    const normalizedLGA = lga.trim();
    return lgas.some(l => l.toLowerCase() === normalizedLGA.toLowerCase());
  };

  // Validate and process customer data
  const validateCustomer = (customer: any): { valid: boolean; data?: ParsedCustomer; error?: string } => {
    // Check required fields
    if (!customer.fullName || !customer.fullName.trim()) {
      return { valid: false, error: "Full name is required" };
    }

    if (!customer.phone || !customer.phone.trim()) {
      return { valid: false, error: "Phone number is required" };
    }

    // Validate state
    if (customer.state && !isValidState(customer.state)) {
      return { valid: false, error: `Invalid state: ${customer.state}. Must be a valid Nigerian state` };
    }

    // Validate LGA if state is provided
    if (customer.state && customer.lga && !isValidLGA(customer.state, customer.lga)) {
      return { valid: false, error: `Invalid LGA: ${customer.lga} for state ${customer.state}` };
    }

    // Build validated customer object
    const validatedCustomer: ParsedCustomer = {
      fullName: customer.fullName.trim(),
      email: customer.email?.trim() || "",
      phone: normalizeNigerianPhone(customer.phone), // Normalize phone to 234XXXXXXXXXX format
      address: customer.address?.trim() || "",
      state: customer.state ? getNormalizedState(customer.state) : "",
      lga: customer.lga?.trim() || "",
      city: customer.city?.trim() || "", // City is flexible, no validation
      previousDebt: customer.previousDebt ? parseFloat(customer.previousDebt) : 0,
    };

    return { valid: true, data: validatedCustomer };
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.match(/\.(csv)$/)) {
      toast.error("Please upload a CSV file");
      return;
    }

    if (!accessToken) return;

    setUploading(true);
    setValidationErrors([]);

    try {
      // Parse CSV file
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          console.log("Parsed CSV:", results);

          const validCustomers: ParsedCustomer[] = [];
          const errors: ValidationError[] = [];

          // Validate each row
          results.data.forEach((row: any, index: number) => {
            const validation = validateCustomer(row);

            if (validation.valid && validation.data) {
              validCustomers.push(validation.data);
            } else if (validation.error) {
              errors.push({
                row: index + 2,
                error: validation.error,
                data: row,
              });
            }
          });

          console.log("Valid customers:", validCustomers);
          console.log("Validation errors:", errors);

          // If there are validation errors, show them
          if (errors.length > 0) {
            setValidationErrors(errors);
            setShowValidationErrors(true);
            setUploading(false);
            toast.error(`${errors.length} row(s) failed validation. Please review and fix errors.`);

            // Reset file input
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
            return;
          }

          // If no valid customers, show error
          if (validCustomers.length === 0) {
            toast.error("No valid customer data found in file");
            setUploading(false);
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
            return;
          }

          // Show preview for user to review before submitting
          setParsedCustomers(validCustomers);
          setShowPreview(true);
          setUploading(false);
          toast.success(`${validCustomers.length} customer(s) ready for upload. Please review and submit.`);

          // Reset file input
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        },
        error: (error) => {
          console.error("CSV parsing error:", error);
          toast.error("Failed to parse CSV file. Please check the format.");
          setUploading(false);
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        },
      });
    } catch (error: any) {
      console.error("File processing error:", error);
      toast.error(error.message || "Failed to process file");
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSubmit = async () => {
    if (!accessToken || parsedCustomers.length === 0) return;

    setSubmitting(true);
    try {
      const response = await apiService.bulkUploadCustomers(accessToken, parsedCustomers);
      console.log("Bulk upload response:", response);

      setUploadResult(response);
      setShowPreview(false);
      setShowResults(true);
      setParsedCustomers([]);

      // Handle response structure safely
      const successCount = response?.data?.successCount || 0;
      const failedCount = response?.data?.failedCount || 0;

      if (failedCount === 0) {
        toast.success(`Successfully uploaded ${successCount} customers`);
      } else {
        toast.warning(
          `Uploaded ${successCount} customers, ${failedCount} failed`
        );
      }

      // Refresh customer list
      onCustomersAdded?.();
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload customers");
    } finally {
      setSubmitting(false);
    }
  };

  const downloadTemplate = () => {
    // Helper function to escape CSV fields
    const escapeCsvField = (field: string): string => {
      // If field contains comma, quote, or newline, wrap in quotes and escape quotes
      if (field.includes(',') || field.includes('"') || field.includes('\n')) {
        return `"${field.replace(/"/g, '""')}"`;
      }
      return field;
    };

    // Create a CSV template with all required fields
    const headers = [
      'fullName',
      'email',
      'phone',
      'address',
      'city',
      'state',
      'lga',
      'previousDebt'
    ];

    const sampleData = [
      'Jane Smith',
      'jane.smith@example.com',
      "'08123456789", // Prefix with ' to force text format in Excel
      '456 Oak Avenue, Victoria Island',
      'Lagos',
      'Lagos',
      'Lagos Island',
      '10000'
    ];

    const csvContent = [
      headers.join(','),
      sampleData.map(escapeCsvField).join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success("Template downloaded");
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bulk Customer Upload</CardTitle>
          <CardDescription>
            Upload multiple customers at once using CSV file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={downloadTemplate}
              className="flex-1"
            >
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
                id="bulk-upload-input"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV File
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6">
            <FileSpreadsheet className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 mb-2 text-center font-medium">
              CSV Format Requirements:
            </p>
            <ul className="text-xs text-gray-500 space-y-1">
              <li>• <strong>Required:</strong> fullName, phone</li>
              <li>• <strong>Optional:</strong> email, address, city, state, lga, previousDebt</li>
              <li>• <strong>Phone:</strong> Accepts 08123456789, 8123456789, +2348123456789, or 2348123456789</li>
              <li>• State must be a valid Nigerian state</li>
              <li>• LGA must match the selected state</li>
              <li>• City/Area is flexible (no validation)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Customers Before Upload</DialogTitle>
            <DialogDescription>
              Review the {parsedCustomers.length} customer(s) parsed from your CSV file. Click Submit to upload.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">#</th>
                    <th className="px-3 py-2 text-left font-semibold">Name</th>
                    <th className="px-3 py-2 text-left font-semibold">Phone</th>
                    <th className="px-3 py-2 text-left font-semibold">Email</th>
                    <th className="px-3 py-2 text-left font-semibold">Location</th>
                    <th className="px-3 py-2 text-left font-semibold">Debt</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedCustomers.map((customer, index) => (
                    <tr key={index} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2">{index + 1}</td>
                      <td className="px-3 py-2">{customer.fullName}</td>
                      <td className="px-3 py-2 font-mono text-xs">{customer.phone}</td>
                      <td className="px-3 py-2 text-xs">{customer.email || '-'}</td>
                      <td className="px-3 py-2 text-xs">
                        {customer.city && `${customer.city}, `}
                        {customer.state || '-'}
                      </td>
                      <td className="px-3 py-2">₦{(customer.previousDebt || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPreview(false);
                  setParsedCustomers([]);
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit {parsedCustomers.length} Customer{parsedCustomers.length !== 1 ? 's' : ''}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Validation Errors Dialog */}
      <Dialog open={showValidationErrors} onOpenChange={setShowValidationErrors}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Validation Errors
            </DialogTitle>
            <DialogDescription>
              Please fix the following errors in your CSV file and try again
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {validationErrors.map((error, index) => (
              <div
                key={index}
                className="rounded-lg border border-red-200 bg-red-50 p-3"
              >
                <div className="flex items-start gap-2">
                  <Badge variant="destructive" className="mt-0.5">
                    Row {error.row}
                  </Badge>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">{error.error}</p>
                    <p className="text-xs text-red-600 mt-1">
                      Data: {JSON.stringify(error.data)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end">
            <Button onClick={() => setShowValidationErrors(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Results Dialog */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Results</DialogTitle>
            <DialogDescription>
              Review the results of your bulk customer upload
            </DialogDescription>
          </DialogHeader>

          {uploadResult && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-green-100 p-2">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">
                          {uploadResult?.data?.successCount || 0}
                        </p>
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
                        <p className="text-2xl font-bold">
                          {uploadResult?.data?.failedCount || 0}
                        </p>
                        <p className="text-sm text-gray-600">Failed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Errors */}
              {uploadResult?.data?.errors && uploadResult.data.errors.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Server Errors</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {uploadResult.data.errors.map((error, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-red-200 bg-red-50 p-3"
                      >
                        <div className="flex items-start gap-2">
                          <Badge variant="destructive" className="mt-0.5">
                            Row {error.row}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm text-red-800">{error.error}</p>
                            {error.data && (
                              <p className="text-xs text-red-600 mt-1">
                                Data: {JSON.stringify(error.data)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
