import React from 'react'
import { render, screen } from '@/__tests__/utils/test-utils'
import AccountantsListPage from '@/app/accountants/list/page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getAccountants: jest.fn().mockResolvedValue([]),
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

describe('AccountantsListPage', () => {
  it('renders page component', () => {
    render(<AccountantsListPage />)
    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })
})

