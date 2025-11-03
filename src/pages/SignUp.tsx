import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AuthLayout from "@/components/layouts/AuthLayout";
import { ArrowLeft, Mail } from "lucide-react";

const SignUp = () => {
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
          <h2 className="text-3xl font-bold text-foreground mb-2">Get started</h2>
          <p className="text-muted-foreground">
            Join BuyPower to manage your waste collection business
          </p>
        </div>

        {/* Info Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <Mail className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-blue-900 mb-2">
                Contact Sales for Access
              </p>
              <p className="text-sm text-blue-800 mb-4">
                New waste collection company accounts are created by BuyPower Administrator. Contact us to get started with managing your customer payments and debts.
              </p>
              <Button
                variant="outline"
                className="border-blue-300 hover:bg-blue-100"
                onClick={() => window.location.href = "mailto:sales@buypower.ng"}
              >
                Contact Sales Team
              </Button>
            </div>
          </div>
        </div>

        {/* Sign In Link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
};

export default SignUp;
