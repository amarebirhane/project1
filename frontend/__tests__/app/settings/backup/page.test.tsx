import React from 'react'
import { render, screen, waitFor } from '@/__tests__/utils/test-utils'
import BackupPage from '@/app/settings/backup/page'

// Mock dependencies
jest.mock('@/lib/rbac', () => ({
  ComponentGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ComponentId: {
    SETTINGS_VIEW: 'settings_view',
  },
}))

jest.mock('@/lib/rbac/auth-context', () => ({
  useAuth: () => ({
    user: { id: '1', role: 'admin' },
    isAuthenticated: true,
  }),
}))

jest.mock('@/lib/api', () => ({
  __esModule: true,
  default: {
    createBackup: jest.fn(),
    getBackups: jest.fn().mockResolvedValue({ data: [] }),
    listBackups: jest.fn().mockResolvedValue({ data: { backups: [] } }),
    deleteBackup: jest.fn(),
    restoreBackup: jest.fn(),
  },
}))

jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

jest.mock('@/store/userStore', () => ({
  useUserStore: () => ({
    user: { id: '1', role: 'admin' },
    isAuthenticated: true,
  }),
}))

describe('BackupPage', () => {
  it('renders page component', async () => {
    render(<BackupPage />)

    // Wait for content to appear after loading completes
    await waitFor(() => {
      expect(screen.getByText(/Backup Management/i)).toBeInTheDocument()
    }, { timeout: 5000 })
  })
})

