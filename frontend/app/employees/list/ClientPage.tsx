'use client';
import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { AlertCircle, UserPlus, Edit, Trash2, Users, Loader2, UserCheck, Shield, Eye, EyeOff, Lock, XCircle, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { theme } from '@/components/common/theme';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/lib/rbac/auth-context';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = (props: any) => props.theme.colors.textDark;
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';

const CardShadow = `
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 1px 2px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px rgba(0, 0, 0, 0.02)
`;
const CardShadowHover = `
  0 8px 12px -2px rgba(0, 0, 0, 0.08),
  0 4px 6px -2px rgba(0, 0, 0, 0.04),
  inset 0 0 0 1px rgba(0, 0, 0, 0.03)
`;

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 980px;
  margin-left: auto;
  margin-right: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.sm} ${theme.spacing.sm};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.lg};
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
`;

const HeaderText = styled.div`
  h1 {
    font-size: clamp(24px, 3vw, 32px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.xs};
    color: ${TEXT_COLOR_DARK};
  }
  
  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.sm};
    margin: 0;
  }
`;

const MessageBox = styled.div<{ type: 'error' | 'success' }>`
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  gap: ${theme.spacing.sm};
  align-items: center;
  background-color: ${(p) => (p.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)')};
  border: 1px solid ${(p) => (p.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)')};
  color: ${(p) => (p.type === 'error' ? '#dc2626' : '#059669')};
  font-size: ${theme.typography.fontSizes.sm};
`;

const Card = styled.div`
  background: ${theme.colors.background};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  transition: box-shadow ${theme.transitions.default};

  &:hover {
    box-shadow: ${CardShadowHover};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing.xxl} ${theme.spacing.lg};
  
  svg {
    margin: 0 auto ${theme.spacing.md};
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.5;
  }
  
  p {
    color: ${TEXT_COLOR_MUTED};
    margin-bottom: ${theme.spacing.md};
    font-size: ${theme.typography.fontSizes.md};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
`;

const TableHeader = styled.thead`
  border-bottom: 2px solid ${theme.colors.border};
  background: ${theme.colors.backgroundSecondary};
  
  th {
    text-align: left;
    padding: ${theme.spacing.md} ${theme.spacing.lg};
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.xs};
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid ${theme.colors.border};
    transition: background-color ${theme.transitions.default};
    
    &:hover {
      background-color: ${theme.colors.backgroundSecondary};
    }
    
    &:last-child {
      border-bottom: none;
    }
    
    td {
      padding: ${theme.spacing.md} ${theme.spacing.lg};
      color: ${TEXT_COLOR_DARK};
      font-size: ${theme.typography.fontSizes.sm};
    }
  }
`;

const StatusBadge = styled.span<{ $active: boolean }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  background: ${(p) => (p.$active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)')};
  color: ${(p) => (p.$active ? '#065f46' : '#991b1b')};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};
  background: ${theme.colors.background};
`;

const PaginationActions = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  align-items: center;
`;

const PageInfo = styled.span`
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
  font-weight: ${theme.typography.fontWeights.medium};
`;

const PageButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${props => props.$active ? PRIMARY_COLOR : theme.colors.border};
  background: ${props => props.$active ? PRIMARY_COLOR : theme.colors.background};
  color: ${props => props.$active ? '#ffffff' : TEXT_COLOR_DARK(props)};
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  cursor: pointer;
  transition: all ${theme.transitions.default};

  &:hover:not(:disabled) {
    border-color: ${PRIMARY_COLOR};
    color: ${props => props.$active ? '#ffffff' : PRIMARY_COLOR};
    background: ${props => props.$active ? PRIMARY_COLOR : theme.colors.backgroundSecondary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: ${theme.spacing.md};
  
  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.md};
    margin: 0;
  }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${theme.colors.border};
  border-top-color: ${PRIMARY_COLOR};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.lg};
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease-out;

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${theme.spacing.lg};
  padding-bottom: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border};
  
  h3 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};
  }
  
  button {
    background: none;
    border: none;
    cursor: pointer;
    color: ${TEXT_COLOR_MUTED};
    padding: ${theme.spacing.xs};
    border-radius: ${theme.borderRadius.sm};
    transition: all ${theme.transitions.default};
    
    &:hover {
      background: ${theme.colors.backgroundSecondary};
      color: ${TEXT_COLOR_DARK};
    }
    
    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

const ModalTitle = styled.h3`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const WarningBox = styled.div`
  padding: ${theme.spacing.md};
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing.lg};
  
  p {
    margin: 0;
    color: #dc2626;
    font-size: ${theme.typography.fontSizes.sm};
    line-height: 1.5;
  }
`;

const FormGroup = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

const Label = styled.label`
  display: block;
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
  margin-bottom: ${theme.spacing.xs};
`;

const PasswordInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  
  input {
    width: 100%;
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    padding-right: 48px;
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.md};
    background: ${theme.colors.background};
    font-size: ${theme.typography.fontSizes.md};
    color: ${TEXT_COLOR_DARK};
    transition: all ${theme.transitions.default};
    
    &:focus {
      outline: none;
      border-color: ${PRIMARY_COLOR};
      box-shadow: 0 0 0 3px rgba(0, 170, 0, 0.1);
    }
    
    &::placeholder {
      color: ${TEXT_COLOR_MUTED};
      opacity: 0.5;
    }
    
    &:disabled {
      background-color: ${theme.colors.backgroundSecondary};
      color: ${TEXT_COLOR_MUTED};
      cursor: not-allowed;
      opacity: 0.7;
    }
  }
  
  button {
    position: absolute;
    right: ${theme.spacing.sm};
    background: none;
    border: none;
    cursor: pointer;
    color: ${TEXT_COLOR_MUTED};
    padding: ${theme.spacing.xs};
    border-radius: ${theme.borderRadius.sm};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all ${theme.transitions.default};
    
    &:hover {
      color: ${TEXT_COLOR_DARK};
      background: ${theme.colors.backgroundSecondary};
    }
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const ErrorText = styled.p`
  color: #dc2626;
  font-size: ${theme.typography.fontSizes.sm};
  margin: ${theme.spacing.xs} 0 0 0;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-top: ${theme.spacing.lg};
`;

const SearchContainer = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.lg};
  align-items: center;
`;

const SearchInputWrapper = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  
  input {
    width: 100%;
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    padding-left: 40px;
    padding-right: 40px;
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.md};
    background: ${theme.colors.background};
    font-size: ${theme.typography.fontSizes.md};
    color: ${TEXT_COLOR_DARK};
    transition: all ${theme.transitions.default};
    
    &:focus {
      outline: none;
      border-color: ${PRIMARY_COLOR};
      box-shadow: 0 0 0 3px rgba(0, 170, 0, 0.1);
    }
    
    &::placeholder {
      color: ${TEXT_COLOR_MUTED};
      opacity: 0.5;
    }
  }
  
  .search-icon {
    position: absolute;
    left: ${theme.spacing.sm};
    color: ${TEXT_COLOR_MUTED};
    width: 18px;
    height: 18px;
    pointer-events: none;
  }
  
  .clear-button {
    position: absolute;
    right: ${theme.spacing.sm};
    background: none;
    border: none;
    cursor: pointer;
    color: ${TEXT_COLOR_MUTED};
    padding: ${theme.spacing.xs};
    border-radius: ${theme.borderRadius.sm};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all ${theme.transitions.default};
    
    &:hover {
      color: ${TEXT_COLOR_DARK};
      background: ${theme.colors.backgroundSecondary};
    }
    
    svg {
      width: 16px;
      height: 16px;
    }
  }
`;

const SearchButton = styled(Button)`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const SearchResultsInfo = styled.div`
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
  margin-bottom: ${theme.spacing.md};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: ${theme.colors.backgroundSecondary};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
`;

const Badge = styled.span<{ $variant: 'admin' | 'finance_manager' | 'finance_admin' | 'accountant' | 'employee' | 'active' | 'inactive' | 'default' }>`
  display: inline-flex;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.bold};
  border-radius: 9999px;

  ${(p) => {
    switch (p.$variant) {
      case 'admin':
        return 'background-color: #f3e8ff; color: #6b21a8;';
      case 'finance_manager':
        return 'background-color: #dbeafe; color: #1e40af;';
      case 'finance_admin':
        return 'background-color: #dbeafe; color: #1e40af;';
      case 'accountant':
        return 'background-color: #dcfce7; color: #166534;';
      case 'employee':
        return 'background-color: #fed7aa; color: #9a3412;';
      case 'active':
        return 'background-color: #dcfce7; color: #166534;';
      case 'inactive':
        return 'background-color: #fee2e2; color: #991b1b;';
      default:
        return 'background-color: ${theme.colors.backgroundSecondary}; color: #374151;';
    }
  }}
