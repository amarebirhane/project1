'use client';
import styled from 'styled-components';

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  background-color: var(--background, #ffffff);
`;

const Spinner = styled.div`
  width: 50px;
  height: 50px;
  border: 4px solid var(--border, #e5e7eb);
  border-top-color: var(--primary, #3b82f6);
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  margin-top: 1rem;
  font-size: 1.125rem;
  color: var(--text-muted, #6b7280);
  font-weight: 500;
`;

export default function Loading() {
    return (
        <LoadingWrapper>
            <Spinner />
            <LoadingText>Loading...</LoadingText>
        </LoadingWrapper>
    );
}
