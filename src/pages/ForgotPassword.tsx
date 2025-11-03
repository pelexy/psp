import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import AuthLayout from "@/components/layouts/AuthLayout";
import { apiService, ApiError } from "@/services/api";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await apiService.forgotPassword(email);

      setSuccess(true);
      toast.success("Password reset link sent!");
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to send reset link. Please try again.");
      }
      console.error("Forgot password error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full">
        {/* Back Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-10 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        {/* Header */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-2">Forgot password</h2>
          <p className="text-muted-foreground">
            Enter your email and we'll send you reset instructions
          </p>
        </div>

        {success ? (
          /* Success State */
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-5 flex items-start gap-3">
              <CheckCircle2 className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-900 mb-1">
                  Check your email
                </p>
                <p className="text-sm text-green-800">
                  We've sent password reset instructions to <strong>{email}</strong>
                </p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-4">
                Didn't receive the email? Check your spam folder.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess(false);
                  setEmail("");
                }}
                className="w-full h-12"
              >
                Try another email
              </Button>
            </div>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3.5 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@wastecollection.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  Sending...
                </>
              ) : (
                "Send reset link"
              )}
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
