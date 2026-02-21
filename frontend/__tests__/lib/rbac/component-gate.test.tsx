import React from 'react'
import { render, screen } from '@testing-library/react'
import { ComponentGate, withComponentAccess } from '@/lib/rbac/component-gate'
import { ComponentId } from '@/lib/rbac/component-access'
import { UserType } from '@/lib/rbac/models'

// Mock auth-context
const mockUser = {
  id: '1',
  userType: UserType.ADMIN,
  role: 'admin',
}

jest.mock('@/lib/rbac/auth-context', () => ({
  useAuth: jest.fn(() => ({
    user: mockUser,
  })),
}))

jest.mock('@/lib/rbac/component-access', () => {
  const actual = jest.requireActual('@/lib/rbac/component-access')
  return {
    ...actual,
    canAccessComponent: jest.fn((userType, componentId) => {
      // Always return true for ADMIN users
      if (userType === UserType.ADMIN) {
        return true
      }
      // Use actual implementation for others
      const allowedComponents = actual.USER_TYPE_COMPONENT_MAP[userType] ?? []
      return allowedComponents.includes(componentId)
    }),
  }
})

describe('ComponentGate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset user to ADMIN before each test
    mockUser.userType = UserType.ADMIN
  })

  it('renders children when user has access', () => {
    render(
      <ComponentGate componentId={ComponentId.DASHBOARD}>
        <div>Dashboard Content</div>
      </ComponentGate>
    )
    expect(screen.getByText('Dashboard Content')).toBeInTheDocument()
  })

  it('does not render children when user lacks access', () => {
    mockUser.userType = UserType.EMPLOYEE
    render(
      <ComponentGate componentId={ComponentId.ADMIN_LIST}>
        <div>Admin Content</div>
      </ComponentGate>
    )
    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('renders fallback when user lacks access', () => {
    mockUser.userType = UserType.EMPLOYEE
    render(
      <ComponentGate 
        componentId={ComponentId.ADMIN_LIST}
        fallback={<div>Access Denied</div>}
      >
        <div>Admin Content</div>
      </ComponentGate>
    )
    expect(screen.getByText('Access Denied')).toBeInTheDocument()
  })
})

describe('withComponentAccess HOC', () => {
  beforeEach(() => {
    // Reset user to ADMIN for HOC tests
    mockUser.userType = UserType.ADMIN
  })

  it('wraps component with ComponentGate', () => {
    const TestComponent = () => <div>Test Component</div>
    const WrappedComponent = withComponentAccess(TestComponent, ComponentId.DASHBOARD)
    
    render(<WrappedComponent />)
    expect(screen.getByText('Test Component')).toBeInTheDocument()
  })
})

