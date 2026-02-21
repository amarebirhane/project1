import React from 'react'
import { render } from '@/__tests__/utils/test-utils'
import Navbar from '@/components/common/Navbar'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/dashboard',
}))

const mockUser = { id: '1', full_name: 'Test User', email: 'test@example.com', role: 'admin' }
jest.mock('@/lib/rbac/auth-context', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    logout: jest.fn(),
  }),
}))

jest.mock('@/store/userStore', () => {
  const mockStore = {
    user: { id: '1', name: 'Test User', role: 'admin' },
  }
  return {
    __esModule: true,
    default: () => mockStore,
    useUserStore: () => mockStore,
  }
})

jest.mock('@/store/notificationStore', () => {
  const mockStore = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    fetchNotifications: jest.fn(),
    markAsRead: jest.fn(),
    markAllAsRead: jest.fn(),
    setAccessibleUserIds: jest.fn(),
    accessibleUserIds: null,
  }
  return {
    __esModule: true,
    useNotificationStore: () => mockStore,
    default: () => mockStore,
  }
})

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
  ComponentId: 'header',
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    search: jest.fn(),
    getNotifications: jest.fn().mockResolvedValue([]),
  },
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('next/link', () => {
  const MockNextLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
  MockNextLink.displayName = 'MockNextLink'
  return MockNextLink
})

describe('Navbar', () => {
  it('renders navbar component', () => {
    render(<Navbar />)
    // Navbar should render without crashing
    expect(document.body).toBeTruthy()
  })
})

