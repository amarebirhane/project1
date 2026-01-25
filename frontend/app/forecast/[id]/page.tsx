'use client';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import { useRouter, useParams } from 'next/navigation';
import {
  LineChart, ArrowLeft, TrendingUp, TrendingDown,
  BarChart3, Activity, FileText, AlertCircle, Edit, Download,
  FileSpreadsheet, GitBranch, RefreshCw
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  LineChart as RechartsLineChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Line
} from 'recharts';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const PRIMARY_LIGHT = theme.mode === 'dark' ? 'rgba(0, 170, 0, 0.1)' : '#e8f5e9';
const TEXT_COLOR_DARK = theme.colors.textDark || '#000000';
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';
const BACKGROUND_GRADIENT = (props: any) => props.theme.mode === 'dark' ? `linear-gradient(180deg, #0f172a 0%, #1e293b 60%, ${props.theme.colors.background} 100%)` : `linear-gradient(180deg, #f9fafb 0%, #f3f4f6 60%, ${props.theme.colors.background} 100%)`;

const CardShadow = `
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 1px 2px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px rgba(0, 0, 0, 0.02)
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
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  color: ${TEXT_COLOR_MUTED};
  text-decoration: none;
  margin-bottom: ${theme.spacing.md};
  transition: color ${theme.transitions.default};

  &:hover {
    color: ${TEXT_COLOR_DARK};
  }
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: #ffffff;
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.md};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
  
  h1 {
    font-size: clamp(28px, 3.5vw, 36px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0;
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
  }
`;

const InfoCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const InfoRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
  
  strong {
    color: ${TEXT_COLOR_DARK};
    min-width: 150px;
    font-weight: ${theme.typography.fontWeights.medium};
  }
`;

const MethodBadge = styled.span<{ $method: string }>`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.medium};
  background: ${props => {
    switch (props.$method) {
      case 'moving_average': return '#dbeafe';
      case 'linear_growth': return '#d1fae5';
      case 'trend': return '#fef3c7';
      case 'arima': return '#e0e7ff';
      case 'prophet': return '#fce7f3';
      case 'xgboost': return '#dbeafe';
      case 'lstm': return '#e0e7ff';
      case 'linear_regression': return '#fef3c7';
      default: return '#f3f4f6';
    }
  }};
  color: ${props => {
    switch (props.$method) {
      case 'moving_average': return '#1e40af';
      case 'linear_growth': return '#065f46';
      case 'trend': return '#92400e';
      case 'arima': return '#4338ca';
      case 'prophet': return '#be185d';
      case 'xgboost': return '#1e40af';
      case 'lstm': return '#4338ca';
      case 'linear_regression': return '#92400e';
      default: return '#6b7280';
    }
  }};
  text-transform: capitalize;
`;

const ForecastDataCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.lg};
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const ChartContainer = styled.div`
  width: 100%;
  height: 400px;
  margin: ${theme.spacing.md} 0;
  padding: ${theme.spacing.md};
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.sm};
`;

const ActionButtonsContainer = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  flex-wrap: wrap;
  margin-bottom: ${theme.spacing.lg};
`;

const TabContainer = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  border-bottom: 2px solid ${theme.colors.border};
  margin-bottom: ${theme.spacing.lg};
`;

const Tab = styled.button<{ $active?: boolean }>`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  background: none;
  border: none;
  border-bottom: 2px solid ${props => props.$active ? PRIMARY_COLOR : 'transparent'};
  color: ${props => props.$active ? PRIMARY_COLOR : TEXT_COLOR_MUTED};
  font-weight: ${props => props.$active ? theme.typography.fontWeights.bold : theme.typography.fontWeights.medium};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: ${PRIMARY_COLOR};
  }
`;

const ComparisonCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.lg};
`;

const MetricCard = styled.div`
  background: ${PRIMARY_LIGHT};
  border-radius: ${theme.borderRadius.sm};
  padding: ${theme.spacing.md};
  text-align: center;
  
  h4 {
    margin: 0 0 ${theme.spacing.xs} 0;
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
  }
  
  p {
    margin: 0;
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
  }
`;

const StyledSelect = styled.select`
  padding: 8px 12px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.textDark};
  cursor: pointer;
  
  &:focus {
    border-color: #3b82f6;
    outline: none;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  margin: 0;
  margin-bottom: ${theme.spacing.md};
  
  label {
    display: block;
    font-size: ${theme.typography.fontSizes.sm};
    font-weight: ${theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
  }
`;

const ForecastTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: ${theme.spacing.md};
  
  th {
    text-align: left;
    padding: ${theme.spacing.md};
    background: ${PRIMARY_LIGHT};
    font-weight: ${theme.typography.fontWeights.medium};
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_DARK};
    border-bottom: 2px solid ${theme.colors.border};
  }
  
  td {
    padding: ${theme.spacing.md};
    border-bottom: 1px solid ${theme.colors.border};
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_DARK};
  }
  
  tr:hover {
    background: ${PRIMARY_LIGHT};
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

type ForecastMethod = 'moving_average' | 'linear_growth' | 'trend' | string;

type MethodParams = Record<string, unknown>;

interface ForecastDataPoint {
  period?: string;
  date?: string;
  forecasted_value?: number;
  method?: ForecastMethod;
}

interface Forecast {
  id: number;
  name: string;
  description?: string;
  forecast_type: string;
  period_type: string;
  start_date: string;
  end_date: string;
  method: ForecastMethod;
  method_params?: MethodParams;
  historical_start_date?: string;
  historical_end_date?: string;
  forecast_data?: ForecastDataPoint[];
  created_at: string;
}

interface ActualDataPoint {
  date: string;
  value: number;
  type: 'revenue' | 'expense' | 'all' | string;
}

interface BudgetSummary {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
}

interface AccuracyComparison {
  date: string;
  forecast: number;
  actual: number;
  error: number;
  percentError: number;
}

interface AccuracyMetrics {
  comparisons: AccuracyComparison[];
  avgError: number;
  avgPercentError: number;
  mape: number;
  accuracy: number;
  totalComparisons: number;
}

const ForecastDetailPage: React.FC = () => {
  const router = useRouter();
  const params = useParams();
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [actualsData, setActualsData] = useState<ActualDataPoint[]>([]);
  const [loadingActuals, setLoadingActuals] = useState(false);
  const [comparisonModels, setComparisonModels] = useState<Record<string, ForecastDataPoint[]>>({});
  const [loadingComparison, setLoadingComparison] = useState<Record<string, boolean>>({});
  const [selectedBudget, setSelectedBudget] = useState<number | null>(null);
  const [budgets, setBudgets] = useState<BudgetSummary[]>([]);
  const [accuracyMetrics, setAccuracyMetrics] = useState<AccuracyMetrics | null>(null);

  const forecastId = params?.id ? parseInt(params.id as string) : null;

  const loadForecast = useCallback(async () => {
    if (!forecastId) return;

    try {
      setLoading(true);
      const response = await apiClient.getForecast(forecastId);
      // Handle both axios response format and direct response
      const responseData = response?.data || response;
      const forecastData = responseData as Forecast;

      // Parse JSON fields if they're strings
      if (typeof forecastData.forecast_data === 'string') {
        forecastData.forecast_data = JSON.parse(forecastData.forecast_data) as ForecastDataPoint[];
      }
      if (typeof forecastData.method_params === 'string') {
        forecastData.method_params = JSON.parse(forecastData.method_params) as MethodParams;
      }

      setForecast(forecastData);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load forecast';
      toast.error(message);
      router.push('/forecast/list');
    } finally {
      setLoading(false);
    }
  }, [forecastId, router]);

  useEffect(() => {
    loadForecast();
  }, [loadForecast]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (value: number) => {
    return `$${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getForecastTypeIcon = (type: string) => {
    switch (type) {
      case 'revenue': return <TrendingUp size={20} />;
      case 'expense': return <TrendingDown size={20} />;
      case 'profit': return <BarChart3 size={20} />;
      default: return <Activity size={20} />;
    }
  };

  const loadActuals = useCallback(async () => {
    if (!forecast) return;

    try {
      setLoadingActuals(true);
      const startDate = new Date(forecast.start_date).toISOString();
      const endDate = new Date(forecast.end_date).toISOString();

      const actuals: ActualDataPoint[] = [];

      if (forecast.forecast_type === 'revenue' || forecast.forecast_type === 'all') {
        try {
          // Use helper method instead of raw request
          const revenueResponse = await apiClient.getRevenues({
            start_date: startDate,
            end_date: endDate
          });

          if (revenueResponse.data) {
            // Helper method already ensures data is an array
            const revenueData = revenueResponse.data;
            actuals.push(
              ...revenueData.map((r: any): ActualDataPoint => ({
                date: (typeof r.date === 'string' ? r.date : typeof r.created_at === 'string' ? r.created_at : new Date().toISOString()),
                value: typeof r.amount === 'number' ? r.amount : 0,
                type: 'revenue'
              }))
            );
          }
        } catch (e) {
          console.error('Error loading revenue:', e);
        }
      }

      if (forecast.forecast_type === 'expense' || forecast.forecast_type === 'all') {
        try {
          // Use helper method instead of raw request
          const expenseResponse = await apiClient.getExpenses({
            start_date: startDate,
            end_date: endDate
          });

          if (expenseResponse.data) {
            // Helper method already ensures data is an array
            const expenseData = expenseResponse.data;
            actuals.push(
              ...expenseData.map((expense: any): ActualDataPoint => ({
                date: (typeof expense.date === 'string' ? expense.date : typeof expense.created_at === 'string' ? expense.created_at : new Date().toISOString()),
                value: typeof expense.amount === 'number' ? expense.amount : 0,
                type: 'expense'
              }))
            );
          }
        } catch (e) {
          console.error('Error loading expenses:', e);
        }
      }

      setActualsData(actuals);
      if (actuals.length === 0) {
        toast.info('No actual data found for the selected period');
      }
    } catch (error: unknown) {
      console.error('Failed to load actuals:', error);
      toast.error('Failed to load actual data');
    } finally {
      setLoadingActuals(false);
    }
  }, [forecast]);

  const loadBudgets = useCallback(async () => {
    try {
      const response = await apiClient.getBudgets({ limit: 100 });
      // Handle both axios response format and direct response
      const responseData = response?.data || response;
      if (responseData) {
        const parsedBudgets = Array.isArray(responseData)
          ? responseData
          : [];
        setBudgets(parsedBudgets as BudgetSummary[]);
      }
    } catch (error: unknown) {
      console.error('Failed to load budgets:', error);
    }
  }, []);

  const loadComparisonModel = async (method: string) => {
    if (!forecast) return;

    if (comparisonModels[method]) {
      // Toggle off if already loaded
      const next = { ...comparisonModels };
      delete next[method];
      setComparisonModels(next);
      return;
    }

    try {
      setLoadingComparison(prev => ({ ...prev, [method]: true }));
      const response = await apiClient.previewForecast({
        forecast_type: forecast.forecast_type,
        method: method,
        start_date: forecast.start_date,
        end_date: forecast.end_date,
        historical_start_date: forecast.historical_start_date || undefined,
        historical_end_date: forecast.historical_end_date || undefined,
        window: typeof forecast.method_params?.window === 'number' ? forecast.method_params.window : undefined,
        growth_rate: typeof forecast.method_params?.growth_rate === 'number' ? forecast.method_params.growth_rate : undefined
      });

      const data = response?.data || response;
      if (Array.isArray(data)) {
        setComparisonModels(prev => ({ ...prev, [method]: data }));
      } else {
        toast.error(`Failed to load ${method} forecast preview`);
      }
    } catch (error) {
      console.error(`Error loading comparison model ${method}:`, error);
      toast.error(`Model ${method} may not be trained yet.`);
    } finally {
      setLoadingComparison(prev => ({ ...prev, [method]: false }));
    }
  };

  const calculateAccuracy = useCallback((): AccuracyMetrics | null => {
    if (!forecast || !actualsData.length) return null;

    const forecastData = forecast.forecast_data || [];
    const comparisons = forecastData.map((f): AccuracyComparison | null => {
      if (!f.date) return null;
      const actual = actualsData.find((a) => {
        const forecastDate = new Date(f.date as string).toISOString().split('T')[0];
        const actualDate = new Date(a.date).toISOString().split('T')[0];
        return forecastDate === actualDate;
      });

      if (!actual) return null;

      const forecastValue = f.forecasted_value ?? 0;
      const actualValue = actual.value ?? 0;
      const error = Math.abs(forecastValue - actualValue);

      let percentError: number;
      if (forecastValue === 0 && actualValue === 0) {
        percentError = 0;
      } else if (forecastValue === 0 && actualValue !== 0) {
        percentError = (error / Math.abs(actualValue)) * 100;
      } else {
        percentError = (error / Math.abs(forecastValue)) * 100;
      }

      return {
        date: f.date,
        forecast: forecastValue,
        actual: actualValue,
        error,
        percentError
      };
    }).filter((comp): comp is AccuracyComparison => Boolean(comp));

    if (comparisons.length === 0) return null;

    const avgError = comparisons.reduce((sum, c) => sum + c.error, 0) / comparisons.length;
    const avgPercentError = comparisons.reduce((sum, c) => sum + c.percentError, 0) / comparisons.length;
    const mape = avgPercentError;
    const accuracy = Math.max(0, 100 - mape);

    return {
      comparisons,
      avgError,
      avgPercentError,
      mape,
      accuracy,
      totalComparisons: comparisons.length
    };
  }, [actualsData, forecast]);

  const exportToPDF = () => {
    if (!forecast) return;

    const doc = new jsPDF();
    const forecastData = forecast.forecast_data ?? [];

    doc.setFontSize(18);
    doc.text(forecast.name, 14, 20);

    doc.setFontSize(12);
    let yPos = 35;
    doc.text(`Type: ${forecast.forecast_type}`, 14, yPos);
    yPos += 7;
    doc.text(`Method: ${forecast.method}`, 14, yPos);
    yPos += 7;
    doc.text(`Period: ${formatDate(forecast.start_date)} - ${formatDate(forecast.end_date)}`, 14, yPos);
    yPos += 15;

    // Table headers
    doc.setFontSize(10);
    doc.text('Period', 14, yPos);
    doc.text('Date', 60, yPos);
    doc.text('Forecasted Value', 120, yPos);
    yPos += 7;

    // Table data
    forecastData.forEach((item: ForecastDataPoint) => {
      if (yPos > 280) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(item.period || '-', 14, yPos);
      doc.text(item.date ? formatDate(item.date) : '-', 60, yPos);
      doc.text(formatCurrency(item.forecasted_value || 0), 120, yPos);
      yPos += 7;
    });

    doc.save(`${forecast.name.replace(/\s+/g, '_')}_forecast.pdf`);
    toast.success('PDF exported successfully');
  };

  const exportToExcel = () => {
    if (!forecast) return;

    const forecastData = forecast.forecast_data ?? [];
    const worksheet = XLSX.utils.json_to_sheet(
      forecastData.map((item: ForecastDataPoint) => ({
        Period: item.period || '-',
        Date: item.date ? formatDate(item.date) : '-',
        'Forecasted Value': item.forecasted_value || 0
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Forecast Data');

    XLSX.writeFile(workbook, `${forecast.name.replace(/\s+/g, '_')}_forecast.xlsx`);
    toast.success('Excel file exported successfully');
  };

  // Load actuals when entering comparison tab
  useEffect(() => {
    if (forecast && activeTab === 'comparison') {
      loadActuals();
    }
  }, [activeTab, forecast, loadActuals]);

  // Load budgets when entering budget tab
  useEffect(() => {
    if (activeTab === 'budget') {
      loadBudgets();
    }
  }, [activeTab, loadBudgets]);

  // Calculate accuracy when entering accuracy tab or when data changes
  useEffect(() => {
    if (forecast && activeTab === 'accuracy') {
      const metrics = calculateAccuracy();
      setAccuracyMetrics(metrics);
    }
  }, [activeTab, forecast, calculateAccuracy]);

  const forecastDataArray = useMemo<ForecastDataPoint[]>(() => {
    if (forecast && Array.isArray(forecast.forecast_data)) {
      return forecast.forecast_data;
    }
    return [];
  }, [forecast]);

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <LoadingContainer>
              <Spinner />
              <p>Loading forecast...</p>
            </LoadingContainer>
          </ContentContainer>
        </PageContainer>
      </Layout>
    );
  }

  if (!forecast) {
    return (
      <Layout>
        <PageContainer>
          <ContentContainer>
            <div style={{ textAlign: 'center', padding: theme.spacing.xl }}>
              <AlertCircle size={48} style={{ margin: '0 auto 16px', color: TEXT_COLOR_MUTED }} />
              <p>Forecast not found</p>
              <Button onClick={() => router.push('/forecast/list')} style={{ marginTop: theme.spacing.md }}>
                Back to Forecasts
              </Button>
            </div>
          </ContentContainer>
        </PageContainer>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageContainer>
        <ContentContainer>
          <BackLink href="/forecast/list">
            <ArrowLeft size={16} />
            Back to Forecasts
          </BackLink>

          <HeaderContainer>
            <HeaderContent>
              <div style={{ flex: 1 }}>
                <h1>
                  <LineChart size={36} />
                  {forecast.name}
                </h1>
                <div style={{ marginTop: theme.spacing.sm, display: 'flex', gap: theme.spacing.md, alignItems: 'center', flexWrap: 'wrap' }}>
                  <MethodBadge $method={forecast.method}>
                    {forecast.method.replace(/_/g, ' ')}
                    {(forecast.method === 'arima' || forecast.method === 'prophet' ||
                      forecast.method === 'xgboost' || forecast.method === 'lstm' ||
                      forecast.method === 'linear_regression') && ' (AI)'}
                  </MethodBadge>
                  {forecast.description && (
                    <p style={{ margin: 0, opacity: 0.9, fontSize: theme.typography.fontSizes.md }}>
                      {forecast.description}
                    </p>
                  )}
                </div>
              </div>
              <ActionButtonsContainer>
                <Button
                  variant="outline"
                  onClick={() => router.push(`/forecast/${forecastId}/edit`)}
                  style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
                >
                  <Edit size={16} />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={exportToPDF}
                  style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
                >
                  <Download size={16} />
                  PDF
                </Button>
                <Button
                  variant="outline"
                  onClick={exportToExcel}
                  style={{ background: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
                >
                  <FileSpreadsheet size={16} />
                  Excel
                </Button>
              </ActionButtonsContainer>
            </HeaderContent>
          </HeaderContainer>

          <TabContainer>
            <Tab $active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
              Overview
            </Tab>
            <Tab $active={activeTab === 'charts'} onClick={() => setActiveTab('charts')}>
              Charts
            </Tab>
            <Tab $active={activeTab === 'comparison'} onClick={() => setActiveTab('comparison')}>
              Actual vs Forecast
            </Tab>
            <Tab $active={activeTab === 'budget'} onClick={() => setActiveTab('budget')}>
              Budget Integration
            </Tab>
            <Tab $active={activeTab === 'accuracy'} onClick={() => setActiveTab('accuracy')}>
              Accuracy Tracking
            </Tab>
            <Tab $active={activeTab === 'scenarios'} onClick={() => setActiveTab('scenarios')}>
              Scenarios
            </Tab>
          </TabContainer>

          {activeTab === 'overview' && (
            <>
              <InfoCard>
                <h3 style={{ marginTop: 0, marginBottom: 0, fontSize: theme.typography.fontSizes.lg, fontWeight: theme.typography.fontWeights.bold, color: TEXT_COLOR_DARK }}>Forecast Information</h3>
                <InfoRow>
                  <strong>Forecast Type:</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.xs }}>
                    {getForecastTypeIcon(forecast.forecast_type)}
                    <span style={{ textTransform: 'capitalize' }}>{forecast.forecast_type}</span>
                  </div>
                </InfoRow>
                <InfoRow>
                  <strong>Period Type:</strong>
                  <span style={{ textTransform: 'capitalize' }}>{forecast.period_type}</span>
                </InfoRow>
                <InfoRow>
                  <strong>Start Date:</strong>
                  <span>{formatDate(forecast.start_date)}</span>
                </InfoRow>
                <InfoRow>
                  <strong>End Date:</strong>
                  <span>{formatDate(forecast.end_date)}</span>
                </InfoRow>
                {forecast.historical_start_date && (
                  <InfoRow>
                    <strong>Historical Start:</strong>
                    <span>{formatDate(forecast.historical_start_date)}</span>
                  </InfoRow>
                )}
                {forecast.historical_end_date && (
                  <InfoRow>
                    <strong>Historical End:</strong>
                    <span>{formatDate(forecast.historical_end_date)}</span>
                  </InfoRow>
                )}
                <InfoRow>
                  <strong>Method Parameters:</strong>
                  <span>
                    {forecast.method_params && typeof forecast.method_params === 'object'
                      ? JSON.stringify(forecast.method_params, null, 2)
                      : 'None'
                    }
                  </span>
                </InfoRow>
                <InfoRow>
                  <strong>Created:</strong>
                  <span>{formatDate(forecast.created_at)}</span>
                </InfoRow>
              </InfoCard>

              <ForecastDataCard>
                <h3 style={{ marginTop: 0, marginBottom: 0, fontSize: theme.typography.fontSizes.lg, fontWeight: theme.typography.fontWeights.bold, color: TEXT_COLOR_DARK }}>Forecast Data</h3>
                {forecastDataArray.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: TEXT_COLOR_MUTED }}>
                    <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                    <p>No forecast data available.</p>
                  </div>
                ) : (
                  <>
                    <ForecastTable>
                      <thead>
                        <tr>
                          <th>Period</th>
                          <th>Date</th>
                          <th>Forecasted Value</th>
                          {forecastDataArray[0]?.method && <th>Method</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {forecastDataArray.map((item: ForecastDataPoint, index: number) => (
                          <tr key={index}>
                            <td>{item.period || '-'}</td>
                            <td>{item.date ? formatDate(item.date) : '-'}</td>
                            <td style={{ fontWeight: theme.typography.fontWeights.bold }}>
                              {formatCurrency(item.forecasted_value || 0)}
                            </td>
                            {item.method && (
                              <td>
                                <span style={{ textTransform: 'capitalize' }}>
                                  {item.method.replace('_', ' ')}
                                </span>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </ForecastTable>

                    <div style={{ marginTop: theme.spacing.lg, padding: theme.spacing.md, background: PRIMARY_LIGHT, borderRadius: theme.borderRadius.sm }}>
                      <strong>Total Forecast: </strong>
                      {formatCurrency(forecastDataArray.reduce((sum: number, item: ForecastDataPoint) => sum + (item.forecasted_value || 0), 0))}
                      <br />
                      <strong>Average per Period: </strong>
                      {formatCurrency(forecastDataArray.length > 0
                        ? forecastDataArray.reduce((sum: number, item: ForecastDataPoint) => sum + (item.forecasted_value || 0), 0) / forecastDataArray.length
                        : 0
                      )}
                      <br />
                      <strong>Number of Periods: </strong>
                      {forecastDataArray.length}
                    </div>
                  </>
                )}
              </ForecastDataCard>
            </>
          )}

          {activeTab === 'charts' && (
            <ForecastDataCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
                <h3 style={{ margin: 0, fontSize: theme.typography.fontSizes.lg, fontWeight: theme.typography.fontWeights.bold, color: TEXT_COLOR_DARK }}>Forecast Visualization</h3>
                <div style={{ display: 'flex', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: TEXT_COLOR_MUTED, alignSelf: 'center', marginRight: '8px' }}>Compare Models:</span>
                  {['moving_average', 'linear_growth', 'trend', 'arima', 'prophet', 'xgboost', 'lstm', 'linear_regression'].filter(m => m !== forecast?.method).map(method => (
                    <Button
                      key={method}
                      variant={comparisonModels[method] ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => loadComparisonModel(method)}
                      disabled={loadingComparison[method]}
                      style={{ fontSize: '10px', height: '24px', textTransform: 'capitalize' }}
                    >
                      {loadingComparison[method] ? '...' : method.replace('_', ' ')}
                    </Button>
                  ))}
                </div>
              </div>

              {forecastDataArray.length > 0 ? (
                <>
                  <ChartContainer>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={forecastDataArray.map((item: ForecastDataPoint, idx: number) => {
                        const base = {
                          period: item.period || '-',
                          date: item.date ? new Date(item.date).toLocaleDateString() : '-',
                          [forecast?.method || 'value']: item.forecasted_value || 0
                        };

                        // Add comparison values
                        Object.keys(comparisonModels).forEach(method => {
                          const compData = comparisonModels[method];
                          if (compData && compData[idx]) {
                            base[method] = compData[idx].forecasted_value || 0;
                          }
                        });

                        return base;
                      })}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey={forecast?.method || 'value'}
                          stroke={PRIMARY_COLOR}
                          strokeWidth={3}
                          name={`${forecast?.method?.replace('_', ' ') || 'Primary'} (Actual)`}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                        {Object.keys(comparisonModels).map((method, index) => (
                          <Line
                            key={method}
                            type="monotone"
                            dataKey={method}
                            stroke={['#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'][index % 6]}
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name={`${method.replace('_', ' ')} (Preview)`}
                            dot={false}
                          />
                        ))}
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </ChartContainer>

                  {/* Summary remains the same or only for primary */}
                  <div style={{ marginTop: theme.spacing.lg, padding: theme.spacing.md, background: PRIMARY_LIGHT, borderRadius: theme.borderRadius.sm }}>
                    <strong>Primary Method: </strong> <span style={{ textTransform: 'capitalize' }}>{(forecast?.method || '').replace('_', ' ')}</span>
                    <br />
                    <strong>Total Forecast: </strong>
                    {formatCurrency(forecastDataArray.reduce((sum: number, item: ForecastDataPoint) => sum + (item.forecasted_value || 0), 0))}
                    <br />
                    <strong>Average per Period: </strong>
                    {formatCurrency(forecastDataArray.length > 0
                      ? forecastDataArray.reduce((sum: number, item: ForecastDataPoint) => sum + (item.forecasted_value || 0), 0) / forecastDataArray.length
                      : 0
                    )}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: TEXT_COLOR_MUTED }}>
                  <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p>No forecast data available for visualization.</p>
                </div>
              )}
            </ForecastDataCard>
          )}

          {activeTab === 'comparison' && (
            <ComparisonCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing.lg }}>
                <h3 style={{ margin: 0, fontSize: theme.typography.fontSizes.lg, fontWeight: theme.typography.fontWeights.bold, color: TEXT_COLOR_DARK }}>Actual vs Forecast Comparison</h3>
                <Button variant="outline" onClick={loadActuals} disabled={loadingActuals}>
                  <RefreshCw size={16} />
                  {loadingActuals ? 'Loading...' : 'Refresh Actuals'}
                </Button>
              </div>
              {loadingActuals ? (
                <div style={{ textAlign: 'center', padding: theme.spacing.xl }}>
                  <Spinner style={{ margin: '0 auto' }} />
                  <p>Loading actual data...</p>
                </div>
              ) : actualsData.length === 0 ? (
                <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: TEXT_COLOR_MUTED }}>
                  <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p>No actual data available for comparison. Click &quot;Refresh Actuals&quot; to load data.</p>
                </div>
              ) : (
                <>
                  <ChartContainer>
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart data={forecastDataArray.map((item: ForecastDataPoint) => {
                        if (!item.date) return null;
                        const actual = actualsData.find((a: ActualDataPoint) => {
                          const forecastDate = new Date(item.date as string).toISOString().split('T')[0];
                          const actualDate = new Date(a.date).toISOString().split('T')[0];
                          return forecastDate === actualDate;
                        });
                        if (!actual) return null;
                        return {
                          period: item.period || '-',
                          date: item.date ? new Date(item.date).toLocaleDateString() : '-',
                          forecast: item.forecasted_value || 0,
                          actual: actual.value
                        };
                      }).filter((d): d is { period: string; date: string | '-'; forecast: number; actual: number } => d !== null)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="period" />
                        <YAxis />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="forecast" stroke={PRIMARY_COLOR} strokeWidth={2} name="Forecast" />
                        <Line type="monotone" dataKey="actual" stroke="#ef4444" strokeWidth={2} name="Actual" />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                  <ForecastTable>
                    <thead>
                      <tr>
                        <th>Period</th>
                        <th>Date</th>
                        <th>Forecasted</th>
                        <th>Actual</th>
                        <th>Variance</th>
                        <th>% Variance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecastDataArray.map((item: ForecastDataPoint, index: number) => {
                        if (!item.date) return null;
                        const actual = actualsData.find((a: ActualDataPoint) => {
                          const forecastDate = new Date(item.date as string).toISOString().split('T')[0];
                          const actualDate = new Date(a.date).toISOString().split('T')[0];
                          return forecastDate === actualDate;
                        });
                        const forecastValue = item.forecasted_value || 0;
                        const actualValue = actual?.value ?? null;
                        const variance = actualValue !== null ? forecastValue - actualValue : null;
                        const percentVariance = actualValue !== null && forecastValue > 0 && variance !== null ? ((variance / forecastValue) * 100) : null;

                        return actualValue !== null ? (
                          <tr key={index}>
                            <td>{item.period || '-'}</td>
                            <td>{item.date ? formatDate(item.date) : '-'}</td>
                            <td>{formatCurrency(forecastValue)}</td>
                            <td>{formatCurrency(actualValue)}</td>
                            <td style={{ color: variance !== null && variance < 0 ? '#ef4444' : '#10b981' }}>
                              {variance !== null ? formatCurrency(variance) : '-'}
                            </td>
                            <td style={{ color: percentVariance !== null && percentVariance < 0 ? '#ef4444' : '#10b981' }}>
                              {percentVariance !== null ? `${percentVariance.toFixed(2)}%` : '-'}
                            </td>
                          </tr>
                        ) : null;
                      }).filter(Boolean)}
                    </tbody>
                  </ForecastTable>
                </>
              )}
            </ComparisonCard>
          )}

          {activeTab === 'budget' && (
            <ComparisonCard>
              <h3 style={{ marginTop: 0, marginBottom: theme.spacing.lg, fontSize: theme.typography.fontSizes.lg, fontWeight: theme.typography.fontWeights.bold, color: TEXT_COLOR_DARK }}>Budget Integration</h3>
              <FormGroup>
                <label>Select Budget to Compare</label>
                <StyledSelect
                  value={selectedBudget || ''}
                  onChange={(e) => setSelectedBudget(e.target.value ? parseInt(e.target.value) : null)}
                >
                  <option value="">-- Select a Budget --</option>
                  {budgets.map((budget: BudgetSummary) => (
                    <option key={budget.id} value={budget.id}>
                      {budget.name} ({formatDate(budget.start_date)} - {formatDate(budget.end_date)})
                    </option>
                  ))}
                </StyledSelect>
              </FormGroup>
              {selectedBudget && (
                <div style={{ marginTop: theme.spacing.lg, padding: theme.spacing.md, background: PRIMARY_LIGHT, borderRadius: theme.borderRadius.sm }}>
                  <p style={{ margin: 0, color: TEXT_COLOR_MUTED }}>
                    Budget integration allows you to compare forecasted values with budgeted amounts.
                    Select a budget above to see the comparison.
                  </p>
                </div>
              )}
            </ComparisonCard>
          )}

          {activeTab === 'accuracy' && (
            <ComparisonCard>
              <h3 style={{ marginTop: 0, marginBottom: theme.spacing.lg, fontSize: theme.typography.fontSizes.lg, fontWeight: theme.typography.fontWeights.bold, color: TEXT_COLOR_DARK }}>Forecast Accuracy Metrics</h3>
              {accuracyMetrics ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: theme.spacing.md, marginBottom: theme.spacing.lg }}>
                    <MetricCard>
                      <h4>Accuracy Score</h4>
                      <p>{accuracyMetrics.accuracy.toFixed(2)}%</p>
                    </MetricCard>
                    <MetricCard>
                      <h4>Mean Absolute % Error</h4>
                      <p>{accuracyMetrics.mape.toFixed(2)}%</p>
                    </MetricCard>
                    <MetricCard>
                      <h4>Average Error</h4>
                      <p>{formatCurrency(accuracyMetrics.avgError)}</p>
                    </MetricCard>
                    <MetricCard>
                      <h4>Data Points</h4>
                      <p>{accuracyMetrics.totalComparisons}</p>
                    </MetricCard>
                  </div>
                  <ForecastTable>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Forecast</th>
                        <th>Actual</th>
                        <th>Error</th>
                        <th>% Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accuracyMetrics.comparisons.map((comp: AccuracyComparison, index: number) => (
                        <tr key={index}>
                          <td>{formatDate(comp.date)}</td>
                          <td>{formatCurrency(comp.forecast)}</td>
                          <td>{formatCurrency(comp.actual)}</td>
                          <td>{formatCurrency(comp.error)}</td>
                          <td>{comp.percentError.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </ForecastTable>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: TEXT_COLOR_MUTED }}>
                  <AlertCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                  <p>No accuracy data available. Load actual data in the &quot;Actual vs Forecast&quot; tab first.</p>
                </div>
              )}
            </ComparisonCard>
          )}

          {activeTab === 'scenarios' && (
            <ComparisonCard>
              <h3 style={{ marginTop: 0, marginBottom: theme.spacing.lg, fontSize: theme.typography.fontSizes.lg, fontWeight: theme.typography.fontWeights.bold, color: TEXT_COLOR_DARK }}>Forecast Scenarios</h3>
              <div style={{ textAlign: 'center', padding: theme.spacing.xl, color: TEXT_COLOR_MUTED }}>
                <GitBranch size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
                <p>Create different forecast scenarios to compare &quot;what-if&quot; situations.</p>
                <Button
                  onClick={() => router.push(`/forecast/create?scenario=${forecastId}`)}
                  style={{ marginTop: theme.spacing.md }}
                >
                  <GitBranch size={16} />
                  Create Scenario
                </Button>
              </div>
            </ComparisonCard>
          )}
        </ContentContainer>
      </PageContainer>
    </Layout>
  );
};

export default ForecastDetailPage;

