import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute = ({ children, allowedRoles = ['psp'] }: ProtectedRouteProps) => {
  const { isAuthenticated, isTemporaryPassword, isLoading, user } = useAuth();

  console.log('[ProtectedRoute] State:', { isLoading, isAuthenticated, isTemporaryPassword, userRole: user?.role });

  // Wait for auth state to load from localStorage
  if (isLoading) {
    console.log('[ProtectedRoute] Still loading, showing spinner...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('[ProtectedRoute] Not authenticated, redirecting to login');
    // Redirect to login if not authenticated
    return <Navigate to="/" replace />;
  }

  if (isTemporaryPassword) {
    console.log('[ProtectedRoute] Temporary password, redirecting to change password');
    // Redirect to change password if using temporary password
    return <Navigate to="/change-password" replace />;
  }

  // Check if user has required role
  if (user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.log('[ProtectedRoute] User role not authorized:', user.role, 'Allowed roles:', allowedRoles);
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="mb-4">
            <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">
            You don't have permission to access this page. This dashboard is only accessible to PSP users.
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  console.log('[ProtectedRoute] Authenticated and authorized, rendering protected content');
  return <>{children}</>;
};
