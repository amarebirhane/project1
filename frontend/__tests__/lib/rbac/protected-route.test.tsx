import React from 'react'
import { render, screen } from '@testing-library/react'
import { ProtectedRoute, RoleBasedRoute, UserTypeBasedRoute } from '@/lib/rbac/protected-route'
import { Resource, Action, UserType } from '@/lib/rbac/models'

// Mock dependencies
const mockPush = jest.fn()
const mockHasPermission = jest.fn()
const mockHasRole = jest.fn()
const mockHasUserType = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

jest.mock('@/lib/rbac/auth-context', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    hasPermission: mockHasPermission,
    hasUserPermission: jest.fn(),
  }),
}))

jest.mock('@/lib/rbac/use-authorization', () => ({
  useAuthorization: () => ({
    hasPermission: mockHasPermission,
    hasRole: mockHasRole,
    hasUserType: mockHasUserType,
  }),
}))

jest.mock('@/components/common/LoadingComponents', () => ({
  TextLoading: ({ text }: { text: string }) => <div>{text}</div>,
}))

describe('ProtectedRoute', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockHasPermission.mockClear()
  })

  it('renders children when user has permission', () => {
    mockHasPermission.mockReturnValue(true)
    render(
      <ProtectedRoute resource={Resource.USERS} action={Action.READ}>
        <div>Protected Content</div>
      </ProtectedRoute>
    )
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects when user lacks permission', () => {
    mockHasPermission.mockReturnValue(false)
    render(
      <ProtectedRoute resource={Resource.USERS} action={Action.READ}>
        <div>Protected Content</div>
      </ProtectedRoute>
    )
    expect(mockPush).toHaveBeenCalledWith('/unauthorized')
  })

  it('renders fallback when user lacks permission', () => {
    mockHasPermission.mockReturnValue(false)
    render(
      <ProtectedRoute 
        resource={Resource.USERS} 
        action={Action.READ}
        fallback={<div>Access Denied</div>}
      >
        <div>Protected Content</div>
      </ProtectedRoute>
    )
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })
})

describe('RoleBasedRoute', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockHasRole.mockClear()
  })

  it('renders children when user has role', () => {
    mockHasRole.mockReturnValue(true)
    render(
      <RoleBasedRoute roles={['admin']}>
        <div>Protected Content</div>
      </RoleBasedRoute>
    )
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects when user lacks role', () => {
    mockHasRole.mockReturnValue(false)
    render(
      <RoleBasedRoute roles={['admin']}>
        <div>Protected Content</div>
      </RoleBasedRoute>
    )
    expect(mockPush).toHaveBeenCalledWith('/unauthorized')
  })
})

describe('UserTypeBasedRoute', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockHasUserType.mockClear()
  })

  it('renders children when user has user type', () => {
    mockHasUserType.mockReturnValue(true)
    render(
      <UserTypeBasedRoute userTypes={[UserType.ADMIN]}>
        <div>Protected Content</div>
      </UserTypeBasedRoute>
    )
    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('redirects when user lacks user type', () => {
    mockHasUserType.mockReturnValue(false)
    render(
      <UserTypeBasedRoute userTypes={[UserType.ADMIN]}>
        <div>Protected Content</div>
      </UserTypeBasedRoute>
    )
    expect(mockPush).toHaveBeenCalledWith('/unauthorized')
  })
})

