import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Switch } from '@/components/ui/switch'

describe('Switch Component', () => {
  it('renders switch element', () => {
    const { container } = render(<Switch />)
    const switchElement = container.querySelector('[data-slot="switch"]')
    expect(switchElement).toBeInTheDocument()
  })

  it('handles checked state', () => {
    render(<Switch checked={true} />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toBeChecked()
  })

  it('handles unchecked state', () => {
    render(<Switch checked={false} />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).not.toBeChecked()
  })

  it('handles onChange events', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    render(<Switch onCheckedChange={handleChange} />)
    const switchElement = screen.getByRole('switch')
    
    await user.click(switchElement)
    expect(handleChange).toHaveBeenCalled()
  })

  it('handles disabled state', () => {
    render(<Switch disabled />)
    const switchElement = screen.getByRole('switch')
    expect(switchElement).toBeDisabled()
  })

  it('applies custom className', () => {
    const { container } = render(<Switch className="custom-class" />)
    const switchElement = container.querySelector('[data-slot="switch"]')
    expect(switchElement).toHaveClass('custom-class')
  })
})

