'use client';
import React, { useEffect, useState } from 'react';
import styled, { useTheme } from 'styled-components';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/rbac/auth-context';
import {
  Users, DollarSign, TrendingUp, FileText, Shield,
  CreditCard, Activity,
  ClipboardList, BarChart3, Wallet, ArrowRight, AlertCircle,
  LineChart, ArrowUpRight, ArrowDownRight, Package, ShoppingCart
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import useUserStore from '@/store/userStore';
import { useTranslations } from 'next-intl';
import { theme } from '@/components/common/theme';

const PRIMARY_COLOR = (props: any) => props.theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = (props: any) => props.theme.colors.text;
const TEXT_COLOR_MUTED = (props: any) => props.theme.colors.textSecondary || '#666';
const PRIMARY_LIGHT = (props: any) => props.theme.mode === 'dark' ? 'rgba(0, 170, 0, 0.1)' : '#e8f5e9';
const BACKGROUND_GRADIENT = (props: any) => props.theme.mode === 'dark'
  ? `linear-gradient(180deg, #0f172a 0%, #1e293b 60%, ${props.theme.colors.background} 100%)`
  : `linear-gradient(180deg, #f9fafb 0%, #f3f4f6 60%, ${props.theme.colors.background} 100%)`;

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
  min-height: 100vh;
  background: ${BACKGROUND_GRADIENT};
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 1600px;
  margin-left: auto;
  margin-right: auto;
  padding: ${theme.spacing.sm} ${theme.spacing.lg} ${theme.spacing.sm};
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: #ffffff;
  padding: ${theme.spacing.xl} clamp(${theme.spacing.lg}, 4vw, ${theme.spacing.xl});
  margin-bottom: ${theme.spacing.xl};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-left: calc(-1 * clamp(${theme.spacing.lg}, 4vw, ${theme.spacing.xl}));
  margin-right: calc(-1 * clamp(${theme.spacing.lg}, 4vw, ${theme.spacing.xl}));
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
`;

const HeaderContent = styled.div`
  width: min(1280px, 100%);
  margin: 0 auto;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  
  h1 {
    font-size: clamp(28px, 3.5vw, 42px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
  }
  
  p {
    font-size: clamp(${theme.typography.fontSizes.md}, 1.8vw, ${theme.typography.fontSizes.lg});
    font-weight: ${theme.typography.fontWeights.medium};
    opacity: 0.9;
    margin: 0;
  }
`;

const SectionTitle = styled.h2`
  font-size: clamp(20px, 2.2vw, 28px);
  margin: ${theme.spacing.xl} 0 ${theme.spacing.lg};
  color: ${TEXT_COLOR_DARK};
  font-weight: ${theme.typography.fontWeights.bold};
  border-bottom: 2px solid ${PRIMARY_LIGHT};
  padding-bottom: ${theme.spacing.sm};
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
  width: 100%;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
  
  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
    gap: ${theme.spacing.xl};
  }
  
  @media (min-width: 1400px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

type IconComponent = React.FC<React.SVGProps<SVGSVGElement>>;

const getIconColor = (IconComponent: IconComponent, theme: any) => {
  const isDark = theme.mode === 'dark';
  switch (IconComponent) {
    case Users:
    case TrendingUp:
      return {
        bg: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.12)',
        color: isDark ? '#4ade80' : '#15803d',
        border: '#10b981'
      };
    case DollarSign:
    case Wallet:
      return {
        bg: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.12)',
        color: isDark ? '#fbbf24' : '#b45309',
        border: '#f59e0b'
      };
    case FileText:
    case ClipboardList:
      return {
        bg: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.12)',
        color: isDark ? '#60a5fa' : '#1d4ed8',
        border: '#3b82f6'
      };
    case Activity:
    case CreditCard:
    case Shield:
      return {
        bg: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(79, 70, 229, 0.12)',
        color: isDark ? '#818cf8' : '#4338ca',
        border: '#6366f1'
      };
    default:
      return {
        bg: isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.12)',
        color: isDark ? '#4ade80' : '#15803d',
        border: '#10b981'
      };
  }
};

const StatsCard = styled.div<{ $IconComponent: IconComponent; $clickable?: boolean }>`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.lg};
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  transition: all ${theme.transitions.default};
  cursor: ${props => props.$clickable ? 'pointer' : 'default'};
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: ${props => getIconColor(props.$IconComponent, props.theme).border};
    border-top-left-radius: ${theme.borderRadius.md};
    border-bottom-left-radius: ${theme.borderRadius.md};
    transition: width ${theme.transitions.default};
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${CardShadowHover};
    border-color: ${props => getIconColor(props.$IconComponent, props.theme).border};
    
    ${props => props.$clickable && `
      &:before {
        width: 6px;
      }
      
      ${CardValue} {
        color: ${PRIMARY_COLOR};
      }
    `}
  }

  &:active {
    transform: translateY(-2px);
  }
`;

const CardIcon = styled.div<{ $IconComponent: IconComponent }>`
  width: 64px;
  height: 64px;
  border-radius: ${theme.borderRadius.md};
  background: ${props => getIconColor(props.$IconComponent, props.theme).bg};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${theme.spacing.md};
  transition: transform ${theme.transitions.default};
  
  ${StatsCard}:hover & {
    transform: scale(1.05);
  }
  
  svg {
    width: 24px;
    height: 24px;
    color: ${props => getIconColor(props.$IconComponent, props.theme).color};
    stroke-width: 2.5;
  }
`;

const CardTitle = styled.h3`
  font-size: ${theme.typography.fontSizes.xs};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${TEXT_COLOR_MUTED};
  margin-bottom: ${theme.spacing.xs};
  font-weight: ${theme.typography.fontWeights.medium};
`;

const CardValue = styled.div<{ $isNegative?: boolean; $isPositive?: boolean; $isPending?: boolean }>`
  font-size: clamp(28px, 3vw, 36px);
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${props => {
    if (props.$isPending) return '#f59e0b'; // Yellow/Amber for pending
    if (props.$isNegative) return '#ef4444'; // Red for expenses/negative
    if (props.$isPositive) return '#059669'; // Green for revenue/profit
    return TEXT_COLOR_DARK;
  }};
  line-height: 1.1;
  transition: color ${theme.transitions.default};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
`;

