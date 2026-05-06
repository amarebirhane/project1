//app/page.tsx
'use client';

import React, { useState } from 'react';
import styled, { keyframes, css, ThemeProvider } from 'styled-components';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import Header from '@/components/common/Header';
import Footer from '@/components/common/Footer';
import { theme as globalTheme, darkTheme } from '@/components/common/theme';

// === THEME ===
// Overriding local theme to match Global Brand (Green)
const theme = {
  colors: {
    primary: globalTheme.colors.primary || '#00AA00', // Brand Green
    primaryDark: '#008800',
    primaryLight: '#4ade80', // bright green for accents
    secondary: '#10b981', // emerald
    bg: '#0b0c10', // Keep dark bg for contrast
    card: '#1f2937',
    text: '#f9fafb',
    // Gradients
    gradientPrimary: 'linear-gradient(135deg, #00AA00, #10b981)',
    gradientText: 'linear-gradient(135deg, #4ade80, #22c55e)',
  },
  shadows: {
    lg: '0 10px 30px rgba(0, 170, 0, 0.2)', // Green tinted shadow
    glow: '0 0 20px rgba(0, 170, 0, 0.4)',
  },
  radius: '16px',
};

// === ANIMATIONS ===
const spiralRotatePrimary = keyframes`
  0% { transform: rotate(0deg) scale(1) translate(0, 0); }
  25% { transform: rotate(90deg) scale(1.1) translate(5%, 5%); }
  50% { transform: rotate(180deg) scale(1.2) translate(0, 0); }
  75% { transform: rotate(270deg) scale(1.1) translate(-5%, -5%); }
  100% { transform: rotate(360deg) scale(1) translate(0, 0); }
`;

const spiralRotateSecondary = keyframes`
  0% { transform: rotate(360deg) scale(1.1) translate(0, 0); }
  25% { transform: rotate(270deg) scale(1) translate(-5%, 5%); }
  50% { transform: rotate(180deg) scale(0.9) translate(0, 0); }
  75% { transform: rotate(90deg) scale(1) translate(5%, -5%); }
  100% { transform: rotate(0deg) scale(1.1) translate(0, 0); }
`;

const particleFloat = keyframes`
  0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.8; }
  25% { transform: translate(50px, -50px) rotate(90deg); opacity: 1; }
  50% { transform: translate(-30px, -100px) rotate(180deg); opacity: 0.6; }
  75% { transform: translate(-50px, 30px) rotate(270deg); opacity: 0.9; }
`;

const cardSpiral = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`;

const teamSpiral = keyframes`
  0% { transform: rotate(0deg) scale(1); }
  100% { transform: rotate(360deg) scale(1.1); }
`;

const teamSpiralReverse = keyframes`
  0% { transform: rotate(360deg) scale(1.1); }
  100% { transform: rotate(0deg) scale(1); }
`;

// === STYLED COMPONENTS ===
const Wrapper = styled.div`
  min-height: 100vh;
  background-color: ${theme.colors.bg};
  color: ${theme.colors.text};
  font-family: 'Inter', sans-serif;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
`;

const GradientBackground = styled.div`
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  /* Updated to Green/Emerald gradients */
  background: radial-gradient(circle at 30% 50%, rgba(12, 14, 12, 0.15) 0%, transparent 50%),
              radial-gradient(circle at 70% 50%, rgba(8, 10, 9, 0.15) 0%, transparent 50%),
              linear-gradient(135deg, rgb(9, 10, 10) 0%, rgb(12, 11, 11) 100%);
  
  &::before {
    content: '';
    position: absolute;
    top: -100%;
    left: -100%;
    width: 300%;
    height: 300%;
    /* Updated conic gradient to Green spectrum */
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      rgba(16, 17, 16, 0.2) 45deg,
      transparent 90deg,
      rgba(13, 15, 14, 0.2) 135deg,
      transparent 180deg,
      rgba(72, 74, 72, 0.2) 225deg,
      transparent 270deg,
      rgba(86, 85, 85, 0.2) 315deg,
      transparent 360deg
    );
    animation: ${spiralRotatePrimary} 30s linear infinite;
    opacity: 0.6;
  }

  &::after {
    content: '';
    position: absolute;
    top: -100%;
    right: -100%;
    width: 300%;
    height: 300%;
    background: conic-gradient(
      from 180deg,
      transparent 0deg,
      rgba(16, 185, 129, 0.2) 60deg,
      transparent 120deg,
      rgba(0, 170, 0, 0.2) 180deg,
      transparent 240deg,
      rgba(16, 185, 129, 0.2) 300deg,
      transparent 360deg
    );
    animation: ${spiralRotateSecondary} 35s linear infinite reverse;
    opacity: 0.5;
  }
