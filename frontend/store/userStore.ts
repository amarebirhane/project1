'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient, { type ApiUser } from '@/lib/api';
export interface StoreUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'finance_manager' | 'accountant' | 'employee';
  department?: string;
  isActive: boolean;
  createdAt?: string;
  managerId?: string;
  phone?: string | null;
  profileImageUrl?: string;
}

// Map API User to StoreUser
const normalizeInboundRole = (role?: string): StoreUser['role'] => {
  const normalized = role?.toLowerCase();
  switch (normalized) {
    case 'admin':
    case 'super_admin':
      return 'admin';
    case 'manager':
    case 'finance_manager':
      return 'finance_manager';
    case 'accountant':
      return 'accountant';
    case 'employee':
    default:
      return 'employee';
  }
};

const mapToStoreUser = (apiUser: ApiUser): StoreUser => ({
  id: apiUser.id.toString(),
  name: apiUser.full_name || apiUser.username || apiUser.email,
  email: apiUser.email,
  role: normalizeInboundRole(apiUser.role),
  department: apiUser.department,
  isActive: apiUser.is_active || false,
  createdAt: apiUser.created_at,
  managerId: apiUser.manager_id !== undefined && apiUser.manager_id !== null ? apiUser.manager_id.toString() : undefined,
  phone: apiUser.phone,
  profileImageUrl: apiUser.profile_image_url,
});

// Map back if needed (for API calls)
const normalizeOutboundRole = (role?: StoreUser['role']): string | undefined => {
  switch (role) {
    case 'finance_manager':
      return 'manager';
    case 'admin':
      return 'admin';
    case 'accountant':
      return 'accountant';
    case 'employee':
      return 'employee';
    default:
      return undefined;
  }
};

const mapToApiUser = (userLike: Partial<StoreUser> | UserInput): Partial<ApiUser> => {
  const managerIdValue = (userLike as { managerId?: string | number }).managerId;
  return {
    full_name: userLike.name,
    email: userLike.email,
    role: normalizeOutboundRole(userLike.role as StoreUser['role'] | undefined),
    department: userLike.department,
    is_active: userLike.isActive,
    manager_id:
      managerIdValue !== undefined
        ? typeof managerIdValue === 'string'
          ? parseInt(managerIdValue, 10)
          : managerIdValue
        : undefined,
  };
};

type ErrorDetail = {
  response?: {
    data?: {
      detail?: string;
      error?: string;
    };
  };
};

