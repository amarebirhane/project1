'use client';
import { useEffect } from 'react';
import styled from 'styled-components';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { theme } from '@/components/common/theme';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: ${theme.spacing.xl};
  text-align: center;
  background: ${theme.colors.background};
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
  font-size: ${theme.typography.fontSizes.md};
  font-weight: ${theme.typography.fontWeights.bold};
  color: ${theme.colors.textDark};
  margin-bottom: ${theme.spacing.md};
`;

const Message = styled.p`
  color: ${theme.colors.textSecondary};
  margin-bottom: ${theme.spacing.xl};
  max-width: 500px;
`;

const RetryButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md} ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.md};
  font-weight: ${theme.typography.fontWeights.medium};
  cursor: pointer;
  background: ${theme.colors.primary};
  color: ${theme.colors.primaryForeground};
  border: none;
  transition: all ${theme.transitions.default};

  &:hover {
    opacity: 0.9;
    transform: translateY(-2px);
  }
`;

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <html>
            <body>
                <ErrorContainer>
                    <IconWrapper>
                        <AlertCircle />
                    </IconWrapper>
                    <Title>Oops! Something went wrong.</Title>
                    <Message>
                        We've encountered an unexpected error. Our team has been notified and is working on a fix.
                    </Message>
                    <RetryButton onClick={() => reset()}>
                        <RefreshCw size={18} />
                        Try Again
                    </RetryButton>
                </ErrorContainer>
            </body>
        </html>
    );
}
