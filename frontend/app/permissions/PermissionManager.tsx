'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Save,
  Filter,
  Copy,
  Check,
  Loader2,
  Eye,
  Plus,
  Pencil,
  Trash2,
  ShieldAlert,
  Users,
  Search,
  RotateCcw,
  Download
} from 'lucide-react';
import { Resource, Action, UserType } from '@/lib/rbac/models';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell
} from '@/components/ui/table';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/rbac/auth-context';

// Styled components

const Container = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.backgroundSecondary};
  padding: ${theme.spacing.lg};
  font-family: ${props => props.theme.typography.fontFamily};
`;

const HeaderContainer = styled.div`
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  padding: ${theme.spacing.xl};
  margin: -${theme.spacing.lg} -${theme.spacing.lg} ${theme.spacing.xl};
  box-shadow: ${props => props.theme.shadows.sm};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  letter-spacing: normal;
  color: ${props => props.theme.colors.text};
`;

const Subtitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  margin-bottom: ${theme.spacing.md};
  color: ${props => props.theme.colors.text};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const Card = styled.div`
  background: ${props => props.theme.colors.card};
  border-radius: 8px;
  box-shadow: ${props => props.theme.shadows.sm};
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  border: 1px solid ${props => props.theme.colors.border};
  transition: transform 0.1s ease;

  &:hover {
    box-shadow: ${props => props.theme.shadows.md};
  }
`;

const SearchInput = styled.input`
  width: 85%;
  max-width: 400px;
  padding: 10px 16px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 999px; // Facebook style pill search
  font-size: 15px;
  transition: background-color 0.2s ease;
  background: ${props => props.theme.colors.backgroundSecondary};
  color: ${props => props.theme.colors.text};

  &:focus {
    outline: none;
    background: ${props => props.theme.colors.background};
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.primary}33;
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.lg};
  justify-content: flex-end;
  align-items: center;
  width: 100%;
  flex-wrap: wrap;
  padding-top: ${theme.spacing.lg};
  border-top: 1px solid ${props => props.theme.colors.border};
`;

const ConfirmOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${theme.spacing.lg};
  z-index: 100;
  animation: fadeIn 0.2s ease;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ConfirmDialog = styled.div`
  background: ${props => props.theme.colors.card};
  border-radius: ${theme.borderRadius.md};
  box-shadow: ${props => props.theme.shadows.md};
  padding: ${theme.spacing.xl} * 1.5;
  max-width: 800px;
  width: 100%;
  border: 1px solid ${props => props.theme.colors.border};
  transform-origin: center;
  animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);

  @keyframes scaleIn {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
`;

const ConfirmTitle = styled.h3`
  margin: 0 0 ${theme.spacing.lg};
  font-size: ${theme.typography.fontSizes.xxl};
  font-weight: 800;
  color: ${props => props.theme.colors.text};
  letter-spacing: -0.01em;
`;

const ConfirmBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
  max-height: 60vh;
  overflow-y: auto;
`;

const ConfirmFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.lg};
  flex-wrap: wrap;
`;

const PermissionChip = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  background: ${props => props.theme.colors.primary}15;
  color: ${props => props.theme.colors.text};
  font-size: ${theme.typography.fontSizes.xs};
  border: 1px solid ${props => props.theme.colors.primary}40;
`;

const SelectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.xl};
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
`;

const FilterContainer = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  align-items: center;
  flex-wrap: wrap;
  background: transparent;
  padding: 0;
  border-radius: 0;
  border: none;
  box-shadow: none;
`;

const Select = styled.select`
  padding: 8px 32px 8px 12px;
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 6px;
  font-size: 15px;
  background-color: ${props => props.theme.colors.backgroundSecondary};
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2365676B' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 14px;

  /* Adjust SVG color for dark mode via filter if needed, 
     or better, replace with a dynamic component. 
     For now, we just ensure the background contrasts well. */

  &:hover {
    background-color: ${props => props.theme.colors.background};
    border-color: ${props => props.theme.colors.textSecondary};
  }

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    background-color: ${props => props.theme.colors.background};
  }
`;

const FilterLabel = styled.label`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${props => props.theme.colors.text};
  
  svg {
    color: ${props => props.theme.colors.primary};
  }
`;

const TemplateContainer = styled.div`
  margin-top: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
  padding: ${theme.spacing.md};
  background: ${props => props.theme.colors.backgroundSecondary};
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.border};
`;

const TemplateControls = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.md};
  flex-wrap: wrap;
  align-items: center;
`;

const TemplateName = styled.input`
  padding: ${theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.sm};
  min-width: 250px;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}15;
  }
