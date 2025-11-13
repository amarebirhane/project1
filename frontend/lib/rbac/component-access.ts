// lib/rbac/component-access.ts
import { UserType, Resource } from './models';

/**
 * Component access codes for role-based access control
 * Each component in the system should have a unique component ID
 */
export enum ComponentId {
  // Common components
  LOGIN = 'com.login',
  HEADER = 'com.header',
  DASHBOARD = 'com.dashboard',
  
  // User management components
  USER_LIST = 'users.list',
  USER_CREATE = 'users.create',
  USER_EDIT = 'users.edit',
  USER_DELETE = 'users.delete',
  
  // Revenue management components
  REVENUE_LIST = 'revenue.list',
  REVENUE_CREATE = 'revenue.create',
  REVENUE_EDIT = 'revenue.edit',
  REVENUE_DELETE = 'revenue.delete',
  FINANCE_MANAGER_DASHBOARD = "finance_manager.dashboard",
  
  // Expense management components
  EXPENSE_LIST = 'expense.list',
  EXPENSE_CREATE = 'expense.create',
  EXPENSE_EDIT = 'expense.edit',
  EXPENSE_DELETE = 'expense.delete',
  
  // Transaction management components
  TRANSACTION_LIST = 'transaction.list',
  TRANSACTION_APPROVE = 'transaction.approve',
  TRANSACTION_REJECT = 'transaction.reject',
  
  // Report management components
  REPORT_LIST = 'report.list',
  REPORT_CREATE = 'report.create',
  REPORT_EDIT = 'report.edit',
  REPORT_DELETE = 'report.delete',
  
  // Department management components
  DEPARTMENT_LIST = 'department.list',
  DEPARTMENT_CREATE = 'department.create',
  DEPARTMENT_EDIT = 'department.edit',
  DEPARTMENT_DELETE = 'department.delete',
  
  // Project management components
  PROJECT_LIST = 'project.list',
  PROJECT_CREATE = 'project.create',
  PROJECT_EDIT = 'project.edit',
  PROJECT_DELETE = 'project.delete',
  
  // Corporate Client management components
  CORPORATE_CLIENT_LIST = 'corporate_client.list',
  CORPORATE_CLIENT_CREATE = 'corporate_client.create',
  CORPORATE_CLIENT_EDIT = 'corporate_client.edit',
  CORPORATE_CLIENT_DELETE = 'corporate_client.delete',
  
  // Financial Plan management components
  FINANCIAL_PLAN_LIST = 'financial_plan.list',
  FINANCIAL_PLAN_CREATE = 'financial_plan.create',
  FINANCIAL_PLAN_EDIT = 'financial_plan.edit',
  FINANCIAL_PLAN_DELETE = 'financial_plan.delete',
  
  // Profile components
  PROFILE_VIEW = 'profile.view',
  PROFILE_EDIT = 'profile.edit',
  
  // Settings components
  SETTINGS_VIEW = 'settings.view',
  SETTINGS_EDIT = 'settings.edit',
  
  // Admin management components
  ADMIN_LIST = 'admin.list',
  ADMIN_CREATE = 'admin.create',
  ADMIN_EDIT = 'admin.edit',
  ADMIN_DELETE = 'admin.delete',
  
  // Permission management components
  PERMISSION_VIEW = 'permission.view',
  PERMISSION_EDIT = 'permission.edit',
  
  // Sidebar components
  SIDEBAR_DASHBOARD = 'sidebar.dashboard',
  SIDEBAR_CREATE_FINANCE = 'sidebar.create_finance',
  SIDEBAR_FINANCE_CREATE = 'sidebar.finance_create',
  SIDEBAR_FINANCE_LIST = 'sidebar.finance_list',
  SIDEBAR_FINANCE_EDIT = 'sidebar.finance_edit',
  SIDEBAR_FINANCE_DELETE = 'sidebar.finance_delete',
  SIDEBAR_ADMINS = 'sidebar.admins',
  SIDEBAR_PROFILE = 'sidebar.profile',
  SIDEBAR_SETTINGS = 'sidebar.settings',
  SIDEBAR_USERS = 'sidebar.users',
  SIDEBAR_PERMISSIONS = 'sidebar.permissions',
  SIDEBAR_REVENUE = 'sidebar.revenue',
  SIDEBAR_EXPENSE = 'sidebar.expense',
  SIDEBAR_TRANSACTION = 'sidebar.transaction',
  SIDEBAR_REPORT = 'sidebar.report',
  SIDEBAR_DEPARTMENT = 'sidebar.department',
  SIDEBAR_PROJECT = 'sidebar.project',
  SIDEBAR_CORPORATE_CLIENT = 'sidebar.corporate_client',
  SIDEBAR_FINANCIAL_PLAN = 'sidebar.financial_plan',
  
