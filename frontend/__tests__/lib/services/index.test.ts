import * as Services from '@/lib/services'

describe('Services Index Exports', () => {
  it('exports roleService', () => {
    expect(Services.roleService).toBeDefined()
  })

  it('exports RoleService class', () => {
    expect(Services.RoleService).toBeDefined()
  })

  it('exports permissionService', () => {
    expect(Services.permissionService).toBeDefined()
  })

  it('exports PermissionService class', () => {
    expect(Services.PermissionService).toBeDefined()
  })

  it('exports financeService', () => {
    expect(Services.financeService).toBeDefined()
  })

  it('exports FinanceService class', () => {
    expect(Services.FinanceService).toBeDefined()
  })
})

