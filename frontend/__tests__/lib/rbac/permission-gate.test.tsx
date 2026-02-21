import React from 'react'
import { render, screen } from '@testing-library/react'
import { PermissionGate, RoleGate, UserTypeGate } from '@/lib/rbac/permission-gate'
import { Resource, Action, UserType } from '@/lib/rbac/models'

// Mock use-authorization
const mockHasPermission = jest.fn()
const mockHasRole = jest.fn()
const mockHasUserType = jest.fn()

jest.mock('@/lib/rbac/use-authorization', () => ({
  useAuthorization: () => ({
    hasPermission: mockHasPermission,
    hasRole: mockHasRole,
    hasUserType: mockHasUserType,
  }),
}))

describe('PermissionGate', () => {
  beforeEach(() => {
    mockHasPermission.mockClear()
  })

  it('renders children when user has permission', () => {
    mockHasPermission.mockReturnValue(true)
    render(
      <PermissionGate resource={Resource.USERS} action={Action.READ}>
        <div>Authorized Content</div>
      </PermissionGate>
    )
    expect(screen.getByText('Authorized Content')).toBeInTheDocument()
  })

  it('does not render children when user lacks permission', () => {
    mockHasPermission.mockReturnValue(false)
    render(
      <PermissionGate resource={Resource.USERS} action={Action.READ}>
        <div>Authorized Content</div>
      </PermissionGate>
    )
    expect(screen.queryByText('Authorized Content')).not.toBeInTheDocument()
  })

  it('renders fallback when user lacks permission', () => {
    mockHasPermission.mockReturnValue(false)
    render(
      <PermissionGate 
        resource={Resource.USERS} 
        action={Action.READ}
        fallback={<div>Access Denied</div>}
      >
        <div>Authorized Content</div>
      </PermissionGate>
    )
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.queryByText('Authorized Content')).not.toBeInTheDocument()
  })
})

describe('RoleGate', () => {
  beforeEach(() => {
    mockHasRole.mockClear()
  })

  it('renders children when user has role', () => {
    mockHasRole.mockReturnValue(true)
    render(
      <RoleGate roles={['admin']}>
        <div>Authorized Content</div>
      </RoleGate>
    )
    expect(screen.getByText('Authorized Content')).toBeInTheDocument()
  })

  it('does not render children when user lacks role', () => {
    mockHasRole.mockReturnValue(false)
    render(
      <RoleGate roles={['admin']}>
        <div>Authorized Content</div>
      </RoleGate>
    )
    expect(screen.queryByText('Authorized Content')).not.toBeInTheDocument()
  })

  it('requires all roles when requireAll is true', () => {
    mockHasRole.mockReturnValue(false)
    render(
      <RoleGate roles={['admin', 'manager']} requireAll={true}>
        <div>Authorized Content</div>
      </RoleGate>
    )
    expect(screen.queryByText('Authorized Content')).not.toBeInTheDocument()
  })
})

describe('UserTypeGate', () => {
  beforeEach(() => {
    mockHasUserType.mockClear()
  })

  it('renders children when user has user type', () => {
    mockHasUserType.mockReturnValue(true)
    render(
      <UserTypeGate userTypes={[UserType.ADMIN]}>
        <div>Authorized Content</div>
      </UserTypeGate>
    )
    expect(screen.getByText('Authorized Content')).toBeInTheDocument()
  })

  it('does not render children when user lacks user type', () => {
    mockHasUserType.mockReturnValue(false)
    render(
      <UserTypeGate userTypes={[UserType.ADMIN]}>
        <div>Authorized Content</div>
      </UserTypeGate>
    )
    expect(screen.queryByText('Authorized Content')).not.toBeInTheDocument()
  })
})

