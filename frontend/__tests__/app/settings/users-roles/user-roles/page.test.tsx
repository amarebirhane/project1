import React from 'react'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import UserRolesPage from '@/app/settings/users-roles/user-roles/page'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

jest.mock('@/lib/rbac/auth-context', () => ({
  __esModule: true,
  useAuth: () => ({
    user: { id: '1', role: 'admin' },
    isAuthenticated: true,
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

const mockFetchAllUsers = jest.fn()

const mockUserStore = {
  user: { id: '1', role: 'admin' },
  fetchAllUsers: mockFetchAllUsers,
  allUsers: [],
}

jest.mock('@/store/userStore', () => ({
  __esModule: true,
  default: () => mockUserStore,
  useUserStore: () => mockUserStore,
}))

jest.mock('@/lib/rbac/permission-gate', () => ({
  PermissionGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    getUsers: jest.fn().mockResolvedValue({ data: [] }),
    updateUserRole: jest.fn(),
  },
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

describe('UserRolesPage', () => {
  it('renders page component', async () => {
    render(<UserRolesPage />)

    // Wait for the title to appear after loading completes
    await waitFor(() => {
      expect(screen.getByText(/User Role Assignment/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })
})

