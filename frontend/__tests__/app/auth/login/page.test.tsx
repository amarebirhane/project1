import React from 'react'
import { render } from '@testing-library/react'
import LoginPage from '@/app/auth/login/page'

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
// Auth mock
// --------------------
jest.mock('@/lib/rbac', () => ({
  useAuth: () => ({
    login: jest.fn(),
    user: null,
    isAuthenticated: false,
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
  Toaster: () => null,
}))

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
describe('LoginPage', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('renders login page', () => {
    render(<LoginPage />)
    expect(document.body).toBeTruthy()
  })
})