const CardSubtitle = styled.div`
  font-size: ${theme.typography.fontSizes.xs};
  color: ${TEXT_COLOR_MUTED};
  margin-top: ${theme.spacing.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  flex-wrap: wrap;
`;

const ClickableIndicator = styled(ArrowRight)`
  width: 18px;
  height: 18px;
  color: ${TEXT_COLOR_MUTED};
  opacity: 0;
  transition: all ${theme.transitions.default};
  
  ${StatsCard}:hover & {
    opacity: 1;
    transform: translateX(4px);
    color: ${PRIMARY_COLOR};
  }
`;

const GrowthIndicator = styled.div<{ $positive: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${props => {
    const isDark = props.theme.mode === 'dark';
    return props.$positive
      ? (isDark ? '#4ade80' : '#059669')
      : (isDark ? '#f87171' : '#ef4444');
  }};
  margin-top: ${theme.spacing.xs};
`;

const AnalyticsButton = styled.button`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: #ffffff;
  border: none;
  padding: ${theme.spacing.md} ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.md};
  font-weight: ${theme.typography.fontWeights.bold};
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  transition: all ${theme.transitions.default};
  box-shadow: ${CardShadow};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${CardShadowHover};
    opacity: 0.95;
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const AnalyticsSection = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.xl};
  margin-top: ${theme.spacing.xl};
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${theme.spacing.lg};
  
  .analytics-info {
    flex: 1;
    min-width: 250px;
    
    h3 {
      font-size: ${theme.typography.fontSizes.lg};
      font-weight: ${theme.typography.fontWeights.bold};
      color: ${TEXT_COLOR_DARK};
      margin: 0 0 ${theme.spacing.sm};
      display: flex;
      align-items: center;
      gap: ${theme.spacing.sm};
    }
    
    p {
      font-size: ${theme.typography.fontSizes.sm};
      color: ${TEXT_COLOR_MUTED};
      margin: 0;
    }
  }
`;

const TableContainer = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.lg};
  overflow: hidden;
`;

const TableTitle = styled.h2`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin-bottom: ${theme.spacing.lg};
`;

const Table = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  
  th, td {
    padding: ${theme.spacing.md} ${theme.spacing.lg};
    text-align: left;
  }
  
  th {
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.xs};
    text-transform: uppercase;
    letter-spacing: 0.08em;
    padding-top: 0;
    border-bottom: 2px solid ${theme.colors.border};
  }
  
  tbody tr {
    transition: background-color ${theme.transitions.default};
    
    &:hover {
      background-color: ${theme.colors.backgroundSecondary};
    }
    
    &:last-child td {
      border-bottom: none;
    }
    
    td {
      border-bottom: 1px solid ${theme.colors.border};
      font-size: ${theme.typography.fontSizes.sm};
    }
  }
`;

// Ensure text-color utility is applied for amounts
const AmountCell = styled.td<{ $isPositive: boolean }>`
  font-weight: 600;
  color: ${props => {
    const isDark = props.theme.mode === 'dark';
    return props.$isPositive
      ? (isDark ? '#4ade80' : '#059669')
      : (isDark ? '#f87171' : '#ef4444');
  }};
`;

const Badge = styled.span<{ $type: 'success' | 'warning' | 'danger' | 'info' }>`
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  background-color: ${props => {
    const isDark = props.theme.mode === 'dark';
    switch (props.$type) {
      case 'success': return isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)';
      case 'warning': return isDark ? 'rgba(251, 191, 36, 0.25)' : 'rgba(251, 191, 36, 0.16)';
      case 'danger': return isDark ? 'rgba(239, 68, 68, 0.25)' : 'rgba(239, 68, 68, 0.18)';
      case 'info': return isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.15)';
      default: return isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)';
    }
  }};
  color: ${props => {
    const isDark = props.theme.mode === 'dark';
    switch (props.$type) {
      case 'success': return isDark ? '#6ee7b7' : '#065f46';
      case 'warning': return isDark ? '#fcd34d' : '#b45309';
      case 'danger': return isDark ? '#fca5a5' : '#991b1b';
      case 'info': return isDark ? '#a5b4fc' : '#3730a3';
      default: return isDark ? '#6ee7b7' : '#065f46';
    }
  }};
`;

const RoleBadge = styled.span<{ $role: string }>`
  display: inline-block;
  padding: ${theme.spacing.xs} ${theme.spacing.md};
  margin-left: ${theme.spacing.md};
  border-radius: 999px;
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(8px);
  
  /* Dynamic colors for the badge */
  background-color: ${props => {
    const role = props.$role.toLowerCase();
    if (role.includes('admin')) return 'rgba(255, 255, 255, 0.2)';
    if (role.includes('manager') || role.includes('finance')) return 'rgba(255, 255, 255, 0.15)';
    if (role.includes('accountant')) return 'rgba(255, 255, 255, 0.15)';
    return 'rgba(255, 255, 255, 0.1)';
  }};
  color: ${() => '#ffffff'};
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
  }
`;

const EmptyState = styled.div`
  padding: ${theme.spacing.xl};
  text-align: center;
  color: ${TEXT_COLOR_MUTED};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.backgroundSecondary};
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

/* --------------------------------------------------------------- */

interface ActivityItem {
  id: string;
  type: string;
  title?: string;
  amount?: number;
  date?: string;
  status?: string;
}

type Financials = {
  total_revenue?: number | string;
  total_expenses?: number | string;
  profit?: number | string;
  profit_margin?: number | string;
};

type OverviewStats = {
  total_users?: number;
  active_users?: number;
  managers?: number;
  employees?: number;
  total_sales?: number;
};

