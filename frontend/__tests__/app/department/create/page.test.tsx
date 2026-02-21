import React from 'react'
import { render, screen } from '@testing-library/react'
import DepartmentCreatePage from '@/app/department/create/page'

// --------------------
// Router mock
// --------------------
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

// --------------------
// API mock
// --------------------
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    createDepartment: jest.fn(),
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
describe('DepartmentCreatePage', () => {
  it('renders page component', () => {
    render(<DepartmentCreatePage />)
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('navbar')).toBeInTheDocument()
  })
})
