import React from 'react'
import { render, screen } from '@testing-library/react'
import Footer from '@/components/common/Footer'


// Mock next/link WITH display name
jest.mock('next/link', () => {
  const Link = ({
    children,
    href,
  }: {
    children: React.ReactNode
    href: string
  }) => <a href={href}>{children}</a>

  Link.displayName = 'NextLinkMock'

  return Link
})

describe('Footer Component', () => {
  it('renders footer element', () => {
    render(<Footer />)
    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()
  })

  it('displays copyright text', () => {
    render(<Footer />)
    expect(
      screen.getByText(/© 2025 Financial Management System/i)
    ).toBeInTheDocument()
  })

  it('renders navigation links', () => {
    render(<Footer />)
    expect(screen.getByText('About')).toBeInTheDocument()
    expect(screen.getByText('Privacy')).toBeInTheDocument()
    expect(screen.getByText('Terms')).toBeInTheDocument()
    expect(screen.getByText('Contact')).toBeInTheDocument()
    expect(screen.getByText('Support')).toBeInTheDocument()
  })

  it('has correct link hrefs', () => {
    render(<Footer />)
    expect(screen.getByText('About').closest('a')).toHaveAttribute('href', '/service/about')
    expect(screen.getByText('Privacy').closest('a')).toHaveAttribute('href', '/service/privacy')
    expect(screen.getByText('Terms').closest('a')).toHaveAttribute('href', '/service/terms')
    expect(screen.getByText('Contact').closest('a')).toHaveAttribute('href', '/service/contact')
    expect(screen.getByText('Support').closest('a')).toHaveAttribute('href', '/service/support')
  })
})
