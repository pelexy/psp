import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Check, CheckCircle, ChevronsUpDown, Hash, Loader2, Search } from "@/lib/icons";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  /** Open straight on the bank-accounts screen instead of the withdrawal form. */
  initialStep?: "details" | "accounts";
  /** Called after a withdrawal is submitted (or failed and was refunded) so the balance refreshes. */
  onComplete?: () => void;
}

interface Bank {
  bankCode: string;
  bankName: string;
}

interface BankAccount {
  id: string;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: "pending" | "approved" | "rejected";
  reviewNote: string | null;
}

type Step = "details" | "accounts" | "otp";

const STATUS_LABEL: Record<BankAccount["status"], string> = {
  approved: "Approved",
  pending: "Waiting for approval",
  rejected: "Not approved",
};

// Shown at the top of the bank list before anything is typed.
const COMMON_BANK_CODES = [
  "000014", // Access Bank
  "000016", // First Bank of Nigeria
  "000013", // GTBank
  "000004", // United Bank for Africa
  "000015", // Zenith Bank
  "000001", // Sterling Bank
  "090267", // Kuda
  "090405", // Moniepoint
  "100004", // Opay
  "100033", // PalmPay
];

/** One field: type to search, pick from the list underneath. */
function BankPicker({
  banks,
  value,
  onChange,
  onPicked,
}: {
  banks: Bank[];
  value: string;
  onChange: (bankCode: string) => void;
  onPicked?: () => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const selected = banks.find((b) => b.bankCode === value);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Nothing typed: the banks most people use first, then every other bank A–Z.
      const common = COMMON_BANK_CODES.map((c) => banks.find((b) => b.bankCode === c)).filter(Boolean) as Bank[];
      return [...common, ...banks.filter((b) => !COMMON_BANK_CODES.includes(b.bankCode))];
    }
    // Names that start with what was typed come first.
    const starts = banks.filter((b) => b.bankName.toLowerCase().startsWith(q));
    const contains = banks.filter(
      (b) => !b.bankName.toLowerCase().startsWith(q) && b.bankName.toLowerCase().includes(q),
    );
    return [...starts, ...contains];
  }, [banks, query]);

  useEffect(() => setActive(0), [query, open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const pick = (b: Bank) => {
    onChange(b.bankCode);
    setQuery("");
    setOpen(false);
    onPicked?.();
  };

  return (
    <div ref={boxRef} className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        id="bank"
        role="combobox"
        aria-expanded={open}
        aria-controls="bank-options"
        autoComplete="off"
        className="pl-9 pr-9"
        placeholder={banks.length ? `Search ${banks.length} banks` : "Loading banks…"}
        disabled={!banks.length}
        value={open ? query : selected?.bankName || ""}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            setActive((i) => Math.min(i + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (e.key === "Enter" && open && matches[active]) {
            e.preventDefault();
            pick(matches[active]);
          } else if (e.key === "Escape" && open) {
            e.stopPropagation();
            setOpen(false);
          }
        }}
      />
      <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      {open && (
        <ul
          id="bank-options"
          role="listbox"
          className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-md border border-border bg-background py-1 shadow-lg"
        >
          {matches.length === 0 && (
            <li className="px-3 py-2 text-sm text-muted-foreground">No bank matches “{query}”</li>
          )}
          {matches.map((b, i) => (
            <li
              key={`${b.bankCode}-${b.bankName}`}
              role="option"
              aria-selected={b.bankCode === value}
              className={
                "flex cursor-pointer items-center justify-between px-3 py-2 text-sm " +
                (i === active ? "bg-muted" : "")
              }
              onMouseEnter={() => setActive(i)}
              // mousedown, not click: the input must not lose focus (and close the list) first.
              onMouseDown={(e) => {
                e.preventDefault();
                pick(b);
              }}
            >
              <span className="truncate">{b.bankName}</span>
              {b.bankCode === value && <Check className="h-4 w-4 shrink-0 text-primary" />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function WithdrawDialog({
  open,
  onOpenChange,
  availableBalance,
  initialStep = "details",
  onComplete,
}: WithdrawDialogProps) {
  const { accessToken } = useAuth();
  const [step, setStep] = useState<Step>(initialStep);
  const [amount, setAmount] = useState("");
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [accountsLoaded, setAccountsLoaded] = useState(false);
  const [accountId, setAccountId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSentTo, setOtpSentTo] = useState("");
  const [loading, setLoading] = useState(false);

  // Add-account form
  const [banks, setBanks] = useState<Bank[]>([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState("");
  const accountInputRef = useRef<HTMLInputElement>(null);

  const approved = accounts.filter((a) => a.status === "approved");
  const account = approved.find((a) => a.id === accountId);
  const bank = banks.find((b) => b.bankCode === bankCode);

  const resetAddForm = () => {
    setBankCode("");
    setAccountNumber("");
    setAccountName("");
  };

  const close = (next: boolean) => {
    if (!next) {
      setAmount("");
      setOtpCode("");
      setOtpSentTo("");
      resetAddForm();
    }
    onOpenChange(next);
  };

  const loadAccounts = async () => {
    if (!accessToken) return;
    try {
      const res = await apiService.getBankAccounts(accessToken);
      const list: BankAccount[] = res?.data || [];
      setAccounts(list);
      setAccountId((cur) => {
        const ok = list.filter((a) => a.status === "approved");
        return ok.some((a) => a.id === cur) ? cur : ok[0]?.id || "";
      });
    } catch {
      toast.error("Could not load your bank accounts");
    } finally {
      setAccountsLoaded(true);
    }
  };

  useEffect(() => {
    if (!open) return;
    setStep(initialStep);
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialStep, accessToken]);

  useEffect(() => {
    if (!open || step !== "accounts" || !accessToken || banks.length) return;
    apiService
      .getBanks(accessToken)
      .then((res) => {
        const list: Bank[] = (res?.data || []).filter((b: Bank) => b.bankCode && b.bankName);
        list.sort((a, b) => a.bankName.localeCompare(b.bankName));
        setBanks(list);
      })
      .catch(() => toast.error("Could not load the bank list"));
  }, [open, step, accessToken, banks.length]);

  // Look up the account name once a bank and a 10-digit account number are set.
  useEffect(() => {
    setAccountName("");
    setResolveError("");
    if (!accessToken || !bankCode || !/^\d{10}$/.test(accountNumber)) return;
    let cancelled = false;
    setResolving(true);
    apiService
      .resolveBankAccount(accessToken, bankCode, accountNumber)
      .then((res) => {
        if (cancelled) return;
        const name = res?.data?.accountName || "";
        setAccountName(name);
        if (!name) setResolveError("We could not find this account at this bank. Check the bank and number.");
      })
      .catch(() => {
        if (!cancelled) setResolveError("We could not find this account at this bank. Check the bank and number.");
      })
      .finally(() => {
        if (!cancelled) setResolving(false);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, bankCode, accountNumber]);

  const handleAddAccount = async () => {
    if (!bank) {
      toast.error("Please select your bank");
      return;
    }
    if (!accountName) {
      toast.error("Please enter a valid account number");
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.addBankAccount(accessToken!, bank.bankCode, accountNumber);
      toast.success(res?.message || "Bank account submitted for approval");
      resetAddForm();
      await loadAccounts();
    } catch (error: any) {
      toast.error(error?.message || "Could not add this bank account");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAccount = async (a: BankAccount) => {
    setLoading(true);
    try {
      await apiService.removeBankAccount(accessToken!, a.id);
      toast.success("Bank account removed");
      await loadAccounts();
    } catch (error: any) {
      toast.error(error?.message || "Could not remove this bank account");
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = async () => {
    const withdrawAmount = parseFloat(amount);

    if (!withdrawAmount || withdrawAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (withdrawAmount > availableBalance) {
      toast.error("Insufficient balance");
      return;
    }
    if (!account) {
      toast.error("Choose the bank account to pay into");
      return;
    }

    setLoading(true);
    try {
      const res = await apiService.initiateWithdrawal(accessToken!, {
        bankAccountId: account.id,
        amount: withdrawAmount,
        narration: "WasteCollect withdrawal",
      });
      setOtpSentTo(res?.otpSentTo || "");
      setStep("otp");
      toast.success("We sent a verification code to your email");
    } catch (error: any) {
      toast.error(error?.message || "Could not start the withdrawal");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!/^\d{6}$/.test(otpCode)) {
      toast.error("Enter the 6-digit code");
      return;
    }
    setLoading(true);
    try {
      const res = await apiService.confirmWithdrawal(accessToken!, otpCode);
      if (res?.outcome === "successful") {
        toast.success("Withdrawal successful");
      } else {
        toast.success(res?.message || "Withdrawal is processing");
      }
      onComplete?.();
      close(false);
    } catch (error: any) {
      // A failed transfer is refunded to the wallet by the server; the message says so.
      toast.error(error?.message || "Withdrawal failed", { duration: 10000 });
      onComplete?.();
      if (!/otp|code/i.test(error?.message || "")) close(false);
    } finally {
      setLoading(false);
    }
  };

  const title = step === "accounts" ? "Bank accounts" : "Withdraw Funds";
  const description =
    step === "details"
      ? "Transfer funds to one of your approved bank accounts"
      : step === "accounts"
        ? "You can only withdraw to an account WasteCollect has approved"
        : `Enter the 6-digit code sent to ${otpSentTo || "your email"}`;

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {step === "details" && (
          <div className="space-y-4 py-4">
            {accountsLoaded && approved.length === 0 ? (
              <div className="rounded-lg border border-border p-4 text-sm space-y-3">
                <p className="font-medium">
                  {accounts.some((a) => a.status === "pending")
                    ? "Your bank account is waiting for approval"
                    : "Add your bank account first"}
                </p>
                <p className="text-muted-foreground">
                  {accounts.some((a) => a.status === "pending")
                    ? "WasteCollect is reviewing the account you submitted. You will get an email as soon as it is approved, then you can withdraw."
                    : "For your safety, withdrawals only go to a bank account that WasteCollect has approved for your business."}
                </p>
                <Button variant="outline" className="w-full" onClick={() => setStep("accounts")}>
                  {accounts.length ? "View bank accounts" : "Add bank account"}
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₦</span>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Available: ₦{availableBalance.toLocaleString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pay-into">Pay into</Label>
                    <button
                      type="button"
                      className="text-xs font-medium text-primary hover:underline"
                      onClick={() => setStep("accounts")}
                    >
                      Manage bank accounts
                    </button>
                  </div>
                  <select
                    id="pay-into"
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                  >
                    {approved.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.accountName} — {a.bankName} {a.accountNumber}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-lg bg-muted p-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Withdrawal Amount</span>
                    <span className="font-medium">₦{amount || "0.00"}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Processing Fee</span>
                    <span className="font-medium">₦0.00</span>
                  </div>
                  <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Total</span>
                      <span className="text-lg font-bold">₦{amount || "0.00"}</span>
                    </div>
                  </div>
                </div>

                <Button onClick={handleContinue} disabled={loading || !accountsLoaded} className="w-full">
                  {loading ? "Sending code..." : "Continue"}
                </Button>
              </>
            )}
          </div>
        )}

        {step === "accounts" && (
          <div className="space-y-5 py-4">
            {accounts.length > 0 && (
              <div className="divide-y divide-border rounded-lg border border-border">
                {accounts.map((a) => (
                  <div key={a.id} className="flex items-start justify-between gap-3 p-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium truncate">{a.accountName}</p>
                      <p className="text-muted-foreground">
                        {a.bankName} · {a.accountNumber}
                      </p>
                      <p
                        className={
                          "mt-1 text-xs font-medium " +
                          (a.status === "approved"
                            ? "text-primary"
                            : a.status === "rejected"
                              ? "text-destructive"
                              : "text-muted-foreground")
                        }
                      >
                        {STATUS_LABEL[a.status]}
                        {a.status === "rejected" && a.reviewNote ? ` — ${a.reviewNote}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 text-xs text-muted-foreground hover:text-destructive"
                      disabled={loading}
                      onClick={() => handleRemoveAccount(a)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-4">
              {accounts.length > 0 && <p className="text-sm font-medium">Add another bank account</p>}

              <div className="space-y-2">
                <Label htmlFor="bank">Bank</Label>
                <BankPicker
                  banks={banks}
                  value={bankCode}
                  onChange={setBankCode}
                  onPicked={() => setTimeout(() => accountInputRef.current?.focus(), 0)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="account">Account number</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="account"
                    ref={accountInputRef}
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={10}
                    placeholder="10-digit account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ""))}
                    className="pl-9 tabular-nums"
                  />
                </div>
              </div>

              {/* What the bank says about this account */}
              {resolving ? (
                <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking with {bank?.bankName || "the bank"}…
                </div>
              ) : accountName ? (
                <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div className="min-w-0 text-sm">
                    <p className="font-medium">{accountName}</p>
                    <p className="text-muted-foreground">
                      {bank?.bankName} · {accountNumber}
                    </p>
                  </div>
                </div>
              ) : resolveError ? (
                <p className="rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{resolveError}</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  {!bankCode
                    ? "Choose your bank, then enter the account number. We will show the account name from the bank."
                    : `Enter the 10-digit ${bank?.bankName || ""} account number.`}
                </p>
              )}

              <Button onClick={handleAddAccount} disabled={loading || resolving || !accountName} className="w-full">
                {loading ? "Submitting..." : "Submit for approval"}
              </Button>
              <p className="text-xs text-muted-foreground">
                WasteCollect reviews every new account before money can be sent to it. You will get an email when it
                is approved.
              </p>
            </div>

            {initialStep === "details" && (
              <Button variant="outline" className="w-full" onClick={() => setStep("details")} disabled={loading}>
                Back to withdrawal
              </Button>
            )}
          </div>
        )}

        {step === "otp" && (
          <div className="space-y-4 py-4">
            <div className="rounded-lg bg-muted p-4 text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">To</span>
                <span className="font-medium text-right">{account?.accountName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Bank</span>
                <span className="font-medium text-right">
                  {account?.bankName} · {account?.accountNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold">₦{parseFloat(amount || "0").toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="otp">Verification code</Label>
              <Input
                id="otp"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setStep("details")}
                disabled={loading}
                className="flex-1"
              >
                Back
              </Button>
              <Button onClick={handleConfirm} disabled={loading} className="flex-1">
                {loading ? "Processing..." : "Confirm Withdrawal"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
