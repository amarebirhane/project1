import React from 'react'
import styled from 'styled-components'
import { render, screen } from './test-utils'

const TestComponent = styled.div`
  color: ${props => props.theme.colors.primary};
  padding: ${props => props.theme.spacing.sm};
`

describe('Debug StyledThemeProvider', () => {
    it('identifies if theme is provided', () => {
        let capturedTheme: any = null
        const ThemeChecker = styled.div`
      background: ${props => {
                capturedTheme = props.theme
                return 'red'
            }};
    `

        render(<ThemeChecker />)

        console.log('CAPTURED THEME:', JSON.stringify(capturedTheme, null, 2))
        expect(capturedTheme).toBeDefined()
        expect(capturedTheme.colors).toBeDefined()
        expect(capturedTheme.colors.primary).toBeDefined()
    })

    it('renders a styled component using custom render', () => {
        render(<TestComponent data-testid="test">Hello</TestComponent>)
        expect(screen.getByTestId('test')).toBeInTheDocument()
    })
})
