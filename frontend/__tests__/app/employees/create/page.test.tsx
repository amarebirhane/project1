import React from 'react'
import { render, screen } from '@/__tests__/utils/test-utils'
import EmployeesCreatePage from '@/app/employees/create/page'

// --------------------
// Router mock
// --------------------
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// --------------------
// User store mock
// --------------------
jest.mock('@/store/userStore', () => {
  const mockStore = {
    user: { id: '1', role: 'admin' },
    isAuthenticated: true,
  }
  return {
    __esModule: true,
    default: () => mockStore,
    useUserStore: () => mockStore,
  }
})

// --------------------
// API mock
// --------------------
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    createEmployee: jest.fn(),
    getDepartments: jest.fn().mockResolvedValue([]),
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
// Navbar mock (FIXED)
// --------------------
jest.mock('@/components/common/Navbar', () => {
  function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>
  }
  MockNavbar.displayName = 'MockNavbar'
  return MockNavbar
})

// --------------------
// Sidebar mock (FIXED)
// --------------------
jest.mock('@/components/common/Sidebar', () => {
  function MockSidebar() {
    return <div data-testid="sidebar">Sidebar</div>
  }
  MockSidebar.displayName = 'MockSidebar'
  return MockSidebar
})

// --------------------
// next/link mock (FIXED)
// --------------------
jest.mock('next/link', () => {
  const LinkMock = ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>

  LinkMock.displayName = 'NextLinkMock'
  return LinkMock
})

// --------------------
// Tests
// --------------------
describe('EmployeesCreatePage', () => {
  it('renders page component', () => {
    render(<EmployeesCreatePage />)
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })
})
