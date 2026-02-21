import React from 'react'
import { render, screen } from '@/__tests__/utils/test-utils'
import SearchPage from '@/app/search/page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn(() => null),
  }),
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

jest.mock('@/store/userStore', () => {
  const mockStore = {
    user: { id: '1', role: 'admin', name: 'Admin', email: 'admin@test.com', isActive: true },
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn().mockResolvedValue({}),
  }
  return {
    __esModule: true,
    default: () => mockStore,
    useUserStore: () => mockStore,
  }
})

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getUsers: jest.fn().mockResolvedValue([]),
    getRevenues: jest.fn().mockResolvedValue([]),
    getExpenses: jest.fn().mockResolvedValue([]),
    getProjects: jest.fn().mockResolvedValue([]),
    getDepartments: jest.fn().mockResolvedValue([]),
  },
}))

jest.mock('@/components/layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>
  }
})

describe('SearchPage', () => {
  it('renders page component', () => {
    render(<SearchPage />)
    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })
})

