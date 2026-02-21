import {
  LoginSchema,
  RegisterSchema,
  RevenueSchema,
  ExpenseSchema,
  ResetPasswordSchema,
  ResetPasswordRequestSchema,
  ResetPasswordOTPSchema,
  ResetPasswordNewSchema,
  UserRole,
  TransactionStatus,
  NotificationType,
  ReportFormat,
} from '@/lib/validation'

describe('Validation Schemas', () => {
  describe('UserRole', () => {
    it('accepts valid roles', () => {
      expect(UserRole.safeParse('ADMIN').success).toBe(true)
      expect(UserRole.safeParse('FINANCE_ADMIN').success).toBe(true)
      expect(UserRole.safeParse('ACCOUNTANT').success).toBe(true)
      expect(UserRole.safeParse('EMPLOYEE').success).toBe(true)
    })

    it('rejects invalid roles', () => {
      expect(UserRole.safeParse('INVALID').success).toBe(false)
      expect(UserRole.safeParse('').success).toBe(false)
    })
  })

  describe('TransactionStatus', () => {
    it('accepts valid statuses', () => {
      expect(TransactionStatus.safeParse('pending').success).toBe(true)
      expect(TransactionStatus.safeParse('approved').success).toBe(true)
      expect(TransactionStatus.safeParse('rejected').success).toBe(true)
    })
  })

  describe('NotificationType', () => {
    it('accepts valid types', () => {
      expect(NotificationType.safeParse('info').success).toBe(true)
      expect(NotificationType.safeParse('success').success).toBe(true)
      expect(NotificationType.safeParse('warning').success).toBe(true)
      expect(NotificationType.safeParse('error').success).toBe(true)
    })
  })

  describe('ReportFormat', () => {
    it('accepts valid formats', () => {
      expect(ReportFormat.safeParse('pdf').success).toBe(true)
      expect(ReportFormat.safeParse('csv').success).toBe(true)
      expect(ReportFormat.safeParse('excel').success).toBe(true)
    })
  })

  describe('LoginSchema', () => {
    it('validates correct login data', () => {
      const validLogin = {
        identifier: 'user@example.com',
        password: 'password123',
      }
      expect(LoginSchema.safeParse(validLogin).success).toBe(true)
    })

    it('accepts username as identifier', () => {
      const validLogin = {
        identifier: 'username',
        password: 'password123',
      }
      expect(LoginSchema.safeParse(validLogin).success).toBe(true)
    })

    it('rejects short identifier', () => {
      const invalidLogin = {
        identifier: 'ab',
        password: 'password123',
      }
      expect(LoginSchema.safeParse(invalidLogin).success).toBe(false)
    })

    it('rejects short password', () => {
      const invalidLogin = {
        identifier: 'user@example.com',
        password: '12345',
      }
      expect(LoginSchema.safeParse(invalidLogin).success).toBe(false)
    })

    it('rejects empty identifier', () => {
      const invalidLogin = {
        identifier: '',
        password: 'password123',
      }
      expect(LoginSchema.safeParse(invalidLogin).success).toBe(false)
    })
  })

  describe('RegisterSchema', () => {
    it('validates correct registration data', () => {
      const validRegister = {
        full_name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        role: 'EMPLOYEE',
      }
      expect(RegisterSchema.safeParse(validRegister).success).toBe(true)
    })

    it('rejects short full name', () => {
      const invalidRegister = {
        full_name: 'J',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
      }
      expect(RegisterSchema.safeParse(invalidRegister).success).toBe(false)
    })

    it('rejects invalid email', () => {
      const invalidRegister = {
        full_name: 'John Doe',
        email: 'invalid-email',
        username: 'johndoe',
        password: 'password123',
      }
      expect(RegisterSchema.safeParse(invalidRegister).success).toBe(false)
    })

    it('rejects short username', () => {
      const invalidRegister = {
        full_name: 'John Doe',
        email: 'john@example.com',
        username: 'jo',
        password: 'password123',
      }
      expect(RegisterSchema.safeParse(invalidRegister).success).toBe(false)
    })

    it('rejects username with special characters', () => {
      const invalidRegister = {
        full_name: 'John Doe',
        email: 'john@example.com',
        username: 'john-doe',
        password: 'password123',
      }
      expect(RegisterSchema.safeParse(invalidRegister).success).toBe(false)
    })

    it('rejects short password', () => {
      const invalidRegister = {
        full_name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: '1234567',
      }
      expect(RegisterSchema.safeParse(invalidRegister).success).toBe(false)
    })

    it('accepts optional fields', () => {
      const validRegister = {
        full_name: 'John Doe',
        email: 'john@example.com',
        username: 'johndoe',
        password: 'password123',
        phone: '+1234567890',
        department: 'IT',
        managerId: '1',
      }
      expect(RegisterSchema.safeParse(validRegister).success).toBe(true)
    })
  })

  describe('RevenueSchema', () => {
    it('validates correct revenue data', () => {
      const validRevenue = {
        title: 'Product Sale',
        amount: 1000,
        category: 'sales',
        date: '2024-01-15',
        isRecurring: false,
      }
      expect(RevenueSchema.safeParse(validRevenue).success).toBe(true)
    })

    it('rejects empty title', () => {
      const invalidRevenue = {
        title: '',
        amount: 1000,
        category: 'sales',
        date: '2024-01-15',
        isRecurring: false,
      }
      expect(RevenueSchema.safeParse(invalidRevenue).success).toBe(false)
    })

    it('rejects negative amount', () => {
      const invalidRevenue = {
        title: 'Product Sale',
        amount: -1000,
        category: 'sales',
        date: '2024-01-15',
        isRecurring: false,
      }
      expect(RevenueSchema.safeParse(invalidRevenue).success).toBe(false)
    })

    it('rejects zero amount', () => {
      const invalidRevenue = {
        title: 'Product Sale',
        amount: 0,
        category: 'sales',
        date: '2024-01-15',
        isRecurring: false,
      }
      expect(RevenueSchema.safeParse(invalidRevenue).success).toBe(false)
    })

    it('accepts optional description', () => {
      const validRevenue = {
        title: 'Product Sale',
        amount: 1000,
        category: 'sales',
        date: '2024-01-15',
        isRecurring: false,
        description: 'Sale of product X',
      }
      expect(RevenueSchema.safeParse(validRevenue).success).toBe(true)
    })
  })

  describe('ExpenseSchema', () => {
    it('validates correct expense data', () => {
      const validExpense = {
        title: 'Office Supplies',
        description: 'Office supplies purchase',
        amount: 500,
        category: 'supplies',
        date: '2024-01-15',
        isRecurring: false,
      }
      expect(ExpenseSchema.safeParse(validExpense).success).toBe(true)
    })

    it('rejects empty title', () => {
      const invalidExpense = {
        title: '',
        description: 'Description',
        amount: 500,
        category: 'supplies',
        date: '2024-01-15',
        isRecurring: false,
      }
      expect(ExpenseSchema.safeParse(invalidExpense).success).toBe(false)
    })

    it('rejects empty description', () => {
      const invalidExpense = {
        title: 'Office Supplies',
        description: '',
        amount: 500,
        category: 'supplies',
        date: '2024-01-15',
        isRecurring: false,
      }
      expect(ExpenseSchema.safeParse(invalidExpense).success).toBe(false)
    })

    it('rejects negative amount', () => {
      const invalidExpense = {
        title: 'Office Supplies',
        description: 'Description',
        amount: -500,
        category: 'supplies',
        date: '2024-01-15',
        isRecurring: false,
      }
      expect(ExpenseSchema.safeParse(invalidExpense).success).toBe(false)
    })

    it('accepts optional vendor', () => {
      const validExpense = {
        title: 'Office Supplies',
        description: 'Description',
        amount: 500,
        category: 'supplies',
        date: '2024-01-15',
        isRecurring: false,
        vendor: 'Vendor Name',
      }
      expect(ExpenseSchema.safeParse(validExpense).success).toBe(true)
    })
  })

  describe('ResetPasswordRequestSchema', () => {
    it('validates correct email', () => {
      const validRequest = {
        email: 'user@example.com',
      }
      expect(ResetPasswordRequestSchema.safeParse(validRequest).success).toBe(true)
    })

    it('rejects invalid email', () => {
      const invalidRequest = {
        email: 'invalid-email',
      }
      expect(ResetPasswordRequestSchema.safeParse(invalidRequest).success).toBe(false)
    })
  })

  describe('ResetPasswordOTPSchema', () => {
    it('validates correct 6-digit OTP', () => {
      const validOTP = {
        otp: '123456',
      }
      expect(ResetPasswordOTPSchema.safeParse(validOTP).success).toBe(true)
    })

    it('rejects OTP with wrong length', () => {
      const invalidOTP = {
        otp: '12345',
      }
      expect(ResetPasswordOTPSchema.safeParse(invalidOTP).success).toBe(false)
    })

    it('rejects OTP that is too long', () => {
      const invalidOTP = {
        otp: '1234567',
      }
      expect(ResetPasswordOTPSchema.safeParse(invalidOTP).success).toBe(false)
    })
  })

  describe('ResetPasswordNewSchema', () => {
    it('validates correct password reset', () => {
      const validReset = {
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      }
      expect(ResetPasswordNewSchema.safeParse(validReset).success).toBe(true)
    })

    it('rejects short password', () => {
      const invalidReset = {
        newPassword: 'short',
        confirmPassword: 'short',
      }
      expect(ResetPasswordNewSchema.safeParse(invalidReset).success).toBe(false)
    })

    it('rejects mismatched passwords', () => {
      const invalidReset = {
        newPassword: 'newpassword123',
        confirmPassword: 'differentpassword',
      }
      expect(ResetPasswordNewSchema.safeParse(invalidReset).success).toBe(false)
    })
  })

  describe('ResetPasswordSchema', () => {
    it('validates correct reset password data', () => {
      const validReset = {
        email: 'user@example.com',
        otp: '123456',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      }
      expect(ResetPasswordSchema.safeParse(validReset).success).toBe(true)
    })

    it('rejects invalid email', () => {
      const invalidReset = {
        email: 'invalid-email',
        otp: '123456',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      }
      expect(ResetPasswordSchema.safeParse(invalidReset).success).toBe(false)
    })

    it('rejects mismatched passwords', () => {
      const invalidReset = {
        email: 'user@example.com',
        otp: '123456',
        newPassword: 'newpassword123',
        confirmPassword: 'differentpassword',
      }
      expect(ResetPasswordSchema.safeParse(invalidReset).success).toBe(false)
    })

    it('rejects short password', () => {
      const invalidReset = {
        email: 'user@example.com',
        otp: '123456',
        newPassword: 'short',
        confirmPassword: 'short',
      }
      expect(ResetPasswordSchema.safeParse(invalidReset).success).toBe(false)
    })
  })
})

