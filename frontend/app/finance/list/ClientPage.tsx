'use client';

import { useState, useEffect } from 'react';
import styled from 'styled-components';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

import apiClient from '@/lib/api';
import Layout from '@/components/layout';
import { theme } from '@/components/common/theme';
import { useAuth } from '@/lib/rbac/auth-context';
AlertCircle,
  UserPlus,
  Edit,
  Trash2,
  Briefcase,
  Search,
  Loader2,
  UserCheck,
  Shield,
  Eye,
  EyeOff,
  Lock,
  XCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import { toast } from 'sonner';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = theme.colors.textDark || '#000000';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';

const CardShadow = `
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 1px 2px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px rgba(0, 0, 0, 0.02)
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

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: #ffffff;
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: ${theme.borderRadius.md};
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  
  h1 {
    font-size: clamp(24px, 3vw, 36px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.xs};
    color: #ffffff;
  }
  
  p {
    font-size: ${theme.typography.fontSizes.md};
    font-weight: ${theme.typography.fontWeights.medium};
    opacity: 0.9;
    margin: 0;
    color: rgba(255, 255, 255, 0.95);
  }
`;

const HeaderContent = styled.div`
  flex: 1;
`;

const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  background-color: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: ${theme.borderRadius.md};
  color: #dc2626;
  font-size: ${theme.typography.fontSizes.sm};

  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: ${theme.spacing.lg};

  svg {
    position: absolute;
    left: ${theme.spacing.md};
    top: 50%;
    transform: translateY(-50%);
    width: 18px;
    height: 18px;
    color: ${TEXT_COLOR_MUTED};
    pointer-events: none;
  }
`;

const SearchInput = styled.input`
  width: 70%;
  padding: ${theme.spacing.sm} ${theme.spacing.md} ${theme.spacing.sm} 40px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background};
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_DARK};
  transition: all ${theme.transitions.default};

  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
  }

  &::placeholder {
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.6;
  }
`;

const TableContainer = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  overflow: hidden;
`;

const EmptyState = styled.div`
  padding: ${theme.spacing.xxl};
  text-align: center;
  color: ${TEXT_COLOR_MUTED};

  svg {
    width: 48px;
    height: 48px;
    margin: 0 auto ${theme.spacing.md};
    opacity: 0.5;
    color: ${TEXT_COLOR_MUTED};
  }

  p {
    font-size: ${theme.typography.fontSizes.md};
    margin: 0;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
`;

