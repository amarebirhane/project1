import { useAuth } from './auth-context';
import { Resource, Action, UserType } from './models';

interface AuthorizationHook {
  hasPermission: (resource: Resource, action: Action) => boolean;
  hasUserPermission: (userId: string, resource: Resource, action: Action) => Promise<boolean>;
  isAdmin: () => boolean;
  isAccountant: () => boolean;
  isEmpoyee: () => boolean;
  hasRole: (roleName: string) => boolean;
  hasUserType: (userType: UserType) => boolean;
  isFinanceAdmin: () => boolean;
  refreshUser: () => Promise<void>;
}

/**
 * Custom hook to check permissions and roles
 */
export const useAuthorization = (): AuthorizationHook => {
  const { user, hasPermission, hasUserPermission, refreshUser } = useAuth();

  /**
   * Check if the user is an administrator
   */
  const isAdmin = (): boolean => {
    if (!user) return false;
    return user.roles.some(role => role.name === 'ADMIN') || 
           user.userType === UserType.ADMIN || 
           user.userType === UserType.FINANCE_ADMIN;
  };

  /**
   * Check if the user is an insurance administrator
   */
  const isInsuranceAdmin = (): boolean => {
    if (!user) return false;
    return user.userType === UserType.FINANCE_ADMIN;
  };


  /**
   * Check if the user has a specific role
   */
  const hasRole = (roleName: string): boolean => {
    if (!user) return false;
    return user.roles.some(role => role.name === roleName);
  };

  /**
   * Check if the user has a specific user type
   */
  const hasUserType = (userType: UserType): boolean => {
    if (!user) return false;
    return user.userType === userType;
  };

  return {
    hasPermission,
    hasUserPermission,
    isAdmin,
    hasRole,
    hasUserType,
    refreshUser
  };
}; 