import React from 'react'
import { render, screen } from '@testing-library/react'
import { Label } from '@/components/ui/label'

describe('Label Component', () => {
  it('renders label text', () => {
    render(<Label>Test Label</Label>)
    expect(screen.getByText('Test Label')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Label className="custom-class">Test</Label>)
    const label = container.querySelector('[data-slot="label"]')
    expect(label).toHaveClass('custom-class')
  })

  it('forwards props correctly', () => {
    render(<Label htmlFor="test-input">Test Label</Label>)
    const label = screen.getByText('Test Label')
    expect(label).toHaveAttribute('for', 'test-input')
  })

  it('handles empty children', () => {
    const { container } = render(<Label />)
    const label = container.querySelector('[data-slot="label"]')
    expect(label).toBeInTheDocument()
  })
})

