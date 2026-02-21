import React from 'react'
import { render } from '@testing-library/react'
import ProjectPage from '@/app/project/page'

// Mock next/navigation
const mockReplace = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}))

describe('ProjectPage', () => {
  beforeEach(() => {
    mockReplace.mockClear()
  })

  it('redirects to project list', () => {
    render(<ProjectPage />)
    expect(mockReplace).toHaveBeenCalledWith('/project/list')
  })
})

