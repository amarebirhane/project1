import React from 'react'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import InventorySalesPage from '@/app/inventory/sales/page'

// Generic API mock that returns resolved empty data for any method
jest.mock('@/lib/api', () => {
  const mockApiClient = new Proxy({}, { get: () => jest.fn().mockResolvedValue({ data: [] }) })
  return {
    __esModule: true,
    default: mockApiClient,
  }
})

jest.mock('@/lib/rbac/auth-context', () => ({
  useAuth: () => ({
    user: { id: '1', role: 'admin', email: 'admin@test.com' },
    isAuthenticated: true,
  }),
}))

// Mock Zustand store
const mockStore = {
  getState: () => ({
    user: { id: '1', role: 'admin', name: 'Admin', email: 'admin@test.com', isActive: true },
    isAuthenticated: true,
    accessToken: 'token',
  }),
}
jest.mock('@/store/userStore', () => ({
  __esModule: true,
  default: () => mockStore.getState(),
  useUserStore: () => mockStore.getState(),
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/components/layout', () => {
  return function MockLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="layout">{children}</div>
  }
})

describe('InventorySalesPage', () => {
  it('renders page component', async () => {
    render(<InventorySalesPage />)
    await waitFor(() => {
      expect(screen.getByTestId('layout')).toBeInTheDocument()
    })
  })
})


