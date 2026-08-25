import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowUpFromLine, ArrowDownLeft, ArrowUpRight, Eye, EyeOff, Lock, Unlock } from "@/lib/icons";
import { WithdrawDialog } from "./WithdrawDialog";
import { WalletLockDialog } from "./WalletLockDialog";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatCurrency, formatCurrencyFull } from "@/utils/formatCurrency";

interface FinancialOverviewProps {
  comprehensiveData?: any;
}

export function FinancialOverview({ comprehensiveData }: FinancialOverviewProps) {
  // Ledger truth (customer_ledger_entries) — NOT invoice.status. An invoice is a
  // DEBIT; a payment is a CREDIT; "outstanding" is the receivables balance.
  const billing = comprehensiveData?.billingSummary ?? {
    billed: 0,
    collected: 0,
    outstanding: 0,
    customersOwing: 0,
    customerCredit: 0,
    customersInCredit: 0,
  };
  const surplus = Number(billing.customerCredit) || 0;
  const customersInCredit = Number(billing.customersInCredit) || 0;
  // A collection RATE only exists once something has been billed. With nothing
  // billed, the rate is 0/0 (undefined) — show "—", never a misleading "0%".
  const hasBills = (billing.billed || 0) > 0;
  const collectionRate = hasBills
    ? Math.min(100, Math.round((billing.collected / billing.billed) * 100))
    : 0;
  const rateDisplay = hasBills ? `${collectionRate}%` : "—";
  const { accessToken } = useAuth();
  const [showBalance, setShowBalance] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [walletData, setWalletData] = useState({
    balance: 0,
    monthlyWithdrawals: 0,
    monthlyInflows: 0,
    isWalletLocked: false,
  });
  useEffect(() => {
    if (!accessToken) return;
    const refresh = () => {
      fetchWalletBalance();
    };
    refresh();
    // Auto-refresh so a payment that lands shows up without a manual reload.
    const interval = setInterval(refresh, 30000);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  const fetchWalletBalance = async () => {
    if (!accessToken) return;

    try {
      const response = await apiService.getWalletBalance(accessToken);
      setWalletData(response.data);
    } catch (error: any) {
      console.error("Error fetching wallet balance:", error);
      toast.error(error.message || "Failed to load wallet balance");
    }
  };

  const handleToggleLock = async () => {
    if (walletData.isWalletLocked) {
      // Open unlock dialog
      setLockDialogOpen(true);
    } else {
      // Lock wallet directly
      try {
        await apiService.lockWallet(accessToken!);
        toast.success("Wallet locked successfully");
        fetchWalletBalance(); // Refresh data
      } catch (error: any) {
        console.error("Error locking wallet:", error);
        toast.error(error.message || "Failed to lock wallet");
      }
    }
  };

  return (
    <>
      <Card className="w-full overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Side - Wallet */}
          <div className="p-5 md:p-6 lg:border-r border-border">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium text-muted-foreground">Available Balance</p>
              {walletData.isWalletLocked && (
                <span className="inline-flex items-center gap-1 rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                  <Lock className="h-3 w-3" />
                  Locked
                </span>
              )}
            </div>

            <div className="mt-1.5 flex items-center gap-2">
              <p className="text-3xl font-semibold tracking-tight tabular-nums text-foreground break-all md:text-4xl">
                {showBalance ? formatCurrencyFull(walletData.balance) : "••••••"}
              </p>
              <button
                onClick={() => setShowBalance(!showBalance)}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted"
                aria-label={showBalance ? "Hide balance" : "Show balance"}
              >
                {showBalance ? <Eye className="h-[18px] w-[18px]" /> : <EyeOff className="h-[18px] w-[18px]" />}
              </button>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button
                className="h-10"
                onClick={() => setWithdrawOpen(true)}
                disabled={walletData.isWalletLocked}
              >
                <ArrowUpFromLine className="h-4 w-4" />
                Withdraw
              </Button>
              <Button
                variant="outline"
                className="h-10"
                onClick={handleToggleLock}
              >
                {walletData.isWalletLocked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {walletData.isWalletLocked ? "Unlock" : "Lock"}
              </Button>
            </div>

            {/* Inflow / Withdrawal tiles */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-muted/40 p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <ArrowDownLeft className="h-3.5 w-3.5 text-success" />
                  Monthly Inflows
                </div>
                <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                  {formatCurrency(walletData.monthlyInflows)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-3.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
                  Monthly Withdrawals
                </div>
                <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                  {formatCurrency(walletData.monthlyWithdrawals)}
                </p>
              </div>
            </div>

            {/* Performance rings */}
            <div className="mt-5 space-y-3">
              {[
                {
                  label: "Collection Rate",
                  pct: collectionRate,
                  display: rateDisplay,
                  sub: hasBills
                    ? `${formatCurrency(billing.collected)} of ${formatCurrency(billing.billed)} collected`
                    : "No bills this period",
                  color: "hsl(151 55% 30%)",
                },
                {
                  label: "Outstanding Receivables",
                  pct: hasBills ? Math.min(100, Math.round((billing.outstanding / billing.billed) * 100)) : 0,
                  display: hasBills ? `${Math.min(100, Math.round((billing.outstanding / billing.billed) * 100))}%` : "—",
                  sub: `${formatCurrency(billing.outstanding)} · ${billing.customersOwing} owing`,
                  color: "hsl(151 45% 42%)",
                },
              ].map((ring) => (
                <div key={ring.label} className="flex items-center gap-3 rounded-lg border border-border p-3.5">
                  <div className="relative flex-shrink-0">
                    <svg className="h-14 w-14 -rotate-90">
                      <circle cx="28" cy="28" r="24" stroke="hsl(var(--muted))" strokeWidth="4" fill="none" />
                      <circle
                        cx="28"
                        cy="28"
                        r="24"
                        stroke={ring.color}
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${ring.pct * 1.51} ${100 * 1.51}`}
                        strokeLinecap="round"
                        className="transition-all duration-700 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold tabular-nums text-foreground">
                        {ring.display}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-foreground">{ring.label}</p>
                    <p className="truncate text-xs text-muted-foreground">{ring.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Receivables (ledger truth: debits owed vs credits paid) */}
          <div className="flex flex-col border-t border-border p-5 md:p-6 lg:border-t-0">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-medium text-muted-foreground">Outstanding Receivables</h3>
              <span className="text-xs text-muted-foreground">
                {billing.customersOwing.toLocaleString()} customer{billing.customersOwing === 1 ? "" : "s"} owing
              </span>
            </div>

            <p className="mt-1.5 text-3xl font-semibold tracking-tight tabular-nums text-foreground md:text-4xl">
              {formatCurrencyFull(billing.outstanding)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Total charged to customers, not yet paid (across all time)
            </p>

            {/* Customer credit (surplus) — prepayments held, shown separately so it
                never nets against what other customers owe. */}
            {surplus > 0 && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-success/30 bg-success/5 px-3 py-2">
                <span className="inline-flex items-center gap-1 rounded-md bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                  Surplus
                </span>
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold tabular-nums text-foreground">{formatCurrencyFull(surplus)}</span>{" "}
                  in customer credit · {customersInCredit} prepaid
                </p>
              </div>
            )}

            {/* Period billed vs collected */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-muted/40 p-3.5">
                <p className="text-xs font-medium text-muted-foreground">Billed (this period)</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                  {formatCurrency(billing.billed)}
                </p>
              </div>
              <div className="rounded-lg border border-border bg-muted/40 p-3.5">
                <p className="text-xs font-medium text-muted-foreground">Collected (this period)</p>
                <p className="mt-1 text-lg font-semibold tabular-nums text-success">
                  {formatCurrency(billing.collected)}
                </p>
              </div>
            </div>

            {/* Collection rate bar */}
            <div className="mt-5">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-medium text-foreground">Collection Rate</span>
                <span className="font-semibold tabular-nums text-foreground">{rateDisplay}</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
                  style={{ width: `${collectionRate}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {hasBills
                  ? `${formatCurrency(billing.collected)} collected of ${formatCurrency(billing.billed)} billed this period`
                  : "No bills billed this period yet — collection rate starts once bills are generated"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        availableBalance={walletData.balance}
      />

      <WalletLockDialog
        open={lockDialogOpen}
        onOpenChange={setLockDialogOpen}
        onUnlockSuccess={fetchWalletBalance}
      />
    </>
  );
}
