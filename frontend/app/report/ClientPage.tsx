'use client';
import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Layout from '@/components/layout';
import { apiClient } from '@/lib/api';
import { useAuth } from '@/lib/rbac/auth-context';
import useUserStore from '@/store/userStore';
import { toast } from 'sonner';
import { theme } from '@/components/common/theme';
import {
  DollarSign,
  TrendingUp,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  BarChart3,
  AlertCircle,
  ShoppingCart,
  Package,
  LineChart,
  Brain,
  Zap,
  Lightbulb,
  Target,
  CheckCircle2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const PRIMARY_COLOR = (props: any) => props.theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = (props: any) => props.theme.colors.textDark || '#000';
const TEXT_COLOR_MUTED = (props: any) => props.theme.colors.textSecondary || '#666';

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

const DateFilterCard = styled.div`
  background: ${theme.colors.background};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  gap: ${theme.spacing.md};
  align-items: flex-end;
  flex-wrap: wrap;
  transition: box-shadow ${theme.transitions.default};

  &:hover {
    box-shadow: ${CardShadowHover};
  }
`;

const DateInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  flex: 1;
  min-width: 200px;
`;

const ReportSection = styled.div`
  margin-bottom: ${theme.spacing.xl};
`;

const ReportCard = styled.div`
  background: ${theme.colors.background};
  padding: ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  margin-bottom: ${theme.spacing.lg};
  transition: box-shadow ${theme.transitions.default};

  &:hover {
    box-shadow: ${CardShadowHover};
  }
`;

const ReportHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.lg};
  padding-bottom: ${theme.spacing.md};
  border-bottom: 2px solid ${theme.colors.border};
  
  h2 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
    margin: 0;
    
    svg {
      width: 24px;
      height: 24px;
      color: ${PRIMARY_COLOR};
    }
  }
  
  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${theme.typography.fontSizes.sm};
    margin: ${theme.spacing.xs} 0 0;
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const SummaryCard = styled.div<{ $type?: 'revenue' | 'expense' | 'profit' | 'cash' }>`
  background: ${p => {
    const isDark = p.theme.mode === 'dark';
    if (p.$type === 'revenue') return isDark ? 'rgba(16, 185, 129, 0.15)' : '#f0fdf4';
    if (p.$type === 'expense') return isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2';
    if (p.$type === 'profit') return isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff';
    return p.theme.colors.backgroundSecondary;
  }};
  border: 1px solid ${p => {
    const isDark = p.theme.mode === 'dark';
    if (p.$type === 'revenue') return isDark ? 'rgba(16, 185, 129, 0.3)' : '#bbf7d0';
    if (p.$type === 'expense') return isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca';
    if (p.$type === 'profit') return isDark ? 'rgba(59, 130, 246, 0.3)' : '#bfdbfe';
    return p.theme.colors.border;
  }};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.md};
  transition: transform ${theme.transitions.default}, box-shadow ${theme.transitions.default};
  box-shadow: ${CardShadow};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${CardShadowHover};
  }
  
  .label {
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
    margin-bottom: ${theme.spacing.sm};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xs};
    font-weight: ${theme.typography.fontWeights.medium};
  }
  
  .value {
    font-size: clamp(20px, 4vw, 28px);
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${p => {
    const isDark = p.theme.mode === 'dark';
    if (p.$type === 'expense') return isDark ? '#fca5a5' : '#dc2626';
    if (p.$type === 'revenue') return isDark ? '#6ee7b7' : TEXT_COLOR_DARK(p);
    if (p.$type === 'profit') return isDark ? '#93c5fd' : TEXT_COLOR_DARK(p);
    return TEXT_COLOR_DARK(p);
  }};
    margin-bottom: ${theme.spacing.xs};
  }
  
  .sub-value {
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
    margin-top: ${theme.spacing.xs};
  }
`;

const CategoryTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: ${theme.spacing.md};
  
  thead {
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
  }
  
  tbody {
    tr {
      border-bottom: 1px solid ${theme.colors.border};
      transition: background-color ${theme.transitions.default};
      
      &:hover {
        background: ${theme.colors.backgroundSecondary};
      }
      
      &:last-child {
        border-bottom: none;
      }
      
      td {
        padding: ${theme.spacing.md} ${theme.spacing.lg};
        color: ${TEXT_COLOR_MUTED};
        font-size: ${theme.typography.fontSizes.sm};
        
        &:last-child {
          font-weight: ${theme.typography.fontWeights.bold};
          color: ${TEXT_COLOR_DARK};
        }
      }
    }
  }
`;

const CashFlowTable = styled.table`
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: ${theme.spacing.md};
  
  thead {
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
  }
  
  tbody {
    tr {
      border-bottom: 1px solid ${theme.colors.border};
      transition: background-color ${theme.transitions.default};
      
      &:hover {
        background: ${theme.colors.backgroundSecondary};
      }
      
      &:last-child {
        border-bottom: none;
      }
      
      td {
        padding: ${theme.spacing.md} ${theme.spacing.lg};
        color: ${TEXT_COLOR_MUTED};
        font-size: ${theme.typography.fontSizes.sm};
        
        &:nth-child(2) {
          color: #059669;
          font-weight: ${theme.typography.fontWeights.medium};
        }
        
        &:nth-child(3) {
          color: #dc2626;
          font-weight: ${theme.typography.fontWeights.medium};
        }
        
        &:last-child {
          font-weight: ${theme.typography.fontWeights.bold};
          color: ${TEXT_COLOR_DARK};
        }
      }
    }
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

const EmptyState = styled.div`
  text-align: center;
  padding: ${theme.spacing.xxl} ${theme.spacing.lg};
  color: ${TEXT_COLOR_MUTED};
  
  svg {
    width: 48px;
    height: 48px;
    margin: 0 auto ${theme.spacing.md};
    opacity: 0.5;
    color: ${TEXT_COLOR_MUTED};
  }
  
  h3 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.sm};
    color: ${TEXT_COLOR_DARK};
  }
`;

const ButtonRow = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-top: ${theme.spacing.md};
  flex-wrap: wrap;
`;

const SectionTitle = styled.h3`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  margin: 0 0 ${theme.spacing.md};
  color: ${TEXT_COLOR_DARK};
`;

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.xl};
  margin-top: ${theme.spacing.xl};

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.lg};
  }
`;

const InsightCard = styled.div<{ $priority?: 'high' | 'medium' | 'low' }>`
  background: ${p => {
    const isDark = p.theme.mode === 'dark';
    if (p.$priority === 'high') return isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2';
    if (p.$priority === 'medium') return isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb';
    return isDark ? 'rgba(16, 185, 129, 0.15)' : '#f0fdf4';
  }};
  border: 1px solid ${p => {
    const isDark = p.theme.mode === 'dark';
    if (p.$priority === 'high') return isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca';
    if (p.$priority === 'medium') return isDark ? 'rgba(245, 158, 11, 0.3)' : '#fde68a';
    return isDark ? 'rgba(16, 185, 129, 0.3)' : '#bbf7d0';
  }};
  border-left: 4px solid ${p => {
    const isDark = p.theme.mode === 'dark';
    if (p.$priority === 'high') return isDark ? '#f87171' : '#dc2626';
    if (p.$priority === 'medium') return isDark ? '#fbbf24' : '#d97706';
    return PRIMARY_COLOR;
  }};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.md};
  
  .insight-header {
    display: flex;
    align-items: center;
    gap: ${theme.spacing.sm};
    margin-bottom: ${theme.spacing.sm};
    
    h4 {
      font-size: ${theme.typography.fontSizes.md};
      font-weight: ${theme.typography.fontWeights.bold};
      color: ${TEXT_COLOR_DARK};
      margin: 0;
    }
    
  }
  
  .insight-message {
    color: ${TEXT_COLOR_DARK};
    margin-bottom: ${theme.spacing.sm};
    line-height: 1.6;
  }
  
  .insight-actions {
    margin-top: ${theme.spacing.md};
    padding-top: ${theme.spacing.md};
    border-top: 1px solid ${theme.colors.border};
    
    ul {
      margin: 0;
      padding-left: ${theme.spacing.lg};
      color: ${TEXT_COLOR_MUTED};
      font-size: ${theme.typography.fontSizes.sm};
    }
  }
`;

const AlertCard = styled.div<{ $severity?: 'high' | 'medium' | 'low' }>`
  background: ${p => {
    const isDark = p.theme.mode === 'dark';
    if (p.$severity === 'high') return isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2';
    if (p.$severity === 'medium') return isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb';
    return isDark ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff';
  }};
  border: 1px solid ${p => {
    const isDark = p.theme.mode === 'dark';
    if (p.$severity === 'high') return isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca';
    if (p.$severity === 'medium') return isDark ? 'rgba(245, 158, 11, 0.3)' : '#fde68a';
    return isDark ? 'rgba(59, 130, 246, 0.3)' : '#bfdbfe';
  }};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.sm};
  display: flex;
  align-items: flex-start;
  gap: ${theme.spacing.sm};
  
  .alert-icon {
    color: ${(p) => {
    if (p.$severity === 'high') return '#dc2626';
    if (p.$severity === 'medium') return '#d97706';
    return '#2563eb';
  }};
    flex-shrink: 0;
    margin-top: 2px;
  }
  
  .alert-message {
    color: ${TEXT_COLOR_DARK};
    font-size: ${theme.typography.fontSizes.sm};
    line-height: 1.5;
  }
`;

const TrendBadge = styled.span<{ $direction?: 'increasing' | 'decreasing' | 'stable' }>`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  padding: 6px 12px;
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  background: ${p => {
    const isDark = p.theme.mode === 'dark';
    if (p.$direction === 'increasing') return isDark ? 'rgba(16, 185, 129, 0.2)' : '#d1fae5';
    if (p.$direction === 'decreasing') return isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2';
    return isDark ? 'rgba(148, 163, 184, 0.2)' : '#f3f4f6';
  }};
  color: ${p => {
    const isDark = p.theme.mode === 'dark';
    if (p.$direction === 'increasing') return isDark ? '#6ee7b7' : '#065f46';
    if (p.$direction === 'decreasing') return isDark ? '#fca5a5' : '#991b1b';
    return TEXT_COLOR_MUTED(p);
  }};
`;

const PriorityBadge = styled.span<{ $priority?: 'high' | 'medium' | 'low' }>`
  font-size: ${theme.typography.fontSizes.xs};
  padding: 4px 8px;
  border-radius: ${theme.borderRadius.sm};
  text-transform: uppercase;
  font-weight: ${theme.typography.fontWeights.bold};
  background: ${(p) => {
    if (p.$priority === 'high') return '#dc2626';
    if (p.$priority === 'medium') return '#d97706';
    return PRIMARY_COLOR;
  }};
  color: white;
