'use client';
import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {
  AlertCircle, ArrowUpRight, ArrowDownRight,
  Search, TrendingUp, ShoppingCart, Package, Download,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { toast } from 'sonner';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/rbac/auth-context';
import useUserStore from '@/store/userStore';
import { theme } from '@/components/common/theme';

const PRIMARY_COLOR = (props: any) => props.theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = (props: any) => props.theme.colors.textDark;
const TEXT_COLOR_MUTED = (props: any) => props.theme.colors.textSecondary || '#666';
const BORDER_COLOR = (props: any) => props.theme.colors.border;
const BACKGROUND_CARD = (props: any) => props.theme.colors.background || '#ffffff';
const BACKGROUND_SECONDARY = (props: any) => props.theme.colors.backgroundSecondary || '#f5f6fa';

const CardShadow = (props: any) => props.theme.mode === 'dark'
  ? '0 4px 16px rgba(0, 0, 0, 0.4)'
  : `0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.03), inset 0 0 0 1px rgba(0, 0, 0, 0.02)`;

const CardShadowHover = (props: any) => props.theme.mode === 'dark'
  ? '0 12px 28px rgba(0, 0, 0, 0.5)'
  : `0 8px 12px -2px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(0, 0, 0, 0.03)`;

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
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: #ffffff;
  padding: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: ${props => props.theme.borderRadius.md};
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
  
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

const ErrorBanner = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.lg};
  background-color: ${props => props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)'};
  border: 1px solid ${props => props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(239, 68, 68, 0.3)'};
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.theme.mode === 'dark' ? '#fca5a5' : '#dc2626'};
  font-size: ${props => props.theme.typography.fontSizes.sm};

  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const BottomSummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SummaryCard = styled.div<{ $type?: 'revenue' | 'expense' | 'net' | 'total' | 'inventory' }>`
  background: ${BACKGROUND_CARD};
  border: 1px solid ${BORDER_COLOR};
  padding: ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: ${CardShadow};
  transition: transform ${props => props.theme.transitions.default}, box-shadow ${props => props.theme.transitions.default};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${CardShadowHover};
  }

  .label {
    font-size: ${props => props.theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
    margin-bottom: ${props => props.theme.spacing.sm};
    font-weight: ${props => props.theme.typography.fontWeights.medium};
  }

  .value {
    font-size: clamp(20px, 3vw, 24px);
    font-weight: ${props => props.theme.typography.fontWeights.bold};
    color: ${props => {
    const isDark = props.theme.mode === 'dark';
    if (props.$type === 'revenue') return isDark ? '#4ade80' : '#16a34a';
    if (props.$type === 'expense') return isDark ? '#f87171' : '#dc2626';
    if (props.$type === 'inventory') return isDark ? '#818cf8' : '#1118d3ff';
    if (props.$type === 'net') return TEXT_COLOR_DARK;
    return TEXT_COLOR_DARK;
  }};
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
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: ${props => props.theme.spacing.sm};
  align-items: center;
  
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
    margin: 0;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
`;

const TableHeader = styled.thead`
  background: ${BACKGROUND_SECONDARY};
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
      background-color: ${BACKGROUND_SECONDARY};
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

const TypeBadge = styled.span<{ $type: 'revenue' | 'expense' | 'sale' | 'inventory' }>`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.xs};
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSizes.xs};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  background: ${props => {
    const isDark = props.theme.mode === 'dark';
    if (props.$type === 'revenue') return isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)';
    if (props.$type === 'expense') return isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.12)';
    if (props.$type === 'sale') return isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)';
    if (props.$type === 'inventory') return isDark ? 'rgba(168, 85, 247, 0.2)' : 'rgba(168, 85, 247, 0.12)';
    return isDark ? 'rgba(107, 114, 128, 0.2)' : 'rgba(107, 114, 128, 0.12)';
  }};
  color: ${props => {
    const isDark = props.theme.mode === 'dark';
    if (props.$type === 'revenue') return isDark ? '#6ee7b7' : '#065f46';
    if (props.$type === 'expense') return isDark ? '#fca5a5' : '#991b1b';
    if (props.$type === 'sale') return isDark ? '#93c5fd' : '#1e40af';
    if (props.$type === 'inventory') return isDark ? '#c4b5fd' : '#6b21a8';
    return isDark ? '#d1d5db' : '#374151';
  }};
