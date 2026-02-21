import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import AdminPage from '@/app/admin/page'

// ---- Mocks ----

const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mutable mock reference we can modify per test
const mockGetAdminSystemStats = jest.fn()

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getAdminSystemStats: (...args: unknown[]) => mockGetAdminSystemStats(...args),
  },
}))

jest.mock('@/store/userStore', () => ({
  useUserStore: () => ({
    user: { id: '1', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
    allUsers: [],
    fetchAllUsers: jest.fn(),
  }),
}))

jest.mock('@/lib/utils', () => ({
  cn: (...args: (string | boolean | undefined | null)[]) =>
    args.filter(Boolean).join(' '),
}))

// ---- Test Suite ----

describe('AdminPage', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockGetAdminSystemStats.mockReset()

    // Default successful response
    mockGetAdminSystemStats.mockResolvedValue({
      data: {
        total_users: 10,
        active_users: 8,
        total_revenue: 10000,
        total_expenses: 5000,
        pending_approvals: 2,
        system_health: 'healthy',
      },
    })
  })

  it('renders system stats after loading', async () => {
    render(<AdminPage />)

    await waitFor(() => {
      expect(screen.getByText('Total Users')).toBeInTheDocument()
      expect(screen.getByText('10')).toBeInTheDocument()
    })
  })

  it('shows backend error message when API fails', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    mockGetAdminSystemStats.mockRejectedValue({
      response: { status: 500, data: { detail: 'Server failed' } },
    })

    render(<AdminPage />)

    await waitFor(() => {
      expect(screen.getByText(/Server failed/i)).toBeInTheDocument()
    })

    consoleErrorSpy.mockRestore()
  })

  it('renders admin dashboard title', async () => {
    render(<AdminPage />)

    await waitFor(() => {
      expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument()
    })
  })

  it('renders without crashing', async () => {
    render(<AdminPage />)

    await waitFor(() => {
      expect(screen.getByText(/Admin Dashboard/i)).toBeInTheDocument()
    })
  })
})