`;


const HeroSection = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  overflow: hidden;
  text-align: center;
  padding: 3rem 1rem;
  z-index: 1;
  
  /* Additional spiral particles effect - Updated to Green */
  &::before {
    content: '';
    position: absolute;
    width: 2px;
    height: 2px;
    background: rgba(0, 170, 0, 0.8);
    border-radius: 50%;
    box-shadow: 
      100px 200px 0 0 rgba(16, 185, 129, 0.6),
      -150px 300px 0 0 rgba(0, 170, 0, 0.5),
      200px -100px 0 0 rgba(16, 185, 129, 0.7),
      -200px -200px 0 0 rgba(0, 170, 0, 0.4),
      300px 100px 0 0 rgba(16, 185, 129, 0.5);
    animation: ${particleFloat} 20s ease-in-out infinite;
    z-index: 0;
  }
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: 700;
  color: white;
  max-width: 800px;
  line-height: 1.2;
  margin-bottom: 1.5rem;

  @media (min-width: 768px) {
    font-size: 4rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: #a7f3d0; /* Soft Green tint for subtitle */
  max-width: 700px;
  margin: 0 auto 2rem auto;
  line-height: 1.6;
`;

const FeatureSection = styled.section`
  padding: 5rem 1.5rem;
  background-color: #0d0e12; // Slightly different dark color for section separation
  position: relative;
  z-index: 1;
  
  /* Subtle spiral accent */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: radial-gradient(
      ellipse at top left,
      rgba(0, 170, 0, 0.1) 0%,
      transparent 50%
    ),
    radial-gradient(
      ellipse at bottom right,
      rgba(16, 185, 129, 0.1) 0%,
      transparent 50%
    );
    pointer-events: none;
    z-index: 0;
  }
  
  > * {
    position: relative;
    z-index: 1;
  }
`;

const ParallelFeaturesContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-top: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const RegularFeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
`;

const Card = styled.div`
  background-color: ${theme.colors.card};
  border-radius: ${theme.radius};
  padding: 1.5rem;
  box-shadow: ${theme.shadows.lg};
  text-align: left;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(0, 170, 0, 0.1);

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      rgba(0, 170, 0, 0.1) 90deg,
      transparent 180deg,
      rgba(16, 185, 129, 0.1) 270deg,
      transparent 360deg
    );
    animation: ${cardSpiral} 8s linear infinite;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover {
    transform: translateY(-8px);
    background-color: rgba(255, 255, 255, 0.05);
    border-color: rgba(0, 170, 0, 0.3);
    box-shadow: ${theme.shadows.glow};
    
    &::before {
      opacity: 1;
    }
    
    h3 {
       color: ${theme.colors.primaryLight};
    }
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 50;
`;

const ModalCard = styled.div`
  background-color: ${theme.colors.card};
  padding: 2rem;
  border-radius: ${theme.radius};
  color: white;
  width: 90%;
  max-width: 600px;
  box-shadow: ${theme.shadows.glow};
  position: relative;
  border: 1px solid rgba(0, 170, 0, 0.2);
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #ccc;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: ${theme.colors.primary};
  }
`;

const TeamSection = styled.section`
  padding: 4rem 1rem;
  text-align: center;
  background-color: rgb(32, 35, 37);
  position: relative;
  z-index: 1;
  overflow: hidden;
  
  /* Spiral background accent */
  &::before {
    content: '';
    position: absolute;
    bottom: -50%;
    right: -50%;
    width: 200%;
    height: 200%;
    /* Updated to Green */
    background: conic-gradient(
      from 45deg,
      transparent 0deg,
      rgba(0, 170, 0, 0.08) 120deg,
      transparent 240deg,
      rgba(16, 185, 129, 0.08) 360deg
    );
    animation: ${teamSpiral} 25s linear infinite;
    z-index: 0;
  }

  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: conic-gradient(
      from 225deg,
      transparent 0deg,
      rgba(16, 185, 129, 0.06) 120deg,
      transparent 240deg,
      rgba(0, 170, 0, 0.06) 360deg
    );
    animation: ${teamSpiralReverse} 30s linear infinite reverse;
    z-index: 0;
  }
  
  > * {
    position: relative;
    z-index: 1;
  }
`;

const TeamImage = styled(Image)`
  border-radius: ${theme.radius};
  box-shadow: ${theme.shadows.lg};
