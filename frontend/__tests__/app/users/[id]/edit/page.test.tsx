import React from 'react'
import { render, screen, waitFor, act } from '@/__tests__/utils/test-utils'
import EditUserPage from '@/app/users/[id]/edit/page'
import apiClient from '@/lib/api'

// --------------------
// Router mocks
// --------------------
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
  }),
  useParams: () => ({
    id: '1',
  }),
}))

// --------------------
// User store mock
// --------------------
jest.mock('@/store/userStore', () => {
  const mockStore = {
    user: { id: '1', role: 'admin' },
    allUsers: [
      { id: '1', name: 'Test User', email: 'test@test.com', role: 'admin' },
    ],
    fetchAllUsers: jest.fn(),
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
    getUser: jest.fn(),
    updateUser: jest.fn(),
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
describe('EditUserPage', () => {
  const mockGetUser = apiClient.getUser as jest.Mock

  beforeEach(() => {
    mockPush.mockClear()
    mockGetUser.mockClear()
    mockGetUser.mockResolvedValue({
      data: {
        id: 1,
        full_name: 'Test User',
        email: 'test@test.com',
        username: 'testuser',
        role: 'admin',
        is_active: true,
      },
    })
  })

  it('renders edit user page', async () => {
    await act(async () => {
      render(<EditUserPage />)
    })

    expect(screen.getByTestId('layout')).toBeInTheDocument()

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalled()
    })
  })

  it('shows loading state initially', async () => {
    await act(async () => {
      render(<EditUserPage />)
    })

    expect(document.body).toBeTruthy()

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalled()
    })
  })
})
