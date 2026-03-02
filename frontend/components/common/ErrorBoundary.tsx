'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import styled from 'styled-components';
import { theme } from './theme';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
    children?: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: ${theme.spacing.xl};
  text-align: center;
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.lg};
  border: 1px solid ${theme.colors.border};
  margin: ${theme.spacing.lg};
  box-shadow: ${theme.shadows.md};
`;

const IconWrapper = styled.div`
  color: ${theme.colors.error};
  margin-bottom: ${theme.spacing.lg};
  
  svg {
    width: 64px;
    height: 64px;
  }
`;

const Title = styled.h2`
  font-size: ${theme.typography.fontSizes.lg};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${theme.colors.textDark};
  margin-bottom: ${theme.spacing.sm};
`;

const Message = styled.p`
  color: ${theme.colors.textSecondary};
  margin-bottom: ${theme.spacing.xl};
  max-width: 400px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
`;

const Button = styled.button<{ $primary?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.md};
  font-weight: ${theme.typography.fontWeights.medium};
  cursor: pointer;
  transition: all ${theme.transitions.default};
  
  background: ${props => props.$primary ? theme.colors.primary : 'transparent'};
  color: ${props => props.$primary ? theme.colors.primaryForeground : theme.colors.text};
  border: 1px solid ${props => props.$primary ? theme.colors.primary : theme.colors.border};

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    background: ${props => props.$primary ? theme.colors.primary : theme.colors.backgroundSecondary};
  }

  &:active {
    transform: translateY(0);
  }
`;

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    private handleGoHome = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/dashboard';
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <ErrorContainer>
                    <IconWrapper>
                        <AlertCircle />
                    </IconWrapper>
                    <Title>Something went wrong</Title>
                    <Message>
                        An unexpected error occurred. We've been notified and are working on it.
                        {process.env.NODE_ENV === 'development' && (
                            <div style={{ marginTop: '10px', fontSize: '12px', color: '#ef4444', textAlign: 'left', background: '#fee2e2', padding: '10px', borderRadius: '4px', overflow: 'auto', maxHeight: '100px' }}>
                                {this.state.error?.toString()}
                            </div>
                        )}
                    </Message>
                    <ButtonContainer>
                        <Button onClick={this.handleReset} $primary>
                            <RefreshCw size={18} />
                            Try Again
                        </Button>
                        <Button onClick={this.handleGoHome}>
                            <Home size={18} />
                            Back to Dashboard
                        </Button>
                    </ButtonContainer>
                </ErrorContainer>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
