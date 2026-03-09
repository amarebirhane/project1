'use client';

import React, { useState, useEffect } from 'react';
import styled, { ThemeProvider, createGlobalStyle } from 'styled-components';
import { lightTheme, darkTheme } from '@/components/common/theme';
import StyledComponentsRegistry from '@/lib/registry';
import { AuthProvider, useAuth } from '@/lib/rbac/auth-context';
import { Toaster } from '@/components/ui/sonner';
import { useThemeStore } from '@/store/useThemeStore';
import ThemeSync from '@/components/common/ThemeSync';
import FeedbackWidget from '@/components/common/FeedbackWidget';
import AIChatWidget from '@/components/common/AIChatWidget';
import WebSocketInitializer from '@/components/common/WebSocketInitializer';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import CommandPalette from '@/components/common/CommandPalette';

const GlobalStyle = createGlobalStyle`
  body {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    background-color: var(--background, #ffffff);
    color: var(--text, #333333);
    transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
  }
`;

const LayoutContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
`;

const ContentWrapper = styled.div`
  flex: 1;
`;

const WidgetWrapper = () => {
    const { isAuthenticated } = useAuth();
    if (!isAuthenticated) return null;
    return (
        <>
            <FeedbackWidget />
            <AIChatWidget />
        </>
    );
};

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    const themePreference = useThemeStore((state) => state.themePreference);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), 0);
        return () => clearTimeout(timer);
    }, []);

    // Determine effective theme for styled-components ThemeProvider
    let currentTheme = lightTheme;
    if (mounted) {
        const isDark = themePreference === 'dark' ||
            (themePreference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
        currentTheme = isDark ? darkTheme : lightTheme;
    }

    return (
        <>
            <GlobalStyle />
            <ThemeSync />
            <StyledComponentsRegistry>
                <ThemeProvider theme={currentTheme}>
                    <AuthProvider>
                        <ErrorBoundary>
                            <LayoutContainer>
                                <MainContent>
                                    <ContentWrapper>{children}</ContentWrapper>
                                </MainContent>
                            </LayoutContainer>
                        </ErrorBoundary>
                        <Toaster position="top-right" />
                        <WidgetWrapper />
                        <WebSocketInitializer />
                        <CommandPalette />
                    </AuthProvider>
                </ThemeProvider>
            </StyledComponentsRegistry>
        </>
    );
}
