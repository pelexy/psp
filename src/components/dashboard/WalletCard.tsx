import { Wallet, TrendingUp, TrendingDown, Eye, EyeOff } from "lucide-react";
import { useState } from "react";

interface WalletCardProps {
  balance: number;
  totalCollected: number;
  totalOutstanding: number;
  collectionRate: number;
  companyName: string;
}

export const WalletCard = ({
  balance,
  totalCollected,
  totalOutstanding,
  collectionRate,
  companyName,
}: WalletCardProps) => {
  const [showBalance, setShowBalance] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatAmount = (amount: number) => {
    if (!showBalance) return "₦ • • • • • •";
    return formatCurrency(amount);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl p-[1px] bg-gradient-to-br from-emerald-400/20 via-blue-500/20 to-purple-600/20">
      <div className="relative bg-gradient-to-br from-emerald-500/10 via-blue-600/10 to-purple-700/10 backdrop-blur-xl rounded-2xl p-6 md:p-8">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-emerald-500/20 to-blue-600/20 rounded-xl backdrop-blur-sm border border-white/10">
                <Wallet className="h-6 w-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Company Wallet
                </p>
                <p className="text-sm font-medium text-foreground/80 mt-0.5">
                  {companyName}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowBalance(!showBalance)}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              {showBalance ? (
                <Eye className="h-4 w-4 text-muted-foreground" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>

          {/* Balance */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Total Balance
            </p>
            <p className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              {formatAmount(balance)}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                <p className="text-xs text-muted-foreground">Collected</p>
              </div>
              <p className="text-base font-semibold text-foreground">
                {formatAmount(totalCollected)}
              </p>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <TrendingDown className="h-3.5 w-3.5 text-orange-500" />
                <p className="text-xs text-muted-foreground">Outstanding</p>
              </div>
              <p className="text-base font-semibold text-foreground">
                {formatAmount(totalOutstanding)}
              </p>
            </div>
          </div>

          {/* Collection Rate */}
          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">Collection Rate</p>
              <p className="text-sm font-semibold text-foreground">
                {collectionRate.toFixed(1)}%
              </p>
            </div>
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(collectionRate, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
