'use client';
import Link from 'next/link';
import styled from 'styled-components';
import { Home } from 'lucide-react';

const NotFoundWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  text-align: center;
  padding: 2rem;
  background-color: var(--background, #ffffff);
`;

const ErrorCode = styled.h1`
  font-size: 6rem;
  font-weight: 800;
  line-height: 1;
  color: var(--primary, #3b82f6);
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-dark, #111827);
  margin-bottom: 1rem;
`;

const Message = styled.p`
  color: var(--text-muted, #6b7280);
  font-size: 1.125rem;
  margin-bottom: 2rem;
  max-width: 500px;
`;

const HomeButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background-color: var(--primary, #3b82f6);
  color: white;
  border-radius: 0.375rem;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.9;
  }
`;

export default function NotFound() {
    return (
        <NotFoundWrapper>
            <ErrorCode>404</ErrorCode>
            <Title>Page Not Found</Title>
            <Message>
                Sorry, we couldn't find the page you're looking for. It might have been removed, had its name changed, or is temporarily unavailable.
            </Message>
            <HomeButton href="/dashboard">
                <Home size={20} />
                Back to Dashboard
            </HomeButton>
        </NotFoundWrapper>
    );
}
