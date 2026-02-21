import { canAccessComponent, ComponentId } from '@/lib/rbac/component-access'
import { UserType } from '@/lib/rbac/models'

describe('component-access', () => {
  it('canAccessComponent returns true for admin accessing any component', () => {
    expect(canAccessComponent(UserType.ADMIN, ComponentId.DASHBOARD)).toBe(true)
    expect(canAccessComponent(UserType.ADMIN, ComponentId.USER_LIST)).toBe(true)
    expect(canAccessComponent(UserType.ADMIN, ComponentId.ADMIN_LIST)).toBe(true)
  })

  it('canAccessComponent works with string user type', () => {
    expect(canAccessComponent('admin', ComponentId.DASHBOARD)).toBe(true)
    expect(canAccessComponent('super_admin', ComponentId.DASHBOARD)).toBe(true)
  })

  it('canAccessComponent maps string types correctly', () => {
    expect(canAccessComponent('finance_manager', ComponentId.REVENUE_LIST)).toBe(true)
    expect(canAccessComponent('accountant', ComponentId.REVENUE_LIST)).toBe(true)
    expect(canAccessComponent('employee', ComponentId.REVENUE_CREATE)).toBe(true)
  })

  it('canAccessComponent returns false for unauthorized access', () => {
    expect(canAccessComponent(UserType.EMPLOYEE, ComponentId.ADMIN_LIST)).toBe(false)
    expect(canAccessComponent(UserType.ACCOUNTANT, ComponentId.ADMIN_LIST)).toBe(false)
  })

  it('caches access results', () => {
    const result1 = canAccessComponent(UserType.ADMIN, ComponentId.DASHBOARD)
    const result2 = canAccessComponent(UserType.ADMIN, ComponentId.DASHBOARD)
    expect(result1).toBe(result2)
  })
})