`;

const AmountCell = styled.td<{ $isExpense: boolean }>`
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  color: ${props => {
    const isDark = props.theme.mode === 'dark';
    return props.$isExpense ? (isDark ? '#f87171' : '#dc2626') : (isDark ? '#4ade80' : '#16a34a');
  }} !important;
`;

const CategoryBadge = styled.span`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSizes.xs};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  background: ${props => props.theme.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)'};
  color: ${props => props.theme.mode === 'dark' ? '#93c5fd' : '#1e40af'};
`;

const StatusBadge = styled.span<{ $approved: boolean; $status?: string }>`
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.sm};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: ${props => props.theme.typography.fontSizes.xs};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  background: ${props => {
    const isDark = props.theme.mode === 'dark';
    if (props.$status === 'posted') return isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)';
    if (props.$status === 'cancelled') return isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.12)';
    if (props.$approved) return isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)';
    return isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.12)';
  }};
  color: ${props => {
    const isDark = props.theme.mode === 'dark';
    if (props.$status === 'posted') return isDark ? '#6ee7b7' : '#065f46';
    if (props.$status === 'cancelled') return isDark ? '#fca5a5' : '#991b1b';
    if (props.$approved) return isDark ? '#6ee7b7' : '#065f46';
    return isDark ? '#fcd34d' : '#92400e';
  }};
  margin-right: ${props => props.theme.spacing.sm};
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