const TableHeader = styled.thead`
  background: ${theme.colors.backgroundSecondary};
  border-bottom: 2px solid ${theme.colors.border};
  
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
  background: ${props => props.$active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)'};
  color: ${props => props.$active ? '#065f46' : '#991b1b'};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  align-items: center;
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
  color: ${props => props.$active ? '#ffffff' : TEXT_COLOR_DARK};
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

const AddButton = styled(Button)`
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #ffffff;
  backdrop-filter: blur(8px);
  transition: all ${theme.transitions.default};

  &:hover {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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

interface FinanceManager {
  id: number;
  full_name?: string | null;
  email: string;
  username?: string | null;
  phone?: string | null;
  role: string;
  is_active: boolean;
  department?: string | null;
}

interface ApiUser {
  id: number;
  full_name?: string | null;
  email: string;
  username?: string | null;
  phone?: string | null;
  role?: string | null;
  is_active?: boolean;
  department?: string | null;
}

const toFinanceManager = (user: ApiUser): FinanceManager => ({
  id: user.id,
  full_name: user.full_name ?? null,
  email: user.email,
  username: user.username ?? null,
  phone: user.phone ?? null,
  role: user.role ?? 'employee',
  is_active: user.is_active ?? false,
  department: user.department ?? null
});

export default function FinanceListPage() {
  const { user } = useAuth();
  const [financeManagers, setFinanceManagers] = useState<FinanceManager[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [managerToDelete, setManagerToDelete] = useState<FinanceManager | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [managerToActivate, setManagerToActivate] = useState<FinanceManager | null>(null);
  const [managerToDeactivate, setManagerToDeactivate] = useState<FinanceManager | null>(null);
  const [activatePassword, setActivatePassword] = useState('');
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [activatePasswordError, setActivatePasswordError] = useState<string | null>(null);
  const [deactivatePasswordError, setDeactivatePasswordError] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadFinanceManagers();
  }, []);

  const loadFinanceManagers = async () => {
    try {
      setLoading(true);

      const response = await apiClient.getUsers();

      const users: ApiUser[] = Array.isArray(response.data) ? response.data : [];
      const managers = users
        .filter((user) => ['manager', 'finance_manager'].includes((user.role || '').toLowerCase()))
        .map(toFinanceManager);

      setFinanceManagers(managers);
    } catch (err: unknown) {
      console.error('Error loading finance managers:', err);
      let message = 'Failed to load finance managers';

      if (err && typeof err === 'object' && 'response' in err) {
        const response = (err as { response?: { status?: number; data?: { detail?: string; message?: string } } }).response;
        if (response?.status === 404) {
          message = 'Users endpoint not found. Please check API configuration.';
        } else if (response?.status === 403) {
          message = 'You do not have permission to view users. Only managers and admins can access this page.';
        } else {
          message = response?.data?.detail || response?.data?.message || message;
        }
      } else if (err instanceof Error && err.message) {
        message = err.message;
      }

      setError(message);
      toast.error(message);
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

  const handleDeleteClick = (manager: FinanceManager) => {
    setManagerToDelete(manager);
    setShowDeleteModal(true);
    setDeletePassword('');
    setDeletePasswordError(null);
    setShowDeletePassword(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletePassword('');
    setDeletePasswordError(null);
    setManagerToDelete(null);
    setShowDeletePassword(false);
  };

  const handleDelete = async () => {
    if (!managerToDelete || !managerToDelete.id) return;

    if (!deletePassword.trim()) {
      setDeletePasswordError('Password is required');
      return;
    }

    setVerifyingPassword(true);
    setDeletePasswordError(null);
    setError(null);

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
      await apiClient.deleteUser(managerToDelete.id, deletePassword.trim());
      toast.success('Finance manager deleted successfully');
      setShowDeleteModal(false);
      setManagerToDelete(null);
      setDeletePassword('');
      setShowDeletePassword(false);
      loadFinanceManagers();
    } catch (err: unknown) {
      const errorMessage =
        (err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) || 'Failed to delete finance manager';
      setDeletePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
      setVerifyingPassword(false);
    }
  };

  const handleToggleActive = (manager: FinanceManager) => {
    if (togglingId === manager.id) return;

    if (manager.is_active) {
      // Show deactivate modal
      setManagerToDeactivate(manager);
      setShowDeactivateModal(true);
      setDeactivatePassword('');
      setDeactivatePasswordError(null);
    } else {
      // Show activate modal
      setManagerToActivate(manager);
      setShowActivateModal(true);
      setActivatePassword('');
      setActivatePasswordError(null);
    }
  };

  const handleActivateCancel = () => {
    setShowActivateModal(false);
    setManagerToActivate(null);
    setActivatePassword('');
    setActivatePasswordError(null);
  };

  const handleDeactivateCancel = () => {
    setShowDeactivateModal(false);
    setManagerToDeactivate(null);
    setDeactivatePassword('');
    setDeactivatePasswordError(null);
  };

  const handleActivate = async () => {
    if (!managerToActivate || !activatePassword.trim()) {
      setActivatePasswordError('Password is required');
      return;
    }

    setTogglingId(managerToActivate.id);
    setActivatePasswordError(null);
    setError(null);

    try {
      await apiClient.activateUser(managerToActivate.id, activatePassword.trim());
      toast.success(`${managerToActivate.full_name || managerToActivate.email} has been activated`);
      setShowActivateModal(false);
      setManagerToActivate(null);
      setActivatePassword('');
      await loadFinanceManagers();
    } catch (err: unknown) {
      const errorMessage =
        (err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) || 'Failed to activate finance manager';
      setActivatePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeactivate = async () => {
    if (!managerToDeactivate || !deactivatePassword.trim()) {
      setDeactivatePasswordError('Password is required');
      return;
    }

    setTogglingId(managerToDeactivate.id);
    setDeactivatePasswordError(null);
    setError(null);

    try {
      await apiClient.deactivateUser(managerToDeactivate.id, deactivatePassword.trim());
      toast.success(`${managerToDeactivate.full_name || managerToDeactivate.email} has been deactivated`);
      setShowDeactivateModal(false);
      setManagerToDeactivate(null);
      setDeactivatePassword('');
      await loadFinanceManagers();
    } catch (err: unknown) {
      const errorMessage =
        (err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) || 'Failed to deactivate finance manager';
      setDeactivatePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setTogglingId(null);
    }
  };

  const filtered = financeManagers.filter((m) =>
    [m.full_name, m.email, m.username]
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Reset to first page on search
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Calculate pagination
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <LoadingContainer>
              <Spinner />
              <p>Loading finance managers...</p>
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
          <HeaderContainer>
            <HeaderContent>
              <h1>Finance Managers</h1>
              <p>Manage financial department users</p>
            </HeaderContent>
            <Link href="/finance/create">
              <AddButton>
                <UserPlus size={16} style={{ marginRight: theme.spacing.xs }} />
                Add Finance Manager
              </AddButton>
            </Link>
          </HeaderContainer>

          {error && (
            <ErrorBanner>
              <AlertCircle />
              <span>{error}</span>
            </ErrorBanner>
          )}

          <SearchContainer>
            <Search />
            <SearchInput
              type="text"
              placeholder="Search finance managers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </SearchContainer>

          <TableContainer>
            {filtered.length === 0 ? (
              <EmptyState>
                <Briefcase />
                <p>No finance managers found.</p>
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
                    {filtered.map((m) => (
                      <tr key={m.id}>
                        <td style={{ whiteSpace: 'nowrap' }}>{m.full_name || 'N/A'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{m.email}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{m.username || 'N/A'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{m.phone || 'N/A'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>{m.department || 'N/A'}</td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                            <StatusBadge $active={m.is_active}>
                              {m.is_active ? 'Active' : 'Inactive'}
                            </StatusBadge>
                            <Switch
                              checked={m.is_active}
                              onCheckedChange={() => handleToggleActive(m)}
                              disabled={togglingId === m.id || deleting}
                              aria-label={`${m.is_active ? 'Deactivate' : 'Activate'} ${m.full_name || m.email}`}
                            />
                            {togglingId === m.id && (
                              <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: TEXT_COLOR_MUTED }} />
                            )}
                          </div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <ActionButtons>
                            <Link href={`/finance/edit/${m.id}`}>
                              <Button size="sm" variant="secondary">
                                <Edit size={14} style={{ marginRight: theme.spacing.xs }} />
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteClick(m)}
                              disabled={deleting}
                            >
                              {deleting && managerToDelete?.id === m.id ? (
                                <>
                                  <Loader2 size={14} style={{ marginRight: theme.spacing.xs }} className="animate-spin" />
                                </>
                              ) : (
                                <Trash2 size={14} style={{ marginRight: theme.spacing.xs }} />
                              )}
                            </Button>
                          </ActionButtons>
                        </td>
                      </tr>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TableContainer>
        </ContentContainer>
      </PageContainer>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && managerToDelete && (
        <ModalOverlay $isOpen={showDeleteModal} onClick={handleDeleteCancel}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <Trash2 size={20} style={{ color: '#ef4444' }} />
                Delete Finance Manager
              </ModalTitle>
              <button onClick={handleDeleteCancel} title="Close" type="button">
                <XCircle />
              </button>
            </ModalHeader>
            <WarningBox>
              <p>
                <strong>Warning:</strong> This action cannot be undone. All data associated with this finance manager will be permanently deleted.
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
                color: TEXT_COLOR_DARK,
                margin: `0 0 ${theme.spacing.md} 0`,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm
              }}>
                <Briefcase size={18} />
                Finance Manager Details to be Deleted
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.md, color: TEXT_COLOR_DARK, fontWeight: theme.typography.fontWeights.medium }}>
                      {managerToDelete.full_name || 'N/A'}
                    </span>
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.md, color: TEXT_COLOR_DARK }}>
                      {managerToDelete.email}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, flexWrap: 'wrap' }}>
                  <div>
                    <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</strong>
                    <Badge $variant={getRoleBadgeVariant(managerToDelete.role)}>
                      {getRoleDisplayName(managerToDelete.role)}
                    </Badge>
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</strong>
                    <Badge $variant={managerToDelete.is_active ? 'active' : 'inactive'}>
                      {managerToDelete.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                {(managerToDelete.username || managerToDelete.phone || managerToDelete.department) && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap', paddingTop: theme.spacing.sm, borderTop: '1px solid ' + theme.colors.border }}>
                    {managerToDelete.username && (
                      <div style={{ flex: '1 1 200px' }}>
                        <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username</strong>
                        <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>
                          {managerToDelete.username}
                        </span>
                      </div>
                    )}
                    {managerToDelete.phone && (
                      <div style={{ flex: '1 1 200px' }}>
                        <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</strong>
                        <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>
                          {managerToDelete.phone}
                        </span>
                      </div>
                    )}
                    {managerToDelete.department && (
                      <div style={{ flex: '1 1 200px' }}>
                        <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</strong>
                        <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>
                          {managerToDelete.department}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <FormGroup>
              <Label htmlFor="delete-password">
                <Lock size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                Enter <strong>your own password</strong> to confirm deletion of <strong>{managerToDelete.full_name || managerToDelete.email}</strong>:
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
                disabled={deleting}
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
                    Delete Finance Manager
                  </>
                )}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Activate Confirmation Modal */}
      {showActivateModal && managerToActivate && (
        <ModalOverlay $isOpen={showActivateModal} onClick={handleActivateCancel}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              <UserCheck size={20} style={{ color: '#16a34a' }} />
              Activate Finance Manager
            </ModalTitle>

            <WarningBox style={{ background: 'rgba(22, 163, 74, 0.1)', borderColor: 'rgba(22, 163, 74, 0.3)' }}>
              <p style={{ color: '#16a34a' }}>
                <strong>Confirm Activation:</strong> This will restore access for <strong>{managerToActivate.full_name || managerToActivate.email}</strong>.
              </p>
            </WarningBox>

            <FormGroup>
              <Label htmlFor="activate-password">
                <Lock size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                Enter <strong>your own password</strong> to confirm activation of <strong>{managerToActivate.full_name || managerToActivate.email}</strong>:
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
                  disabled={togglingId === managerToActivate.id}
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
                disabled={togglingId === managerToActivate.id}
              >
                Cancel
              </Button>
              <Button
                onClick={handleActivate}
                disabled={!activatePassword.trim() || togglingId === managerToActivate.id}
                style={{ backgroundColor: '#16a34a', color: 'white' }}
              >
                {togglingId === managerToActivate.id ? (
                  <>
                    <Loader2 size={16} style={{ marginRight: theme.spacing.sm }} className="animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <UserCheck size={16} style={{ marginRight: theme.spacing.sm }} />
                    Activate Finance Manager
                  </>
                )}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && managerToDeactivate && (
        <ModalOverlay $isOpen={showDeactivateModal} onClick={handleDeactivateCancel}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>
              <Shield size={20} style={{ color: '#dc2626' }} />
              Deactivate Finance Manager
            </ModalTitle>

            <WarningBox>
              <p>
                <strong>Warning:</strong> This will revoke access for <strong>{managerToDeactivate.full_name || managerToDeactivate.email}</strong>. They will not be able to log in until reactivated.
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
                color: TEXT_COLOR_DARK,
                margin: `0 0 ${theme.spacing.md} 0`
              }}>
                Finance Manager Details to be Deactivated:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Name:</strong>
                  <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                    {managerToDeactivate.full_name || 'N/A'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Email:</strong>
                  <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                    {managerToDeactivate.email}
                  </span>
                </div>
                {managerToDeactivate.username && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Username:</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                      {managerToDeactivate.username}
                    </span>
                  </div>
                )}
                {managerToDeactivate.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Phone:</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                      {managerToDeactivate.phone}
                    </span>
                  </div>
                )}
                {managerToDeactivate.department && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Department:</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_MUTED }}>
                      {managerToDeactivate.department}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Role:</strong>
                  <Badge $variant={getRoleBadgeVariant(managerToDeactivate.role)}>
                    {getRoleDisplayName(managerToDeactivate.role)}
                  </Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK }}>Status:</strong>
                  <Badge $variant={managerToDeactivate.is_active ? 'active' : 'inactive'}>
                    {managerToDeactivate.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>

            <FormGroup>
              <Label htmlFor="deactivate-password">
                <Lock size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                Enter <strong>your own password</strong> to confirm deactivation of <strong>{managerToDeactivate.full_name || managerToDeactivate.email}</strong>:
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
                  disabled={togglingId === managerToDeactivate.id}
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
                disabled={togglingId === managerToDeactivate.id}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeactivate}
                disabled={!deactivatePassword.trim() || togglingId === managerToDeactivate.id}
              >
                {togglingId === managerToDeactivate.id ? (
                  <>
                    <Loader2 size={16} style={{ marginRight: theme.spacing.sm }} className="animate-spin" />
                    Deactivating...
                  </>
                ) : (
                  <>
                    <Shield size={16} style={{ marginRight: theme.spacing.sm }} />
                    Deactivate Finance Manager
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
