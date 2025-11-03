import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import AuthLayout from "@/components/layouts/AuthLayout";
import { apiService, ApiError } from "@/services/api";

const FirstTimePasswordReset = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get token and email from sessionStorage
    const storedToken = sessionStorage.getItem('changePasswordToken');
    const storedEmail = sessionStorage.getItem('changePasswordEmail');

    if (!storedToken || !storedEmail) {
      // If no token, redirect to login
      toast.error("Session expired. Please login again.");
      navigate('/login');
      return;
    }

    setToken(storedToken);
    setEmail(storedEmail);
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (!token) {
      setError("Invalid session. Please login again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiService.resetPassword(token, newPassword);

      // Clear session storage
      sessionStorage.removeItem('changePasswordToken');
      sessionStorage.removeItem('changePasswordEmail');

      toast.success("Password changed successfully! Please login with your new password.");

      // Redirect to login page after a short delay
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.statusCode === 400) {
          setError("Invalid or expired reset token. Please login again to get a new token.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Failed to reset password. Please try again.");
      }
      console.error("Password reset error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full">
        {/* Header */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Set Your New Password
          </h2>
          <p className="text-muted-foreground">
            You are using a temporary password. Please set a new password to continue.
          </p>
        </div>

        {/* Info Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 flex items-start gap-3 mb-6">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-blue-900 mb-1">
              Password Change Required
            </p>
            <p className="text-sm text-blue-800">
              For security reasons, you must change your temporary password before accessing the dashboard.
            </p>
            {email && (
              <p className="text-sm text-blue-700 mt-2">
                Account: <strong>{email}</strong>
              </p>
            )}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-sm font-medium">
              New Password
            </Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={loading}
              required
              className="h-12"
            />
            <p className="text-xs text-muted-foreground">
              Must be at least 6 characters long
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm New Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
              className="h-12"
            />
          </div>

          <Button
            type="submit"
            className="w-full h-12 text-base font-medium"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Resetting password...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Set New Password
              </>
            )}
          </Button>
        </form>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Having trouble?{" "}
            <button
              onClick={() => {
                sessionStorage.removeItem('changePasswordToken');
                sessionStorage.removeItem('changePasswordEmail');
                navigate('/login');
              }}
              className="text-primary hover:underline font-medium"
            >
              Back to login
            </button>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default FirstTimePasswordReset;
