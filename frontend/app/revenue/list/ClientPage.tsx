'use client';
import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import Link from 'next/link';
import {
  Edit,
  Trash2,
  DollarSign,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Calculator,
  AlertCircle,
  Eye,
  EyeOff,
  Lock,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/rbac/auth-context';
import { useUserStore } from '@/store/userStore';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import ExportButton from '@/components/common/ExportButton';

// Type definitions for error handling
type ErrorWithDetails = {
  code?: string;
  message?: string;
  response?: {
    status: number;
    data?: {
      detail?: string;
    };
  };
};

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

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: #ffffff;
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: ${theme.borderRadius.md};
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
`;

const HeaderContent = styled.div`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  
  h1 {
    font-size: clamp(24px, 3vw, 36px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0;
    color: #ffffff;
  }
  
  p {
    font-size: ${theme.typography.fontSizes.sm};
    font-weight: ${theme.typography.fontWeights.medium};
    opacity: 0.9;
    margin: ${theme.spacing.xs} 0 0;
    color: rgba(255, 255, 255, 0.95);
  }
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: ${theme.borderRadius.md};
  color: #ffffff;
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  cursor: pointer;
  transition: all ${theme.transitions.default};
  backdrop-filter: blur(8px);

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.25);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    
    svg {
      animation: spin 0.8s linear infinite;
    }
  }

  svg {
    width: 16px;
    height: 16px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
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

const FiltersContainer = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  box-shadow: ${CardShadow};
  transition: box-shadow ${theme.transitions.default};

  &:hover {
    box-shadow: ${CardShadowHover};
  }
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: ${theme.spacing.sm};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.sm};
  }
`;

const SearchContainer = styled.div`
  position: relative;
  grid-column: span 1;

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
  width: 85%;
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

const Select = styled.select`
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background};
  color: ${TEXT_COLOR_DARK};
  font-size: ${theme.typography.fontSizes.sm};
  cursor: pointer;
  transition: all ${theme.transitions.default};

  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
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
  }

  h3 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.sm};
    color: ${TEXT_COLOR_DARK};
  }

  p {
    font-size: ${theme.typography.fontSizes.md};
    margin: 0 0 ${theme.spacing.md};
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

const CategoryBadge = styled.span`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  background: rgba(59, 130, 246, 0.12);
  color: #1e40af;
`;

const AutoGeneratedBadge = styled.span`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  background: rgba(99, 102, 241, 0.12);
  color: #4338ca;
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  margin-left: ${theme.spacing.sm};
  
  svg {
    width: 12px;
    height: 12px;
  }
`;

const StatusBadge = styled.span<{ $status: 'approved' | 'pending' | 'rejected' }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  margin-right: ${theme.spacing.sm};
  background: ${props => {
    if (props.$status === 'approved') return 'rgba(16, 185, 129, 0.12)';
    if (props.$status === 'rejected') return 'rgba(239, 68, 68, 0.12)';
    return 'rgba(251, 191, 36, 0.12)';
  }};
  color: ${props => {
    if (props.$status === 'approved') return '#065f46';
    if (props.$status === 'rejected') return '#991b1b';
    return '#92400e';
  }};
`;

const RecurringBadge = styled.span`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  background: rgba(59, 130, 246, 0.12);
  color: #1e40af;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  align-items: center;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  cursor: pointer;
  transition: all ${theme.transitions.default};
  background: ${theme.colors.background};
  color: ${TEXT_COLOR_DARK};

  ${props => {
    if (props.$variant === 'danger') {
      return `
        background: #ef4444;
        color: white;
        border-color: #ef4444;
        
        &:hover:not(:disabled) {
          background: #dc2626;
          transform: translateY(-1px);
        }
      `;
    }
    return `
      &:hover:not(:disabled) {
        background: ${theme.colors.backgroundSecondary};
        border-color: ${PRIMARY_COLOR};
        color: ${PRIMARY_COLOR};
      }
    `;
  }}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  svg {
    width: 14px;
    height: 14px;
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

const TextArea = styled.textarea`
  width: 100%;
  padding: ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.background};
  color: ${TEXT_COLOR_DARK};
  font-size: ${theme.typography.fontSizes.sm};
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
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

const ModalActions = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  justify-content: flex-end;
  margin-top: ${theme.spacing.lg};
`;

const StyledLabel = styled.label`
  display: block;
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
  margin-bottom: ${theme.spacing.sm};
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

const FormGroup = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

