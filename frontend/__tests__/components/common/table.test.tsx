import React from 'react'
import { render, screen } from '@testing-library/react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/common/Table'

describe('Table Components', () => {
  // FIX: This test was causing the error because 'Content' (a text node) was a direct child of <table>
  // The fix is to provide valid table children, such as a TableBody.
  it('renders Table component with valid children', () => {
    render(
      <Table data-testid="test-table">
        <TableBody> 
            <TableRow>
                <TableCell>Test Content</TableCell>
            </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByTestId('test-table')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('renders TableHeader', () => {
    render(
      <Table>
        <TableHeader data-testid="test-header">
          <TableRow>
            <TableHead>Header 1</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    )
    expect(screen.getByText('Header 1')).toBeInTheDocument()
  })

  it('renders TableBody', () => {
    render(
      <Table>
        <TableBody data-testid="test-body">
          <TableRow>
            <TableCell>Cell 1</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByText('Cell 1')).toBeInTheDocument()
  })

  it('renders TableRow', () => {
    render(
      <Table>
        <TableBody>
          <TableRow data-testid="test-row">
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByTestId('test-row')).toBeInTheDocument()
  })

  it('renders TableHead with text', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Column Header</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    )
    expect(screen.getByText('Column Header')).toBeInTheDocument()
  })

  it('renders TableCell with text', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Data Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByText('Data Cell')).toBeInTheDocument()
  })

  it('renders complete table structure', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>John Doe</TableCell>
            <TableCell>john@example.com</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    )
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('john@example.com')).toBeInTheDocument()
  })
})