import React from 'react'
import { render, screen } from '@testing-library/react'
import UnauthorizedLayout from '@/app/unauthorized/layout'

describe('UnauthorizedLayout', () => {
  it('renders layout with children', () => {
    render(
      <UnauthorizedLayout>
        <div>Test Content</div>
      </UnauthorizedLayout>
    )
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('applies min-height style', () => {
    const { container } = render(
      <UnauthorizedLayout>
        <div>Content</div>
      </UnauthorizedLayout>
    )
    const layout = container.firstChild as HTMLElement
    expect(layout).toHaveClass('min-h-screen')
  })
})

