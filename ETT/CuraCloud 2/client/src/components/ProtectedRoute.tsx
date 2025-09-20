import { ReactNode, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/lib/auth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'patient' | 'doctor' | 'admin';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ['/api/me'],
    queryFn: getCurrentUser,
    retry: false
  });

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/');
    }
  }, [user, isLoading, setLocation]);

  // Check role if specified
  useEffect(() => {
    if (user && requiredRole && user.role !== requiredRole) {
      // Redirect to appropriate dashboard for user's role
      const redirectPath = user.role === 'doctor' ? '/doctor/overview' : user.role === 'admin' ? '/admin/overview' : '/dashboard/overview';
      setLocation(redirectPath);
    }
  }, [user, requiredRole, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth page
  }

  if (requiredRole && user.role !== requiredRole) {
    return null; // Will redirect to correct dashboard
  }

  return <>{children}</>;
}