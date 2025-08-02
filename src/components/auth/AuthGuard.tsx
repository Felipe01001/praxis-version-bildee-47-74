
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

interface AuthGuardProps {
  children: ReactNode;
  requireAuth?: boolean;
}

/**
 * AuthGuard - Component to protect routes based on authentication status
 * 
 * @param {ReactNode} children - The route component to render if authorized
 * @param {boolean} requireAuth - If true, redirects to login when not authenticated
 *                              - If false, redirects to home when authenticated
 */
const AuthGuard = ({ children, requireAuth = true }: AuthGuardProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // Show nothing while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-praxis-olive mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-2">Carregando...</p>
        </div>
      </div>
    );
  }

  // If route requires authentication and user is not logged in
  if (requireAuth && !user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // If route is for non-authenticated users (like login) but user is already logged in
  if (!requireAuth && user) {
    return <Navigate to="/" replace />;
  }

  // Render the protected component
  return <>{children}</>;
};

export default AuthGuard;