const TransactionTitle = styled.div`
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
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
  border: 1px solid ${props => props.$active ? PRIMARY_COLOR : BORDER_COLOR};
  background: ${props => props.$active ? PRIMARY_COLOR : BACKGROUND_CARD};
  color: ${props => props.$active ? '#ffffff' : TEXT_COLOR_DARK(props)};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  cursor: pointer;
  transition: all ${props => props.theme.transitions.default};

  &:hover:not(:disabled) {
    border-color: ${PRIMARY_COLOR};
    color: ${props => props.$active ? '#ffffff' : PRIMARY_COLOR};
    background: ${props => props.$active ? PRIMARY_COLOR : BACKGROUND_SECONDARY};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface Transaction {
  id: string;
  transaction_type: 'revenue' | 'expense' | 'sale' | 'inventory';
  title: string;
  description?: string | null;
  category: string;
  amount: number;
  date: string;
  is_approved: boolean;
  is_recurring?: boolean;
  recurring_frequency?: string | null;
  source?: string | null;
  vendor?: string | null;
  created_at: string;
  status?: 'pending' | 'posted' | 'cancelled' | 'active' | 'inactive';
  item_name?: string;
  quantity_sold?: number;
  quantity?: number;
  receipt_number?: string;
  customer_name?: string;
  sku?: string;
  buying_price?: number;
  total_cost?: number;
  created_by_id?: number;
  sold_by_id?: number;
}

type TransactionItem = Partial<Transaction> & {
  id: string;
  transaction_type: 'revenue' | 'expense' | 'sale' | 'inventory';
  title: string;
  category?: string;
  amount: number;
  date?: string;
  is_approved?: boolean;
  created_at?: string;
  status?: string;
  createdById?: number;
  soldById?: number;
  quantity?: number;
  item_name?: string;
};

const toNumber = (value: unknown): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

const toString = (value: unknown): string | undefined =>
  typeof value === 'string' ? value : undefined;

const toRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

interface TransactionSummary {
  totalRevenue: number;
  totalSales: number;
  totalExpenses: number;
  totalInventory: number;
  netAmount: number;
  totalTransactions: number;
}

export default function TransactionListPage() {
  const { user } = useAuth();
  const storeUser = useUserStore((state) => state.user);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [summary, setSummary] = useState<TransactionSummary>({
    totalRevenue: 0,
    totalSales: 0,
    totalExpenses: 0,
    totalInventory: 0,
    netAmount: 0,
    totalTransactions: 0,
  });
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  // Load summary data from backend
  const loadSummary = useCallback(async () => {
    if (!user) return;

    setLoadingSummary(true);
    try {
      const userRole = user?.role?.toLowerCase();
      const canViewFinancials = userRole === 'admin' || userRole === 'super_admin' ||
        userRole === 'finance_admin' || userRole === 'finance_manager' ||
        userRole === 'manager' || userRole === 'accountant';

      if (!canViewFinancials) {
        setLoadingSummary(false);
        return;
      }

      // Fetch all summary data from backend in parallel
      const [financialSummaryResult, salesSummaryResult, inventorySummaryResult] = await Promise.allSettled([
        apiClient.getFinancialSummary().catch(() => ({ data: null })),
        apiClient.getSalesSummary().catch(() => ({ data: null })),
        apiClient.getInventorySummary().catch(() => ({ data: null })),
      ]);

      // Extract financial summary
      let totalRevenue = 0;
      let totalExpenses = 0;
      if (financialSummaryResult.status === 'fulfilled') {
        const financialData = financialSummaryResult.value?.data;
        if (financialData?.financials) {
          totalRevenue = Number(financialData.financials.total_revenue || 0);
          totalExpenses = Number(financialData.financials.total_expenses || 0);
        }
      }

      // Extract sales summary
      let totalSales = 0;
      if (salesSummaryResult.status === 'fulfilled') {
        const salesData = salesSummaryResult.value?.data;
        if (salesData && typeof salesData === 'object' && 'total_revenue' in salesData) {
          totalSales = Number((salesData as { total_revenue?: number }).total_revenue || 0);
        }
      }

      // Extract inventory summary
      let totalInventory = 0;
      if (inventorySummaryResult.status === 'fulfilled') {
        const inventoryData = inventorySummaryResult.value?.data;
        if (inventoryData && typeof inventoryData === 'object' && 'total_cost_value' in inventoryData) {
          totalInventory = Number((inventoryData as { total_cost_value?: number }).total_cost_value || 0);
        }
      }

      const netAmount = totalRevenue + totalSales - totalExpenses - totalInventory;

      // Update summary - transaction count will be updated separately
      setSummary(prev => ({
        ...prev,
        totalRevenue,
        totalSales,
        totalExpenses,
        totalInventory,
        netAmount,
      }));
    } catch (err) {
      console.warn('Failed to load summary from backend:', err);
      // Don't show error, just use local calculations as fallback
    } finally {
      setLoadingSummary(false);
    }
  }, [user, storeUser?.managerId]);

  const loadTransactions = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const userRole = user?.role?.toLowerCase();
      const isFinanceAdmin = userRole === 'finance_manager' || userRole === 'finance_admin';
      const isAccountant = userRole === 'accountant';
      const isEmployee = userRole === 'employee';
      const isAdmin = userRole === 'admin' || userRole === 'super_admin';

      // Get accessible user IDs based on role
      // Admin/Super Admin: See all (no filtering)
      // Finance Admin: See their own + subordinates (ONLY accountants and employees, NOT other Finance Admins)
      // Accountant: See their own + their Finance Admin's team (ONLY accountants and employees, NOT other Finance Admins)
      // Employee: See only their own
      let userIds: number[] | null = null;

      if (isAdmin) {
        // Admin can see all - no filtering needed
        userIds = null;
      } else if (isFinanceAdmin && user?.id) {
        try {
          // Finance Admin: Get their own subordinates ONLY (accountants and employees)
          // Exclude other Finance Admins, Managers, and their subordinates
          const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
          const subordinatesRes = await apiClient.getSubordinates(userId);
          const subordinates = subordinatesRes?.data || [];

          // Filter subordinates to ONLY include accountants and employees (exclude other Finance Admins/Managers)
          const validSubordinateIds = subordinates
            .map((sub: { id?: number | string; role?: string }) => {
              const subId = typeof sub.id === 'string' ? parseInt(sub.id, 10) : Number(sub.id);
              const subRole = (sub.role || '').toLowerCase();

              // Only include accountants and employees, exclude Finance Admins and Managers
              if (!Number.isNaN(subId) && (subRole === 'accountant' || subRole === 'employee')) {
                return subId;
              }
              return undefined;
            })
            .filter((id): id is number => id !== undefined);

          // Include the finance admin themselves + their valid subordinates only
          userIds = [userId, ...validSubordinateIds];

          if (process.env.NODE_ENV === 'development') {
            console.log('Finance Admin - Accessible User IDs for Transactions:', {
              userId: userId,
              subordinatesCount: subordinates.length,
              validSubordinateIds: validSubordinateIds,
              userIds: userIds
            });
          }
        } catch (err) {
          console.warn('Failed to fetch subordinates, using only finance admin ID:', err);
          const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
          userIds = [userId];
        }
      } else if (isAccountant && user?.id) {
        // Accountant: Get their Finance Admin's (manager's) subordinates
        const accountantId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        let managerId: number | null = null;

        // Try to get managerId from storeUser first
        const managerIdStr = storeUser?.managerId;
        if (managerIdStr) {
          managerId = typeof managerIdStr === 'string' ? parseInt(managerIdStr, 10) : Number(managerIdStr);
        } else {
          // If not in storeUser, try to fetch current user profile from API
          try {
            const currentUserRes = await apiClient.getCurrentUser();
            const currentUserData = currentUserRes?.data;
            if (currentUserData?.manager_id !== undefined && currentUserData?.manager_id !== null) {
              managerId = typeof currentUserData.manager_id === 'string'
                ? parseInt(currentUserData.manager_id, 10)
                : Number(currentUserData.manager_id);
            }
          } catch (err) {
            console.warn('Failed to fetch current user profile for manager_id:', err);
          }
        }

        if (managerId) {
          try {
            const financeAdminId = managerId;

            // Get all subordinates of the Finance Admin
            const subordinatesRes = await apiClient.getSubordinates(financeAdminId);
            const subordinates = subordinatesRes?.data || [];

            // Filter subordinates to ONLY include accountants and employees (exclude other Finance Admins/Managers)
            const validSubordinateIds = subordinates
              .map((sub: { id?: number | string; role?: string }) => {
                const subId = typeof sub.id === 'string' ? parseInt(sub.id, 10) : Number(sub.id);
                const subRole = (sub.role || '').toLowerCase();

                // Only include accountants and employees, exclude Finance Admins and Managers
                if (!Number.isNaN(subId) && (subRole === 'accountant' || subRole === 'employee')) {
                  return subId;
                }
                return undefined;
              })
              .filter((id): id is number => id !== undefined);

            // Include the Finance Admin themselves and their valid subordinates only
            userIds = [financeAdminId, ...validSubordinateIds];

            if (process.env.NODE_ENV === 'development') {
              console.log('Accountant - Accessible User IDs for Transactions (from Finance Admin):', {
                accountantId: accountantId,
                financeAdminId: financeAdminId,
                subordinatesCount: subordinates.length,
                validSubordinateIds: validSubordinateIds,
                userIds: userIds
              });
            }
          } catch (err) {
            console.error('Failed to fetch Finance Admin subordinates for accountant:', err);
            // Fallback: if we can't get subordinates, at least try to show data from the Finance Admin
            userIds = [managerId];
          }
        } else {
          // Accountant has no manager assigned - fallback to just themselves
          console.warn('Accountant has no manager (Finance Admin) assigned - using only accountant ID');
          userIds = [accountantId];
        }
      } else if (isEmployee && user?.id) {
        // Employee: Can only see their own data
        const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        userIds = [userId];
      }

      // Fetch revenues, expenses, sales, and inventory items
      // Backend should already filter for most roles, but we'll apply additional filtering for Finance Admin
      const [transactionsResponse, salesResponse, inventoryResponse] = await Promise.all([
        apiClient.getTransactions().catch(() => ({ data: [] })),
        apiClient.getSales({ limit: 1000 }).catch(() => ({ data: [] })),
        apiClient.getInventoryItems({ limit: 1000 }).catch(() => ({ data: [] })),
      ]);

      let transactions = transactionsResponse.data || [];

      // Transform sales to transaction format
      const salesDataRaw = salesResponse?.data || [];
      const salesArray = Array.isArray(salesDataRaw) ? salesDataRaw : (toRecord(salesDataRaw).data as unknown[]) || [];
      let salesTransactions = salesArray.map((saleRaw): TransactionItem => {
        const sale = toRecord(saleRaw);
        const saleId = toNumber(sale.id) ?? 0;
        const soldById = toNumber(sale.sold_by_id ?? sale.soldBy ?? sale.sold_by);
        const createdById = toNumber(sale.created_by_id ?? sale.createdBy ?? sale.created_by);
        return {
          id: `sale-${saleId}`,
          transaction_type: 'sale',
          title: toString(sale.item_name) || `Sale #${saleId}`,
          description: toString(sale.customer_name)
            ? `Customer: ${sale.customer_name as string}`
            : toString(sale.notes) || `Receipt: ${toString(sale.receipt_number) || `#${saleId}`}`,
          category: toRecord(sale.item).category as string || 'Sales',
          amount: toNumber(sale.total_sale),
          date: toString(sale.created_at) || toString(sale.date),
          is_approved: sale.status === 'posted',
          created_at: toString(sale.created_at),
          status: (toString(sale.status) as Transaction['status']) || 'pending',
          item_name: toString(sale.item_name),
          quantity_sold: toNumber(sale.quantity_sold),
          receipt_number: toString(sale.receipt_number),
          customer_name: toString(sale.customer_name),
          soldById,
          createdById,
        };
      });

      // Transform inventory items to transaction format (treating creation as expense)
      const inventoryRaw = inventoryResponse?.data || [];
      const inventoryArray = Array.isArray(inventoryRaw) ? inventoryRaw : (toRecord(inventoryRaw).data as unknown[]) || [];
      let inventoryTransactions = inventoryArray.map((itemRaw): TransactionItem => {
        const item = toRecord(itemRaw);
        const itemId = toNumber(item.id);
        const quantity = toNumber(item.quantity);
        const buyingPrice = toNumber(item.buying_price);
        const unitCost = toNumber(item.total_cost) || buyingPrice;
        const totalCost = unitCost * quantity;
        const createdById = toNumber(item.created_by_id ?? item.createdBy ?? item.created_by);
        return {
          id: `inventory-${itemId}`,
          transaction_type: 'inventory',
          title: toString(item.item_name) || `Inventory Item #${itemId}`,
          description: toString(item.description) || `SKU: ${toString(item.sku) || 'N/A'}`,
          category: toString(item.category) || 'Inventory',
          amount: totalCost,
          date: toString(item.created_at) || toString(item.date),
          is_approved: item.is_active !== false,
          created_at: toString(item.created_at),
          status: (item.is_active === false ? 'inactive' : 'active') as Transaction['status'],
          item_name: toString(item.item_name),
          quantity,
          sku: toString(item.sku),
          buying_price: buyingPrice,
          total_cost: totalCost,
          createdById,
        };
      });

      // Apply role-based filtering
      // Admin/Super Admin: See all (no filtering)
      // Finance Admin: Filter to only their team's transactions (themselves + subordinates who are accountants/employees)
      // Accountant: Filter to only their Finance Admin's team transactions (Finance Admin + subordinates who are accountants/employees)
      // Employee: Filter to only their own transactions
      if (!isAdmin && userIds && userIds.length > 0) {
        // Finance Admin, Accountant, or Employee: filter based on userIds
        // Filter transactions by accessible user IDs
        transactions = transactions.filter((t) => {
          const createdById = toNumber(
            (t as { created_by_id?: unknown; createdBy?: unknown; created_by?: unknown }).created_by_id ??
            (t as { createdBy?: unknown }).createdBy ??
            (t as { created_by?: unknown }).created_by
          );
          return createdById !== undefined && userIds.includes(createdById);
        });

        // Filter sales by accessible user IDs
        salesTransactions = salesTransactions.filter((s) => {
          const soldById = toNumber((s as { soldById?: unknown; createdById?: unknown }).soldById ?? (s as { createdById?: unknown }).createdById);
          return soldById !== undefined && userIds.includes(soldById);
        });

        // Filter inventory by accessible user IDs
        inventoryTransactions = inventoryTransactions.filter((i) => {
          const createdById = toNumber((i as { createdById?: unknown }).createdById);
          return createdById !== undefined && userIds.includes(createdById);
        });
      }
      // Admin/Super Admin sees all - no filtering needed

      // Combine all transactions and sort by date
      const normalizedExisting: TransactionItem[] = (transactions || []).map((t) => ({
        id: t.id?.toString() || '',
        transaction_type: t.transaction_type,
        title: typeof t.title === 'string' ? t.title : 'Transaction',
        description: typeof t.description === 'string' ? t.description : undefined,
        category: typeof t.category === 'string' ? t.category : 'N/A',
        amount: toNumber(t.amount),
        date: toString(t.date) || toString(t.created_at),
        is_approved: Boolean(t.is_approved),
        created_at: toString(t.created_at),
        status: (t.status as Transaction['status']) || 'pending',
        item_name: toString((t as { item_name?: unknown }).item_name),
        quantity: typeof t.quantity === 'number' ? t.quantity : undefined,
        quantity_sold: typeof t.quantity_sold === 'number' ? t.quantity_sold : undefined,
        receipt_number: toString(t.receipt_number),
        customer_name: toString(t.customer_name),
        sku: toString(t.sku),
        buying_price: typeof t.buying_price === 'number' ? t.buying_price : undefined,
        total_cost: typeof t.total_cost === 'number' ? t.total_cost : undefined,
        createdById: toNumber((t as { created_by_id?: unknown }).created_by_id),
        soldById: toNumber((t as { sold_by_id?: unknown }).sold_by_id),
      }));

      const allTransactions = [...normalizedExisting, ...salesTransactions, ...inventoryTransactions].sort((a, b) => {
        const dateA = new Date(a.date || a.created_at || 0).getTime();
        const dateB = new Date(b.date || b.created_at || 0).getTime();
        return dateB - dateA; // Most recent first
      });

      setTransactions(allTransactions);

      // Update summary with transaction count after loading
      // Note: Financial totals (revenue, expenses, sales, inventory) are loaded separately via loadSummary()
      setSummary(prev => ({
        ...prev,
        totalTransactions: allTransactions.length,
      }));
    } catch (err: unknown) {
      let errorMessage = 'Failed to load transactions';

      if (typeof err === 'object' && err !== null && 'response' in err) {
        const response = (err as { response?: { data?: { detail?: unknown } } }).response;
        const detail = response?.data?.detail;
        if (typeof detail === 'string') {
          errorMessage = detail;
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((e) => (e as { msg?: string }).msg || JSON.stringify(e)).join(', ');
        } else if (detail && typeof detail === 'object' && 'msg' in (detail as Record<string, unknown>)) {
          errorMessage = (detail as { msg?: string }).msg || errorMessage;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, storeUser?.managerId]);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user, loadTransactions]);

  useEffect(() => {
    if (user && !loading) {
      loadSummary();
    }
  }, [user, loading, loadSummary]);

  const filteredTransactions = transactions.filter(transaction => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (transaction.title?.toLowerCase() || '').includes(searchLower) ||
      (transaction.description?.toLowerCase() || '').includes(searchLower) ||
      (transaction.source?.toLowerCase() || '').includes(searchLower) ||
      (transaction.vendor?.toLowerCase() || '').includes(searchLower) ||
      (transaction.item_name?.toLowerCase() || '').includes(searchLower) ||
      (transaction.receipt_number?.toLowerCase() || '').includes(searchLower) ||
      (transaction.customer_name?.toLowerCase() || '').includes(searchLower) ||
      (transaction.sku?.toLowerCase() || '').includes(searchLower);

    const matchesType = typeFilter === 'all' || transaction.transaction_type === typeFilter;

    // Handle status filter - include sales and inventory status
    let matchesStatus = false;
    if (statusFilter === 'all') {
      matchesStatus = true;
    } else if (statusFilter === 'approved') {
      matchesStatus = transaction.is_approved || transaction.status === 'posted' || transaction.status === 'active';
    } else if (statusFilter === 'pending') {
      matchesStatus = !transaction.is_approved && transaction.status !== 'posted' && transaction.status !== 'cancelled' && transaction.status !== 'active';
    } else if (statusFilter === 'posted') {
      matchesStatus = transaction.status === 'posted';
    } else if (statusFilter === 'active') {
      matchesStatus = transaction.status === 'active';
    } else if (statusFilter === 'inactive') {
      matchesStatus = transaction.status === 'inactive';
    } else {
      matchesStatus = transaction.status === statusFilter;
    }

    return matchesSearch && matchesType && matchesStatus;
  });

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExport = () => {
    try {
      if (filteredTransactions.length === 0) {
        toast.error('No transactions to export');
        return;
      }

      // Define columns to export
      const headers = [
        'Type',
        'Title',
        'Category',
        'Amount',
        'Date',
        'Status',
        'Description'
      ];

      // Format data as CSV
      const csvRows = filteredTransactions.map(transaction => {
        const isExpense = transaction.transaction_type === 'expense' || transaction.transaction_type === 'inventory';
        const typeLabel = transaction.transaction_type.charAt(0).toUpperCase() + transaction.transaction_type.slice(1);
        const statusLabel = transaction.status === 'posted'
          ? 'Posted'
          : transaction.status === 'cancelled'
            ? 'Cancelled'
            : transaction.status === 'active'
              ? 'Active'
              : transaction.status === 'inactive'
                ? 'Inactive'
                : transaction.is_approved
                  ? 'Approved'
                  : 'Pending';

        return [
          typeLabel,
          `"${(transaction.title || '').replace(/"/g, '""')}"`,
          `"${(transaction.category || 'N/A').replace(/"/g, '""')}"`,
          `${isExpense ? '-' : '+'}${transaction.amount.toFixed(2)}`,
          formatDate(transaction.date || transaction.created_at || ''),
          statusLabel,
          `"${(transaction.description || '').replace(/"/g, '""')}"`
        ].join(',');
      });

      const csvContent = [headers.join(','), ...csvRows].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];

      link.setAttribute('href', url);
      link.setAttribute('download', `transactions_export_${date}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Transactions exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export transactions');
    }
  };

  // Use backend summary if available, otherwise fallback to local calculations
  const localTotalRevenue = filteredTransactions
    .filter(t => t.transaction_type === 'revenue')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const localTotalSales = filteredTransactions
    .filter(t => t.transaction_type === 'sale')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const localTotalExpenses = filteredTransactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const localTotalInventory = filteredTransactions
    .filter(t => t.transaction_type === 'inventory')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const localNetAmount = localTotalRevenue + localTotalSales - localTotalExpenses - localTotalInventory;
  const localTotalTransactions = filteredTransactions.length;

  // Summary indicators strictly follow the filtered transactions in the table
  const totalRevenue = localTotalRevenue;
  const totalSales = localTotalSales;
  const totalExpenses = localTotalExpenses;
  const totalInventory = localTotalInventory;
  const netAmount = localNetAmount;
  const totalTransactionsCount = localTotalTransactions;

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <LoadingContainer>
              <Spinner />
              <p>Loading transactions...</p>
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
            <h1>Transactions</h1>
            <p>View all revenue and expense transactions</p>
          </HeaderContainer>

          {error && (
            <ErrorBanner>
              <AlertCircle />
              <span>{error}</span>
            </ErrorBanner>
          )}

          <SummaryGrid>
            <SummaryCard $type="revenue">
              <div className="label">
                Total Revenue
              </div>
              <div className="value">{formatCurrency(totalRevenue)}</div>
            </SummaryCard>
            <SummaryCard $type="revenue">
              <div className="label">
                Total Sales
              </div>
              <div className="value">{formatCurrency(totalSales)}</div>
            </SummaryCard>
            <SummaryCard $type="expense">
              <div className="label">
                Total Expenses
              </div>
              <div className="value">{formatCurrency(totalExpenses)}</div>
            </SummaryCard>
          </SummaryGrid>

          <BottomSummaryGrid>
            <SummaryCard $type="expense">
              <div className="label">
                Total Inventory Cost
              </div>
              <div className="value">{formatCurrency(totalInventory)}</div>
            </SummaryCard>
            <SummaryCard $type="net">
              <div className="label">
                Net Amount
              </div>
              <div className="value" style={{ color: netAmount >= 0 ? '#16a34a' : '#dc2626' }}>
                {formatCurrency(netAmount)}
              </div>
            </SummaryCard>
            <SummaryCard $type="total">
              <div className="label">Total Transactions</div>
              <div className="value">{totalTransactionsCount}</div>
            </SummaryCard>
          </BottomSummaryGrid>

          <FiltersContainer>
            <FiltersGrid>
              <SearchContainer>
                <Search />
                <SearchInput
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </SearchContainer>

              <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
                <option value="sale">Sales</option>
                <option value="inventory">Inventory</option>
              </Select>

              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Status</option>
                <option value="approved">Approved</option>
                <option value="posted">Posted</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
                <option value="cancelled">Cancelled</option>
              </Select>

              <Button
                variant="outline"
                onClick={handleExport}
                disabled={filteredTransactions.length === 0}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', height: '38px' }}
              >
                <Download size={16} />
                Export
              </Button>
            </FiltersGrid>
          </FiltersContainer>

          <TableContainer>
            {filteredTransactions.length === 0 ? (
              <EmptyState>
                <TrendingUp />
                <h3>No transactions found</h3>
                <p>Try adjusting your filters or create a new transaction.</p>
              </EmptyState>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <Table>
                  <TableHeader>
                    <tr>
                      <th>Type</th>
                      <th>Title</th>
                      <th>Category</th>
                      <th>Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.map((transaction) => {
                      const originalId = transaction.id.split('-')[1];
                      const isExpense = transaction.transaction_type === 'expense';
                      const isSale = transaction.transaction_type === 'sale';

                      return (
                        <tr key={transaction.id}>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <TypeBadge $type={transaction.transaction_type}>
                              {isExpense ? (
                                <ArrowDownRight size={12} />
                              ) : isSale ? (
                                <ShoppingCart size={12} />
                              ) : transaction.transaction_type === 'inventory' ? (
                                <Package size={12} />
                              ) : (
                                <ArrowUpRight size={12} />
                              )}
                              {transaction.transaction_type === 'revenue'
                                ? 'Revenue'
                                : transaction.transaction_type === 'expense'
                                  ? 'Expense'
                                  : transaction.transaction_type === 'sale'
                                    ? 'Sale'
                                    : 'Inventory'}
                            </TypeBadge>
                          </td>
                          <td>
                            <TransactionTitle>{transaction.title}</TransactionTitle>
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <CategoryBadge>{transaction.category || 'N/A'}</CategoryBadge>
                          </td>
                          <AmountCell $isExpense={isExpense || transaction.transaction_type === 'inventory'} style={{ whiteSpace: 'nowrap' }}>
                            {isExpense || transaction.transaction_type === 'inventory' ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                          </AmountCell>
                          <td style={{ whiteSpace: 'nowrap' }}>{formatDate(transaction.date || transaction.created_at || '')}</td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <StatusBadge
                              $approved={Boolean(transaction.is_approved)}
                              $status={transaction.status}
                            >
                              {transaction.status === 'posted'
                                ? 'Posted'
                                : transaction.status === 'cancelled'
                                  ? 'Cancelled'
                                  : transaction.status === 'active'
                                    ? 'Active'
                                    : transaction.status === 'inactive'
                                      ? 'Inactive'
                                      : transaction.is_approved
                                        ? 'Approved'
                                        : 'Pending'}
                            </StatusBadge>
                            {transaction.is_recurring && (
                              <RecurringBadge>Recurring</RecurringBadge>
                            )}
                          </td>
                          <td style={{ whiteSpace: 'nowrap' }}>
                            <ActionButtons>
                              {isSale ? (
                                <Link href={`/sales/accounting?sale_id=${originalId}`}>
                                  <Button size="sm" variant="secondary">
                                    View
                                  </Button>
                                </Link>
                              ) : transaction.transaction_type === 'inventory' ? (
                                <Link href={`/inventory/manage?item_id=${originalId}`}>
                                  <Button size="sm" variant="secondary">
                                    View
                                  </Button>
                                </Link>
                              ) : (
                                <Link href={isExpense ? `/expenses/edit/${originalId}` : `/revenue/edit/${originalId}`}>
                                  <Button size="sm" variant="secondary">
                                    View
                                  </Button>
                                </Link>
                              )}
                            </ActionButtons>
                          </td>
                        </tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </TableContainer>

          {filteredTransactions.length > 0 && (
            <PaginationContainer>
              <PageInfo>
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
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
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
}
