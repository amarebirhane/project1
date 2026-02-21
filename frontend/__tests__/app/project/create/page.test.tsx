import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import ProjectCreatePage from '@/app/project/create/page'

// --------------------
// Router mock
// --------------------
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}))

// --------------------
// User store mock
// --------------------
jest.mock('@/store/userStore', () => ({
  useUserStore: () => ({
    user: { id: '1', role: 'admin' },
    isAuthenticated: true,
    allUsers: [],
    fetchAllUsers: jest.fn(),
  }),
}))

// --------------------
// API mock
// --------------------
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    createProject: jest.fn(),
    getDepartments: jest.fn().mockResolvedValue({ data: [] }),
    getUsers: jest.fn().mockResolvedValue({ data: [] }),
  },
}))

// --------------------
// Toast mock
// --------------------
jest.mock('sonner', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}))

// --------------------
// Navbar mock (FIXED)
// --------------------
jest.mock('@/components/common/Navbar', () => {
  const NavbarMock = () => <div data-testid="navbar">Navbar</div>
  NavbarMock.displayName = 'NavbarMock'
  return NavbarMock
})

// --------------------
// Sidebar mock (FIXED)
// --------------------
jest.mock('@/components/common/Sidebar', () => {
  const SidebarMock = () => <div data-testid="sidebar">Sidebar</div>
  SidebarMock.displayName = 'SidebarMock'
  return SidebarMock
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
describe('ProjectCreatePage', () => {
  it('renders page component', async () => {
    render(<ProjectCreatePage />)

    await waitFor(() => {
      expect(screen.getByTestId('sidebar')).toBeInTheDocument()
      expect(screen.getByTestId('navbar')).toBeInTheDocument()
    }, { timeout: 5000 })
  })
})
