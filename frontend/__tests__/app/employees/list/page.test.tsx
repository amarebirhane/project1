import React from 'react'
import { render, screen } from '@/__tests__/utils/test-utils'
import EmployeesListPage from '@/app/employees/list/page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getEmployees: jest.fn().mockResolvedValue([]),
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

describe('EmployeesListPage', () => {
  it('renders page component', () => {
    render(<EmployeesListPage />)
    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })
})

