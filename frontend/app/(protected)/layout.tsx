'use client';

import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Navbar } from '@/components/common/Navbar';
import { Sidebar } from '@/components/common/Sidebar';
import { useAuth } from '/@/lib/rbac/auth-context';
import { useRouter } from 'next/navigation';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: 250px; // Width of the sidebar
  min-height: 100vh;
  background-color: #f9fafb;
`;

const ContentWrapper = styled.div`
  margin-top: 48px; // Height of the header + some extra space
  padding: 24px;
`;

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);
  
  // While checking authentication status, could show a loading state
  if (isLoading) {
    return <div>Loading...</div>;
  }
  
  // If not authenticated, don't render children yet (will redirect in useEffect)
  if (!isAuthenticated) {
    return null;
  }
  
  // User is authenticated, render the protected layout
  return (
    <LayoutContainer>
      <Sidebar />
      <MainContent>
        <Navbar />
        <ContentWrapper>
          {children}
        </ContentWrapper>
      </MainContent>
    </LayoutContainer>
  );
}