  // Finance management components
  FINANCE_LIST = 'finance.list',
  FINANCE_CREATE = 'finance.create',
  FINANCE_EDIT = 'finance.edit',
  FINANCE_DELETE = 'finance.delete',
  ADMIN_DASHBOARD = 'admin.dashboard',
  FINANCE_MANAGER_DASHBOARD = 'finance_manager.dashboard',
  ACCOUNTANT_DASHBOARD = 'accountant.dashboard',
  EMPLOYEE_DASHBOARD = 'employee.dashboard',
  ADMIN_LIST = 'admin.list',
  ADMIN_CREATE = 'admin.create',
  ADMIN_EDIT = 'admin.edit',
  ADMIN_DELETE = 'admin.delete',
  ADMIN_PERMISSION = 'admin.permission',
  
  // Accountant management components
  ACCOUNTANT_LIST = 'accountant.list',
  ACCOUNTANT_CREATE = 'accountant.create',
  ACCOUNTANT_EDIT = 'accountant.edit',
  ACCOUNTANT_DELETE = 'accountant.delete',
  ACCOUNTANT_PERMISSION = 'accountant.permission',
  
  // Employee management components
  EMPLOYEE_LIST = 'employee.list',
  EMPLOYEE_CREATE = 'employee.create',
  EMPLOYEE_EDIT = 'employee.edit',
  EMPLOYEE_DELETE = 'employee.delete',
}

/**
 * Maps user types to the components they can access
 */
