// components/common/Navbar.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import {
  Search,
  Plus,
  Bell,
  FileSpreadsheet,
  Globe,
  User,
  LogOut,
  Settings,
  HelpCircle,
  Menu,
} from 'lucide-react';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import { useAuth } from '@/lib/rbac/auth-context';
import { theme } from './theme';

// =============== Styled Components ===============
const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing.xs} ${theme.spacing.xs};
  background: ${theme.colors.background};
  border-bottom: 1px solid ${theme.colors.border};
  height: 36px;
  width: calc(100% - 250px); // Adjust for sidebar width
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  max-width: 480px;
  margin: 0 ${theme.spacing.xs};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  padding-left: 40px;
  border: none;
  border-radius: ${theme.borderRadius.md};
  background: #f5f5f5;
  font-size: ${theme.typography.fontSizes.sm};
  color: ${theme.colors.textPrimary};

  &:focus {
    outline: none;
    background: #eeeeee;
  }

  &::placeholder {
    color: ${theme.colors.textSecondary};
    opacity: 0.5;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: ${theme.colors.textSecondary};
  opacity: 0.5;
`;

const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: ${theme.colors.textSecondary};
  color: ${theme.colors.background};
  cursor: pointer;
  transition: background-color ${theme.transitions.default};

  &:hover {
    background: ${props => {
    const color = theme.colors.primary;
    return `${color}dd`;
  }};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const IconButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: ${theme.colors.textSecondary};
  cursor: pointer;
  transition: background-color ${theme.transitions.default};

  &:hover {
    background: ${theme.colors.inputBg};
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const NotificationBadge = styled.div`
  position: relative;
  cursor: pointer;

  span {
    position: absolute;
    top: -8px;
    right: -8px;
    background: ${theme.colors.warning};
    color: white;
    font-size: 8px;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const LanguageSelector = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  cursor: pointer;
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  transition: background-color ${theme.transitions.default};

  &:hover {
    background: ${theme.colors.inputBg};
  }

  span {
    font-size: ${theme.typography.fontSizes.sm};
    color: ${theme.colors.textSecondary};
  }
`;

const MenuButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  background: none;
  cursor: pointer;
  color: ${theme.colors.textSecondary};

  &:hover {
    color: ${theme.colors.textPrimary};
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 20px;
    height: 20px;
    stroke-width: 1.5px;
  }
`;

// New styled components for user profile dropdown
const UserProfileContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  cursor: pointer;
  padding: ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.sm};
  transition: background-color ${theme.transitions.default};

  &:hover {
    background: ${theme.colors.inputBg};
  }
`;

const UserAvatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: ${theme.colors.primaryLight};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${theme.colors.primary};
  font-weight: ${theme.typography.fontWeights.bold};
  font-size: ${theme.typography.fontSizes.sm};
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.span`
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  color: ${theme.colors.textPrimary};
`;

const UserRole = styled.span`
  font-size: ${theme.typography.fontSizes.xs};
  color: ${theme.colors.textSecondary};
`;

const DropdownMenu = styled.div<{ isOpen: boolean }>`
  position: absolute;
  top: 100%;
  right: 0;
  width: 200px;
  background: ${theme.colors.background};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  box-shadow: ${theme.shadows.md};
  z-index: 100;
  display: ${props => (props.isOpen ? 'block' : 'none')};
  margin-top: ${theme.spacing.sm};
`;

const DropdownItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  color: ${theme.colors.textSecondary};
  transition: background-color ${theme.transitions.default};
  cursor: pointer;

  &:hover {
    background: ${theme.colors.inputBg};
    color: ${theme.colors.textPrimary};
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${theme.colors.border};
  }
`;

const SignOutItem = styled(DropdownItem)`
  color: ${theme.colors.warning};

  &:hover {
    background: ${`${theme.colors.warning}10`};
    color: ${theme.colors.warning};
  }
`;

// =============== Component ===============
export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user, logout } = useAuth();
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAddClick = () => {
    router.push('/finance/entries/create');
  };

  const handleReportsClick = () => {
    router.push('/finance/reports');
  };

  const handleNotificationsClick = () => {
    // Handle notifications (e.g., open modal or navigate)
    console.log('Open notifications');
  };

  const handleLanguageClick = () => {
    // Handle language toggle
    console.log('Toggle language');
  };

  const handleProfileClick = () => {
    router.push('/profile');
    setIsDropdownOpen(false);
  };

  const handleSettingsClick = () => {
    router.push('/settings');
    setIsDropdownOpen(false);
  };

  const handleRolesClick = () => {
    router.push('/settings/roles');
    setIsDropdownOpen(false);
  };

  const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '?';
  const displayRole = user?.role ?? user?.userType ?? 'User';

  return (
    <HeaderContainer>
      {/* Mobile Menu Button (hidden on desktop) */}
      <MenuButton
        onClick={() => {
          // Toggle sidebar (integrate with sidebar state if needed)
          console.log('Toggle sidebar');
        }}
        style={{ display: 'none' }} // Adjust for mobile: e.g., via media query or state
      >
        <Menu />
      </MenuButton>

      {/* Search */}
      <SearchContainer>
        <SearchIcon>
          <Search size={16} />
        </SearchIcon>
        <SearchInput
          placeholder="Search finance data..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </SearchContainer>

      <ActionsContainer>
        {/* Quick Action: Create Financial Entry */}
        <ComponentGate componentId={ComponentId.FINANCE_CREATE}>
          <AddButton onClick={handleAddClick}>
            <Plus />
          </AddButton>
        </ComponentGate>

        {/* Notifications */}
        <ComponentGate componentId={ComponentId.DASHBOARD}>
          <NotificationBadge onClick={handleNotificationsClick}>
            <IconWrapper>
              <Bell />
            </IconWrapper>
            <span>4</span>
          </NotificationBadge>
        </ComponentGate>

        {/* Reports shortcut */}
        <ComponentGate componentId={ComponentId.REPORT_VIEW}>
          <IconButton onClick={handleReportsClick}>
            <FileSpreadsheet />
          </IconButton>
        </ComponentGate>

        {/* Language Selector */}
        <LanguageSelector onClick={handleLanguageClick}>
          <IconWrapper>
            <Globe />
          </IconWrapper>
          <span>EN</span>
        </LanguageSelector>

        {/* User Menu */}
        <UserProfileContainer ref={dropdownRef} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
          <UserAvatar>{initials}</UserAvatar>
          <UserInfo>
            <UserName>{user?.name}</UserName>
            <UserRole>{displayRole}</UserRole>
          </UserInfo>
        </UserProfileContainer>

        <DropdownMenu isOpen={isDropdownOpen}>
          <DropdownItem onClick={handleProfileClick}>
            <User size={16} />
            <span>Profile</span>
          </DropdownItem>
          <DropdownItem onClick={handleSettingsClick}>
            <Settings size={16} />
            <span>Settings</span>
          </DropdownItem>
          <ComponentGate componentId={ComponentId.PERMISSIONS_MANAGE}>
            <DropdownItem onClick={handleRolesClick}>
              <HelpCircle size={16} />
              <span>Role & Permission Management</span>
            </DropdownItem>
          </ComponentGate>
          <SignOutItem onClick={logout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </SignOutItem>
        </DropdownMenu>
      </ActionsContainer>
    </HeaderContainer>
  );
}