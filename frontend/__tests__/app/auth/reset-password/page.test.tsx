import React from 'react'
import { render } from '@testing-library/react'
import ResetPasswordPage from '@/app/auth/reset-password/page'

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
    user: null,
    isAuthenticated: false,
  }),
}))

// --------------------
// API mock
// --------------------
jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    requestPasswordReset: jest.fn(),
    verifyPasswordResetOTP: jest.fn(),
    resetPassword: jest.fn(),
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
describe('ResetPasswordPage', () => {
  beforeEach(() => {
    mockPush.mockClear()
  })

  it('renders reset password page', () => {
    render(<ResetPasswordPage />)
    expect(document.body).toBeTruthy()
  })
})
