'use client';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '@/lib/rbac/auth-context';
import {
  BarChart3, TrendingUp, TrendingDown,
  Activity, Calendar, RefreshCw,
  AlertCircle, ArrowUpRight, ArrowDownRight,
  Package, ShoppingCart, Check, X
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, Sector
} from 'recharts';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const PRIMARY_LIGHT = (props: any) => props.theme.mode === 'dark' ? 'rgba(0, 170, 0, 0.1)' : '#e8f5e9';
const TEXT_COLOR_DARK = (props: any) => props.theme.colors.textDark;
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';
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
  max-width: 980px;
  margin-left: auto;
  margin-right: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.sm} ${theme.spacing.sm};
  
  @media (max-width: 768px) {
    padding: ${theme.spacing.md} ${theme.spacing.lg};
  }
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: #ffffff;
  padding: ${theme.spacing.xl} clamp(${theme.spacing.lg}, 4vw, ${theme.spacing.xl});
  margin-bottom: ${theme.spacing.xl};
  width: 100%;
  max-width: 925px;
  margin-left: auto;
  margin-right: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-bottom: 3px solid rgba(255, 255, 255, 0.1);
  
  h1 {
    font-size: clamp(28px, 3.5vw, 42px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
  }
`;

const FilterBar = styled.div`
  background: ${theme.colors.background};
  padding: ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  margin-bottom: ${theme.spacing.xl};
  display: flex;
  gap: ${theme.spacing.lg};
  align-items: center;
  flex-wrap: wrap;
  transition: all ${theme.transitions.default};
  
  &:hover {
    box-shadow: ${CardShadowHover};
  }
  
  span {
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_DARK};
    font-size: ${theme.typography.fontSizes.sm};
    white-space: nowrap;
  }
  
  input {
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    border-radius: ${theme.borderRadius.sm};
    border: 1px solid ${theme.colors.border};
    font-size: ${theme.typography.fontSizes.sm};
    transition: all ${theme.transitions.default};
    
    &:focus {
      outline: none;
      border-color: ${PRIMARY_COLOR};
      box-shadow: 0 0 0 3px rgba(0, 170, 0, 0.1);
    }
  }
  
  @media (max-width: 768px) {
    padding: ${theme.spacing.lg};
    gap: ${theme.spacing.md};
  }
`;

const SectionTitle = styled.h2`
  font-size: clamp(20px, 2.2vw, 28px);
  margin: ${theme.spacing.xl} 0 ${theme.spacing.lg};
  color: ${TEXT_COLOR_DARK};
  font-weight: ${theme.typography.fontWeights.bold};
  border-bottom: 2px solid ${PRIMARY_LIGHT};
  padding-bottom: ${theme.spacing.md};
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    width: 60px;
    height: 2px;
    background: ${PRIMARY_COLOR};
  }
`;

const KPICard = styled.div<{ $growth?: number }>`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.xl};
  display: flex;
  flex-direction: column;
  position: relative;
  transition: all ${theme.transitions.default};
  min-height: 180px;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 4px;
    height: 100%;
    background: ${PRIMARY_COLOR};
    opacity: 0;
    transition: opacity ${theme.transitions.default};
  }
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${CardShadowHover};
    border-color: ${PRIMARY_COLOR};
    
    &::before {
      opacity: 1;
    }
  }
`;

const KPIPairGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.lg};
  }
`;

const KPIValue = styled.div`
  font-size: clamp(36px, 4.5vw, 20px);
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: ${theme.spacing.sm} 0;
  line-height: 1.1;
`;

const KPILabel = styled.div`
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: ${theme.spacing.sm};
  font-weight: ${theme.typography.fontWeights.medium};
`;