type OverviewData = {
  financials?: Financials;
  pending_approvals?: number;
  team_stats?: Partial<OverviewStats> & { pending_approvals?: number; revenue_entries?: number; expense_entries?: number };
  personal_stats?: Partial<OverviewStats> & { pending_approvals?: number; revenue_entries?: number; expense_entries?: number };
  stats?: OverviewStats;
  sales?: { total_sales?: number };
};

type AnalyticsGrowth = {
  revenue_growth_percent?: number;
  expense_growth_percent?: number;
  profit_growth_percent?: number;
};

type AnalyticsData = {
  growth?: AnalyticsGrowth;
};

type InventorySummary = {
  total_items?: number;
  total_selling_value?: number;
  potential_profit?: number;
  total_cost_value?: number;
};

type SalesSummary = {
  pending_sales?: number;
  posted_sales?: number;
  total_revenue?: number | string;
  total_profit?: number | string;
  total_sales?: number;
};

type Subordinate = { id?: number | string; role?: string };

type Workflow = {
  status?: { value?: string } | string;
  requester_id?: number | string;
  requesterId?: number | string;
  revenue_entry_id?: number | string;
  expense_entry_id?: number | string;
};

type Revenue = {
  id?: number | string;
  is_approved?: boolean;
  created_by_id?: number | string;
  createdBy?: number | string;
  created_by?: number | string;
};

type Expense = {
  id?: number | string;
  is_approved?: boolean;
  created_by_id?: number | string;
  createdBy?: number | string;
  created_by?: number | string;
};

type Sale = {
  id?: number | string;
  status?: { value?: string } | string;
  sold_by_id?: number | string;
  soldBy?: number | string;
  sold_by?: number | string;
  created_by_id?: number | string;
  createdBy?: number | string;
  item_name?: string;
  total_sale?: number | string;
  total_revenue?: number | string;
  total_amount?: number | string;
  created_at?: string;
};

type ActivityApiEntry = {
  id?: string | number;
  type?: string;
  title?: string;
  amount?: number | string;
  date?: string;
  created_at?: string;
  status?: string;
  is_approved?: boolean;
};

