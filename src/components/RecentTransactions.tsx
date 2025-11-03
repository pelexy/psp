import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownLeft, Receipt } from "lucide-react";
import { formatCurrency } from "@/utils/formatCurrency";

interface RecentTransactionsProps {
  transactionsData?: any;
}

export function RecentTransactions({ transactionsData }: RecentTransactionsProps) {
  const transactions = transactionsData || [];
  return (
    <Card className="p-6 bg-card/40 backdrop-blur-xl border-border/50 shadow-card animate-fade-in min-h-[480px]">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Recent Transactions</h3>
          <p className="text-sm text-muted-foreground">Latest payment activity</p>
        </div>
        <div className="space-y-3">
          {transactions.length > 0 ? transactions.map((transaction: any) => (
            <div
              key={transaction._id}
              className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-accent/30 to-transparent hover:from-accent/50 transition-all duration-300"
            >
              <div
                className={`flex-shrink-0 h-12 w-12 rounded-2xl flex items-center justify-center backdrop-blur-sm ${
                  transaction.type === "credit"
                    ? "bg-success/20 border-2 border-success/30"
                    : "bg-warning/20 border-2 border-warning/30"
                }`}
              >
                {transaction.type === "credit" ? (
                  <ArrowDownLeft className="h-6 w-6 text-success" />
                ) : (
                  <ArrowUpRight className="h-6 w-6 text-warning" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">
                  {transaction.description}
                </p>
                <p className="text-xs text-muted-foreground">
                  {transaction.transactionReference} • {new Date(transaction.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right space-y-1">
                <p
                  className={`text-base font-bold ${
                    transaction.type === "credit"
                      ? "text-success"
                      : "text-warning"
                  }`}
                >
                  {transaction.type === "credit" ? "+" : "-"}{formatCurrency(transaction.amount, false)}
                </p>
                <Badge
                  variant={
                    transaction.status === "completed" ? "default" : "secondary"
                  }
                  className="text-xs"
                >
                  {transaction.status}
                </Badge>
              </div>
            </div>
          )) : (
            <div className="text-center py-12 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No transactions yet</p>
              <p className="text-xs mt-1">Recent wallet transactions will appear here</p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