`;

const TemplateSelect = styled.select`
  padding: ${theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.sm};
  min-width: 250px;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.text};
  cursor: pointer;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}15;
  }
`;

const SuccessMessage = styled.div`
  color: ${props => props.theme.mode === 'dark' ? '#86efac' : '#059669'};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: ${theme.typography.fontSizes.sm};
  margin-top: ${theme.spacing.md};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: ${props => props.theme.mode === 'dark' ? 'rgba(22, 163, 74, 0.2)' : '#d1fae5'};
  border-radius: ${theme.borderRadius.sm};
  border: 1px solid ${props => props.theme.mode === 'dark' ? 'rgba(22, 163, 74, 0.5)' : '#6ee7b7'};
  animation: fadeIn 0.3s ease;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const ErrorMessage = styled.div`
  color: ${props => props.theme.mode === 'dark' ? '#fca5a5' : '#dc2626'};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: ${theme.typography.fontSizes.sm};
  padding: ${theme.spacing.md};
  background: ${props => props.theme.mode === 'dark' ? 'rgba(220, 38, 38, 0.2)' : '#fee2e2'};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${props => props.theme.mode === 'dark' ? 'rgba(220, 38, 38, 0.5)' : '#fecaca'};
  margin-bottom: ${theme.spacing.lg};
  animation: shake 0.4s ease;

  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-5px); }
    75% { transform: translateX(5px); }
  }
`;

const PaginationContainer = styled.div`
display: flex;
justify - content: space - between;
align - items: center;
margin - top: ${theme.spacing.lg};
padding - top: ${theme.spacing.lg};
border - top: 1px solid ${props => props.theme.colors.border};
flex - wrap: wrap;
gap: ${theme.spacing.md};
`;

const PageInfo = styled.div`
color: ${props => props.theme.colors.textSecondary};
font - size: 14px;
`;

const PageControls = styled.div`
display: flex;
gap: ${theme.spacing.xs};
`;

const PageButton = styled.button<{ $active?: boolean }>`
padding: 8px 12px;
border - radius: 6px;
border: 1px solid ${props => props.$active ? props.theme.colors.primary : props.theme.colors.border};
background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.card};
color: ${props => props.$active ? '#fff' : props.theme.colors.text};
font - size: 14px;
font - weight: 600;
cursor: pointer;
transition: all 0.2s ease;

  &: hover: not(: disabled) {
  background: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.backgroundSecondary};
}

  &:disabled {
  opacity: 0.5;
  cursor: not - allowed;
}
`;

const LoadingContainer = styled.div`
display: flex;
flex - direction: column;
align - items: center;
justify - content: center;
min - height: 60vh;
gap: ${theme.spacing.md};
`;

const Spinner = styled.div`
width: 32px;
height: 32px;
border: 3px solid ${props => props.theme.colors.backgroundSecondary};
border - top - color: ${props => props.theme.colors.primary};
border - radius: 50 %;
animation: spin 0.8s linear infinite;

@keyframes spin {
    to { transform: rotate(360deg); }
}
`;

const SkeletonRow = styled.div`
height: 48px;
width: 100 %;
background: ${props => props.theme.colors.backgroundSecondary};
margin - bottom: 2px;
position: relative;
overflow: hidden;

  &::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  transform: translateX(-100 %);
  background: linear - gradient(90deg, transparent 0, ${props => props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.4)'} 50 %, transparent 100 %);
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  100 % { transform: translateX(100 %); }
}
`;

const StatusBadge = styled.span<{ $active: boolean }>`
display: inline - flex;
align - items: center;
gap: 6px;
padding: 4px 12px;
border - radius: 4px;
font - size: 13px;
font - weight: 600;
background: ${props => props.$active
    ? (props.theme.mode === 'dark' ? 'rgba(22, 163, 74, 0.2)' : '#e7f3ff')
    : (props.theme.mode === 'dark' ? 'rgba(220, 38, 38, 0.2)' : '#ffe9e9')
  };
color: ${props => props.$active
    ? (props.theme.mode === 'dark' ? '#86efac' : props.theme.colors.primary)
    : (props.theme.mode === 'dark' ? '#fca5a5' : '#fa383e')
  };
border: 1px solid ${props => props.$active
    ? (props.theme.mode === 'dark' ? 'rgba(22, 163, 74, 0.5)' : 'transparent')
    : (props.theme.mode === 'dark' ? 'rgba(220, 38, 38, 0.5)' : 'transparent')
  };
`;

const UserTypeBadge = styled.span`
display: inline - block;
padding: 4px 8px;
border - radius: 4px;
font - size: 12px;
font - weight: 600;
background: ${props => props.theme.colors.backgroundSecondary};
color: ${props => props.theme.colors.textSecondary};
border: 1px solid ${props => props.theme.colors.border};
text - transform: capitalize;
`;

