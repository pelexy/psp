import { useEffect, useRef, useState } from "react";
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
import { Loader2, KeyRound } from "@/lib/icons";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface WalletLockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlockSuccess: () => void;
}

// j***e@example.com — enough to recognise the inbox without spelling it out.
const maskEmail = (email: string) => {
  const [name, domain] = email.split("@");
  if (!name || !domain) return "your email";
  const shown = name.length <= 2 ? name[0] : `${name[0]}***${name[name.length - 1]}`;
  return `${shown}@${domain}`;
};

export function WalletLockDialog({
  open,
  onOpenChange,
  onUnlockSuccess,
}: WalletLockDialogProps) {
  const { accessToken, user } = useAuth();
  const [otpCode, setOtpCode] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [sending, setSending] = useState(false);
  const [sendFailed, setSendFailed] = useState(false);
  const [loading, setLoading] = useState(false);
  const sentForThisOpen = useRef(false);

  // The code always goes to the signed-in owner's own email — there is nothing to type.
  const sendCode = async () => {
    if (!accessToken) return;
    setSending(true);
    setSendFailed(false);
    try {
      const res = await apiService.initiateWalletUnlock(accessToken, user?.email || "");
      setSentTo(res?.otpSentTo || user?.email || "");
      toast.success("We sent a code to your email");
    } catch (error: any) {
      setSendFailed(true);
      toast.error(error.message || "Could not send the code");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!open) {
      sentForThisOpen.current = false;
      setOtpCode("");
      setSentTo("");
      setSendFailed(false);
      return;
    }
    if (sentForThisOpen.current) return;
    sentForThisOpen.current = true;
    sendCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      toast.error("Enter the 6-digit code");
      return;
    }
    if (!accessToken) return;

    setLoading(true);
    try {
      await apiService.confirmWalletUnlock(accessToken, otpCode);
      toast.success("Wallet unlocked successfully");
      onUnlockSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unlock Wallet</DialogTitle>
          <DialogDescription>
            {sending
              ? "Sending a code to your email…"
              : sendFailed
                ? "We could not send the code. Try again."
                : `Enter the 6-digit code we sent to ${maskEmail(sentTo || user?.email || "")}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otp">Verification code</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="pl-10 text-center text-lg tracking-widest"
                maxLength={6}
                disabled={loading || sending}
              />
            </div>
            <p className="text-xs text-gray-500">The code expires in 10 minutes</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1" disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleVerifyOTP} className="flex-1" disabled={loading || sending || otpCode.length !== 6}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Unlock Wallet"
              )}
            </Button>
          </div>

          <div className="text-center">
            <button
              onClick={sendCode}
              className="text-sm text-primary hover:underline disabled:opacity-60"
              disabled={loading || sending}
            >
              {sending ? "Sending…" : "Resend code"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