const GrowthIndicator = styled.div<{ $positive: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${props => props.$positive ? '#059669' : '#ef4444'};
  margin-top: ${theme.spacing.md};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  background: ${props => props.$positive ? 'rgba(5, 150, 105, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  border-radius: ${theme.borderRadius.sm};
  width: fit-content;
  
  svg {
    flex-shrink: 0;
  }
`;

const ChartCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};
  min-height: 400px;
  display: flex;
  flex-direction: column;
  transition: all ${theme.transitions.default};
  
  &:hover {
    box-shadow: ${CardShadowHover};
    transform: translateY(-2px);
  }
`;

const ChartTitle = styled.h3`
  font-size: clamp(${theme.typography.fontSizes.lg}, 1.5vw, 24px);
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0 0 ${theme.spacing.xl};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding-bottom: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border};
`;

const ChartLegend = styled.div`
  display: flex;
  gap: ${theme.spacing.lg};
  justify-content: center;
  margin-bottom: ${theme.spacing.md};
  flex-wrap: wrap;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_DARK};
  
  .legend-color {
    width: 16px;
    height: 16px;
    border-radius: ${theme.borderRadius.sm};
    flex-shrink: 0;
  }
  
  .legend-label {
    font-weight: ${theme.typography.fontWeights.medium};
  }
`;

const LineChartContainer = styled.div`
  position: relative;
  height: 350px;
  margin: ${theme.spacing.lg} 0;
  padding: ${theme.spacing.md};
`;

const LineChartSVG = styled.svg`
  width: 100%;
  height: 100%;
  overflow: visible;
`;

const LinePath = styled.path`
  fill: none;
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  transition: all ${theme.transitions.default};
  
  &:hover {
    stroke-width: 4;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
  }
`;

const LinePoint = styled.circle`
  fill: white;
  stroke-width: 2;
  cursor: pointer;
  transition: all ${theme.transitions.default};
  
  &:hover {
    r: 6;
    filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  }
`;

const GridLine = styled.line`
  stroke: ${theme.colors.border};
  stroke-width: 1;
  stroke-dasharray: 4, 4;
  opacity: 0.5;
`;

const AxisLabel = styled.text`
  font-size: ${theme.typography.fontSizes.xs};
  fill: ${TEXT_COLOR_MUTED};
  text-anchor: middle;
`;

const ChartTooltip = styled.div`
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  pointer-events: none;
  z-index: 1000;
  white-space: nowrap;
  opacity: 0;
  transition: opacity ${theme.transitions.default};
  
  &.visible {
    opacity: 1;
  }
`;

const CategoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const CategoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.lg};
  background: ${theme.colors.backgroundSecondary};
  border-radius: ${theme.borderRadius.sm};
  transition: all ${theme.transitions.default};
  border-left: 3px solid transparent;
  cursor: default;
  
  &:hover {
    background: ${PRIMARY_LIGHT};
    transform: translateX(4px);
    border-left-color: ${PRIMARY_COLOR};
    box-shadow: ${CardShadow};
  }
  
  .category-name {
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_DARK};
    font-size: ${theme.typography.fontSizes.md};
    flex: 1;
  }
  
  .category-amount {
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    font-size: clamp(${theme.typography.fontSizes.md}, 1.2vw, 18px);
    text-align: right;
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

const TwoColumnGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
  gap: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
  
  @media (max-width: 768px) {
    gap: ${theme.spacing.lg};
  }
`;

type NumericRecord = Record<string, number | undefined>;

type KPIValues = {
  revenue?: number;
  expenses?: number;
  profit?: number;
  profit_margin?: number;
  expense_ratio?: number;
  avg_daily_revenue?: number;
  avg_daily_expenses?: number;
  avg_daily_profit?: number;
  inventory_turnover?: number;
  sales_per_employee?: number;
} & NumericRecord;

type KPIGrowth = {
  revenue_growth_percent?: number;
  expense_growth_percent?: number;
  profit_growth_percent?: number;
  profit_margin_change?: number;
  expense_ratio_change?: number;
  avg_ticket_size?: number;
  conversion_rate?: number;
  cash_flow_trend?: number;
} & NumericRecord;

type KPIMetrics = {
  current_period?: KPIValues;
  previous_period?: KPIValues;
  growth?: KPIGrowth;
};

type TimeSeries = {
  labels?: string[];
  revenue?: number[];
  expenses?: number[];
};

type CategoryStat = {
  category?: string;
  total?: number;
};

type CategoryBreakdown = {
  revenue_by_category?: CategoryStat[];
  expenses_by_category?: CategoryStat[];
};

type TrendPrediction = {
  next_value?: number;
};

type TrendInfo = {
  direction?: 'increasing' | 'decreasing' | 'stable' | string;
  strength?: number;
};

type Trends = {
  profit?: {
    trend?: TrendInfo;
    prediction?: TrendPrediction;
  };
};

type InventorySummary = {
  total_items?: number;
  total_cost_value?: number;
  total_selling_value?: number;
  potential_profit?: number;
  total_quantity_in_stock?: number;
} | null;

type SalesSummary = {
  total_sales?: number;
  total_revenue?: number;
  pending_sales?: number;
  posted_sales?: number;
} | null;

interface AnalyticsData {
  kpis?: KPIMetrics | null;
  time_series?: TimeSeries | null;
  category_breakdown?: CategoryBreakdown | null;
  trends?: Trends | null;
  inventory?: InventorySummary;
  sales?: SalesSummary;
}

const AnalyticsPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year' | 'custom'>('month');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<{ visible: boolean; x: number; y: number; text: string }>({
    visible: false,
    x: 0,
    y: 0,
    text: ''
  });

  // Derived Financial Metrics (Aggregating Revenue + Sales)
  // We must calculate these on the frontend because the analytics backend 
  // currently calculates KPIs based on Revenue/Expense entries only, not Sales.
  const baseRevenue = analyticsData?.kpis?.current_period?.revenue || 0;
  const salesRevenue = analyticsData?.sales?.total_revenue || 0;
  const totalRevenue = baseRevenue + salesRevenue;

  const totalExpenses = analyticsData?.kpis?.current_period?.expenses || 0;
  const netProfit = totalRevenue - totalExpenses;

  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
  const expenseRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;

  const loadAnalytics = useCallback(async () => {
    if (!user) return;

    // Don't proceed if period is 'custom' but dates are not provided
    if (period === 'custom' && (!startDate || !endDate)) {
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params: { period: typeof period; start_date?: string; end_date?: string, category?: string } = { period };
      if (period === 'custom' && startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      }
      if (selectedCategory) {
        params.category = selectedCategory;
      }

      const response = await apiClient.getAnalyticsOverview(params);
      if (response && response.data) {
        setAnalyticsData(response.data as AnalyticsData);
        setError(null);
      } else {
        throw new Error('Invalid response from analytics API');
      }
    } catch (err: unknown) {
      let errorMessage = 'Failed to load analytics data';

      if (typeof err === 'object' && err !== null && 'response' in err) {
        const typedErr = err as { response?: { status?: number; data?: { detail?: string; message?: string } } };
        const status = typedErr.response?.status;
        const detail = typedErr.response?.data?.detail || typedErr.response?.data?.message;

        if (status === 403) {
          errorMessage = detail || 'You do not have permission to view analytics';
        } else if (status === 400) {
          errorMessage = detail || 'Invalid date range or parameters';
        } else if (status === 500) {
          errorMessage = detail || 'Server error. Please try again later.';
        } else if (status) {
          errorMessage = detail || `Error: ${status}`;
        }
      } else if ((err as { message?: string }).message) {
        errorMessage = (err as { message?: string }).message as string;
      }

      setError(errorMessage);
      // Clear data on error
      setAnalyticsData(null);
    } finally {
      setLoading(false);
    }
  }, [user, period, startDate, endDate]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Don't load analytics if period is 'custom' but dates are not provided
    if (period === 'custom' && (!startDate || !endDate)) {
      setLoading(false);
      setAnalyticsData(null);
      return;
    }

    loadAnalytics();
  }, [user, period, startDate, endDate, selectedCategory, loadAnalytics]);

  const formatCurrency = (value: number) => {
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const handlePointHover = (e: React.MouseEvent<SVGCircleElement>, value: number, label: string, type: string) => {
    const rect = e.currentTarget.closest('svg')?.getBoundingClientRect();
    if (rect) {
      setTooltip({
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top - 40,
        text: `${type}: ${formatCurrency(value)} - ${label}`
      });
    }
  };

  const handlePointLeave = () => {
    setTooltip({ visible: false, x: 0, y: 0, text: '' });
  };

  const renderLineChart = (labels: string[], revenueData: number[], expenseData: number[]) => {
    if (!revenueData || revenueData.length === 0) return (
      <div style={{ height: '350px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: TEXT_COLOR_MUTED }}>
        No time-series data for this selection
      </div>
    );

    // Transform data for Recharts
    const chartData = labels.map((label, index) => ({
      name: label,
      revenue: revenueData[index] || 0,
      expenses: expenseData[index] || 0
    }));

    const revenueColor = '#22c55e';
    const expenseColor = '#ef4444';

    return (
      <LineChartContainer>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={revenueColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={revenueColor} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={expenseColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={expenseColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.colors.border} opacity={0.5} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: TEXT_COLOR_MUTED, fontSize: 12 }}
              dy={10}
              interval={period === 'month' ? 4 : 'preserveStartEnd'}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: TEXT_COLOR_MUTED, fontSize: 12 }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '12px'
              }}
              itemStyle={{ color: '#fff' }}
              formatter={(value: number) => [formatCurrency(value), '']}
            />
            <Legend
              verticalAlign="top"
              align="center"
              height={36}
              iconType="circle"
              wrapperStyle={{ fontSize: '14px', fontWeight: 500 }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke={revenueColor}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorRevenue)"
              animationDuration={1500}
            />
            <Area
              type="monotone"
              dataKey="expenses"
              name="Expenses"
              stroke={expenseColor}
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorExpenses)"
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </LineChartContainer>
    );
  };

  // Check if user has permission to view analytics
  useEffect(() => {
    if (user) {
      const userRole = user.role?.toLowerCase();
      const allowedRoles = ['admin', 'super_admin', 'finance_admin', 'finance_manager', 'manager'];
      if (!allowedRoles.includes(userRole || '')) {
        setError('You do not have permission to view analytics');
        setLoading(false);
      }
    }
  }, [user]);

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <LoadingContainer>
            <Spinner />
            <p>Loading analytics...</p>
          </LoadingContainer>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        <HeaderContainer>
          <h1>
            <BarChart3 size={36} />
            Advanced Analytics
          </h1>
        </HeaderContainer>

        <ContentContainer>
          {error && (
            <ErrorBanner>
              <AlertCircle size={20} />
              <span>{error}</span>
            </ErrorBanner>
          )}

          <FilterBar>
            <Calendar size={20} />
            <span>Period:</span>
            <Button
              variant={period === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('week')}
            >
              {period === 'week' && <Check size={14} className="mr-1" />}
              Week
            </Button>
            <Button
              variant={period === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('month')}
            >
              {period === 'month' && <Check size={14} className="mr-1" />}
              Month
            </Button>
            <Button
              variant={period === 'quarter' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('quarter')}
            >
              {period === 'quarter' && <Check size={14} className="mr-1" />}
              Quarter
            </Button>
            <Button
              variant={period === 'year' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('year')}
            >
              {period === 'year' && <Check size={14} className="mr-1" />}
              Year
            </Button>
            <Button
              variant={period === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod('custom')}
            >
              {period === 'custom' && <Check size={14} className="mr-1 text-green-500 fill-green-500" />}
              Custom
            </Button>
            {period === 'custom' && (
              <>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setError(null);
                  }}
                  max={endDate || undefined}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                <span>to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setError(null);
                  }}
                  min={startDate || undefined}
                  style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ccc' }}
                />
                {startDate && endDate && new Date(startDate) > new Date(endDate) && (
                  <span style={{ color: '#ef4444', fontSize: theme.typography.fontSizes.xs }}>
                    Start date must be before end date
                  </span>
                )}
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={loadAnalytics}
            >
              <RefreshCw size={16} />
            </Button>
          </FilterBar>

          {analyticsData ? (
            <>
              <SectionTitle>Key Performance Indicators</SectionTitle>

              <KPIPairGrid>
                <KPICard>
                  <KPILabel>Total Revenue</KPILabel>
                  <KPIValue style={{ color: '#059669' }}>
                    {formatCurrency(totalRevenue)}
                  </KPIValue>
                  {analyticsData.kpis?.growth?.revenue_growth_percent !== undefined && (
                    <GrowthIndicator $positive={analyticsData.kpis.growth.revenue_growth_percent >= 0}>
                      {analyticsData.kpis.growth.revenue_growth_percent >= 0 ? (
                        <ArrowUpRight size={16} />
                      ) : (
                        <ArrowDownRight size={16} />
                      )}
                      {formatPercent(analyticsData.kpis.growth.revenue_growth_percent)} vs previous period
                    </GrowthIndicator>
                  )}
                </KPICard>

                <KPICard>
                  <KPILabel>Total Expenses</KPILabel>
                  <KPIValue style={{ color: '#ef4444' }}>
                    {formatCurrency(totalExpenses)}
                  </KPIValue>
                  {analyticsData.kpis?.growth?.expense_growth_percent !== undefined && (
                    <GrowthIndicator $positive={analyticsData.kpis.growth.expense_growth_percent <= 0}>
                      {analyticsData.kpis.growth.expense_growth_percent <= 0 ? (
                        <ArrowDownRight size={16} />
                      ) : (
                        <ArrowUpRight size={16} />
                      )}
                      {formatPercent(analyticsData.kpis.growth.expense_growth_percent)} vs previous period
                    </GrowthIndicator>
                  )}
                </KPICard>
              </KPIPairGrid>

              <KPIPairGrid>
                <KPICard>
                  <KPILabel>Net Profit</KPILabel>
                  <KPIValue style={{ color: netProfit >= 0 ? '#059669' : '#ef4444' }}>
                    {formatCurrency(netProfit)}
                  </KPIValue>
                  {analyticsData.kpis?.growth?.profit_growth_percent !== undefined && (
                    <GrowthIndicator $positive={analyticsData.kpis.growth.profit_growth_percent >= 0}>
                      {analyticsData.kpis.growth.profit_growth_percent >= 0 ? (
                        <ArrowUpRight size={16} />
                      ) : (
                        <ArrowDownRight size={16} />
                      )}
                      {formatPercent(analyticsData.kpis.growth.profit_growth_percent)} vs previous period
                    </GrowthIndicator>
                  )}
                </KPICard>

                <KPICard>
                  <KPILabel>Profit Margin</KPILabel>
                  <KPIValue>
                    {`${profitMargin.toFixed(2)}%`}
                  </KPIValue>
                  <KPILabel style={{ marginTop: '8px' }}>
                    Expense Ratio: {`${expenseRatio.toFixed(2)}%`}
                  </KPILabel>
                </KPICard>
              </KPIPairGrid>

              <KPIPairGrid>
                <KPICard>
                  <KPILabel>Avg Daily Revenue</KPILabel>
                  <KPIValue style={{ color: '#059669' }}>
                    {formatCurrency(analyticsData.kpis?.current_period?.avg_daily_revenue || 0)}
                  </KPIValue>
                </KPICard>

                <KPICard>
                  <KPILabel>Avg Daily Expenses</KPILabel>
                  <KPIValue style={{ color: '#ef4444' }}>
                    {formatCurrency(analyticsData.kpis?.current_period?.avg_daily_expenses || 0)}
                  </KPIValue>
                </KPICard>
              </KPIPairGrid>

              {/* Inventory & Sales Section */}
              {(analyticsData.inventory || analyticsData.sales) && (
                <>
                  <SectionTitle>
                    <Package size={24} style={{ marginRight: theme.spacing.sm }} />
                    Inventory & Sales Overview
                  </SectionTitle>

                  {analyticsData.inventory && (
                    <KPIPairGrid>
                      <KPICard>
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, marginBottom: theme.spacing.sm }}>
                          <Package size={16} />
                          <KPILabel>Total Inventory Items</KPILabel>
                        </div>
                        <KPIValue>
                          {analyticsData.inventory.total_items || 0}
                        </KPIValue>
                        <KPILabel style={{ marginTop: theme.spacing.sm }}>
                          Total Stock: {analyticsData.inventory.total_quantity_in_stock || 0} units
                        </KPILabel>
                      </KPICard>

                      <KPICard>
                        <KPILabel>Inventory Selling Value</KPILabel>
                        <KPIValue>
                          {formatCurrency(analyticsData.inventory.total_selling_value || 0)}
                        </KPIValue>
                        <KPILabel style={{ marginTop: theme.spacing.sm }}>
                          Cost Value: {formatCurrency(analyticsData.inventory.total_cost_value || 0)}
                        </KPILabel>
                      </KPICard>
                    </KPIPairGrid>
                  )}

                  {analyticsData.inventory && (
                    <KPIPairGrid>
                      <KPICard>
                        <KPILabel>Potential Profit (Inventory)</KPILabel>
                        <KPIValue>
                          {formatCurrency(analyticsData.inventory.potential_profit || 0)}
                        </KPIValue>
                        <KPILabel style={{ marginTop: theme.spacing.sm }}>
                          Based on current inventory valuation
                        </KPILabel>
                      </KPICard>

                      <KPICard>
                        <KPILabel>Inventory Cost Value</KPILabel>
                        <KPIValue>
                          {formatCurrency(analyticsData.inventory.total_cost_value || 0)}
                        </KPIValue>
                        <KPILabel style={{ marginTop: theme.spacing.sm }}>
                          Total investment in inventory
                        </KPILabel>
                      </KPICard>
                    </KPIPairGrid>
                  )}

                  {analyticsData.sales && (
                    <KPIPairGrid>
                      <KPICard>
                        <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs, marginBottom: theme.spacing.sm }}>
                          <ShoppingCart size={16} />
                          <KPILabel>Total Sales (Period)</KPILabel>
                        </div>
                        <KPIValue>
                          {analyticsData.sales.total_sales || 0}
                        </KPIValue>
                        <KPILabel style={{ marginTop: theme.spacing.sm }}>
                          Posted: {analyticsData.sales.posted_sales || 0} | Pending: {analyticsData.sales.pending_sales || 0}
                        </KPILabel>
                      </KPICard>

                      <KPICard>
                        <KPILabel>Sales Revenue (Period)</KPILabel>
                        <KPIValue style={{ color: '#059669' }}>
                          {formatCurrency(analyticsData.sales.total_revenue || 0)}
                        </KPIValue>
                        <KPILabel style={{ marginTop: theme.spacing.sm }}>
                          From posted sales only
                        </KPILabel>
                      </KPICard>
                    </KPIPairGrid>
                  )}
                </>
              )}

              <SectionTitle>Financial Trends</SectionTitle>
              <ChartCard>
                <ChartTitle>Revenue vs Expenses Over Time</ChartTitle>
                {analyticsData.time_series && analyticsData.time_series.labels && (
                  <>
                    {renderLineChart(
                      analyticsData.time_series.labels || [],
                      analyticsData.time_series.revenue || [],
                      analyticsData.time_series.expenses || []
                    )}
                  </>
                )}

                <div style={{
                  marginTop: theme.spacing.xl,
                  paddingTop: theme.spacing.xl,
                  borderTop: `1px solid ${theme.colors.border}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>
                  <h4 style={{
                    fontSize: `clamp(${theme.typography.fontSizes.lg}, 1.5vw, 22px)`,
                    fontWeight: theme.typography.fontWeights.bold,
                    color: theme.colors.text,
                    margin: `${theme.spacing.lg} 0 ${theme.spacing.md}`,
                    textAlign: 'center'
                  }}>
                    Profit Trend
                  </h4>
                  <div className="trend-indicator" style={{
                    fontSize: theme.typography.fontSizes.lg,
                    margin: `${theme.spacing.lg} 0`,
                    transition: `transform ${theme.transitions.default}`,
                    color: analyticsData.trends?.profit?.trend?.direction === 'increasing' ? '#059669' :
                      analyticsData.trends?.profit?.trend?.direction === 'decreasing' ? '#ef4444' : TEXT_COLOR_MUTED
                  }}>
                    {analyticsData.trends?.profit?.trend?.direction === 'increasing' && (
                      <TrendingUp size={48} />
                    )}
                    {analyticsData.trends?.profit?.trend?.direction === 'decreasing' && (
                      <TrendingDown size={48} />
                    )}
                    {analyticsData.trends?.profit?.trend?.direction === 'stable' && (
                      <Activity size={48} />
                    )}
                  </div>
                  <p style={{
                    fontSize: theme.typography.fontSizes.sm,
                    color: TEXT_COLOR_MUTED,
                    margin: `${theme.spacing.sm} 0`,
                    fontWeight: theme.typography.fontWeights.medium
                  }}>
                    Trend: {analyticsData.trends?.profit?.trend?.direction || 'stable'}
                  </p>
                  <p style={{
                    fontSize: theme.typography.fontSizes.sm,
                    color: TEXT_COLOR_MUTED,
                    margin: `${theme.spacing.sm} 0`,
                    fontWeight: theme.typography.fontWeights.medium
                  }}>
                    Strength: {analyticsData.trends?.profit?.trend?.strength?.toFixed(1) || 0}%
                  </p>
                  {analyticsData.trends?.profit?.prediction?.next_value && (
                    <p style={{
                      fontSize: theme.typography.fontSizes.sm,
                      color: TEXT_COLOR_MUTED,
                      margin: `${theme.spacing.sm} 0`,
                      fontWeight: theme.typography.fontWeights.medium
                    }}>
                      Predicted next: {formatCurrency(analyticsData.trends.profit.prediction.next_value)}
                    </p>
                  )}
                </div>
              </ChartCard>

              <SectionTitle>
                Category Breakdown
                {selectedCategory && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                    style={{ marginLeft: theme.spacing.md, fontSize: '12px', color: '#ef4444' }}
                  >
                    Clear Filter: {selectedCategory} <X size={14} style={{ marginLeft: '4px' }} />
                  </Button>
                )}
              </SectionTitle>
              <TwoColumnGrid>
                <ChartCard>
                  <ChartTitle>Revenue by Category</ChartTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
                    <div style={{ height: '250px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.category_breakdown?.revenue_by_category || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="total"
                            nameKey="category"
                            onClick={(data) => setSelectedCategory(data.category)}
                            cursor="pointer"
                          >
                            {(analyticsData.category_breakdown?.revenue_by_category || []).map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={selectedCategory === entry.category ? PRIMARY_COLOR : ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0'][index % 4]}
                                opacity={selectedCategory && selectedCategory !== entry.category ? 0.3 : 1}
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <CategoryList>
                      {analyticsData.category_breakdown?.revenue_by_category?.map((item: CategoryStat, index: number) => (
                        <CategoryItem
                          key={index}
                          onClick={() => setSelectedCategory(item.category || null)}
                          style={{
                            borderLeftColor: selectedCategory === item.category ? PRIMARY_COLOR : 'transparent',
                            background: selectedCategory === item.category ? 'rgba(0, 170, 0, 0.1)' : undefined
                          }}
                        >
                          <span className="category-name">{item.category || 'Unknown'}</span>
                          <span className="category-amount">
                            {formatCurrency(item.total || 0)}
                          </span>
                        </CategoryItem>
                      ))}
                    </CategoryList>
                  </div>
                </ChartCard>

                <ChartCard>
                  <ChartTitle>Expenses by Category</ChartTitle>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.lg }}>
                    <div style={{ height: '250px', width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analyticsData.category_breakdown?.expenses_by_category || []}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="total"
                            nameKey="category"
                            onClick={(data) => setSelectedCategory(data.category)}
                            cursor="pointer"
                          >
                            {(analyticsData.category_breakdown?.expenses_by_category || []).map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={selectedCategory === entry.category ? '#ef4444' : ['#ef4444', '#f87171', '#fca5a5', '#fecaca'][index % 4]}
                                opacity={selectedCategory && selectedCategory !== entry.category ? 0.3 : 1}
                              />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <CategoryList>
                      {analyticsData.category_breakdown?.expenses_by_category?.map((item: CategoryStat, index: number) => (
                        <CategoryItem
                          key={index}
                          onClick={() => setSelectedCategory(item.category || null)}
                          style={{
                            borderLeftColor: selectedCategory === item.category ? '#ef4444' : 'transparent',
                            background: selectedCategory === item.category ? 'rgba(239, 68, 68, 0.05)' : undefined
                          }}
                        >
                          <span className="category-name">{item.category || 'Unknown'}</span>
                          <span className="category-amount">
                            {formatCurrency(item.total || 0)}
                          </span>
                        </CategoryItem>
                      ))}
                    </CategoryList>
                  </div>
                </ChartCard>
              </TwoColumnGrid>
            </>
          ) : !loading && !error ? (
            <LoadingContainer>
              <AlertCircle size={48} style={{ opacity: 0.5, marginBottom: theme.spacing.md }} />
              <p>No analytics data available for the selected period</p>
              <p style={{ fontSize: theme.typography.fontSizes.sm, marginTop: theme.spacing.sm }}>
                Try selecting a different time period or check back later
              </p>
            </LoadingContainer>
          ) : null}
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
};

export default AnalyticsPage;

