import React from 'react'
import { render } from '@/__tests__/utils/test-utils'
import PermissionsLayout from '@/app/permissions/layout'

// Mock components
jest.mock('@/components/common/Navbar', () => {
  return function MockNavbar() {
    return <div data-testid="navbar">Navbar</div>
  }
})

jest.mock('@/components/common/Sidebar', () => {
  return function MockSidebar() {
    return <div data-testid="sidebar">Sidebar</div>
  }
})

describe('PermissionsLayout', () => {
  it('renders layout with children', () => {
    const { getByText, getByTestId } = render(
      <PermissionsLayout>
        <div>Test Content</div>
      </PermissionsLayout>
    )
    expect(getByText('Test Content')).toBeInTheDocument()
    expect(getByTestId('navbar')).toBeInTheDocument()
    expect(getByTestId('sidebar')).toBeInTheDocument()
  })
})

