// lib/models/corporae-clients.ts
import { z } from 'zod';

export const UserRole = z.enum(['admin', 'finance_manager', 'accountant', 'employee']);
export type UserRole = z.infer<typeof UserRole>;

export const TransactionStatus = z.enum(['pending', 'approved', 'rejected']);
export type TransactionStatus = z.infer<typeof TransactionStatus>;

export const NotificationType = z.enum(['info', 'success', 'warning', 'error']);
export type NotificationType = z.infer<typeof NotificationType>;

export const ReportFormat = z.enum(['pdf', 'csv', 'excel']);
export type ReportFormat = z.infer<typeof ReportFormat>;

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const RegisterSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: UserRole,
  managerId: z.string().optional(),
});

export const RevenueSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  date: z.string(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
});

export const ExpenseSchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  date: z.string(),
  receipt: z.string().optional(),
});

export const UserSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: UserRole,
  managerId: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
});

export type User = z.infer<typeof UserSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type RevenueInput = z.infer<typeof RevenueSchema>;
export type ExpenseInput = z.infer<typeof ExpenseSchema>;

export const OTPSchema = z.object({
  code: z.string().length(6, 'OTP must be 6 digits'),
});

export type OTPInput = z.infer<typeof OTPSchema>;

// Financial transaction schemas
export const TransactionSchema = z.object({
  id: z.string(),
  type: z.enum(['revenue', 'expense']),
  amount: z.number(),
  description: z.string(),
  category: z.string(),
  date: z.string(),
  status: TransactionStatus,
  submittedBy: z.string(),
  approvedBy: z.string().optional(),
  approvedAt: z.string().optional(),
  rejectionReason: z.string().optional(),
  receipt: z.string().optional(),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional(),
  createdAt: z.string(),
});

export type Transaction = z.infer<typeof TransactionSchema>;

// Notification schema
export const NotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  message: z.string(),
  type: NotificationType,
  isRead: z.boolean().default(false),
  userId: z.string(),
  createdAt: z.string(),
  actionUrl: z.string().optional(),
});

export type Notification = z.infer<typeof NotificationSchema>;

// Report schema
export const ReportSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  type: z.string(),
  format: ReportFormat,
  filters: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    department: z.string().optional(),
    category: z.string().optional(),
    userId: z.string().optional(),
  }),
  generatedBy: z.string(),
  generatedAt: z.string(),
  fileUrl: z.string().optional(),
});

export type Report = z.infer<typeof ReportSchema>;

// Dashboard data schema
export const DashboardDataSchema = z.object({
  totalRevenue: z.number(),
  totalExpenses: z.number(),
  netProfit: z.number(),
  pendingApprovals: z.number(),
  recentTransactions: z.array(TransactionSchema),
  monthlyData: z.array(z.object({
    month: z.string(),
    revenue: z.number(),
    expenses: z.number(),
  })),
  categoryBreakdown: z.array(z.object({
    category: z.string(),
    amount: z.number(),
    percentage: z.number(),
  })),
});

export type DashboardData = z.infer<typeof DashboardDataSchema>;

// Department schema
export const DepartmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  managerId: z.string(),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
});

export type Department = z.infer<typeof DepartmentSchema>;

// Project schema
export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  departmentId: z.string(),
  assignedUsers: z.array(z.string()),
  budget: z.number().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
});

export type Project = z.infer<typeof ProjectSchema>;

// Corporate Client schema
export const CorporateClientStatus = z.enum(['active', 'inactive', 'pending', 'suspended']);
export type CorporateClientStatus = z.infer<typeof CorporateClientStatus>;

export const FinancialPlanStatus = z.enum(['active', 'inactive', 'archived']);
export type FinancialPlanStatus = z.infer<typeof FinancialPlanStatus>;

export const CorporateClientSchema = z.object({
  id: z.string(),
  name: z.string(),
  contactPersonName: z.string(),
  contactEmail: z.string().email(),
  status: CorporateClientStatus,
  createdAt: z.string(),
  updatedAt: z.string(),
  totalAccounts: z.number(),
  financialPlans: z.array(FinancialPlanSchema),
});

