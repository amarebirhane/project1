import React from 'react'
import { render } from '@/__tests__/utils/test-utils'
import Sidebar from '@/components/common/Sidebar'

// Mock dependencies
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}))

jest.mock('@/lib/rbac/auth-context', () => ({
  useAuth: () => ({
    user: { id: '1', userType: 'ADMIN', role: 'admin' },
    isAuthenticated: true,
  }),
}))

jest.mock('@/lib/rbac/use-authorization', () => ({
  useAuthorization: () => ({
    hasPermission: jest.fn().mockReturnValue(true),
    hasRole: jest.fn().mockReturnValue(true),
    hasUserType: jest.fn().mockReturnValue(true),
  }),
}))

jest.mock('@/store/useThemeStore', () => {
  const mockStore = {
    themePreference: 'light',
    setThemePreference: jest.fn(),
  }
  return {
    __esModule: true,
    useThemeStore: () => mockStore,
    default: () => mockStore,
  }
})

jest.mock('@/lib/rbac', () => ({
  ComponentGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ComponentId: 'sidebar',
  UserType: {
    ADMIN: 'ADMIN',
    FINANCE_ADMIN: 'FINANCE_ADMIN',
    ACCOUNTANT: 'ACCOUNTANT',
    EMPLOYEE: 'EMPLOYEE',
  },
}))

jest.mock('next/link', () => {
  const MockNextLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
  MockNextLink.displayName = 'MockNextLink'
  return MockNextLink
})

describe('Sidebar', () => {
  it('renders sidebar component', () => {
    render(<Sidebar />)
    // Sidebar should render without crashing
    expect(document.body).toBeTruthy()
  })
})
