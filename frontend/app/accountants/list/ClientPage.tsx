'use client';
import { useState, useEffect, Suspense } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/ui/button';
import Layout from '@/components/layout';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { AlertCircle, Edit, Trash2, UserPlus, Loader2, UserCheck, Shield, Eye, EyeOff, Lock, XCircle, Search, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { toast } from 'sonner';
import { theme } from '@/components/common/theme';
import { Switch } from '@/components/ui/switch';
import { type ApiUser } from '@/lib/api';
import { useAuth } from '@/lib/rbac/auth-context';



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

interface Accountant {
  id: number;
  full_name: string;
  email: string;
  username: string;
  phone: string | null;
  role: string;
  is_active: boolean;
  department: string | null;
}

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
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.sm} ${props => props.theme.spacing.sm};
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${props => props.theme.colors.primary} 0%, ${props => props.theme.mode === 'dark' ? '#064e3b' : '#008800'} 100%);
  color: #ffffff;
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: ${props => props.theme.borderRadius.md};
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.md};
  
  h1 {
    font-size: clamp(24px, 3vw, 36px);
    font-weight: ${props => props.theme.typography.fontWeights.bold};
    margin: 0 0 ${props => props.theme.spacing.xs};
    color: #ffffff;
  }
  
  p {
    font-size: ${props => props.theme.typography.fontSizes.md};
    font-weight: ${props => props.theme.typography.fontWeights.medium};
    opacity: 0.9;
    margin: 0;
    color: rgba(255, 255, 255, 0.95);
  }
`;

const AddButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: rgba(255, 255, 255, 0.2);
  color: #ffffff;
  border-radius: ${props => props.theme.borderRadius.md};
  text-decoration: none;
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  font-size: ${props => props.theme.typography.fontSizes.md};
  transition: all ${props => props.theme.transitions.default};
  border: 1px solid rgba(255, 255, 255, 0.3);

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ErrorBanner = styled.div`
  background: ${props => props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#fef2f2'};
  border: 1px solid ${props => props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.5)' : '#fecaca'};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.mode === 'dark' ? '#fca5a5' : '#991b1b'};
  font-size: ${props => props.theme.typography.fontSizes.sm};

  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }
`;

const Card = styled.div`
  background: ${props => props.theme.colors.background};
  padding: ${props => props.theme.spacing.xl};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
  box-shadow: ${CardShadow};
  transition: box-shadow ${props => props.theme.transitions.default};

  &:hover {
    box-shadow: ${CardShadowHover};
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: ${props => props.theme.spacing.xxl} ${props => props.theme.spacing.lg};
  
  p {
    color: ${props => props.theme.colors.mutedForeground};
    margin-bottom: ${props => props.theme.spacing.md};
    font-size: ${props => props.theme.typography.fontSizes.md};
  }
`;

const TableContainer = styled.div`
  overflow-x: auto;
  border-radius: ${props => props.theme.borderRadius.md};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  border-bottom: 2px solid ${props => props.theme.colors.border};
  
  th {
    text-align: left;
    padding: ${props => props.theme.spacing.md};
    font-weight: ${props => props.theme.typography.fontWeights.bold};
    color: ${props => props.theme.colors.textDark};
    font-size: ${props => props.theme.typography.fontSizes.sm};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;

const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid ${props => props.theme.colors.border};
    transition: background-color ${props => props.theme.transitions.default};
    
    &:hover {
      background: ${props => props.theme.colors.backgroundSecondary};
    }
    
    &:last-child {
      border-bottom: none;
    }
    
    td {
      padding: ${props => props.theme.spacing.md};
      color: ${props => props.theme.colors.mutedForeground};
      font-size: ${props => props.theme.typography.fontSizes.md};
    }
  }
`;

const StatusBadge = styled.span<{ $isActive: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSizes.xs};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${({ $isActive, theme }) =>
    $isActive
      ? `
        background: ${theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5'};
        color: ${theme.mode === 'dark' ? '#6ee7b7' : '#065F46'};
      `
      : `
        background: ${theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2'};
        color: ${theme.mode === 'dark' ? '#fca5a5' : '#991B1B'};
      `}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  align-items: center;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  width: 100%;
  
  p {
    margin-top: ${props => props.theme.spacing.md};
    color: ${props => props.theme.colors.mutedForeground};
    font-size: ${props => props.theme.typography.fontSizes.md};
  }
`;

const Spinner = styled(Loader2)`
  width: 40px;
  height: 40px;
  color: ${props => props.theme.colors.primary};
  animation: spin 1s linear infinite;
  
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
  background: ${props => props.theme.colors.background};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
  padding: ${props => props.theme.spacing.lg};
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
  margin-bottom: ${props => props.theme.spacing.lg};
  padding-bottom: ${props => props.theme.spacing.md};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  h3 {
    font-size: ${props => props.theme.typography.fontSizes.lg};
    font-weight: ${props => props.theme.typography.fontWeights.bold};
    color: ${props => props.theme.colors.textDark};
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.sm};
  }
  
  button {
    background: none;
    border: none;
    cursor: pointer;
    color: ${props => props.theme.colors.mutedForeground};
    padding: ${props => props.theme.spacing.xs};
    border-radius: ${props => props.theme.borderRadius.sm};
    transition: all ${props => props.theme.transitions.default};
    
    &:hover {
      background: ${props => props.theme.colors.backgroundSecondary};
      color: ${props => props.theme.colors.textDark};
    }
    
    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

const ModalTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSizes.lg};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  color: ${props => props.theme.colors.textDark};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const WarningBox = styled.div`
  padding: ${props => props.theme.spacing.md};
  background: ${props => props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  border: 1px solid ${props => props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: ${props => props.theme.spacing.lg};
  
  p {
    margin: 0;
    color: ${props => props.theme.mode === 'dark' ? '#fca5a5' : '#dc2626'};
    font-size: ${props => props.theme.typography.fontSizes.sm};
    line-height: 1.5;
  }
`;

const FormGroup = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
`;

const Label = styled.label`
  display: block;
  font-size: ${props => props.theme.typography.fontSizes.sm};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  color: ${props => props.theme.colors.textDark};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const PasswordInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  
  input {
    width: 100%;
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    padding-right: 48px;
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius.md};
    background: ${props => props.theme.colors.background};
    font-size: ${props => props.theme.typography.fontSizes.md};
    color: ${props => props.theme.colors.textDark};
    transition: all ${props => props.theme.transitions.default};
    
    &:focus {
      outline: none;
      border-color: ${props => props.theme.colors.primary};
      box-shadow: 0 0 0 3px ${props => props.theme.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
    }
    
    &::placeholder {
      color: ${props => props.theme.colors.mutedForeground};
      opacity: 0.5;
    }
    
    &:disabled {
      background-color: ${props => props.theme.colors.backgroundSecondary};
      color: ${props => props.theme.colors.mutedForeground};
      cursor: not-allowed;
      opacity: 0.7;
    }
  }
  
  button {
    position: absolute;
    right: ${props => props.theme.spacing.sm};
    background: none;
    border: none;
    cursor: pointer;
    color: ${props => props.theme.colors.mutedForeground};
    padding: ${props => props.theme.spacing.xs};
    border-radius: ${props => props.theme.borderRadius.sm};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all ${props => props.theme.transitions.default};
    
    &:hover {
      color: ${props => props.theme.colors.textDark};
      background: ${props => props.theme.colors.backgroundSecondary};
    }
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const ErrorText = styled.p`
  color: ${props => props.theme.colors.error};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  margin: ${props => props.theme.spacing.xs} 0 0 0;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-top: ${props => props.theme.spacing.lg};
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.md} 0;
  margin-top: ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.border};
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
`;

const PaginationActions = styled.div`
  display: flex;
  gap: ${theme.spacing.xs};
  align-items: center;
`;

const PageInfo = styled.div`
  color: ${theme.colors.mutedForeground};
  font-size: ${theme.typography.fontSizes.sm};
`;

const PageButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${theme.borderRadius.sm};
  border: 1px solid ${props => props.$active ? theme.colors.primary : theme.colors.border};
  background: ${props => props.$active ? theme.colors.primary : theme.colors.background};
  color: ${props => props.$active ? '#fff' : theme.colors.textDark};
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${props => props.$active ? 600 : 400};
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${props => props.$active ? theme.colors.primary : theme.colors.backgroundSecondary};
    border-color: ${theme.colors.primary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const SearchContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  margin-bottom: ${props => props.theme.spacing.lg};
  align-items: center;
`;

const SearchInputWrapper = styled.div`
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  
  input {
    width: 100%;
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    padding-left: 40px;
    padding-right: 40px;
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: ${props => props.theme.borderRadius.md};
    background: ${props => props.theme.colors.background};
    font-size: ${props => props.theme.typography.fontSizes.md};
    color: ${props => props.theme.colors.textDark};
    transition: all ${props => props.theme.transitions.default};
    
    &:focus {
      outline: none;
      border-color: ${props => props.theme.colors.primary};
      box-shadow: 0 0 0 3px ${props => props.theme.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)'};
    }
    
    &::placeholder {
      color: ${props => props.theme.colors.mutedForeground};
      opacity: 0.5;
    }
  }
  
  .search-icon {
    position: absolute;
    left: ${props => props.theme.spacing.sm};
    color: ${props => props.theme.colors.mutedForeground};
    width: 18px;
    height: 18px;
    pointer-events: none;
  }
  
  .clear-button {
    position: absolute;
    right: ${props => props.theme.spacing.sm};
    background: none;
    border: none;
    cursor: pointer;
    color: ${props => props.theme.colors.mutedForeground};
    padding: ${props => props.theme.spacing.xs};
    border-radius: ${props => props.theme.borderRadius.sm};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all ${props => props.theme.transitions.default};
    
    &:hover {
      color: ${props => props.theme.colors.textDark};
      background: ${props => props.theme.colors.backgroundSecondary};
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
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  
  svg {
    width: 16px;
    height: 16px;
  }
`;

const SearchResultsInfo = styled.div`
  font-size: ${props => props.theme.typography.fontSizes.sm};
  color: ${props => props.theme.colors.mutedForeground};
  margin-bottom: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  background: ${props => props.theme.colors.backgroundSecondary};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
`;

const Badge = styled.span<{ $variant: 'admin' | 'finance_manager' | 'finance_admin' | 'accountant' | 'employee' | 'active' | 'inactive' | 'default' }>`
  display: inline-flex;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  font-size: ${props => props.theme.typography.fontSizes.xs};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  border-radius: 9999px;

  ${({ $variant, theme }) => {
    switch ($variant) {
      case 'admin':
        return `background-color: ${theme.mode === 'dark' ? 'rgba(107, 33, 168, 0.2)' : '#f3e8ff'}; color: ${theme.mode === 'dark' ? '#d8b4fe' : '#6b21a8'};`;
      case 'finance_manager':
      case 'finance_admin':
        return `background-color: ${theme.mode === 'dark' ? 'rgba(30, 64, 175, 0.2)' : '#dbeafe'}; color: ${theme.mode === 'dark' ? '#93c5fd' : '#1e40af'};`;
      case 'accountant':
        return `background-color: ${theme.mode === 'dark' ? 'rgba(22, 101, 52, 0.2)' : '#dcfce7'}; color: ${theme.mode === 'dark' ? '#86efac' : '#166534'};`;
      case 'employee':
        return `background-color: ${theme.mode === 'dark' ? 'rgba(154, 52, 18, 0.2)' : '#fed7aa'}; color: ${theme.mode === 'dark' ? '#fdba74' : '#9a3412'};`;
      case 'active':
        return `background-color: ${theme.mode === 'dark' ? 'rgba(22, 101, 52, 0.2)' : '#dcfce7'}; color: ${theme.mode === 'dark' ? '#86efac' : '#166534'};`;
      case 'inactive':
        return `background-color: ${theme.mode === 'dark' ? 'rgba(153, 27, 27, 0.2)' : '#fee2e2'}; color: ${theme.mode === 'dark' ? '#fca5a5' : '#991b1b'};`;
      default:
        return `background-color: ${theme.colors.backgroundSecondary}; color: ${theme.colors.text};`;
    }
  }}
`;

const getErrorMessage = (err: unknown, fallback: string) => {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const typedErr = err as { response?: { data?: { detail?: string; message?: string } } };
    return typedErr.response?.data?.detail || typedErr.response?.data?.message || fallback;
  }
  return (err as { message?: string }).message || fallback;
};

function AccountantListPageInner() {
  const { user } = useAuth();
  const [accountants, setAccountants] = useState<Accountant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [accountantToDelete, setAccountantToDelete] = useState<Accountant | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [accountantToActivate, setAccountantToActivate] = useState<Accountant | null>(null);
  const [accountantToDeactivate, setAccountantToDeactivate] = useState<Accountant | null>(null);
  const [activatePassword, setActivatePassword] = useState('');
  const [deactivatePassword, setDeactivatePassword] = useState('');
  const [activatePasswordError, setActivatePasswordError] = useState<string | null>(null);
  const [deactivatePasswordError, setDeactivatePasswordError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAccountants, setFilteredAccountants] = useState<Accountant[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadAccountants();
  }, []);

  useEffect(() => {
    filterAccountants();
  }, [accountants, searchQuery]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const filterAccountants = () => {
    if (!searchQuery.trim()) {
      setFilteredAccountants(accountants);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = accountants.filter((accountant) => {
      const fullName = (accountant.full_name || '').toLowerCase();
      const email = (accountant.email || '').toLowerCase();
      const username = (accountant.username || '').toLowerCase();
      const phone = (accountant.phone || '').toLowerCase();
      const department = (accountant.department || '').toLowerCase();

      return (
        fullName.includes(query) ||
        email.includes(query) ||
        username.includes(query) ||
        phone.includes(query) ||
        department.includes(query)
      );
    });

    setFilteredAccountants(filtered);
  };

  const handleSearch = () => {
    filterAccountants();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setFilteredAccountants(accountants);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const loadAccountants = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getUsers();
      const users = Array.isArray(response.data) ? (response.data as ApiUser[]) : [];
      // Filter for accountants only
      const accountantUsers = users
        .filter((user) => user.role?.toLowerCase() === 'accountant')
        .map((user) => ({
          id: user.id,
          full_name: user.full_name || '',
          email: user.email || '',
          username: user.username || '',
          phone: user.phone || null,
          role: user.role || 'accountant',
          is_active: user.is_active ?? true,
          department: user.department || null,
        }));
      setAccountants(accountantUsers);
    } catch (err: unknown) {
      const errorMsg = getErrorMessage(err, 'Failed to load accountants');
      setError(errorMsg);
      toast.error(errorMsg);
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

  const handleDeleteClick = (accountant: Accountant) => {
    setAccountantToDelete(accountant);
    setShowDeleteModal(true);
    setDeletePassword('');
    setDeletePasswordError(null);
    setShowDeletePassword(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setDeletePassword('');
    setDeletePasswordError(null);
    setAccountantToDelete(null);
    setShowDeletePassword(false);
  };

  const handleDelete = async () => {
    if (!accountantToDelete || !accountantToDelete.id) return;

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
      setError(null);
      await apiClient.deleteUser(accountantToDelete.id, deletePassword.trim());
      toast.success('Accountant deleted successfully');
      setShowDeleteModal(false);
      setAccountantToDelete(null);
      setDeletePassword('');
      setShowDeletePassword(false);
      loadAccountants();
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to delete accountant');
      setDeletePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
      setVerifyingPassword(false);
    }
  };

  const handleToggleActive = (accountant: Accountant) => {
    if (togglingId === accountant.id) return;

    if (accountant.is_active) {
      // Show deactivate modal
      setAccountantToDeactivate(accountant);
      setShowDeactivateModal(true);
      setDeactivatePassword('');
      setDeactivatePasswordError(null);
    } else {
      // Show activate modal
      setAccountantToActivate(accountant);
      setShowActivateModal(true);
      setActivatePassword('');
      setActivatePasswordError(null);
    }
  };

  const handleActivateCancel = () => {
    setShowActivateModal(false);
    setAccountantToActivate(null);
    setActivatePassword('');
    setActivatePasswordError(null);
  };

  const handleDeactivateCancel = () => {
    setShowDeactivateModal(false);
    setAccountantToDeactivate(null);
    setDeactivatePassword('');
    setDeactivatePasswordError(null);
  };

  const handleActivate = async () => {
    if (!accountantToActivate || !activatePassword.trim()) {
      setActivatePasswordError('Password is required');
      return;
    }

    setTogglingId(accountantToActivate.id);
    setActivatePasswordError(null);
    setError(null);

    try {
      await apiClient.activateUser(accountantToActivate.id, activatePassword.trim());
      toast.success(`${accountantToActivate.full_name} has been activated`);
      setShowActivateModal(false);
      setAccountantToActivate(null);
      setActivatePassword('');
      await loadAccountants();
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to activate accountant');
      setActivatePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeactivate = async () => {
    if (!accountantToDeactivate || !deactivatePassword.trim()) {
      setDeactivatePasswordError('Password is required');
      return;
    }

    setTogglingId(accountantToDeactivate.id);
    setDeactivatePasswordError(null);
    setError(null);

    try {
      await apiClient.deactivateUser(accountantToDeactivate.id, deactivatePassword.trim());
      toast.success(`${accountantToDeactivate.full_name} has been deactivated`);
      setShowDeactivateModal(false);
      setAccountantToDeactivate(null);
      setDeactivatePassword('');
      await loadAccountants();
    } catch (err: unknown) {
      const errorMessage = getErrorMessage(err, 'Failed to deactivate accountant');
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

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <HeaderContainer>
            <HeaderContent>
              <div>
                <h1>Accountants</h1>
                <p>Manage accountant accounts</p>
              </div>
              <AddButton href="/accountants/create">
                <UserPlus />
                Create Accountant
              </AddButton>
            </HeaderContent>
          </HeaderContainer>

          {error && (
            <ErrorBanner>
              <AlertCircle />
              <span>{error}</span>
            </ErrorBanner>
          )}

          {!loading && accountants.length > 0 && (
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
              Showing {filteredAccountants.length} of {accountants.length} accountant{accountants.length !== 1 ? 's' : ''}
              {searchQuery && ` matching "${searchQuery}"`}
            </SearchResultsInfo>
          )}

          {loading ? (
            <LoadingContainer>
              <Spinner />
              <p>Loading accountants...</p>
            </LoadingContainer>
          ) : (
            <Card>
              {filteredAccountants.length === 0 && searchQuery ? (
                <EmptyState>
                  <p>No accountants found matching "{searchQuery}".</p>
                  <Button
                    variant="outline"
                    onClick={handleClearSearch}
                    className="mt-4"
                  >
                    Clear Search
                  </Button>
                </EmptyState>
              ) : accountants.length === 0 ? (
                <EmptyState>
                  <p>No accountants found.</p>
                  <Link href="/accountants/create">
                    <Button className="mt-4">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Create First Accountant
                    </Button>
                  </Link>
                </EmptyState>
              ) : (
                <TableContainer>
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
                      {(() => {
                        const totalPages = Math.ceil(filteredAccountants.length / itemsPerPage);
                        const startIndex = (currentPage - 1) * itemsPerPage;
                        const paginated = filteredAccountants.slice(startIndex, startIndex + itemsPerPage);

                        if (paginated.length === 0 && filteredAccountants.length > 0) {
                          setCurrentPage(1);
                          return null;
                        }

                        return (
                          <>
                            {paginated.map((accountant) => (
                              <tr key={accountant.id}>
                                <td>{accountant.full_name || 'N/A'}</td>
                                <td>{accountant.email}</td>
                                <td>{accountant.username}</td>
                                <td>{accountant.phone || 'N/A'}</td>
                                <td>{accountant.department || 'N/A'}</td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                                    <StatusBadge $isActive={accountant.is_active}>
                                      {accountant.is_active ? 'Active' : 'Inactive'}
                                    </StatusBadge>
                                    <Switch
                                      checked={accountant.is_active}
                                      onCheckedChange={() => handleToggleActive(accountant)}
                                      disabled={togglingId === accountant.id || deleting}
                                      aria-label={`${accountant.is_active ? 'Deactivate' : 'Activate'} ${accountant.full_name}`}
                                    />
                                    {togglingId === accountant.id && (
                                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite', color: theme.colors.mutedForeground }} />
                                    )}
                                  </div>
                                </td>
                                <td>
                                  <ActionButtons>
                                    <Link href={`/accountants/edit/${accountant.id}`}>
                                      <Button size="sm" variant="secondary">
                                        <Edit size={14} className="h-4 w-4 mr-1" />
                                      </Button>
                                    </Link>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleDeleteClick(accountant)}
                                      disabled={deleting}
                                    >
                                      {deleting && accountantToDelete?.id === accountant.id ? (
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
                            {filteredAccountants.length > itemsPerPage && (
                              <tr>
                                <td colSpan={7} style={{ padding: 0 }}>
                                  <PaginationContainer>
                                    <PageInfo>
                                      Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAccountants.length)} of {filteredAccountants.length} accountants
                                    </PageInfo>
                                    <PaginationActions>
                                      <PageButton
                                        onClick={() => setCurrentPage(1)}
                                        disabled={currentPage === 1}
                                        title="First Page"
                                      >
                                        <ChevronsLeft size={16} />
                                      </PageButton>
                                      <PageButton
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        title="Previous Page"
                                      >
                                        <ChevronLeft size={16} />
                                      </PageButton>

                                      {[...Array(totalPages)].map((_, i) => {
                                        const pageNum = i + 1;
                                        if (
                                          pageNum === 1 ||
                                          pageNum === totalPages ||
                                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                                        ) {
                                          return (
                                            <PageButton
                                              key={pageNum}
                                              $active={currentPage === pageNum}
                                              onClick={() => setCurrentPage(pageNum)}
                                            >
                                              {pageNum}
                                            </PageButton>
                                          );
                                        } else if (
                                          pageNum === currentPage - 2 ||
                                          pageNum === currentPage + 2
                                        ) {
                                          return <span key={pageNum} style={{ color: theme.colors.mutedForeground }}>...</span>;
                                        }
                                        return null;
                                      })}

                                      <PageButton
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        title="Next Page"
                                      >
                                        <ChevronRight size={16} />
                                      </PageButton>
                                      <PageButton
                                        onClick={() => setCurrentPage(totalPages)}
                                        disabled={currentPage === totalPages}
                                        title="Last Page"
                                      >
                                        <ChevronsRight size={16} />
                                      </PageButton>
                                    </PaginationActions>
                                  </PaginationContainer>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })()}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Card>
          )}
        </ContentContainer>
      </PageContainer>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && accountantToDelete && (
        <ModalOverlay $isOpen={showDeleteModal} onClick={handleDeleteCancel}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <Trash2 size={20} style={{ color: '#ef4444' }} />
                Delete Accountant
              </ModalTitle>
              <button onClick={handleDeleteCancel} title="Close" type="button">
                <XCircle />
              </button>
            </ModalHeader>
            <WarningBox>
              <p>
                <strong>Warning:</strong> You are about to permanently delete this accountant.
                This action cannot be undone. Please enter <strong>your own password</strong> to verify this action.
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
                color: theme.colors.textDark,
                margin: `0 0 ${theme.spacing.md} 0`,
                display: 'flex',
                alignItems: 'center',
                gap: theme.spacing.sm
              }}>
                <Shield size={18} />
                Accountant Details to be Deleted
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 200px' }}>
                    <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: theme.colors.mutedForeground, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Full Name</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.md, color: theme.colors.textDark, fontWeight: theme.typography.fontWeights.medium }}>
                      {accountantToDelete.full_name || 'N/A'}
                    </span>
                  </div>
                  <div style={{ flex: '1 1 200px' }}>
                    <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: theme.colors.mutedForeground, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.sm, color: theme.colors.textDark }}>
                      {accountantToDelete.email}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap', paddingTop: theme.spacing.sm, borderTop: '1px solid ' + theme.colors.border }}>
                  {accountantToDelete.username && (
                    <div style={{ flex: '1 1 200px' }}>
                      <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: theme.colors.mutedForeground, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Username</strong>
                      <span style={{ fontSize: theme.typography.fontSizes.sm, color: theme.colors.textDark }}>
                        {accountantToDelete.username}
                      </span>
                    </div>
                  )}
                  {accountantToDelete.phone && (
                    <div style={{ flex: '1 1 200px' }}>
                      <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: theme.colors.mutedForeground, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Phone</strong>
                      <span style={{ fontSize: theme.typography.fontSizes.sm, color: theme.colors.textDark }}>
                        {accountantToDelete.phone}
                      </span>
                    </div>
                  )}
                </div>
                {(accountantToDelete.department || accountantToDelete.role || accountantToDelete.is_active !== undefined) && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap', paddingTop: theme.spacing.sm, borderTop: '1px solid ' + theme.colors.border }}>
                    {accountantToDelete.department && (
                      <div style={{ flex: '1 1 200px' }}>
                        <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: theme.colors.mutedForeground, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</strong>
                        <span style={{ fontSize: theme.typography.fontSizes.sm, color: theme.colors.textDark }}>
                          {accountantToDelete.department}
                        </span>
                      </div>
                    )}
                    <div style={{ flex: '1 1 200px' }}>
                      <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: theme.colors.mutedForeground, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</strong>
                      <Badge $variant={getRoleBadgeVariant(accountantToDelete.role)}>
                        {getRoleDisplayName(accountantToDelete.role)}
                      </Badge>
                    </div>
                    <div style={{ flex: '1 1 200px' }}>
                      <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: theme.colors.mutedForeground, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</strong>
                      <Badge $variant={accountantToDelete.is_active ? 'active' : 'inactive'}>
                        {accountantToDelete.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <FormGroup>
              <Label htmlFor="delete-password">
                <Lock size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                Enter <strong>your own password</strong> to confirm deletion of <strong>{accountantToDelete.full_name || 'this accountant'}</strong>:
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
                    Delete Accountant
                  </>
                )}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Activate Confirmation Modal */}
      {showActivateModal && accountantToActivate && (
        <ModalOverlay $isOpen={showActivateModal} onClick={handleActivateCancel}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <UserCheck size={20} style={{ color: '#16a34a' }} />
                Activate Accountant
              </ModalTitle>
              <button onClick={handleActivateCancel} title="Close" type="button">
                <XCircle />
              </button>
            </ModalHeader>

            <WarningBox style={{ background: 'rgba(22, 163, 74, 0.1)', borderColor: 'rgba(22, 163, 74, 0.3)' }}>
              <p style={{ color: '#16a34a' }}>
                <strong>Confirm Activation:</strong> This will restore access for <strong>{accountantToActivate.full_name}</strong>.
              </p>
            </WarningBox>

            <FormGroup>
              <Label htmlFor="activate-password">
                Enter <strong>your own password</strong> to confirm activation of <strong>{accountantToActivate.full_name}</strong>:
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
                disabled={togglingId === accountantToActivate.id}
              >
                Cancel
              </Button>
              <Button
                onClick={handleActivate}
                disabled={!activatePassword.trim() || togglingId === accountantToActivate.id}
                style={{ backgroundColor: '#16a34a', color: 'white' }}
              >
                {togglingId === accountantToActivate.id ? (
                  <>
                    <Loader2 size={16} style={{ marginRight: theme.spacing.sm }} className="animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <UserCheck size={16} style={{ marginRight: theme.spacing.sm }} />
                    Activate Accountant
                  </>
                )}
              </Button>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Deactivate Confirmation Modal */}
      {showDeactivateModal && accountantToDeactivate && (
        <ModalOverlay $isOpen={showDeactivateModal} onClick={handleDeactivateCancel}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                <Shield size={20} style={{ color: '#dc2626' }} />
                Deactivate Accountant
              </ModalTitle>
              <button onClick={handleDeactivateCancel} title="Close" type="button">
                <XCircle />
              </button>
            </ModalHeader>

            <WarningBox>
              <p>
                <strong>Warning:</strong> This will revoke access for <strong>{accountantToDeactivate.full_name}</strong>. They will not be able to log in until reactivated.
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
                color: theme.colors.textDark,
                margin: `0 0 ${theme.spacing.md} 0`
              }}>
                Accountant Details to be Deactivated:
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: theme.colors.textDark }}>Name:</strong>
                  <span style={{ fontSize: theme.typography.fontSizes.sm, color: theme.colors.mutedForeground }}>
                    {accountantToDeactivate.full_name || 'N/A'}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: theme.colors.textDark }}>Email:</strong>
                  <span style={{ fontSize: theme.typography.fontSizes.sm, color: theme.colors.mutedForeground }}>
                    {accountantToDeactivate.email}
                  </span>
                </div>
                {accountantToDeactivate.username && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: theme.colors.textDark }}>Username:</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.sm, color: theme.colors.mutedForeground }}>
                      {accountantToDeactivate.username}
                    </span>
                  </div>
                )}
                {accountantToDeactivate.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: theme.colors.textDark }}>Phone:</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.sm, color: theme.colors.mutedForeground }}>
                      {accountantToDeactivate.phone}
                    </span>
                  </div>
                )}
                {accountantToDeactivate.department && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                    <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: theme.colors.textDark }}>Department:</strong>
                    <span style={{ fontSize: theme.typography.fontSizes.sm, color: theme.colors.mutedForeground }}>
                      {accountantToDeactivate.department}
                    </span>
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: theme.colors.textDark }}>Role:</strong>
                  <Badge $variant={getRoleBadgeVariant(accountantToDeactivate.role)}>
                    {getRoleDisplayName(accountantToDeactivate.role)}
                  </Badge>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <strong style={{ minWidth: '120px', fontSize: theme.typography.fontSizes.sm, color: theme.colors.textDark }}>Status:</strong>
                  <Badge $variant={accountantToDeactivate.is_active ? 'active' : 'inactive'}>
                    {accountantToDeactivate.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            </div>

            <FormGroup>
              <Label htmlFor="deactivate-password">
                Enter your password to confirm deactivation:
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
                disabled={togglingId === accountantToDeactivate.id}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeactivate}
                disabled={!deactivatePassword.trim() || togglingId === accountantToDeactivate.id}
              >
                {togglingId === accountantToDeactivate.id ? (
                  <>
                    <Loader2 size={16} style={{ marginRight: theme.spacing.sm }} className="animate-spin" />
                    Deactivating...
                  </>
                ) : (
                  <>
                    <Shield size={16} style={{ marginRight: theme.spacing.sm }} />
                    Deactivate Accountant
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

const AccountantListPageFallback = () => (
  <Layout>
    <PageContainer>
      <ContentContainer>
        <LoadingContainer>
          <Spinner />
          <p>Loading accountants...</p>
        </LoadingContainer>
      </ContentContainer>
    </PageContainer>
  </Layout>
);

export default function AccountantListPage() {
  return (
    <Suspense fallback={<AccountantListPageFallback />}>
      <AccountantListPageInner />
    </Suspense>
  );
}