const TableWrapper = styled.div`
overflow - x: auto;
border - radius: 0;
border: none;
background: transparent;

  table {
  border - collapse: collapse;
  width: 100 %;
}

  th {
  background: ${props => props.theme.colors.background};
  font - weight: 600;
  color: ${props => props.theme.colors.textSecondary};
  text - transform: none;
  font - size: 14px;
  letter - spacing: normal;
  padding: 12px 16px;
  border - bottom: 1px solid ${props => props.theme.colors.border};
  text - align: left;
}

  td {
  padding: 12px 16px;
  border - bottom: 1px solid ${props => props.theme.colors.backgroundSecondary};
  vertical - align: middle;
  color: ${props => props.theme.colors.text};
}

tr:hover td {
  background - color: ${props => props.theme.colors.backgroundSecondary};
}
`;

const EmptyState = styled.div`
text - align: center;
padding: ${theme.spacing.xl} * 3 ${theme.spacing.xl};
color: ${props => props.theme.colors.textSecondary};
display: flex;
flex - direction: column;
align - items: center;
gap: ${theme.spacing.md};
  
  svg {
  opacity: 0.2;
  margin - bottom: ${theme.spacing.sm};
}
  
  p {
  font - size: ${theme.typography.fontSizes.lg};
  font - weight: 500;
}
`;

// Interfaces
interface PermissionItem {
  resource: Resource;
  actions: {
    [key in Action]?: boolean;
  };
}

interface UserPermissions {
  userId: string;
  userName: string;
  email: string;
  userType: UserType;
  permissions: PermissionItem[];
  isActive: boolean;
}

interface PermissionManagerProps {
  title: string;
  managedUserTypes: UserType[];
  adminType?: UserType;
}

interface RoleTemplate {
  id: string;
  name: string;
  userType: UserType;
  permissions: PermissionItem[];
}

type ApiUserLite = {
  id: string | number;
  full_name?: string;
  username?: string;
  email?: string;
  role?: string;
  is_active?: boolean;
};

type PermissionResponse = {
  permissions?: unknown;
};

// Ensure permissions are unique per resource and merged
const mergePermissionsByResource = (perms: PermissionItem[]): PermissionItem[] => {
  const merged = new Map<Resource, PermissionItem>();
  perms.forEach((perm) => {
    const existing = merged.get(perm.resource);
    if (existing) {
      merged.set(perm.resource, {
        resource: perm.resource,
        actions: {
          ...existing.actions,
          ...perm.actions,
        },
      });
    } else {
      merged.set(perm.resource, {
        resource: perm.resource,
        actions: { ...perm.actions },
      });
    }
  });
  return Array.from(merged.values());
};

