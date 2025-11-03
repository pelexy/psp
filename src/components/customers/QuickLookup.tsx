import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Customer } from "@/types";
import { toast } from "sonner";

interface QuickLookupProps {
  onCustomerSelect?: (customer: Customer) => void;
}

export function QuickLookup({ onCustomerSelect }: QuickLookupProps) {
  const { accessToken } = useAuth();
  const [accountNumber, setAccountNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const handleSearch = async () => {
    if (!accountNumber.trim()) {
      toast.error("Please enter an account number");
      return;
    }

    if (!accessToken) return;

    setLoading(true);
    try {
      const response = await apiService.getCustomerDetails(
        accessToken,
        accountNumber.trim()
      );
      console.log("Quick lookup response:", response);

      // Extract customer details from the response
      const customerData = response.customerDetails || response;
      setCustomer(customerData);

      // Pass the full response for navigation
      if (onCustomerSelect) {
        onCustomerSelect(customerData);
      }
    } catch (error: any) {
      console.error("Search error:", error);
      toast.error(error.message || "Customer not found");
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Customer Lookup</CardTitle>
        <CardDescription>
          Search for a customer by their account number
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter account number (e.g., CUST781280000891)"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {customer && (
          <div className="rounded-lg border bg-gray-50 p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-lg">{customer.fullName || customer.name || 'N/A'}</h3>
                <p className="text-sm text-gray-600">
                  {customer.customerAccountNumber || customer.accountNumber || 'N/A'}
                </p>
              </div>
              <Badge variant={customer.isActive ? "default" : "secondary"}>
                {customer.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-600">Email</p>
                <p className="font-medium">{customer.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Phone</p>
                <p className="font-medium">{customer.phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Location</p>
                <p className="font-medium">
                  {customer.city || customer.location || 'N/A'}{customer.state ? `, ${customer.state}` : ''}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Current Balance</p>
                <p className="font-medium text-red-600">
                  ₦{(customer.currentBalance || customer.balance || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total Paid</p>
                <p className="font-medium text-green-600">
                  ₦{(customer.totalPaid || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-600">Total Debt</p>
                <p className="font-medium">
                  ₦{(customer.totalDebt || 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
