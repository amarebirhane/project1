'use client';

import React from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';

interface TabsProps {
  children: React.ReactNode;
  value: string;
  onValueChange: (value: string) => void;
}

interface TabsListProps {
  children: React.ReactNode;
}

interface TabsTriggerProps {
  children: React.ReactNode;
  value: string;
}

interface TabsContentProps {
  children: React.ReactNode;
  value: string;
}

const TabsContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const TabsListContainer = styled.div`
  display: flex;
  border-bottom: 1px solid ${theme.colors.border};
  margin-bottom: 24px;
`;

const TabsTriggerButton = styled.button<{ isActive: boolean }>`
  padding: 12px 24px;
  background: ${props => props.isActive ? theme.colors.primaryLight : 'transparent'};
  border: none;
  border-bottom: 2px solid ${props => props.isActive ? theme.colors.primary : 'transparent'};
  color: ${props => props.isActive ? theme.colors.primary : theme.colors.textSecondary};
  font-weight: ${props => props.isActive ? '600' : '400'};
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    color: ${theme.colors.primary};
    background: ${theme.colors.primaryLight};
  }
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${theme.colors.primaryLight};
  }
`;

const TabsContentContainer = styled.div<{ isActive: boolean }>`
  display: ${props => props.isActive ? 'block' : 'none'};
`;

const TabsContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
} | null>(null);

const useTabs = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
};

export const Tabs: React.FC<TabsProps> = ({ children, value, onValueChange }) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <TabsContainer>{children}</TabsContainer>
    </TabsContext.Provider>
  );
};

export const TabsList: React.FC<TabsListProps> = ({ children }) => {
  return <TabsListContainer>{children}</TabsListContainer>;
};

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ children, value }) => {
  const { value: selectedValue, onValueChange } = useTabs();
  const isActive = selectedValue === value;
  
  return (
    <TabsTriggerButton 
      isActive={isActive} 
      onClick={() => onValueChange(value)}
    >
      {children}
    </TabsTriggerButton>
  );
};

export const TabsContent: React.FC<TabsContentProps> = ({ children, value }) => {
  const { value: selectedValue } = useTabs();
  const isActive = selectedValue === value;
  
  return (
    <TabsContentContainer isActive={isActive}>
      {children}
    </TabsContentContainer>
  );
}; 