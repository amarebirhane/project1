'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Resource, Action } from './models';
import { useRouter } from 'next/navigation';
import { roleService } from '../services/role-service';
import { authService } from '../services/auth-service';
import { Admin } from './user';

interface AuthContextType {
  user: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  hasPermission: (resource: Resource, action: Action) => boolean;
  hasUserPermission: (userId: string, resource: Resource, action: Action) => Promise<boolean>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<Admin | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check for existing auth in localStorage when component mounts
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
  
    try {
      const response = await authService.login(username, password);
  
      // Log auth context processing
      console.log('Auth Context Processing:', JSON.stringify({
        timestamp: new Date().toISOString(),
        authentication: {
          hasToken: !!response.access_token,
          tokenPreview: response.access_token ? `${response.access_token.substring(0, 15)}...` : '[MISSING]'
        },
        userData: {
          id: response.user?.id,
          username: response.user?.username,
          email: response.user?.email,
          userType: response.user?.userType,
          adminType: response.user?.adminType,
          isActive: response.user?.isActive
        }
      }, null, 2));
  
      // Ensure response contains user data
      if (!response || !response.user) {
        throw new Error('Unexpected response from server: User data is missing');
      }
  
      // Store token
      if (response.access_token) {
        localStorage.setItem('token', response.access_token);
      }
  
      // Create user object with required fields
      const userWithRoles = {
        id: response.user.id,
        username: response.user.username,
        email: response.user.email || null,
        name: response.user.firstName || response.user.lastName
          ? `${response.user.firstName || ''} ${response.user.lastName || ''}`.trim()
          : response.user.username,
        userType: response.user.userType || 'USER',
        adminType: response.user.adminType || null,
        roles: response.user.roles || [],
        permissions: response.user.permissions || {},
        isActive: response.user.isActive !== false
      };
  
      // Log final processed user data
      console.log('Processed User Data:', JSON.stringify({
        timestamp: new Date().toISOString(),
        user: {
          ...userWithRoles,
          token: '[REDACTED]'
        },
        status: {
          hasRoles: userWithRoles.roles.length > 0,
          hasPermissions: Object.keys(userWithRoles.permissions).length > 0,
          isActive: userWithRoles.isActive,
          adminType: userWithRoles.adminType
        }
      }, null, 2));
  
      // Check if account is active
      if (userWithRoles.isActive === false) {
        const message = `Account is inactive. Please contact your system administrator. (User: ${userWithRoles.username}, Type: ${userWithRoles.userType}, Admin Type: ${userWithRoles.adminType})`;
        setError(message);
        return false;
      }
  
      setUser(userWithRoles);
      localStorage.setItem('user', JSON.stringify(userWithRoles));
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
  
      // Log error in JSON format
      console.error('Auth Context Error:', JSON.stringify({
        timestamp: new Date().toISOString(),
        error: {
          message: errorMessage,
          type: err instanceof Error ? err.name : 'Unknown',
          details: err instanceof Error ? err.message : String(err)
        }
      }, null, 2));
  
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
        // First try to call the backend logout endpoint
        await fetch('http://localhost:3000/api/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            credentials: 'include'
        });
    } catch (error) {
        console.error('Logout error:', error);
        // Continue with local logout even if backend call fails
    } finally {
        // Clear all authentication data
    setUser(null);
        
        // Clear all localStorage items
    localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('authState');
        localStorage.removeItem('permissions');
        localStorage.removeItem('userRole');
        localStorage.removeItem('sessionData');
        
        // Clear any session storage
        sessionStorage.clear();
        
        // Clear any cookies
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        // Redirect to root path (where Login component is)
        router.push('/login');
    }
  };
  
  const hasPermission = (resource: Resource, action: Action): boolean => {
    if (!user) return false;

    return user.roles.some(role => 
      role.permissions.some(
        permission => permission.resource === resource && 
                     (permission.action === action || permission.action === Action.MANAGE)
      )
    );
  };
  
  const hasUserPermission = async (userId: string, resource: Resource, action: Action): Promise<boolean> => {
    // In a real app, you would make an API call to check permissions for any user
    // For demo purposes, we'll only check the current user
    if (!user) return false;
    if (user.id !== userId) return false;
    
    return hasPermission(resource, action);
  };
  
  const refreshUser = async (): Promise<void> => {
    if (!user) return;
    
    try {
      // In a real app, this would be an API call to get the latest user data
      // Here we're just refreshing the roles from our service
      const userTypeRoles = await roleService.getRolesByUserType(user.userType);
      
      // Combine existing roles with user type roles
      const combinedRoles = [...user.roles];
      
      // Add user type roles if they don't already exist
      for (const role of userTypeRoles) {
        if (!user.roles.some(r => r.id === role.id)) {
          combinedRoles.push(role);
        }
      }
      
      const refreshedUser = {
        ...user,
        roles: combinedRoles
      };
      
      setUser(refreshedUser);
      localStorage.setItem('user', JSON.stringify(refreshedUser));
    } catch (err) {
      console.error('Failed to refresh user data', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        logout,
        hasPermission,
        hasUserPermission,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 