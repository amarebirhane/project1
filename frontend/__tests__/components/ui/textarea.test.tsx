import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Textarea } from '@/components/ui/textarea'

describe('Textarea Component', () => {
  it('renders textarea element', () => {
    const { container } = render(<Textarea />)
    const textarea = container.querySelector('[data-slot="textarea"]')
    expect(textarea).toBeInTheDocument()
    expect(textarea?.tagName).toBe('TEXTAREA')
  })

  it('displays value', () => {
    render(<Textarea value="Test content" onChange={() => {}} />)
    expect(screen.getByDisplayValue('Test content')).toBeInTheDocument()
  })

  it('handles onChange events', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()
    render(<Textarea onChange={handleChange} />)
    const textarea = screen.getByRole('textbox')
    
    await user.type(textarea, 'Hello')
    expect(handleChange).toHaveBeenCalled()
  })

  it('applies placeholder', () => {
    render(<Textarea placeholder="Enter text..." />)
    expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(<Textarea className="custom-class" />)
    const textarea = container.querySelector('[data-slot="textarea"]')
    expect(textarea).toHaveClass('custom-class')
  })

  it('handles disabled state', () => {
    render(<Textarea disabled />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeDisabled()
  })

  it('handles required attribute', () => {
    render(<Textarea required />)
    const textarea = screen.getByRole('textbox')
    expect(textarea).toBeRequired()
  })
})

