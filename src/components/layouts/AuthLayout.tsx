import type { ReactNode } from "react";
import { Recycle, Trash2 } from "lucide-react";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex">
      {/* Left Side - Brand & Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary text-white p-12 flex-col justify-between relative overflow-hidden">
        {/* Pattern Background */}
        <div className="absolute inset-0 opacity-[0.07]">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="diagonal-lines" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="60" stroke="white" strokeWidth="1.5" />
                <line x1="30" y1="0" x2="30" y2="60" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#diagonal-lines)" />
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10">
        {/* Logo & Brand */}
        <div>
          <div className="flex items-center gap-3 mb-12">
            <Recycle className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold">Collect</h1>
              <p className="text-sm text-white/80">by BuyPower</p>
            </div>
          </div>

          <div className="max-w-md space-y-8">
            <div>
              <h2 className="text-4xl font-bold mb-4 leading-tight">
                Manage <span className="text-orange-500">Waste</span> Collection Payments Effortlessly
              </h2>
              <p className="text-lg text-white/90 leading-relaxed">
                Track customer payments, manage debts, and streamline your waste collection business operations.
              </p>
            </div>
          </div>
        </div>
        </div>

        {/* Animated Features */}
        <div className="relative z-10">
        <div className="max-w-md space-y-6">
          <div className="animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-3 text-white/90">
              <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
              <p className="text-lg">Real-time payment tracking</p>
            </div>
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-3 text-white/90">
              <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
              <p className="text-lg">Automated debt management</p>
            </div>
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center gap-3 text-white/90">
              <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
              <p className="text-lg">Comprehensive customer insights</p>
            </div>
          </div>
          <div className="animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <div className="flex items-center gap-3 text-white/90">
              <div className="h-2 w-2 bg-white rounded-full animate-pulse"></div>
              <p className="text-lg">Secure & reliable platform</p>
            </div>
          </div>
        </div>
        </div>

        {/* Footer */}
        <div className="text-sm text-white/60 relative z-10">
          © 2025 BuyPower. All rights reserved.
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white relative overflow-hidden">
        {/* Decorative Trash Icon */}
        <div className="absolute -bottom-16 -right-16 opacity-[0.15]">
          <Trash2 className="w-96 h-96 text-gray-400" strokeWidth={1.5} />
        </div>

        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <Recycle className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-bold text-foreground">Collect</h1>
              <p className="text-xs text-muted-foreground">by BuyPower</p>
            </div>
          </div>

          {/* Auth Form Content */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