const extractErrorMessage = (error: unknown): string => {
  if (typeof error === 'object' && error !== null) {
    const err = error as ErrorDetail;
    const detail = err.response?.data?.detail ?? err.response?.data?.error;
    if (detail) return detail;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
};

export type UserInput = Omit<Partial<StoreUser>, 'id' | 'managerId'> &
{
  id?: string | number;
  managerId?: string | number;
} & Record<string, unknown>;

const toApiPayload = (userData: UserInput): Partial<ApiUser> => {
  const apiBasics = mapToApiUser(userData);
  return {
    ...apiBasics,
    ...(userData.id !== undefined ? { id: typeof userData.id === 'string' ? parseInt(userData.id, 10) : userData.id } : {}),
    ...(userData.managerId !== undefined
      ? { manager_id: typeof userData.managerId === 'string' ? parseInt(userData.managerId, 10) : userData.managerId }
      : {}),
  };
};

interface UserState {
  // User data
  user: StoreUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Subordinates
  subordinates: StoreUser[];
  allUsers: StoreUser[];

  // Actions
  login: (email: string, password: string, totpCode?: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: UserInput) => Promise<void>;
  getCurrentUser: () => Promise<void>;
  fetchSubordinates: () => Promise<void>;
  fetchAllUsers: () => Promise<void>;
  createUser: (userData: UserInput) => Promise<void>;
  updateUser: (userId: string, userData: UserInput) => Promise<void>;
  deleteUser: (userId: string, password: string) => Promise<void>;
  clearError: () => void;

  // Permission checks
  canManageUsers: () => boolean;
  canViewAllData: () => boolean;
  canApproveTransactions: () => boolean;
  canSubmitTransactions: () => boolean;
  getAccessibleRoutes: () => string[];
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      subordinates: [],
      allUsers: [],

      // Auth actions
      login: async (identifier: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.login(identifier, password);
          // Verify response has user data before setting authentication
          if (!response.data || !response.data.user) {
            throw new Error('Invalid login response: missing user data');
          }

          const mappedUser = mapToStoreUser(response.data.user);

          set({
            user: mappedUser,
            isAuthenticated: true,
            error: null,
          });
        } catch (error: unknown) {
          // Clear any stored tokens on login failure
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
          }
          const detail = extractErrorMessage(error);
          set({
            user: null,
            error: detail || 'Login failed',
            isAuthenticated: false
          });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await apiClient.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            isAuthenticated: false,
            subordinates: [],
            allUsers: [],
            isLoading: false,
            error: null,
          });
        }
      },

      register: async (userData: UserInput) => {
        set({ isLoading: true, error: null });
        try {
          const payload = toApiPayload(userData);
          await apiClient.register(payload);
        } catch (error: unknown) {
          const detail = extractErrorMessage(error);
          set({ error: detail || 'Registration failed' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      getCurrentUser: async () => {
        set({ isLoading: true, error: null });
        try {
          const response = await apiClient.getCurrentUser();
          const mappedUser = mapToStoreUser(response.data);
          set({
            user: mappedUser,
            isAuthenticated: true,
            error: null,
          });
        } catch (error: unknown) {
          set({
            user: null,
            isAuthenticated: false,
            error: extractErrorMessage(error) || 'Failed to get user data'
          });
        } finally {
          set({ isLoading: false });
        }
      },

      // User management actions
      fetchSubordinates: async () => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true });
        try {
          const response = await apiClient.getSubordinates(parseInt(user.id, 10));
          const mappedSubs = response.data.map(mapToStoreUser);
          set({ subordinates: mappedSubs });
        } catch (error: unknown) {
          set({ error: extractErrorMessage(error) || 'Failed to fetch subordinates' });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchAllUsers: async () => {
        set({ isLoading: true });
        try {
          const response = await apiClient.getUsers();
          const mappedUsers = response.data.map(mapToStoreUser);
          set({ allUsers: mappedUsers });
        } catch (error: unknown) {
          set({ error: extractErrorMessage(error) || 'Failed to fetch users' });
        } finally {
          set({ isLoading: false });
        }
      },

      createUser: async (userData: UserInput) => {
        set({ isLoading: true, error: null });
        try {
          const payload = toApiPayload(userData);
          const response = await apiClient.createUser(payload);
          const mappedUser = mapToStoreUser(response.data);
          set(state => ({
            allUsers: [...state.allUsers, mappedUser]
          }));
        } catch (error: unknown) {
          set({ error: extractErrorMessage(error) || 'Failed to create user' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      updateUser: async (userId: string, userData: UserInput) => {
        set({ isLoading: true, error: null });
        try {
          // Map userData to API format if needed
          const apiUserData = toApiPayload(userData);
          const response = await apiClient.updateUser(parseInt(userId, 10), apiUserData);
          const mappedUser = mapToStoreUser(response.data);
          set(state => ({
            allUsers: state.allUsers.map(u => u.id === userId ? mappedUser : u),
            subordinates: state.subordinates.map(u => u.id === userId ? mappedUser : u),
            user: state.user?.id === userId ? mappedUser : state.user
          }));
        } catch (error: unknown) {
          set({ error: extractErrorMessage(error) || 'Failed to update user' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      deleteUser: async (userId: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          await apiClient.deleteUser(parseInt(userId, 10), password);
          set(state => ({
            allUsers: state.allUsers.filter(u => u.id !== userId),
            subordinates: state.subordinates.filter(u => u.id !== userId)
          }));
        } catch (error: unknown) {
          set({ error: extractErrorMessage(error) || 'Failed to delete user' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },

      clearError: () => set({ error: null }),

      // Permission checks
      canManageUsers: () => {
        const { user } = get();
        return user?.role === 'admin' || user?.role === 'finance_manager';
      },

      canViewAllData: () => {
        const { user } = get();
        return user?.role === 'admin';
      },

      canApproveTransactions: () => {
        const { user } = get();
        if (!user) return false;
        // Allow admin, finance_manager, and manager roles to approve
        const role = user.role?.toLowerCase();
        return role === 'admin' || role === 'super_admin' || role === 'finance_manager' || role === 'manager';
      },

      canSubmitTransactions: () => {
        const { user } = get();
        return user?.role === 'accountant' || user?.role === 'employee';
      },

      getAccessibleRoutes: () => {
        const { user } = get();
        if (!user) return ['/auth/login', '/auth/register'];

        const baseRoutes = ['/dashboard', '/revenue', '/expenses', '/reports', '/notifications'];

        switch (user.role) {
          case 'admin':
            return [...baseRoutes, '/users', '/admin', '/approvals'];
          case 'finance_manager':
            return [...baseRoutes, '/users', '/approvals'];
          case 'accountant':
            return [...baseRoutes];
          case 'employee':
            return ['/dashboard', '/revenue', '/expenses', '/notifications'];
          default:
            return [];
        }
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useUserStore;