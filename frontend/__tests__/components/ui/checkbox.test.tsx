import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Checkbox } from '@/components/ui/checkbox'

describe('Checkbox Component', () => {
  it('renders checkbox element', () => {
    const { container } = render(<Checkbox />)
    const checkbox = container.querySelector('[data-slot="checkbox"]')
    expect(checkbox).toBeInTheDocument()
  })

  it('handles checked state', () => {
    render(<Checkbox checked={true} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeChecked()
  })

  it('handles unchecked state', () => {
    render(<Checkbox checked={false} />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()
  })

  it('handles onChange events', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    render(<Checkbox onCheckedChange={handleChange} />)
    const checkbox = screen.getByRole('checkbox')
    
    await user.click(checkbox)
    expect(handleChange).toHaveBeenCalled()
  })

  it('handles disabled state', () => {
    render(<Checkbox disabled />)
    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).toBeDisabled()
  })

  it('applies custom className', () => {
    const { container } = render(<Checkbox className="custom-class" />)
    const checkbox = container.querySelector('[data-slot="checkbox"]')
    expect(checkbox).toHaveClass('custom-class')
  })
})

