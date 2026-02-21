import apiClient from '@/lib/api'

// Mock axios
jest.mock('axios', () => {
  const mockAxiosInstance = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
  }

  return {
    __esModule: true,
    default: {
      create: jest.fn(() => mockAxiosInstance),
    },
  }
})

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Clear localStorage
    localStorage.clear()
  })

  describe('Authentication', () => {
    it('should have login method', () => {
      expect(typeof apiClient.login).toBe('function')
    })

    it('should have logout method', () => {
      expect(typeof apiClient.logout).toBe('function')
    })
  })

  describe('User Management', () => {
    it('should have getCurrentUser method', () => {
      expect(typeof apiClient.getCurrentUser).toBe('function')
    })

    it('should have getUsers method', () => {
      expect(typeof apiClient.getUsers).toBe('function')
    })

    it('should have createUser method', () => {
      expect(typeof apiClient.createUser).toBe('function')
    })

    it('should have updateUser method', () => {
      expect(typeof apiClient.updateUser).toBe('function')
    })

    it('should have deleteUser method', () => {
      expect(typeof apiClient.deleteUser).toBe('function')
    })

    it('should have activateUser method', () => {
      expect(typeof apiClient.activateUser).toBe('function')
    })

    it('should have deactivateUser method', () => {
      expect(typeof apiClient.deactivateUser).toBe('function')
    })
  })

  describe('Revenue Management', () => {
    it('should have getRevenues method', () => {
      expect(typeof apiClient.getRevenues).toBe('function')
    })

    it('should have getRevenue method', () => {
      expect(typeof apiClient.getRevenue).toBe('function')
    })
  })

  describe('Expense Management', () => {
    it('should have getExpenses method', () => {
      expect(typeof apiClient.getExpenses).toBe('function')
    })

    it('should have getExpense method', () => {
      expect(typeof apiClient.getExpense).toBe('function')
    })
  })
})