`;


export default function Home() {
  const [openModal, setOpenModal] = useState<string | null>(null);
  const [searchQuery] = useState('');

  const modals = {
    growth: {
      title: 'Advanced Financial Analytics',
      description: 'Transform raw financial data into actionable insights with real-time analytics, predictive modeling, and comprehensive reporting. Track revenue trends, identify cost-saving opportunities, and make data-driven decisions that drive business growth.',
      features: ['Real-time Revenue Tracking', 'Predictive Financial Forecasting', 'Interactive Dashboards', 'Profit Margin Analysis', 'Cash Flow Projections'],
      image: '/images/growth-analyzer.png',
    },
    budget: {
      title: 'Intelligent Budget Management',
      description: 'Streamline budget planning, allocation, and monitoring across departments. Set spending limits, track expenses in real-time, and receive automated alerts when budgets are exceeded. Optimize resource allocation with AI-powered recommendations.',
      features: ['Multi-Department Budgeting', 'Automated Expense Tracking', 'Real-time Budget Alerts', 'Spend Analytics', 'Approval Workflows'],
      image: '/images/budget-allocator.png',
    },
    secure: {
      title: 'Enterprise-Grade Security',
      description: 'Protect sensitive financial data with bank-level encryption, multi-factor authentication, and comprehensive audit trails. Ensure compliance with financial regulations while maintaining seamless user experience.',
      features: ['256-bit Encryption', 'Multi-Factor Authentication', 'Role-Based Access Control', 'Audit Logging', 'GDPR & SOX Compliance'],
      image: '/images/secure-investments.png',
    },
    inventory: {
      title: 'Inventory & Sales Management',
      description: 'Complete inventory control with real-time stock tracking, automated reorder points, and integrated sales management. Monitor product performance, manage suppliers, and optimize inventory turnover.',
      features: ['Real-time Stock Tracking', 'Automated Reorder Alerts', 'Sales Performance Analytics', 'Supplier Management', 'Inventory Valuation'],
      image: '/images/inventory-management.png',
    },
    reporting: {
      title: 'Comprehensive Financial Reporting',
      description: 'Generate professional financial reports, balance sheets, income statements, and custom analytics. Export to PDF, Excel, or share via email. Schedule automated reports for stakeholders.',
      features: ['Financial Statements', 'Custom Report Builder', 'Automated Scheduling', 'Multi-format Export', 'Interactive Charts'],
      image: '/images/financial-reporting.png',
    },
    approval: {
      title: 'Smart Approval Workflows',
      description: 'Streamline expense approvals with intelligent routing, multi-level authorization, and real-time notifications. Track approval status, set spending limits, and ensure policy compliance.',
      features: ['Multi-level Approvals', 'Automated Routing', 'Policy Enforcement', 'Approval History', 'Mobile Notifications'],
      image: '/images/approval-workflows.png',
    },
  };

  const featuresData = Object.keys(modals).map((key) => ({
    id: key,
    ...modals[key as keyof typeof modals],
  }));

  const filteredFeatures = featuresData.filter((feature) =>
    feature.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <div className="dark">
        <Wrapper>
          <Header />

          <HeroSection>
            <GradientBackground />

            <div style={{ zIndex: 10 }}>
              <Title>
                web based financial management system for supermarkets
              </Title>
              <Subtitle>
                Streamline your retail operations with a comprehensive solution designed for modern grocery stores.
                Real-time stock tracking, automated accounting, and performance analytics to help you grow your business.
              </Subtitle>
              <div>
                <Link href="/auth/login">
                  <Button
                    size="lg"
                    className="cursor-pointer transition-all duration-300 text-zinc-100 dark:text-zinc-100 
                    hover:scale-105 hover:shadow-[0_0_20px_rgba(0,170,0,0.5)]"
                    style={{
                      fontSize: '1.1rem',
                      padding: '1rem 2.5rem',
                      fontWeight: 600,
                      background: theme.colors.gradientPrimary,
                      border: 'none',
                      color: 'white',
                      boxShadow: '0 4px 15px rgba(0, 170, 0, 0.4)'
                    }}
                  >
                    Start Now
                  </Button>
                </Link>
                <p
                  style={{
                    marginTop: '1rem',
                    fontSize: '0.9rem',
                    color: '#6ee7b7' // lighter green-grey
                  }}
                >
                  Unlock all features instantly. No payment details required
                </p>
              </div>
            </div>
          </HeroSection>

          <FeatureSection>
            <div
              style={{ textAlign: 'center', marginBottom: '1rem' }}
            >
              <h2 style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
                background: theme.colors.gradientText,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Powerful Features for Supermarket Operations
              </h2>
              <p style={{ fontSize: '1.1rem', color: '#9ca3af', maxWidth: '700px', margin: '0 auto' }}>
                Everything you need to manage stock, sales, and retail finances in one place
              </p>
            </div>

            <ParallelFeaturesContainer>
              {filteredFeatures
                .filter(f => ['inventory', 'reporting', 'approval'].includes(f.id))
                .map((feature) => (
                  <Card
                    key={feature.id}
                    onClick={() => setOpenModal(feature.id)}
                    style={{ minHeight: '280px', display: 'flex', flexDirection: 'column' }}
                  >
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 600, marginBottom: '0.75rem', lineHeight: '1.3', transition: 'color 0.3s' }}>
                      {feature.title}
                    </h3>
                    <p style={{ color: '#d1d5db', fontSize: '0.95rem', lineHeight: '1.6', flex: 1 }}>{feature.description}</p>
                  </Card>
                ))}
            </ParallelFeaturesContainer>

            <RegularFeaturesGrid>
              {filteredFeatures
                .filter(f => !['inventory', 'reporting', 'approval'].includes(f.id))
                .map((feature) => (
                  <Card
                    key={feature.id}
                    onClick={() => setOpenModal(feature.id)}
                  >
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '0.5rem', transition: 'color 0.3s' }}>
                      {feature.title}
                    </h3>
                    <p style={{ color: '#d1d5db' }}>{feature.description}</p>
                  </Card>
                ))}
            </RegularFeaturesGrid>
          </FeatureSection>

          <TeamSection>
            <h2
              style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                marginBottom: '0.5rem',
                background: theme.colors.gradientText,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Trusted by Retailers and Shop Owners
            </h2>
            <p
              style={{
                fontSize: '1.1rem',
                color: '#9ca3af',
                marginBottom: '2rem',
                maxWidth: '600px',
                margin: '0 auto 2rem auto'
              }}
            >
              Built to transform how supermarkets and mini-markets manage their day-to-day operations.
            </p>
            <TeamImage
              src="/images/team1.png"
              alt="Team"
              width={800}
              height={400}
              style={{ objectFit: 'cover', marginBottom: '1rem' }}
            />
            <p
              style={{
                fontSize: '1rem',
                color: '#d1d5db',
                maxWidth: '700px',
                margin: '0 auto',
                lineHeight: '1.6'
              }}
            >
              Our platform powers retail operations for shops of all sizes—from local mini-markets to large supermarket chains.
              We combine deep financial expertise with cutting-edge technology to deliver solutions that drive real business value.
            </p>
          </TeamSection>

          <Footer />

          {openModal && (
            <ModalOverlay onClick={() => setOpenModal(null)}>
              <ModalCard onClick={(e) => e.stopPropagation()}>
                <CloseButton onClick={() => setOpenModal(null)}>×</CloseButton>
                <h2 style={{
                  fontSize: '2rem',
                  marginBottom: '1rem',
                  background: theme.colors.gradientText,
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontWeight: 700
                }}>
                  {modals[openModal as keyof typeof modals].title}
                </h2>
                <p style={{
                  marginBottom: '1.5rem',
                  fontSize: '1.1rem',
                  lineHeight: '1.7',
                  color: '#d1d5db'
                }}>
                  {modals[openModal as keyof typeof modals].description}
                </p>
                <div style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: 600,
                    marginBottom: '1rem',
                    color: 'white'
                  }}>
                    Key Capabilities:
                  </h3>
                  <ul style={{
                    listStyle: 'none',
                    padding: 0,
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '0.75rem'
                  }}>
                    {modals[openModal as keyof typeof modals].features.map((f) => (
                      <li key={f} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.5rem',
                        background: 'rgba(0, 170, 0, 0.1)',
                        borderRadius: '8px',
                        border: '1px solid rgba(0, 170, 0, 0.2)'
                      }}>
                        <span style={{ color: '#10b981', fontSize: '1.2rem' }}>✓</span>
                        <span style={{ color: '#e5e7eb' }}>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                  <Button
                    onClick={() => setOpenModal(null)}
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'white'
                    }}
                  >
                    Close
                  </Button>
                  <Link href="/auth/login">
                    <Button
                      style={{
                        background: theme.colors.gradientPrimary,
                        border: 'none',
                        color: 'white'
                      }}
                    >
                      Try It Now
                    </Button>
                  </Link>
                </div>
              </ModalCard>
            </ModalOverlay>
          )}
        </Wrapper>
      </div>
    </ThemeProvider>
  );
}