const PermissionManager: React.FC<PermissionManagerProps> = ({
  title,
  managedUserTypes
}) => {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissions[]>([]);
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [templates, setTemplates] = useState<RoleTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [showSavedMessage, setShowSavedMessage] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmUser, setConfirmUser] = useState<UserPermissions | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Map backend role to frontend UserType
  const mapRoleToUserType = (role?: string): UserType => {
    const normalized = role?.toLowerCase() ?? '';
    if (normalized === 'admin') return UserType.ADMIN;
    if (normalized === 'manager' || normalized === 'finance_manager') return UserType.FINANCE_ADMIN;
    if (normalized === 'accountant') return UserType.ACCOUNTANT;
    return UserType.EMPLOYEE;
  };

  // Get default permissions based on user type
  const getDefaultPermissions = (userType: UserType): PermissionItem[] => {
    const defaultPerms: PermissionItem[] = [];

    // All users can view their profile
    defaultPerms.push({
      resource: Resource.PROFILE,
      actions: {
        [Action.READ]: true,
        [Action.UPDATE]: true,
      }
    });

    // Role-specific defaults
    switch (userType) {
      case UserType.ADMIN:
        // Admin gets all permissions
        Object.values(Resource).forEach(resource => {
          defaultPerms.push({
            resource,
            actions: {
              [Action.READ]: true,
              [Action.CREATE]: true,
              [Action.UPDATE]: true,
              [Action.DELETE]: true,
              [Action.MANAGE]: true,
            }
          });
        });
        break;
      case UserType.FINANCE_ADMIN:
        // Finance Manager gets financial and user management
        [Resource.USERS, Resource.REVENUES, Resource.EXPENSES, Resource.TRANSACTIONS, Resource.REPORTS].forEach(resource => {
          defaultPerms.push({
            resource,
            actions: {
              [Action.READ]: true,
              [Action.CREATE]: true,
              [Action.UPDATE]: true,
              [Action.DELETE]: false,
              [Action.MANAGE]: true,
            }
          });
        });
        break;
      case UserType.ACCOUNTANT:
        // Accountant gets read/write on financial data
        [Resource.REVENUES, Resource.EXPENSES, Resource.TRANSACTIONS, Resource.REPORTS].forEach(resource => {
          defaultPerms.push({
            resource,
            actions: {
              [Action.READ]: true,
              [Action.CREATE]: true,
              [Action.UPDATE]: true,
              [Action.DELETE]: false,
            }
          });
        });
        break;
      case UserType.EMPLOYEE:
        // Employee gets limited permissions
        [Resource.REVENUES, Resource.EXPENSES].forEach(resource => {
          defaultPerms.push({
            resource,
            actions: {
              [Action.READ]: true,
              [Action.CREATE]: true,
              [Action.UPDATE]: false,
              [Action.DELETE]: false,
            }
          });
        });
        break;
    }

    return defaultPerms;
  };

  const normalizePermissions = (raw: unknown): PermissionItem[] => {
    if (!Array.isArray(raw)) return [];
    return raw
      .filter((p): p is { resource: Resource; actions: Record<string, boolean> } => {
        return (
          typeof p === 'object' &&
          p !== null &&
          'resource' in p &&
          'actions' in p &&
          typeof (p as { resource?: unknown }).resource === 'string' &&
          typeof (p as { actions?: unknown }).actions === 'object'
        );
      })
      .map((p) => ({
        resource: (p.resource as Resource) || Resource.REPORTS,
        actions: { ...(p.actions as Record<string, boolean>) },
      }));
  };

  const loadUsers = useCallback(async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getUsers();
      const apiUsers = (response.data || []) as ApiUserLite[];

      // Load permissions from backend for each user
      const usersWithPermissions = await Promise.allSettled(
        apiUsers.map(async (apiUser) => {
          const userType = mapRoleToUserType(apiUser.role);

          // Try to load permissions from backend
          let permissions = getDefaultPermissions(userType);
          try {
            const permResponse = await apiClient.getUserPermissions(Number(apiUser.id));
            // If backend returns permissions and it's a non-empty array, use them
            // Empty array or null/undefined means use defaults
            const apiPerms = (permResponse.data as PermissionResponse | undefined)?.permissions;
            const normalized = normalizePermissions(apiPerms);
            if (normalized.length > 0) {
              permissions = normalized;
            }
          } catch (permErr: unknown) {
            // If 403 (forbidden) or 404 (not found), user doesn't have permissions set yet, use defaults
            // This is expected for new users or users without custom permissions
            if (
              typeof permErr === 'object' &&
              permErr !== null &&
              'response' in permErr &&
              typeof (permErr as { response?: { status?: number } }).response?.status === 'number' &&
              (((permErr as { response?: { status?: number } }).response?.status ?? 0) === 403 ||
                ((permErr as { response?: { status?: number } }).response?.status ?? 0) === 404)
            ) {
              // Use defaults, no error needed
            } else {
              // Other errors (network, server error, etc.) - log but continue with defaults
              console.warn(`Failed to load permissions for user ${apiUser.id}: `, permErr);
            }
          }

          return {
            userId: apiUser.id.toString(),
            userName: apiUser.full_name || apiUser.username || apiUser.email,
            email: apiUser.email,
            userType,
            isActive: apiUser.is_active ?? false,
            permissions: mergePermissionsByResource(permissions),
          };
        })
      );

      // Convert Promise.allSettled results to UserPermissions array
      const users: UserPermissions[] = usersWithPermissions
        .filter((result): result is PromiseFulfilledResult<UserPermissions> => result.status === 'fulfilled')
        .map(result => result.value);

      // Filter users based on managedUserTypes
      const filteredUsers = users.filter(user =>
        managedUserTypes.includes(user.userType)
      );

      setUserPermissions(filteredUsers);
      if (filteredUsers.length > 0 && !selectedUser) {
        setSelectedUser(filteredUsers[0].userId);
      }
    } catch (err: unknown) {
      const message =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : null;
      setError(message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [currentUser, managedUserTypes, selectedUser]);

  // Load users from API
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Handlers
  const handlePermissionChange = (
    userId: string,
    resource: Resource,
    action: Action,
    value: boolean
  ) => {
    setUserPermissions(prev =>
      prev.map(user => {
        if (user.userId === userId) {
          // Find the resource in the user's permissions
          const resourceIndex = user.permissions.findIndex(p => p.resource === resource);

          // If resource exists, update the action; otherwise add a new resource
          if (resourceIndex !== -1) {
            const updatedPermissions = [...user.permissions];
            updatedPermissions[resourceIndex] = {
              ...updatedPermissions[resourceIndex],
              actions: {
                ...updatedPermissions[resourceIndex].actions,
                [action]: value
              }
            };
            return { ...user, permissions: updatedPermissions };
          } else {
            // Create new resource with this action
            return {
              ...user,
              permissions: [
                ...user.permissions,
                {
                  resource,
                  actions: { [action]: value }
                }
              ]
            };
          }
        }
        return user;
      })
    );
  };

  const handleToggleAllForResource = (userId: string, resource: Resource, value: boolean) => {
    setUserPermissions(prev =>
      prev.map(user => {
        if (user.userId === userId) {
          // Find the resource in the user's permissions
          const resourceIndex = user.permissions.findIndex(p => p.resource === resource);

          // Create an object with all actions set to the specified value
          const allActions = {
            [Action.READ]: value,
            [Action.CREATE]: value,
            [Action.UPDATE]: value,
            [Action.DELETE]: value,
            [Action.MANAGE]: value
          };

          // If resource exists, update all actions; otherwise add a new resource
          if (resourceIndex !== -1) {
            const updatedPermissions = [...user.permissions];
            updatedPermissions[resourceIndex] = {
              ...updatedPermissions[resourceIndex],
              actions: allActions
            };
            return { ...user, permissions: updatedPermissions };
          } else {
            // Create new resource with all actions
            return {
              ...user,
              permissions: [
                ...user.permissions,
                {
                  resource,
                  actions: allActions
                }
              ]
            };
          }
        }
        return user;
      })
    );
  };

  const handleResetToDefaults = () => {
    if (!selectedUser) return;
    const user = userPermissions.find(u => u.userId === selectedUser);
    if (!user) return;

    const defaults = getDefaultPermissions(user.userType);
    setUserPermissions(prev => prev.map(u =>
      u.userId === selectedUser ? { ...u, permissions: mergePermissionsByResource(defaults) } : u
    ));
    setSuccess(`Permissions reset to default ${user.userType.replace(/_/g, ' ')} settings.Don't forget to save!`);
    setTimeout(() => setSuccess(null), 4000);
  };

  const areAllActionsSelected = (permissions: PermissionItem[], resource: Resource): boolean => {
    const resourcePermission = permissions.find(p => p.resource === resource);
    if (!resourcePermission) return false;

    // Check if all actions are true
    return Object.values(Action).every(action =>
      resourcePermission.actions[action] === true
    );
  };

  const handleSaveClick = () => {
    if (!selectedUser) return;
    const selectedUserData = userPermissions.find(u => u.userId === selectedUser);
    if (!selectedUserData) return;
    setConfirmUser(selectedUserData);
    setShowConfirm(true);
    setError(null);
    setSuccess(null);
  };

  const handleExport = () => {
    try {
      if (filteredUsers.length === 0) {
        setError('No users to export');
        return;
      }

      // Define columns to export
      const headers = [
        'Name',
        'Email',
        'User Type',
        'Status',
        'Permissions Summary'
      ];

      // Format data as CSV
      const csvRows = filteredUsers.map(user => {
        const userTypeLabel = user.userType.replace(/_/g, ' ');
        const statusLabel = user.isActive ? 'Active' : 'Inactive';

        // Summarize permissions
        const permissionSummary = user.permissions
          .map(perm => {
            const enabledActions = Object.entries(perm.actions || {})
              .filter(([, value]) => value === true)
              .map(([action]) => action.toLowerCase());

            if (enabledActions.length === 0) return null;

            const resourceLabel = perm.resource.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
            return `${resourceLabel}: ${enabledActions.join(', ')}`;
          })
          .filter(Boolean)
          .join('; ');

        return [
          `"${(user.userName || '').replace(/"/g, '""')}"`,
          `"${(user.email || '').replace(/"/g, '""')}"`,
          `"${userTypeLabel}"`,
          `"${statusLabel}"`,
          `"${permissionSummary.replace(/"/g, '""')}"`
        ].join(',');
      });

      const csvContent = [headers.join(','), ...csvRows].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];

      link.setAttribute('href', url);
      link.setAttribute('download', `permissions_export_${date}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setSuccess('Permissions exported successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export permissions');
    }
  };

  const executeSavePermissions = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const selectedUserData = userPermissions.find(u => u.userId === selectedUser);
      if (!selectedUserData) {
        throw new Error('Selected user not found');
      }

      const userId = parseInt(selectedUser, 10);
      if (isNaN(userId)) {
        throw new Error('Invalid user ID');
      }

      // Serialize permissions locally to JSON format required by backend
      const serializedPermissions = selectedUserData.permissions
        .filter(perm => Object.values(perm.actions).some(enabled => enabled))
        .map(perm => ({
          resource: perm.resource,
          actions: perm.actions
        }));

      // Type assertion needed because apiClient expects Record<string, unknown>[]
      await apiClient.updateUserPermissions(userId, serializedPermissions as unknown as Record<string, unknown>[]);

      setSuccess('Permissions saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
      setShowConfirm(false);
      setConfirmUser(null);
      // Refresh from backend to reflect real-time state
      await loadUsers();
    } catch (err: unknown) {
      const errorMessage =
        typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { detail?: string } }; message?: string }).response?.data?.detail ||
          (err as { message?: string }).message
          : err instanceof Error
            ? err.message
            : 'Failed to save permissions';
      setError(errorMessage || 'Failed to save permissions');
      console.error('Error saving permissions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load templates from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTemplates = localStorage.getItem('permission_templates');
      if (savedTemplates) {
        try {
          setTemplates(JSON.parse(savedTemplates));
        } catch (err) {
          console.error('Failed to load templates:', err);
        }
      }
    }
  }, []);

  // Template handlers
  const handleSaveTemplate = () => {
    if (!selectedUser || !newTemplateName.trim()) return;

    const userToTemplate = userPermissions.find(u => u.userId === selectedUser);
    if (!userToTemplate) return;

    // Check if template name already exists
    const templateExists = templates.some(t =>
      t.name.toLowerCase() === newTemplateName.trim().toLowerCase() &&
      t.userType === userToTemplate.userType
    );

    if (templateExists) {
      setError('Template with this name already exists for this user type');
      return;
    }

    const newTemplate: RoleTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplateName.trim(),
      userType: userToTemplate.userType,
      permissions: JSON.parse(JSON.stringify(userToTemplate.permissions))
    };

    const updatedTemplates = [...templates, newTemplate];
    setTemplates(updatedTemplates);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('permission_templates', JSON.stringify(updatedTemplates));
    }

    setNewTemplateName('');
    setError(null);

    // Show saved message
    setShowSavedMessage(true);

    // Clear previous timeout if it exists
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }

    // Hide message after 3 seconds
    messageTimeoutRef.current = setTimeout(() => {
      setShowSavedMessage(false);
    }, 3000);
  };

  const handleApplyTemplate = () => {
    if (!selectedUser || !selectedTemplate) return;

    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) {
      setError('Template not found');
      return;
    }

    setUserPermissions(prev =>
      prev.map(user => {
        if (user.userId === selectedUser) {
          return {
            ...user,
            permissions: mergePermissionsByResource(JSON.parse(JSON.stringify(template.permissions)))
          };
        }
        return user;
      })
    );

    setError(null);
    setSuccess('Template applied successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  // Get selected user data
  const selectedUserData = userPermissions.find(u => u.userId === selectedUser);

  // Get all available resources for checkboxes
  const allResources = Object.values(Resource);

  // Filter users by search term and user type
  const filteredUsers = userPermissions.filter(user => {
    const matchesSearch =
      user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = userTypeFilter === 'all' || user.userType === userTypeFilter;

    return matchesSearch && matchesType;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, userTypeFilter]);

  if (loading && userPermissions.length === 0) {
    return (
      <Container>
        <HeaderContainer>
          <Title>{title}</Title>
        </HeaderContainer>
        <LoadingContainer>
          <Spinner />
          <p>Loading users...</p>
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      <HeaderContainer>
        <Title>{title}</Title>
        <p style={{ marginTop: theme.spacing.sm, opacity: 0.9, fontSize: theme.typography.fontSizes.md }}>
          Manage user permissions and access controls
        </p>
      </HeaderContainer>

      {error && (
        <ErrorMessage>
          {error}
        </ErrorMessage>
      )}

      {success && (
        <SuccessMessage>
          <Check size={16} />
          {success}
        </SuccessMessage>
      )}

      <FilterContainer>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <SearchInput
            placeholder="Search team members by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '48px' }}
          />
        </div>

        <FilterLabel>
          <Filter size={16} />
          <Select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
          >
            <option value="all">All User Types</option>
            {managedUserTypes.map(type => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
              </option>
            ))}
          </Select>
        </FilterLabel>

        <Button
          variant="outline"
          onClick={handleExport}
          disabled={loading || filteredUsers.length === 0}
          style={{
            borderRadius: '999px',
            fontWeight: 600,
            borderColor: theme.colors.border,
            color: theme.colors.text,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: theme.colors.card
          }}
        >
          <Download size={16} />
          Export
        </Button>
      </FilterContainer>

      <Card>
        {loading && userPermissions.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {[1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)}
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState>
            <Search size={64} />
            <p>No results found for "{searchTerm}"</p>
            <span style={{ fontSize: '14px' }}>Try adjusting your search or filters</span>
          </EmptyState>
        ) : (
          <TableWrapper>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>Name</div></TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>User Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead style={{ textAlign: 'right' }}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers.map(user => (
                  <TableRow key={user.userId}>
                    <TableCell style={{ fontWeight: 600 }}>
                      {user.userName}
                    </TableCell>
                    <TableCell style={{ color: theme.colors.textSecondary }}>{user.email}</TableCell>
                    <TableCell>
                      <UserTypeBadge>
                        {user.userType.replace(/_/g, ' ')}
                      </UserTypeBadge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge $active={user.isActive}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </StatusBadge>
                    </TableCell>
                    <TableCell style={{ textAlign: 'right' }}>
                      <Button
                        size="sm"
                        variant={selectedUser === user.userId ? "default" : "secondary"}
                        onClick={() => setSelectedUser(user.userId)}
                        style={{
                          borderRadius: '6px',
                          fontWeight: 600,
                          backgroundColor: selectedUser === user.userId ? theme.colors.primary : theme.colors.backgroundSecondary,
                          color: selectedUser === user.userId ? '#FFFFFF' : theme.colors.text,
                          border: 'none'
                        }}
                      >
                        {selectedUser === user.userId ? (
                          'Editing'
                        ) : (
                          'Settings'
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableWrapper>

          {filteredUsers.length > itemsPerPage && (
          <PaginationContainer>
            <PageInfo>
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
            </PageInfo>
            <PageControls>
              <PageButton
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </PageButton>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <PageButton
                  key={page}
                  $active={page === currentPage}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </PageButton>
              ))}
              <PageButton
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </PageButton>
            </PageControls>
          </PaginationContainer>
        )}
      </>
        )}
    </Card>

      {
    selectedUserData && (
      <Card>
        <SelectionHeader>
          <Subtitle>
            Managing Permissions for {selectedUserData.userName} ({selectedUserData.userType})
          </Subtitle>
        </SelectionHeader>

        <TemplateContainer>
          <Subtitle>Permission Templates</Subtitle>
          <TemplateControls>
            <TemplateName
              placeholder="New template name..."
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
            />
            <Button
              variant="secondary"
              onClick={handleSaveTemplate}
              disabled={!newTemplateName.trim()}
            >
              <Copy size={16} />
              Save as Template
            </Button>

            <TemplateSelect
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              <option value="">Select template to apply...</option>
              {templates
                .filter(t => t.userType === selectedUserData.userType)
                .map(template => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))
              }
            </TemplateSelect>

            <Button
              variant="secondary"
              onClick={handleApplyTemplate}
              disabled={!selectedTemplate}
            >
              Apply Template
            </Button>
          </TemplateControls>

          {showSavedMessage && (
            <SuccessMessage>
              <Check size={16} />
              Template saved successfully
            </SuccessMessage>
          )}
        </TemplateContainer>
        <TableWrapper>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: '30%' }}>Resource</TableHead>
                <TableHead style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <Eye size={16} color="#6366f1" />
                    View
                  </div>
                </TableHead>
                <TableHead style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <Plus size={16} color="#10b981" />
                    Create
                  </div>
                </TableHead>
                <TableHead style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <Pencil size={16} color="#f59e0b" />
                    Edit
                  </div>
                </TableHead>
                <TableHead style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <Trash2 size={16} color="#ef4444" />
                    Delete
                  </div>
                </TableHead>
                <TableHead style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <ShieldAlert size={16} color="#8b5cf6" />
                    Manage All
                  </div>
                </TableHead>
                <TableHead style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <Check size={16} color={theme.colors.primary} />
                    Select All
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allResources.map(resource => {
                // Find if this user has permissions for this resource
                const resourcePermission = selectedUserData.permissions.find(
                  p => p.resource === resource
                );

                // Check if all permissions are selected
                const allSelected = areAllActionsSelected(selectedUserData.permissions, resource);

                return (
                  <TableRow key={resource} style={{
                    backgroundColor: allSelected ? `${theme.colors.primary}05` : 'transparent',
                    transition: 'background-color 0.2s ease'
                  }}>
                    <TableCell style={{ fontWeight: 600, color: theme.colors.text, fontSize: '14px' }}>
                      {resource.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      <Checkbox
                        checked={resourcePermission?.actions[Action.READ] || false}
                        onCheckedChange={(checked) => handlePermissionChange(
                          selectedUserData.userId,
                          resource,
                          Action.READ,
                          checked === true
                        )}
                      />
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      <Checkbox
                        checked={resourcePermission?.actions[Action.CREATE] || false}
                        onCheckedChange={(checked) => handlePermissionChange(
                          selectedUserData.userId,
                          resource,
                          Action.CREATE,
                          checked === true
                        )}
                      />
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      <Checkbox
                        checked={resourcePermission?.actions[Action.UPDATE] || false}
                        onCheckedChange={(checked) => handlePermissionChange(
                          selectedUserData.userId,
                          resource,
                          Action.UPDATE,
                          checked === true
                        )}
                      />
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      <Checkbox
                        checked={resourcePermission?.actions[Action.DELETE] || false}
                        onCheckedChange={(checked) => handlePermissionChange(
                          selectedUserData.userId,
                          resource,
                          Action.DELETE,
                          checked === true
                        )}
                      />
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      <Checkbox
                        checked={resourcePermission?.actions[Action.MANAGE] || false}
                        onCheckedChange={(checked) => handlePermissionChange(
                          selectedUserData.userId,
                          resource,
                          Action.MANAGE,
                          checked === true
                        )}
                      />
                    </TableCell>
                    <TableCell style={{ textAlign: 'center' }}>
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={(checked) => handleToggleAllForResource(
                          selectedUserData.userId,
                          resource,
                          checked === true
                        )}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableWrapper>

        <ButtonGroup>
          <div style={{ display: 'flex', gap: theme.spacing.md }}>
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedUser(null);
                setError(null);
                setSuccess(null);
              }}
              style={{ backgroundColor: theme.colors.backgroundSecondary, color: theme.colors.text, fontWeight: 600 }}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleResetToDefaults}
              style={{ borderColor: theme.colors.border, color: theme.colors.text, fontWeight: 600 }}
            >
              Reset to Defaults
            </Button>
          </div>
          <Button
            onClick={handleSaveClick}
            disabled={loading || !selectedUser}
            style={{ fontWeight: 600 }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" style={{ marginRight: theme.spacing.sm }} />
                Saving...
              </>
            ) : (
              'Save Permissions'
            )}
          </Button>
        </ButtonGroup>
      </Card>
    )
  }

  {
    showConfirm && confirmUser && (
      <ConfirmOverlay>
        <ConfirmDialog>
          <ConfirmTitle>Review permissions before saving</ConfirmTitle>
          <ConfirmBody>
            <div>
              <strong style={{ color: theme.colors.textSecondary, fontSize: '14px', marginRight: '8px' }}>User:</strong>
              <span style={{ fontWeight: 600, color: theme.colors.text }}>{confirmUser.userName}</span>
              <span style={{ color: theme.colors.textSecondary, fontSize: '14px', marginLeft: '4px' }}>({confirmUser.email})</span>
            </div>
            <div style={{ marginTop: '8px' }}>
              <strong style={{ color: theme.colors.textSecondary, fontSize: '14px', marginRight: '8px' }}>User Type:</strong>
              <UserTypeBadge>{confirmUser.userType.replace(/_/g, ' ')}</UserTypeBadge>
            </div>
            <div style={{ marginTop: '16px' }}>
              <strong style={{ color: theme.colors.text, fontSize: '16px' }}>Permissions Summary</strong>
              <div style={{
                marginTop: '12px',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                background: theme.colors.backgroundSecondary,
                padding: '20px',
                borderRadius: '12px',
                border: `1px solid ${theme.colors.border}`
              }}>
                {confirmUser.permissions.map((perm) => {
                  const enabledActions = Object.entries(perm.actions || {})
                    .filter(([, value]) => value === true)
                    .map(([action]) => action.toLowerCase());
                  return (
                    <PermissionChip key={perm.resource}>
                      {perm.resource.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}: {enabledActions.length > 0 ? enabledActions.join(', ') : 'No actions'}
                    </PermissionChip>
                  );
                })}
              </div>
            </div>
          </ConfirmBody>
          <ConfirmFooter>
            <Button
              variant="secondary"
              onClick={() => {
                setShowConfirm(false);
                setConfirmUser(null);
              }}
              disabled={loading}
            >
              Back
            </Button>
            <Button onClick={executeSavePermissions} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" style={{ marginRight: theme.spacing.sm }} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} style={{ marginRight: theme.spacing.sm }} />
                  Confirm & Save
                </>
              )}
            </Button>
          </ConfirmFooter>
        </ConfirmDialog>
      </ConfirmOverlay>
    )
  }
    </Container >
  );
};

export default PermissionManager; 