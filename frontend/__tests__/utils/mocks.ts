import { User } from '@/lib/rbac/models'

// Mock API client
export const mockApiClient = {
  login: jest.fn(),
  logout: jest.fn(),
  getUsers: jest.fn(),
  getUser: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
  activateUser: jest.fn(),
  deactivateUser: jest.fn(),
  getRevenues: jest.fn(),
  getExpenses: jest.fn(),
  getProjects: jest.fn(),
  getDepartments: jest.fn(),
  getApprovals: jest.fn(),
  approveItem: jest.fn(),
  rejectItem: jest.fn(),
  rejectWorkflow: jest.fn(),
}

// Mock user data
export const mockUser: any = {
  id: 1,
  email: 'test@example.com',
  username: 'testuser',
  full_name: 'Test User',
  role: 'admin',
  department: 'IT',
  phone: '+1234567890',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  manager_id: null,
  type: 'admin' as const,
}

export const mockEmployee: any = {
  id: 2,
  email: 'employee@example.com',
  username: 'employee',
  full_name: 'Employee User',
  role: 'employee',
  department: 'Sales',
  phone: '+1234567891',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  manager_id: 1,
  type: 'employee' as const,
}

export const mockManager: any = {
  id: 3,
  email: 'manager@example.com',
  username: 'manager',
  full_name: 'Manager User',
  role: 'manager',
  department: 'Finance',
  phone: '+1234567892',
  is_active: true,
  created_at: '2024-01-01T00:00:00Z',
  manager_id: null,
  type: 'finance_admin' as const,
}

// Mock API responses
export const mockApiResponses = {
  success: { success: true, data: {} },
  error: { success: false, error: 'An error occurred' },
  users: {
    success: true,
    data: [mockUser, mockEmployee, mockManager],
  },
  user: {
    success: true,
    data: mockUser,
  },
}

// Reset all mocks
export const resetMocks = () => {
  Object.values(mockApiClient).forEach((mock) => {
    if (jest.isMockFunction(mock)) {
      mock.mockReset()
    }
  })
}
