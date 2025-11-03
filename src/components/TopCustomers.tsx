import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

interface TopCustomersProps {
  customersData?: any;
}

export function TopCustomers({ customersData }: TopCustomersProps) {
  const customers = customersData?.topCustomers || [];
  return (
    <Card className="p-4 sm:p-5 md:p-6 bg-card/40 backdrop-blur-xl border-border/50 shadow-card animate-fade-in min-h-[400px] sm:min-h-[480px] w-full overflow-hidden">
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-foreground">Top Customers</h3>
          <p className="text-xs sm:text-sm text-muted-foreground">By total amount paid</p>
        </div>
        <div className="space-y-2 sm:space-y-3">
          {customers.length > 0 ? customers.map((customer: any) => (
            <div
              key={customer.accountNumber}
              className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2.5 sm:p-3 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-r from-accent/30 to-transparent hover:from-accent/50 transition-all duration-300"
            >
              <div className="flex-shrink-0">
                <Avatar className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-primary border-2 border-primary/20">
                  <AvatarFallback className="bg-transparent text-primary-foreground font-bold text-lg">
                    {customer.rank}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {customer.customerName}
                </p>
                <p className="text-xs text-muted-foreground">{customer.accountNumber}</p>
              </div>
              <div className="text-right space-y-1">
                <p className="text-base font-bold text-foreground">
                  {formatCurrency(customer.totalPaid)}
                </p>
                {customer.dueAmount > 0 && (
                  <Badge
                    variant={customer.dueAmount > 100000 ? "destructive" : "secondary"}
                    className="text-xs"
                  >
                    {formatCurrency(customer.dueAmount)} due
                  </Badge>
                )}
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No customer data available</p>
              <p className="text-xs mt-1">Top paying customers will appear here once payments are made</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
