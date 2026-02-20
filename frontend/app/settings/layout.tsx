'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/common/Navbar';
import Sidebar from '@/components/common/Sidebar';
import { useAuth } from '@/lib/rbac/auth-context'; // Ensure you have this hook
import {
  Activity,
  Globe,
  Bell,
  Lock,
  Users,
  Database,
  List,
  History,
  Menu,
  X,
  ChevronRight
} from 'lucide-react';
import { theme } from '@/components/common/theme';

const LayoutContainer = styled.div`
  display: flex;
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  background-color: ${props => props.theme.colors.background};
`;

const ContentArea = styled.div`
  flex: 1;
  padding: 0;
  overflow-x: hidden;
  background-color: ${props => props.theme.colors.background};
`;

// Container for the Settings Sub-layout (Sidebar + Content)
const SettingsLayoutWrapper = styled.div`
  max-width: 1600px;
  margin: 0 auto;
  padding: ${props => props.theme.spacing.lg};
  display: flex;
  gap: ${props => props.theme.spacing.xl};
  position: relative;
  background-color: ${props => props.theme.colors.background};

  @media (max-width: 1024px) {
    flex-direction: column;
    gap: ${props => props.theme.spacing.md};
    padding: ${props => props.theme.spacing.md};
  }
`;

// Responsive Settings Sidebar
const SettingsSidebar = styled.aside<{ $isOpen: boolean }>`
  width: 260px;
  flex-shrink: 0;
  
  @media (max-width: 1024px) {
    width: 100%;
    /* Collapsible logic for mobile */
    display: ${props => props.$isOpen ? 'block' : 'none'};
    animation: fadeIn 0.2s ease-in-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const SettingsContent = styled.div`
  flex: 1;
  min-width: 0; /* Prevent flex child overflow */
`;

const MobileNavToggle = styled.button`
  display: none;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background: ${props => props.theme.colors.card};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: ${theme.spacing.md};
  font-weight: 600;
  color: ${theme.colors.primary};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${theme.colors.backgroundSecondary};
  }

  @media (max-width: 1024px) {
    display: flex;
    justify-content: space-between;
  }
`;

const NavGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const NavHeader = styled.h3`
  font-size: 12px;
  text-transform: uppercase;
  color: ${theme.colors.textSecondary};
  margin: 24px 0 8px 12px;
  font-weight: 700;
  letter-spacing: 0.05em;

  &:first-child {
    margin-top: 0;
  }
`;

const NavLink = styled(Link) <{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: ${props => props.theme.borderRadius.md};
  color: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.textSecondary};
  background: ${props => props.$active ? `color-mix(in srgb, ${props.theme.colors.primary}, transparent 92%)` : 'transparent'};
  font-weight: ${props => props.$active ? '600' : '500'};
  font-size: 14px;
  transition: all 0.2s ease;
  text-decoration: none;

  &:hover {
    background: ${props => props.$active
    ? `color-mix(in srgb, ${props.theme.colors.primary}, transparent 88%)`
    : `color-mix(in srgb, ${props.theme.colors.textSecondary}, transparent 94%)`
  };
    color: ${props => props.theme.colors.primary};
    transform: translateX(4px);
  }

  svg {
    width: 18px;
    height: 18px;
    opacity: ${props => props.$active ? 1 : 0.7};
  }
`;

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Helper to check active state
  // Check strict equality for root settings page, or prefix for subpages
  const isActive = (path: string) => {
    if (path === '/settings' && pathname === '/settings') return true;
    if (path !== '/settings' && pathname?.startsWith(path)) return true;
    return false;
  };

  const handleNavClick = () => {
    // Close mobile menu on navigation
    setIsMobileMenuOpen(false);
  };

  // Define menu structure
  const menuItems = [
    {
      group: 'Overview',
      items: [
        { href: '/settings', label: 'System Overview', icon: Activity },
      ]
    },
    {
      group: 'Preferences',
      items: [
        { href: '/settings/general', label: 'General', icon: Globe },
        { href: '/settings/notifications', label: 'Notifications', icon: Bell },
      ]
    },
    {
      group: 'Security & Access',
      items: [
        { href: '/settings/security', label: 'Security', icon: Lock },
        // Only show Users & Roles to authorized users (optional, based on requirement)
        { href: '/settings/users-roles/user-roles', label: 'Users & Roles', icon: Users },
      ]
    },
    {
      group: 'System',
      items: [
        { href: '/settings/backup', label: 'Backup & Restore', icon: Database },
        { href: '/settings/logs', label: 'Audit Logs', icon: List },
        { href: '/settings/history', label: 'History', icon: History },
      ]
    }
  ];

  // Get current section label for mobile toggle
  const currentSection = menuItems
    .flatMap(g => g.items)
    .find(i => isActive(i.href))?.label || 'Menu';

  return (
    <LayoutContainer>
      <Sidebar />
      <MainContent>
        <Navbar />
        <ContentArea>
          <SettingsLayoutWrapper>

            {/* Mobile Toggle */}
            <MobileNavToggle onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Menu size={18} />
                {currentSection}
              </span>
              {isMobileMenuOpen ? <X size={18} /> : <ChevronRight size={18} />}
            </MobileNavToggle>

            {/* Sidebar Navigation */}
            <SettingsSidebar $isOpen={isMobileMenuOpen}>
              {menuItems.map((group, groupIdx) => (
                <NavGroup key={groupIdx}>
                  {group.group && <NavHeader>{group.group}</NavHeader>}
                  {group.items.map((item) => (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      $active={isActive(item.href)}
                      onClick={handleNavClick}
                    >
                      <item.icon />
                      {item.label}
                    </NavLink>
                  ))}
                </NavGroup>
              ))}
            </SettingsSidebar>

            {/* Main Content */}
            <SettingsContent>
              {children}
            </SettingsContent>

          </SettingsLayoutWrapper>
        </ContentArea>
      </MainContent>
    </LayoutContainer>
  );
} 