const ErrorText = styled.p`
  color: #dc2626;
  font-size: ${theme.typography.fontSizes.sm};
  margin: ${theme.spacing.xs} 0 0 0;
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

const ModalAlertIcon = styled(XCircle)`
  color: #ef4444;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};
  background: ${theme.colors.background};
  margin-top: ${theme.spacing.md};
  border-radius: 0 0 ${theme.borderRadius.md} ${theme.borderRadius.md};
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
  color: ${props => props.$active ? '#ffffff' : TEXT_COLOR_DARK({ theme })};
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

interface Revenue {
  id: number;
  title: string;
  description?: string | null;
  category: string;
  amount: number;
  source?: string | null;
  date: string;
  is_recurring: boolean;
  recurring_frequency?: string | null;
  is_approved: boolean;
  created_by_id: number;
  created_at: string;
  updated_at?: string | null;
  approval_status?: 'pending' | 'approved' | 'rejected';
}

export default function RevenueListPage() {
  const { user } = useAuth();
  const { canApproveTransactions } = useUserStore();
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [rejectPassword, setRejectPassword] = useState<string>('');
  const [rejectPasswordError, setRejectPasswordError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [deletePassword, setDeletePassword] = useState<string>('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getStatus = (revenue: Revenue) =>
    revenue.approval_status || (revenue.is_approved ? 'approved' : 'pending');
  const normalizeRevenues = (items: unknown[]): Revenue[] =>
    (items || []).map((rev: unknown) => {
      const revenue = rev as { approval_status?: string; is_approved?: boolean } & Record<string, unknown>;
      return ({
        ...revenue,
        approval_status: revenue?.approval_status || (revenue?.is_approved ? 'approved' : 'pending')
      } as Revenue);
    });

  const canApprove = () => {
    if (canApproveTransactions()) return true;
    if (!user) return false;
    const role = user.role?.toLowerCase();
    return role === 'admin' || role === 'super_admin' || role === 'manager' || role === 'finance_manager';
  };

  const loadRevenues = useCallback(async (showRefreshLoading = false) => {
    if (showRefreshLoading) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await apiClient.getRevenues();
      const revenues = normalizeRevenues(response.data || []);
      revenues.sort((a: Revenue, b: Revenue) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        if (dateA !== dateB) {
          return dateB - dateA;
        }
        const createdA = new Date(a.created_at).getTime();
        const createdB = new Date(b.created_at).getTime();
        return createdB - createdA;
      });
      setRevenues(revenues);
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      const errorMessage = error.response?.data?.detail || 'Failed to load revenues';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadRevenues();
  }, [loadRevenues]);

  const handleRefresh = async () => {
    await loadRevenues(true);
    toast.success('Revenues refreshed');
  };

  const getItemType = (title: string): string => {
    if (!title) return '';

    if (title.toLowerCase().includes('item type:')) {
      const match = title.match(/item type:\s*([^\n,]+)/i);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    if (title.toLowerCase().startsWith('item:')) {
      const match = title.match(/item:\s*([^,]+)/i);
      if (match && match[1]) {
        return match[1].trim();
      }
    }

    const buyAtIndex = title.toLowerCase().indexOf('buy-at');
    if (buyAtIndex > 0) {
      return title.substring(0, buyAtIndex).trim().replace(/^item:\s*/i, '').trim();
    }

    return title.trim();
  };

  const isAutoGenerated = (revenue: Revenue): boolean => {
    return revenue.category === 'sales' &&
      revenue.description?.includes('Item Type:') === true;
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

  const handleDeleteClick = (id: number) => {
    setShowDeleteModal(id);
    setDeletePassword('');
    setDeletePasswordError(null);
    setShowDeletePassword(false);
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(null);
    setDeletePassword('');
    setDeletePasswordError(null);
    setShowDeletePassword(false);
  };

  const handleDelete = async (id: number, password: string) => {
    if (!password.trim()) {
      setDeletePasswordError('Password is required');
      return;
    }

    setVerifyingPassword(true);
    setDeletePasswordError(null);

    try {
      // First verify password
      const isValid = await verifyPassword(password.trim());

      if (!isValid) {
        setDeletePasswordError('Incorrect password. Please try again.');
        setVerifyingPassword(false);
        return;
      }

      // Password is correct, proceed with deletion
      setDeletingId(id);
      await apiClient.deleteRevenue(id, password.trim());
      toast.success('Revenue entry deleted successfully');
      setShowDeleteModal(null);
      setDeletePassword('');
      setShowDeletePassword(false);
      loadRevenues();
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      const errorMessage = error.response?.data?.detail || 'Failed to delete revenue entry';
      setDeletePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
      setVerifyingPassword(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!canApprove()) {
      toast.error('You do not have permission to approve revenue entries');
      return;
    }

    setApprovingId(id);
    try {
      await apiClient.approveItem(id, 'revenue');
      toast.success('Revenue entry approved successfully');
      setRevenues(prev =>
        prev.map(rev =>
          rev.id === id ? { ...rev, is_approved: true, approval_status: 'approved' } : rev
        )
      );
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      const errorMessage = error.response?.data?.detail || 'Failed to approve revenue entry';
      toast.error(errorMessage);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id: number, reason: string, password: string) => {
    if (!canApprove()) {
      toast.error('You do not have permission to reject revenue entries');
      return;
    }

    if (!reason.trim()) {
      setRejectPasswordError('Please provide a rejection reason');
      return;
    }

    if (!password.trim()) {
      setRejectPasswordError('Password is required');
      return;
    }

    setRejectingId(id);
    setRejectPasswordError(null);
    try {
      await apiClient.rejectItem(id, 'revenue', reason, password.trim());
      toast.success('Revenue entry rejected successfully');
      setShowRejectModal(null);
      setRejectionReason('');
      setRejectPassword('');
      setRevenues(prev =>
        prev.map(rev =>
          rev.id === id ? { ...rev, approval_status: 'rejected', is_approved: false } : rev
        )
      );
    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      const errorMessage = error.response?.data?.detail || 'Failed to reject revenue entry';
      setRejectPasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setRejectingId(null);
    }
  };

  const categories = Array.from(new Set(revenues.map(r => r.category).filter(Boolean)));

  const filteredRevenues = revenues.filter(revenue => {
    const cleanType = getItemType(revenue.title).toLowerCase();
    const matchesSearch =
      cleanType.includes(searchTerm.toLowerCase()) ||
      revenue.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      revenue.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      revenue.source?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || revenue.category === categoryFilter;
    const status = getStatus(revenue);
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'approved' && status === 'approved') ||
      (statusFilter === 'pending' && status === 'pending') ||
      (statusFilter === 'rejected' && status === 'rejected');

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, statusFilter]);

  // Calculate paginated items
  const totalPages = Math.ceil(filteredRevenues.length / itemsPerPage);
  const paginatedRevenues = filteredRevenues.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <LoadingContainer>
              <Spinner />
              <p>Loading revenues...</p>
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
              <div>
                <h1>Revenue</h1>
                <p>Manage your revenue entries (including auto-calculated from expense items)</p>
              </div>
              <div style={{ display: 'flex', gap: theme.spacing.sm, alignItems: 'center' }}>
                <ExportButton
                  data={filteredRevenues}
                  fileName="revenue_report"
                  title="Revenue Report"
                />
                <RefreshButton onClick={handleRefresh} disabled={refreshing || loading}>
                  <RefreshCw />
                  Refresh
                </RefreshButton>
              </div>
            </HeaderContent>
          </HeaderContainer>

          {error && (
            <ErrorBanner>
              <AlertCircle />
              <span>{error}</span>
            </ErrorBanner>
          )}

          <FiltersContainer>
            <FiltersGrid>
              <SearchContainer>
                <Search />
                <SearchInput
                  type="text"
                  placeholder="Search by title, description, or source..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </SearchContainer>

              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                ))}
              </Select>

              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </Select>
            </FiltersGrid>
          </FiltersContainer>

          <TableContainer>
            {filteredRevenues.length === 0 ? (
              <EmptyState>
                <DollarSign />
                <h3>No revenue entries</h3>
                <p>
                  {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                    ? 'No revenue entries match your filters'
                    : 'Revenues can be added manually or auto-calculated from expense items. Create expense items with sold prices to generate revenue entries automatically.'}
                </p>
                {!searchTerm && categoryFilter === 'all' && statusFilter === 'all' && (
                  <Link href="/expenses/items" style={{ marginTop: theme.spacing.md, display: 'inline-block' }}>
                    <Button>
                      <Calculator className="h-4 w-4 mr-2" />
                      Go to Expense Calculator
                    </Button>
                  </Link>
                )}
              </EmptyState>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table>
                  <TableHeader>
                    <tr>
                      <th>Type</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Source</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {paginatedRevenues.map((revenue) => {
                      const status = getStatus(revenue);
                      const isPending = status === 'pending';
                      return (
                        <tr key={revenue.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                              <span style={{ fontWeight: theme.typography.fontWeights.medium, color: TEXT_COLOR_DARK({ theme }) }}>
                                {getItemType(revenue.title)}
                              </span>
                              {isAutoGenerated(revenue) && (
                                <AutoGeneratedBadge>
                                  <Calculator />
                                  Auto
                                </AutoGeneratedBadge>
                              )}
                            </div>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <CategoryBadge>{revenue.category}</CategoryBadge>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: theme.typography.fontWeights.bold, color: '#16a34a' }}>
                              {formatCurrency(revenue.amount)}
                            </span>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>{revenue.source || '-'}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{formatDate(revenue.date)}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <StatusBadge $status={status}>
                              {status === 'approved'
                                ? 'Approved'
                                : status === 'rejected'
                                  ? 'Rejected'
                                  : 'Pending'}
                            </StatusBadge>
                            {revenue.is_recurring && (
                              <RecurringBadge>Recurring</RecurringBadge>
                            )}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <ActionButtons>
                              <Link href={`/revenue/edit/${revenue.id}`}>
                                <ActionButton $variant="secondary" title="Edit">
                                  <Edit />
                                </ActionButton>
                              </Link>
                              {isPending && !revenue.is_approved && canApprove() && (
                                <>
                                  <ActionButton
                                    $variant="primary"
                                    onClick={() => handleApprove(revenue.id)}
                                    disabled={approvingId === revenue.id || rejectingId === revenue.id}
                                    style={{ background: PRIMARY_COLOR, color: 'white', borderColor: PRIMARY_COLOR }}
                                  >
                                    {approvingId === revenue.id ? (
                                      <Loader2 style={{ animation: 'spin 1s linear infinite' }} />
                                    ) : (
                                      <CheckCircle />
                                    )}
                                    Approve
                                  </ActionButton>
                                  <ActionButton
                                    $variant="danger"
                                    onClick={() => {
                                      setShowRejectModal(revenue.id);
                                      setRejectionReason('');
                                      setRejectPassword('');
                                      setRejectPasswordError(null);
                                    }}
                                    disabled={approvingId === revenue.id || rejectingId === revenue.id}
                                  >
                                    <XCircle />
                                    Reject
                                  </ActionButton>
                                </>
                              )}
                              <ActionButton
                                $variant="danger"
                                onClick={() => handleDeleteClick(revenue.id)}
                                disabled={deletingId === revenue.id || approvingId === revenue.id || rejectingId === revenue.id}
                                style={{ color: '#dc2626' }}
                                title="Delete"
                              >
                                {deletingId === revenue.id ? (
                                  <Loader2 style={{ animation: 'spin 1s linear infinite' }} />
                                ) : (
                                  <Trash2 />
                                )}
                              </ActionButton>
                            </ActionButtons>
                          </td>
                        </tr>
                      );
                    })}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <PaginationContainer>
                    <PageInfo>
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredRevenues.length)} of {filteredRevenues.length} entries
                    </PageInfo>
                    <PaginationActions>
                      <PageButton
                        onClick={() => {
                          setCurrentPage(1);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={currentPage === 1}
                        title="First Page"
                      >
                        <ChevronsLeft size={16} />
                      </PageButton>
                      <PageButton
                        onClick={() => {
                          setCurrentPage(p => Math.max(1, p - 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
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
                              onClick={() => {
                                setCurrentPage(pageNum);
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                              }}
                            >
                              {pageNum}
                            </PageButton>
                          );
                        } else if (
                          pageNum === currentPage - 2 ||
                          pageNum === currentPage + 2
                        ) {
                          return <span key={pageNum} style={{ color: TEXT_COLOR_MUTED }}>...</span>;
                        }
                        return null;
                      })}

                      <PageButton
                        onClick={() => {
                          setCurrentPage(p => Math.min(totalPages, p + 1));
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={currentPage === totalPages}
                        title="Next Page"
                      >
                        <ChevronRight size={16} />
                      </PageButton>
                      <PageButton
                        onClick={() => {
                          setCurrentPage(totalPages);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        disabled={currentPage === totalPages}
                        title="Last Page"
                      >
                        <ChevronsRight size={16} />
                      </PageButton>
                    </PaginationActions>
                  </PaginationContainer>
                )}
              </div>
            )}
          </TableContainer>

          {/* Rejection Modal */}
          {showRejectModal && (
            <ModalOverlay $isOpen={showRejectModal !== null} onClick={() => {
              setShowRejectModal(null);
              setRejectionReason('');
              setRejectPassword('');
              setRejectPasswordError(null);
            }}>
              <ModalContent onClick={(e) => e.stopPropagation()}>
                <ModalTitle>
                  <ModalAlertIcon size={20} />
                  Reject Revenue Entry
                </ModalTitle>

                <WarningBox>
                  <p>
                    You are about to reject this revenue entry. This action cannot be undone.
                    Please enter your own password to verify this action.
                  </p>
                </WarningBox>

                <FormGroup>
                  <StyledLabel htmlFor="rejection-reason">Rejection Reason *</StyledLabel>
                  <TextArea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => {
                      setRejectionReason(e.target.value);
                      setRejectPasswordError(null);
                    }}
                    placeholder="Please provide a reason for rejection..."
                    rows={4}
                  />
                </FormGroup>

                <FormGroup>
                  <StyledLabel htmlFor="reject-password">
                    <Lock size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                    Enter <strong>your own password</strong> to confirm rejection:
                  </StyledLabel>
                  <PasswordInputWrapper>
                    <input
                      id="reject-password"
                      type="password"
                      value={rejectPassword}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setRejectPassword(e.target.value);
                        setRejectPasswordError(null);
                      }}
                      placeholder="Enter your password"
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        if (e.key === 'Enter' && rejectionReason.trim() && rejectPassword.trim() && showRejectModal !== null) {
                          handleReject(showRejectModal, rejectionReason, rejectPassword);
                        }
                      }}
                      disabled={rejectingId === showRejectModal}
                    />
                  </PasswordInputWrapper>
                  {rejectPasswordError && (
                    <ErrorText>{rejectPasswordError}</ErrorText>
                  )}
                </FormGroup>

                <ModalActions>
                  <ActionButton
                    $variant="secondary"
                    onClick={() => {
                      setShowRejectModal(null);
                      setRejectionReason('');
                      setRejectPassword('');
                      setRejectPasswordError(null);
                    }}
                    disabled={rejectingId === showRejectModal}
                  >
                    Cancel
                  </ActionButton>
                  <ActionButton
                    $variant="danger"
                    onClick={() => {
                      if (showRejectModal !== null) {
                        handleReject(showRejectModal, rejectionReason, rejectPassword);
                      }
                    }}
                    disabled={!rejectionReason.trim() || !rejectPassword.trim() || rejectingId === showRejectModal || showRejectModal === null}
                  >
                    {rejectingId === showRejectModal ? (
                      <>
                        <Loader2 style={{ animation: 'spin 1s linear infinite' }} />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle />
                        Reject
                      </>
                    )}
                  </ActionButton>
                </ModalActions>
              </ModalContent>
            </ModalOverlay>
          )}

          {/* Delete Modal */}
          {showDeleteModal && (() => {
            const revenueToDelete = revenues.find((r: Revenue) => r.id === showDeleteModal);

            return (
              <ModalOverlay $isOpen={showDeleteModal !== null} onClick={handleDeleteCancel}>
                <ModalContent onClick={(e) => e.stopPropagation()}>
                  <ModalHeader>
                    <ModalTitle>
                      <ModalAlertIcon size={20} />
                      Delete Revenue Entry
                    </ModalTitle>
                    <button onClick={handleDeleteCancel} title="Close" type="button">
                      <XCircle />
                    </button>
                  </ModalHeader>

                  <WarningBox>
                    <p>
                      You are about to permanently delete this revenue entry. This action cannot be undone.
                      Please enter your own password to verify this action.
                    </p>
                  </WarningBox>

                  {revenueToDelete && (
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
                        color: TEXT_COLOR_DARK({ theme }),
                        margin: `0 0 ${theme.spacing.md} 0`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: theme.spacing.sm
                      }}>
                        <DollarSign size={18} />
                        Revenue Entry Details to be Deleted
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 200px' }}>
                            <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Title</strong>
                            <span style={{ fontSize: theme.typography.fontSizes.md, color: TEXT_COLOR_DARK({ theme }), fontWeight: theme.typography.fontWeights.medium }}>
                              {getItemType(revenueToDelete.title) || revenueToDelete.title || 'N/A'}
                            </span>
                          </div>
                          <div style={{ flex: '1 1 200px' }}>
                            <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</strong>
                            <span style={{ fontSize: theme.typography.fontSizes.lg, fontWeight: theme.typography.fontWeights.bold, color: '#16a34a' }}>
                              {formatCurrency(revenueToDelete.amount)}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, flexWrap: 'wrap' }}>
                          <div>
                            <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</strong>
                            <CategoryBadge>{revenueToDelete.category || 'N/A'}</CategoryBadge>
                          </div>
                          <div>
                            <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</strong>
                            {(() => {
                              const status = getStatus(revenueToDelete as Revenue);
                              return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, flexWrap: 'wrap' }}>
                                  <StatusBadge $status={status}>
                                    {status === 'approved'
                                      ? 'Approved'
                                      : status === 'rejected'
                                        ? 'Rejected'
                                        : 'Pending'}
                                  </StatusBadge>
                                  {revenueToDelete.is_recurring && (
                                    <RecurringBadge>Recurring</RecurringBadge>
                                  )}
                                  {isAutoGenerated(revenueToDelete) && (
                                    <AutoGeneratedBadge>
                                      <Calculator />
                                      Auto
                                    </AutoGeneratedBadge>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                        {(revenueToDelete.source || revenueToDelete.date) && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap', paddingTop: theme.spacing.sm, borderTop: '1px solid ' + theme.colors.border }}>
                            {revenueToDelete.source && (
                              <div style={{ flex: '1 1 200px' }}>
                                <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Source</strong>
                                <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK({ theme }) }}>
                                  {revenueToDelete.source}
                                </span>
                              </div>
                            )}
                            <div style={{ flex: '1 1 200px' }}>
                              <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</strong>
                              <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK({ theme }) }}>
                                {formatDate(revenueToDelete.date)}
                              </span>
                            </div>
                          </div>
                        )}
                        {(revenueToDelete.description || revenueToDelete.recurring_frequency) && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.sm, paddingTop: theme.spacing.sm, borderTop: '1px solid ' + theme.colors.border }}>
                            {revenueToDelete.description && (
                              <div>
                                <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</strong>
                                <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK({ theme }), lineHeight: 1.6 }}>
                                  {revenueToDelete.description}
                                </span>
                              </div>
                            )}
                            {revenueToDelete.recurring_frequency && (
                              <div>
                                <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED, marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recurring Frequency</strong>
                                <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK({ theme }) }}>
                                  {revenueToDelete.recurring_frequency}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <FormGroup>
                    <StyledLabel htmlFor="delete-password">
                      <Lock size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                      Enter <strong>your own password</strong> to confirm deletion:
                    </StyledLabel>
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
                          if (e.key === 'Enter' && deletePassword.trim() && showDeleteModal !== null && !verifyingPassword && !deletingId) {
                            handleDelete(showDeleteModal, deletePassword);
                          }
                        }}
                        disabled={verifyingPassword || deletingId === showDeleteModal}
                      />
                      <button
                        type="button"
                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                        title={showDeletePassword ? 'Hide password' : 'Show password'}
                        disabled={verifyingPassword || deletingId === showDeleteModal}
                      >
                        {showDeletePassword ? <EyeOff /> : <Eye />}
                      </button>
                    </PasswordInputWrapper>
                    {deletePasswordError && (
                      <ErrorText>{deletePasswordError}</ErrorText>
                    )}
                  </FormGroup>

                  <ModalActions>
                    <ActionButton
                      $variant="secondary"
                      onClick={handleDeleteCancel}
                      disabled={deletingId === showDeleteModal}
                    >
                      Cancel
                    </ActionButton>
                    <ActionButton
                      $variant="danger"
                      onClick={() => {
                        if (showDeleteModal !== null) {
                          handleDelete(showDeleteModal, deletePassword);
                        }
                      }}
                      disabled={!deletePassword.trim() || deletingId === showDeleteModal || verifyingPassword || showDeleteModal === null}
                    >
                      {verifyingPassword ? (
                        <>
                          <Loader2 style={{ animation: 'spin 1s linear infinite' }} />
                          Verifying...
                        </>
                      ) : deletingId === showDeleteModal ? (
                        <>
                          <Loader2 style={{ animation: 'spin 1s linear infinite' }} />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 />
                          Delete Revenue Entry
                        </>
                      )}
                    </ActionButton>
                  </ModalActions>
                </ModalContent>
              </ModalOverlay>
            );
          })()}
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
}
