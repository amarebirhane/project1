import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import useUserStore from '@/store/userStore'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// --------------------
// Mocks
// --------------------
jest.mock('@/store/userStore')
jest.mock('@/lib/api')
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}))

const mockUseUserStore = useUserStore as jest.MockedFunction<typeof useUserStore>

// --------------------
// Types
// --------------------
type User = {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
  isActive: boolean
  createdAt?: string
}

type UserStore = {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: jest.Mock
  logout: jest.Mock
  register: jest.Mock
  canManageUsers: () => boolean
  canViewAllData: () => boolean
  canApproveTransactions: () => boolean
  canSubmitTransactions: () => boolean
  getCurrentUser: jest.Mock
}

// --------------------
// Helpers
// --------------------
const createMockUserStore = (
  overrides?: Partial<UserStore>
): UserStore => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  canManageUsers: () => false,
  canViewAllData: () => false,
  canApproveTransactions: () => false,
  canSubmitTransactions: () => false,
  getCurrentUser: jest.fn(),
  ...overrides,
})

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  )

  Wrapper.displayName = 'AuthProviderTestWrapper'
  return Wrapper
}

// --------------------
// Test Components
// --------------------
const TestComponent = () => {
  const auth = useAuth()

  return (
    <div>
      <div data-testid="isAuthenticated">
        {auth.isAuthenticated ? 'true' : 'false'}
      </div>
      <div data-testid="isLoading">
        {auth.isLoading ? 'true' : 'false'}
      </div>
      <div data-testid="user">
        {auth.user ? auth.user.email : 'null'}
      </div>
    </div>
  )
}
TestComponent.displayName = 'TestComponent'

// --------------------
// Tests
// --------------------
describe('AuthProvider Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
  })

  it('provides auth context to children', () => {
    mockUseUserStore.mockReturnValue(createMockUserStore())

    render(<TestComponent />, { wrapper: createWrapper() })

    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('false')
    expect(screen.getByTestId('isLoading')).toHaveTextContent('false')
  })

  it('provides user data when authenticated', () => {
    const mockUser: User = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
      isActive: true,
      createdAt: '2024-01-01',
    }

    mockUseUserStore.mockReturnValue(
      createMockUserStore({
        user: mockUser,
        isAuthenticated: true,
      })
    )

    render(<TestComponent />, { wrapper: createWrapper() })

    expect(screen.getByTestId('isAuthenticated')).toHaveTextContent('true')
    expect(screen.getByTestId('user')).toHaveTextContent('test@example.com')
  })

  it('calls getCurrentUser when token exists and user is null', async () => {
    localStorage.setItem('access_token', 'test-token')
    const getCurrentUser = jest.fn().mockResolvedValue(undefined)

    mockUseUserStore.mockReturnValue(
      createMockUserStore({
        getCurrentUser,
      })
    )

    render(<TestComponent />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(getCurrentUser).toHaveBeenCalled()
    })
  })

  it('does not call getCurrentUser when user already exists', () => {
    localStorage.setItem('access_token', 'test-token')
    const getCurrentUser = jest.fn()

    mockUseUserStore.mockReturnValue(
      createMockUserStore({
        user: {
          id: '1',
          name: 'Existing User',
          email: 'existing@example.com',
          role: 'admin',
          isActive: true,
        },
        isAuthenticated: true,
        getCurrentUser,
      })
    )

    render(<TestComponent />, { wrapper: createWrapper() })

    expect(getCurrentUser).not.toHaveBeenCalled()
  })

  it('provides permission methods', () => {
    mockUseUserStore.mockReturnValue(
      createMockUserStore({
        canManageUsers: () => true,
        canViewAllData: () => true,
      })
    )

    const PermissionTest = () => {
      const auth = useAuth()
      return (
        <div>
          <div data-testid="canManage">
            {auth.canManageUsers() ? 'true' : 'false'}
          </div>
          <div data-testid="canView">
            {auth.canViewAllData() ? 'true' : 'false'}
          </div>
        </div>
      )
    }
    PermissionTest.displayName = 'PermissionTest'

    render(<PermissionTest />, { wrapper: createWrapper() })

    expect(screen.getByTestId('canManage')).toHaveTextContent('true')
    expect(screen.getByTestId('canView')).toHaveTextContent('true')
  })
})

describe('useAuth Hook', () => {
  it('throws error when used outside AuthProvider', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {})

    const HookTest = () => {
      useAuth()
      return null
    }
    HookTest.displayName = 'HookTest'

    expect(() => {
      render(<HookTest />)
    }).toThrow('useAuth must be used within an AuthProvider')

    consoleSpy.mockRestore()
  })
})
