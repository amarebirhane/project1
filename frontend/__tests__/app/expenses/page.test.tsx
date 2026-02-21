import React from 'react'
import { render } from '@testing-library/react'
import ExpensesPage from '@/app/expenses/page'

// Mock next/navigation
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}))

describe('ExpensesPage', () => {
  beforeEach(() => {
    mockReplace.mockClear()
  })

  it('redirects to expenses list', () => {
    render(<ExpensesPage />)
    expect(mockReplace).toHaveBeenCalledWith('/expenses/list')
  })
})

