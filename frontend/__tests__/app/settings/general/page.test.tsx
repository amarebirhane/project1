import React from 'react'
import { render } from '@/__tests__/utils/test-utils'
import GeneralSettingsPage from '@/app/settings/general/page'

// Mock dependencies
jest.mock('@/lib/rbac', () => ({
  ComponentGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ComponentId: 'settings',
}))

jest.mock('@/lib/rbac/auth-context', () => ({
  useAuth: () => ({
    user: { id: '1', role: 'admin' },
    isAuthenticated: true,
  }),
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('GeneralSettingsPage', () => {
  it('renders page component', () => {
    render(<GeneralSettingsPage />)

    expect(document.body).toBeTruthy()
  })
})
