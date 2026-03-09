'use client';
import { useEffect } from 'react';
import styled from 'styled-components';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  padding: 2rem;
  text-align: center;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--text-dark, #111827);
`;

const Message = styled.p`
  color: var(--text-muted, #6b7280);
  margin-bottom: 2rem;
  max-width: 400px;
`;

const Button = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: var(--primary, #3b82f6);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-weight: 500;
  cursor: pointer;
  
  &:hover {
    opacity: 0.9;
  }
`;

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error(error);
    }, [error]);

    return (
        <Container>
            <AlertTriangle size={48} color="#ef4444" style={{ marginBottom: '1rem' }} />
            <Title>Something went wrong!</Title>
            <Message>There was a problem loading this section. Please try again.</Message>
            <Button onClick={() => reset()}>
                <RefreshCw size={18} />
                Try again
            </Button>
        </Container>
    );
}
