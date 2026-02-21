import React from 'react'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import NotificationsPage from '@/app/notifications/page'
import { AuthProvider } from '@/lib/rbac/auth-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// --------------------
// Router mock
// --------------------
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

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
    useUserStore: jest.fn(() => ({
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
    getNotifications: jest.fn().mockResolvedValue({ data: [] }),
    markNotificationAsRead: jest.fn(),
    deleteNotification: jest.fn(),
    getCurrentUser: jest.fn().mockResolvedValue({
      data: { id: 1, email: 'admin@test.com', role: 'admin' },
    }),
  },
}))

// --------------------
// Toast mock
// --------------------
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

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
// Tests
// --------------------
describe('NotificationsPage', () => {
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
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    })

    render(
      <QueryClientProvider client={queryClient}>
        <NotificationsPage />
      </QueryClientProvider>
    )

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Notifications/i })).toBeInTheDocument()
    }, { timeout: 5000 })

    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })
})
