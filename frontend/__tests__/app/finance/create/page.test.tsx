import React from 'react'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import FinanceCreatePage from '@/app/finance/create/page'

// --------------------
// Router mock
// --------------------
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
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
jest.mock('@/lib/api', () => {
  const mocks: Record<string, jest.Mock> = {}
  const mockApiClient = new Proxy({}, {
    get: (target, prop: string) => {
      if (!(prop in mocks)) {
        mocks[prop] = jest.fn().mockResolvedValue({ data: [] })
      }
      return mocks[prop]
    }
  })
  return {
    __esModule: true,
    default: mockApiClient,
  }
})

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
// Sidebar mock (already named)
// --------------------
jest.mock('@/components/common/Sidebar', () => {
  function MockSidebar() {
    return <div data-testid="sidebar">Sidebar</div>
  }
  MockSidebar.displayName = 'MockSidebar'
  return MockSidebar
})

// --------------------
// Navbar mock (already named)
// --------------------
jest.mock('@/components/common/Navbar', () => {
  function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>
  }
  MockNavbar.displayName = 'MockNavbar'
  return MockNavbar
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
describe('FinanceCreatePage', () => {
  it('renders page component', async () => {
    render(<FinanceCreatePage />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Create Finance Manager/i, level: 1 })).toBeInTheDocument()
    })
  })

  it('renders create finance manager form', async () => {
    render(<FinanceCreatePage />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Create Finance Manager/i, level: 1 })).toBeInTheDocument()
    })
  })
})
