import React from 'react'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import TransactionListPage from '@/app/transaction/list/page'

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
// Auth mock
// --------------------
jest.mock('@/lib/rbac/auth-context', () => ({
  useAuth: () => ({
    user: {
      id: '1',
      role: 'admin',
      username: 'admin',
      email: 'admin@test.com',
    },
    isAuthenticated: true,
  }),
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
describe('TransactionListPage', () => {
  it('renders page component', async () => {
    render(<TransactionListPage />)

    await waitFor(() => {
      // Look for the main heading which we saw in the DOM output
      expect(screen.getByRole('heading', { name: /^Transactions$/i, level: 1 })).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})