export const USER_TYPE_COMPONENT_MAP: Record<UserType, ComponentId[]> = {
  [UserType.ADMIN]: [
    // Common components
    ComponentId.LOGIN,
    ComponentId.HEADER,
    ComponentId.ADMIN_DASHBOARD,
    ComponentId.SIDEBAR_DASHBOARD,
    ComponentId.SIDEBAR_PROFILE,
    ComponentId.SIDEBAR_SETTINGS,
    
    // All management components
    ComponentId.USER_LIST,
    ComponentId.USER_CREATE,
    ComponentId.USER_EDIT,
    ComponentId.USER_DELETE,
    ComponentId.REVENUE_LIST,
    ComponentId.REVENUE_CREATE,
    ComponentId.REVENUE_EDIT,
    ComponentId.REVENUE_DELETE,
    ComponentId.EXPENSE_LIST,
    ComponentId.EXPENSE_CREATE,
    ComponentId.EXPENSE_EDIT,
    ComponentId.EXPENSE_DELETE,
    ComponentId.TRANSACTION_LIST,
    ComponentId.TRANSACTION_APPROVE,
    ComponentId.TRANSACTION_REJECT,
    ComponentId.REPORT_LIST,
    ComponentId.REPORT_CREATE,
    ComponentId.REPORT_EDIT,
    ComponentId.REPORT_DELETE,
    ComponentId.DEPARTMENT_LIST,
    ComponentId.DEPARTMENT_CREATE,
    ComponentId.DEPARTMENT_EDIT,
    ComponentId.DEPARTMENT_DELETE,
    ComponentId.PROJECT_LIST,
    ComponentId.PROJECT_CREATE,
    ComponentId.PROJECT_EDIT,
    ComponentId.PROJECT_DELETE,
    ComponentId.CORPORATE_CLIENT_LIST,
    ComponentId.CORPORATE_CLIENT_CREATE,
    ComponentId.CORPORATE_CLIENT_EDIT,
    ComponentId.CORPORATE_CLIENT_DELETE,
    ComponentId.FINANCIAL_PLAN_LIST,
    ComponentId.FINANCIAL_PLAN_CREATE,
    ComponentId.FINANCIAL_PLAN_EDIT,
    ComponentId.FINANCIAL_PLAN_DELETE,
    ComponentId.PROFILE_VIEW,
    ComponentId.PROFILE_EDIT,
    ComponentId.SETTINGS_VIEW,
    ComponentId.SETTINGS_EDIT,
    ComponentId.ADMIN_LIST,
    ComponentId.ADMIN_CREATE,
    ComponentId.ADMIN_EDIT,
    ComponentId.ADMIN_DELETE,
    ComponentId.PERMISSION_VIEW,
    ComponentId.PERMISSION_EDIT,
    // Sidebar for all
    ComponentId.SIDEBAR_USERS,
    ComponentId.SIDEBAR_ROLES,
    ComponentId.SIDEBAR_REVENUE,
    ComponentId.SIDEBAR_EXPENSE,
    ComponentId.SIDEBAR_TRANSACTION,
    ComponentId.SIDEBAR_REPORT,
    ComponentId.SIDEBAR_DEPARTMENT,
    ComponentId.SIDEBAR_PROJECT,
    ComponentId.SIDEBAR_CORPORATE_CLIENT,
    ComponentId.SIDEBAR_FINANCIAL_PLAN,
  ],
  
  [UserType.FINANCE_MANAGER]: [
    // Common components
    ComponentId.LOGIN,
    ComponentId.HEADER,
    ComponentId.FINANCE_MANAGER_DASHBOARD,
    ComponentId.SIDEBAR_DASHBOARD,
    ComponentId.SIDEBAR_PROFILE,
    ComponentId.SIDEBAR_SETTINGS,
    
    // Management for subordinates
    ComponentId.USER_LIST,
    ComponentId.USER_CREATE,
    ComponentId.USER_EDIT,
    ComponentId.USER_DELETE,
    ComponentId.REVENUE_LIST,
    ComponentId.REVENUE_CREATE,
    ComponentId.REVENUE_EDIT,
    ComponentId.REVENUE_DELETE,
    ComponentId.EXPENSE_LIST,
    ComponentId.EXPENSE_CREATE,
    ComponentId.EXPENSE_EDIT,
    ComponentId.EXPENSE_DELETE,
    ComponentId.TRANSACTION_LIST,
    ComponentId.TRANSACTION_APPROVE,
    ComponentId.TRANSACTION_REJECT,
    ComponentId.REPORT_LIST,
    ComponentId.REPORT_CREATE,
    ComponentId.REPORT_EDIT,
    ComponentId.REPORT_DELETE,
    ComponentId.DEPARTMENT_LIST,
    ComponentId.DEPARTMENT_CREATE,
    ComponentId.DEPARTMENT_EDIT,
    ComponentId.DEPARTMENT_DELETE,
    ComponentId.PROJECT_LIST,
    ComponentId.PROJECT_CREATE,
    ComponentId.PROJECT_EDIT,
    ComponentId.PROJECT_DELETE,
    ComponentId.PROFILE_VIEW,
    ComponentId.PROFILE_EDIT,
    ComponentId.SETTINGS_VIEW,
    ComponentId.SETTINGS_EDIT,
    // Sidebar
    ComponentId.SIDEBAR_USERS,
    ComponentId.SIDEBAR_REVENUE,
    ComponentId.SIDEBAR_EXPENSE,
    ComponentId.SIDEBAR_TRANSACTION,
    ComponentId.SIDEBAR_REPORT,
    ComponentId.SIDEBAR_DEPARTMENT,
    ComponentId.SIDEBAR_PROJECT,
  ],
  
  [UserType.ACCOUNTANT]: [
    ComponentId.LOGIN,
    ComponentId.HEADER,
    ComponentId.ACCOUNTANT_DASHBOARD,
    ComponentId.SIDEBAR_DASHBOARD,
    ComponentId.SIDEBAR_PROFILE,
    ComponentId.REVENUE_LIST,
    ComponentId.REVENUE_CREATE,
    ComponentId.REVENUE_EDIT,
    ComponentId.EXPENSE_LIST,
    ComponentId.EXPENSE_CREATE,
    ComponentId.EXPENSE_EDIT,
    ComponentId.TRANSACTION_LIST,
    ComponentId.REPORT_LIST,
    ComponentId.REPORT_CREATE,
    ComponentId.PROFILE_VIEW,
    ComponentId.PROFILE_EDIT,
    // Sidebar
    ComponentId.SIDEBAR_REVENUE,
    ComponentId.SIDEBAR_EXPENSE,
    ComponentId.SIDEBAR_TRANSACTION,
    ComponentId.SIDEBAR_REPORT,
  ],
  
  [UserType.EMPLOYEE]: [
    ComponentId.LOGIN,
    ComponentId.HEADER,
    ComponentId.EMPLOYEE_DASHBOARD,
    ComponentId.SIDEBAR_DASHBOARD,
    ComponentId.SIDEBAR_PROFILE,
    ComponentId.REVENUE_CREATE,
    ComponentId.REVENUE_EDIT,
    ComponentId.EXPENSE_CREATE,
    ComponentId.EXPENSE_EDIT,
    ComponentId.PROFILE_VIEW,
    ComponentId.PROFILE_EDIT,
    // Sidebar
    ComponentId.SIDEBAR_REVENUE,
    ComponentId.SIDEBAR_EXPENSE,
  ],
};

