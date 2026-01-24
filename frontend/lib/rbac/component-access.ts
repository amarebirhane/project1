// lib/rbac/component-access.ts
import { UserType } from './models';

// Common components
export enum ComponentId {
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

    // Forecast management components
    FORECAST_LIST = 'forecast.list',
    FORECAST_VIEW = 'forecast.view',
    FORECAST_CREATE = 'forecast.create',
    FORECAST_EDIT = 'forecast.edit',
    FORECAST_DELETE = 'forecast.delete',

    // Scenario management components
    SCENARIO_LIST = 'scenario.list',
    SCENARIO_CREATE = 'scenario.create',
    SCENARIO_COMPARE = 'scenario.compare',

    // Budget management components
    BUDGET_LIST = 'budget.list',
    BUDGET_CREATE = 'budget.create',
    BUDGET_EDIT = 'budget.edit',
    BUDGET_DELETE = 'budget.delete',

    // Variance management components
    VARIANCE_CALCULATE = 'variance.calculate',
    VARIANCE_HISTORY = 'variance.history',
    VARIANCE_SUMMARY = 'variance.summary',

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

    // Profile components
    PROFILE_VIEW = 'profile.view',
    PROFILE_EDIT = 'profile.edit',

    // Settings components
    SETTINGS_VIEW = 'settings.view',
    SETTINGS_EDIT = 'settings.edit',

    // Admin management components (Super Admin accounts)
    ADMIN_LIST = 'admin.list',
    ADMIN_CREATE = 'admin.create',
    ADMIN_EDIT = 'admin.edit',
    ADMIN_DELETE = 'admin.delete',

    // Permission management components
    PERMISSION_VIEW = 'permission.view',
    PERMISSION_EDIT = 'permission.edit',

    // Finance/Finance Manager management components (Renamed for clarity)
    FINANCE_MANAGER_LIST = 'finance_manager.list',
    FINANCE_MANAGER_CREATE = 'finance_manager.create',
    FINANCE_MANAGER_EDIT = 'finance_manager.edit',
    FINANCE_MANAGER_DELETE = 'finance_manager.delete',

    // Accountant management components
    ACCOUNTANT_LIST = 'accountant.list',
    ACCOUNTANT_CREATE = 'accountant.create',
    ACCOUNTANT_EDIT = 'accountant.edit',
    ACCOUNTANT_DELETE = 'accountant.delete',

    // Employee management components
    EMPLOYEE_LIST = 'employee.list',
    EMPLOYEE_CREATE = 'employee.create',
    EMPLOYEE_EDIT = 'employee.edit',
    EMPLOYEE_DELETE = 'employee.delete',

    // Dashboard components
    ADMIN_DASHBOARD = 'admin.dashboard',
    FINANCE_MANAGER_DASHBOARD = 'finance_manager.dashboard',
    ACCOUNTANT_DASHBOARD = 'accountant.dashboard',
    EMPLOYEE_DASHBOARD = 'employee.dashboard',

    // Sidebar components (Refined and added missing IDs)
    SIDEBAR_DASHBOARD = 'sidebar.dashboard',
    SIDEBAR_PROFILE = 'sidebar.profile',
    SIDEBAR_SETTINGS = 'sidebar.settings',
    SIDEBAR_USERS = 'sidebar.users',
    SIDEBAR_BUDGETS = 'sidebar.budgets',
    SIDEBAR_PERMISSIONS = 'sidebar.permissions',
    SIDEBAR_REVENUE = 'sidebar.revenue',
    SIDEBAR_EXPENSE = 'sidebar.expense',
    SIDEBAR_TRANSACTION = 'sidebar.transaction',
    SIDEBAR_REPORT = 'sidebar.report',
    SIDEBAR_FORECAST = 'sidebar.forecast',
    SIDEBAR_SCENARIO = 'sidebar.scenario',
    SIDEBAR_VARIANCE = 'sidebar.variance',
    SIDEBAR_DEPARTMENT = 'sidebar.department',
    SIDEBAR_PROJECT = 'sidebar.project',
    SIDEBAR_INVENTORY = 'sidebar.inventory',
    SIDEBAR_SALES = 'sidebar.sales',
    SIDEBAR_FINANCE_ADMINS = 'sidebar.finance_admins',
    SIDEBAR_ACCOUNTANTS = 'sidebar.accountants',
    SIDEBAR_EMPLOYEES = 'sidebar.employees',
    SIDEBAR_AUDIT_LOGS = 'sidebar.audit_logs',
    SIDEBAR_FEEDBACK = 'sidebar.feedback',

    // Inventory Sales components
    INVENTORY_SALES = 'inventory.sales',
}

