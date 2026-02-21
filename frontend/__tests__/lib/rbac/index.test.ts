import * as RBAC from '@/lib/rbac'

describe('RBAC Index Exports', () => {
  it('exports UserType enum', () => {
    expect(RBAC.UserType).toBeDefined()
    expect(RBAC.UserType.ADMIN).toBe('ADMIN')
  })

  it('exports Resource enum', () => {
    expect(RBAC.Resource).toBeDefined()
    expect(RBAC.Resource.USERS).toBe('users')
  })

  it('exports Action enum', () => {
    expect(RBAC.Action).toBeDefined()
    expect(RBAC.Action.CREATE).toBe('create')
  })

  it('exports DEFAULT_PERMISSIONS', () => {
    expect(RBAC.DEFAULT_PERMISSIONS).toBeDefined()
    expect(Array.isArray(RBAC.DEFAULT_PERMISSIONS)).toBe(true)
  })

  it('exports DEFAULT_ROLES', () => {
    expect(RBAC.DEFAULT_ROLES).toBeDefined()
    expect(Array.isArray(RBAC.DEFAULT_ROLES)).toBe(true)
  })
})

