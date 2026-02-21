import React from 'react'
import { render } from '@testing-library/react'
import DepartmentPage from '@/app/department/page'

// Mock next/navigation
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}))

describe('DepartmentPage', () => {
  beforeEach(() => {
    mockReplace.mockClear()
  })

  it('redirects to department list', () => {
    render(<DepartmentPage />)
    expect(mockReplace).toHaveBeenCalledWith('/department/list')
  })
})

