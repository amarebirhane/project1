import React from 'react'
import { render } from '@testing-library/react'
import EmployeesPage from '@/app/employees/page'

// Mock next/navigation
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}))

describe('EmployeesPage', () => {
  beforeEach(() => {
    mockReplace.mockClear()
  })

  it('redirects to employees list', () => {
    render(<EmployeesPage />)
    expect(mockReplace).toHaveBeenCalledWith('/employees/list')
  })
})