/**
 * Maps user types to the components they can access
 */
export const USER_TYPE_COMPONENT_MAP: Record<UserType, ComponentId[]> = {
    [UserType.ADMIN]: [
        // Common
        ComponentId.LOGIN,
        ComponentId.HEADER,
        ComponentId.ADMIN_DASHBOARD,
        ComponentId.SIDEBAR_DASHBOARD,
        ComponentId.SIDEBAR_PROFILE,
        ComponentId.SIDEBAR_SETTINGS,

        // All Management & CRUD
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
        ComponentId.FORECAST_LIST,
        ComponentId.FORECAST_VIEW,
        ComponentId.FORECAST_CREATE,
        ComponentId.FORECAST_EDIT,
        ComponentId.FORECAST_DELETE,
        ComponentId.SCENARIO_LIST,
        ComponentId.SCENARIO_CREATE,
        ComponentId.SCENARIO_COMPARE,
        ComponentId.VARIANCE_CALCULATE,
        ComponentId.VARIANCE_HISTORY,
        ComponentId.VARIANCE_SUMMARY,
        ComponentId.BUDGET_LIST,
        ComponentId.BUDGET_CREATE,
        ComponentId.BUDGET_EDIT,
        ComponentId.BUDGET_DELETE,
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
        ComponentId.ADMIN_LIST,
        ComponentId.ADMIN_CREATE,
        ComponentId.ADMIN_EDIT,
        ComponentId.ADMIN_DELETE,
        ComponentId.PERMISSION_VIEW,
        ComponentId.PERMISSION_EDIT,

        // **NEW/UPDATED ADMIN USER MANAGEMENT COMPONENTS**
        ComponentId.FINANCE_MANAGER_LIST,
        ComponentId.FINANCE_MANAGER_CREATE,
        ComponentId.FINANCE_MANAGER_EDIT,
        ComponentId.FINANCE_MANAGER_DELETE,
        ComponentId.ACCOUNTANT_LIST,
        ComponentId.ACCOUNTANT_CREATE,
        ComponentId.ACCOUNTANT_EDIT,
        ComponentId.ACCOUNTANT_DELETE,
        ComponentId.EMPLOYEE_LIST,
        ComponentId.EMPLOYEE_CREATE,
        ComponentId.EMPLOYEE_EDIT,
        ComponentId.EMPLOYEE_DELETE,

        // Sidebar for all links
        ComponentId.SIDEBAR_USERS,
        ComponentId.SIDEBAR_REVENUE,
        ComponentId.SIDEBAR_EXPENSE,
        ComponentId.SIDEBAR_TRANSACTION,
        ComponentId.SIDEBAR_REPORT,
        ComponentId.SIDEBAR_FORECAST,
        ComponentId.SIDEBAR_SCENARIO,
        ComponentId.SIDEBAR_VARIANCE,
        ComponentId.SIDEBAR_DEPARTMENT,
        ComponentId.SIDEBAR_PROJECT,
        ComponentId.SIDEBAR_FINANCE_ADMINS,
        ComponentId.SIDEBAR_ACCOUNTANTS,
        ComponentId.SIDEBAR_EMPLOYEES,
        ComponentId.SIDEBAR_AUDIT_LOGS,
        ComponentId.SIDEBAR_FEEDBACK,
        ComponentId.INVENTORY_SALES,
    ],

    [UserType.FINANCE_ADMIN]: [
        ComponentId.LOGIN,
        ComponentId.HEADER,
        ComponentId.FINANCE_MANAGER_DASHBOARD,
        ComponentId.SIDEBAR_DASHBOARD,
        ComponentId.SIDEBAR_PROFILE,
        ComponentId.SIDEBAR_SETTINGS,
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
        ComponentId.FORECAST_LIST,
        ComponentId.FORECAST_VIEW,
        ComponentId.FORECAST_CREATE,
        ComponentId.FORECAST_EDIT,
        ComponentId.FORECAST_DELETE,
        ComponentId.SCENARIO_LIST,
        ComponentId.SCENARIO_CREATE,
        ComponentId.SCENARIO_COMPARE,
        ComponentId.VARIANCE_CALCULATE,
        ComponentId.VARIANCE_HISTORY,
        ComponentId.VARIANCE_SUMMARY,
        ComponentId.BUDGET_LIST,
        ComponentId.BUDGET_CREATE,
        ComponentId.BUDGET_EDIT,
        ComponentId.BUDGET_DELETE,
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

        // **NEW/UPDATED FINANCE ADMIN USER MANAGEMENT COMPONENTS**
        ComponentId.ACCOUNTANT_LIST,
        ComponentId.ACCOUNTANT_CREATE,
        ComponentId.ACCOUNTANT_EDIT,
        ComponentId.ACCOUNTANT_DELETE,
        ComponentId.EMPLOYEE_LIST,
        ComponentId.EMPLOYEE_CREATE,
        ComponentId.EMPLOYEE_EDIT,
        ComponentId.EMPLOYEE_DELETE,
        ComponentId.PERMISSION_VIEW,
        ComponentId.PERMISSION_EDIT,

        // Sidebar
        ComponentId.SIDEBAR_USERS,
        ComponentId.SIDEBAR_PERMISSIONS,
        ComponentId.SIDEBAR_REVENUE,
        ComponentId.SIDEBAR_EXPENSE,
        ComponentId.SIDEBAR_TRANSACTION,
        ComponentId.SIDEBAR_REPORT,
        ComponentId.SIDEBAR_FORECAST,
        ComponentId.SIDEBAR_SCENARIO,
        ComponentId.SIDEBAR_VARIANCE,
        ComponentId.SIDEBAR_BUDGETS,
        ComponentId.SIDEBAR_PROJECT,
        ComponentId.SIDEBAR_ACCOUNTANTS,
        ComponentId.SIDEBAR_EMPLOYEES,
        ComponentId.SIDEBAR_AUDIT_LOGS,
        ComponentId.SIDEBAR_FEEDBACK,
        ComponentId.INVENTORY_SALES,
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
        ComponentId.TRANSACTION_APPROVE,
        ComponentId.REPORT_LIST,
        ComponentId.REPORT_CREATE,
        ComponentId.REPORT_EDIT,
        ComponentId.FORECAST_LIST,
        ComponentId.FORECAST_VIEW,
        ComponentId.PROFILE_VIEW,
        ComponentId.PROFILE_EDIT,
        // Sidebar - Added inventory and sales access for viewing items and sales
        ComponentId.SIDEBAR_REVENUE,
        ComponentId.SIDEBAR_EXPENSE,
        ComponentId.SIDEBAR_TRANSACTION,
        ComponentId.SIDEBAR_REPORT,
        ComponentId.SIDEBAR_FORECAST,
        ComponentId.SIDEBAR_INVENTORY,
        ComponentId.SIDEBAR_SALES,
        ComponentId.INVENTORY_SALES,
        ComponentId.SIDEBAR_FEEDBACK,
        ComponentId.SIDEBAR_SETTINGS,
        ComponentId.SETTINGS_VIEW,
        ComponentId.SETTINGS_EDIT,
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
        ComponentId.FORECAST_LIST,
        ComponentId.FORECAST_VIEW,
        ComponentId.PROFILE_VIEW,
        ComponentId.PROFILE_EDIT,
        // Sidebar
        ComponentId.SIDEBAR_REVENUE,
        ComponentId.SIDEBAR_EXPENSE,
        ComponentId.SIDEBAR_FORECAST,
        ComponentId.INVENTORY_SALES,
        ComponentId.SIDEBAR_FEEDBACK,
        ComponentId.SIDEBAR_SETTINGS,
        ComponentId.SETTINGS_VIEW,
        ComponentId.SETTINGS_EDIT,
    ],
};

