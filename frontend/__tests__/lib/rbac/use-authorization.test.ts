import { renderHook } from '@testing-library/react'
import { useAuthorization } from '@/lib/rbac/use-authorization'
import { UserType } from '@/lib/rbac/models'

// --- Mock setup ---
const mockHasPermission = jest.fn()
const mockHasUserPermission = jest.fn()
const mockRefreshUser = jest.fn()

const mockedUseAuth = jest.fn()

jest.mock('@/lib/rbac/auth-context', () => ({
  useAuth: () => mockedUseAuth(),
}))

describe('useAuthorization', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    mockedUseAuth.mockReturnValue({
      user: { id: '1', userType: UserType.ADMIN, role: 'admin' },
      hasPermission: mockHasPermission,
      hasUserPermission: mockHasUserPermission,
      refreshUser: mockRefreshUser,
    })
  })

  it('returns authorization methods', () => {
    const { result } = renderHook(() => useAuthorization())
    expect(result.current).toHaveProperty('isAdmin')
    expect(result.current).toHaveProperty('hasRole')
    expect(result.current).toHaveProperty('hasUserType')
  })

  it('isAdmin returns true for admin', () => {
    mockedUseAuth.mockReturnValueOnce({
      user: { id: '1', userType: UserType.ADMIN, role: 'admin' },
      hasPermission: mockHasPermission,
      hasUserPermission: mockHasUserPermission,
      refreshUser: mockRefreshUser,
    })

    const { result } = renderHook(() => useAuthorization())
    expect(result.current.isAdmin()).toBe(true)
  })

  it('isEmployee returns true for employee', () => {
    mockedUseAuth.mockReturnValueOnce({
      user: { id: '1', userType: UserType.EMPLOYEE, role: 'employee' },
      hasPermission: mockHasPermission,
      hasUserPermission: mockHasUserPermission,
      refreshUser: mockRefreshUser,
    })

    const { result } = renderHook(() => useAuthorization())
    expect(result.current.isEmployee()).toBe(true)
  })

  it('hasRole returns correct value', () => {
    mockedUseAuth.mockReturnValueOnce({
      user: { id: '1', userType: UserType.ADMIN, role: 'admin' },
      hasPermission: mockHasPermission,
      hasUserPermission: mockHasUserPermission,
      refreshUser: mockRefreshUser,
    })

    const { result } = renderHook(() => useAuthorization())
    expect(result.current.hasRole('admin')).toBe(true)
    expect(result.current.hasRole('other')).toBe(false)
  })

  it('returns false when user is null', () => {
    mockedUseAuth.mockReturnValueOnce({
      user: null,
      hasPermission: mockHasPermission,
      hasUserPermission: mockHasUserPermission,
      refreshUser: mockRefreshUser,
    })

    const { result } = renderHook(() => useAuthorization())

    expect(result.current.isAdmin()).toBe(false)
    expect(result.current.hasRole('admin')).toBe(false)
  })
})
