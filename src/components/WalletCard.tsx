import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, ArrowUpFromLine, Eye, EyeOff } from "lucide-react";
import { WithdrawDialog } from "./WithdrawDialog";

export function WalletCard() {
  const [showBalance, setShowBalance] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const balance = 24785000;

  return (
    <>
      <Card className="relative overflow-hidden bg-primary/5 border border-primary/10 shadow-sm animate-fade-in">
        <div className="relative p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Available Balance
              </p>
              <div className="flex items-center gap-3 mt-2">
                {showBalance ? (
                  <p className="text-4xl font-bold text-foreground">
                    ₦{balance.toLocaleString()}
                  </p>
                ) : (
                  <p className="text-4xl font-bold text-foreground">••••••</p>
                )}
                <button
                  onClick={() => setShowBalance(!showBalance)}
                  className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {showBalance ? (
                    <Eye className="h-5 w-5 text-gray-600" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              variant="default"
              className="flex-1 bg-primary text-white hover:bg-primary/90 shadow-sm"
              onClick={() => setWithdrawOpen(true)}
            >
              <ArrowUpFromLine className="h-4 w-4 mr-2" />
              Withdraw
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-primary/20 text-primary hover:bg-primary/5"
            >
              <ArrowDownToLine className="h-4 w-4 mr-2" />
              Deposit
            </Button>
          </div>

          <div className="pt-5 border-t border-gray-200">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-green-50">
                <p className="text-xs text-gray-600 font-medium mb-1">This Month</p>
                <p className="text-lg font-bold text-green-700">₦9.5M</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50">
                <p className="text-xs text-gray-600 font-medium mb-1">Withdrawn</p>
                <p className="text-lg font-bold text-blue-700">₦5.2M</p>
              </div>
              <div className="p-3 rounded-lg bg-orange-50">
                <p className="text-xs text-gray-600 font-medium mb-1">Pending</p>
                <p className="text-lg font-bold text-orange-700">₦320K</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <WithdrawDialog
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        availableBalance={balance}
      />
    </>
  );
}
