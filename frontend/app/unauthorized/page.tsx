'use client';

import React from 'react';
import styled from 'styled-components';
import { theme } from '@/components/common/theme';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldOff, ArrowLeft } from 'lucide-react';

const UnauthorizedContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh; /* Use full height again since we have our own layout */
  background: ${theme.colors.background};
  padding: ${theme.spacing.xl};
  text-align: center;
`;

const IconWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${theme.colors.warning}20;
  margin-bottom: ${theme.spacing.xl};

  svg {
    width: 40px;
    height: 40px;
    color: ${theme.colors.warning};
  }
`;

const Title = styled.h1`
  font-size: ${theme.typography.fontSizes.xl};
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing.md};
`;

const Message = styled.p`
  font-size: ${theme.typography.fontSizes.md};
  color: ${theme.colors.textSecondary};
  max-width: 600px;
  margin-bottom: ${theme.spacing.xl};
`;

const BackButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  background-color: ${theme.colors.primary};
  color: ${theme.colors.background};
  border: none;
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.md};
  cursor: pointer;
  transition: all ${theme.transitions.default};

  &:hover {
    background-color: ${props => {
      const color = theme.colors.primary;
      return `${color}dd`;
    }};
  }

  svg {
    width: 18px;
    height: 18px;
  }
`;

export default function UnauthorizedPage() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <UnauthorizedContainer>
      <IconWrapper>
        <ShieldOff />
      </IconWrapper>
      <Title>Access Denied</Title>
      <Message>
        You do not have permission to access this page. If you believe this is an error, please contact your administrator.
      </Message>
      <BackButton onClick={handleGoBack}>
        <ArrowLeft />
        Go Back
      </BackButton>
    </UnauthorizedContainer>
  );
} 