'use client';

import React from 'react';
import styled from 'styled-components';
import { ThemeProvider } from 'styled-components';
import { theme } from '/@components/common/theme';
import StyledComponentsRegistry from '/@/lib/registry';

const UnauthorizedLayout = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

export default function UnauthorizedPageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StyledComponentsRegistry>
      <ThemeProvider theme={theme}>
        <UnauthorizedLayout>
          {children}
        </UnauthorizedLayout>
      </ThemeProvider>
    </StyledComponentsRegistry>
  );
} 