const accessCache = new Map<string, boolean>();

export const canAccessComponent = (
    userType: UserType | string,
    componentId: ComponentId
): boolean => {
    // Normalize userType to UserType enum
    let normalizedUserType: UserType;

    if (typeof userType === 'string') {
        // Map string to UserType enum
        const typeMap: Record<string, UserType> = {
            'admin': UserType.ADMIN,
            'super_admin': UserType.ADMIN,
            'finance_admin': UserType.FINANCE_ADMIN,
            'finance_manager': UserType.FINANCE_ADMIN,
            'manager': UserType.FINANCE_ADMIN,
            'accountant': UserType.ACCOUNTANT,
            'employee': UserType.EMPLOYEE,
        };
        normalizedUserType = typeMap[userType.toLowerCase()] || UserType.EMPLOYEE;
    } else {
        normalizedUserType = userType;
    }

    const cacheKey = `${normalizedUserType}:${componentId}`;
    if (accessCache.has(cacheKey)) {
        return accessCache.get(cacheKey)!;
    }

    // Admin always gets access
    if (normalizedUserType === UserType.ADMIN) {
        accessCache.set(cacheKey, true);
        return true;
    }

    // Check mapping
    const allowedComponents = USER_TYPE_COMPONENT_MAP[normalizedUserType] ?? [];
    const result = allowedComponents.includes(componentId);

    accessCache.set(cacheKey, result);
    return result;
};