import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import AuthLayout from "@/components/layouts/AuthLayout";
import { useAuth } from "@/contexts/AuthContext";
import { apiService, ApiError } from "@/services/api";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.login(email, password);

      console.log('Login response:', response);

      // Check if this is a first-time login with temporary password
      if ('requirePasswordChange' in response && response.requirePasswordChange === true) {
        // Store token temporarily in sessionStorage (not localStorage for security)
        sessionStorage.setItem('changePasswordToken', response.changePasswordToken);
        sessionStorage.setItem('changePasswordEmail', response.email || email);

        // Redirect to first-time password reset screen
        navigate('/first-time-reset-password');
        return;
      }

      // Type assertion: at this point, we know it's a normal login response
      const normalResponse = response as import('@/services/api').NormalLoginResponse;
      const responseData = 'data' in normalResponse ? normalResponse.data : normalResponse as any;

      // Validate essential fields exist for normal login
      if (!responseData.user || !responseData.accessToken) {
        console.error('Invalid response structure:', responseData);
        throw new Error("Invalid response from server - missing required fields");
      }

      // Handle PSP data - might be in response.data.psp or need to be constructed
      const pspData = responseData.psp || {
        _id: (responseData.user as any).pspId || '',
        companyName: (responseData.user as any).companyName || 'PSP Company',
        email: responseData.user.email || email,
        phone: '',
        address: '',
        businessType: 'waste_management',
        registrationNumber: '',
        taxId: '',
        isActive: true,
      };

      // Check if user has temporary password
      const isTemporaryPassword = responseData.user.isTemporaryPassword || false;

      // Store authentication data and fetch dashboard data
      await login(
        responseData.user,
        pspData,
        responseData.accessToken,
        responseData.refreshToken || '',
        isTemporaryPassword
      );

      toast.success("Login successful!");

      // Redirect based on temporary password status
      if (isTemporaryPassword) {
        navigate("/change-password");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        // Provide more specific error messages
        if (err.statusCode === 401) {
          setError("Invalid email or password. Please check your credentials and try again.");
        } else if (err.statusCode === 403) {
          setError("Your account is not active. Please contact support.");
        } else {
          setError(err.message);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full">
        {/* Header */}
        <div className="mb-10">
          <h2 className="text-3xl font-bold text-foreground mb-2">Welcome back</h2>
          <p className="text-muted-foreground">
            Sign in to access your waste collection management dashboard
          </p>
        </div>

        {/* Login Form */}
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

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        {/* Sign Up Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;
