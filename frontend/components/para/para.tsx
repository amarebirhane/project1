'use client';

import React, { ReactNode } from 'react';
import styled from 'styled-components';
import { Navbar } from '@/components/common/Navbar';
import { Sidebar } from '@/components/common/Sidebar';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;

`;

const MainContent = styled.main`
  flex: 1;
  min-height: 100vh;
  background-color: #f9fafb;
`;

const ContentWrapper = styled.div`
  margin-top: 36px; // Height of the header
  padding: 24px;
`;

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
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
};

export default Layout; 