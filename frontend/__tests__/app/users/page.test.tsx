import React from 'react'
import { render, screen } from '@testing-library/react'
import UsersPage from '@/app/users/page'

// --------------------
// Router mock
// --------------------
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// --------------------
// User store mock
// --------------------
jest.mock('@/store/userStore', () => ({
  useUserStore: () => ({
    user: { id: '1', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
    allUsers: [
      {
        id: '1',
        name: 'Admin User',
        email: 'admin@test.com',
        role: 'admin',
        is_active: true,
      },
      {
        id: '2',
        name: 'Employee User',
        email: 'emp@test.com',
        role: 'employee',
        is_active: true,
      },
    ],
    fetchAllUsers: jest.fn(),
  }),
}))

// --------------------
// API mock
// --------------------
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    deleteUser: jest.fn(),
  },
}))

// --------------------
// Toast mock
// --------------------
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

// --------------------
// Layout mock (FIXED)
// --------------------
jest.mock('@/components/layout', () => {
  const MockLayout = ({ children }: { children: React.ReactNode }) => (
    <div data-testid="layout">{children}</div>
  )

  MockLayout.displayName = 'MockLayout'
  return MockLayout
})

// --------------------
// next/link mock (FIXED)
// --------------------
jest.mock('next/link', () => {
  const Link = ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>

  Link.displayName = 'NextLinkMock'
  return Link
})

// --------------------
// Tests
// --------------------
describe('UsersPage', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('renders users page', () => {
    render(<UsersPage />)

    expect(screen.getByTestId('layout')).toBeInTheDocument()
    expect(screen.getByText(/User Management/i)).toBeInTheDocument()
  })

  it('renders without crashing', () => {
    render(<UsersPage />)

    expect(document.body).toBeTruthy()
  })
})
