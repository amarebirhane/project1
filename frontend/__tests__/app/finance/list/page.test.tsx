import React from 'react'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import FinanceListPage from '@/app/finance/list/page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getFinanceManagers: jest.fn().mockResolvedValue([]),
    getUsers: jest.fn().mockResolvedValue({ data: [] }),
    deleteUser: jest.fn(),
    activateUser: jest.fn(),
    deactivateUser: jest.fn(),
  },
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

describe('FinanceListPage', () => {
  it('renders page component', async () => {
    render(<FinanceListPage />)

    // Wait for layout to appear after loading completes
    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument()
    }, { timeout: 5000 })
  })
})

