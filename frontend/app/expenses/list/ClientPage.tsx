'use client';
import { useState, useEffect, useCallback } from 'react';
import styled, { useTheme } from 'styled-components';
import Link from 'next/link';
import {
  AlertCircle,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Search,
  Loader2,
  CheckCircle,
  XCircle,
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
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PRIMARY_COLOR = (props: any) => props.theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = (props: any) => props.theme.colors.textDark;
const TEXT_COLOR_MUTED = (props: any) => props.theme.colors.textSecondary || '#666';
const BORDER_COLOR = (props: any) => props.theme.colors.border;
const BACKGROUND_CARD = (props: any) => props.theme.colors.background || '#ffffff';
const BACKGROUND_PAGE = (props: any) => props.theme.colors.backgroundSecondary || '#f5f6fa';

const CardShadow = (props: any) => props.theme.mode === 'dark'
  ? '0 4px 20px rgba(0,0,0,0.4)'
  : `0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.03), inset 0 0 0 1px rgba(0, 0, 0, 0.02)`;

const CardShadowHover = (props: any) => props.theme.mode === 'dark'
  ? '0 8px 30px rgba(0,0,0,0.5)'
  : `0 8px 12px -2px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(0, 0, 0, 0.02)`;

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
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${props => `color-mix(in srgb, ${props.theme.colors.primary}, black 20%)`} 100%);
  color: ${props => props.theme.colors.primaryForeground};
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: ${props => props.theme.borderRadius.md};
  border-bottom: 3px solid ${props => `color-mix(in srgb, ${props.theme.colors.primaryForeground}, transparent 90%)`};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${props => props.theme.spacing.md};
`;

const HeaderContent = styled.div`
  flex: 1;
  
  h1 {
    font-size: clamp(24px, 3vw, 36px);
    font-weight: ${props => props.theme.typography.fontWeights.bold};
    margin: 0 0 ${props => props.theme.spacing.xs};
    color: ${props => props.theme.colors.primaryForeground};
  }
  
  p {
    font-size: ${props => props.theme.typography.fontSizes.md};
    font-weight: ${props => props.theme.typography.fontWeights.medium};
    opacity: 0.9;
    margin: 0;
    color: ${props => `color-mix(in srgb, ${props.theme.colors.primaryForeground}, transparent 5%)`};
  }
`;

const AddButton = styled(Button)`
  background: ${props => `color-mix(in srgb, ${props.theme.colors.primaryForeground}, transparent 85%)`};
  border: 1px solid ${props => `color-mix(in srgb, ${props.theme.colors.primaryForeground}, transparent 70%)`};
  color: ${props => props.theme.colors.primaryForeground};
  backdrop-filter: blur(8px);
  transition: all ${props => props.theme.transitions.default};

  &:hover {
    background: ${props => `color-mix(in srgb, ${props.theme.colors.primaryForeground}, transparent 75%)`};
    border-color: ${props => `color-mix(in srgb, ${props.theme.colors.primaryForeground}, transparent 50%)`};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
`;

const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)'};
  border: 1px solid ${props => props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.theme.mode === 'dark' ? '#fca5a5' : '#dc2626'};
  font-size: ${props => props.theme.typography.fontSizes.sm};

  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }
`;

const FiltersContainer = styled.div`
  background: ${BACKGROUND_CARD};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${BORDER_COLOR};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  box-shadow: ${CardShadow};
  transition: box-shadow ${props => props.theme.transitions.default};

  &:hover {
    box-shadow: ${CardShadowHover};
  }
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: ${props => props.theme.spacing.sm};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${props => props.theme.spacing.sm};
  }
`;

const SearchContainer = styled.div`
  position: relative;
  grid-column: span 1;

  svg {
    position: absolute;
    left: ${props => props.theme.spacing.md};
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
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md} ${props => props.theme.spacing.sm} 40px;
  border: 1px solid ${BORDER_COLOR};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${BACKGROUND_CARD};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_DARK};
  transition: all ${props => props.theme.transitions.default};

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
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border: 1px solid ${BORDER_COLOR};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${BACKGROUND_CARD};
  color: ${TEXT_COLOR_DARK};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.default};

  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
  }
`;

const TableContainer = styled.div`
  background: ${BACKGROUND_CARD};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${BORDER_COLOR};
  box-shadow: ${CardShadow};
  overflow: hidden;
`;

const EmptyState = styled.div`
  padding: ${props => props.theme.spacing.xxl};
  text-align: center;
  color: ${TEXT_COLOR_MUTED};

  svg {
    width: 48px;
    height: 48px;
    margin: 0 auto ${props => props.theme.spacing.md};
    opacity: 0.5;
  }

  h3 {
    font-size: ${props => props.theme.typography.fontSizes.lg};
    font-weight: ${props => props.theme.typography.fontWeights.bold};
    margin: 0 0 ${props => props.theme.spacing.sm};
    color: ${TEXT_COLOR_DARK};
  }

  p {
    font-size: ${props => props.theme.typography.fontSizes.md};
    margin: 0 0 ${props => props.theme.spacing.md};
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
`;

const TableHeader = styled.thead`
  background: ${BACKGROUND_PAGE};
  border-bottom: 2px solid ${BORDER_COLOR};
  
  th {
    text-align: left;
    padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
    font-weight: ${props => props.theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_MUTED};
    font-size: ${props => props.theme.typography.fontSizes.xs};
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
`;

const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid ${BORDER_COLOR};
    transition: background-color ${props => props.theme.transitions.default};
    
    &:hover {
      background-color: ${BACKGROUND_PAGE};
    }
    
    &:last-child {
      border-bottom: none;
    }
    
    td {
      padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
      color: ${TEXT_COLOR_DARK};
      font-size: ${props => props.theme.typography.fontSizes.sm};
    }
  }
