'use client';
import React from 'react';
import styled, { keyframes } from 'styled-components';
import { theme } from './theme';

// Spinner animation
const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

// Pulse animation
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

// Bounce animation
const bounce = keyframes`
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-15px); }
  60% { transform: translateY(-7px); }
`;

// Fade animation
const fade = keyframes`
  0%, 100% { opacity: 0.2; }
  50% { opacity: 1; }
`;

// Typing dots animation (similar to your existing LoadingDots)
const dots = keyframes`
  0%, 20% { content: '.'; }
  40% { content: '..'; }
  60% { content: '...'; }
  80%, 100% { content: ''; }
`;

// Container for all loading components
const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${theme.spacing.md};
`;

// Spinner loading component
const SpinnerContainer = styled.div<{ size?: string }>`
  width: ${props => props.size || '40px'};
  height: ${props => props.size || '40px'};
  border: 3px solid ${theme.colors.backgroundSecondary};
  border-top: 3px solid ${theme.colors.primary};
  border-radius: 50%;
  animation: ${spin} 1s linear infinite;
`;

// Dots loading component
const DotsContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Dot = styled.div<{ delay?: string }>`
  width: 10px;
  height: 10px;
  margin: 0 ${theme.spacing.xxs};
  background-color: ${theme.colors.primary};
  border-radius: 50%;
  animation: ${fade} 1.4s infinite ease-in-out;
  animation-delay: ${props => props.delay || '0s'};
`;

// Text with dots loading component (similar to your existing LoadingDots)
const LoadingText = styled.div`
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.fontSizes.md};
  color: ${theme.colors.textSecondary};
  display: flex;
  align-items: center;
`;

const LoadingDots = styled.span`
  &::after {
    content: '.';
    animation: ${dots} 1.5s steps(5, end) infinite;
  }
`;

// Progress bar loading component
const ProgressContainer = styled.div`
  width: 100%;
  max-width: 300px;
  height: 8px;
  background-color: ${theme.colors.backgroundSecondary};
  border-radius: ${theme.borderRadius.sm};
  overflow: hidden;
`;

const ProgressBar = styled.div<{ width: string }>`
  height: 100%;
  width: ${props => props.width};
  background-color: ${theme.colors.primary};
  border-radius: ${theme.borderRadius.sm};
  animation: ${pulse} 1.5s infinite;
`;

// Overlay loading component (for full page loading)
const OverlayContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

// Card loading component (for loading within a card)
const CardLoadingContainer = styled.div`
  padding: ${theme.spacing.md};
  background-color: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  box-shadow: ${theme.shadows.sm};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 200px;
`;

const CardLoadingText = styled.div`
  margin-top: ${theme.spacing.md};
  font-family: ${theme.typography.fontFamily};
  font-size: ${theme.typography.fontSizes.md};
  color: ${theme.colors.textSecondary};
`;

// Bounce loading component
const BounceContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const BounceDot = styled.div<{ delay?: string }>`
  width: 12px;
  height: 12px;
  margin: 0 ${theme.spacing.xxs};
  background-color: ${theme.colors.primary};
  border-radius: 50%;
  animation: ${bounce} 1.4s infinite;
  animation-delay: ${props => props.delay || '0s'};
`;

// Skeleton loading component
const SkeletonBase = styled.div`
  background: linear-gradient(
    90deg,
    ${theme.colors.backgroundSecondary} 25%,
    rgba(245, 245, 245, 0.7) 50%,
    ${theme.colors.backgroundSecondary} 75%
  );
  background-size: 200% 100%;
  animation: ${pulse} 1.5s infinite;
  border-radius: ${theme.borderRadius.sm};
`;

const SkeletonText = styled(SkeletonBase)<{ width?: string }>`
  height: 16px;
  width: ${props => props.width || '100%'};
  margin-bottom: ${theme.spacing.sm};
`;

const SkeletonCircle = styled(SkeletonBase)<{ size?: string }>`
  height: ${props => props.size || '50px'};
  width: ${props => props.size || '50px'};
  border-radius: 50%;
`;

const SkeletonRect = styled(SkeletonBase)<{ height?: string; width?: string }>`
  height: ${props => props.height || '100px'};
  width: ${props => props.width || '100%'};
`;

// Export components
export const Spinner = ({ size }: { size?: string }) => (
  <LoadingContainer>
    <SpinnerContainer size={size} />
  </LoadingContainer>
);

export const DotsLoading = () => (
  <LoadingContainer>
    <DotsContainer>
      <Dot delay="0s" />
      <Dot delay="0.2s" />
      <Dot delay="0.4s" />
    </DotsContainer>
  </LoadingContainer>
);

export const TextLoading = ({ text = "Loading" }: { text?: string }) => (
  <LoadingContainer>
    <LoadingText>
      {text}<LoadingDots />
    </LoadingText>
  </LoadingContainer>
);

export const Progress = ({ progress = 50 }: { progress?: number }) => (
  <LoadingContainer>
    <ProgressContainer>
      <ProgressBar width={`${progress}%`} />
    </ProgressContainer>
  </LoadingContainer>
);

export const BounceLoading = () => (
  <LoadingContainer>
    <BounceContainer>
      <BounceDot delay="0s" />
      <BounceDot delay="0.2s" />
      <BounceDot delay="0.4s" />
    </BounceContainer>
  </LoadingContainer>
);

export const OverlayLoading = () => (
  <OverlayContainer>
    <SpinnerContainer size="60px" />
  </OverlayContainer>
);

export const CardLoading = ({ text = "Loading" }: { text?: string }) => (
  <CardLoadingContainer>
    <SpinnerContainer size="40px" />
    <CardLoadingText>
      {text}<LoadingDots />
    </CardLoadingText>
  </CardLoadingContainer>
);

export const SkeletonLoading = {
  Text: ({ width }: { width?: string }) => <SkeletonText width={width} />,
  Circle: ({ size }: { size?: string }) => <SkeletonCircle size={size} />,
  Rectangle: ({ height, width }: { height?: string; width?: string }) => 
    <SkeletonRect height={height} width={width} />,
};

// Default export with all loading components
const LoadingComponents = {
  Spinner,
  DotsLoading,
  TextLoading,
  Progress,
  BounceLoading,
  OverlayLoading,
  CardLoading,
  SkeletonLoading,
};

export default LoadingComponents; 