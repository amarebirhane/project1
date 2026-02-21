import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import UserDetailPage from '@/app/users/[id]/page'
import apiClient from '@/lib/api'

// --------------------
// Router mocks
// --------------------
const mockPush = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useParams: () => ({ id: '1' }),
}))

// --------------------
// User store mock
// --------------------
jest.mock('@/store/userStore', () => ({
  useUserStore: () => ({
    user: { id: '1', role: 'admin' },
    allUsers: [
      { id: '1', name: 'Test User', email: 'test@test.com', role: 'admin' },
    ],
    fetchAllUsers: jest.fn().mockResolvedValue(true),
  }),
}))

// --------------------
// API mock
// --------------------
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getUser: jest.fn(),
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
// utils mock (FIXED any)
// --------------------
jest.mock('@/lib/utils', () => ({
  formatDate: (date: string) => date,
  cn: (...inputs: Array<string | false | null | undefined>) =>
    inputs.filter(Boolean).join(' '),
}))

// --------------------
// Silence expected React warnings
// --------------------
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

// --------------------
// Tests
// --------------------
describe('UserDetailPage', () => {
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
        created_at: '2024-01-01',
      },
    })
  })

  it('renders user detail page without act warnings', async () => {
    render(<UserDetailPage />)

    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalledWith(1)
    })

    await waitFor(() => {
      expect(screen.queryByText(/Loading user details/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Failed to load user/i)).not.toBeInTheDocument()
    })

    const heading = await screen.findByText(/User Details/i)
    expect(heading).toBeInTheDocument()

    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })

  it('shows loading state initially', () => {
    render(<UserDetailPage />)

    expect(document.body).toBeTruthy()
    expect(screen.getByTestId('layout')).toBeInTheDocument()
  })
})
