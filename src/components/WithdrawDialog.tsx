import { useState } from "react";
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
import { DollarSign, Building2, Hash } from "lucide-react";

interface WithdrawDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
}

export function WithdrawDialog({
  open,
  onOpenChange,
  availableBalance,
}: WithdrawDialogProps) {
  const [amount, setAmount] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    const withdrawAmount = parseFloat(amount);

    if (!withdrawAmount || withdrawAmount <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (withdrawAmount > availableBalance) {
      toast.error("Insufficient balance");
      return;
    }

    if (!bankAccount) {
      toast.error("Please enter your bank account number");
      return;
    }

    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);

    toast.success("Withdrawal request submitted successfully!");
    setAmount("");
    setBankAccount("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
          <DialogDescription>
            Transfer funds to your bank account
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
            <Label htmlFor="bank">Bank Account Number</Label>
            <div className="relative">
              <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="bank"
                type="text"
                placeholder="Enter account number"
                value={bankAccount}
                onChange={(e) => setBankAccount(e.target.value)}
                className="pl-9"
              />
            </div>
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

          <Button
            onClick={handleWithdraw}
            disabled={loading}
            className="w-full"
          >
            {loading ? "Processing..." : "Confirm Withdrawal"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