`;

interface Employee {
  id: number;
  full_name: string;
  email: string;
  username: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  department: string | null;
  manager_id?: number | null;
}

interface ApiUser {
  id: number;
  full_name?: string | null;
  email?: string | null;
  username?: string | null;
  phone?: string | null;
  role?: string | null;
  is_active?: boolean;
  department?: string | null;
  manager_id?: number | null;
}

export default function EmployeeListPage() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [employeeToActivate, setEmployeeToActivate] = useState<Employee | null>(null);
  const [employeeToDeactivate, setEmployeeToDeactivate] = useState<Employee | null>(null);
  const [activatePassword, setActivatePassword] = useState('');
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [activatePasswordError, setActivatePasswordError] = useState<string | null>(null);
  const [deactivatePasswordError, setDeactivatePasswordError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchQuery]);

  const filterEmployees = () => {
    if (!searchQuery.trim()) {
      setFilteredEmployees(employees);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = employees.filter((employee) => {
      const fullName = (employee.full_name || '').toLowerCase();
      const email = (employee.email || '').toLowerCase();
      const username = (employee.username || '').toLowerCase();
      const phone = (employee.phone || '').toLowerCase();
      const department = (employee.department || '').toLowerCase();

      return (
        fullName.includes(query) ||
        email.includes(query) ||
        username.includes(query) ||
        phone.includes(query) ||
        department.includes(query)
      );
    });

    setFilteredEmployees(filtered);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleSearch = () => {
    filterEmployees();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredEmployees(employees);
    setCurrentPage(1);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const loadEmployees = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getUsers();
      const rawUsers: ApiUser[] = Array.isArray(response.data) ? response.data : [];
      const employeeUsers = rawUsers
        .filter((user) => (user.role || '').toLowerCase() === 'employee')
        .map((user): Employee => ({
          id: user.id,
          full_name: user.full_name || '',
          email: user.email || '',
          username: user.username || '',
          phone: user.phone || null,
          role: user.role || 'employee',
          is_active: user.is_active ?? true,
          department: user.department || null,
          manager_id: user.manager_id ?? null,
        }));
      setEmployees(employeeUsers);
    } catch (err: unknown) {
      const errorMessage =
        (err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) || 'Failed to load employees';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const verifyPassword = async (password: string): Promise<boolean> => {
    if (!user) return false;

    try {
      // Use login endpoint to verify password
      const identifier = user.email || '';
      await apiClient.request({
        method: 'POST',
        url: '/auth/login-json',
        data: {
          username: identifier,
          password: password
        }
      });
      return true;
    } catch (err: unknown) {
      // If login fails, password is incorrect
      return false;
    }
  };

  const handleDeleteClick = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setShowDeleteModal(true);
    setDeletePassword('');
    setDeletePasswordError(null);
    setShowDeletePassword(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletePassword('');
    setDeletePasswordError(null);
    setEmployeeToDelete(null);
    setShowDeletePassword(false);
  };

  const handleDelete = async () => {
    if (!employeeToDelete || !employeeToDelete.id) return;

    if (!deletePassword.trim()) {
      setDeletePasswordError('Password is required');
      return;
    }

    setVerifyingPassword(true);
    setDeletePasswordError(null);

    try {
      // First verify password
      const isValid = await verifyPassword(deletePassword.trim());

      if (!isValid) {
        setDeletePasswordError('Incorrect password. Please try again.');
        setVerifyingPassword(false);
        return;
      }

      // Password is correct, proceed with deletion
      setDeleting(true);
      await apiClient.deleteUser(employeeToDelete.id, deletePassword.trim());
      toast.success('Employee deleted successfully');
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
      setDeletePassword('');
      setShowDeletePassword(false);
      loadEmployees();
    } catch (err: unknown) {
      const errorMessage =
        (err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) || 'Failed to delete employee';
      setDeletePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
      setVerifyingPassword(false);
    }
  };

  const handleToggleActive = (employee: Employee) => {
    if (togglingId === employee.id) return;

    if (employee.is_active) {
      // Show deactivate modal
      setEmployeeToDeactivate(employee);
      setShowDeactivateModal(true);
      setDeactivatePassword('');
      setDeactivatePasswordError(null);
    } else {
      // Show activate modal
      setEmployeeToActivate(employee);
      setShowActivateModal(true);
      setActivatePassword('');
      setActivatePasswordError(null);
    }
  };

  const handleActivateCancel = () => {
    setShowActivateModal(false);
    setEmployeeToActivate(null);
    setActivatePassword('');
    setActivatePasswordError(null);
  };

  const handleDeactivateCancel = () => {
    setShowDeactivateModal(false);
    setEmployeeToDeactivate(null);
    setDeactivatePassword('');
    setDeactivatePasswordError(null);
  };

  const handleActivate = async () => {
    if (!employeeToActivate || !activatePassword.trim()) {
      setActivatePasswordError('Password is required');
      return;
    }

    setTogglingId(employeeToActivate.id);
    setActivatePasswordError(null);
    setError(null);

    try {
      await apiClient.activateUser(employeeToActivate.id, activatePassword.trim());
      toast.success(`${employeeToActivate.full_name} has been activated`);
      setShowActivateModal(false);
      setEmployeeToActivate(null);
      setActivatePassword('');
      await loadEmployees();
    } catch (err: unknown) {
      const errorMessage =
        (err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) || 'Failed to activate employee';
      setActivatePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeactivate = async () => {
    if (!employeeToDeactivate || !deactivatePassword.trim()) {
      setDeactivatePasswordError('Password is required');
      return;
    }

    setTogglingId(employeeToDeactivate.id);
    setDeactivatePasswordError(null);
    setError(null);

    try {
      await apiClient.deactivateUser(employeeToDeactivate.id, deactivatePassword.trim());
      toast.success(`${employeeToDeactivate.full_name} has been deactivated`);
      setShowDeactivateModal(false);
      setEmployeeToDeactivate(null);
      setDeactivatePassword('');
      await loadEmployees();
    } catch (err: unknown) {
      const errorMessage =
        (err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) || 'Failed to deactivate employee';
      setDeactivatePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setTogglingId(null);
    }
  };

  const getRoleBadgeVariant = (role: string): 'admin' | 'finance_manager' | 'finance_admin' | 'accountant' | 'employee' | 'default' => {
    const normalizedRole = (role || '').toLowerCase();
    switch (normalizedRole) {
      case 'admin':
        return 'admin';
      case 'finance_manager':
      case 'manager':
        return 'finance_manager';
      case 'finance_admin':
        return 'finance_admin';
      case 'accountant':
        return 'accountant';
      case 'employee':
        return 'employee';
      default:
        return 'default';
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      admin: 'Administrator',
      finance_manager: 'Finance Manager',
      manager: 'Manager',
      finance_admin: 'Finance Admin',
      accountant: 'Accountant',
      employee: 'Employee',
    };
    const normalizedRole = (role || '').toLowerCase();
    return roleNames[normalizedRole] || normalizedRole;
  };

  // Calculate pagination
  const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <LoadingContainer>
              <Spinner />
              <p>Loading employees...</p>
            </LoadingContainer>
          </ContentContainer>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <Header>
            <HeaderText>
              <h1>Employees</h1>
              <p>Manage employee accounts</p>
            </HeaderText>
            <Link href="/employees/create">
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Create Employee
              </Button>
            </Link>
          </Header>

          {error && (
            <MessageBox type="error">
              <AlertCircle size={18} />
              <span>{error}</span>
            </MessageBox>
          )}

          {!loading && employees.length > 0 && (
            <SearchContainer>
              <SearchInputWrapper>
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Search by name, email, username, phone, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="clear-button"
                    onClick={handleClearSearch}
                    title="Clear search"
                  >
                    <X />
                  </button>
                )}
              </SearchInputWrapper>
              <SearchButton onClick={handleSearch}>
                <Search size={16} />
                Search
              </SearchButton>
            </SearchContainer>
          )}

          {!loading && searchQuery && (
            <SearchResultsInfo>
              Showing {filteredEmployees.length} of {employees.length} employee{employees.length !== 1 ? 's' : ''}
              {searchQuery && ` matching "${searchQuery}"`}
            </SearchResultsInfo>
          )}

          <Card>
            {filteredEmployees.length === 0 && searchQuery ? (
              <EmptyState>
                <Users size={48} />
                <p>No employees found matching "{searchQuery}".</p>
                <Button
                  variant="outline"
                  onClick={handleClearSearch}
                  className="mt-4"
                >
                  Clear Search
                </Button>
              </EmptyState>
            ) : employees.length === 0 ? (
              <EmptyState>
                <Users size={48} />
                <p>No employees found.</p>
                <Link href="/employees/create">
                  <Button>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create First Employee
                  </Button>
                </Link>
              </EmptyState>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table>
                  <TableHeader>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Username</th>
                      <th>Phone</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {paginatedEmployees.map((employee) => (
                      <tr key={employee.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                            <Users size={16} style={{ color: theme.colors.mutedForeground }} />
                            <span style={{ fontWeight: theme.typography.fontWeights.medium, color: theme.colors.mutedForeground }}>
                              {employee.full_name || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td>{employee.email}</td>
                        <td>{employee.username}</td>
                        <td>{employee.phone || 'N/A'}</td>
                        <td>{employee.department || 'N/A'}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                            <StatusBadge $active={employee.is_active}>
                              {employee.is_active ? 'Active' : 'Inactive'}
                            </StatusBadge>
                            <Switch
                              checked={employee.is_active}
                              onCheckedChange={() => handleToggleActive(employee)}
                              disabled={togglingId === employee.id || deleting}
                              aria-label={`${employee.is_active ? 'Deactivate' : 'Activate'} ${employee.full_name}`}
                            />
                            {togglingId === employee.id && (
                              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: TEXT_COLOR_MUTED }} />
                            )}
                          </div>
                        </td>
                        <td>
                          <ActionButtons>
                            <Link href={`/employees/edit/${employee.id}`}>
                              <Button size="sm" variant="secondary">
                                <Edit size={14} className="h-4 w-4 mr-1" />
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteClick(employee)}
                              disabled={deleting}
                            >
                              {deleting && employeeToDelete?.id === employee.id ? (
                                <>
                                  <Loader2 size={16} className="h-4 w-4 mr-1 animate-spin" />
                                </>
                              ) : (
                                <Trash2 size={14} className="h-4 w-4 mr-1" />
                              )}
                            </Button>
                          </ActionButtons>
                        </td>
                      </tr>
                    ))}
                  </TableBody>
                </Table>

                {filteredEmployees.length > 0 && (
                  <PaginationContainer>
                    <PageInfo>
                      Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredEmployees.length)} of {filteredEmployees.length} employees
                    </PageInfo>
                    <PaginationActions>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(1)}
                        disabled={currentPage === 1}
                      >
                        First
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft size={16} />
                      </Button>

                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <PageButton
                            key={pageNum}
                            $active={currentPage === pageNum}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </PageButton>
                        );
                      })}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight size={16} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(totalPages)}
                        disabled={currentPage === totalPages}
                      >
                        Last
                      </Button>
                    </PaginationActions>
                  </PaginationContainer>
                )}
              </div>
            )}
          </Card>
        </ContentContainer>
      </PageContainer>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && employeeToDelete && (
        <ModalOverlay $isOpen={showDeleteModal} onClick={handleDeleteCancel}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <Trash2 size={20} style={{ color: '#ef4444' }} />
                Delete Employee
              </ModalTitle>
              <button onClick={handleDeleteCancel} title="Close" type="button">
                <XCircle />
              </button>
            </ModalHeader>

            <WarningBox>
              <p>
                <strong>Warning:</strong> This action cannot be undone. All data associated with this employee will be permanently deleted.
                Please enter <strong>your own password</strong> to verify this action.
              </p>
            </WarningBox>

            <div style={{
              background: theme.colors.backgroundSecondary,
              border: '1px solid ' + theme.colors.border,
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.lg,
              marginBottom: theme.spacing.lg
            }}>
              <h4 style={{
                fontSize: theme.typography.fontSizes.md,
                fontWeight: theme.typography.fontWeights.bold,
                color: theme.colors.mutedForeground,
                margin: `0 0 ${theme.spacing.md} 0`,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm
              }}>
                <Users size={18} />
                Employee Details to be Deleted
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.md, color: theme.colors.mutedForeground, fontWeight: theme.typography.fontWeights.medium }}>
                      {employeeToDelete.full_name || 'N/A'}
                    </span>
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.md, color: theme.colors.mutedForeground }}>
                      {employeeToDelete.email}
                    </span>
                  </div>
                </div>
                {(employeeToDelete.username || employeeToDelete.phone) && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap', paddingTop: theme.spacing.sm, borderTop: '1px solid ' + theme.colors.border }}>
                    {employeeToDelete.username && (
                      <div style={{ flex: '1 1 200px' }}>
                        <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: theme.colors.mutedForeground, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username</strong>
                        <span style={{ fontSize: theme.typography.fontSizes.sm, color: theme.colors.mutedForeground }}>
                          {employeeToDelete.username}
                        </span>
                      </div>
                    )}
                    {employeeToDelete.phone && (
                      <div style={{ flex: '1 1 200px' }}>
                        <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: theme.colors.mutedForeground, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</strong>
                        <span style={{ fontSize: theme.typography.fontSizes.sm, color: theme.colors.mutedForeground }}>
                          {employeeToDelete.phone}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, flexWrap: 'wrap', paddingTop: theme.spacing.sm, borderTop: '1px solid ' + theme.colors.border }}>
                  {employeeToDelete.department && (
                    <div>
                      <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: theme.colors.mutedForeground, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</strong>
                      <span style={{ fontSize: theme.typography.fontSizes.sm, color: theme.colors.mutedForeground }}>
                        {employeeToDelete.department}
                      </span>
                    </div>
                  )}
                  <div>
                    <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</strong>
                    <Badge $variant={getRoleBadgeVariant(employeeToDelete.role)}>
                      {getRoleDisplayName(employeeToDelete.role)}
                    </Badge>
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</strong>
                    <Badge $variant={employeeToDelete.is_active ? 'active' : 'inactive'}>
                      {employeeToDelete.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                {employeeToDelete.manager_id && (
                  <div style={{ paddingTop: theme.spacing.sm, borderTop: '1px solid ' + theme.colors.border }}>
                    <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: theme.colors.mutedForeground, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Manager ID</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.sm, color: theme.colors.mutedForeground }}>
                      {employeeToDelete.manager_id}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <FormGroup>
              <Label htmlFor="delete-password">
                <Lock size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                Enter <strong>your own password</strong> to confirm deletion of <strong>{employeeToDelete.full_name || 'this employee'}</strong>:
              </Label>
              <PasswordInputWrapper>
                <input
                  id="delete-password"
                  type={showDeletePassword ? 'text' : 'password'}
                  value={deletePassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setDeletePassword(e.target.value);
                    setDeletePasswordError(null);
                  }}
                  placeholder="Enter your password"
                  autoFocus
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' && deletePassword.trim() && !verifyingPassword && !deleting) {
                      handleDelete();
                    }
                  }}
                  disabled={verifyingPassword || deleting}
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                  title={showDeletePassword ? 'Hide password' : 'Show password'}
                  disabled={verifyingPassword || deleting}
                >
                  {showDeletePassword ? <EyeOff /> : <Eye />}
                </button>
              </PasswordInputWrapper>
              {deletePasswordError && (
                <ErrorText>{deletePasswordError}</ErrorText>
              )}
            </FormGroup>

            <ModalActions>
              <Button
                variant="outline"
                onClick={handleDeleteCancel}
                disabled={deleting || verifyingPassword}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={!deletePassword.trim() || deleting || verifyingPassword}
              >
                {verifyingPassword ? (
                  <>
                    <Loader2 size={16} style={{ marginRight: theme.spacing.sm }} className="animate-spin" />
                    Verifying...
                  </>
                ) : deleting ? (
                  <>
                    <Loader2 size={16} style={{ marginRight: theme.spacing.sm }} className="animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} style={{ marginRight: theme.spacing.sm }} />
                    Delete Employee
                  </>
                )}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Activate Confirmation Modal */}
      {showActivateModal && employeeToActivate && (
        <ModalOverlay $isOpen={showActivateModal} onClick={handleActivateCancel}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              <UserCheck size={20} style={{ color: '#16a34a' }} />
              Activate Employee
            </ModalTitle>

            <WarningBox style={{ background: 'rgba(22, 163, 74, 0.1)', borderColor: 'rgba(22, 163, 74, 0.3)' }}>
              <p style={{ color: '#16a34a' }}>
                <strong>Confirm Activation:</strong> This will restore access for <strong>{employeeToActivate.full_name}</strong>.
              </p>
            </WarningBox>

            <FormGroup>
              <Label htmlFor="activate-password">
                <Lock size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                Enter <strong>your own password</strong> to confirm activation of <strong>{employeeToActivate.full_name}</strong>:
              </Label>
              <PasswordInputWrapper>
                <input
                  id="activate-password"
                  type="password"
                  value={activatePassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setActivatePassword(e.target.value);
                    setActivatePasswordError(null);
                  }}
                  placeholder="Enter your password"
                  autoFocus
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' && activatePassword.trim()) {
                      handleActivate();
                    }
                  }}
                  disabled={togglingId === employeeToActivate.id}
                />
              </PasswordInputWrapper>
              {activatePasswordError && (
                <ErrorText>{activatePasswordError}</ErrorText>
              )}
            </FormGroup>

            <ModalActions>
              <Button
                variant="outline"
                onClick={handleActivateCancel}
                disabled={togglingId === employeeToActivate.id}
              >
                Cancel
              </Button>
              <Button
                onClick={handleActivate}
                disabled={!activatePassword.trim() || togglingId === employeeToActivate.id}
                style={{ backgroundColor: '#16a34a', color: 'white' }}
              >
                {togglingId === employeeToActivate.id ? (
                  <>
                    <Loader2 size={16} style={{ marginRight: theme.spacing.sm }} className="animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <UserCheck size={16} style={{ marginRight: theme.spacing.sm }} />
                    Activate Employee
                  </>
                )}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && employeeToDeactivate && (
        <ModalOverlay $isOpen={showDeactivateModal} onClick={handleDeactivateCancel}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              <Shield size={20} style={{ color: '#dc2626' }} />
              Deactivate Employee
            </ModalTitle>

            <WarningBox>
              <p>
                <strong>Warning:</strong> This will revoke access for <strong>{employeeToDeactivate.full_name}</strong>. They will not be able to log in until reactivated.
              </p>
            </WarningBox>

            <div style={{
              background: '#f9fafb',
              border: '1px solid #e5e7eb',
              borderRadius: theme.borderRadius.md,
              padding: theme.spacing.md,
              marginBottom: theme.spacing.lg
            }}>
              <h4 style={{
                fontSize: theme.typography.fontSizes.sm,
                fontWeight: theme.typography.fontWeights.bold,
                color: theme.colors.mutedForeground,
                margin: `0 0 ${theme.spacing.md} 0`
              }}>
                Employee Details to be Deactivated:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: theme.colors.mutedForeground }}>Name:</strong>
                  <span style={{ fontSize: theme.typography.fontSizes.sm, color: theme.colors.mutedForeground }}>
                    {employeeToDeactivate.full_name || 'N/A'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: theme.colors.mutedForeground }}>Email:</strong>
                  <span style={{ fontSize: theme.typography.fontSizes.sm, color: theme.colors.mutedForeground }}>
                    {employeeToDeactivate.email}
                  </span>
                </div>
                {employeeToDeactivate.username && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: theme.colors.mutedForeground }}>Username:</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.sm, color: theme.colors.mutedForeground }}>
                      {employeeToDeactivate.username}
                    </span>
                  </div>
                )}
                {employeeToDeactivate.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: theme.colors.mutedForeground }}>Phone:</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.sm, color: theme.colors.mutedForeground }}>
                      {employeeToDeactivate.phone}
                    </span>
                  </div>
                )}
                {employeeToDeactivate.department && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: theme.colors.mutedForeground }}>Department:</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.sm, color: theme.colors.mutedForeground }}>
                      {employeeToDeactivate.department}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: theme.colors.mutedForeground }}>Role:</strong>
                  <Badge $variant={getRoleBadgeVariant(employeeToDeactivate.role)}>
                    {getRoleDisplayName(employeeToDeactivate.role)}
                  </Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: theme.colors.mutedForeground }}>Status:</strong>
                  <Badge $variant={employeeToDeactivate.is_active ? 'active' : 'inactive'}>
                    {employeeToDeactivate.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {employeeToDeactivate.manager_id && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: theme.colors.mutedForeground }}>Manager ID:</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.sm, color: theme.colors.mutedForeground }}>
                      {employeeToDeactivate.manager_id}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <FormGroup>
              <Label htmlFor="deactivate-password">
                <Lock size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                Enter <strong>your own password</strong> to confirm deactivation of <strong>{employeeToDeactivate.full_name}</strong>:
              </Label>
              <PasswordInputWrapper>
                <input
                  id="deactivate-password"
                  type="password"
                  value={deactivatePassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                    setDeactivatePassword(e.target.value);
                    setDeactivatePasswordError(null);
                  }}
                  placeholder="Enter your password"
                  autoFocus
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter' && deactivatePassword.trim()) {
                      handleDeactivate();
                    }
                  }}
                  disabled={togglingId === employeeToDeactivate.id}
                />
              </PasswordInputWrapper>
              {deactivatePasswordError && (
                <ErrorText>{deactivatePasswordError}</ErrorText>
              )}
            </FormGroup>

            <ModalActions>
              <Button
                variant="outline"
                onClick={handleDeactivateCancel}
                disabled={togglingId === employeeToDeactivate.id}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeactivate}
                disabled={!deactivatePassword.trim() || togglingId === employeeToDeactivate.id}
              >
                {togglingId === employeeToDeactivate.id ? (
                  <>
                    <Loader2 size={16} style={{ marginRight: theme.spacing.sm }} className="animate-spin" />
                    Deactivating...
                  </>
                ) : (
                  <>
                    <Shield size={16} style={{ marginRight: theme.spacing.sm }} />
                    Deactivate Employee
                  </>
                )}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </Layout>
  );
}
