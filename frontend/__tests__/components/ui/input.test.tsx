import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'

describe('Input Component', () => {
  it('renders correctly with default props', () => {
    render(<Input data-testid="test-input" />)
    const input = screen.getByTestId('test-input')
    expect(input).toBeInTheDocument()
    expect(input.tagName).toBe('INPUT')
  })

  it('accepts and displays value', () => {
    const handleChange = jest.fn()
    render(<Input data-testid="test-input" value="test value" onChange={handleChange} />)
    const input = screen.getByTestId('test-input') as HTMLInputElement
    expect(input.value).toBe('test value')
  })

  it('handles onChange events', async () => {
    const handleChange = jest.fn()
    render(
      <Input
        data-testid="test-input"
        onChange={handleChange}
        placeholder="Enter text"
      />
    )
    
    const input = screen.getByTestId('test-input')
    await userEvent.type(input, 'hello')
    
    expect(handleChange).toHaveBeenCalled()
    expect(input).toHaveValue('hello')
  })

  it('renders with placeholder', () => {
    render(<Input placeholder="Enter your name" />)
    expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument()
  })

  it('renders different input types', () => {
    const { rerender } = render(<Input type="text" data-testid="test-input" />)
    expect(screen.getByTestId('test-input')).toHaveAttribute('type', 'text')

    rerender(<Input type="email" data-testid="test-input" />)
    expect(screen.getByTestId('test-input')).toHaveAttribute('type', 'email')

    rerender(<Input type="password" data-testid="test-input" />)
    expect(screen.getByTestId('test-input')).toHaveAttribute('type', 'password')
  })

  it('is disabled when disabled prop is true', () => {
    render(<Input disabled data-testid="test-input" />)
    const input = screen.getByTestId('test-input')
    expect(input).toBeDisabled()
  })

  it('is required when required prop is true', () => {
    render(<Input required data-testid="test-input" />)
    const input = screen.getByTestId('test-input')
    expect(input).toBeRequired()
  })

  it('applies custom className', () => {
    render(<Input className="custom-class" data-testid="test-input" />)
    const input = screen.getByTestId('test-input')
    expect(input).toHaveClass('custom-class')
  })
})
