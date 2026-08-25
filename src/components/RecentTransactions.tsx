import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownLeft, Receipt } from "@/lib/icons";
import { formatCurrency } from "@/utils/formatCurrency";

interface RecentTransactionsProps {
  transactionsData?: any;
}

export function RecentTransactions({ transactionsData }: RecentTransactionsProps) {
  const transactions = transactionsData || [];
  return (
    <Card className="min-h-[400px] w-full overflow-hidden">
      <div className="border-b border-border p-5 md:p-6">
        <h3 className="text-base font-semibold text-foreground">Recent Transactions</h3>
        <p className="text-[13px] text-muted-foreground">Latest payment activity</p>
      </div>
      <div className="divide-y divide-border">
        {transactions.length > 0 ? transactions.map((transaction: any) => (
          <div
            key={transaction.id || transaction._id}
            className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/50 md:px-6"
          >
            <div
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                transaction.type === "credit" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
              }`}
            >
              {transaction.type === "credit" ? (
                <ArrowDownLeft className="h-[18px] w-[18px]" />
              ) : (
                <ArrowUpRight className="h-[18px] w-[18px]" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-foreground">
                {transaction.description}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {transaction.transactionReference} · {new Date(transaction.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <p
                className={`text-[13px] font-semibold tabular-nums ${
                  transaction.type === "credit" ? "text-success" : "text-foreground"
                }`}
              >
                {transaction.type === "credit" ? "+" : "-"}{formatCurrency(transaction.amount, false)}
              </p>
              <Badge
                variant={transaction.status === "completed" ? "default" : "secondary"}
                className="text-[10px] font-medium capitalize"
              >
                {transaction.status}
              </Badge>
            </div>
          </div>
        )) : (
          <div className="py-16 text-center text-muted-foreground">
            <Receipt className="mx-auto mb-3 h-10 w-10 opacity-25" />
            <p className="text-sm font-medium">No transactions yet</p>
            <p className="mt-1 text-xs">Recent wallet transactions will appear here</p>
          </div>
        )}
      </div>
    </Card>
  );
}
