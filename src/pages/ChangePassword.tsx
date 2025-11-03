import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import AuthLayout from "@/components/layouts/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";
import { apiService, ApiError } from "@/services/api";

const ChangePassword = () => {
  const navigate = useNavigate();
  const { accessToken, isTemporaryPassword, login, user, psp, refreshToken } = useAuth();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters long");
      return;
    }

    if (!accessToken) {
      setError("You must be logged in to change your password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiService.changePassword(oldPassword, newPassword, accessToken);

      toast.success("Password changed successfully!");

      // Update temporary password flag
      if (isTemporaryPassword && user && psp && refreshToken) {
        login(user, psp, accessToken, refreshToken, false);
      }

      // Redirect to dashboard
      navigate("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to change password. Please try again.");
      }
      console.error("Change password error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full">
        {/* Back Link */}
        {!isTemporaryPassword && (
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-10 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        )}

        {/* Header */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-2">
            {isTemporaryPassword ? "Set New Password" : "Change Password"}
          </h2>
          <p className="text-muted-foreground">
            {isTemporaryPassword
              ? "You are using a temporary password. Please set a new password to continue."
              : "Update your password to keep your account secure"}
          </p>
        </div>

        {/* Info Message for Temporary Password */}
        {isTemporaryPassword && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 flex items-start gap-3 mb-6">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-900 mb-1">
                Password Change Required
              </p>
              <p className="text-sm text-blue-800">
                For security reasons, you must change your temporary password before accessing the dashboard.
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="oldPassword" className="text-sm font-medium">
              {isTemporaryPassword ? "Temporary Password" : "Current Password"}
            </Label>
            <Input
              id="oldPassword"
              type="password"
              placeholder="••••••••"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              disabled={loading}
              required
              className="h-12"
            />
          </div>

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
              Must be at least 8 characters long
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
                Changing password...
              </>
            ) : (
              "Change Password"
            )}
          </Button>
        </form>
      </div>
    </AuthLayout>
  );
};

export default ChangePassword;
