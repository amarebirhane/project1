import React from 'react'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import SettingsPage from '@/app/settings/page'
import { AuthProvider } from '@/lib/rbac/auth-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// --------------------
// Navigation mock
// --------------------
jest.mock('next/navigation', () => ({
  usePathname: () => '/settings',
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
}))

// --------------------
// RBAC mock (FIXED)
// --------------------
jest.mock('@/lib/rbac', () => {
  const ComponentGate = ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  )

  ComponentGate.displayName = 'ComponentGateMock'

  return {
    ComponentGate,
    ComponentId: 'settings',
  }
})

// --------------------
// Layout mock (FIXED)
// --------------------
jest.mock('@/components/layout', () => {
  const MockLayout = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  )

  MockLayout.displayName = 'MockLayout'
  return MockLayout
})

// --------------------
// next/link mock (FIXED)
// --------------------
jest.mock('next/link', () => {
  const Link = ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>

  Link.displayName = 'NextLinkMock'
  return Link
})

// --------------------
// User store mock
// --------------------
jest.mock('@/store/userStore', () => {
  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'admin@test.com',
    role: 'admin' as const,
    isActive: true,
  }

  return {
    __esModule: true,
    default: jest.fn(() => ({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: jest.fn(),
      logout: jest.fn(),
      getCurrentUser: jest.fn(),
    })),
  }
})

// --------------------
// API mock
// --------------------
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getCurrentUser: jest.fn().mockResolvedValue({
      data: { id: 1, email: 'admin@test.com', role: 'admin' },
    }),
    getAdminSystemStats: jest.fn().mockResolvedValue({
      data: {
        totalUsers: 10,
        activeUsers: 8,
        totalRevenue: 100000,
        totalExpenses: 50000,
      },
    }),
    getSystemSettings: jest.fn().mockResolvedValue({
      data: {
        maintenanceMode: false,
        allowRegistrations: true,
      },
    }),
    getSystemHealth: jest.fn().mockResolvedValue({
      data: {
        status: 'healthy',
        database: 'connected',
      },
    }),
  },
}))

// --------------------
// Tests
// --------------------
describe('SettingsPage', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    })
  })

  it('renders page component', async () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation((message) => {
        if (
          typeof message === 'string' &&
          message.includes('not wrapped in act')
        ) {
          return
        }
        console.error(message)
      })

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <SettingsPage />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('System Overview')).toBeInTheDocument()
    })

    consoleError.mockRestore()
  })
})