`;

const QuickForecastButton = styled(Button)`
  margin-top: ${theme.spacing.md};
  width: 100%;
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
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.fontSizes.sm};
`;

const PageButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${theme.borderRadius.sm};
  border: 1px solid ${props => props.$active ? PRIMARY_COLOR : theme.colors.border};
  background: ${props => props.$active ? PRIMARY_COLOR : theme.colors.background};
  color: ${props => props.$active ? '#fff' : theme.colors.textDark};
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${props => props.$active ? 600 : 400};
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: ${props => props.$active ? PRIMARY_COLOR : theme.colors.backgroundSecondary};
    border-color: ${PRIMARY_COLOR};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

interface IncomeStatement {
  period: { start_date?: string; end_date?: string };
  revenue: {
    total: number;
    by_category: Record<string, number>;
  };
  sales: {
    total: number;
    by_category?: Record<string, number>;
  };
  expenses: {
    total: number;
    by_category: Record<string, number>;
  };
  profit: number;
  profit_margin: number;
}

interface CashFlow {
  period: { start_date?: string; end_date?: string };
  summary: {
    total_inflow: number;
    total_outflow: number;
    net_cash_flow: number;
  };
  daily_cash_flow: Record<string, { inflow: number; outflow: number; net: number }>;
}

interface FinancialSummary {
  period: { start_date?: string; end_date?: string };
  financials: {
    total_revenue: number;
    total_sales: number;
    total_expenses: number;
    profit: number;
    profit_margin: number;
  };
  revenue_by_category: Record<string, number>;
  sales_by_category?: Record<string, number>;
  expenses_by_category: Record<string, number>;
  transaction_counts: {
    revenue: number;
    sales: number;
    expenses: number;
    total: number;
  };
  generated_at: string;
}

interface InventorySummary {
  total_items: number;
  total_cost_value: number;
  total_selling_value: number;
  potential_profit: number;
  total_quantity_in_stock?: number;
}

interface SalesSummary {
  total_sales: number;
  total_revenue: number;
  pending_sales: number;
  posted_sales: number;
  period_start?: string;
  period_end?: string;
}

interface ForecastDataPoint {
  period?: string;
  date?: string;
  forecasted_value?: number;
  method?: string;
}

interface Forecast {
  id: number;
  name: string;
  description?: string;
  forecast_type: string;
  period_type: string;
  start_date: string;
  end_date: string;
  method: string;
  method_params?: Record<string, unknown>;
  forecast_data?: ForecastDataPoint[];
  created_at: string;
}

interface MLInsight {
  metric: string;
  forecast?: any[];
  advice?: Array<{
    priority: string;
    title: string;
    message: string;
    actions: string[];
  }>;
  alerts?: Array<{
    severity: string;
    message: string;
  }>;
  summary?: string;
  trend_analysis?: {
    direction: string;
    percentage: number;
    average: number;
    max: number;
    min: number;
  };
}

interface ForecastWithAdvice {
  metric: string;
  model_type: string;
  forecast: ForecastDataPoint[];
  advice: Array<{
    priority: string;
    title: string;
    message: string;
    actions: string[];
  }>;
  alerts: Array<{
    severity: string;
    message: string;
  }>;
  summary: string;
  trend_analysis: {
    direction: string;
    percentage: number;
    average: number;
    max: number;
    min: number;
  };
}

export default function ReportPage() {
  const { user } = useAuth();
  const storeUser = useUserStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() - 1);
    date.setDate(1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });

  const [financialSummary, setFinancialSummary] = useState<FinancialSummary | null>(null);
  const [incomeStatement, setIncomeStatement] = useState<IncomeStatement | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlow | null>(null);
  const [inventorySummary, setInventorySummary] = useState<InventorySummary | null>(null);
  const [salesSummary, setSalesSummary] = useState<SalesSummary | null>(null);
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [mlInsights, setMlInsights] = useState<any>(null);
  const [loadingMLInsights, setLoadingMLInsights] = useState(false);
  const [generatingForecast, setGeneratingForecast] = useState<string | null>(null);
  const [savingForecast, setSavingForecast] = useState<string | null>(null);

  // Manual Forecast Form State
  const [showCreateForecast, setShowCreateForecast] = useState(false);
  const [newForecast, setNewForecast] = useState({
    name: '',
    description: '',
    forecast_type: 'revenue',
    method: 'moving_average',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
    method_params: {}
  });

  const [dailyCashFlowSearch, setDailyCashFlowSearch] = useState('');

  // Pagination State for Daily Cash Flow
  const [cashFlowPage, setCashFlowPage] = useState(1);
  const [cashFlowItemsPerPage] = useState(10);

  // Pagination State for Forecasts
  const [forecastsPage, setForecastsPage] = useState(1);
  const [forecastsItemsPerPage] = useState(10);

  // Delete Confirmation Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedForecastForDelete, setSelectedForecastForDelete] = useState<Forecast | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Helper function to safely convert values to numbers, handling NaN, null, undefined
  const safeNumber = (value: unknown): number => {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  };

  const loadReports = useCallback(async (useDateFilter: boolean = true) => {
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

      // Get accessible user IDs based on role
      // Admin/Super Admin: See all (no filtering)
      // Finance Admin: See their own + subordinates (ONLY accountants and employees, NOT other Finance Admins)
      // Accountant: See their own + their Finance Admin's team (ONLY accountants and employees, NOT other Finance Admins)
      // Employee: See only their own
      let accessibleUserIds: number[] | null = null;
      const isAdmin = userRole === 'admin' || userRole === 'super_admin';

      if (isAdmin) {
        // Admin can see all - no filtering needed
        accessibleUserIds = null;
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
          accessibleUserIds = [userId, ...validSubordinateIds];

          if (process.env.NODE_ENV === 'development') {
            console.log('Finance Admin - Accessible User IDs for Reports:', {
              userId: userId,
              subordinatesCount: subordinates.length,
              validSubordinateIds: validSubordinateIds,
              accessibleUserIds: accessibleUserIds
            });
          }
        } catch (err: unknown) {
          console.warn('Failed to fetch subordinates, using only finance admin ID:', err);
          const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
          accessibleUserIds = [userId];
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
            accessibleUserIds = [financeAdminId, ...validSubordinateIds];

            if (process.env.NODE_ENV === 'development') {
              console.log('Accountant - Accessible User IDs for Reports (from Finance Admin):', {
                accountantId: accountantId,
                financeAdminId: financeAdminId,
                subordinatesCount: subordinates.length,
                validSubordinateIds: validSubordinateIds,
                accessibleUserIds: accessibleUserIds
              });
            }
          } catch (err) {
            console.error('Failed to fetch Finance Admin subordinates for accountant:', err);
            // Fallback: if we can't get subordinates, at least try to show data from the Finance Admin
            accessibleUserIds = [managerId];
          }
        } else {
          // Accountant has no manager assigned - fallback to just themselves
          console.warn('Accountant has no manager (Finance Admin) assigned - using only accountant ID');
          accessibleUserIds = [accountantId];
        }
      } else if (isEmployee && user?.id) {
        // Employee: Can only see their own data
        const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        accessibleUserIds = [userId];
      }

      const dateParams = useDateFilter ? { startDate, endDate } : { startDate: undefined, endDate: undefined };

      // Fetch sales data for the period (for detailed breakdowns)
      let salesData: unknown[] = [];
      try {
        const salesResponse = await apiClient.getSales({
          status: 'posted', // Only include posted sales in reports
          limit: 1000, // Backend maximum is 1000
          start_date: dateParams.startDate ? new Date(dateParams.startDate + 'T00:00:00').toISOString() : undefined,
          end_date: dateParams.endDate ? new Date(dateParams.endDate + 'T23:59:59').toISOString() : undefined,
        });
        const salesArray = Array.isArray(salesResponse?.data)
          ? salesResponse.data
          : (salesResponse?.data && typeof salesResponse.data === 'object' && 'data' in salesResponse.data
            ? (salesResponse.data as { data?: unknown[] }).data || []
            : []);
        salesData = salesArray || [];

        // Apply role-based filtering to sales data
        // Admin/Super Admin: See all (no filtering)
        // Finance Admin: Filter to only their team's sales (themselves + subordinates who are accountants/employees)
        // Accountant: Filter to only their Finance Admin's team sales (Finance Admin + subordinates who are accountants/employees)
        // Employee: Filter to only their own sales
        if (!isAdmin && accessibleUserIds && accessibleUserIds.length > 0) {
          // Finance Admin, Accountant, or Employee: filter based on accessibleUserIds
          salesData = salesData.filter((s: unknown) => {
            const sale = s as { sold_by_id?: unknown; soldBy?: unknown; sold_by?: unknown; created_by_id?: unknown; createdBy?: unknown };
            const soldById = sale.sold_by_id || sale.soldBy || sale.sold_by || sale.created_by_id || sale.createdBy;
            if (!soldById) return false;
            const soldByIdNum = typeof soldById === 'string' ? parseInt(soldById, 10) : (typeof soldById === 'number' ? soldById : NaN);
            return !isNaN(soldByIdNum) && accessibleUserIds!.includes(soldByIdNum);
          });
        }
        // Admin/Super Admin sees all - no filtering needed
      } catch (err: unknown) {
        console.warn('Failed to fetch detailed sales data for reports:', err);
        // Continue without sales data - we'll use sales summary API instead
      }

      // Check if user can view inventory summary (Finance Admin, Admin, Manager)
      const canViewInventory = user?.role === 'finance_manager' ||
        user?.role === 'finance_admin' ||
        user?.role === 'admin' ||
        user?.role === 'super_admin' ||
        user?.role === 'manager';

      // Check if user can view sales summary (Accountant, Finance Admin, Admin, Manager)
      const canViewSalesSummary = user?.role === 'accountant' ||
        user?.role === 'finance_manager' ||
        user?.role === 'finance_admin' ||
        user?.role === 'admin' ||
        user?.role === 'super_admin' ||
        user?.role === 'manager';

      // Check if user can view forecasts (Admin, Finance Admin, Manager)
      const canViewForecasts = user?.role === 'finance_manager' ||
        user?.role === 'finance_admin' ||
        user?.role === 'admin' ||
        user?.role === 'super_admin' ||
        user?.role === 'manager';

      // Note: Backend APIs (getFinancialSummary, getIncomeStatement, getCashFlow) should already filter
      // data by user role. The frontend trusts these responses. Sales data is filtered above.
      const [summaryResult, incomeResult, cashFlowResult, inventoryResult, salesSummaryResult, forecastsResult] = await Promise.allSettled([
        apiClient.getFinancialSummary(dateParams.startDate, dateParams.endDate),
        apiClient.getIncomeStatement(dateParams.startDate, dateParams.endDate),
        apiClient.getCashFlow(dateParams.startDate, dateParams.endDate),
        canViewInventory ? apiClient.getInventorySummary().catch((err: unknown) => {
          // Silently handle 403 errors (expected for non-finance admins)
          const error = err as ErrorWithDetails;
          if (error.response?.status === 403) {
            return { data: null };
          }
          throw err;
        }) : Promise.resolve({ data: null }),
        canViewSalesSummary ? apiClient.getSalesSummary({
          start_date: dateParams.startDate ? new Date(dateParams.startDate + 'T00:00:00').toISOString() : undefined,
          end_date: dateParams.endDate ? new Date(dateParams.endDate + 'T23:59:59').toISOString() : undefined,
        }).catch((err: unknown) => {
          // Silently handle 403 errors (expected for non-authorized users)
          const error = err as ErrorWithDetails;
          if (error.response?.status === 403) {
            return { data: null };
          }
          throw err;
        }) : Promise.resolve({ data: null }),
        canViewForecasts ? apiClient.getForecasts({ limit: 100 }).catch((err: unknown) => {
          // Silently handle 403 errors (expected for non-authorized users)
          const error = err as ErrorWithDetails;
          if (error.response?.status === 403) {
            return { data: [] };
          }
          throw err;
        }) : Promise.resolve({ data: [] }),
      ]);

      // Filter to only include POSTED sales for revenue/profit calculations
      // This ensures revenue and net profit are only calculated from approved sales
      const postedSalesData = salesData.filter((s: unknown) => {
        const sale = s as { status?: string };
        return sale.status === 'posted' || sale.status === 'POSTED' || sale.status?.toLowerCase() === 'posted';
      });

      // Calculate sales totals from individual sales - ONLY from POSTED (approved) sales
      // This is a fallback if sales summary API is not available
      const totalSalesFromData = postedSalesData.reduce((sum: number, s: unknown) => {
        const sale = s as { total_sale?: unknown };
        return sum + safeNumber(sale.total_sale);
      }, 0);
      const salesByCategory: Record<string, number> = {};
      postedSalesData.forEach((s: unknown) => {
        const sale = s as { category?: string; total_sale?: unknown; item?: { category?: string } };
        const category = sale.item?.category || sale.category || 'Sales';
        salesByCategory[category] = (salesByCategory[category] || 0) + safeNumber(sale.total_sale);
      });

      if (summaryResult.status === 'fulfilled') {
        const summaryData = summaryResult.value.data || summaryResult.value;
        if (summaryData && (summaryData.financials || summaryData.revenue_by_category || summaryData.expenses_by_category)) {
          // Initial calculation with individual sales data (will be updated if sales summary is available)
          const baseRevenue = safeNumber(summaryData.financials?.total_revenue);
          const baseExpenses = safeNumber(summaryData.financials?.total_expenses);
          const calculatedRevenue = baseRevenue + totalSalesFromData;
          const calculatedProfit = calculatedRevenue - baseExpenses;
          const calculatedProfitMargin = calculatedRevenue > 0
            ? (calculatedProfit / calculatedRevenue) * 100
            : 0;

          const enhancedSummary = {
            ...summaryData,
            financials: {
              ...summaryData.financials,
              total_sales: safeNumber(totalSalesFromData),
              total_revenue: calculatedRevenue,
              total_expenses: baseExpenses,
              profit: calculatedProfit,
              profit_margin: calculatedProfitMargin,
            },
            sales_by_category: salesByCategory,
            transaction_counts: {
              ...summaryData.transaction_counts,
              sales: postedSalesData.length, // Only count POSTED sales
              total: (summaryData.transaction_counts?.total || 0) + postedSalesData.length,
            },
          };

          if (process.env.NODE_ENV === 'development') {
            console.log('Financial Summary loaded (initial):', {
              base_revenue: baseRevenue,
              sales_from_data: totalSalesFromData,
              total_revenue: enhancedSummary.financials?.total_revenue,
              total_sales: enhancedSummary.financials?.total_sales,
              total_expenses: enhancedSummary.financials?.total_expenses,
              revenue_categories: Object.keys(enhancedSummary.revenue_by_category || {}).length,
              sales_categories: Object.keys(enhancedSummary.sales_by_category || {}).length,
              expense_categories: Object.keys(enhancedSummary.expenses_by_category || {}).length,
            });
          }
          setFinancialSummary(enhancedSummary);
        } else {
          console.warn('Invalid summary data structure:', summaryData);
          setFinancialSummary(null);
        }
      } else {
        // Failed to load financial summary, try to use income statement data if available
        if (incomeResult.status === 'fulfilled') {
          const incomeData = incomeResult.value.data as { revenue?: { by_category?: Record<string, number>; total?: number }; expenses?: { by_category?: Record<string, number>; total?: number } };
          const revenueCategories = Object.keys(incomeData.revenue?.by_category || {}).length;
          const expenseCategories = Object.keys(incomeData.expenses?.by_category || {}).length;
          const revenueObj = incomeData.revenue && typeof incomeData.revenue === 'object' ? incomeData.revenue as { total?: number } : {};
          const expensesObj = incomeData.expenses && typeof incomeData.expenses === 'object' ? incomeData.expenses as { total?: number } : {};
          const baseRevenue = safeNumber(revenueObj.total);
          const baseExpenses = safeNumber(expensesObj.total);
          const calculatedRevenue = baseRevenue + totalSalesFromData;
          const calculatedProfit = calculatedRevenue - baseExpenses;
          const calculatedProfitMargin = calculatedRevenue > 0
            ? (calculatedProfit / calculatedRevenue) * 100
            : 0;

          setFinancialSummary({
            period: { start_date: startDate, end_date: endDate },
            financials: {
              total_revenue: calculatedRevenue,
              total_sales: safeNumber(totalSalesFromData),
              total_expenses: baseExpenses,
              profit: calculatedProfit,
              profit_margin: calculatedProfitMargin,
            },
            revenue_by_category: (incomeData.revenue?.by_category as Record<string, number>) || {},
            sales_by_category: salesByCategory,
            expenses_by_category: (incomeData.expenses?.by_category as Record<string, number>) || {},
            transaction_counts: {
              revenue: revenueCategories > 0 ? revenueCategories : 0,
              sales: postedSalesData.length, // Only count POSTED sales
              expenses: expenseCategories > 0 ? expenseCategories : 0,
              total: revenueCategories + expenseCategories + postedSalesData.length,
            },
            generated_at: new Date().toISOString(),
          });
        } else {
          setFinancialSummary(null);
        }
      }

      if (incomeResult.status === 'fulfilled') {
        const incomeData = incomeResult.value.data || incomeResult.value;
        if (incomeData && (incomeData.revenue || incomeData.expenses)) {
          // Enhance income statement with sales data
          const baseRevenue = safeNumber(incomeData.revenue && typeof incomeData.revenue === 'object' && incomeData.revenue !== null && 'total' in incomeData.revenue ? (incomeData.revenue as { total: number }).total : 0);
          const baseExpenses = safeNumber(incomeData.expenses && typeof incomeData.expenses === 'object' && incomeData.expenses !== null && 'total' in incomeData.expenses ? (incomeData.expenses as { total: number }).total : 0);
          const calculatedRevenue = baseRevenue + totalSalesFromData;
          const calculatedProfit = calculatedRevenue - baseExpenses;
          const calculatedProfitMargin = calculatedRevenue > 0
            ? (calculatedProfit / calculatedRevenue) * 100
            : 0;

          const enhancedIncome = {
            ...incomeData,
            sales: {
              total: safeNumber(totalSalesFromData),
              by_category: salesByCategory,
            },
            revenue: {
              by_category: (incomeData.revenue && typeof incomeData.revenue === 'object' && 'by_category' in incomeData.revenue ? incomeData.revenue.by_category : undefined) || {},
              total: calculatedRevenue,
            },
            profit: calculatedProfit,
            profit_margin: calculatedProfitMargin,
          };
          setIncomeStatement(enhancedIncome as IncomeStatement);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Invalid income statement data structure:', incomeData);
          }
          setIncomeStatement(null);
        }
      } else {
        console.error('Failed to load income statement:', incomeResult.reason);
        setIncomeStatement(null);
      }

      if (cashFlowResult.status === 'fulfilled') {
        const cashFlowData = cashFlowResult.value.data || cashFlowResult.value;
        if (cashFlowData && (cashFlowData.summary || cashFlowData.daily_cash_flow)) {
          // Enhance cash flow with sales data - ONLY from POSTED (approved) sales
          const salesByDay: Record<string, { inflow: number; outflow: number; net: number }> = {};
          postedSalesData.forEach((sale: unknown) => {
            const saleData = sale as { created_at?: string; total_sale?: unknown };
            const saleDate = saleData.created_at ? new Date(saleData.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
            if (!salesByDay[saleDate]) {
              salesByDay[saleDate] = { inflow: 0, outflow: 0, net: 0 };
            }
            const saleAmount = safeNumber(saleData.total_sale);
            salesByDay[saleDate].inflow += saleAmount;
            salesByDay[saleDate].net += saleAmount;
          });

          // Merge sales into daily cash flow
          const enhancedDailyFlow = { ...cashFlowData.daily_cash_flow };
          Object.entries(salesByDay).forEach(([date, flow]) => {
            if (enhancedDailyFlow[date]) {
              enhancedDailyFlow[date].inflow += flow.inflow;
              enhancedDailyFlow[date].net += flow.net;
            } else {
              enhancedDailyFlow[date] = flow;
            }
          });

          const baseInflow = safeNumber(cashFlowData.summary?.total_inflow);
          const baseNetFlow = safeNumber(cashFlowData.summary?.net_cash_flow);

          // Use sales revenue from summary result if available, otherwise use calculated totalSalesFromData
          // Check salesSummaryResult to get the sales revenue value
          let salesRevenueForCashFlow = totalSalesFromData;
          if (salesSummaryResult.status === 'fulfilled') {
            const salesSummaryData = salesSummaryResult.value.data || salesSummaryResult.value;
            if (salesSummaryData && typeof salesSummaryData === 'object' && 'total_revenue' in salesSummaryData) {
              salesRevenueForCashFlow = safeNumber((salesSummaryData as SalesSummary).total_revenue);
            }
          }

          const enhancedCashFlow = {
            ...cashFlowData,
            summary: {
              ...cashFlowData.summary,
              total_inflow: baseInflow + salesRevenueForCashFlow,
              net_cash_flow: baseNetFlow + salesRevenueForCashFlow,
            },
            daily_cash_flow: enhancedDailyFlow,
          };
          setCashFlow(enhancedCashFlow);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.warn('Invalid cash flow data structure:', cashFlowData);
          }
          setCashFlow(null);
        }
      } else {
        console.error('Failed to load cash flow:', cashFlowResult.reason);
        setCashFlow(null);
      }

      // Handle inventory summary
      if (inventoryResult.status === 'fulfilled') {
        const inventoryData = inventoryResult.value.data || inventoryResult.value;
        if (inventoryData && typeof inventoryData === 'object' &&
          ('total_items' in inventoryData || 'total_selling_value' in inventoryData)) {
          setInventorySummary(inventoryData as InventorySummary);
        } else {
          setInventorySummary(null);
        }
      } else {
        // Only log error if it's not a 403 (permission denied)
        if (inventoryResult.reason?.response?.status !== 403) {
          console.warn('Failed to load inventory summary:', inventoryResult.reason);
        }
        setInventorySummary(null);
      }

      // Handle sales summary and integrate with financial data
      // Sales summary API provides more accurate aggregated data from the backend
      if (salesSummaryResult.status === 'fulfilled') {
        const salesData = salesSummaryResult.value.data || salesSummaryResult.value;
        if (salesData && typeof salesData === 'object' &&
          ('total_sales' in salesData || 'total_revenue' in salesData)) {
          const salesSummaryData = salesData as SalesSummary;
          setSalesSummary(salesSummaryData);

          // Always use sales summary revenue when available (more accurate than calculating from individual sales)
          // This ensures we use the backend's aggregated data which only includes POSTED sales
          // Update financial summary with accurate sales data from summary API
          if (summaryResult.status === 'fulfilled') {
            const summaryData = summaryResult.value.data || summaryResult.value;
            if (summaryData && (summaryData.financials || summaryData.revenue_by_category || summaryData.expenses_by_category)) {
              // Use sales summary revenue instead of calculated totalSalesFromData
              // Sales summary is more accurate as it's aggregated by the backend
              const baseRevenue = safeNumber(summaryData.financials?.total_revenue);
              const baseExpenses = safeNumber(summaryData.financials?.total_expenses);
              const salesRevenue = safeNumber(salesSummaryData.total_revenue);

              // Total revenue = base revenue (from revenue entries) + sales revenue (from posted sales)
              const calculatedRevenue = baseRevenue + salesRevenue;
              const calculatedProfit = calculatedRevenue - baseExpenses;
              const calculatedProfitMargin = calculatedRevenue > 0
                ? (calculatedProfit / calculatedRevenue) * 100
                : 0;

              const enhancedSummary = {
                ...summaryData,
                financials: {
                  ...summaryData.financials,
                  total_sales: salesRevenue, // Use sales revenue from summary API
                  total_revenue: calculatedRevenue, // Base revenue + sales revenue
                  total_expenses: baseExpenses,
                  profit: calculatedProfit,
                  profit_margin: calculatedProfitMargin,
                },
                sales_by_category: salesByCategory, // Keep category breakdown from individual sales
                transaction_counts: {
                  ...summaryData.transaction_counts,
                  sales: salesSummaryData.posted_sales || postedSalesData.length,
                  total: (summaryData.transaction_counts?.total || 0) + (salesSummaryData.posted_sales || postedSalesData.length),
                },
              };

              if (process.env.NODE_ENV === 'development') {
                console.log('Financial Summary updated with Sales Summary:', {
                  base_revenue: baseRevenue,
                  sales_revenue_from_summary: salesRevenue,
                  total_revenue_calculated: calculatedRevenue,
                  total_sales: enhancedSummary.financials?.total_sales,
                  total_expenses: enhancedSummary.financials?.total_expenses,
                  profit: enhancedSummary.financials?.profit,
                  profit_margin: enhancedSummary.financials?.profit_margin,
                });
              }

              setFinancialSummary(enhancedSummary);
            }
          }
        } else {
          setSalesSummary(null);
        }
      } else {
        // Only log error if it's not a 403 (permission denied)
        if (salesSummaryResult.reason?.response?.status !== 403) {
          console.warn('Failed to load sales summary:', salesSummaryResult.reason);
        }
        setSalesSummary(null);
      }

      // Process forecasts result
      if (forecastsResult.status === 'fulfilled') {
        const forecastsData = forecastsResult.value?.data || forecastsResult.value || [];
        const forecastsArray = Array.isArray(forecastsData) ? forecastsData : [];
        // Parse forecast data if it's a string
        const parsedForecasts = forecastsArray.map((f: unknown) => {
          const forecast = f as Forecast;
          if (typeof forecast.forecast_data === 'string') {
            try {
              forecast.forecast_data = JSON.parse(forecast.forecast_data) as ForecastDataPoint[];
            } catch {
              forecast.forecast_data = [];
            }
          }
          if (typeof forecast.method_params === 'string') {
            try {
              forecast.method_params = JSON.parse(forecast.method_params) as Record<string, unknown>;
            } catch {
              forecast.method_params = {};
            }
          }
          return forecast;
        });
        setForecasts(parsedForecasts);
      } else {
        // Only log error if it's not a 403 (permission denied)
        if (forecastsResult.reason?.response?.status !== 403) {
          console.warn('Failed to load forecasts:', forecastsResult.reason);
        }
        setForecasts([]);
      }

      if (summaryResult.status === 'rejected' && incomeResult.status === 'rejected' && cashFlowResult.status === 'rejected') {
        const firstError = summaryResult.reason || incomeResult.reason || cashFlowResult.reason;
        let errorMsg = 'Failed to load reports';
        if (firstError?.response?.data?.detail) {
          const detail = firstError.response.data.detail;
          if (typeof detail === 'string') {
            errorMsg = detail;
          } else if (Array.isArray(detail)) {
            errorMsg = detail.map((e: unknown) => {
              if (typeof e === 'string') return e;
              const errorDetail = e as { msg?: string };
              return errorDetail.msg || JSON.stringify(e);
            }).join(', ');
          }
        } else if (firstError?.message) {
          errorMsg = firstError.message;
        }
        setError(errorMsg);
        toast.error(errorMsg);
        setFinancialSummary(null);
        setIncomeStatement(null);
        setCashFlow(null);
      }

    } catch (err: unknown) {
      const error = err as ErrorWithDetails;
      let errorMessage = 'Failed to load reports';

      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;

        if (Array.isArray(detail)) {
          errorMessage = detail.map((e: unknown) => {
            if (typeof e === 'string') return e;
            const errorDetail = e as { msg?: string; loc?: string[] };
            if (errorDetail.msg) return `${errorDetail.loc?.join('.') || 'Field'}: ${errorDetail.msg}`;
            return JSON.stringify(e);
          }).join(', ');
        }
        else if (typeof detail === 'object' && detail && 'msg' in detail) {
          const detailObj = detail as { msg?: string; loc?: string[] };
          errorMessage = `${detailObj.loc?.join('.') || 'Field'}: ${detailObj.msg}`;
        }
        else if (typeof detail === 'string') {
          errorMessage = detail;
        }
        else {
          errorMessage = JSON.stringify(detail);
        }
      } else if ((err as ErrorWithDetails).message) {
        errorMessage = (err as ErrorWithDetails).message!;
      }

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user, storeUser?.managerId, startDate, endDate]);

  useEffect(() => {
    if (user) {
      const timer = setTimeout(() => {
        loadReports(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [user, loadReports]);

  useEffect(() => {
    if (user && startDate && endDate) {
      const timer = setTimeout(() => {
        loadReports(true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [startDate, endDate, loadReports, user]);

  // Reset pagination when search or filters change
  useEffect(() => {
    setCashFlowPage(1);
  }, [dailyCashFlowSearch, startDate, endDate]);

  useEffect(() => {
    setForecastsPage(1);
  }, [startDate, endDate]);

  const formatCurrency = (amount: number | null | undefined): string => {
    const safeAmount = safeNumber(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safeAmount);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const capitalize = (str: string | null | undefined): string => {
    if (!str || typeof str !== 'string') return '';
    return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, ' ');
  };

  // Generate ML forecast with advice
  const generateMLForecast = async (metric: 'expense' | 'revenue' | 'inventory', modelType: string) => {
    setGeneratingForecast(`${metric}-${modelType}`);
    try {
      const response = await apiClient.generateForecastWithAdvice(metric, modelType as any, 12);
      const responseData = (response as any)?.data || response;

      if (responseData?.status === 'success') {
        // Update ML insights state
        setMlInsights((prev: any) => ({
          ...prev,
          [metric]: {
            ...responseData,
            model_type: modelType,
            generated_at: new Date().toISOString()
          }
        }));
        toast.success(`${capitalize(metric)} forecast with AI advice generated successfully!`);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.detail || error?.message || 'Failed to generate forecast';
      toast.error(errorMessage);
    } finally {
      setGeneratingForecast(null);
    }
  };

  // Save forecast from ML insight
  const saveForecastFromInsight = async (metric: string, insight: any) => {
    if (!insight || !insight.forecast) return;

    setSavingForecast(metric);
    try {
      const forecastName = `${capitalize(metric)} Forecast (${insight.model_type?.toUpperCase() || 'AI'}) - ${new Date().toLocaleDateString()}`;
      const payload = {
        name: forecastName,
        description: insight.summary || `AI-generated ${metric} forecast using ${insight.model_type} model.`,
        forecast_type: metric,
        method: insight.model_type || 'ai',
        start_date: insight.forecast[0]?.date || new Date().toISOString().split('T')[0],
        end_date: insight.forecast[insight.forecast.length - 1]?.date || new Date().toISOString().split('T')[0],
        forecast_data: insight.forecast,
        method_params: {
          trend: insight.trend_analysis,
          advice: insight.advice,
          alerts: insight.alerts
        }
      };

      const response = await apiClient.createForecast(payload);
      if (response.data) {
        toast.success(`Forecast saved successfully as "${forecastName}"`);
        // Refresh forecast list
        loadReports(true);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to save forecast');
    } finally {
      setSavingForecast(null);
    }
  };

  // Handle manual forecast creation
  const handleCreateForecast = async () => {
    if (!newForecast.name) {
      toast.error('Please enter a forecast name');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.createForecast(newForecast);
      if (response.data) {
        toast.success('Forecast created successfully');
        setShowCreateForecast(false);
        setNewForecast({
          name: '',
          description: '',
          forecast_type: 'revenue',
          method: 'moving_average',
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(new Date().setMonth(new Date().getMonth() + 6)).toISOString().split('T')[0],
          method_params: {}
        });
        loadReports(true);
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to create forecast');
    } finally {
      setLoading(false);
    }
  };

  // Delete forecast
  // Delete forecast
  const handleDeleteForecastClick = (forecast: Forecast) => {
    setSelectedForecastForDelete(forecast);
    setDeletePassword('');
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedForecastForDelete) return;
    if (!deletePassword) {
      toast.error('Please enter your password to confirm deletion');
      return;
    }

    setIsDeleting(true);
    try {
      const response = await apiClient.deleteForecast(selectedForecastForDelete.id, deletePassword);
      if (response.data) {
        toast.success('Forecast deleted successfully');
        loadReports(true);
        setDeleteModalOpen(false);
        setSelectedForecastForDelete(null);
        setDeletePassword('');
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.detail || 'Failed to delete forecast');
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Helper function to export data to Excel/CSV
   */
  const handleExport = (data: any[], fileName: string, sheetName: string = 'Report') => {
    try {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${fileName}_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success(`${fileName} exported successfully`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export data');
    }
  };

  const exportFinancialSummary = () => {
    if (!financialSummary) return;
    const data = [
      { Metric: 'Total Revenue', Value: financialSummary.financials?.total_revenue },
      { Metric: 'Total Sales', Value: financialSummary.financials?.total_sales },
      { Metric: 'Total Expenses', Value: financialSummary.financials?.total_expenses },
      { Metric: 'Net Profit', Value: financialSummary.financials?.profit },
      { Metric: 'Profit Margin (%)', Value: financialSummary.financials?.profit_margin },
      { Metric: 'Revenue Transactions', Value: financialSummary.transaction_counts?.revenue },
      { Metric: 'Sales Transactions', Value: financialSummary.transaction_counts?.sales },
      { Metric: 'Expense Transactions', Value: financialSummary.transaction_counts?.expenses },
      { Metric: 'Total Transactions', Value: financialSummary.transaction_counts?.total },
    ];
    handleExport(data, 'Financial_Summary', 'Summary');
  };

  const exportIncomeStatement = () => {
    if (!incomeStatement) return;
    const data: any[] = [];
    
    data.push({ Section: 'REVENUE', Category: 'Total', Amount: incomeStatement.revenue?.total });
    if (incomeStatement.revenue?.by_category) {
      Object.entries(incomeStatement.revenue.by_category).forEach(([cat, amt]) => {
        data.push({ Section: 'REVENUE', Category: capitalize(cat), Amount: amt });
      });
    }

    data.push({ Section: 'SALES', Category: 'Total', Amount: incomeStatement.sales?.total });
    if (incomeStatement.sales?.by_category) {
      Object.entries(incomeStatement.sales.by_category).forEach(([cat, amt]) => {
        data.push({ Section: 'SALES', Category: capitalize(cat), Amount: amt });
      });
    }

    data.push({ Section: 'EXPENSES', Category: 'Total', Amount: incomeStatement.expenses?.total });
    if (incomeStatement.expenses?.by_category) {
      Object.entries(incomeStatement.expenses.by_category).forEach(([cat, amt]) => {
        data.push({ Section: 'EXPENSES', Category: capitalize(cat), Amount: amt });
      });
    }

    data.push({ Section: 'SUMMARY', Category: 'Net Profit', Amount: incomeStatement.profit });
    data.push({ Section: 'SUMMARY', Category: 'Profit Margin (%)', Amount: incomeStatement.profit_margin });

    handleExport(data, 'Income_Statement', 'P&L');
  };

  const exportCashFlow = () => {
    if (!cashFlow || !cashFlow.daily_cash_flow) return;
    const data = Object.entries(cashFlow.daily_cash_flow)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, flow]) => ({
        Date: date,
        Inflow: flow.inflow,
        Outflow: flow.outflow,
        Net: flow.net
      }));
    handleExport(data, 'Cash_Flow_Daily', 'Cash Flow');
  };

  const exportInventorySummary = () => {
    if (!inventorySummary) return;
    const data = [
      { Metric: 'Total Items', Value: inventorySummary.total_items },
      { Metric: 'Total Stock Quantity', Value: inventorySummary.total_quantity_in_stock },
      { Metric: 'Total Cost Value', Value: inventorySummary.total_cost_value },
      { Metric: 'Total Selling Value', Value: inventorySummary.total_selling_value },
      { Metric: 'Potential Profit', Value: inventorySummary.potential_profit },
    ];
    handleExport(data, 'Inventory_Summary', 'Inventory');
  };

  const exportSalesSummary = () => {
    if (!salesSummary) return;
    const data = [
      { Metric: 'Total Sales Count', Value: salesSummary.total_sales },
      { Metric: 'Total Revenue', Value: salesSummary.total_revenue },
      { Metric: 'Posted Sales', Value: salesSummary.posted_sales },
      { Metric: 'Pending Sales', Value: salesSummary.pending_sales },
    ];
    handleExport(data, 'Sales_Summary', 'Sales');
  };

  const exportForecasts = () => {
    if (!forecasts || forecasts.length === 0) return;
    const data = forecasts.map(f => ({
      Name: f.name,
      Type: capitalize(f.forecast_type),
      Method: capitalize(f.method),
      'Start Date': f.start_date,
      'End Date': f.end_date,
      'Created At': formatDate(f.created_at)
    }));
    handleExport(data, 'Forecasts_List', 'Forecasts');
  };

  /**
   * PDF Export Handlers
   */
  const exportFinancialSummaryPDF = () => {
    if (!financialSummary) return;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Financial Summary Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Period: ${formatDate(startDate)} - ${formatDate(endDate)}`, 14, 30);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 36);

    const data = [
      ['Metric', 'Value'],
      ['Total Revenue', formatCurrency(financialSummary.financials?.total_revenue)],
      ['Total Sales', formatCurrency(financialSummary.financials?.total_sales)],
      ['Total Expenses', formatCurrency(financialSummary.financials?.total_expenses)],
      ['Net Profit', formatCurrency(financialSummary.financials?.profit)],
      ['Profit Margin', `${safeNumber(financialSummary.financials?.profit_margin).toFixed(2)}%`],
      ['Total Transactions', financialSummary.transaction_counts?.total || 0],
    ];

    autoTable(doc, {
      startY: 45,
      head: [data[0]],
      body: data.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [0, 170, 0] }
    });

    doc.save(`Financial_Summary_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Financial Summary PDF exported');
  };

  const exportIncomeStatementPDF = () => {
    if (!incomeStatement) return;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Income Statement (Profit & Loss)', 14, 22);
    doc.setFontSize(11);
    doc.text(`Period: ${formatDate(startDate)} - ${formatDate(endDate)}`, 14, 30);

    const body: any[] = [];
    body.push([{ content: 'REVENUE', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);
    if (incomeStatement.revenue?.by_category) {
      Object.entries(incomeStatement.revenue.by_category).forEach(([cat, amt]) => {
        body.push([capitalize(cat), formatCurrency(amt as number)]);
      });
    }
    body.push([{ content: `Total Revenue: ${formatCurrency(incomeStatement.revenue?.total)}`, colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } }]);

    body.push([{ content: 'EXPENSES', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }]);
    if (incomeStatement.expenses?.by_category) {
      Object.entries(incomeStatement.expenses.by_category).forEach(([cat, amt]) => {
        body.push([capitalize(cat), formatCurrency(amt as number)]);
      });
    }
    body.push([{ content: `Total Expenses: ${formatCurrency(incomeStatement.expenses?.total)}`, colSpan: 2, styles: { fontStyle: 'bold', halign: 'right' } }]);

    body.push([{ content: 'SUMMARY', colSpan: 2, styles: { fontStyle: 'bold', fillColor: [220, 220, 220] } }]);
    body.push(['Net Profit', formatCurrency(incomeStatement.profit)]);
    body.push(['Profit Margin', `${(incomeStatement.profit_margin || 0).toFixed(2)}%`]);

    autoTable(doc, {
      startY: 40,
      head: [['Category', 'Amount']],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [0, 170, 0] }
    });

    doc.save(`Income_Statement_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Income Statement PDF exported');
  };

  const exportCashFlowPDF = () => {
    if (!cashFlow || !cashFlow.daily_cash_flow) return;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Cash Flow Statement', 14, 22);
    doc.setFontSize(11);
    doc.text(`Period: ${formatDate(startDate)} - ${formatDate(endDate)}`, 14, 30);

    const head = [['Date', 'Inflow', 'Outflow', 'Net']];
    const body = Object.entries(cashFlow.daily_cash_flow)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, flow]) => [
        formatDate(date),
        formatCurrency(flow.inflow),
        formatCurrency(flow.outflow),
        formatCurrency(flow.net)
      ]);

    autoTable(doc, {
      startY: 40,
      head: head,
      body: body,
      theme: 'striped',
      headStyles: { fillColor: [0, 170, 0] }
    });

    doc.save(`Cash_Flow_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('Cash Flow PDF exported');
  };

  const exportInventoryPDF = () => {
    if (!inventorySummary) return;
    const doc = new jsPDF();
    doc.text('Inventory Summary', 14, 22);
    
    const data = [
      ['Metric', 'Value'],
      ['Total Items', inventorySummary.total_items],
      ['Total Stock', inventorySummary.total_quantity_in_stock || 0],
      ['Cost Value', formatCurrency(inventorySummary.total_cost_value)],
      ['Selling Value', formatCurrency(inventorySummary.total_selling_value)],
      ['Potential Profit', formatCurrency(inventorySummary.potential_profit)],
    ];

    autoTable(doc, {
      startY: 30,
      head: [data[0]],
      body: data.slice(1),
      headStyles: { fillColor: [0, 170, 0] }
    });

    doc.save(`Inventory_Summary_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportSalesPDF = () => {
    if (!salesSummary) return;
    const doc = new jsPDF();
    doc.text('Sales Summary', 14, 22);
    
    const data = [
      ['Metric', 'Value'],
      ['Total Sales', salesSummary.total_sales],
      ['Total Revenue', formatCurrency(salesSummary.total_revenue)],
      ['Posted Sales', salesSummary.posted_sales],
      ['Pending Sales', salesSummary.pending_sales],
    ];

    autoTable(doc, {
      startY: 30,
      head: [data[0]],
      body: data.slice(1),
      headStyles: { fillColor: [0, 170, 0] }
    });

    doc.save(`Sales_Summary_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const exportForecastsPDF = () => {
    if (!forecasts || forecasts.length === 0) return;
    const doc = new jsPDF();
    doc.text('Forecasts Report', 14, 22);

    const body = forecasts.map(f => [
      f.name,
      capitalize(f.forecast_type),
      capitalize(f.method),
      f.start_date,
      f.end_date
    ]);

    autoTable(doc, {
      startY: 30,
      head: [['Name', 'Type', 'Method', 'Start', 'End']],
      body: body,
      headStyles: { fillColor: [0, 170, 0] }
    });

    doc.save(`Forecasts_${new Date().toISOString().split('T')[0]}.pdf`);
  };


  // Load ML insights for all metrics
  const loadMLInsights = async () => {
    if (!user || (user?.role !== 'admin' && user?.role !== 'super_admin' &&
      user?.role !== 'finance_admin' && user?.role !== 'finance_manager' &&
      user?.role !== 'manager')) {
      return;
    }

    setLoadingMLInsights(true);
    try {
      // Try to generate forecasts with advice for all metrics using best available models
      const metrics = ['expense', 'revenue', 'inventory'] as const;
      const insights: Record<string, any> = {};

      // Try common models for each metric
      const modelMap = {
        expense: ['arima', 'linear_regression'],
        revenue: ['xgboost', 'prophet'],
        inventory: ['sarima', 'xgboost']
      };

      for (const metric of metrics) {
        const models = modelMap[metric as keyof typeof modelMap];
        for (const modelType of models) {
          try {
            const response = await apiClient.generateForecastWithAdvice(metric, modelType as any, 12);
            const responseData = (response as any)?.data || response;

            if (responseData?.status === 'success') {
              insights[metric] = {
                ...responseData,
                model_type: modelType,
                generated_at: new Date().toISOString()
              };
              break; // Use first successful model
            }
          } catch (e) {
            // Try next model
            continue;
          }
        }
      }

      setMlInsights(insights);
    } catch (error) {
      console.error('Failed to load ML insights:', error);
      // Don't show error toast as this is optional enhancement
    } finally {
      setLoadingMLInsights(false);
    }
  };

  if (!user) {
    return (
      <Layout>
        <PageContainer>
          <EmptyState>
            <FileText size={48} />
            <h3>Please log in to view reports</h3>
          </EmptyState>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        <HeaderContainer>
          <h1>Financial Reports</h1>
          <p>Income Statement and Cash Flow Analysis</p>
        </HeaderContainer>

        <DateFilterCard>
          <DateInputGroup>
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </DateInputGroup>
          <DateInputGroup>
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </DateInputGroup>
          <ButtonRow>
            <Button
              onClick={() => {
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                oneYearAgo.setDate(1);
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setStartDate(oneYearAgo.toISOString().split('T')[0]);
                setEndDate(tomorrow.toISOString().split('T')[0]);
                loadReports(true);
              }}
              variant="outline"
              disabled={loading}
            >
              Show All Data (1 Year)
            </Button>
            <Button
              onClick={(e) => {
                e.preventDefault();
                loadReports(false);
              }}
              variant="outline"
              disabled={loading}
            >
              Load Without Date Filter
            </Button>
            <Button onClick={() => loadReports(true)} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </>
              )}
            </Button>
          </ButtonRow>
        </DateFilterCard>

        {error && (
          <ErrorBanner>
            <AlertCircle />
            <span>{error}</span>
          </ErrorBanner>
        )}

        {loading ? (
          <LoadingContainer>
            <Spinner />
            <p>Loading financial reports...</p>
          </LoadingContainer>
        ) : (
          <>
            <ReportSection>
              <ReportCard>
                <ReportHeader>
                  <div>
                    <h2>
                      <BarChart3 />
                      Financial Summary Report
                    </h2>
                    <p>
                      Period: {formatDate(startDate)} - {formatDate(endDate)}
                      {financialSummary?.generated_at && (
                        <> • Generated: {formatDate(financialSummary.generated_at)}</>
                      )}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: theme.spacing.xs }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportFinancialSummary}
                      disabled={!financialSummary}
                    >
                      <Download size={14} className="mr-2" />
                      Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportFinancialSummaryPDF}
                      disabled={!financialSummary}
                    >
                      <FileText size={14} className="mr-2" />
                      PDF
                    </Button>
                  </div>
                </ReportHeader>

                {financialSummary ? (
                  <>
                    <SummaryGrid>
                      <SummaryCard $type="revenue">
                        <div className="label">
                          <ArrowUpRight size={16} />
                          Total Revenue
                        </div>
                        <div className="value">
                          {formatCurrency(financialSummary.financials?.total_revenue)}
                        </div>
                        <div className="sub-value">
                          {financialSummary.transaction_counts?.revenue || 0} revenue transactions
                        </div>
                      </SummaryCard>
                      <SummaryCard $type="revenue">
                        <div className="label">
                          <ShoppingCart size={16} />
                          Total Sales
                        </div>
                        <div className="value">
                          {formatCurrency(financialSummary.financials?.total_sales)}
                        </div>
                        <div className="sub-value">
                          {financialSummary.transaction_counts?.sales || 0} sales transactions
                        </div>
                      </SummaryCard>
                      <SummaryCard $type="expense">
                        <div className="label">
                          <ArrowDownRight size={16} />
                          Total Expenses
                        </div>
                        <div className="value">
                          {formatCurrency(financialSummary.financials?.total_expenses)}
                        </div>
                        <div className="sub-value">
                          {financialSummary.transaction_counts?.expenses || 0} expense transactions
                        </div>
                      </SummaryCard>
                      <SummaryCard $type="profit">
                        <div className="label">
                          <TrendingUp size={16} />
                          Net Profit
                        </div>
                        <div className="value">
                          {formatCurrency(financialSummary.financials?.profit)}
                        </div>
                        <div className="sub-value">
                          Profit Margin: {safeNumber(financialSummary.financials?.profit_margin).toFixed(2)}%
                        </div>
                      </SummaryCard>
                      <SummaryCard>
                        <div className="label">
                          <FileText size={16} />
                          Total Transactions
                        </div>
                        <div className="value">{financialSummary.transaction_counts?.total || 0}</div>
                        <div className="sub-value">
                          {financialSummary.transaction_counts?.revenue || 0} revenue + {financialSummary.transaction_counts?.sales || 0} sales + {financialSummary.transaction_counts?.expenses || 0} expenses
                        </div>
                      </SummaryCard>
                    </SummaryGrid>

                    <TwoColumnGrid>
                      <div>
                        <SectionTitle>Top Revenue Categories</SectionTitle>
                        <CategoryTable>
                          <thead>
                            <tr>
                              <th>Category</th>
                              <th style={{ textAlign: 'right' }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {financialSummary.revenue_by_category && Object.entries(financialSummary.revenue_by_category).length > 0 ? (
                              Object.entries(financialSummary.revenue_by_category)
                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                .slice(0, 5)
                                .map(([category, amount]) => (
                                  <tr key={category}>
                                    <td>{capitalize(category)}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(amount as number)}</td>
                                  </tr>
                                ))
                            ) : (
                              <tr>
                                <td colSpan={2} style={{ textAlign: 'center', color: theme.colors.textSecondary }}>
                                  No revenue data
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </CategoryTable>
                      </div>

                      <div>
                        <SectionTitle>Top Sales Categories</SectionTitle>
                        <CategoryTable>
                          <thead>
                            <tr>
                              <th>Category</th>
                              <th style={{ textAlign: 'right' }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {financialSummary.sales_by_category && Object.entries(financialSummary.sales_by_category).length > 0 ? (
                              Object.entries(financialSummary.sales_by_category)
                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                .slice(0, 5)
                                .map(([category, amount]) => (
                                  <tr key={category}>
                                    <td>{capitalize(category)}</td>
                                    <td style={{ textAlign: 'right' }}>{formatCurrency(amount as number)}</td>
                                  </tr>
                                ))
                            ) : (
                              <tr>
                                <td colSpan={2} style={{ textAlign: 'center', color: theme.colors.textSecondary }}>
                                  No sales data
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </CategoryTable>
                      </div>
                    </TwoColumnGrid>

                    <div style={{ marginTop: theme.spacing.xl }}>
                      <SectionTitle>Top Expense Categories</SectionTitle>
                      <CategoryTable>
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th style={{ textAlign: 'right' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {financialSummary.expenses_by_category && Object.entries(financialSummary.expenses_by_category).length > 0 ? (
                            Object.entries(financialSummary.expenses_by_category)
                              .sort(([, a], [, b]) => (b as number) - (a as number))
                              .slice(0, 5)
                              .map(([category, amount]) => (
                                <tr key={category}>
                                  <td>{capitalize(category)}</td>
                                  <td style={{ textAlign: 'right', color: '#dc2626', fontWeight: theme.typography.fontWeights.bold }}>{formatCurrency(amount as number)}</td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td colSpan={2} style={{ textAlign: 'center', color: theme.colors.textSecondary }}>
                                No expense data
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </CategoryTable>
                    </div>
                  </>
                ) : (
                  <EmptyState>
                    <BarChart3 size={48} />
                    <h3>No summary data available</h3>
                  </EmptyState>
                )}
              </ReportCard>
            </ReportSection>

            <ReportSection>
              <ReportCard>
                <ReportHeader>
                  <div>
                    <h2>
                      <FileText />
                      Income Statement (Profit & Loss)
                    </h2>
                    <p>
                      Period: {formatDate(startDate)} - {formatDate(endDate)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: theme.spacing.xs }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportIncomeStatement}
                      disabled={!incomeStatement}
                    >
                      <Download size={14} className="mr-2" />
                      Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportIncomeStatementPDF}
                      disabled={!incomeStatement}
                    >
                      <FileText size={14} className="mr-2" />
                      PDF
                    </Button>
                  </div>
                </ReportHeader>

                {incomeStatement ? (
                  <>
                    <SummaryGrid>
                      <SummaryCard $type="revenue">
                        <div className="label">
                          <ArrowUpRight size={16} />
                          Total Revenue
                        </div>
                        <div className="value">
                          {formatCurrency(incomeStatement.revenue?.total || 0)}
                        </div>
                        <div className="sub-value">
                          Includes sales revenue
                        </div>
                      </SummaryCard>
                      <SummaryCard $type="revenue">
                        <div className="label">
                          <ShoppingCart size={16} />
                          Sales Revenue
                        </div>
                        <div className="value">
                          {formatCurrency(incomeStatement.sales?.total || 0)}
                        </div>
                      </SummaryCard>
                      <SummaryCard $type="expense">
                        <div className="label">
                          <ArrowDownRight size={16} />
                          Total Expenses
                        </div>
                        <div className="value">
                          {formatCurrency(incomeStatement.expenses?.total || 0)}
                        </div>
                      </SummaryCard>
                      <SummaryCard $type="profit">
                        <div className="label">
                          <TrendingUp size={16} />
                          Net Profit
                        </div>
                        <div className="value">
                          {formatCurrency(incomeStatement.profit || 0)}
                        </div>
                        <div className="sub-value">
                          Profit Margin: {(incomeStatement.profit_margin || 0).toFixed(2)}%
                        </div>
                      </SummaryCard>
                    </SummaryGrid>

                    <div style={{ marginTop: theme.spacing.xl }}>
                      <SectionTitle>Revenue by Category</SectionTitle>
                      <CategoryTable>
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th style={{ textAlign: 'right' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {incomeStatement.revenue?.by_category && Object.entries(incomeStatement.revenue.by_category).length > 0 ? (
                            Object.entries(incomeStatement.revenue.by_category)
                              .sort(([, a], [, b]) => (b as number) - (a as number))
                              .map(([category, amount]) => (
                                <tr key={category}>
                                  <td>{capitalize(category)}</td>
                                  <td style={{ textAlign: 'right' }}>{formatCurrency(amount as number)}</td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td colSpan={2} style={{ textAlign: 'center', color: theme.colors.textSecondary }}>
                                No revenue data for this period
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </CategoryTable>
                    </div>

                    {incomeStatement.sales?.by_category && Object.entries(incomeStatement.sales.by_category).length > 0 && (
                      <div style={{ marginTop: theme.spacing.xl }}>
                        <SectionTitle>Sales by Category</SectionTitle>
                        <CategoryTable>
                          <thead>
                            <tr>
                              <th>Category</th>
                              <th style={{ textAlign: 'right' }}>Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.entries(incomeStatement.sales.by_category)
                              .sort(([, a], [, b]) => (b as number) - (a as number))
                              .map(([category, amount]) => (
                                <tr key={category}>
                                  <td>{capitalize(category)}</td>
                                  <td style={{ textAlign: 'right' }}>{formatCurrency(amount as number)}</td>
                                </tr>
                              ))}
                          </tbody>
                        </CategoryTable>
                      </div>
                    )}

                    <div style={{ marginTop: theme.spacing.xl }}>
                      <SectionTitle>Expenses by Category</SectionTitle>
                      <CategoryTable>
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th style={{ textAlign: 'right' }}>Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {incomeStatement.expenses?.by_category && Object.entries(incomeStatement.expenses.by_category).length > 0 ? (
                            Object.entries(incomeStatement.expenses.by_category)
                              .sort(([, a], [, b]) => (b as number) - (a as number))
                              .map(([category, amount]) => (
                                <tr key={category}>
                                  <td>{capitalize(category)}</td>
                                  <td style={{ textAlign: 'right', color: '#dc2626', fontWeight: theme.typography.fontWeights.bold }}>{formatCurrency(amount as number)}</td>
                                </tr>
                              ))
                          ) : (
                            <tr>
                              <td colSpan={2} style={{ textAlign: 'center', color: theme.colors.textSecondary }}>
                                No expense data for this period
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </CategoryTable>
                    </div>
                  </>
                ) : (
                  <EmptyState>
                    <FileText size={48} />
                    <h3>No income statement data available</h3>
                  </EmptyState>
                )}
              </ReportCard>
            </ReportSection>

            <ReportSection>
              <ReportCard>
                <ReportHeader>
                  <div>
                    <h2>
                      <BarChart3 />
                      Cash Flow Statement
                    </h2>
                    <p>
                      Period: {formatDate(startDate)} - {formatDate(endDate)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: theme.spacing.xs }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportCashFlow}
                      disabled={!cashFlow}
                    >
                      <Download size={14} className="mr-2" />
                      Excel
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportCashFlowPDF}
                      disabled={!cashFlow}
                    >
                      <FileText size={14} className="mr-2" />
                      PDF
                    </Button>
                  </div>
                </ReportHeader>

                {cashFlow ? (
                  <>
                    <SummaryGrid>
                      <SummaryCard $type="revenue">
                        <div className="label">
                          <ArrowUpRight size={16} />
                          Cash Inflow
                        </div>
                        <div className="value">
                          {formatCurrency(cashFlow.summary?.total_inflow || 0)}
                        </div>
                        <div className="sub-value">Money coming in</div>
                      </SummaryCard>
                      <SummaryCard $type="expense">
                        <div className="label">
                          <ArrowDownRight size={16} />
                          Cash Outflow
                        </div>
                        <div className="value">
                          {formatCurrency(cashFlow.summary?.total_outflow || 0)}
                        </div>
                        <div className="sub-value">Money going out</div>
                      </SummaryCard>
                      <SummaryCard $type="profit">
                        <div className="label">
                          <TrendingUp size={16} />
                          Net Cash Flow
                        </div>
                        <div className="value">
                          {formatCurrency(cashFlow.summary?.net_cash_flow || 0)}
                        </div>
                        <div className="sub-value">Actual cash available</div>
                      </SummaryCard>
                    </SummaryGrid>

                    <div style={{ marginTop: theme.spacing.xl }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
                        <SectionTitle style={{ marginBottom: 0 }}>Daily Cash Flow</SectionTitle>
                        <div style={{ width: '250px' }}>
                          <Input
                            placeholder="Search by date..."
                            value={dailyCashFlowSearch}
                            onChange={(e) => setDailyCashFlowSearch(e.target.value)}
                            style={{ height: '36px' }}
                          />
                        </div>
                      </div>
                      <CashFlowTable>
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th style={{ textAlign: 'right' }}>Inflow</th>
                            <th style={{ textAlign: 'right' }}>Outflow</th>
                            <th style={{ textAlign: 'right' }}>Net</th>
                          </tr>
                        </thead>
                        <tbody>
                          {cashFlow.daily_cash_flow && Object.entries(cashFlow.daily_cash_flow).length > 0 ? (() => {
                            const entries = Object.entries(cashFlow.daily_cash_flow)
                              .filter(([date]) => formatDate(date).toLowerCase().includes(dailyCashFlowSearch.toLowerCase()))
                              .sort(([dateA], [dateB]) => dateB.localeCompare(dateA));

                            const totalPages = Math.ceil(entries.length / cashFlowItemsPerPage);
                            const startIndex = (cashFlowPage - 1) * cashFlowItemsPerPage;
                            const paginated = entries.slice(startIndex, startIndex + cashFlowItemsPerPage);

                            if (paginated.length === 0 && entries.length > 0) {
                              setCashFlowPage(1);
                              return null;
                            }

                            return (
                              <>
                                {paginated.map(([date, flow]: [string, { inflow: number; outflow: number; net: number }]) => (
                                  <tr key={date}>
                                    <td>{formatDate(date)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                      {flow.inflow > 0 ? formatCurrency(flow.inflow) : '—'}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                      {flow.outflow > 0 ? formatCurrency(flow.outflow) : '—'}
                                    </td>
                                    <td style={{ textAlign: 'right' }}>
                                      {formatCurrency(flow.net || 0)}
                                    </td>
                                  </tr>
                                ))}
                                {entries.length > cashFlowItemsPerPage && (
                                  <tr>
                                    <td colSpan={4} style={{ padding: 0 }}>
                                      <PaginationContainer>
                                        <PageInfo>
                                          Showing {startIndex + 1}-{Math.min(startIndex + cashFlowItemsPerPage, entries.length)} of {entries.length} days
                                        </PageInfo>
                                        <PaginationActions>
                                          <PageButton
                                            onClick={() => setCashFlowPage(1)}
                                            disabled={cashFlowPage === 1}
                                            title="First Page"
                                          >
                                            <ChevronsLeft size={16} />
                                          </PageButton>
                                          <PageButton
                                            onClick={() => setCashFlowPage(prev => Math.max(prev - 1, 1))}
                                            disabled={cashFlowPage === 1}
                                            title="Previous Page"
                                          >
                                            <ChevronLeft size={16} />
                                          </PageButton>

                                          {[...Array(totalPages)].map((_, i) => {
                                            const pageNum = i + 1;
                                            if (
                                              pageNum === 1 ||
                                              pageNum === totalPages ||
                                              (pageNum >= cashFlowPage - 1 && pageNum <= cashFlowPage + 1)
                                            ) {
                                              return (
                                                <PageButton
                                                  key={pageNum}
                                                  $active={cashFlowPage === pageNum}
                                                  onClick={() => setCashFlowPage(pageNum)}
                                                >
                                                  {pageNum}
                                                </PageButton>
                                              );
                                            } else if (
                                              pageNum === cashFlowPage - 2 ||
                                              pageNum === cashFlowPage + 2
                                            ) {
                                              return <span key={pageNum}>...</span>;
                                            }
                                            return null;
                                          })}

                                          <PageButton
                                            onClick={() => setCashFlowPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={cashFlowPage === totalPages}
                                            title="Next Page"
                                          >
                                            <ChevronRight size={16} />
                                          </PageButton>
                                          <PageButton
                                            onClick={() => setCashFlowPage(totalPages)}
                                            disabled={cashFlowPage === totalPages}
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
                          })() : (
                            <tr>
                              <td colSpan={4} style={{ textAlign: 'center', color: theme.colors.textSecondary }}>
                                No cash flow data for this period
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </CashFlowTable>
                    </div>
                  </>
                ) : (
                  <EmptyState>
                    <BarChart3 size={48} />
                    <h3>No cash flow data available</h3>
                  </EmptyState>
                )}
              </ReportCard>
            </ReportSection>

            {/* Sales Summary Section - For Accountant, Finance Admin, Admin, and Manager */}
            {(user?.role === 'accountant' || user?.role === 'finance_manager' || user?.role === 'finance_admin' || user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'manager') && (
              <ReportSection>
                <ReportCard>
                  <ReportHeader>
                    <div>
                      <h2>
                        <ShoppingCart />
                        Sales Summary Report
                      </h2>
                      <p>
                        Period: {formatDate(startDate)} - {formatDate(endDate)}
                        {salesSummary?.period_start && salesSummary?.period_end && (
                          <> • Sales Period: {formatDate(salesSummary.period_start)} - {formatDate(salesSummary.period_end)}</>
                        )}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: theme.spacing.xs }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportSalesSummary}
                        disabled={!salesSummary}
                      >
                        <Download size={14} className="mr-2" />
                        Excel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportSalesPDF}
                        disabled={!salesSummary}
                      >
                        <FileText size={14} className="mr-2" />
                        PDF
                      </Button>
                    </div>
                  </ReportHeader>

                  {salesSummary ? (
                    <>
                      <SummaryGrid>
                        <SummaryCard $type="revenue">
                          <div className="label">
                            <ShoppingCart size={16} />
                            Total Sales
                          </div>
                          <div className="value">
                            {salesSummary.total_sales || 0}
                          </div>
                          <div className="sub-value">
                            All sales transactions
                          </div>
                        </SummaryCard>
                        <SummaryCard $type="revenue">
                          <div className="label">
                            <DollarSign size={16} />
                            Total Sales Revenue
                          </div>
                          <div className="value">
                            {formatCurrency(salesSummary.total_revenue || 0)}
                          </div>
                          <div className="sub-value">
                            From posted sales only
                          </div>
                        </SummaryCard>
                        <SummaryCard $type="profit">
                          <div className="label">
                            <TrendingUp size={16} />
                            Posted Sales
                          </div>
                          <div className="value">
                            {salesSummary.posted_sales || 0}
                          </div>
                          <div className="sub-value">
                            Approved and posted
                          </div>
                        </SummaryCard>
                        <SummaryCard $type="expense">
                          <div className="label">
                            <AlertCircle size={16} />
                            Pending Sales
                          </div>
                          <div className="value">
                            {salesSummary.pending_sales || 0}
                          </div>
                          <div className="sub-value">
                            Awaiting approval
                          </div>
                        </SummaryCard>
                      </SummaryGrid>

                      <div style={{ marginTop: theme.spacing.xl }}>
                        <SectionTitle>Sales Status Breakdown</SectionTitle>
                        <CategoryTable>
                          <thead>
                            <tr>
                              <th>Status</th>
                              <th style={{ textAlign: 'right' }}>Count</th>
                              <th style={{ textAlign: 'right' }}>Percentage</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Posted (Approved)</td>
                              <td style={{ textAlign: 'right' }}>{salesSummary.posted_sales || 0}</td>
                              <td style={{ textAlign: 'right' }}>
                                {salesSummary.total_sales > 0
                                  ? ((salesSummary.posted_sales || 0) / salesSummary.total_sales * 100).toFixed(1)
                                  : 0}%
                              </td>
                            </tr>
                            <tr>
                              <td>Pending (Awaiting Approval)</td>
                              <td style={{ textAlign: 'right' }}>{salesSummary.pending_sales || 0}</td>
                              <td style={{ textAlign: 'right' }}>
                                {salesSummary.total_sales > 0
                                  ? ((salesSummary.pending_sales || 0) / salesSummary.total_sales * 100).toFixed(1)
                                  : 0}%
                              </td>
                            </tr>
                            <tr style={{ fontWeight: theme.typography.fontWeights.bold, borderTop: `2px solid ${theme.colors.border}` }}>
                              <td>Total</td>
                              <td style={{ textAlign: 'right' }}>{salesSummary.total_sales || 0}</td>
                              <td style={{ textAlign: 'right' }}>100%</td>
                            </tr>
                          </tbody>
                        </CategoryTable>
                      </div>
                    </>
                  ) : (
                    <EmptyState>
                      <ShoppingCart size={48} />
                      <h3>No sales data available</h3>
                      <p>Sales summary is only available to Accountant, Finance Admin, Admin, and Manager roles.</p>
                    </EmptyState>
                  )}
                </ReportCard>
              </ReportSection>
            )}

            {/* Inventory Summary Section - For Finance Admin, Admin, and Manager */}
            {(user?.role === 'finance_manager' || user?.role === 'finance_admin' || user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'manager') && (
              <ReportSection>
                <ReportCard>
                  <ReportHeader>
                    <div>
                      <h2>
                        <Package />
                        Inventory Summary
                      </h2>
                      <p>Current inventory valuation and stock levels</p>
                    </div>
                    <div style={{ display: 'flex', gap: theme.spacing.xs }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportInventorySummary}
                        disabled={!inventorySummary}
                      >
                        <Download size={14} className="mr-2" />
                        Excel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportInventoryPDF}
                        disabled={!inventorySummary}
                      >
                        <FileText size={14} className="mr-2" />
                        PDF
                      </Button>
                    </div>
                  </ReportHeader>

                  {inventorySummary ? (
                    <>
                      <SummaryGrid>
                        <SummaryCard $type="revenue">
                          <div className="label">
                            <Package size={16} />
                            Total Items
                          </div>
                          <div className="value">
                            {inventorySummary.total_items || 0}
                          </div>
                          <div className="sub-value">
                            Active inventory items
                          </div>
                        </SummaryCard>
                        <SummaryCard $type="expense">
                          <div className="label">
                            <DollarSign size={16} />
                            Total Cost Value
                          </div>
                          <div className="value">
                            {formatCurrency(inventorySummary.total_cost_value || 0)}
                          </div>
                          <div className="sub-value">
                            Investment in inventory
                          </div>
                        </SummaryCard>
                        <SummaryCard $type="revenue">
                          <div className="label">
                            <TrendingUp size={16} />
                            Total Selling Value
                          </div>
                          <div className="value">
                            {formatCurrency(inventorySummary.total_selling_value || 0)}
                          </div>
                          <div className="sub-value">
                            Potential revenue if all sold
                          </div>
                        </SummaryCard>
                        <SummaryCard $type="profit">
                          <div className="label">
                            <TrendingUp size={16} />
                            Potential Profit
                          </div>
                          <div className="value">
                            {formatCurrency(inventorySummary.potential_profit || 0)}
                          </div>
                          <div className="sub-value">
                            Profit if all inventory sold
                          </div>
                        </SummaryCard>
                        {inventorySummary.total_quantity_in_stock !== undefined && (
                          <SummaryCard>
                            <div className="label">
                              <Package size={16} />
                              Total Stock Quantity
                            </div>
                            <div className="value">
                              {inventorySummary.total_quantity_in_stock.toLocaleString()}
                            </div>
                            <div className="sub-value">
                              Total units in stock
                            </div>
                          </SummaryCard>
                        )}
                      </SummaryGrid>

                      <div style={{ marginTop: theme.spacing.xl }}>
                        <SectionTitle>Inventory Valuation Analysis</SectionTitle>
                        <CategoryTable>
                          <thead>
                            <tr>
                              <th>Metric</th>
                              <th style={{ textAlign: 'right' }}>Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Total Inventory Items</td>
                              <td style={{ textAlign: 'right' }}>{inventorySummary.total_items || 0}</td>
                            </tr>
                            {inventorySummary.total_quantity_in_stock !== undefined && (
                              <tr>
                                <td>Total Stock Quantity</td>
                                <td style={{ textAlign: 'right' }}>{inventorySummary.total_quantity_in_stock.toLocaleString()} units</td>
                              </tr>
                            )}
                            <tr>
                              <td>Total Cost Value (Investment)</td>
                              <td style={{ textAlign: 'right' }}>{formatCurrency(inventorySummary.total_cost_value || 0)}</td>
                            </tr>
                            <tr>
                              <td>Total Selling Value (Potential Revenue)</td>
                              <td style={{ textAlign: 'right' }}>{formatCurrency(inventorySummary.total_selling_value || 0)}</td>
                            </tr>
                            <tr style={{ fontWeight: theme.typography.fontWeights.bold, borderTop: `2px solid ${theme.colors.border}` }}>
                              <td>Potential Profit</td>
                              <td style={{ textAlign: 'right', color: theme.colors.primary }}>
                                {formatCurrency(inventorySummary.potential_profit || 0)}
                              </td>
                            </tr>
                            {inventorySummary.total_cost_value > 0 && (
                              <tr>
                                <td>Profit Margin (Potential)</td>
                                <td style={{ textAlign: 'right' }}>
                                  {((inventorySummary.potential_profit || 0) / inventorySummary.total_cost_value * 100).toFixed(2)}%
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </CategoryTable>
                      </div>
                    </>
                  ) : (
                    <EmptyState>
                      <Package size={48} />
                      <h3>No inventory data available</h3>
                      <p>Inventory summary is only available to Finance Admin, Admin, and Manager roles.</p>
                    </EmptyState>
                  )}
                </ReportCard>
              </ReportSection>
            )}

            {/* ML AI Insights Section - For Admin, Finance Admin, and Manager */}
            {(user?.role === 'finance_manager' || user?.role === 'finance_admin' || user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'manager') && (
              <ReportSection>
                <ReportCard>
                  <ReportHeader>
                    <div>
                      <h2>
                        <Brain />
                        AI-Powered Insights & Recommendations
                      </h2>
                      <p>
                        Get intelligent forecasts and actionable advice based on ML analysis
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={loadMLInsights}
                        disabled={loadingMLInsights}
                      >
                        {loadingMLInsights ? (
                          <>
                            <Loader2 size={14} style={{ marginRight: theme.spacing.xs, animation: 'spin 1s linear infinite' }} />
                            Loading...
                          </>
                        ) : (
                          <>
                            <RefreshCw size={14} style={{ marginRight: theme.spacing.xs }} />
                            Generate Insights
                          </>
                        )}
                      </Button>
                    </div>
                  </ReportHeader>

                  {mlInsights && Object.keys(mlInsights).length > 0 ? (
                    <>
                      {Object.entries(mlInsights).map(([metric, insight]: [string, any]) => {
                        if (!insight || !insight.forecast) return null;

                        const trend = insight.trend_analysis;
                        const advice = insight.advice || [];
                        const alerts = insight.alerts || [];

                        return (
                          <div key={metric} style={{ marginBottom: theme.spacing.xl }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.md }}>
                              <SectionTitle>
                                {capitalize(metric)} Forecast & Insights
                                {insight.model_type && typeof insight.model_type === 'string' && (
                                  <span style={{
                                    fontSize: theme.typography.fontSizes.sm,
                                    fontWeight: 400,
                                    color: theme.colors.textSecondary,
                                    marginLeft: theme.spacing.sm
                                  }}>
                                    (Model: {insight.model_type.toUpperCase()})
                                  </span>
                                )}
                              </SectionTitle>
                            </div>

                            {/* Trend Analysis */}
                            {trend && (
                              <div style={{
                                background: theme.colors.backgroundSecondary,
                                padding: theme.spacing.lg,
                                borderRadius: theme.borderRadius.md,
                                marginBottom: theme.spacing.md
                              }}>
                                <div style={{
                                  fontSize: theme.typography.fontSizes.sm,
                                  fontWeight: theme.typography.fontWeights.medium,
                                  color: theme.colors.textSecondary,
                                  marginBottom: theme.spacing.sm
                                }}>
                                  Trend Analysis
                                </div>
                                <div style={{ display: 'flex', gap: theme.spacing.md, flexWrap: 'wrap' }}>
                                  <TrendBadge $direction={(trend?.direction || 'stable') as any}>
                                    {trend?.direction === 'increasing' ? <ArrowUpRight size={14} /> :
                                      trend?.direction === 'decreasing' ? <ArrowDownRight size={14} /> :
                                        <TrendingUp size={14} />}
                                    {capitalize(trend?.direction || 'stable')} {trend?.percentage !== undefined && trend.percentage !== null && `(${Math.abs(trend.percentage).toFixed(1)}%)`}
                                  </TrendBadge>
                                  <span style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSizes.sm }}>
                                    {trend?.average !== undefined && `Avg: ${formatCurrency(trend.average)}`}
                                    {trend?.average !== undefined && (trend?.max !== undefined || trend?.min !== undefined) && ' | '}
                                    {trend?.max !== undefined && `Max: ${formatCurrency(trend.max)}`}
                                    {(trend?.max !== undefined && trend?.min !== undefined) && ' | '}
                                    {trend?.min !== undefined && `Min: ${formatCurrency(trend.min)}`}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Summary */}
                            {insight.summary && (
                              <div style={{
                                background: '#eff6ff',
                                border: '1px solid #bfdbfe',
                                borderRadius: theme.borderRadius.md,
                                padding: theme.spacing.md,
                                marginBottom: theme.spacing.md
                              }}>
                                <div style={{
                                  display: 'flex',
                                  gap: theme.spacing.sm,
                                  alignItems: 'flex-start',
                                  color: '#1e40af',
                                  fontSize: theme.typography.fontSizes.sm,
                                  lineHeight: '1.6'
                                }}>
                                  <Lightbulb size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
                                  <div>{insight.summary || 'No summary available'}</div>
                                </div>
                              </div>
                            )}

                            {/* Alerts */}
                            {alerts.length > 0 && (
                              <div style={{ marginBottom: theme.spacing.md }}>
                                <SectionTitle style={{ fontSize: theme.typography.fontSizes.md, marginBottom: theme.spacing.sm }}>
                                  Alerts
                                </SectionTitle>
                                {alerts.map((alert: any, index: number) => {
                                  if (!alert || typeof alert !== 'object') return null;
                                  return (
                                    <AlertCard key={index} $severity={alert.severity || 'low'}>
                                      <AlertCircle className="alert-icon" size={18} />
                                      <div className="alert-message">{alert.message || 'No message'}</div>
                                    </AlertCard>
                                  );
                                })}
                              </div>
                            )}

                            {/* Recommendations */}
                            {advice.length > 0 && (
                              <div style={{ marginBottom: theme.spacing.md }}>
                                <SectionTitle style={{ fontSize: theme.typography.fontSizes.md, marginBottom: theme.spacing.sm }}>
                                  Recommendations
                                </SectionTitle>
                                {advice.map((rec: any, index: number) => {
                                  if (!rec || typeof rec !== 'object') return null;
                                  const priority = rec.priority === 'high' ? 'high' : rec.priority === 'medium' ? 'medium' : 'low';
                                  return (
                                    <InsightCard
                                      key={index}
                                      $priority={priority}
                                    >
                                      <div className="insight-header">
                                        <Target size={18} />
                                        <h4>{rec.title || 'Recommendation'}</h4>
                                        <PriorityBadge $priority={priority}>
                                          {rec.priority || 'low'}
                                        </PriorityBadge>
                                      </div>
                                      <div className="insight-message">{rec.message || 'No message available'}</div>
                                      {rec.actions && Array.isArray(rec.actions) && rec.actions.length > 0 && (
                                        <div className="insight-actions">
                                          <strong style={{ fontSize: theme.typography.fontSizes.sm, color: theme.colors.textDark }}>
                                            Recommended Actions:
                                          </strong>
                                          <ul>
                                            {rec.actions.map((action: any, actionIndex: number) => (
                                              <li key={actionIndex}>{typeof action === 'string' ? action : 'Action item'}</li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </InsightCard>
                                  );
                                })}

                                <Button
                                  style={{ marginTop: theme.spacing.md, width: '100%' }}
                                  onClick={() => saveForecastFromInsight(metric, insight)}
                                  disabled={savingForecast === metric}
                                >
                                  {savingForecast === metric ? (
                                    <>
                                      <Loader2 size={16} className="mr-2 animate-spin" />
                                      Saving to Forecast Reports...
                                    </>
                                  ) : (
                                    <>
                                      <FileText size={16} className="mr-2" />
                                      Save as Permanent Forecast Record
                                    </>
                                  )}
                                </Button>
                              </div>
                            )}

                            {/* Forecast Preview */}
                            {insight.forecast && Array.isArray(insight.forecast) && insight.forecast.length > 0 && (
                              <div>
                                <SectionTitle style={{ fontSize: theme.typography.fontSizes.md, marginBottom: theme.spacing.sm }}>
                                  Forecast Preview ({insight.forecast.length} periods)
                                </SectionTitle>
                                <CategoryTable>
                                  <thead>
                                    <tr>
                                      <th>Period</th>
                                      <th style={{ textAlign: 'right' }}>Forecasted Value</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {Array.isArray(insight.forecast) && insight.forecast.slice(0, 6).map((point: any, index: number) => {
                                      if (!point || typeof point !== 'object') return null;
                                      const period = point.period || (point.date ? formatDate(point.date) : `Period ${index + 1}`);
                                      const value = point.forecasted_value !== undefined ? point.forecasted_value : (point.value !== undefined ? point.value : 0);
                                      return (
                                        <tr key={index}>
                                          <td>{period}</td>
                                          <td style={{ textAlign: 'right', fontWeight: theme.typography.fontWeights.bold }}>
                                            {formatCurrency(value)}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                    {Array.isArray(insight.forecast) && insight.forecast.length > 6 && (
                                      <tr>
                                        <td colSpan={2} style={{ textAlign: 'center', color: theme.colors.textSecondary, fontStyle: 'italic' }}>
                                          ... and {insight.forecast.length - 6} more periods
                                        </td>
                                      </tr>
                                    )}
                                  </tbody>
                                </CategoryTable>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  ) : (
                    <EmptyState>
                      <Brain size={48} />
                      <h3>No ML insights available</h3>
                      <p>Click "Generate Insights" to get AI-powered forecasts and recommendations</p>
                      <div style={{ marginTop: theme.spacing.lg, display: 'flex', gap: theme.spacing.sm, flexWrap: 'wrap', justifyContent: 'center' }}>
                        {(['expense', 'revenue', 'inventory'] as const).map((metric) => (
                          <div key={metric} style={{ marginBottom: theme.spacing.sm }}>
                            <QuickForecastButton
                              variant="outline"
                              onClick={() => {
                                const modelMap: Record<string, string[]> = {
                                  expense: ['arima', 'linear_regression'],
                                  revenue: ['xgboost', 'prophet'],
                                  inventory: ['sarima', 'xgboost']
                                };
                                const modelType = modelMap[metric]?.[0] || 'arima';
                                generateMLForecast(metric, modelType);
                              }}
                              disabled={generatingForecast === `${metric}-arima` || generatingForecast === `${metric}-xgboost` || generatingForecast === `${metric}-sarima` || generatingForecast === `${metric}-linear_regression` || generatingForecast === `${metric}-prophet`}
                            >
                              {generatingForecast?.startsWith(metric) ? (
                                <>
                                  <Loader2 size={14} style={{ marginRight: theme.spacing.xs, animation: 'spin 1s linear infinite' }} />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Zap size={14} style={{ marginRight: theme.spacing.xs }} />
                                  Quick {capitalize(metric)} Forecast
                                </>
                              )}
                            </QuickForecastButton>
                          </div>
                        ))}
                      </div>
                    </EmptyState>
                  )}
                </ReportCard>
              </ReportSection>
            )}

            {/* Forecast Report Section - For Admin, Finance Admin, and Manager */}
            {(user?.role === 'finance_manager' || user?.role === 'finance_admin' || user?.role === 'admin' || user?.role === 'super_admin' || user?.role === 'manager') && (
              <ReportSection>
                <ReportCard>
                  <ReportHeader>
                    <div>
                      <h2>
                        <LineChart />
                        Forecast Report
                      </h2>
                      <p>
                        View and analyze all financial forecasts
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: theme.spacing.sm }}>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportForecasts}
                        disabled={!forecasts || forecasts.length === 0}
                      >
                        <Download size={14} className="mr-2" />
                        Excel
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportForecastsPDF}
                        disabled={!forecasts || forecasts.length === 0}
                      >
                        <FileText size={14} className="mr-2" />
                        PDF
                      </Button>
                      <Button onClick={() => setShowCreateForecast(!showCreateForecast)}>
                        {showCreateForecast ? 'Cancel' : 'Create Manual Forecast'}
                      </Button>
                    </div>
                  </ReportHeader>

                  {showCreateForecast && (
                    <div style={{
                      background: theme.colors.backgroundSecondary,
                      padding: theme.spacing.xl,
                      borderRadius: theme.borderRadius.md,
                      marginBottom: theme.spacing.xl,
                      border: `1px solid ${theme.colors.border}`
                    }}>
                      <SectionTitle>Create New Forecast</SectionTitle>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: theme.spacing.lg }}>
                        <DateInputGroup>
                          <Label>Forecast Name</Label>
                          <Input
                            placeholder="e.g. Q3 Sales Projection"
                            value={newForecast.name}
                            onChange={e => setNewForecast({ ...newForecast, name: e.target.value })}
                          />
                        </DateInputGroup>
                        <DateInputGroup>
                          <Label>Type</Label>
                          <select
                            style={{
                              padding: '8px',
                              borderRadius: '4px',
                              border: `1px solid ${theme.colors.border}`,
                              background: theme.colors.background
                            }}
                            value={newForecast.forecast_type}
                            onChange={e => setNewForecast({ ...newForecast, forecast_type: e.target.value })}
                          >
                            <option value="revenue">Revenue</option>
                            <option value="expense">Expense</option>
                            <option value="profit">Profit</option>
                            <option value="inventory">Inventory</option>
                          </select>
                        </DateInputGroup>
                        <DateInputGroup>
                          <Label>Method</Label>
                          <select
                            style={{
                              padding: '8px',
                              borderRadius: '4px',
                              border: `1px solid ${theme.colors.border}`,
                              background: theme.colors.background
                            }}
                            value={newForecast.method}
                            onChange={e => setNewForecast({ ...newForecast, method: e.target.value })}
                          >
                            <option value="moving_average">Moving Average</option>
                            <option value="linear_growth">Linear Growth</option>
                            <option value="trend">Trend Analysis</option>
                          </select>
                        </DateInputGroup>
                        <DateInputGroup>
                          <Label>Description</Label>
                          <Input
                            placeholder="Optional"
                            value={newForecast.description}
                            onChange={e => setNewForecast({ ...newForecast, description: e.target.value })}
                          />
                        </DateInputGroup>
                        <DateInputGroup>
                          <Label>Start Date</Label>
                          <Input
                            type="date"
                            value={newForecast.start_date}
                            onChange={e => setNewForecast({ ...newForecast, start_date: e.target.value })}
                          />
                        </DateInputGroup>
                        <DateInputGroup>
                          <Label>End Date</Label>
                          <Input
                            type="date"
                            value={newForecast.end_date}
                            onChange={e => setNewForecast({ ...newForecast, end_date: e.target.value })}
                          />
                        </DateInputGroup>
                      </div>
                      <Button
                        style={{ marginTop: theme.spacing.lg, width: '100%' }}
                        onClick={handleCreateForecast}
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="animate-spin" /> : 'Generate & Save Forecast'}
                      </Button>
                    </div>
                  )}

                  {forecasts && forecasts.length > 0 ? (
                    <>
                      <SummaryGrid>
                        <SummaryCard>
                          <div className="label">
                            <LineChart size={16} />
                            Total Forecasts
                          </div>
                          <div className="value">{forecasts.length}</div>
                          <div className="sub-value">
                            Active forecasts
                          </div>
                        </SummaryCard>
                        <SummaryCard $type="revenue">
                          <div className="label">
                            <TrendingUp size={16} />
                            Revenue Forecasts
                          </div>
                          <div className="value">
                            {forecasts.filter(f => f.forecast_type === 'revenue').length}
                          </div>
                          <div className="sub-value">
                            Revenue forecasting models
                          </div>
                        </SummaryCard>
                        <SummaryCard $type="expense">
                          <div className="label">
                            <ArrowDownRight size={16} />
                            Expense Forecasts
                          </div>
                          <div className="value">
                            {forecasts.filter(f => f.forecast_type === 'expense').length}
                          </div>
                          <div className="sub-value">
                            Expense forecasting models
                          </div>
                        </SummaryCard>
                        <SummaryCard $type="profit">
                          <div className="label">
                            <BarChart3 size={16} />
                            AI Models
                          </div>
                          <div className="value">
                            {forecasts.filter(f =>
                              f.method === 'arima' ||
                              f.method === 'prophet' ||
                              f.method === 'xgboost' ||
                              f.method === 'lstm' ||
                              f.method === 'linear_regression' ||
                              f.method === 'sarima'
                            ).length}
                          </div>
                          <div className="sub-value">
                            Machine learning forecasts
                          </div>
                        </SummaryCard>
                      </SummaryGrid>

                      <div style={{ marginTop: theme.spacing.xl }}>
                        <SectionTitle>All Forecasts</SectionTitle>
                        <CategoryTable>
                          <thead>
                            <tr>
                              <th>Forecast Name</th>
                              <th>Type</th>
                              <th>Method</th>
                              <th>Period</th>
                              <th style={{ textAlign: 'right' }}>Total Forecasted</th>
                              <th>Data Points</th>
                              <th>Created</th>
                              <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {forecasts && forecasts.length > 0 ? (() => {
                              const totalPages = Math.ceil(forecasts.length / forecastsItemsPerPage);
                              const startIndex = (forecastsPage - 1) * forecastsItemsPerPage;
                              const paginated = forecasts.slice(startIndex, startIndex + forecastsItemsPerPage);

                              if (paginated.length === 0 && forecasts.length > 0) {
                                setForecastsPage(1);
                                return null;
                              }

                              return (
                                <>
                                  {paginated.map((forecast) => {
                                    const forecastData = forecast.forecast_data || [];
                                    const totalForecasted = forecastData.reduce((sum, point) => sum + (point.forecasted_value || 0), 0);
                                    const isAIModel = forecast.method === 'arima' ||
                                      forecast.method === 'prophet' ||
                                      forecast.method === 'xgboost' ||
                                      forecast.method === 'lstm' ||
                                      forecast.method === 'linear_regression' ||
                                      forecast.method === 'sarima';

                                    return (
                                      <tr key={forecast.id}>
                                        <td>
                                          <strong>{forecast.name}</strong>
                                          {forecast.description && (
                                            <div style={{ fontSize: theme.typography.fontSizes.xs, color: theme.colors.textSecondary, marginTop: theme.spacing.xs }}>
                                              {forecast.description}
                                            </div>
                                          )}
                                        </td>
                                        <td>
                                          <span style={{ textTransform: 'capitalize' }}>
                                            {forecast.forecast_type}
                                          </span>
                                        </td>
                                        <td>
                                          <span style={{ textTransform: 'capitalize' }}>
                                            {forecast.method.replace(/_/g, ' ')}
                                            {isAIModel && ' (AI)'}
                                          </span>
                                        </td>
                                        <td>
                                          {formatDate(forecast.start_date)} - {formatDate(forecast.end_date)}
                                        </td>
                                        <td style={{ textAlign: 'right', fontWeight: theme.typography.fontWeights.bold }}>
                                          {formatCurrency(totalForecasted)}
                                        </td>
                                        <td>{forecastData.length}</td>
                                        <td>{formatDate(forecast.created_at)}</td>
                                        <td style={{ textAlign: 'right' }}>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={isDeleting}
                                            onClick={() => handleDeleteForecastClick(forecast)}
                                            style={{ color: '#dc2626' }}
                                          >
                                            Delete
                                          </Button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                  {forecasts.length > forecastsItemsPerPage && (
                                    <tr>
                                      <td colSpan={8} style={{ padding: 0 }}>
                                        <PaginationContainer>
                                          <PageInfo>
                                            Showing {startIndex + 1}-{Math.min(startIndex + forecastsItemsPerPage, forecasts.length)} of {forecasts.length} forecasts
                                          </PageInfo>
                                          <PaginationActions>
                                            <PageButton
                                              onClick={() => setForecastsPage(1)}
                                              disabled={forecastsPage === 1}
                                              title="First Page"
                                            >
                                              <ChevronsLeft size={16} />
                                            </PageButton>
                                            <PageButton
                                              onClick={() => setForecastsPage(prev => Math.max(prev - 1, 1))}
                                              disabled={forecastsPage === 1}
                                              title="Previous Page"
                                            >
                                              <ChevronLeft size={16} />
                                            </PageButton>

                                            {[...Array(totalPages)].map((_, i) => {
                                              const pageNum = i + 1;
                                              if (
                                                pageNum === 1 ||
                                                pageNum === totalPages ||
                                                (pageNum >= forecastsPage - 1 && pageNum <= forecastsPage + 1)
                                              ) {
                                                return (
                                                  <PageButton
                                                    key={pageNum}
                                                    $active={forecastsPage === pageNum}
                                                    onClick={() => setForecastsPage(pageNum)}
                                                  >
                                                    {pageNum}
                                                  </PageButton>
                                                );
                                              } else if (
                                                pageNum === forecastsPage - 2 ||
                                                pageNum === forecastsPage + 2
                                              ) {
                                                return <span key={pageNum}>...</span>;
                                              }
                                              return null;
                                            })}

                                            <PageButton
                                              onClick={() => setForecastsPage(prev => Math.min(prev + 1, totalPages))}
                                              disabled={forecastsPage === totalPages}
                                              title="Next Page"
                                            >
                                              <ChevronRight size={16} />
                                            </PageButton>
                                            <PageButton
                                              onClick={() => setForecastsPage(totalPages)}
                                              disabled={forecastsPage === totalPages}
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
                            })() : (
                              <tr>
                                <td colSpan={8} style={{ textAlign: 'center', color: theme.colors.textSecondary }}>
                                  No forecasts available
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </CategoryTable>
                      </div>

                      <div style={{ marginTop: theme.spacing.xl }}>
                        <SectionTitle>Forecast Summary by Type</SectionTitle>
                        <CategoryTable>
                          <thead>
                            <tr>
                              <th>Forecast Type</th>
                              <th style={{ textAlign: 'right' }}>Count</th>
                              <th style={{ textAlign: 'right' }}>Total Forecasted Value</th>
                              <th style={{ textAlign: 'right' }}>Average per Forecast</th>
                            </tr>
                          </thead>
                          <tbody>
                            {['revenue', 'expense', 'profit', 'inventory'].map((type) => {
                              const typeForecasts = forecasts.filter(f => f.forecast_type === type);
                              if (typeForecasts.length === 0) return null;

                              const totalValue = typeForecasts.reduce((sum, f) => {
                                const data = f.forecast_data || [];
                                return sum + data.reduce((s, p) => s + (p.forecasted_value || 0), 0);
                              }, 0);

                              return (
                                <tr key={type}>
                                  <td style={{ textTransform: 'capitalize', fontWeight: theme.typography.fontWeights.medium }}>
                                    {type}
                                  </td>
                                  <td style={{ textAlign: 'right' }}>{typeForecasts.length}</td>
                                  <td style={{ textAlign: 'right', fontWeight: theme.typography.fontWeights.bold }}>
                                    {formatCurrency(totalValue)}
                                  </td>
                                  <td style={{ textAlign: 'right' }}>
                                    {formatCurrency(totalValue / typeForecasts.length)}
                                  </td>
                                </tr>
                              );
                            }).filter(Boolean)}
                          </tbody>
                        </CategoryTable>
                      </div>
                    </>
                  ) : (
                    <EmptyState>
                      <LineChart size={48} />
                      <h3>No forecasts available</h3>
                      <p>Forecast reports are only available to Finance Admin, Admin, and Manager roles. Create forecasts to see them here.</p>
                    </EmptyState>
                  )}
                </ReportCard>
              </ReportSection>
            )}

            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Forecast</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this forecast? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>

                {selectedForecastForDelete && (
                  <div style={{ padding: '10px 0' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>Name:</strong> {selectedForecastForDelete.name}
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                      <strong>Type:</strong> {capitalize(selectedForecastForDelete.forecast_type)}
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                      <strong>Method:</strong> {capitalize(selectedForecastForDelete.method.replace('_', ' '))}
                    </div>

                    <Label htmlFor="delete-password">Confirm with Password</Label>
                    <Input
                      id="delete-password"
                      type="password"
                      placeholder="Enter your password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      style={{ marginTop: '5px' }}
                    />
                  </div>
                )}

                <DialogFooter>
                  <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={isDeleting}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Forecast
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </PageContainer>
    </Layout>
  );
}
