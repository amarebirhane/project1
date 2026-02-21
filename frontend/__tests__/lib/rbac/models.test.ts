import {
  UserType,
  Resource,
  Action,
  AdminType,
  DEFAULT_PERMISSIONS,
  DEFAULT_ROLES,
} from '@/lib/rbac/models'

describe('RBAC Models', () => {
  describe('UserType enum', () => {
    it('has correct enum values', () => {
      expect(UserType.ADMIN).toBe('ADMIN')
      expect(UserType.FINANCE_ADMIN).toBe('FINANCE_ADMIN')
      expect(UserType.ACCOUNTANT).toBe('ACCOUNTANT')
      expect(UserType.EMPLOYEE).toBe('EMPLOYEE')
    })
  })

  describe('Resource enum', () => {
    it('has correct resource values', () => {
      expect(Resource.USERS).toBe('users')
      expect(Resource.ROLES).toBe('roles')
      expect(Resource.REVENUES).toBe('revenues')
      expect(Resource.EXPENSES).toBe('expenses')
      expect(Resource.TRANSACTIONS).toBe('transactions')
      expect(Resource.REPORTS).toBe('reports')
      expect(Resource.DASHBOARD).toBe('dashboard')
      expect(Resource.PROFILE).toBe('profile')
      expect(Resource.DEPARTMENTS).toBe('departments')
      expect(Resource.PROJECTS).toBe('projects')
      expect(Resource.FINANCIAL_PLANS).toBe('financial_plans')
      expect(Resource.SETTINGS).toBe('settings')
    })
  })

  describe('Action enum', () => {
    it('has correct action values', () => {
      expect(Action.CREATE).toBe('create')
      expect(Action.READ).toBe('read')
      expect(Action.UPDATE).toBe('update')
      expect(Action.DELETE).toBe('delete')
      expect(Action.MANAGE).toBe('manage')
    })
  })

  describe('AdminType enum', () => {
    it('has correct admin type values', () => {
      expect(AdminType.ADMIN).toBe('ADMIN')
      expect(AdminType.FINANCE_ADMIN).toBe('FINANCE_ADMIN')
    })
  })

  describe('DEFAULT_PERMISSIONS', () => {
    it('is an array', () => {
      expect(Array.isArray(DEFAULT_PERMISSIONS)).toBe(true)
    })

    it('contains permissions', () => {
      expect(DEFAULT_PERMISSIONS.length).toBeGreaterThan(0)
    })

    it('each permission has required fields', () => {
      DEFAULT_PERMISSIONS.forEach(permission => {
        expect(permission).toHaveProperty('id')
        expect(permission).toHaveProperty('name')
        expect(permission).toHaveProperty('description')
        expect(permission).toHaveProperty('resource')
        expect(permission).toHaveProperty('action')
        expect(Object.values(Resource)).toContain(permission.resource)
        expect(Object.values(Action)).toContain(permission.action)
      })
    })

    it('has permissions for all major resources', () => {
      const resources = DEFAULT_PERMISSIONS.map(p => p.resource)
      expect(resources).toContain(Resource.USERS)
      expect(resources).toContain(Resource.ROLES)
      expect(resources).toContain(Resource.REVENUES)
      expect(resources).toContain(Resource.EXPENSES)
    })
  })

  describe('DEFAULT_ROLES', () => {
    it('is an array', () => {
      expect(Array.isArray(DEFAULT_ROLES)).toBe(true)
    })

    it('contains roles', () => {
      expect(DEFAULT_ROLES.length).toBeGreaterThan(0)
    })

    it('each role has required fields', () => {
      DEFAULT_ROLES.forEach(role => {
        expect(role).toHaveProperty('id')
        expect(role).toHaveProperty('name')
        expect(role).toHaveProperty('description')
        expect(role).toHaveProperty('permissions')
        expect(Array.isArray(role.permissions)).toBe(true)
      })
    })

    it('contains admin role', () => {
      const adminRole = DEFAULT_ROLES.find(r => r.name === UserType.ADMIN)
      expect(adminRole).toBeDefined()
      expect(adminRole?.permissions.length).toBeGreaterThan(0)
    })

    it('contains finance admin role', () => {
      const financeAdminRole = DEFAULT_ROLES.find(r => r.name === UserType.FINANCE_ADMIN)
      expect(financeAdminRole).toBeDefined()
    })

    it('contains accountant role', () => {
      const accountantRole = DEFAULT_ROLES.find(r => r.name === UserType.ACCOUNTANT)
      expect(accountantRole).toBeDefined()
    })

    it('contains employee role', () => {
      const employeeRole = DEFAULT_ROLES.find(r => r.name === UserType.EMPLOYEE)
      expect(employeeRole).toBeDefined()
    })
  })
})

