// lib/api.ts
'use client';

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

const DEFAULT_BASE_URL = 'http://localhost:8000/api/v1';
const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_BASE_URL).replace(/\/$/, '');

interface ApiResponse<T = unknown> {
  success?: boolean;
  data: T;
  message?: string;
  error?: string;
}

type Filters = Record<string, string | number | boolean | undefined>;
type RevenueRecord = {
  id?: number | string;
  amount?: number;
  date?: string;
  created_at?: string;
  [key: string]: unknown;
};
type ExpenseRecord = RevenueRecord;
type TransactionRecord = (RevenueRecord | ExpenseRecord) & {
  transaction_type: 'revenue' | 'expense';
};

interface AuthTokens {
  access_token: string;
  token_type: string;
}

interface User {
  id: number;
  email: string;
  username?: string;
  full_name: string;
  role: string;
  created_at?: string;
  manager_id?: number;
  profile_image_url?: string;
  phone?: string | null;
  department?: string;
  is_active?: boolean;
}

type LoginResponse = AuthTokens & { user: User };
export type ApiUser = User;
export interface ApiRole {
  id: number;
  name: string;
  description?: string;
  permissions?: string[];
  user_count?: number;
  permission_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  user_full_name?: string;
  user_email?: string;
  user?: { // Backend returns nested user object based on pre-fetched data
    id: number;
    username?: string;
    full_name?: string;
    email?: string;
  };
  action: string;
  resource_type: string;
  resource_id?: number;
  old_values?: string;
  new_values?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface InventoryItem {
  id: number;
  item_name: string;
  buying_price?: number;
  expense_amount?: number;
  selling_price: number;
  quantity: number;
  description?: string;
  category?: string;
  sku?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  created_by_id?: number;
  last_modified_by_id?: number;
}

export interface Warehouse {
  id: number;
  name: string;
  address?: string;
  is_active: boolean;
  is_main: boolean;
  total_items?: number;
  total_value?: number;
  utilization?: number;
}

export interface StockTransfer {
  id: number;
  item_id: number;
  item_name?: string;
  from_warehouse_id: number;
  from_warehouse_name?: string;
  to_warehouse_id: number;
  to_warehouse_name?: string;
  quantity: number;
  status: string;
  created_at: string;
}

export interface WarehouseCreate {
  name: string;
  address?: string;
  is_active?: boolean;
  is_main?: boolean;
}

export interface StockTransferCreate {
  item_id: number;
  from_warehouse_id: number;
  to_warehouse_id: number;
  quantity: number;
}

export interface WarehouseStock {
  warehouse_id: number;
  item_id: number;
  quantity: number;
  item: InventoryItem;
}

export interface Feedback {
  id: number;
  user_id?: number;
  rating: number;
  message: string;
  category: string;
  status: string;
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
  reviewed_at?: string;
  reviewed_by_id?: number;
  user?: {
    id: number;
    username?: string;
    full_name?: string;
    email?: string;
  };
  reviewed_by?: {
    id: number;
    username?: string;
    full_name?: string;
    email?: string;
  };
}

export interface FeedbackCreate {
  rating: number;
  message: string;
  category?: string;
}

export interface FeedbackUpdate {
  status?: string;
  admin_notes?: string;
}

export interface FeedbackStats {
  total_feedback: number;
  average_rating: number;
  rating_distribution: Record<string, number>;
  status_breakdown: Record<string, number>;
  recent_feedback_count: number;
}


class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 300000, // 5 minutes timeout for ML training requests (can take longer)
      headers: { 'Content-Type': 'application/json' },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(
      (config) => {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem('access_token');
          if (token) {
            config.headers = config.headers ?? {};
            config.headers.Authorization = `Bearer ${token}`;
          }
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        const requestUrl = originalRequest?.url || '';

        // Handle 401 Unauthorized - but DON'T redirect on login endpoint
        // The login page handles its own error states and redirects
        if (error.response?.status === 401 && !originalRequest?._retry) {
          originalRequest._retry = true;
          if (typeof window !== 'undefined') {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');

            // Only redirect if NOT on the login endpoint
            // Login endpoint errors should be handled by the login page component
            const isLoginEndpoint = requestUrl.includes('/auth/login-json') ||
              requestUrl.includes('/auth/login');

            if (!isLoginEndpoint && !window.location.pathname.includes('/auth/login')) {
              // Redirect to home page for other 401 errors (not login-related)
              window.location.href = '/';
            }
            // For login endpoint 401s, let the error propagate to the component
          }
        }

        // Handle 403 Forbidden - user doesn't have permission
        if (error.response?.status === 403) {
          const url = error.config?.url || '';
          const errorDetail = error.response?.data?.detail || 'Insufficient permissions';

          // Suppress warnings for expected 403s on role-restricted endpoints
          // These are handled gracefully by the calling code
          const suppressWarnings = url.includes('/inventory/summary') ||
            url.includes('/sales/summary') ||
            url.includes('/sales/summary/overview') ||
            url.includes('/sales/journal-entries') ||
            url.includes('/backup');

          // For user endpoints, provide more helpful error messages
          if (url.includes('/users/') && !url.includes('/users/me')) {
            // Don't suppress warnings for user endpoints - these are important
            if (typeof window !== 'undefined') {
              console.warn('Access forbidden to user resource:', errorDetail);
            }
            // Enhance error with more context
            error.response.data = {
              ...error.response.data,
              detail: errorDetail,
              message: `You don't have permission to access this user. ${errorDetail}`,
            };
          } else if (!suppressWarnings && typeof window !== 'undefined') {
            console.warn('Access forbidden:', errorDetail);
          }
        }

        // Handle 404 Not Found - suppress console warnings for non-critical endpoints
        if (error.response?.status === 404) {
          const url = error.config?.url || '';
          // Only log 404s in development mode to reduce console noise
          if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
            console.warn('Resource not found:', url);
          }
        }

        // Handle network errors - suppress repetitive errors for polling endpoints
        if (!error.response) {
          const url = error.config?.url || '';
          // Suppress errors for polling endpoints to reduce console noise
          // These are expected when backend is down
          const isPollingEndpoint = url.includes('/notifications/unread/count') ||
            url.includes('/dashboard/recent-activity') ||
            url.includes('/health');

          if (!isPollingEndpoint) {
            // Only log non-polling endpoint errors
            const errorMessage = error.message || 'Network error: Unable to connect to server';

            if (process.env.NODE_ENV === 'development') {
              console.error('Network error:', errorMessage);

              if (error.code === 'ECONNREFUSED' || error.message?.includes('Network Error')) {
                console.error('Backend server may not be running. Please ensure the backend is running on http://localhost:8000');
              } else if (error.code === 'ERR_NETWORK') {
                console.error('Network request failed. Check your internet connection and backend server status.');
              }
            }
          }
          // Polling endpoint errors are silently handled - they're expected when backend is down
        }

        return Promise.reject(error);
      },
    );
  }

  private normalizeResponse<T>(payload: unknown): ApiResponse<T> {
    // Handle different response formats from the backend
    if (!payload) {
      return { data: null as unknown as T };
    }

    // If payload is already in ApiResponse format
    if (typeof payload === 'object' && payload !== null) {
      if ('data' in payload) {
        return payload as ApiResponse<T>;
      }
      // If payload is the data itself (direct response)
      return { data: payload as T };
    }

    // Fallback: wrap primitive values
    return { data: payload as T };
  }

  /**
   * Extract error message from various error formats
   */
  private extractErrorMessage(error: unknown): string {
    if (error && typeof error === 'object') {
      // Axios error format
      if ('response' in error) {
        const axiosError = error as { response?: { data?: { detail?: string; message?: string; error?: string } } };
        return axiosError.response?.data?.detail ||
          axiosError.response?.data?.message ||
          axiosError.response?.data?.error ||
          'An error occurred';
      }
      // Standard Error object
      if ('message' in error) {
        return (error as { message: string }).message;
      }
    }
    // Fallback
    return error instanceof Error ? error.message : 'An unknown error occurred';
  }

  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get<T>(url, config);
    return this.normalizeResponse<T>(response.data);
  }

  public async post<T, B = unknown>(url: string, data?: B, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post<T>(url, data, config);
    return this.normalizeResponse<T>(response.data);
  }

  public async put<T, B = unknown>(url: string, data?: B, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put<T>(url, data, config);
    return this.normalizeResponse<T>(response.data);
  }

  public async delete<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete<T>(url, { ...config, data });
    return this.normalizeResponse<T>(response.data);
  }

  // Auth endpoints
  async login(identifier: string, password: string): Promise<ApiResponse<LoginResponse>> {
    const response = await this.client.post<LoginResponse>('/auth/login-json', {
      username: identifier,
      password,
    });
    const normalized = this.normalizeResponse<LoginResponse>(response.data);

    // Only set token if we have a valid access token and user data
    if (normalized.data?.access_token && normalized.data?.user) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', normalized.data.access_token);
      }
    } else {
      // Clear any existing tokens if response is invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
      }
      throw new Error('Invalid login response: missing access token or user data');
    }

    return normalized;
  }

  async register(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.post<User>('/auth/register', userData);
  }

  async logout(): Promise<void> {
    try {
      await this.post('/auth/logout');
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
      }
    }
  }

  async refreshToken(): Promise<ApiResponse<{ access_token: string }>> {
    if (typeof window === 'undefined') throw new Error('Token refresh is client only');
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No token to refresh');
    const response = await this.client.post('/auth/refresh', { token });
    const normalized = this.normalizeResponse<{ access_token: string }>(response.data);
    localStorage.setItem('access_token', normalized.data.access_token);
    return normalized;
  }

  async generateOTP(): Promise<ApiResponse<{ otp_code: string; message: string }>> {
    return this.post('/auth/generate-otp');
  }

  async verifyOTP(otp_code: string): Promise<ApiResponse<{ message: string }>> {
    return this.post('/auth/verify-otp', { otp_code });
  }

  async requestOTP(email: string): Promise<ApiResponse<{ message: string }>> {
    return this.post('/auth/request-otp', { email });
  }

  async resetPassword(email: string, code: string, newPassword: string, totp_code?: string): Promise<ApiResponse<{ message: string }>> {
    return this.post('/auth/reset-password', { email, code, newPassword, totp_code });
  }

  // User endpoints
  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.get('/users/me');
  }

  async updateCurrentUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.put('/users/me', userData);
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return this.post('/users/me/change-password', { current_password: currentPassword, new_password: newPassword });
  }

  async uploadProfileImage(file: File): Promise<ApiResponse<User>> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<User>('/users/me/profile-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const normalized = this.normalizeResponse<User>(response.data);

    // Update the local user object if needed (optional)
    return normalized;
  }

  async removeProfileImage(): Promise<ApiResponse<User>> {
    const response = await this.client.delete<User>('/users/me/profile-image');
    return this.normalizeResponse<User>(response.data);
  }

  async adminResetPassword(usernameOrEmail: string, newPassword: string): Promise<ApiResponse<{ message: string }>> {
    return this.post('/users/admin-reset-password', { username_or_email: usernameOrEmail, new_password: newPassword });
  }

  async getUsers(): Promise<ApiResponse<User[]>> {
    try {
      const response = await this.get<User[]>('/users/');
      // Ensure we always return an array
      if (Array.isArray(response.data)) {
        return response;
      }
      return { ...response, data: [] };
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 403) {
        // Return empty array instead of throwing for 403 on list endpoint
        // This allows the UI to handle permission errors gracefully
        return { data: [] };
      }
      throw error;
    }
  }

  async getUser(userId: number): Promise<ApiResponse<User>> {
    try {
      return await this.get(`/users/${userId}`);
    } catch (error: unknown) {
      // Provide better error context for user fetch failures
      const axiosError = error as { response?: { status?: number; data?: { detail?: string } } };
      if (axiosError.response?.status === 403) {
        const detail = axiosError.response.data?.detail || 'Insufficient permissions';
        const enhancedError = new Error(`Cannot access user ${userId}: ${detail}`);
        (enhancedError as unknown as { response?: unknown }).response = axiosError.response;
        throw enhancedError;
      }
      if (axiosError.response?.status === 404) {
        const enhancedError = new Error(`User ${userId} not found`);
        (enhancedError as unknown as { response?: unknown }).response = axiosError.response;
        throw enhancedError;
      }
      throw error;
    }
  }

  async getSubordinates(userId: number): Promise<ApiResponse<User[]>> {
    return this.get(`/users/${userId}/subordinates`);
  }

  async createUser(userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      return await this.post('/users', userData);
    } catch (error: unknown) {
      // Provide better error context for user creation failures
      const axiosError = error as { response?: { status?: number; data?: { detail?: string } } };
      if (axiosError.response?.status === 403) {
        const detail = axiosError.response.data?.detail || 'Insufficient permissions';
        const enhancedError = new Error(`Cannot create user: ${detail}. You may not have permission to create users with this role.`);
        (enhancedError as unknown as { response?: unknown }).response = axiosError.response;
        throw enhancedError;
      }
      if (axiosError.response?.status === 400) {
        const detail = axiosError.response.data?.detail || 'Invalid user data';
        const enhancedError = new Error(`Failed to create user: ${detail}`);
        (enhancedError as unknown as { response?: unknown }).response = axiosError.response;
        throw enhancedError;
      }
      throw error;
    }
  }

  /**
   * Create a subordinate (accountant or employee)
   * Used by finance managers to create accountants/employees
   */
  async createSubordinate(userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.post('/users/subordinates', userData);
  }

  async updateUser(userId: number, userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.put(`/users/${userId}`, userData);
  }

  async deleteUser(userId: number, password: string): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/users/${userId}/delete`, { password });
  }

  // Warehouse endpoints
  async getWarehouses(): Promise<ApiResponse<Warehouse[]>> {
    return this.get('/warehouses/');
  }

  async createWarehouse(warehouseData: WarehouseCreate): Promise<ApiResponse<Warehouse>> {
    return this.post('/warehouses/', warehouseData);
  }

  async updateWarehouse(id: number, warehouseData: Partial<WarehouseCreate>): Promise<ApiResponse<Warehouse>> {
    return this.put(`/warehouses/${id}`, warehouseData);
  }

  async deleteWarehouse(id: number): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/warehouses/${id}`);
  }

  async getWarehouseStocks(id: number): Promise<ApiResponse<WarehouseStock[]>> {
    return this.get(`/warehouses/${id}/stocks`);
  }

  async initiateTransfer(transferData: StockTransferCreate): Promise<ApiResponse<StockTransfer>> {
    return this.post('/warehouses/transfers', transferData);
  }

  async getTransfers(status?: string, warehouseId?: number): Promise<ApiResponse<StockTransfer[]>> {
    return this.get('/warehouses/transfers', { params: { status, warehouse_id: warehouseId } });
  }

  async shipTransfer(transferId: number): Promise<ApiResponse<StockTransfer>> {
    return this.post(`/warehouses/transfers/${transferId}/ship`);
  }

  async receiveTransfer(transferId: number): Promise<ApiResponse<StockTransfer>> {
    return this.post(`/warehouses/transfers/${transferId}/receive`);
  }

  async activateUser(userId: number, password: string): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/users/${userId}/activate`, { password });
  }

  async deactivateUser(userId: number, password: string): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/users/${userId}/deactivate`, { password });
  }

  // Permission endpoints
  async getUserPermissions(userId: number): Promise<ApiResponse<{ permissions: Record<string, unknown>[] }>> {
    return this.get(`/users/${userId}/permissions`);
  }

  async updateUserPermissions(userId: number, permissions: Record<string, unknown>[]): Promise<ApiResponse<{ message: string; permissions: Record<string, unknown>[] }>> {
    return this.put(`/users/${userId}/permissions`, { permissions });
  }

  // Financial endpoints
  async getRevenues(filters?: Filters): Promise<ApiResponse<RevenueRecord[]>> {
    // For reports, we need all data, so increase limit significantly
    const params = { ...filters, limit: 10000, skip: 0 };
    const response = await this.get('/revenue', { params });
    const data = Array.isArray(response.data) ? response.data : [];
    return { ...response, data };
  }

  async getRevenue(revenueId: number): Promise<ApiResponse<RevenueRecord>> {
    return this.get(`/revenue/${revenueId}`);
  }

  async createRevenue(revenueData: RevenueRecord): Promise<ApiResponse<RevenueRecord>> {
    return this.post('/revenue', revenueData);
  }

  async updateRevenue(revenueId: number, revenueData: RevenueRecord): Promise<ApiResponse<RevenueRecord>> {
    return this.put(`/revenue/${revenueId}`, revenueData);
  }

  async deleteRevenue(revenueId: number, password: string): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/revenue/${revenueId}/delete`, { password });
  }

  async getExpenses(filters?: Filters): Promise<ApiResponse<ExpenseRecord[]>> {
    // For reports, we need all data, so increase limit significantly
    const params = { ...filters, limit: 10000, skip: 0 };
    const response = await this.get('/expenses', { params });
    const data = Array.isArray(response.data) ? response.data : [];
    return { ...response, data };
  }

  async getExpense(expenseId: number): Promise<ApiResponse<ExpenseRecord>> {
    return this.get(`/expenses/${expenseId}`);
  }

  async createExpense(expenseData: ExpenseRecord): Promise<ApiResponse<ExpenseRecord>> {
    return this.post('/expenses', expenseData);
  }

  async updateExpense(expenseId: number, expenseData: ExpenseRecord): Promise<ApiResponse<ExpenseRecord>> {
    return this.put(`/expenses/${expenseId}`, expenseData);
  }

  async deleteExpense(expenseId: number, password: string): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/expenses/${expenseId}/delete`, { password });
  }

  // Transactions (combined revenues and expenses)
  async getTransactions(): Promise<ApiResponse<TransactionRecord[]>> {
    try {
      const [revenuesResponse, expensesResponse] = await Promise.all([
        this.getRevenues(),
        this.getExpenses(),
      ]);

      const revenues = (revenuesResponse.data || []).map((r: RevenueRecord): TransactionRecord => ({
        ...r,
        transaction_type: 'revenue',
        id: `revenue-${r.id}`,
      }));

      const expenses = (expensesResponse.data || []).map((e: ExpenseRecord): TransactionRecord => ({
        ...e,
        transaction_type: 'expense',
        id: `expense-${e.id}`,
        amount: -Math.abs(Number(e.amount ?? 0)), // Make expenses negative
      }));

      const transactions = [...revenues, ...expenses].sort((a, b) => {
        const dateA = new Date(a.date || a.created_at || 0).getTime();
        const dateB = new Date(b.date || b.created_at || 0).getTime();
        return dateB - dateA; // Most recent first
      });

      return { data: transactions };
    } catch (error) {
      // Error handled by caller
      throw error;
    }
  }

  // Dashboard
  async getDashboardOverview(): Promise<ApiResponse<unknown>> {
    return this.get('/dashboard/overview');
  }

  async getDashboardKPIs(period: 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<ApiResponse<unknown>> {
    return this.get('/dashboard/kpis', { params: { period } });
  }

  async getDashboardRecentActivity(limit = 10): Promise<ApiResponse<unknown[]>> {
    return this.get('/dashboard/recent-activity', { params: { limit } });
  }

  // Analytics
  async getAdvancedKPIs(params?: {
    period?: 'week' | 'month' | 'quarter' | 'year' | 'custom';
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<unknown>> {
    return this.get('/analytics/kpis', { params });
  }

  async getTrendAnalysis(params?: {
    metric?: 'revenue' | 'expenses' | 'profit';
    period?: 'week' | 'month' | 'quarter' | 'year' | 'custom';
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<unknown>> {
    return this.get('/analytics/trends', { params });
  }

  async getTimeSeriesData(params?: {
    interval?: 'day' | 'week' | 'month' | 'quarter' | 'year';
    period?: 'week' | 'month' | 'quarter' | 'year' | 'custom';
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<unknown>> {
    return this.get('/analytics/time-series', { params });
  }

  async getCategoryBreakdown(params?: {
    period?: 'week' | 'month' | 'quarter' | 'year' | 'custom';
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<unknown>> {
    return this.get('/analytics/category-breakdown', { params });
  }

  async getAnalyticsOverview(params?: {
    period?: 'week' | 'month' | 'quarter' | 'year' | 'custom';
    start_date?: string;
    end_date?: string;
  }): Promise<ApiResponse<Record<string, unknown>>> {
    return this.get('/analytics/overview', { params });
  }

  // Reports
  async getReports(filters?: Filters): Promise<ApiResponse<Record<string, unknown>[]>> {
    return this.get('/reports', { params: filters });
  }

  async getReport(reportId: number): Promise<ApiResponse<Record<string, unknown>>> {
    return this.get(`/reports/${reportId}`);
  }

  async createReport(reportData: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return this.post('/reports', reportData);
  }

  async updateReport(reportId: number, reportData: Record<string, unknown>): Promise<ApiResponse<Record<string, unknown>>> {
    return this.put(`/reports/${reportId}`, reportData);
  }

  async deleteReport(reportId: number): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/reports/${reportId}`);
  }

  async downloadReport(reportId: number): Promise<ApiResponse<{ download_url: string; file_size: number; filename: string }>> {
    return this.post(`/reports/${reportId}/download`);
  }

  async regenerateReport(reportId: number): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/reports/${reportId}/regenerate`);
  }

  async getAvailableReportTypes(): Promise<ApiResponse<{ report_types: Array<{ type: string; name: string; description: string }> }>> {
    return this.get('/reports/types/available');
  }

  // Financial Reports - Direct data fetching
  async getIncomeStatement(startDate?: string, endDate?: string): Promise<ApiResponse<Record<string, unknown>>> {
    const params: Filters = {};
    // Convert date strings to ISO datetime format (YYYY-MM-DD -> YYYY-MM-DDTHH:mm:ss)
    if (startDate) {
      const start = new Date(startDate + 'T00:00:00');
      params.start_date = start.toISOString();
    }
    if (endDate) {
      // Set end date to end of day
      const end = new Date(endDate + 'T23:59:59');
      params.end_date = end.toISOString();
    }

    // Fetch revenue and expense data to calculate income statement
    // Always fetch all data first, then filter client-side if needed
    const [revenuesRes, expensesRes] = await Promise.all([
      this.getRevenues(),
      this.getExpenses(),
    ]);

    let revenues = revenuesRes.data || [];
    let expenses = expensesRes.data || [];

    // Filter by date range if provided (client-side filtering)
    if (startDate && endDate) {
      const start = new Date(startDate + 'T00:00:00').getTime();
      const end = new Date(endDate + 'T23:59:59').getTime();

      revenues = revenues.filter((r: RevenueRecord) => {
        const dateStr = r.date || r.created_at;
        if (!dateStr) return true; // Include entries without dates
        try {
          const entryDate = new Date(dateStr).getTime();
          return entryDate >= start && entryDate <= end;
        } catch {
          return true; // Include if date parsing fails
        }
      });

      expenses = expenses.filter((e: ExpenseRecord) => {
        const dateStr = e.date || e.created_at;
        if (!dateStr) return true; // Include entries without dates
        try {
          const entryDate = new Date(dateStr).getTime();
          return entryDate >= start && entryDate <= end;
        } catch {
          return true; // Include if date parsing fails
        }
      });
    }

    // Filter to only include APPROVED revenue and expense entries
    // This ensures revenue and net profit are only calculated from approved entries
    const approvedRevenues = revenues.filter((r: RevenueRecord) =>
      r.is_approved === true || r.is_approved === 'true' || r.approved === true
    );
    const approvedExpenses = expenses.filter((e: ExpenseRecord) =>
      e.is_approved === true || e.is_approved === 'true' || e.approved === true
    );

    // Calculate totals - ONLY from approved entries
    const totalRevenue = approvedRevenues.reduce((sum: number, r: RevenueRecord) => sum + Number(r.amount || 0), 0);
    const totalExpenses = approvedExpenses.reduce((sum: number, e: ExpenseRecord) => sum + Number(e.amount || 0), 0);
    const profit = totalRevenue - totalExpenses;

    // Group by category - handle both enum and string categories - ONLY from approved entries
    const revenueByCategory: Record<string, number> = {};
    approvedRevenues.forEach((r: RevenueRecord) => {
      const catValue =
        r.category && typeof r.category === 'object' && 'value' in r.category
          ? (r.category as { value?: unknown }).value
          : r.category;
      const catKey = typeof catValue === 'string' ? catValue : 'other';
      revenueByCategory[catKey] = (revenueByCategory[catKey] || 0) + Number(r.amount || 0);
    });

    const expenseByCategory: Record<string, number> = {};
    approvedExpenses.forEach((e: ExpenseRecord) => {
      const catValue =
        e.category && typeof e.category === 'object' && 'value' in e.category
          ? (e.category as { value?: unknown }).value
          : e.category;
      const catKey = typeof catValue === 'string' ? catValue : 'other';
      expenseByCategory[catKey] = (expenseByCategory[catKey] || 0) + Number(e.amount || 0);
    });

    return {
      data: {
        period: { start_date: startDate, end_date: endDate },
        revenue: {
          total: totalRevenue,
          by_category: revenueByCategory,
        },
        expenses: {
          total: totalExpenses,
          by_category: expenseByCategory,
        },
        profit,
        profit_margin: totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0,
      },
    };
  }

  async getCashFlow(
    startDate?: string,
    endDate?: string,
  ): Promise<ApiResponse<{
    period: { start_date?: string; end_date?: string };
    summary: { total_inflow: number; total_outflow: number; net_cash_flow: number };
    daily_cash_flow: Record<string, { inflow: number; outflow: number; net: number }>;
  }>> {
    const params: Record<string, unknown> = {};
    // Convert date strings to ISO datetime format (YYYY-MM-DD -> YYYY-MM-DDTHH:mm:ss)
    if (startDate) {
      const start = new Date(startDate + 'T00:00:00');
      params.start_date = start.toISOString();
    }
    if (endDate) {
      // Set end date to end of day
      const end = new Date(endDate + 'T23:59:59');
      params.end_date = end.toISOString();
    }

    // Fetch revenue and expense data to calculate cash flow
    // Always fetch all data first, then filter client-side if needed
    const [revenuesRes, expensesRes] = await Promise.all([this.getRevenues(), this.getExpenses()]);

    let revenues = revenuesRes.data || [];
    let expenses = expensesRes.data || [];

    // Filter by date range if provided (client-side filtering)
    if (startDate && endDate) {
      const start = new Date(startDate + 'T00:00:00').getTime();
      const end = new Date(endDate + 'T23:59:59').getTime();

      revenues = revenues.filter((r: RevenueRecord) => {
        const dateStr = r.date || r.created_at;
        if (!dateStr) return true; // Include entries without dates
        try {
          const entryDate = new Date(dateStr).getTime();
          return entryDate >= start && entryDate <= end;
        } catch {
          return true; // Include if date parsing fails
        }
      });

      expenses = expenses.filter((e: ExpenseRecord) => {
        const dateStr = e.date || e.created_at;
        if (!dateStr) return true; // Include entries without dates
        try {
          const entryDate = new Date(dateStr).getTime();
          return entryDate >= start && entryDate <= end;
        } catch {
          return true; // Include if date parsing fails
        }
      });
    }

    // Filter to only include APPROVED revenue and expense entries
    // This ensures cash flow is only calculated from approved entries
    const approvedRevenues = revenues.filter((r: RevenueRecord) =>
      r.is_approved === true || r.is_approved === 'true' || r.approved === true
    );
    const approvedExpenses = expenses.filter((e: ExpenseRecord) =>
      e.is_approved === true || e.is_approved === 'true' || e.approved === true
    );

    // Calculate daily cash flow - ONLY from approved entries
    const cashFlowByDay: Record<string, { inflow: number; outflow: number; net: number }> = {};

    approvedRevenues.forEach((r: RevenueRecord) => {
      // Handle different date formats - try date, created_at, or use current date
      const dateStr = r.date || r.created_at;
      const day = dateStr ? new Date(dateStr).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      if (!cashFlowByDay[day]) {
        cashFlowByDay[day] = { inflow: 0, outflow: 0, net: 0 };
      }
      const amount = Number(r.amount || 0);
      cashFlowByDay[day].inflow += amount;
      cashFlowByDay[day].net += amount;
    });

    approvedExpenses.forEach((e: ExpenseRecord) => {
      // Handle different date formats - try date, created_at, or use current date
      const dateStr = e.date || e.created_at;
      const day = dateStr ? new Date(dateStr).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      if (!cashFlowByDay[day]) {
        cashFlowByDay[day] = { inflow: 0, outflow: 0, net: 0 };
      }
      const amount = Number(e.amount || 0);
      cashFlowByDay[day].outflow += amount;
      cashFlowByDay[day].net -= amount;
    });

    const totalInflow = Object.values(cashFlowByDay).reduce((sum, day) => sum + day.inflow, 0);
    const totalOutflow = Object.values(cashFlowByDay).reduce((sum, day) => sum + day.outflow, 0);
    const netCashFlow = totalInflow - totalOutflow;

    return {
      data: {
        period: { start_date: startDate, end_date: endDate },
        summary: {
          total_inflow: totalInflow,
          total_outflow: totalOutflow,
          net_cash_flow: netCashFlow,
        },
        daily_cash_flow: cashFlowByDay,
      },
    };
  }

  // Financial Summary Report
  async getFinancialSummary(
    startDate?: string,
    endDate?: string,
  ): Promise<ApiResponse<{
    period: { start_date?: string; end_date?: string };
    financials: {
      total_revenue: number;
      total_expenses: number;
      profit: number;
      profit_margin: number;
    };
    revenue_by_category: Record<string, number>;
    expenses_by_category: Record<string, number>;
    transaction_counts: { revenue: number; expenses: number; total: number };
    generated_at: string;
  }>> {
    // Always fetch all data first, then calculate summary
    const [allRevenuesRes, allExpensesRes] = await Promise.all([
      this.getRevenues(),
      this.getExpenses(),
    ]);

    let revenues = allRevenuesRes.data || [];
    let expenses = allExpensesRes.data || [];

    // Filter by date range if provided (client-side filtering)
    if (startDate && endDate) {
      const start = new Date(startDate + 'T00:00:00').getTime();
      const end = new Date(endDate + 'T23:59:59').getTime();

      revenues = revenues.filter((r: RevenueRecord) => {
        const dateStr = r.date || r.created_at;
        if (!dateStr) return true; // Include entries without dates
        try {
          const entryDate = new Date(dateStr).getTime();
          return entryDate >= start && entryDate <= end;
        } catch {
          return true; // Include if date parsing fails
        }
      });

      expenses = expenses.filter((e: ExpenseRecord) => {
        const dateStr = e.date || e.created_at;
        if (!dateStr) return true; // Include entries without dates
        try {
          const entryDate = new Date(dateStr).getTime();
          return entryDate >= start && entryDate <= end;
        } catch {
          return true; // Include if date parsing fails
        }
      });
    }

    // Filter to only include APPROVED revenue entries for calculations
    // This ensures revenue and net profit are only calculated from approved entries
    const approvedRevenues = revenues.filter((r: RevenueRecord) =>
      r.is_approved === true || r.is_approved === 'true' || r.approved === true
    );

    // Filter to only include APPROVED expense entries for calculations
    const approvedExpenses = expenses.filter((e: ExpenseRecord) =>
      e.is_approved === true || e.is_approved === 'true' || e.approved === true
    );

    // Calculate totals from filtered data - ONLY approved revenue and expenses
    const totalRevenue = approvedRevenues.reduce((sum: number, r: RevenueRecord) => sum + Number(r.amount || 0), 0);
    const totalExpenses = approvedExpenses.reduce((sum: number, e: ExpenseRecord) => sum + Number(e.amount || 0), 0);
    const profit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

    // Process category summaries - ONLY from approved revenue
    const revenueByCategory: Record<string, number> = {};
    const normalizeCategory = (raw: unknown): string => {
      if (typeof raw === 'string') return raw || 'other';
      if (raw && typeof raw === 'object' && 'value' in raw) {
        const value = (raw as { value?: unknown }).value;
        return typeof value === 'string' ? value : String(value ?? 'other');
      }
      return String(raw ?? 'other');
    };

    approvedRevenues.forEach((r: RevenueRecord) => {
      const cat = normalizeCategory(r.category);
      revenueByCategory[cat] = (revenueByCategory[cat] || 0) + Number(r.amount || 0);
    });

    // Process category summaries - ONLY from approved expenses
    const expenseByCategory: Record<string, number> = {};
    approvedExpenses.forEach((e: ExpenseRecord) => {
      const cat = normalizeCategory(e.category);
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + Number(e.amount || 0);
    });

    // Calculate actual transaction counts - ONLY approved items
    const revenueCount = approvedRevenues.length;
    const expenseCount = approvedExpenses.length;

    const result = {
      data: {
        period: { start_date: startDate, end_date: endDate },
        financials: {
          total_revenue: totalRevenue,
          total_expenses: totalExpenses,
          profit,
          profit_margin: profitMargin,
        },
        revenue_by_category: revenueByCategory,
        expenses_by_category: expenseByCategory,
        transaction_counts: {
          revenue: revenueCount,
          expenses: expenseCount,
          total: revenueCount + expenseCount,
        },
        generated_at: new Date().toISOString(),
      },
    };

    return result;
  }

  // Approvals
  async getApprovals(): Promise<ApiResponse<unknown[]>> {
    return this.get('/approvals');
  }

  async getApproval(approvalId: number): Promise<ApiResponse<unknown>> {
    return this.get(`/approvals/${approvalId}`);
  }

  async getApprovalComments(approvalId: number): Promise<ApiResponse<unknown[]>> {
    return this.get(`/approvals/${approvalId}/comments`);
  }

  async createApprovalComment(approvalId: number, comment: string): Promise<ApiResponse<unknown>> {
    return this.post(`/approvals/${approvalId}/comments`, { comment });
  }

  async approveItem(itemId: number, itemType: 'revenue' | 'expense'): Promise<ApiResponse<unknown>> {
    if (itemType === 'revenue') {
      return this.post(`/revenue/${itemId}/approve`);
    } else {
      return this.post(`/expenses/${itemId}/approve`);
    }
  }

  async rejectItem(
    itemId: number,
    itemType: 'revenue' | 'expense',
    reason: string,
    password: string,
  ): Promise<ApiResponse<unknown>> {
    // Reject revenue or expense entry through their respective endpoints
    if (itemType === 'revenue') {
      return this.post(`/revenue/${itemId}/reject`, { reason: reason || 'No reason provided', password });
    } else {
      return this.post(`/expenses/${itemId}/reject`, { reason: reason || 'No reason provided', password });
    }
  }

  async approveWorkflow(workflowId: number): Promise<ApiResponse<unknown>> {
    return this.post(`/approvals/${workflowId}/approve`);
  }

  async rejectWorkflow(
    workflowId: number,
    reason: string,
    password: string,
  ): Promise<ApiResponse<unknown>> {
    return this.post(`/approvals/${workflowId}/reject`, { rejection_reason: reason, password });
  }

  // Notifications
  async getNotifications(unreadOnly?: boolean, limit: number = 100, skip: number = 0): Promise<ApiResponse<unknown[]>> {
    return this.get('/notifications', { params: { unread_only: unreadOnly, limit, skip } });
  }

  async getNotification(notificationId: number): Promise<ApiResponse<unknown>> {
    return this.get(`/notifications/${notificationId}`);
  }

  async markNotificationAsRead(notificationId: number): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/notifications/${notificationId}/mark-read`);
  }

  async markAllNotificationsAsRead(): Promise<ApiResponse<{ message: string }>> {
    return this.post('/notifications/mark-all-read');
  }

  async deleteNotification(notificationId: number): Promise<ApiResponse<{ message: string }>> {
    return this.delete(`/notifications/${notificationId}`);
  }

  async getUnreadCount(): Promise<ApiResponse<{ unread_count: number }>> {
    return this.get('/notifications/unread/count');
  }

  async getNotificationPreferences(): Promise<ApiResponse<unknown>> {
    return this.get('/notifications/preferences');
  }

  async updateNotificationPreferences(
    preferences: Record<string, unknown>,
  ): Promise<ApiResponse<unknown>> {
    return this.put('/notifications/preferences', preferences);
  }

  // Admin endpoints

  async getAdminSystemStats(): Promise<ApiResponse<unknown>> {
    return this.get('/admin/system/stats');
  }

  async getSystemSettings(): Promise<ApiResponse<unknown>> {
    return this.get('/admin/settings');
  }

  async getSystemHealth(): Promise<ApiResponse<unknown>> {
    return this.get('/admin/health');
  }

  async getHierarchy(): Promise<ApiResponse<unknown>> {
    return this.get('/admin/hierarchy');
  }

  async getRoles(): Promise<ApiResponse<ApiRole[]>> {
    return this.get('/admin/roles');
  }

  async getPermissions(): Promise<ApiResponse<string[]>> {
    return this.get('/admin/permissions');
  }

  async createRole(roleData: { name: string; description?: string; permissions?: string[] }): Promise<ApiResponse<ApiRole>> {
    const payload = {
      ...roleData,
      permissions: roleData.permissions?.map((perm) => perm.trim()).filter(Boolean),
    };
    return this.post('/admin/roles', payload);
  }

  async updateRole(roleId: number, roleData: { name?: string; description?: string; permissions?: string[] }): Promise<ApiResponse<ApiRole>> {
    const payload = {
      ...roleData,
      permissions: roleData.permissions?.map((perm) => perm.trim()).filter(Boolean),
    };
    return this.put(`/admin/roles/${roleId}`, payload);
  }

  async deleteRole(roleId: number | string, password: string): Promise<ApiResponse<null>> {
    return this.post(`/admin/roles/${roleId}/delete`, { password });
  }

  // Backup endpoints
  async createBackup(includeFiles: boolean = false): Promise<ApiResponse<{ message: string }>> {
    const response = await this.client.post('/admin/backup/create', null, {
      params: { include_files: includeFiles }
    });
    return this.normalizeResponse<{ message: string }>(response.data);
  }

  async listBackups(): Promise<ApiResponse<{ backups: unknown[] }>> {
    return this.get('/admin/backup/list');
  }

  async restoreBackup(backupName: string): Promise<ApiResponse<{ message: string }>> {
    const response = await this.client.post('/admin/backup/restore', null, {
      params: { backup_name: backupName }
    });
    return this.normalizeResponse<{ message: string }>(response.data);
  }

  async deleteBackup(backupName: string, password: string): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/admin/backup/${encodeURIComponent(backupName)}/delete`, { password });
  }

  async getVerificationHistory(): Promise<ApiResponse<unknown[]>> {
    return this.get('/users/me/verification-history');
  }

  // 2FA endpoints
  async get2FAStatus(): Promise<ApiResponse<{ enabled: boolean }>> {
    return this.get('/users/me/2fa/status');
  }

  async setup2FA(): Promise<ApiResponse<{ secret: string; qr_code_url: string; manual_entry_key: string }>> {
    return this.post('/users/me/2fa/setup');
  }

  async verify2FA(code: string): Promise<ApiResponse<{ message: string; enabled: boolean }>> {
    return this.post('/users/me/2fa/verify', { code });
  }

  async disable2FA(currentPassword: string): Promise<ApiResponse<{ message: string; enabled: boolean }>> {
    return this.post('/users/me/2fa/disable', { current_password: currentPassword });
  }

  // IP Restriction endpoints
  async getIPRestrictionStatus(): Promise<ApiResponse<{ enabled: boolean; allowed_ips: string[] }>> {
    return this.get('/users/me/ip-restriction');
  }

  async updateIPRestriction(enabled: boolean): Promise<ApiResponse<{ enabled: boolean; allowed_ips: string[] }>> {
    return this.put('/users/me/ip-restriction', { enabled });
  }

  async addAllowedIP(ipAddress: string): Promise<ApiResponse<{ enabled: boolean; allowed_ips: string[] }>> {
    return this.post('/users/me/ip-restriction/allowed-ips', { ip_address: ipAddress });
  }

  async removeAllowedIP(ipAddress: string): Promise<ApiResponse<{ enabled: boolean; allowed_ips: string[] }>> {
    return this.delete(`/users/me/ip-restriction/allowed-ips/${encodeURIComponent(ipAddress)}`);
  }

  async triggerBackup(includeFiles = false): Promise<ApiResponse<{ message: string }>> {
    return this.post('/admin/backup/create', undefined, { params: { include_files: includeFiles } });
  }

  // Department endpoints
  async getDepartments(): Promise<ApiResponse<unknown[]>> {
    return this.get('/departments');
  }

  async getDepartment(departmentId: string | number): Promise<ApiResponse<unknown>> {
    // URL encode the department ID to handle special characters like colons
    const encodedId = encodeURIComponent(String(departmentId));
    return this.get(`/departments/${encodedId}`);
  }

  async createDepartment(departmentData: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return this.post('/departments', departmentData);
  }

  async updateDepartment(
    departmentId: string | number,
    departmentData: Record<string, unknown>,
  ): Promise<ApiResponse<unknown>> {
    // URL encode the department ID to handle special characters like colons
    const encodedId = encodeURIComponent(String(departmentId));
    return this.put(`/departments/${encodedId}`, departmentData);
  }

  async deleteDepartment(
    departmentId: string | number,
    password: string,
  ): Promise<ApiResponse<{ message: string }>> {
    // URL encode the department ID to handle special characters like colons
    const encodedId = encodeURIComponent(String(departmentId));
    return this.post(`/departments/${encodedId}/delete`, { password });
  }

  // Project endpoints
  async getProjects(filters?: Record<string, unknown>): Promise<ApiResponse<unknown[]>> {
    return this.get('/projects', { params: filters });
  }

  async getProject(projectId: number): Promise<ApiResponse<unknown>> {
    return this.get(`/projects/${projectId}`);
  }

  async createProject(projectData: Record<string, unknown>): Promise<ApiResponse<unknown>> {
    return this.post('/projects', projectData);
  }

  async updateProject(
    projectId: number,
    projectData: Record<string, unknown>,
  ): Promise<ApiResponse<unknown>> {
    return this.put(`/projects/${projectId}`, projectData);
  }

  async deleteProject(projectId: number, password: string): Promise<ApiResponse<{ message: string }>> {
    return this.post(`/projects/${projectId}/delete`, { password });
  }

  // Audit Logs endpoints (Admin only)
  async getAuditLogs(filters?: {
    skip?: number;
    limit?: number;
    user_id?: number;
    action?: string;
    resource_type?: string;
    start_date?: string;
    end_date?: string;
    search?: string; // Search by username/email/full_name
  }): Promise<ApiResponse<AuditLog[]>> {
    const params: Record<string, unknown> = {};
    if (filters) {
      if (filters.skip !== undefined) params.skip = filters.skip;
      if (filters.limit !== undefined) params.limit = filters.limit;
      if (filters.user_id !== undefined) params.user_id = filters.user_id;
      if (filters.action) params.action = filters.action;
      if (filters.resource_type) params.resource_type = filters.resource_type;
      if (filters.search) params.search = filters.search;
      if (filters.start_date) {
        // Convert to ISO format for backend
        const start = new Date(filters.start_date + 'T00:00:00');
        params.start_date = start.toISOString();
      }
      if (filters.end_date) {
        // Convert to ISO format for backend
        const end = new Date(filters.end_date + 'T23:59:59');
        params.end_date = end.toISOString();
      }
    }
    return this.get('/admin/audit/logs', { params });
  }

  // ============================================================================
  // BUDGETING & FORECASTING (FP&A)
  // ============================================================================

  // Budget Management
  async getBudgets(params?: { skip?: number; limit?: number; status?: string; department?: string }) {
    return this.get('/budgeting/budgets', { params });
  }

  async getBudget(id: number) {
    return this.get(`/budgeting/budgets/${id}`);
  }

  async createBudget(data: Record<string, unknown>) {
    return this.post('/budgeting/budgets', data);
  }

  async createBudgetFromTemplate(templateName: string, data: Record<string, unknown>) {
    const params: Record<string, unknown> = {
      template_name: templateName
    };
    if (data.name) params.name = data.name;
    if (data.start_date) params.start_date = data.start_date;
    if (data.end_date) params.end_date = data.end_date;
    if (data.department) params.department = data.department;
    if (data.project) params.project = data.project;

    return this.post(`/budgeting/budgets/from-template`, {}, { params });
  }

  async updateBudget(id: number, data: Record<string, unknown>) {
    return this.put(`/budgeting/budgets/${id}`, data);
  }

  async deleteBudget(id: number, password: string) {
    return this.post(`/budgeting/budgets/${id}/delete`, { password });
  }

  async validateBudget(id: number) {
    return this.post(`/budgeting/budgets/${id}/validate`);
  }

  // Budget Items
  async getBudgetItems(budgetId: number) {
    return this.get(`/budgeting/budgets/${budgetId}/items`);
  }

  async createBudgetItem(budgetId: number, data: Record<string, unknown>) {
    return this.post(`/budgeting/budgets/${budgetId}/items`, data);
  }

  async updateBudgetItem(budgetId: number, itemId: number, data: Record<string, unknown>) {
    return this.put(`/budgeting/budgets/${budgetId}/items/${itemId}`, data);
  }

  async deleteBudgetItem(budgetId: number, itemId: number, password: string) {
    return this.post(`/budgeting/budgets/${budgetId}/items/${itemId}/delete`, { password });
  }

  // Scenario Planning
  async getScenarios(budgetId: number) {
    return this.get(`/budgeting/budgets/${budgetId}/scenarios`);
  }

  async createScenario(budgetId: number, data: Record<string, unknown>) {
    return this.post(`/budgeting/budgets/${budgetId}/scenarios`, data);
  }

  async compareScenarios(budgetId: number, scenarioIds: number[]) {
    return this.post(`/budgeting/budgets/${budgetId}/scenarios/compare`, { scenario_ids: scenarioIds });
  }

  async deleteScenario(budgetId: number, scenarioId: number, password: string) {
    return this.post(`/budgeting/budgets/${budgetId}/scenarios/${scenarioId}/delete`, { password });
  }

  // Forecasting
  async getForecasts(params?: { skip?: number; limit?: number }) {
    // Always provide explicit defaults to match backend expectations
    const queryParams = {
      skip: params?.skip !== undefined && params.skip >= 0 ? params.skip : 0,
      limit: params?.limit !== undefined && params.limit >= 1 && params.limit <= 1000 ? params.limit : 100
    };

    return this.get('/budgeting/forecasts', { params: queryParams });
  }

  async createForecast(data: Record<string, unknown>) {
    return this.post('/budgeting/forecasts', data);
  }

  async getForecast(id: number) {
    return this.get(`/budgeting/forecasts/${id}`);
  }

  /**
   * Update a forecast
   * @param id - Forecast ID
   * @param data - Forecast update data (name, description, and optionally forecast_data)
   */
  async updateForecast(
    id: number,
    data: {
      name?: string;
      description?: string;
      forecast_data?: Array<{
        period?: string;
        date?: string;
        forecasted_value?: number;
        method?: string;
      }>;
    },
  ) {
    return this.put(`/budgeting/forecasts/${id}`, data);
  }

  async deleteForecast(id: number, password: string) {
    return this.post(`/budgeting/forecasts/${id}/delete`, { password });
  }

  // ============================================================================
  // AI/ML MODEL TRAINING
  // ============================================================================

  /**
   * Train all AI/ML models
   * @param startDate - Training data start date (YYYY-MM-DD)
   * @param endDate - Training data end date (YYYY-MM-DD)
   */
  async trainAllModels(startDate: string, endDate: string) {
    return this.request({
      method: 'POST',
      url: '/budgeting/ml/train/all',
      params: { start_date: startDate, end_date: endDate }
    });
  }

  /**
   * Train ARIMA model for expenses
   * @param startDate - Training data start date (YYYY-MM-DD)
   * @param endDate - Training data end date (YYYY-MM-DD)
   * @param order - ARIMA order (p,d,q) as string "p,d,q"
   */
  async trainExpensesArima(startDate: string, endDate: string, order: string = "1,1,1") {
    return this.request({
      method: 'POST',
      url: '/budgeting/ml/train/expenses/arima',
      params: { start_date: startDate, end_date: endDate, order },
      timeout: 120000 // 2 minutes for ARIMA
    });
  }

  /**
   * Train Prophet model for expenses
   */
  async trainExpensesProphet(startDate: string, endDate: string) {
    return this.request({
      method: 'POST',
      url: '/budgeting/ml/train/expenses/prophet',
      params: { start_date: startDate, end_date: endDate },
      timeout: 180000 // 3 minutes for Prophet
    });
  }

  /**
   * Train Linear Regression model for expenses
   */
  async trainExpensesLinearRegression(startDate: string, endDate: string) {
    return this.request({
      method: 'POST',
      url: '/budgeting/ml/train/expenses/linear-regression',
      params: { start_date: startDate, end_date: endDate },
      timeout: 120000 // 2 minutes
    });
  }

  /**
   * Train Prophet model for revenue
   */
  async trainRevenueProphet(startDate: string, endDate: string) {
    return this.request({
      method: 'POST',
      url: '/budgeting/ml/train/revenue/prophet',
      params: { start_date: startDate, end_date: endDate },
      timeout: 180000 // 3 minutes for Prophet
    });
  }

  /**
   * Train XGBoost model for revenue
   */
  async trainRevenueXGBoost(startDate: string, endDate: string) {
    return this.request({
      method: 'POST',
      url: '/budgeting/ml/train/revenue/xgboost',
      params: { start_date: startDate, end_date: endDate },
      timeout: 180000 // 3 minutes for XGBoost
    });
  }

  /**
   * Train LSTM model for revenue
   */
  async trainRevenueLSTM(startDate: string, endDate: string, epochs: number = 50, batchSize: number = 32) {
    return this.request({
      method: 'POST',
      url: '/budgeting/ml/train/revenue/lstm',
      params: { start_date: startDate, end_date: endDate, epochs, batch_size: batchSize },
      timeout: 300000 // 5 minutes for LSTM (can take longer)
    });
  }

  /**
   * Train SARIMA model for inventory
   */
  async trainInventorySARIMA(startDate: string, endDate: string, order: string = "1,1,1", seasonalOrder: string = "1,1,1,12") {
    return this.request({
      method: 'POST',
      url: '/budgeting/ml/train/inventory/sarima',
      params: { start_date: startDate, end_date: endDate, order, seasonal_order: seasonalOrder },
      timeout: 180000 // 3 minutes for SARIMA
    });
  }

  /**
   * Train XGBoost model for inventory
   */
  async trainInventoryXGBoost(startDate: string, endDate: string) {
    return this.request({
      method: 'POST',
      url: '/budgeting/ml/train/inventory/xgboost',
      params: { start_date: startDate, end_date: endDate },
      timeout: 180000 // 3 minutes for XGBoost
    });
  }

  /**
   * Train LSTM model for inventory
   */
  async trainInventoryLSTM(startDate: string, endDate: string, epochs: number = 50, batchSize: number = 32) {
    return this.request({
      method: 'POST',
      url: '/budgeting/ml/train/inventory/lstm',
      params: { start_date: startDate, end_date: endDate, epochs, batch_size: batchSize },
      timeout: 300000 // 5 minutes for LSTM (can take longer)
    });
  }

  /**
   * Get auto-learning status and statistics
   */
  async getAutoLearnStatus() {
    return this.request({
      method: 'GET',
      url: '/budgeting/ml/auto-learn/status'
    });
  }

  /**
   * Manually trigger auto-learning for a metric
   * @param metric - 'expense', 'revenue', or 'inventory'
   */
  async triggerAutoLearn(metric: 'expense' | 'revenue' | 'inventory') {
    return this.request({
      method: 'POST',
      url: `/budgeting/ml/auto-learn/trigger/${metric}`,
      timeout: 300000 // 5 minutes for training
    });
  }

  /**
   * Get list of all trained models
   * @param metric - Optional filter by metric
   */
  async getTrainedModels(metric?: 'expense' | 'revenue' | 'inventory') {
    return this.request({
      method: 'GET',
      url: '/budgeting/ml/models',
      params: metric ? { metric } : {}
    });
  }

  /**
   * Get ML scheduler status and scheduled jobs
   */
  async getSchedulerStatus() {
    return this.request({
      method: 'GET',
      url: '/budgeting/ml/scheduler/status'
    });
  }

  /**
   * Generate forecast with AI-powered advice and recommendations
   * @param metric - 'expense', 'revenue', or 'inventory'
   * @param modelType - 'arima', 'sarima', 'prophet', 'xgboost', 'lstm', 'linear_regression'
   * @param periods - Number of periods to forecast
   */
  async generateForecastWithAdvice(
    metric: 'expense' | 'revenue' | 'inventory',
    modelType: 'arima' | 'sarima' | 'prophet' | 'xgboost' | 'lstm' | 'linear_regression',
    periods: number = 12
  ) {
    return this.request({
      method: 'POST',
      url: '/budgeting/ml/forecast/with-advice',
      params: { metric, model_type: modelType, periods },
      timeout: 120000 // 2 minutes
    });
  }

  // Variance Analysis
  async calculateVariance(budgetId: number, periodStart: string, periodEnd: string) {
    return this.post(`/budgeting/budgets/${budgetId}/variance`, {}, {
      params: { period_start: periodStart, period_end: periodEnd }
    });
  }

  async getVarianceHistory(budgetId: number, params?: { skip?: number; limit?: number }) {
    return this.get(`/budgeting/budgets/${budgetId}/variance`, { params });
  }

  async getVarianceSummary(budgetId: number) {
    return this.get(`/budgeting/budgets/${budgetId}/variance/summary`);
  }

  // ============================================================================
  // INVENTORY MANAGEMENT API
  // ============================================================================

  async createInventoryItem(itemData: {
    item_name: string;
    buying_price: number;
    expense_amount?: number;
    selling_price: number;
    quantity: number;
    description?: string;
    category?: string;
    sku?: string;
    is_active?: boolean;
  }) {
    return this.post('/inventory/items', itemData);
  }

  async getInventoryItems(params?: {
    skip?: number;
    limit?: number;
    category?: string;
    is_active?: boolean;
    search?: string;
  }): Promise<ApiResponse<InventoryItem[]>> {
    return this.get<InventoryItem[]>('/inventory/items', { params });
  }

  async getInventoryItem(itemId: number): Promise<ApiResponse<InventoryItem>> {
    return this.get<InventoryItem>(`/inventory/items/${itemId}`);
  }

  async updateInventoryItem(itemId: number, itemData: {
    item_name?: string;
    buying_price?: number;
    expense_amount?: number;
    selling_price?: number;
    quantity?: number;
    description?: string;
    category?: string;
    sku?: string;
    is_active?: boolean;
  }) {
    return this.put(`/inventory/items/${itemId}`, itemData);
  }

  async deleteInventoryItem(itemId: number, password: string) {
    return this.post(`/inventory/items/${itemId}/delete`, { password });
  }

  async activateInventoryItem(itemId: number, password: string) {
    return this.post(`/inventory/items/${itemId}/activate`, { password });
  }

  async deactivateInventoryItem(itemId: number, password: string) {
    return this.post(`/inventory/items/${itemId}/deactivate`, { password });
  }

  async getInventoryAuditLogs(itemId: number, params?: { skip?: number; limit?: number }) {
    return this.get(`/inventory/items/${itemId}/audit`, { params });
  }

  async getLowStockItems(threshold?: number) {
    return this.get('/inventory/items/low-stock/list', { params: { threshold } });
  }

  async getInventorySummary() {
    return this.get('/inventory/summary');
  }

  // ============================================================================
  // SALES API
  // ============================================================================

  async createSale(saleData: {
    item_id: number;
    quantity_sold: number;
    customer_name?: string;
    customer_email?: string;
    notes?: string;
  }) {
    return this.post('/sales/', saleData);
  }

  async getSales(params?: {
    skip?: number;
    limit?: number;
    status?: 'pending' | 'posted' | 'cancelled';
    item_id?: number;
    start_date?: string;
    end_date?: string;
  }) {
    // Enforce backend maximum limit of 1000 to prevent 422 errors
    // Backend has a hard limit of 1000 (le=1000), so cap any higher values
    let safeLimit: number | undefined = params?.limit;
    if (safeLimit !== undefined && safeLimit > 1000) {
      console.warn(`getSales: Limit ${safeLimit} exceeds backend maximum of 1000. Capping to 1000.`);
      safeLimit = 1000;
    }

    const safeParams = params ? {
      ...params,
      limit: safeLimit
    } : undefined;

    return this.get('/sales', { params: safeParams });
  }

  async getSale(saleId: number) {
    return this.get(`/sales/${saleId}`);
  }

  async postSale(saleId: number, postData: {
    debit_account?: string;
    credit_account?: string;
    reference_number?: string;
    notes?: string;
  }) {
    return this.post(`/sales/${saleId}/post`, postData);
  }

  async cancelSale(saleId: number) {
    return this.post(`/sales/${saleId}/cancel`, {});
  }

  async getSalesSummary(params?: { start_date?: string; end_date?: string }) {
    return this.get('/sales/summary/overview', { params });
  }

  async getReceipt(saleId: number) {
    return this.get(`/sales/receipt/${saleId}`);
  }

  async getEInvoice(saleId: number, format: 'json' | 'xml' = 'json') {
    return this.get(`/sales/${saleId}/einvoice`, { params: { format } });
  }

  async getJournalEntries(params?: {
    skip?: number;
    limit?: number;
    start_date?: string;
    end_date?: string;
  }) {
    return this.get('/sales/journal-entries/list', { params });
  }

  /**
   * Submit a contact/support message
   * You can override the endpoint path with NEXT_PUBLIC_CONTACT_ENDPOINT (e.g. "/contact")
   * Note: The base URL already includes /api/v1, so the path should be relative to that
   */
  async submitContact(payload: { name: string; email: string; message: string }) {
    const contactPath = process.env.NEXT_PUBLIC_CONTACT_ENDPOINT || '/contact';
    return this.post(contactPath, payload);
  }

  // Admin IP Management endpoints
  async getAdminIPRestrictions(params?: { skip?: number; limit?: number }): Promise<ApiResponse<any[]>> {
    const response = await this.get<any[]>('/ip-management', { params });
    return { ...response, data: Array.isArray(response.data) ? response.data : [] };
  }

  async createAdminIPRestriction(ipData: { ip_address: string; description?: string; status?: string }): Promise<ApiResponse<any>> {
    return this.post('/ip-management', ipData);
  }

  async updateAdminIPRestriction(ipId: number, ipData: { ip_address?: string; description?: string; status?: string }): Promise<ApiResponse<any>> {
    return this.put(`/ip-management/${ipId}`, ipData);
  }

  async deleteAdminIPRestriction(ipId: number): Promise<ApiResponse<any>> {
    return this.delete(`/ip-management/${ipId}`);
  }

  // Generic request method
  async request<T = unknown>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.request<T>(config);
    return this.normalizeResponse<T>(response.data);
  }
  // Accounting Endpoints
  async getAccountingAccounts(params?: { skip?: number; limit?: number }) {
    return this.get<any[]>('/accounting/accounts', { params });
  }

  async createAccountingAccount(data: any) {
    return this.post<any>('/accounting/accounts', data);
  }

  async updateAccountingAccount(accountId: number, data: any) {
    return this.put<any>(`/accounting/accounts/${accountId}`, data);
  }

  async deleteAccountingAccount(accountId: number) {
    return this.delete<any>(`/accounting/accounts/${accountId}`);
  }

  async getAccountingJournalEntries(params?: { skip?: number; limit?: number; status?: string }) {
    return this.get<any[]>('/accounting/journal-entries', { params });
  }

  async createAccountingJournalEntry(data: any) {
    return this.post<any>('/accounting/journal-entries', data);
  }

  async postAccountingJournalEntry(entryId: number) {
    return this.post<any>(`/accounting/journal-entries/${entryId}/post`);
  }

  async updateAccountingJournalEntry(entryId: number, data: any) {
    return this.put<any>(`/accounting/journal-entries/${entryId}`, data);
  }

  async deleteAccountingJournalEntry(entryId: number) {
    return this.delete<any>(`/accounting/journal-entries/${entryId}`);
  }

  async reverseAccountingJournalEntry(entryId: number) {
    return this.post<any>(`/accounting/journal-entries/${entryId}/reverse`);
  }

  // Currency Endpoints
  async getCurrencies(params?: { skip?: number; limit?: number; active_only?: boolean }) {
    return this.get<any[]>('/accounting/currencies', { params });
  }

  async createCurrency(data: any) {
    return this.post<any>('/accounting/currencies', data);
  }

  async updateCurrency(currencyId: number, data: any) {
    return this.put<any>(`/accounting/currencies/${currencyId}`, data);
  }

  async deleteCurrency(currencyId: number) {
    return this.delete<any>(`/accounting/currencies/${currencyId}`);
  }

  async getExchangeRates(params?: { skip?: number; limit?: number; from_currency?: string; to_currency?: string }) {
    return this.get<any[]>('/accounting/exchange-rates', { params });
  }

  async createExchangeRate(data: any) {
    return this.post<any>('/accounting/exchange-rates', data);
  }

  async deleteExchangeRate(rateId: number) {
    return this.delete<any>(`/accounting/exchange-rates/${rateId}`);
  }

  // Tax Endpoints
  async getTaxTypes(params?: { skip?: number; limit?: number; active_only?: boolean }) {
    return this.get<any[]>('/accounting/taxes/types', { params });
  }

  async createTaxType(data: any) {
    return this.post<any>('/accounting/taxes/types', data);
  }

  async getTaxRates(params?: { skip?: number; limit?: number; tax_type?: string; active_only?: boolean }) {
    return this.get<any[]>('/accounting/taxes/rates', { params });
  }

  async createTaxRate(data: any) {
    return this.post<any>('/accounting/taxes/rates', data);
  }

  // Document Intelligence (OCR)
  async analyzeDocument(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.post<any>('/documents/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000, // 60s timeout for AI analysis
    });
  }

  // Banking Endpoints
  async getBankAccounts() {
    return this.get<any[]>('/banking/accounts');
  }

  async createBankAccount(data: any) {
    return this.post<any>('/banking/accounts', data);
  }

  async uploadBankStatement(bankAccountId: number, file: File) {
    const formData = new FormData();
    formData.append('bank_account_id', bankAccountId.toString());
    formData.append('file', file);
    return this.post<any[]>('/banking/upload-statement', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  async getBankTransactions(bankAccountId: number, params?: { skip?: number; limit?: number }) {
    return this.get<any[]>('/banking/transactions', { params: { bank_account_id: bankAccountId, ...params } });
  }

  // Cash Flow Forecasting
  async getCashFlowForecast(days: number = 30) {
    return this.get<any>('/banking/forecast', { params: { days } });
  }

  // Banking Simulation
  async simulateBankFetch(bankAccountId: number, count: number = 5) {
    return this.post<any[]>('/banking/simulate-fetch', {}, {
      params: { bank_account_id: bankAccountId, count }
    });
  }

  async simulateBankWebhook(bankAccountId: number, payload: any) {
    return this.post<any>('/banking/webhook/simulator', payload, {
      params: { bank_account_id: bankAccountId }
    });
  }

  // Accounting Mapping
  async getAccountMappings() {
    return this.get<any[]>('/account-mappings/');
  }

  async createAccountMapping(data: { module: string; category: string; account_id: number }) {
    return this.post<any>('/account-mappings/', data);
  }

  async deleteAccountMapping(id: number) {
    return this.delete<any>(`/account-mappings/${id}`);
  }

  // Fixed Assets
  async getFixedAssets(params?: { skip?: number; limit?: number }) {
    return this.get<any[]>('/fixed-assets/', { params });
  }

  async createFixedAsset(data: any) {
    return this.post<any>('/fixed-assets/', data);
  }

  async updateFixedAsset(id: number, data: any) {
    return this.put<any>(`/fixed-assets/${id}`, data);
  }

  async deleteFixedAsset(id: number) {
    return this.delete<any>(`/fixed-assets/${id}`);
  }

  async depreciateFixedAsset(id: number) {
    return this.post<any>(`/fixed-assets/${id}/depreciate`);
  }

  // Applied AI (Fraud Detection & Scenario Modeling)
  async getFraudFlags(params?: { skip?: number; limit?: number }) {
    return this.get<any[]>('/ai/fraud', { params });
  }

  async runFraudScan() {
    return this.post<{ message: string; new_flags_found: number }>('/ai/fraud/scan');
  }

  async updateFraudFlag(id: number, data: { status: string; review_comments?: string }) {
    return this.put<any>(`/ai/fraud/${id}`, data);
  }

  async runScenarioSimulation(data: {
    period_months: number;
    revenue_multiplier: number;
    expense_multiplier: number;
    fixed_revenue_offset: number;
    fixed_expense_offset: number;
  }) {
    return this.post<any>('/ai/simulate', data);
  }

  // Payroll
  async getEmployees() {
    return this.get<any[]>('/payroll/employees');
  }

  async createEmployee(data: any) {
    return this.post<any>('/payroll/employees', data);
  }

  async getPayrollPeriods() {
    return this.get<any[]>('/payroll/periods');
  }

  async createPayrollPeriod(data: any) {
    return this.post<any>('/payroll/periods', data);
  }

  async generatePayslips(periodId: number) {
    return this.post<any>(`/payroll/periods/${periodId}/generate`);
  }

  async approvePayroll(periodId: number) {
    return this.post<any>(`/payroll/periods/${periodId}/approve`);
  }

  async getPayslips(periodId: number) {
    return this.get<any[]>(`/payroll/periods/${periodId}/payslips`);
  }

  // Feedback
  async submitFeedback(data: FeedbackCreate): Promise<ApiResponse<Feedback>> {
    return this.post<Feedback>('/feedback/', data);
  }

  async getFeedback(params?: {
    skip?: number;
    limit?: number;
    status_filter?: string;
    rating_filter?: number;
    category_filter?: string;
  }): Promise<ApiResponse<Feedback[]>> {
    return this.get<Feedback[]>('/feedback/', { params });
  }

  async getFeedbackById(feedbackId: number): Promise<ApiResponse<Feedback>> {
    return this.get<Feedback>(`/feedback/${feedbackId}`);
  }

  async getFeedbackStats(): Promise<ApiResponse<FeedbackStats>> {
    return this.get<FeedbackStats>('/feedback/stats');
  }

  async updateFeedback(feedbackId: number, data: FeedbackUpdate): Promise<ApiResponse<Feedback>> {
    return this.put<Feedback>(`/feedback/${feedbackId}`, data);
  }

  async deleteFeedback(feedbackId: number): Promise<ApiResponse<{ message: string }>> {
    return this.delete<{ message: string }>(`/feedback/${feedbackId}`);
  }


}

export const apiClient = new ApiClient();
export default apiClient;