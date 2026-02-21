import { RoleService } from '@/lib/services/role-service'
import { UserType } from '@/lib/rbac/models'

// Mock apiClient - use jest.fn() directly in factory to avoid hoisting issues
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getRoles: jest.fn(),
    updateUserRole: jest.fn(),
    removeUserRole: jest.fn(),
  },
}))

import apiClient from '@/lib/api'

describe('RoleService', () => {
  let service: RoleService
  const mockGetRoles = apiClient.getRoles as jest.Mock

  beforeEach(() => {
    service = new RoleService()
    mockGetRoles.mockClear()
  })

  it('getAllRoles returns roles from API', async () => {
    const mockRoles = [
      {
        id: 1,
        name: UserType.ADMIN,
        description: 'Administrator',
        permissions: ['users:read', 'users:create'],
      },
    ]
    mockGetRoles.mockResolvedValue({ data: mockRoles })

    const roles = await service.getAllRoles()
    expect(roles.length).toBeGreaterThan(0)
    expect(mockGetRoles).toHaveBeenCalled()
  })

  it('getAllRoles returns empty array when API fails', async () => {
    // Suppress console.error for this test since we're intentionally testing error handling
    const originalError = console.error
    console.error = jest.fn()
    
    mockGetRoles.mockRejectedValue(new Error('API Error'))

    const roles = await service.getAllRoles()
    expect(roles).toEqual([])
    
    // Restore console.error
    console.error = originalError
  })

  it('getRoleById returns role when found', async () => {
    const mockRoles = [
      {
        id: 1,
        name: UserType.ADMIN,
        description: 'Administrator',
        permissions: ['users:read'],
      },
    ]
    mockGetRoles.mockResolvedValue({ data: mockRoles })

    const role = await service.getRoleById(UserType.ADMIN)
    expect(role).not.toBeNull()
    expect(role?.name).toBe(UserType.ADMIN)
  })

  it('getRoleById returns null when not found', async () => {
    mockGetRoles.mockResolvedValue({ data: [] })

    const role = await service.getRoleById('NONEXISTENT')
    expect(role).toBeNull()
  })

  it('getRolePermissions returns permissions for role', async () => {
    const mockRoles = [
      {
        id: 1,
        name: UserType.ADMIN,
        description: 'Administrator',
        permissions: ['users:read', 'users:create'],
      },
    ]
    mockGetRoles.mockResolvedValue({ data: mockRoles })

    const permissions = await service.getRolePermissions(UserType.ADMIN)
    expect(permissions).toBeInstanceOf(Array)
  })

  it('getRolesByUserType returns roles', async () => {
    const mockRoles = [
      {
        id: 1,
        name: UserType.ADMIN,
        description: 'Administrator',
        permissions: ['users:read'],
      },
    ]
    mockGetRoles.mockResolvedValue({ data: mockRoles })

    const roles = await service.getRolesByUserType(UserType.ADMIN)
    expect(roles).toBeInstanceOf(Array)
  })
})

