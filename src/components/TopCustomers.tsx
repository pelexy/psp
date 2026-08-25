import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "@/lib/icons";
import { formatCurrency } from "@/utils/formatCurrency";

interface TopCustomersProps {
  customersData?: any;
}

export function TopCustomers({ customersData }: TopCustomersProps) {
  const customers = customersData?.topCustomers || [];
  return (
    <Card className="min-h-[400px] w-full overflow-hidden">
      <div className="border-b border-border p-5 md:p-6">
        <h3 className="text-base font-semibold text-foreground">Top Customers</h3>
        <p className="text-[13px] text-muted-foreground">By total amount paid</p>
      </div>
      <div className="divide-y divide-border">
        {customers.length > 0 ? customers.map((customer: any) => (
          <div
            key={customer.accountNumber}
            className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50 md:px-6"
          >
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarFallback className="bg-primary text-[13px] font-semibold text-primary-foreground">
                {customer.rank}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-foreground">
                {customer.customerName}
              </p>
              <p className="text-xs text-muted-foreground">{customer.accountNumber}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <p className="text-[13px] font-semibold tabular-nums text-foreground">
                {formatCurrency(customer.totalPaid)}
              </p>
              {customer.dueAmount > 0 && (
                <Badge
                  variant={customer.dueAmount > 100000 ? "destructive" : "secondary"}
                  className="text-[10px] font-medium"
                >
                  {formatCurrency(customer.dueAmount)} due
                </Badge>
              )}
            </div>
          </div>
        )) : (
          <div className="py-16 text-center text-muted-foreground">
            <Users className="mx-auto mb-3 h-10 w-10 opacity-25" />
            <p className="text-sm font-medium">No customer data available</p>
            <p className="mt-1 text-xs">Top paying customers will appear here once payments are made</p>
          </div>
        )}
      </div>
    </Card>
  );
}