`;

const StatusBadge = styled.span<{ $status: 'approved' | 'pending' | 'rejected' }>`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSizes.xs};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  margin-right: ${props => props.theme.spacing.sm};
  background: ${props => {
    if (props.$status === 'approved') return (props.theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)');
    if (props.$status === 'rejected') return (props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.12)');
    return (props.theme.mode === 'dark' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.12)');
  }};
  color: ${props => {
    if (props.$status === 'approved') return (props.theme.mode === 'dark' ? '#6ee7b7' : '#065f46');
    if (props.$status === 'rejected') return (props.theme.mode === 'dark' ? '#fca5a5' : '#991b1b');
    return (props.theme.mode === 'dark' ? '#fcd34d' : '#92400e');
  }};
`;

const RecurringBadge = styled.span`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSizes.xs};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  background: ${props => props.theme.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)'};
  color: ${props => props.theme.mode === 'dark' ? '#93c5fd' : '#1e40af'};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  align-items: center;
`;

const ActionButton = styled.button<{ $variant?: 'primary' | 'danger' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border: 1px solid ${BORDER_COLOR};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSizes.xs};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.default};
  background: ${BACKGROUND_CARD};
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
        background: ${props.theme.colors.backgroundSecondary};
        border-color: ${PRIMARY_COLOR(props)};
        color: ${PRIMARY_COLOR(props)};
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
  gap: ${props => props.theme.spacing.md};
  
  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${props => props.theme.typography.fontSizes.md};
    margin: 0;
  }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${BORDER_COLOR};
  border-top-color: ${PRIMARY_COLOR};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ExpenseTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  
  svg {
    width: 16px;
    height: 16px;
    color: ${TEXT_COLOR_MUTED};
    flex-shrink: 0;
  }
  
  span {
    font-weight: ${props => props.theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_DARK};
  }
`;

const ModalOverlay = styled.div<{ $isOpen: boolean }>`
  position: fixed;
  inset: 0;
  background: ${props => props.theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)'};
  display: ${props => props.$isOpen ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: ${BACKGROUND_CARD};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${BORDER_COLOR};
  padding: ${props => props.theme.spacing.lg};
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: ${props => props.theme.mode === 'dark' ? '0 20px 60px rgba(0, 0, 0, 0.6)' : '0 20px 60px rgba(0, 0, 0, 0.3)'};
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
  border-bottom: 1px solid ${BORDER_COLOR};
  
  h3 {
    font-size: ${props => props.theme.typography.fontSizes.lg};
    font-weight: ${props => props.theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${props => props.theme.spacing.sm};
  }
  
  button {
    background: none;
    border: none;
    cursor: pointer;
    color: ${TEXT_COLOR_MUTED};
    padding: ${props => props.theme.spacing.xs};
    border-radius: ${props => props.theme.borderRadius.sm};
    transition: all ${props => props.theme.transitions.default};
    
    &:hover {
      background: ${BACKGROUND_PAGE};
      color: ${TEXT_COLOR_DARK};
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
  color: ${TEXT_COLOR_DARK};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const StyledLabel = styled.label`
  display: block;
  font-size: ${props => props.theme.typography.fontSizes.sm};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
  margin-bottom: ${props => props.theme.spacing.sm};
