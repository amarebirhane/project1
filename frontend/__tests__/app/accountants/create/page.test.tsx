import React from 'react'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import AccountantsCreatePage from '@/app/accountants/create/page'

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
  const LinkMock = ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  )
  LinkMock.displayName = 'NextLinkMock'
  return LinkMock
})

// --------------------
// Tests
// --------------------
describe('AccountantsCreatePage', () => {
  it('renders page component', async () => {
    render(<AccountantsCreatePage />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Create Accountant/i, level: 1 })).toBeInTheDocument()
    })
  })
})
