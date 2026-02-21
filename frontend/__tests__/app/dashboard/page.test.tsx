import React from 'react'
import { render, screen, waitFor, cleanup } from '@/__tests__/utils/test-utils'
import DashboardPage from '@/app/dashboard/page'
import apiClient from '@/lib/api'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/dashboard',
}))

jest.mock('@/lib/rbac/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      role: 'admin',
      username: 'admin',
      email: 'admin@test.com'
    },
    isAuthenticated: true,
  }),
}))

jest.mock('@/lib/rbac', () => ({
  ComponentGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ComponentId: {
    SIDEBAR_DASHBOARD: 'sidebar.dashboard',
  },
}))

jest.mock('@/lib/api', () => {
  const mocks: Record<string, jest.Mock> = {}
  const mockApiClient = new Proxy({}, {
    get: (target, prop: string) => {
      if (!(prop in mocks)) {
        mocks[prop] = jest.fn().mockResolvedValue({ data: [] })
      }
      return mocks[prop]
    }
  })
  return {
    __esModule: true,
    default: mockApiClient,
  }
})

jest.mock('@/components/layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>
  }
})

describe('DashboardPage', () => {
  // Set a timeout for all tests in this suite
  jest.setTimeout(10000)

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()

      // Set up default mock responses with proper structure
      ; (apiClient.getDashboardOverview as jest.Mock).mockResolvedValue({
        data: {
          financials: {
            total_revenue: 100000,
            total_expenses: 50000,
            profit: 50000,
            profit_margin: 50,
          },
          pending_approvals: 0,
        },
      })

      ; (apiClient.getDashboardRecentActivity as jest.Mock).mockResolvedValue({
        data: [],
      })

      ; (apiClient.getAdvancedKPIs as jest.Mock).mockResolvedValue({
        data: {},
      })

      ; (apiClient.getInventorySummary as jest.Mock).mockResolvedValue({
        data: {},
      })

      ; (apiClient.getSalesSummary as jest.Mock).mockResolvedValue({
        data: {},
      })

      ; (apiClient.getApprovals as jest.Mock).mockResolvedValue({
        data: [],
      })

      ; (apiClient.getRevenues as jest.Mock).mockResolvedValue({
        data: [],
      })

      ; (apiClient.getExpenses as jest.Mock).mockResolvedValue({
        data: [],
      })

      ; (apiClient.getSales as jest.Mock).mockResolvedValue({
        data: [],
      })

      ; (apiClient.getUsers as jest.Mock).mockResolvedValue({
        data: [],
      })
  })

  afterEach(() => {
    jest.clearAllMocks()
    cleanup()
  })

  it('renders page component and loads dashboard data', async () => {
    render(<DashboardPage />)

    // Wait for layout to appear
    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Wait for all API calls to complete
    await waitFor(() => {
      expect(apiClient.getDashboardOverview).toHaveBeenCalled()
      expect(apiClient.getDashboardRecentActivity).toHaveBeenCalled()
      expect(apiClient.getAdvancedKPIs).toHaveBeenCalled()
      expect(apiClient.getInventorySummary).toHaveBeenCalled()
      expect(apiClient.getSalesSummary).toHaveBeenCalled()
      expect(apiClient.getApprovals).toHaveBeenCalled()
      expect(apiClient.getRevenues).toHaveBeenCalled()
      expect(apiClient.getExpenses).toHaveBeenCalled()
    }, { timeout: 3000 })

    // Verify API methods were called with correct parameters
    expect(apiClient.getDashboardRecentActivity).toHaveBeenCalledWith(8)
    expect(apiClient.getAdvancedKPIs).toHaveBeenCalledWith({ period: 'month' })
    expect(apiClient.getRevenues).toHaveBeenCalledWith(expect.objectContaining({ is_approved: false }))
    expect(apiClient.getExpenses).toHaveBeenCalledWith(expect.objectContaining({ is_approved: false }))
  })

  it('handles loading state', async () => {
    // Delay the API response to test loading state
    ; (apiClient.getDashboardOverview as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve({
        data: {
          financials: {
            total_revenue: 0,
            total_expenses: 0,
            profit: 0,
          },
        }
      }), 100))
    )

    render(<DashboardPage />)

    // Should show loading initially, then layout
    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument()
    }, { timeout: 5000 })
  })

  it('handles API errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { })

      ; (apiClient.getDashboardOverview as jest.Mock).mockRejectedValue(new Error('API Error'))

    render(<DashboardPage />)

    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument()
    }, { timeout: 5000 })

    consoleErrorSpy.mockRestore()
  })
})

