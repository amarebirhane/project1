import { render, screen } from '@/__tests__/utils/test-utils'
import { Layout } from '@/components/layout'

// Mock child components
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

describe('Layout Component', () => {
  it('renders layout with children', () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>
    )

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders Navbar component', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    )

    expect(screen.getByTestId('navbar')).toBeInTheDocument()
  })

  it('renders Sidebar component', () => {
    render(
      <Layout>
        <div>Content</div>
      </Layout>
    )

    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
  })

  it('renders multiple children', () => {
    render(
      <Layout>
        <div>Child 1</div>
        <div>Child 2</div>
        <div>Child 3</div>
      </Layout>
    )

    expect(screen.getByText('Child 1')).toBeInTheDocument()
    expect(screen.getByText('Child 2')).toBeInTheDocument()
    expect(screen.getByText('Child 3')).toBeInTheDocument()
  })

  it('renders complex children components', () => {
    const ComplexChild = () => (
      <div>
        <h1>Title</h1>
        <p>Description</p>
      </div>
    )

    render(
      <Layout>
        <ComplexChild />
      </Layout>
    )

    expect(screen.getByText('Title')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
  })

  it('applies correct layout structure', () => {
    const { container } = render(
      <Layout>
        <div>Content</div>
      </Layout>
    )

    // Check that layout container exists
    const layoutContainer = container.firstChild
    expect(layoutContainer).toBeInTheDocument()
  })
})

