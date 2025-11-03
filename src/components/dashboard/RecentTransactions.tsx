import { ArrowUpRight, Clock, CheckCircle2, XCircle } from "lucide-react";

interface Transaction {
  _id: string;
  transactionReference: string;
  amount: number;
  status: string;
  type: string;
  customerId: {
    _id: string;
    fullName: string;
    customerAccountNumber: string;
  };
  invoiceId: {
    _id: string;
    invoiceNumber: string;
  };
  paidAt: string | null;
  createdAt: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export const RecentTransactions = ({ transactions }: RecentTransactionsProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case "success":
        return {
          icon: CheckCircle2,
          color: "text-emerald-600",
          bgColor: "bg-emerald-100/80",
          label: "Success",
        };
      case "pending":
        return {
          icon: Clock,
          color: "text-orange-600",
          bgColor: "bg-orange-100/80",
          label: "Pending",
        };
      case "failed":
        return {
          icon: XCircle,
          color: "text-red-600",
          bgColor: "bg-red-100/80",
          label: "Failed",
        };
      default:
        return {
          icon: Clock,
          color: "text-gray-600",
          bgColor: "bg-gray-100/80",
          label: status,
        };
    }
  };

  if (!transactions || transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p>No recent transactions</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((transaction) => {
        const statusConfig = getStatusConfig(transaction.status);
        const StatusIcon = statusConfig.icon;

        return (
          <div
            key={transaction._id}
            className="group flex items-center justify-between p-4 bg-card/30 backdrop-blur-sm border border-border/40 rounded-lg hover:border-border/80 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {/* Icon */}
              <div className={`p-2.5 ${statusConfig.bgColor} rounded-lg shrink-0`}>
                <StatusIcon className={`h-4 w-4 ${statusConfig.color}`} />
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {transaction.customerId.fullName}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-muted-foreground truncate">
                    {transaction.invoiceId.invoiceNumber}
                  </p>
                  <span className="text-xs text-muted-foreground">•</span>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(transaction.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="text-right">
                <p className="font-semibold text-foreground">
                  {formatCurrency(transaction.amount)}
                </p>
                <p className={`text-xs ${statusConfig.color} font-medium`}>
                  {statusConfig.label}
                </p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
