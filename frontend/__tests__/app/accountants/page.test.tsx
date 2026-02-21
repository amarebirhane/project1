import React from 'react'
import { render } from '@testing-library/react'
import AccountantsPage from '@/app/accountants/page'

// Mock next/navigation
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}))

describe('AccountantsPage', () => {
  beforeEach(() => {
    mockReplace.mockClear()
  })

  it('redirects to accountants list', () => {
    render(<AccountantsPage />)
    expect(mockReplace).toHaveBeenCalledWith('/accountants/list')
  })
})

