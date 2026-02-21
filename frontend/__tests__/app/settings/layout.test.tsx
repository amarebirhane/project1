import React from 'react'
import { render } from '@/__tests__/utils/test-utils'
import SettingsLayout from '@/app/settings/layout'

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

describe('SettingsLayout', () => {
  it('renders layout with children', () => {
    const { getByText, getByTestId } = render(
      <SettingsLayout>
        <div>Settings Content</div>
      </SettingsLayout>
    )
    expect(getByText('Settings Content')).toBeInTheDocument()
    expect(getByTestId('navbar')).toBeInTheDocument()
    expect(getByTestId('sidebar')).toBeInTheDocument()
  })
})

