import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/common/Tabs'

describe('Tabs Component (common)', () => {
  it('renders tabs with triggers', () => {
    const handleValueChange = jest.fn()

    render(
      <Tabs value="tab1" onValueChange={handleValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    expect(screen.getByText('Tab 1')).toBeInTheDocument()
    expect(screen.getByText('Tab 2')).toBeInTheDocument()
  })

  it('renders active tab content', () => {
    const handleValueChange = jest.fn()

    render(
      <Tabs value="tab1" onValueChange={handleValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    )

    expect(screen.getByText('Content 1')).toBeInTheDocument()
  })

  it('hides inactive tab content', () => {
    const handleValueChange = jest.fn()

    render(
      <Tabs value="tab1" onValueChange={handleValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    expect(screen.getByText('Content 1')).toBeInTheDocument()
    const content2 = screen.getByText('Content 2')
    expect(content2).toHaveAttribute('hidden')
  })

  it('calls onValueChange when tab is clicked', async () => {
    const user = userEvent.setup()
    const handleValueChange = jest.fn()

    render(
      <Tabs value="tab1" onValueChange={handleValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    const tab2 = screen.getByText('Tab 2')
    await user.click(tab2)

    expect(handleValueChange).toHaveBeenCalledWith('tab2')
  })

  it('handles keyboard navigation with Enter key', async () => {
    const user = userEvent.setup()
    const handleValueChange = jest.fn()

    render(
      <Tabs value="tab1" onValueChange={handleValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    const tab2 = screen.getByText('Tab 2')
    await user.type(tab2, '{Enter}')

    expect(handleValueChange).toHaveBeenCalledWith('tab2')
  })

  it('handles keyboard navigation with Space key', async () => {
    const user = userEvent.setup()
    const handleValueChange = jest.fn()

    render(
      <Tabs value="tab1" onValueChange={handleValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    const tab2 = screen.getByText('Tab 2')
    await user.type(tab2, ' ')

    expect(handleValueChange).toHaveBeenCalledWith('tab2')
  })

  it('sets correct aria attributes for active tab', () => {
    const handleValueChange = jest.fn()

    render(
      <Tabs value="tab1" onValueChange={handleValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>
    )

    const tab1 = screen.getByText('Tab 1')
    expect(tab1).toHaveAttribute('aria-selected', 'true')
    expect(tab1).toHaveAttribute('tabIndex', '0')

    const tab2 = screen.getByText('Tab 2')
    expect(tab2).toHaveAttribute('aria-selected', 'false')
    expect(tab2).toHaveAttribute('tabIndex', '-1')
  })

  it('sets correct aria attributes for tab content', () => {
    const handleValueChange = jest.fn()

    render(
      <Tabs value="tab1" onValueChange={handleValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
      </Tabs>
    )

    const content = screen.getByText('Content 1')
    expect(content).toHaveAttribute('role', 'tabpanel')
    expect(content).toHaveAttribute('id', 'tab-content-tab1')
    expect(content).toHaveAttribute('aria-labelledby', 'tab-trigger-tab1')
  })

  it('throws error when TabsTrigger is used outside Tabs', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        </TabsList>
      )
    }).toThrow('Tabs components must be used within a Tabs provider')

    consoleSpy.mockRestore()
  })

  it('throws error when TabsContent is used outside Tabs', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TabsContent value="tab1">Content</TabsContent>)
    }).toThrow('Tabs components must be used within a Tabs provider')

    consoleSpy.mockRestore()
  })

  it('renders multiple tabs correctly', () => {
    const handleValueChange = jest.fn()

    render(
      <Tabs value="tab2" onValueChange={handleValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
          <TabsTrigger value="tab3">Tab 3</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
        <TabsContent value="tab3">Content 3</TabsContent>
      </Tabs>
    )

    expect(screen.getByText('Tab 1')).toBeInTheDocument()
    expect(screen.getByText('Tab 2')).toBeInTheDocument()
    expect(screen.getByText('Tab 3')).toBeInTheDocument()
    expect(screen.getByText('Content 2')).toBeInTheDocument()
  })
})