const AdminDashboard: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const currentTheme = useTheme();
  const storeUser = useUserStore((state) => state.user);
  const t = useTranslations('Dashboard');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [pendingSalesCount, setPendingSalesCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to safely convert values to numbers, handling NaN, null, undefined
  const safeNumber = (value: unknown): number => {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  useEffect(() => {
    if (!user) {
      setOverview(null);
      setRecentActivity([]);
      setLoading(false);
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);
      setError(null);
      setPendingSalesCount(0);
      try {
        // Load role-specific data
        // Backend already filters data by role:
        // - Admin/Super Admin/Finance Admin/Accountant: See all data
        // - Manager: See their team's data (subordinates + themselves)
        // - Employee/Regular users: See only their own data
        const userRole = user?.role?.toLowerCase();
        const isFinanceAdmin = userRole === 'finance_manager' || userRole === 'finance_admin' || userRole === 'admin' || userRole === 'super_admin';
        const isAccountant = userRole === 'accountant';
        const isManager = userRole === 'manager';
        const isEmployee = userRole === 'employee';

        let overviewRes;
        try {
          overviewRes = await apiClient.getDashboardOverview();
        } catch (err: unknown) {
          console.error('Failed to fetch dashboard overview:', err);
          // For employees, provide a default response structure to prevent complete failure
          if (isEmployee) {
            overviewRes = {
              data: {
                financials: {
                  total_revenue: 0,
                  total_expenses: 0,
                  profit: 0,
                  profit_margin: 0
                },
                personal_stats: {
                  revenue_entries: 0,
                  expense_entries: 0,
                  pending_approvals: 0
                }
              }
            };
          } else {
            throw err; // Re-throw for other roles to be caught by outer catch
          }
        }

        const activityRes = await apiClient.getDashboardRecentActivity(8).catch((err: unknown) => {
          console.warn('Failed to fetch recent activity:', err);
          // Return empty array for activity if it fails
          return { data: [] };
        });

        const analyticsRes = await apiClient.getAdvancedKPIs({ period: 'month' }).catch(() => null); // Optional analytics

        // Load inventory summary for Finance Admin, Admin, Super Admin, and Managers
        // Backend restricts access to these roles only
        const inventoryRes = (isFinanceAdmin || isManager)
          ? await apiClient.getInventorySummary().catch((err: unknown) => {
            const status = typeof err === 'object' && err !== null && 'response' in err
              ? (err as { response?: { status?: number } }).response?.status
              : undefined;
            if (status === 403) {
              console.warn('Access denied to inventory summary for role:', userRole);
              return null;
            }
            console.warn('Failed to load inventory summary:', err);
            return null;
          })
          : null;

        // Load sales summary ONLY for Accountants and Finance Admins (NOT managers)
        // Managers do not have access to sales summary
        const salesRes = ((isAccountant || isFinanceAdmin) && !isManager)
          ? await apiClient.getSalesSummary().catch((err: unknown) => {
            const status = typeof err === 'object' && err !== null && 'response' in err
              ? (err as { response?: { status?: number } }).response?.status
              : undefined;
            if (status === 403) {
              return null;
            }
            console.warn('Failed to load sales summary:', err);
            return null;
          })
          : null;
        // Ensure overview data is properly set
        const overviewData: OverviewData = (overviewRes as { data?: OverviewData })?.data || {};
        setOverview(overviewData);

        // Get accessible user IDs for finance admins and accountants (themselves + subordinates)
        // Finance admins see their own subordinates
        // Accountants see their Finance Admin (manager) and their Finance Admin's team
        let accessibleUserIds: number[] = [];
        const isFinanceAdminRole = userRole === 'finance_admin' || userRole === 'finance_manager';
        const isAccountantRole = userRole === 'accountant';

        if ((isFinanceAdminRole || isManager) && user?.id) {
          try {
            // Finance Admin or Manager: Get their own subordinates
            const userIdRaw = user.id;
            const userId = typeof userIdRaw === 'string' ? parseInt(userIdRaw, 10) : Number(userIdRaw);
            if (Number.isNaN(userId)) throw new Error('Invalid user id');
            const subordinatesRes = await apiClient.getSubordinates(userId);
            const subordinates: Subordinate[] = subordinatesRes?.data || [];
            // Include themselves
            accessibleUserIds = [
              userId,
              ...subordinates
                .map((sub) => {
                  const subId = typeof sub.id === 'string' ? parseInt(sub.id, 10) : Number(sub.id);
                  return Number.isNaN(subId) ? undefined : subId;
                })
                .filter((id): id is number => id !== undefined),
            ];

            if (process.env.NODE_ENV === 'development') {
              console.log(`${userRole} - Accessible User IDs:`, {
                userId: userId,
                subordinatesCount: subordinates.length,
                accessibleUserIds: accessibleUserIds
              });
            }
          } catch (err) {
            console.warn('Failed to fetch subordinates, using only user ID:', err);
            const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
            accessibleUserIds = [userId];
          }
        } else if (isAccountantRole && user?.id) {
          // Accountant: See their own data + employees' sales (from their Finance Admin's team)
          // This allows accountants to see and approve sales made by employees
          const accountantId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
          const managerId = storeUser?.managerId
            ? (typeof storeUser.managerId === 'string' ? parseInt(storeUser.managerId, 10) : storeUser.managerId)
            : null;

          if (managerId) {
            try {
              // Get the Finance Admin's subordinates (employees)
              const subordinatesRes = await apiClient.getSubordinates(managerId);
              const subordinates: Subordinate[] = subordinatesRes?.data || [];

              // Filter to ONLY include employees (exclude accountants and Finance Admins)
              // This ensures accountants can see sales made by employees for approval
              const employeeIds = subordinates
                .map((sub) => {
                  const subId = typeof sub.id === 'string' ? parseInt(sub.id, 10) : Number(sub.id);
                  const subRole = (sub as { role?: string }).role?.toLowerCase() || '';
                  // Only include employees
                  if (!Number.isNaN(subId) && subRole === 'employee') {
                    return subId;
                  }
                  return undefined;
                })
                .filter((id): id is number => id !== undefined);

              // Include: Accountant themselves + employees from Finance Admin's team
              accessibleUserIds = [accountantId, ...employeeIds];

              if (process.env.NODE_ENV === 'development') {
                console.log('Accountant - Accessible User IDs (themselves + employees):', {
                  accountantId: accountantId,
                  managerId: managerId,
                  employeeIds: employeeIds,
                  accessibleUserIds: accessibleUserIds
                });
              }
            } catch (err) {
              console.warn('Failed to fetch Finance Admin subordinates for accountant, using only accountant ID:', err);
              accessibleUserIds = [accountantId];
            }
          } else {
            // No manager - only see own data
            accessibleUserIds = [accountantId];
          }
        } else if (user?.id) {
          // For other roles, they can only see their own data
          const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
          accessibleUserIds = [userId];
        }

        // Fetch all pending approvals in real-time (workflows, revenue, expenses, sales)
        // Use deduplication logic to avoid counting items with workflows twice
        // IMPORTANT: For finance admins, only count approvals from themselves and their subordinates
        // NOTE: Employees typically don't have approval permissions, so we skip this section for them
        const hasApprovalPermissions = user?.role === 'admin' ||
          user?.role === 'super_admin' ||
          user?.role === 'manager' ||
          user?.role === 'finance_manager' ||
          user?.role === 'finance_admin' ||
          user?.role === 'accountant';

        let totalPendingCount = 0;
        const debugInfo: Record<string, unknown> = {};

        // Store pending sales count for later use
        let pendingSalesForActivity: Sale[] = [];

        // Only fetch pending approvals if user has approval permissions
        if (hasApprovalPermissions && !isEmployee) {
          try {
            // Fetch approval workflows to identify which entries have workflows
            let workflows: Workflow[] = [];
            try {
              const workflowsRes = await apiClient.getApprovals();
              workflows = Array.isArray(workflowsRes?.data) ? (workflowsRes.data as Workflow[]) : [];
            } catch (workflowsErr: unknown) {
              const workflowsStatus = typeof workflowsErr === 'object' && workflowsErr !== null && 'response' in workflowsErr
                ? (workflowsErr as { response?: { status?: number } }).response?.status
                : undefined;
              // Skip if 403 (no access) or 500 (server error), but log other errors
              if (workflowsStatus !== 403 && workflowsStatus !== 500) {
                console.warn('Failed to fetch approval workflows:', workflowsErr);
              }
              debugInfo.workflowsError = workflowsStatus || 'Unknown error';
            }

            // Count pending workflows - filter by requester_id for finance admins and accountants
            const pendingWorkflows = workflows.filter((w) => {
              const statusRaw = typeof w.status === 'string' ? w.status : w.status?.value;
              const status = (statusRaw ?? 'pending').toString().toLowerCase();
              const isPending = status === 'pending';

              // For finance admins and accountants, only count workflows they requested or from their subordinates
              if (isPending && (isFinanceAdminRole || isAccountantRole) && accessibleUserIds.length > 0) {
                const requesterRaw = w.requester_id ?? w.requesterId;
                const requesterId = typeof requesterRaw === 'string'
                  ? parseInt(requesterRaw, 10)
                  : typeof requesterRaw === 'number'
                    ? requesterRaw
                    : undefined;
                return requesterId !== undefined && accessibleUserIds.includes(requesterId);
              }

              return isPending;
            });
            totalPendingCount += pendingWorkflows.length;
            debugInfo.pendingWorkflowsCount = pendingWorkflows.length;

            // Collect all revenue/expense entry IDs that already have workflows
            // This prevents duplication - if an entry has a workflow, we only count the workflow
            const revenueIdsWithWorkflow = new Set(
              workflows
                .filter((w) => w.revenue_entry_id)
                .map((w) => w.revenue_entry_id)
            );
            const expenseIdsWithWorkflow = new Set(
              workflows
                .filter((w) => w.expense_entry_id)
                .map((w) => w.expense_entry_id)
            );
            debugInfo.revenueIdsWithWorkflow = revenueIdsWithWorkflow.size;
            debugInfo.expenseIdsWithWorkflow = expenseIdsWithWorkflow.size;

            // Fetch pending revenue entries - only count those WITHOUT workflows
            // For finance admins and accountants, only count revenues created by themselves or their subordinates
            try {
              const revenuesRes = await apiClient.getRevenues({ is_approved: false });
              if (Array.isArray(revenuesRes?.data)) {
                const pendingRevenues = revenuesRes.data.filter((r: Revenue) => {
                  // Only count if not approved AND doesn't have an existing workflow
                  const isPending = !r.is_approved && !revenueIdsWithWorkflow.has(r.id);

                  // For finance admins and accountants, also check if created by them or their subordinates
                  if (isPending && (isFinanceAdminRole || isAccountantRole) && accessibleUserIds.length > 0) {
                    const createdByIdRaw = r.created_by_id || r.createdBy || r.created_by;
                    if (!createdByIdRaw) return false;
                    const createdById = typeof createdByIdRaw === 'string'
                      ? parseInt(createdByIdRaw, 10)
                      : Number(createdByIdRaw);
                    return !isNaN(createdById) && accessibleUserIds.includes(createdById);
                  }

                  return isPending;
                });
                totalPendingCount += pendingRevenues.length;
                debugInfo.pendingRevenuesCount = pendingRevenues.length;
              }
            } catch (revenuesErr: unknown) {
              const revenuesStatus = typeof revenuesErr === 'object' && revenuesErr !== null && 'response' in revenuesErr
                ? (revenuesErr as { response?: { status?: number } }).response?.status
                : undefined;
              // Skip if 403 (no access) or 500 (server error), but log other errors
              if (revenuesStatus !== 403 && revenuesStatus !== 500) {
                console.warn('Failed to fetch pending revenues:', revenuesErr);
              }
              debugInfo.revenuesError = revenuesStatus || 'Unknown error';
            }

            // Fetch pending expense entries - only count those WITHOUT workflows
            // For finance admins and accountants, only count expenses created by themselves or their subordinates
            try {
              const expensesRes = await apiClient.getExpenses({ is_approved: false });
              if (Array.isArray(expensesRes?.data)) {
                const pendingExpenses = expensesRes.data.filter((e: Expense) => {
                  // Only count if not approved AND doesn't have an existing workflow
                  const isPending = !e.is_approved && !expenseIdsWithWorkflow.has(e.id);

                  // For finance admins and accountants, also check if created by them or their subordinates
                  if (isPending && (isFinanceAdminRole || isAccountantRole) && accessibleUserIds.length > 0) {
                    const createdByIdRaw = e.created_by_id || e.createdBy || e.created_by;
                    if (!createdByIdRaw) return false;
                    const createdById = typeof createdByIdRaw === 'string'
                      ? parseInt(createdByIdRaw, 10)
                      : Number(createdByIdRaw);
                    return !isNaN(createdById) && accessibleUserIds.includes(createdById);
                  }

                  return isPending;
                });
                totalPendingCount += pendingExpenses.length;
                debugInfo.pendingExpensesCount = pendingExpenses.length;
              }
            } catch (expensesErr: unknown) {
              const expensesStatus = typeof expensesErr === 'object' && expensesErr !== null && 'response' in expensesErr
                ? (expensesErr as { response?: { status?: number } }).response?.status
                : undefined;
              // Skip if 403 (no access) or 500 (server error), but log other errors
              if (expensesStatus !== 403 && expensesStatus !== 500) {
                console.warn('Failed to fetch pending expenses:', expensesErr);
              }
              debugInfo.expensesError = expensesStatus || 'Unknown error';
            }

            // Fetch pending sales - for accountants, finance admins, managers, and admins
            // Sales need to be approved/posted by accountants or finance admins
            const userRoleLower = user?.role?.toLowerCase();
            const canViewSales = userRoleLower === 'accountant' ||
              userRoleLower === 'finance_manager' ||
              userRoleLower === 'finance_admin' ||
              userRoleLower === 'admin' ||
              userRoleLower === 'super_admin' ||
              userRoleLower === 'manager';

            if (canViewSales) {
              try {
                const salesResponse = await apiClient.getSales({ status: 'pending', limit: 1000 });
                const salesData: Sale[] = Array.isArray(salesResponse?.data)
                  ? salesResponse.data
                  : (salesResponse?.data && typeof salesResponse.data === 'object' && 'data' in salesResponse.data
                    ? ((salesResponse.data as { data?: Sale[] }).data || [])
                    : []);

                // Filter for pending sales (status is 'pending' or 'PENDING')
                // For finance admins and accountants, only count sales created by themselves or their subordinates
                const pendingSales = (salesData || []).filter((s) => {
                  const saleStatusRaw = typeof s.status === 'string' ? s.status : s.status?.value;
                  const saleStatus = (saleStatusRaw ?? 'pending').toString().toLowerCase();
                  const isPending = saleStatus === 'pending';

                  // For finance admins, accountants, and managers, also check if sold by them or their subordinates
                  if (isPending && (isFinanceAdminRole || isAccountantRole || isManager) && accessibleUserIds.length > 0) {
                    const soldByIdRaw = s.sold_by_id || s.soldBy || s.sold_by || s.created_by_id || s.createdBy;
                    const soldById = typeof soldByIdRaw === 'string'
                      ? parseInt(soldByIdRaw, 10)
                      : typeof soldByIdRaw === 'number'
                        ? soldByIdRaw
                        : undefined;
                    return soldById !== undefined && accessibleUserIds.includes(soldById);
                  }

                  return isPending;
                });

                totalPendingCount += pendingSales.length;
                debugInfo.pendingSalesCount = pendingSales.length;
                setPendingSalesCount(pendingSales.length);

                // Store for adding to recent activity
                pendingSalesForActivity = pendingSales;
              } catch (salesErr: unknown) {
                const salesStatus = typeof salesErr === 'object' && salesErr !== null && 'response' in salesErr
                  ? (salesErr as { response?: { status?: number } }).response?.status
                  : undefined;
                // Silently handle 403 errors (expected for users without sales access)
                if (salesStatus !== 403 && salesStatus !== 500) {
                  console.warn('Failed to fetch pending sales for approvals count:', salesErr);
                }
                debugInfo.salesError = salesStatus === 403 ? 'No access' : salesStatus === 500 ? 'Server error' : 'Error';
              }
            }
          } catch (err) {
            console.error('Error fetching pending approvals:', err);
            // Fallback to overview count if direct fetching fails
            // Check both team_stats (for accountants, finance admins, managers) and personal_stats (for employees)
            const overviewCount = overviewData.pending_approvals ??
              overviewData.team_stats?.pending_approvals ??
              overviewData.personal_stats?.pending_approvals;
            if (overviewCount !== undefined && overviewCount !== null) {
              totalPendingCount = Number(overviewCount) || 0;
            }
            debugInfo.error = 'Failed to fetch approvals count';
          }
        } else {
          // For employees and users without approval permissions, use overview count
          const overviewCount = overviewData.pending_approvals ??
            overviewData.team_stats?.pending_approvals ??
            overviewData.personal_stats?.pending_approvals;
          if (overviewCount !== undefined && overviewCount !== null) {
            totalPendingCount = Number(overviewCount) || 0;
          }
        }

        setPendingApprovalsCount(Math.max(0, totalPendingCount));

        const analyticsDataPayload = (analyticsRes as { data?: AnalyticsData })?.data;
        const inventorySummaryPayload = (inventoryRes as { data?: InventorySummary | null })?.data;
        const salesSummaryPayload = (salesRes as { data?: SalesSummary | null })?.data;

        // Log for debugging (only in development)
        if (process.env.NODE_ENV === 'development') {
          console.log('Dashboard Overview Data:', {
            userRole: userRole,
            isAccountant: isAccountantRole,
            isFinanceAdmin: isFinanceAdminRole,
            accessibleUserIds: accessibleUserIds,
            overview: overviewData,
            financials: overviewData.financials,
            base_revenue: overviewData.financials?.total_revenue,
            sales_summary: salesSummaryPayload,
            sales_revenue: salesSummaryPayload?.total_revenue,
            total_revenue_calculated:
              safeNumber(overviewData.financials?.total_revenue) +
              (salesSummaryPayload ? safeNumber(salesSummaryPayload?.total_revenue) : 0),
            total_expenses: overviewData.financials?.total_expenses,
            profit: overviewData.financials?.profit,
            pending_approvals_count: totalPendingCount,
            breakdown: {
              workflows: debugInfo.pendingWorkflowsCount || 0,
              revenues: debugInfo.pendingRevenuesCount || 0,
              expenses: debugInfo.pendingExpensesCount || 0,
              sales: debugInfo.pendingSalesCount || 0,
            },
            ...debugInfo,
          });
        }

        const activityData = Array.isArray((activityRes as { data?: ActivityApiEntry[] })?.data)
          ? ((activityRes as { data?: ActivityApiEntry[] }).data || [])
          : [];

        // Map regular activity
        const activity = activityData.map((entry: ActivityApiEntry, index: number): ActivityItem => ({
          id: entry.id?.toString() ?? `activity-${index}`,
          type: entry.type ?? 'activity',
          title: entry.title ?? entry.type,
          amount: entry.amount !== undefined ? Number(entry.amount) : undefined,
          date: entry.date ?? entry.created_at,
          status: entry.status ?? (entry.is_approved ? 'approved' : 'pending'),
        }));

        // Add pending sales to recent activity for accountants and finance admins
        const userRoleLower = user?.role?.toLowerCase();
        const canViewSales = userRoleLower === 'accountant' ||
          userRoleLower === 'finance_manager' ||
          userRoleLower === 'finance_admin' ||
          userRoleLower === 'admin' ||
          userRoleLower === 'super_admin' ||
          userRoleLower === 'manager';

        // Add pending sales to recent activity if available
        if (canViewSales && pendingSalesForActivity.length > 0) {
          const salesActivity = pendingSalesForActivity.map((s): ActivityItem => ({
            id: `sale-${s.id}`,
            type: 'sale',
            title: s.item_name || `Sale #${s.id}`,
            amount: Number(s.total_sale ?? s.total_amount ?? 0),
            date: s.created_at,
            status: 'pending',
          }));

          // Combine and sort by date
          const allActivity = [...activity, ...salesActivity];
          allActivity.sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
          });

          // Take the most recent items (up to the limit)
          setRecentActivity(allActivity.slice(0, 8));
        } else {
          setRecentActivity(activity);
        }

        // Set analytics data if available
        if (analyticsDataPayload) {
          setAnalyticsData(analyticsDataPayload);
        }

        // Set inventory summary if available
        if (inventorySummaryPayload) {
          setInventorySummary(inventorySummaryPayload ?? null);
        }

        // Set sales summary if available
        if (salesSummaryPayload) {
          setSalesSummary(salesSummaryPayload ?? null);
        }
      } catch (err: unknown) {
        const errorMessage =
          (typeof err === 'object' &&
            err !== null &&
            'response' in err &&
            (err as { response?: { data?: { detail?: string } } }).response?.data?.detail) ||
          (err as { message?: string }).message ||
          'Failed to load dashboard data';
        setError(errorMessage);
        // Set default values on error so UI still renders
        setOverview({
          financials: {
            total_revenue: 0,
            total_expenses: 0,
            profit: 0,
            profit_margin: 0,
          },
          pending_approvals: 0,
        });
        setPendingApprovalsCount(0);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user, storeUser?.managerId]);

  // Extract financial data with proper type conversion (handles Decimal from backend)
  // Always ensure we have valid numbers, defaulting to 0 if data is missing
  // Base revenue from overview (includes revenue entries)
  const baseRevenue = safeNumber(overview?.financials?.total_revenue);

  // Sales revenue from sales summary (if available for accountants and finance admins)
  // Only include sales revenue if salesSummary exists (meaning user has access to sales data)
  const salesRevenue = salesSummary ? safeNumber(salesSummary?.total_revenue) : 0;

  // Total revenue = base revenue + sales revenue
  // This ensures total revenue includes both revenue entries and posted sales
  const totalRevenue = baseRevenue + salesRevenue;

  const totalExpenses = safeNumber(overview?.financials?.total_expenses);

  // Net profit calculation - always calculate from (Base Revenue + Sales Revenue) - Total Expenses
  // for maximum accuracy since we are manually aggregating sales data in the frontend.
  const netProfit = totalRevenue - totalExpenses;

  // Use the pending approvals count from state (fetched from multiple sources)
  const pendingApprovals = pendingApprovalsCount;

  // Calculate revenue counts for display
  const revenueEntriesCount = overview?.personal_stats?.revenue_entries ??
    overview?.team_stats?.revenue_entries ??
    0;
  const salesCount = salesSummary?.total_sales ?? 0;

  // Create subtitle for Total Revenue card showing the breakdown
  const revenueSubtitle = (revenueEntriesCount > 0 || salesCount > 0)
    ? `${revenueEntriesCount > 0 ? `${revenueEntriesCount} revenue ${revenueEntriesCount === 1 ? 'entry' : 'entries'}` : ''}${revenueEntriesCount > 0 && salesCount > 0 ? ' + ' : ''}${salesCount > 0 ? `${salesCount} ${salesCount === 1 ? 'sale' : 'sales'}` : ''}`
    : undefined;

  // Create subtitle for Pending Approvals card showing the breakdown (including sales)
  const pendingApprovalsSubtitle = pendingSalesCount > 0
    ? `${pendingSalesCount} pending ${pendingSalesCount === 1 ? 'sale' : 'sales'}${pendingApprovals > pendingSalesCount ? ` + others` : ''}`
    : undefined;

  const renderWelcomeHeader = () => {
    if (!user) return <HeaderContent><h1>Dashboard</h1></HeaderContent>;

    return (
      <HeaderContent>
        <h1>Welcome, {user.full_name || user.username || 'User'} </h1>
        <RoleBadge $role={user.role}>{user.role}</RoleBadge>
      </HeaderContent>
    );
  };

  const handlePendingApprovalsClick = () => {
    if (pendingApprovals > 0) {
      router.push('/approvals?status=pending');
    } else {
      router.push('/approvals');
    }
  };

  const handleAnalyticsClick = () => {
    router.push('/analytics');
  };

  const createStatsCard = (
    Icon: IconComponent,
    title: string,
    value: string,
    clickable: boolean = false,
    onClick?: () => void,
    growth?: number,
    growthLabel?: string,
    isNegative?: boolean,
    isPositive?: boolean,
    isPending?: boolean,
    subtitle?: string
  ) => (
    <StatsCard
      $IconComponent={Icon}
      $clickable={clickable}
      onClick={onClick}
    >
      <CardIcon $IconComponent={Icon}><Icon /></CardIcon>
      <CardTitle>{title}</CardTitle>
      <CardValue $isNegative={isNegative} $isPositive={isPositive} $isPending={isPending}>
        {value}
        {clickable && <ClickableIndicator />}
      </CardValue>
      {subtitle && <CardSubtitle>{subtitle}</CardSubtitle>}
      {growth !== undefined && growth !== null && !isNaN(growth) && (
        <GrowthIndicator $positive={growth >= 0}>
          {growth >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {growthLabel || `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%`} vs previous period
        </GrowthIndicator>
      )}
    </StatsCard>
  );


  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <LoadingContainer>
            <Spinner />
            <p>Loading dashboard...</p>
          </LoadingContainer>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        <HeaderContainer>
          {renderWelcomeHeader()}
        </HeaderContainer>

        <ContentContainer>
          {error && (
            <ErrorBanner>
              <AlertCircle size={20} />
              <span>{error}</span>
            </ErrorBanner>
          )}
          {user?.role !== 'employee' && (
            <>
              <SectionTitle>System Overview</SectionTitle>
              {overview ? (
                <>
                  <DashboardGrid>
                    {createStatsCard(
                      DollarSign,
                      'Total Revenue',
                      `$${Number(totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      false,
                      undefined,
                      analyticsData?.growth?.revenue_growth_percent,
                      undefined,
                      false,
                      true,
                      false,
                      revenueSubtitle
                    )}
                    {createStatsCard(
                      CreditCard,
                      'Total Expenses',
                      `$${Number(totalExpenses).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      false,
                      undefined,
                      analyticsData?.growth?.expense_growth_percent,
                      undefined,
                      true
                    )}
                  </DashboardGrid>
                  <DashboardGrid style={{ marginTop: theme.spacing.lg }}>
                    {createStatsCard(
                      TrendingUp,
                      'Net Profit',
                      `$${Number(netProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                      false,
                      undefined,
                      analyticsData?.growth?.profit_growth_percent,
                      undefined,
                      netProfit < 0,
                      netProfit >= 0
                    )}
                    {/* Only show Pending Approvals card if user has approval permissions */}
                    {(user?.role === 'admin' ||
                      user?.role === 'super_admin' ||
                      user?.role === 'manager' ||
                      user?.role === 'finance_manager' ||
                      user?.role === 'finance_admin' ||
                      user?.role === 'accountant') &&
                      createStatsCard(
                        ClipboardList,
                        'Pending Approvals',
                        pendingApprovals.toString(),
                        true,
                        handlePendingApprovalsClick,
                        undefined,
                        undefined,
                        false,
                        false,
                        true,
                        pendingApprovalsSubtitle
                      )}
                  </DashboardGrid>
                </>
              ) : (
                <EmptyState>
                  <p>
                    No overview data available. Please ensure you have revenue and expense entries.
                  </p>
                </EmptyState>
              )}
            </>
          )}

          {/* Inventory & Sales Section - Role-based */}
          {/* Only show inventory summary if user has access and data is available */}
          {(user?.role === 'finance_manager' ||
            user?.role === 'finance_admin' ||
            user?.role === 'admin' ||
            user?.role === 'super_admin' ||
            user?.role === 'manager') && inventorySummary && (
              <>
                <SectionTitle>Inventory Overview</SectionTitle>
                <DashboardGrid>
                  {createStatsCard(
                    Package,
                    'Total Items',
                    (inventorySummary.total_items || 0).toString(),
                    true,
                    () => router.push('/inventory/manage')
                  )}
                  {createStatsCard(
                    DollarSign,
                    'Inventory Value',
                    `$${Number(inventorySummary.total_selling_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    false
                  )}
                  {createStatsCard(
                    TrendingUp,
                    'Potential Profit',
                    `$${Number(inventorySummary.potential_profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    false
                  )}
                  {createStatsCard(
                    DollarSign,
                    'Total Cost',
                    `$${Number(inventorySummary.total_cost_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                    false
                  )}
                </DashboardGrid>
              </>
            )}

          {/* Sales Summary - For Accountants, Finance Admins, and Admins */}
          {(user?.role === 'accountant' || user?.role === 'finance_manager' || user?.role === 'finance_admin' || user?.role === 'admin' || user?.role === 'super_admin') && salesSummary && (
            <>
              <SectionTitle>Sales Overview</SectionTitle>
              <DashboardGrid>
                {createStatsCard(
                  ShoppingCart,
                  'Total Sales',
                  (salesSummary?.total_sales || 0).toString(),
                  true,
                  () => router.push('/sales/accounting')
                )}
                {createStatsCard(
                  DollarSign,
                  'Sales Revenue',
                  `$${Number(salesSummary?.total_revenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                  false
                )}
                {createStatsCard(
                  Activity,
                  'Pending Sales',
                  (salesSummary?.pending_sales || pendingSalesCount || 0).toString(),
                  true,
                  () => router.push('/sales/accounting?tab=sales&status=pending')
                )}
                {createStatsCard(
                  FileText,
                  'Posted Sales',
                  (salesSummary?.posted_sales || 0).toString(),
                  false
                )}
              </DashboardGrid>
            </>
          )}

          {/* Quick Actions for Employees */}
          {user?.role === 'employee' && (
            <>
              <SectionTitle>Quick Actions</SectionTitle>
              <DashboardGrid>
                {createStatsCard(
                  ShoppingCart,
                  'Make a Sale',
                  'Start Selling',
                  true,
                  () => router.push('/inventory/sales')
                )}
                {createStatsCard(
                  Package,
                  'View Items',
                  'Browse',
                  true,
                  () => router.push('/inventory/sales')
                )}
              </DashboardGrid>
            </>
          )}

          <SectionTitle>
            Recent Transactions
            {user?.role === 'employee' && (
              <span style={{
                fontSize: theme.typography.fontSizes.sm,
                fontWeight: 'normal',
                color: currentTheme.colors.textSecondary,
                marginLeft: theme.spacing.sm
              }}>
                (Your activities only)
              </span>
            )}
            {(user?.role === 'manager') && (
              <span style={{
                fontSize: theme.typography.fontSizes.sm,
                fontWeight: 'normal',
                color: currentTheme.colors.textSecondary,
                marginLeft: theme.spacing.sm
              }}>
                (Your team&apos;s activities)
              </span>
            )}
          </SectionTitle>
          <TableContainer>
            <TableTitle>Latest Activity</TableTitle>
            <Table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">
                      No recent activity recorded.
                    </td>
                  </tr>
                )}
                {recentActivity.map((item) => {
                  // Sales and revenue are positive (income)
                  const isPositive = item.type === 'revenue' || item.type === 'sale';
                  const amount = Number(item.amount || 0);
                  const statusType =
                    item.status === 'approved' || item.status === 'posted'
                      ? 'success'
                      : item.status === 'pending'
                        ? 'warning'
                        : item.status === 'rejected' || item.status === 'cancelled'
                          ? 'danger'
                          : 'info';

                  // Format title for sales to make them more visible
                  const displayTitle = item.type === 'sale'
                    ? `Sale: ${item.title?.replace('Sale: ', '') || 'Unknown Item'}`
                    : item.title || item.type;

                  return (
                    <tr key={`${item.type}-${item.id}-${item.date}`}>
                      <td>{item.date ? new Date(item.date).toLocaleDateString() : '—'}</td>
                      <td>
                        <span style={{
                          textTransform: 'capitalize',
                          fontWeight: item.type === 'sale' ? theme.typography.fontWeights.medium : 'normal'
                        }}>
                          {displayTitle}
                        </span>
                        {item.type === 'sale' && item.status === 'pending' && (
                          <span style={{
                            marginLeft: theme.spacing.xs,
                            fontSize: theme.typography.fontSizes.xs,
                            color: currentTheme.colors.textSecondary
                          }}>
                            (Pending Approval)
                          </span>
                        )}
                      </td>
                      <AmountCell $isPositive={isPositive}>
                        {isPositive ? '+' : '-'}${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </AmountCell>
                      <td>
                        <Badge $type={statusType as 'success' | 'warning' | 'danger' | 'info'}>
                          {item.type === 'sale' && item.status === 'pending'
                            ? 'PENDING SALE'
                            : (item.status || 'pending').toString().toUpperCase()}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </TableContainer>

          {/* Advanced Analytics - Hidden from Accountant and Employee */}
          {user?.role?.toLowerCase() !== 'accountant' && user?.role?.toLowerCase() !== 'employee' && (
            <AnalyticsSection>
              <div className="analytics-info">
                <h3>
                  <BarChart3 size={24} />
                  Advanced Analytics
                </h3>
                <p>
                  Get real-time insights into KPIs, trends, profitability analysis, and detailed financial reports.
                  View comprehensive analytics with customizable dashboards and reporting tools.
                </p>
              </div>
              <AnalyticsButton onClick={handleAnalyticsClick}>
                <LineChart size={20} />
                View Analytics
              </AnalyticsButton>
            </AnalyticsSection>
          )}

        </ContentContainer>
      </PageContainer>
    </Layout >
  );
};

export default AdminDashboard;