export const FinancialPlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  corporateClientId: z.string(),
  planDetails: z.string(),
  monthlyFee: z.number(),
  minimumBalance: z.number(),
  interestRate: z.number(),
  maxWithdrawal: z.number(),
  status: FinancialPlanStatus,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type CorporateClient = z.infer<typeof CorporateClientSchema>;
export type FinancialPlan = z.infer<typeof FinancialPlanSchema>;

// Mock data for corporate clients
export const MOCK_CORPORATE_CLIENTS: CorporateClient[] = [
  {
    id: '1',
    name: 'Acme Corporation',
    contactPersonName: 'John Smith',
    contactEmail: 'jsmith@acme.com',
    status: CorporateClientStatus.ACTIVE,
    createdAt: '2023-01-15T00:00:00Z',
    updatedAt: '2023-04-20T00:00:00Z',
    totalAccounts: 250,
    financialPlans: [
      {
        id: '1',
        name: 'Acme Premium Savings Plan',
        description: 'High-yield savings for Acme corporate funds',
        corporateClientId: '1',
        planDetails: 'Full liquidity with competitive interest',
        monthlyFee: 25,
        minimumBalance: 5000,
        interestRate: 4.5,
        maxWithdrawal: 100000,
        status: FinancialPlanStatus.ACTIVE,
        createdAt: '2023-01-20T00:00:00Z',
        updatedAt: '2023-01-20T00:00:00Z',
      },
      {
        id: '2',
        name: 'Acme Basic Investment Plan',
        description: 'Balanced investment for Acme reserves',
        corporateClientId: '1',
        planDetails: 'Low-risk portfolio management',
        monthlyFee: 15,
        minimumBalance: 10000,
        interestRate: 3.2,
        maxWithdrawal: 50000,
        status: FinancialPlanStatus.ACTIVE,
        createdAt: '2023-01-20T00:00:00Z',
        updatedAt: '2023-01-20T00:00:00Z',
      }
    ]
  },
  {
    id: '2',
    name: 'Globex Corporation',
    contactPersonName: 'Jane Doe',
    contactEmail: 'jdoe@globex.com',
    status: CorporateClientStatus.ACTIVE,
    createdAt: '2023-02-10T00:00:00Z',
    updatedAt: '2023-05-15T00:00:00Z',
    totalAccounts: 500,
    financialPlans: [
      {
        id: '3',
        name: 'Globex Elite Investment Plan',
        description: 'Premium investment strategy for Globex corporate funds',
        corporateClientId: '2',
        planDetails: 'Diversified portfolio with high returns',
        monthlyFee: 35,
        minimumBalance: 25000,
        interestRate: 5.8,
        maxWithdrawal: 200000,
        status: FinancialPlanStatus.ACTIVE,
        createdAt: '2023-02-15T00:00:00Z',
        updatedAt: '2023-02-15T00:00:00Z',
      }
    ]
  },
  {
    id: '3',
    name: 'Initech',
    contactPersonName: 'Bill Lumbergh',
    contactEmail: 'blumbergh@initech.com',
    status: CorporateClientStatus.PENDING,
    createdAt: '2023-03-05T00:00:00Z',
    updatedAt: '2023-03-05T00:00:00Z',
    totalAccounts: 120,
    financialPlans: []
  }
];

// Create/update schemas
export const CreateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: UserRole,
  managerId: z.string().optional(),
  departmentId: z.string().optional(),
});

export const CreateDepartmentSchema = z.object({
  name: z.string().min(2, 'Department name must be at least 2 characters'),
  description: z.string().optional(),
  managerId: z.string(),
});

export const CreateProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  description: z.string().optional(),
  departmentId: z.string(),
  assignedUsers: z.array(z.string()),
  budget: z.number().positive('Budget must be positive').optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
});

export const CreateReportSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  type: z.string(),
  format: ReportFormat,
  filters: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    department: z.string().optional(),
    category: z.string().optional(),
    userId: z.string().optional(),
  }),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type CreateDepartmentInput = z.infer<typeof CreateDepartmentSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type CreateReportInput = z.infer<typeof CreateReportSchema>;