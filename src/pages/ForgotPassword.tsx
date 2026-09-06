import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Mail,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
} from "@/lib/icons";
import { toast } from "sonner";
import AuthLayout from "@/components/layouts/AuthLayout";
import { apiService, ApiError } from "@/services/api";

type Step = "email" | "otp" | "password";

const RESEND_COOLDOWN = 30;

const ForgotPassword = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  // Resend cooldown timer.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const getErrorMessage = (err: unknown, fallback: string) =>
    err instanceof ApiError ? err.message : fallback;

  // Step 1 — request an OTP for the entered email.
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiService.forgotPassword(email.trim());
      toast.success("If an account exists, a reset code has been sent");
      setStep("otp");
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to send reset code. Please try again."));
      console.error("Forgot password error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Resend the OTP (subject to cooldown).
  const handleResend = async () => {
    if (cooldown > 0 || loading) return;

    setLoading(true);
    setError(null);

    try {
      await apiService.forgotPassword(email.trim());
      toast.success("If an account exists, a reset code has been sent");
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      toast.error(getErrorMessage(err, "Failed to resend code. Please try again."));
      console.error("Resend OTP error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Step 2 — verify the 6-digit code.
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (otp.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiService.verifyOtp(email.trim(), otp);
      setStep("password");
    } catch (err) {
      const message = getErrorMessage(err, "Invalid or expired code");
      setError(message);
      toast.error(message);
      console.error("Verify OTP error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Step 3 — set the new password.
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiService.resetPassword(email.trim(), otp, newPassword);
      toast.success("Password reset successfully");
      navigate("/login");
    } catch (err) {
      const message = getErrorMessage(err, "Failed to reset password. Please try again.");
      setError(message);
      toast.error(message);
      console.error("Reset password error:", err);
    } finally {
      setLoading(false);
    }
  };

  const changeEmail = () => {
    setStep("email");
    setOtp("");
    setError(null);
  };

  const headings: Record<Step, { title: string; subtitle: string }> = {
    email: {
      title: "Forgot password",
      subtitle: "Enter your email and we'll send you a reset code",
    },
    otp: {
      title: "Enter reset code",
      subtitle: `Enter the 6-digit code sent to ${email}`,
    },
    password: {
      title: "Set new password",
      subtitle: "Choose a new password for your account",
    },
  };

  return (
    <AuthLayout>
      <div className="w-full">
        {/* Back Link */}
        {step === "email" ? (
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
        ) : (
          <button
            type="button"
            onClick={step === "otp" ? changeEmail : () => setStep("otp")}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        )}

        {/* Header */}
        <div className="mb-10">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
            {headings[step].title}
          </h2>
          <p className="text-sm text-muted-foreground">{headings[step].subtitle}</p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3.5 flex items-start gap-2 mb-6">
            <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {/* Step 1: Email */}
        {step === "email" && (
          <form onSubmit={handleRequestOtp} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@wastecollection.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                  className="h-12 pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send reset code"
              )}
            </Button>
          </form>
        )}

        {/* Step 2: OTP */}
        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="otp" className="text-sm font-medium">
                Reset code
              </Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  disabled={loading}
                  maxLength={6}
                  required
                  className="h-12 pl-10 text-center text-lg tracking-[0.5em]"
                />
              </div>
              <p className="text-xs text-muted-foreground">Code expires in 15 minutes</p>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={loading || otp.length !== 6}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify code"
              )}
            </Button>

            <div className="flex items-center justify-between text-sm">
              <button
                type="button"
                onClick={changeEmail}
                className="text-muted-foreground hover:text-foreground transition-colors"
                disabled={loading}
              >
                Change email
              </button>
              <button
                type="button"
                onClick={handleResend}
                className="text-primary hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                disabled={loading || cooldown > 0}
              >
                {cooldown > 0 ? `Resend code (${cooldown}s)` : "Resend code"}
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === "password" && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-sm font-medium">
                New password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="h-12 pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={loading}
                  required
                  className="h-12 pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset password"
              )}
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
