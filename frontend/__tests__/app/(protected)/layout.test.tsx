import React from 'react'
import { render, screen } from '@/__tests__/utils/test-utils'
import ProtectedLayout from '@/app/(protected)/layout'

// Mock dependencies
const mockPush = jest.fn()
const mockRefreshUser = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

jest.mock('@/lib/rbac/auth-context', () => ({
  __esModule: true,
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
    user: { id: '1', role: 'admin' },
    refreshUser: mockRefreshUser,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/common/Navbar', () => {
  const MockNavbar = () => <div data-testid="navbar">Navbar</div>
  MockNavbar.displayName = 'MockNavbar'
  return MockNavbar
})

jest.mock('@/components/common/Sidebar', () => {
  const MockSidebar = () => <div data-testid="sidebar">Sidebar</div>
  MockSidebar.displayName = 'MockSidebar'
  return MockSidebar
})

describe('ProtectedLayout', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockRefreshUser.mockClear()
  })

  it('renders layout when authenticated', () => {
    render(
      <ProtectedLayout>
        <div>Test Content</div>
      </ProtectedLayout>
    )
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders children when user is authenticated', () => {
    render(
      <ProtectedLayout>
        <div>Test Content</div>
      </ProtectedLayout>
    )
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })
})
