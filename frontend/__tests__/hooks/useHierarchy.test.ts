import { renderHook, act, waitFor } from '@testing-library/react'
import { useHierarchy } from '@/hooks/useHierarchy'
import { Role, Permission, UserType, Resource, Action } from '@/lib/rbac/models'

jest.mock('@/lib/services/role-service', () => ({
  roleService: {
    getAllRoles: jest.fn(),
    getRolesByUserType: jest.fn(),
    assignRoleToUser: jest.fn(),
    removeRoleFromUser: jest.fn(),
    getRolePermissions: jest.fn(),
  },
}))

type RoleServiceMock = {
  getAllRoles: jest.Mock
  getRolesByUserType: jest.Mock
  assignRoleToUser: jest.Mock
  removeRoleFromUser: jest.Mock
  getRolePermissions: jest.Mock
}

const { roleService: mockRoleService } = jest.requireMock('@/lib/services/role-service') as {
  roleService: RoleServiceMock
}

const basePermissions: Permission[] = [
  {
    id: 'perm-1',
    name: 'Read Users',
    description: 'Can read users',
    resource: Resource.USERS,
    action: Action.READ,
  },
]

const mockRoles: Role[] = [
  {
    id: 'role-1',
    name: 'ADMIN',
    description: 'Administrator',
    permissions: basePermissions,
  },
]

const managerRoles: Role[] = [
  {
    id: 'role-2',
    name: 'FINANCE_ADMIN',
    description: 'Finance Admin',
    permissions: basePermissions,
  },
]

describe('useHierarchy', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.values(mockRoleService).forEach((mockFn) => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockReset()
      }
    })
  })

  it('fetches all roles on mount by default', async () => {
    mockRoleService.getAllRoles.mockResolvedValue(mockRoles)

    const { result } = renderHook(() => useHierarchy())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockRoleService.getAllRoles).toHaveBeenCalledTimes(1)
    expect(result.current.roles).toEqual(mockRoles)
    expect(result.current.error).toBeNull()
  })

  it('fetches roles for provided userType', async () => {
    mockRoleService.getRolesByUserType.mockResolvedValue(managerRoles)

    const { result } = renderHook(() => useHierarchy({ userType: UserType.FINANCE_ADMIN }))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(mockRoleService.getRolesByUserType).toHaveBeenCalledWith(UserType.FINANCE_ADMIN)
    expect(result.current.roles).toEqual(managerRoles)
  })

  it('surfaces an error when role fetching fails', async () => {
    mockRoleService.getAllRoles.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useHierarchy())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe('Network error')
    expect(result.current.roles).toEqual([])
  })

  it('assignRole delegates to the role service', async () => {
    mockRoleService.getAllRoles.mockResolvedValue(mockRoles)
    const updatedUser = { id: '123', role: 'ACCOUNTANT' }
    mockRoleService.assignRoleToUser.mockResolvedValue(updatedUser)

    const { result } = renderHook(() => useHierarchy())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      const response = await result.current.assignRole('123', UserType.ACCOUNTANT)
      expect(response).toEqual(updatedUser)
    })

    expect(mockRoleService.assignRoleToUser).toHaveBeenCalledWith('123', UserType.ACCOUNTANT)
  })

  it('removeRole returns null and sets error when service fails', async () => {
    mockRoleService.getAllRoles.mockResolvedValue(mockRoles)
    mockRoleService.removeRoleFromUser.mockRejectedValue(new Error('Failed to remove'))

    const { result } = renderHook(() => useHierarchy())
    await waitFor(() => expect(result.current.loading).toBe(false))

    await act(async () => {
      const response = await result.current.removeRole('999')
      expect(response).toBeNull()
    })

    expect(result.current.error).toBe('Failed to remove')
  })

  it('getPermissions returns permissions and falls back to [] on error', async () => {
    mockRoleService.getAllRoles.mockResolvedValue(mockRoles)
    mockRoleService.getRolePermissions.mockResolvedValue(basePermissions)

    const { result } = renderHook(() => useHierarchy())
    await waitFor(() => expect(result.current.loading).toBe(false))

    let response: Permission[] = []
    await act(async () => {
      response = await result.current.getPermissions(UserType.ADMIN)
    })

    expect(response).toEqual(basePermissions)
    expect(mockRoleService.getRolePermissions).toHaveBeenCalledWith(UserType.ADMIN)

    mockRoleService.getRolePermissions.mockRejectedValue(new Error('boom'))

    await act(async () => {
      response = await result.current.getPermissions(UserType.ACCOUNTANT)
    })

    expect(response).toEqual([])
    expect(result.current.error).toBe('boom')
  })
})
