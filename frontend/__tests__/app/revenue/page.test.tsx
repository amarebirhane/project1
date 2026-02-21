import React from 'react'
import { render } from '@testing-library/react'
import RevenuePage from '@/app/revenue/page'

// Mock next/navigation
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}))

describe('RevenuePage', () => {
  beforeEach(() => {
    mockReplace.mockClear()
  })

  it('redirects to revenue list', () => {
    render(<RevenuePage />)
    expect(mockReplace).toHaveBeenCalledWith('/revenue/list')
  })
})

