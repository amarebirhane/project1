import React from 'react'
import { render, screen } from '@testing-library/react'
import ApprovalsPage from '@/app/approvals/page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

jest.mock('@/lib/rbac/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      role: 'admin',
      userType: 'ADMIN',
    },
    isAuthenticated: true,
  }),
}))

jest.mock('@/store/userStore', () => ({
  useUserStore: () => ({
    user: { id: '1', role: 'admin' },
    isAuthenticated: true,
  }),
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getPendingRevenues: jest.fn().mockResolvedValue([]),
    getPendingExpenses: jest.fn().mockResolvedValue([]),
    getApprovalWorkflows: jest.fn().mockResolvedValue([]),
    approveWorkflow: jest.fn(),
    rejectWorkflow: jest.fn(),
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

describe('ApprovalsPage', () => {
  it('renders page component', () => {
    render(<ApprovalsPage />)
    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })
})

