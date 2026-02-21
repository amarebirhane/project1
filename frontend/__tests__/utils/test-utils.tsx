import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import * as AuthContextModule from '@/lib/rbac/auth-context'
import { ThemeProvider } from 'next-themes'
import { ThemeProvider as StyledThemeProvider } from 'styled-components'
import { lightTheme } from '@/components/common/theme'

// Fallback to pass-through if AuthProvider is undefined (which happens when it's mocked in tests)
const SafeAuthProvider = (AuthContextModule as any).AuthProvider || (({ children }: { children: React.ReactNode }) => <>{children}</>)

// Mock theme provider
const MockThemeProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <StyledThemeProvider theme={lightTheme}>
        {children}
      </StyledThemeProvider>
    </ThemeProvider>
  )
}

// Custom render function that includes providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <MockThemeProvider>
      <SafeAuthProvider>
        {children}
      </SafeAuthProvider>
    </MockThemeProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }
