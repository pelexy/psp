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
import { Loader2, Mail, KeyRound } from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface WalletLockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlockSuccess: () => void;
}

export function WalletLockDialog({
  open,
  onOpenChange,
  onUnlockSuccess,
}: WalletLockDialogProps) {
  const { accessToken, user } = useAuth();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState(user?.email || "");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    if (!accessToken) return;

    setLoading(true);
    try {
      await apiService.initiateWalletUnlock(accessToken, email);
      toast.success("OTP sent to your email");
      setStep("otp");
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      toast.error(error.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otpCode.trim() || otpCode.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    if (!accessToken) return;

    setLoading(true);
    try {
      await apiService.confirmWalletUnlock(accessToken, otpCode);
      toast.success("Wallet unlocked successfully");
      onUnlockSuccess();
      onOpenChange(false);
      // Reset state
      setStep("email");
      setOtpCode("");
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast.error(error.message || "Invalid or expired OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state
    setTimeout(() => {
      setStep("email");
      setOtpCode("");
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Unlock Wallet</DialogTitle>
          <DialogDescription>
            {step === "email"
              ? "Enter your email to receive an OTP code"
              : "Enter the 6-digit code sent to your email"}
          </DialogDescription>
        </DialogHeader>

        {step === "email" ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500">
                An OTP will be sent to this email address
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSendOTP}
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send OTP"
                )}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">OTP Code</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="otp"
                  type="text"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                    setOtpCode(value);
                  }}
                  className="pl-10 text-center text-lg tracking-widest"
                  maxLength={6}
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-gray-500">
                OTP expires in 10 minutes
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setStep("email")}
                className="flex-1"
                disabled={loading}
              >
                Back
              </Button>
              <Button
                onClick={handleVerifyOTP}
                className="flex-1"
                disabled={loading || otpCode.length !== 6}
              >
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
                onClick={handleSendOTP}
                className="text-sm text-primary hover:underline"
                disabled={loading}
              >
                Resend OTP
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
