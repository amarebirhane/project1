'use client';

import React, { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './auth-context';
import { useAuthorization } from './use-authorization';
import { Resource, Action, UserType } from './models';
import { TextLoading } from '@/components/common/LoadingComponents';

interface ProtectedRouteProps {
  children: ReactNode;
  resource: Resource;
  action: Action;
  fallback?: ReactNode;
  redirectTo?: string;
}

/**
 * Protected route component that checks if the user has the required permission
 * If not, it either redirects to a specified path or renders a fallback component
 */
export const ProtectedRoute = ({
  children,
  resource,
  action,
  fallback,
  redirectTo = '/unauthorized'
}: ProtectedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasPermission } = useAuthorization();
  const router = useRouter();

  // If auth is still loading, show a loading indicator
  if (isLoading) {
    return <TextLoading text="Authenticating..." />;
  }

  // If user is not authenticated, redirect to login
  if (!isAuthenticated) {
    router.push('/');
    return null;
  }

  // Check if user has the required permission
  const authorized = hasPermission(resource, action);
  
  if (!authorized) {
    // If fallback is provided, render it
    if (fallback) {
      return <>{fallback}</>;
    }

    // Otherwise redirect
    router.push(redirectTo);
    return null;
  }

  // User is authorized, render the children
  return <>{children}</>;
};

/**
 * A wrapper component that only allows specific roles
 */
interface RoleBasedRouteProps {
  children: ReactNode;
  roles: string[];
  fallback?: ReactNode;
  redirectTo?: string;
}

export const RoleBasedRoute = ({
  children,
  roles,
  fallback,
  redirectTo = '/unauthorized'
}: RoleBasedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasRole } = useAuthorization();
  const router = useRouter();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    router.push('/');
    return null;
  }

  // Check if user has any of the required roles
  const authorized = roles.some(role => hasRole(role));
  
  if (!authorized) {
    if (fallback) {
      return <>{fallback}</>;
    }
    router.push(redirectTo);
    return null;
  }

  return <>{children}</>;
};

/**
 * A wrapper component that only allows specific user types
 */
interface UserTypeBasedRouteProps {
  children: ReactNode;
  userTypes: UserType[];
  fallback?: ReactNode;
  redirectTo?: string;
}

export const UserTypeBasedRoute = ({
  children,
  userTypes,
  fallback,
  redirectTo = '/unauthorized'
}: UserTypeBasedRouteProps) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasUserType } = useAuthorization();
  const router = useRouter();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    router.push('/');
    return null;
  }

  // Check if user has any of the required user types
  const authorized = userTypes.some(type => hasUserType(type));
  
  if (!authorized) {
    if (fallback) {
      return <>{fallback}</>;
    }
    router.push(redirectTo);
    return null;
  }

  return <>{children}</>;
}; 