/**
 * Cache for component access checks to improve performance
 */
const accessCache = new Map<string, boolean>();

/**
 * Enhanced component access check that considers userType
 */
export const canAccessComponent = (
  userType: UserType | string, 
  componentId: ComponentId
): boolean => {
  // Create cache key
  const cacheKey = `${userType}:${componentId}`;
  
  // Check cache first
  if (accessCache.has(cacheKey)) {
    return accessCache.get(cacheKey)!;
  }

  // Normalize userType to lowercase for comparison
  const normalizedUserType = userType.toLowerCase();

  // Admin has full access
  if (normalizedUserType === UserType.ADMIN) {
    accessCache.set(cacheKey, true);
    return true;
  }

  // Get the components allowed for this user type
  const allowedComponents = USER_TYPE_COMPONENT_MAP[userType as UserType] || [];

  const hasAccess = allowedComponents.includes(componentId);

  // Cache the result
  accessCache.set(cacheKey, hasAccess);
  return hasAccess;
};

/**
 * Helper function to check component access by resource and action
 */
export const canAccessComponentByPermission = (
  resource: Resource, 
  action: string, 
  componentId: ComponentId
): boolean => {
  // Get components allowed for this resource/action combination
  const componentsForAction = getComponentsForResourceAction(resource, action);
  return componentsForAction.includes(componentId);
};

/**
 * Helper function to get components for a resource/action combination
 */
const getComponentsForResourceAction = (
  resource: Resource,
  action: string
): ComponentId[] => {
  // Map resources and actions to component IDs
  const resourceActionMap: Record<string, Record<string, ComponentId[]>> = {
    users: {
      read: [ComponentId.USER_LIST],
      create: [ComponentId.USER_CREATE],
      update: [ComponentId.USER_EDIT],
      delete: [ComponentId.USER_DELETE]
    },
    revenues: {
      read: [ComponentId.REVENUE_LIST],
      create: [ComponentId.REVENUE_CREATE],
      update: [ComponentId.REVENUE_EDIT],
      delete: [ComponentId.REVENUE_DELETE]
    },
    expenses: {
      read: [ComponentId.EXPENSE_LIST],
      create: [ComponentId.EXPENSE_CREATE],
      update: [ComponentId.EXPENSE_EDIT],
      delete: [ComponentId.EXPENSE_DELETE]
    },
    transactions: {
      read: [ComponentId.TRANSACTION_LIST],
      manage: [ComponentId.TRANSACTION_APPROVE, ComponentId.TRANSACTION_REJECT]
    },
    reports: {
      read: [ComponentId.REPORT_LIST],
      create: [ComponentId.REPORT_CREATE],
      update: [ComponentId.REPORT_EDIT],
      delete: [ComponentId.REPORT_DELETE]
    },
    departments: {
      read: [ComponentId.DEPARTMENT_LIST],
      create: [ComponentId.DEPARTMENT_CREATE],
      update: [ComponentId.DEPARTMENT_EDIT],
      delete: [ComponentId.DEPARTMENT_DELETE]
    },
    projects: {
      read: [ComponentId.PROJECT_LIST],
      create: [ComponentId.PROJECT_CREATE],
      update: [ComponentId.PROJECT_EDIT],
      delete: [ComponentId.PROJECT_DELETE]
    },
    corporate_clients: {
      read: [ComponentId.CORPORATE_CLIENT_LIST],
      create: [ComponentId.CORPORATE_CLIENT_CREATE],
      update: [ComponentId.CORPORATE_CLIENT_EDIT],
      delete: [ComponentId.CORPORATE_CLIENT_DELETE]
    },
    financial_plans: {
      read: [ComponentId.FINANCIAL_PLAN_LIST],
      create: [ComponentId.FINANCIAL_PLAN_CREATE],
      update: [ComponentId.FINANCIAL_PLAN_EDIT],
      delete: [ComponentId.FINANCIAL_PLAN_DELETE]
    },
  };

  return resourceActionMap[resource]?.[action as Action] || [];
};