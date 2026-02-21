import { render, screen } from '@/__tests__/utils/test-utils'
import Header from '@/components/common/Header'

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: React.ComponentProps<'img'>) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return <img {...props} />
  },
}))

// Mock next/link
jest.mock('next/link', () => {
  const MockNextLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
  MockNextLink.displayName = 'MockNextLink'
  return MockNextLink
})

describe('Header Component', () => {
  it('renders header element', () => {
    const { container } = render(<Header />)
    const header = container.querySelector('header')
    expect(header).toBeInTheDocument()
  })

  it('displays Financial Management System title', () => {
    render(<Header />)
    expect(screen.getByText('Financial Management System')).toBeInTheDocument()
  })

  it('renders login button', () => {
    render(<Header />)
    const loginLink = screen.getByText('Login').closest('a')
    expect(loginLink).toBeInTheDocument()
    expect(loginLink).toHaveAttribute('href', '/auth/login')
  })

  it('renders logo image', () => {
    render(<Header />)
    const logo = screen.getByAltText('Financial Management System')
    expect(logo).toBeInTheDocument()
    expect(logo).toHaveAttribute('src', '/log.png')
  })
})