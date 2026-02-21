import React from 'react'
import { render, screen } from '@/__tests__/utils/test-utils'
import ReportPage from '@/app/report/page'

// Mock dependencies
jest.mock('@/lib/rbac/auth-context', () => ({
  useAuth: () => ({
    user: { id: '1', role: 'admin' },
    isAuthenticated: true,
  }),
}))

jest.mock('@/lib/api', () => ({
  apiClient: {
    getRevenueStats: jest.fn().mockResolvedValue({
      total: 0,
      byMonth: [],
      byCategory: [],
    }),
    getExpenseStats: jest.fn().mockResolvedValue({
      total: 0,
      byMonth: [],
      byCategory: [],
    }),
    getProfitLoss: jest.fn().mockResolvedValue({
      revenue: 0,
      expenses: 0,
      profit: 0,
    }),
    exportReport: jest.fn(),
  },
  __esModule: true,
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/components/layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>
  }
})

describe('ReportPage', () => {
  it('renders page component', () => {
    render(<ReportPage />)
    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })
})

