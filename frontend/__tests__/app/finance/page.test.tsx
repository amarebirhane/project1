import React from 'react'
import { render } from '@testing-library/react'
import FinancePage from '@/app/finance/page'

// Mock next/navigation
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}))

describe('FinancePage', () => {
  beforeEach(() => {
    mockReplace.mockClear()
  })

  it('redirects to finance list', () => {
    render(<FinancePage />)
    expect(mockReplace).toHaveBeenCalledWith('/finance/list')
  })
})