`;

const PasswordInputWrapper = styled.div`
  position: relative;
  align-items: center;
  
  input {
    width: 100%;
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    padding-right: 48px;
    border: 1px solid ${BORDER_COLOR};
    border-radius: ${props => props.theme.borderRadius.md};
    background: ${BACKGROUND_CARD};
    font-size: ${props => props.theme.typography.fontSizes.md};
    color: ${TEXT_COLOR_DARK};
    transition: all ${props => props.theme.transitions.default};
    
    &:focus {
      outline: none;
      border-color: ${PRIMARY_COLOR};
      box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
    }
    
    &::placeholder {
      color: ${TEXT_COLOR_MUTED};
      opacity: 0.5;
    }
    
    &:disabled {
      background-color: ${BACKGROUND_PAGE};
      color: ${TEXT_COLOR_MUTED};
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
    color: ${TEXT_COLOR_MUTED};
    padding: ${props => props.theme.spacing.xs};
    border-radius: ${props => props.theme.borderRadius.sm};
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all ${props => props.theme.transitions.default};
    
    &:hover {
      color: ${TEXT_COLOR_DARK};
      background: ${BACKGROUND_PAGE};
    }
    
    svg {
      width: 18px;
      height: 18px;
    }
  }
`;

const FormGroup = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
`;

const ErrorText = styled.p`
  color: ${props => props.theme.mode === 'dark' ? '#fca5a5' : '#dc2626'};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  margin: ${props => props.theme.spacing.xs} 0 0 0;
`;

const WarningBox = styled.div`
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)'};
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

const ModalAlertIcon = styled(XCircle)`
  color: #ef4444;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-top: 1px solid ${BORDER_COLOR};
  background: ${BACKGROUND_CARD};
  margin-top: ${props => props.theme.spacing.md};
  border-radius: 0 0 ${props => props.theme.borderRadius.md} ${props => props.theme.borderRadius.md};
`;

const PaginationActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
  align-items: center;
`;

const PageInfo = styled.span`
  font-size: ${props => props.theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
`;

const PageButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.$active ? PRIMARY_COLOR(props) : BORDER_COLOR(props)};
  background: ${props => props.$active ? PRIMARY_COLOR(props) : BACKGROUND_CARD(props)};
  color: ${props => props.$active ? props.theme.colors.primaryForeground : TEXT_COLOR_DARK(props)};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.default};

  &:hover:not(:disabled) {
    border-color: ${PRIMARY_COLOR};
    color: ${props => props.$active ? props.theme.colors.primaryForeground : PRIMARY_COLOR(props)};
    background: ${props => props.$active ? PRIMARY_COLOR(props) : props.theme.colors.backgroundSecondary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: ${props => props.theme.spacing.md};
  border: 1px solid ${BORDER_COLOR};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${BACKGROUND_CARD};
  color: ${TEXT_COLOR_DARK};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  transition: all ${props => props.theme.transitions.default};

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
  gap: ${props => props.theme.spacing.md};
  justify-content: flex-end;
  margin-top: ${props => props.theme.spacing.lg};
`;

interface Expense {
  id: number;
  title: string;
  description?: string | null;
  category: string;
  amount: number;
  vendor?: string | null;
  date: string;
  is_recurring: boolean;
  recurring_frequency?: string | null;
  is_approved: boolean;
  created_by_id: number;
  created_at: string;
  updated_at?: string | null;
  approval_status?: 'pending' | 'approved' | 'rejected';
}

interface ApiExpense {
  id: number;
  title: string;
  description?: string | null;
  category: string;
  amount: number;
  vendor?: string | null;
  date: string;
  is_recurring?: boolean;
  recurring_frequency?: string | null;
  is_approved?: boolean;
  created_by_id?: number;
  created_at: string;
  updated_at?: string | null;
  approval_status?: 'pending' | 'approved' | 'rejected';
}

export default function ExpenseListPage() {
  const theme = useTheme();
  const { user } = useAuth();
  const { canApproveTransactions } = useUserStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
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
  const [showDeleteModal, setShowDeleteModal] = useState<number | null>(null);
  const [deletePassword, setDeletePassword] = useState<string>('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [verifyingPassword, setVerifyingPassword] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getStatus = (expense: Expense) =>
    expense.approval_status || (expense.is_approved ? 'approved' : 'pending');
  const normalizeExpenses = (items: ApiExpense[] = []): Expense[] =>
    items.map((exp) => ({
      ...exp,
      is_recurring: exp.is_recurring ?? false,
      is_approved: exp.is_approved ?? false,
      approval_status: exp.approval_status || (exp.is_approved ? 'approved' : 'pending'),
      created_by_id: exp.created_by_id ?? 0
    }));

  const canApprove = () => {
    if (canApproveTransactions()) return true;
    if (!user) return false;
    const role = user.role?.toLowerCase();
    return role === 'admin' || role === 'super_admin' || role === 'manager' || role === 'finance_manager';
  };

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getExpenses();
      const rawData = Array.isArray(response.data) ? response.data : [];
      const apiExpenses: ApiExpense[] = rawData.map((item) => ({
        id: Number((item as { id?: number }).id) || 0,
        title: (item as { title?: string }).title || '',
        description: (item as { description?: string | null }).description ?? null,
        category: (item as { category?: string }).category || '',
        amount: Number((item as { amount?: number }).amount) || 0,
        vendor: (item as { vendor?: string | null }).vendor ?? null,
        date: (item as { date?: string }).date || '',
        is_recurring: Boolean((item as { is_recurring?: boolean }).is_recurring),
        recurring_frequency: (item as { recurring_frequency?: string | null }).recurring_frequency ?? null,
        is_approved: Boolean((item as { is_approved?: boolean }).is_approved),
        created_by_id: Number((item as { created_by_id?: number }).created_by_id) || 0,
        created_at: (item as { created_at?: string }).created_at || '',
        updated_at: (item as { updated_at?: string | null }).updated_at ?? null,
        approval_status: (item as { approval_status?: 'pending' | 'approved' | 'rejected' }).approval_status
      }));
      setExpenses(normalizeExpenses(apiExpenses));
    } catch (err: unknown) {
      const errorMessage =
        (err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) || 'Failed to load expenses';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

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
      await apiClient.deleteExpense(id, password.trim());
      toast.success('Expense deleted successfully');
      setShowDeleteModal(null);
      setDeletePassword('');
      setShowDeletePassword(false);
      loadExpenses();
    } catch (err: unknown) {
      const errorMessage =
        (err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) || 'Failed to delete expense';
      setDeletePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeletingId(null);
      setVerifyingPassword(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!canApprove()) {
      toast.error('You do not have permission to approve expenses');
      return;
    }

    setApprovingId(id);
    try {
      await apiClient.approveItem(id, 'expense');
      toast.success('Expense approved successfully');
      setExpenses(prev =>
        prev.map(exp =>
          exp.id === id
            ? { ...exp, is_approved: true, approval_status: 'approved' }
            : exp
        )
      );
    } catch (err: unknown) {
      const errorMessage =
        (err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) || 'Failed to approve expense';
      toast.error(errorMessage);
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (id: number, reason: string, password: string) => {
    if (!canApprove()) {
      toast.error('You do not have permission to reject expenses');
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
      await apiClient.rejectItem(id, 'expense', reason, password.trim());
      toast.success('Expense rejected successfully');
      setShowRejectModal(null);
      setRejectionReason('');
      setRejectPassword('');
      setExpenses(prev =>
        prev.map(exp =>
          exp.id === id ? { ...exp, approval_status: 'rejected', is_approved: false } : exp
        )
      );
    } catch (err: unknown) {
      const errorMessage =
        (err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) || 'Failed to reject expense';
      setRejectPasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setRejectingId(null);
    }
  };

  const getItemType = (title: string): string => {
    if (!title) return '';

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

  const categories = Array.from(new Set(expenses.map(e => e.category).filter(Boolean)));

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch =
      expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    const status = getStatus(expense);
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
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const paginatedExpenses = filteredExpenses.slice(
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
              <p>Loading expenses...</p>
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
              <h1>Expenses</h1>
              <p>Manage expense entries</p>
            </HeaderContent>
            <Link href="/expenses/items">
              <AddButton>
                <Plus size={16} style={{ marginRight: theme.spacing.xs }} />
                Add Expenses
              </AddButton>
            </Link>
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
                  placeholder="Search expenses..."
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
                <option value="all">All Statuses</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </Select>
            </FiltersGrid>
          </FiltersContainer>

          <TableContainer>
            {filteredExpenses.length === 0 ? (
              <EmptyState>
                <DollarSign />
                <h3>
                  {expenses.length === 0 ? 'No expenses found' : 'No expenses match your filters'}
                </h3>
                <p>
                  {expenses.length === 0
                    ? 'Get started by adding your first expense entry.'
                    : 'Try adjusting your search or filter criteria.'}
                </p>
                {expenses.length === 0 && (
                  <Link href="/expenses/items" style={{ marginTop: theme.spacing.md, display: 'inline-block' }}>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Expenses
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
                      <th>Vendor</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {paginatedExpenses.map((expense) => {
                      const status = getStatus(expense);
                      const isPending = status === 'pending';
                      return (
                        <tr key={expense.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <ExpenseTitle>
                              <DollarSign />
                              <span>{getItemType(expense.title)}</span>
                            </ExpenseTitle>
                          </td>
                          <td style={{ whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                            {expense.category || 'N/A'}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <span style={{ fontWeight: theme.typography.fontWeights.bold, color: TEXT_COLOR_DARK({ theme }) }}>
                              {formatCurrency(expense.amount)}
                            </span>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>{expense.vendor || 'N/A'}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>{formatDate(expense.date)}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <StatusBadge $status={status}>
                              {status === 'approved'
                                ? 'Approved'
                                : status === 'rejected'
                                  ? 'Rejected'
                                  : 'Pending'}
                            </StatusBadge>
                            {expense.is_recurring && (
                              <RecurringBadge>Recurring</RecurringBadge>
                            )}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <ActionButtons>
                              <Link href={`/expenses/edit/${expense.id}`}>
                                <ActionButton $variant="secondary" title="Edit">
                                  <Edit />
                                </ActionButton>
                              </Link>
                              {isPending && !expense.is_approved && canApprove() && (
                                <>
                                  <ActionButton
                                    $variant="primary"
                                    onClick={() => handleApprove(expense.id)}
                                    disabled={approvingId === expense.id || rejectingId === expense.id}
                                    style={{ background: PRIMARY_COLOR({ theme }), color: 'white', borderColor: PRIMARY_COLOR({ theme }) }}
                                  >
                                    {approvingId === expense.id ? (
                                      <Loader2 style={{ animation: 'spin 1s linear infinite' }} />
                                    ) : (
                                      <CheckCircle />
                                    )}
                                    Approve
                                  </ActionButton>
                                  <ActionButton
                                    $variant="danger"
                                    onClick={() => {
                                      setShowRejectModal(expense.id);
                                      setRejectionReason('');
                                      setRejectPassword('');
                                      setRejectPasswordError(null);
                                    }}
                                    disabled={approvingId === expense.id || rejectingId === expense.id}
                                  >
                                    <XCircle />
                                    Reject
                                  </ActionButton>
                                </>
                              )}
                              <ActionButton
                                $variant="danger"
                                onClick={() => handleDeleteClick(expense.id)}
                                disabled={deletingId === expense.id || approvingId === expense.id || rejectingId === expense.id}
                                style={{ color: '#dc2626' }}
                                title="Delete"
                              >
                                {deletingId === expense.id ? (
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
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredExpenses.length)} of {filteredExpenses.length} entries
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
                          return <span key={pageNum} style={{ color: TEXT_COLOR_MUTED({ theme }) }}>...</span>;
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
                  Reject Expense Entry
                </ModalTitle>

                <WarningBox>
                  <p>
                    You are about to reject this expense entry. This action cannot be undone.
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
            const expenseToDelete = expenses.find((e: Expense) => e.id === showDeleteModal);

            return (
              <ModalOverlay $isOpen={showDeleteModal !== null} onClick={handleDeleteCancel}>
                <ModalContent onClick={(e) => e.stopPropagation()}>
                  <ModalHeader>
                    <ModalTitle>
                      <ModalAlertIcon size={20} />
                      Delete Expense Entry
                    </ModalTitle>
                    <button onClick={handleDeleteCancel} title="Close" type="button">
                      <XCircle />
                    </button>
                  </ModalHeader>

                  <WarningBox>
                    <p>
                      You are about to permanently delete this expense entry. This action cannot be undone.
                      Please enter your own password to verify this action.
                    </p>
                  </WarningBox>

                  {expenseToDelete && (
                    <div style={{
                      background: BACKGROUND_PAGE({ theme }),
                      border: '1px solid ' + BORDER_COLOR({ theme }),
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
                        Expense Entry Details to be Deleted
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap' }}>
                          <div style={{ flex: '1 1 200px' }}>
                            <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED({ theme }), marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Title</strong>
                            <span style={{ fontSize: theme.typography.fontSizes.md, color: TEXT_COLOR_DARK({ theme }), fontWeight: theme.typography.fontWeights.medium }}>
                              {getItemType(expenseToDelete.title) || expenseToDelete.title || 'N/A'}
                            </span>
                          </div>
                          <div style={{ flex: '1 1 200px' }}>
                            <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED({ theme }), marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</strong>
                            <span style={{ fontSize: theme.typography.fontSizes.lg, fontWeight: theme.typography.fontWeights.bold, color: TEXT_COLOR_DARK({ theme }) }}>
                              {formatCurrency(expenseToDelete.amount)}
                            </span>
                          </div>
                        </div>
                        {expenseToDelete.description && (
                          <div>
                            <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED({ theme }), marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</strong>
                            <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK({ theme }), lineHeight: 1.6 }}>
                              {expenseToDelete.description}
                            </span>
                          </div>
                        )}
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, flexWrap: 'wrap' }}>
                          <div>
                            <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED({ theme }), marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</strong>
                            <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK({ theme }), textTransform: 'capitalize' }}>
                              {expenseToDelete.category || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED({ theme }), marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</strong>
                            {(() => {
                              const status = getStatus(expenseToDelete as Expense);
                              return (
                                <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, flexWrap: 'wrap' }}>
                                  <StatusBadge $status={status}>
                                    {status === 'approved'
                                      ? 'Approved'
                                      : status === 'rejected'
                                        ? 'Rejected'
                                        : 'Pending'}
                                  </StatusBadge>
                                  {expenseToDelete.is_recurring && (
                                    <RecurringBadge>Recurring</RecurringBadge>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                        {(expenseToDelete.vendor || expenseToDelete.date) && (
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: theme.spacing.md, flexWrap: 'wrap', paddingTop: theme.spacing.sm, borderTop: '1px solid ' + BORDER_COLOR({ theme }) }}>
                            {expenseToDelete.vendor && (
                              <div style={{ flex: '1 1 200px' }}>
                                <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED({ theme }), marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Vendor</strong>
                                <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK({ theme }) }}>
                                  {expenseToDelete.vendor}
                                </span>
                              </div>
                            )}
                            <div style={{ flex: '1 1 200px' }}>
                              <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED({ theme }), marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Date</strong>
                              <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK({ theme }) }}>
                                {formatDate(expenseToDelete.date)}
                              </span>
                            </div>
                          </div>
                        )}
                        {expenseToDelete.recurring_frequency && (
                          <div style={{ paddingTop: theme.spacing.sm, borderTop: '1px solid ' + BORDER_COLOR({ theme }) }}>
                            <strong style={{ display: 'block', fontSize: theme.typography.fontSizes.xs, color: TEXT_COLOR_MUTED({ theme }), marginBottom: theme.spacing.xs, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Recurring Frequency</strong>
                            <span style={{ fontSize: theme.typography.fontSizes.sm, color: TEXT_COLOR_DARK({ theme }) }}>
                              {expenseToDelete.recurring_frequency}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <FormGroup>
                    <StyledLabel htmlFor="delete-password">
                      <Lock size={16} style={{ display: 'inline-block', marginRight: '8px', verticalAlign: 'middle' }} />
                      Enter <strong>your own password</strong> to confirm deletion of <strong>{expenseToDelete ? (getItemType(expenseToDelete.title) || expenseToDelete.title || 'this expense') : 'this expense'}</strong>:
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
                          Delete Expense Entry
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