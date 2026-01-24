// components/common/sidebar.tsx
'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styled from 'styled-components';
import {
    Home, ArrowDownCircle, ArrowUpCircle, Receipt, PieChart, Building, Briefcase, Users,
    UserCog, Settings, ChevronDown, Wallet, Shield, UserPlus, List, Calculator,
    DollarSign, Plus, FileText, TrendingUp, GitCompare, BarChart3, Package, ShoppingCart, BookOpen,
    Key, ChevronLeft, ChevronRight, Brain, Activity, Bell, Database, History, LockKeyhole, Network, Landmark, MessageSquare,
    Coins, BookText, Banknote, CirclePercent
} from 'lucide-react';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import { useAuthorization } from '@/lib/rbac/use-authorization';
import { useAuth } from '@/lib/rbac/auth-context';
import { UserType } from '@/lib/rbac/models';
import { theme } from './theme';

interface SidebarContainerProps {
    $collapsed: boolean;
}

const SidebarContainer = styled.div<SidebarContainerProps>`
    width: ${props => (props.$collapsed ? '70px' : '230px')};
    height: 100vh;
    background: ${theme.colors.background};
    border-right: 1px solid ${theme.colors.border};
    padding: 0;
    position: fixed;
    left: 0;
    top: 0;
    overflow-y: auto;
    overflow-x: hidden;
    z-index: 50;
    transition: width ${theme.transitions.default};
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.04);
    display: flex;
    flex-direction: column;

    /* Custom scrollbar styling */
    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background: ${theme.colors.border};
        border-radius: 3px;
    }

    &::-webkit-scrollbar-thumb:hover {
        background: ${theme.colors.textSecondary};
    }
`;

const CollapseButton = styled.button`
    position: relative;
    background: transparent;
    border: none;
    color: ${theme.colors.textSecondary};
    cursor: pointer;
    padding: ${theme.spacing.sm};
    border-radius: ${theme.borderRadius.sm};
    transition: all ${theme.transitions.default};
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
    flex-shrink: 0;
    width: 36px;
    height: 36px;
    margin: 0;

    &:hover {
        background: ${theme.colors.backgroundSecondary};
        color: ${theme.colors.primary};
        transform: scale(1.05);
    }

    &:active {
        transform: scale(0.95);
    }

    svg {
        width: 20px;
        height: 20px;
    }
`;

const StickyHeader = styled.div`
    position: sticky;
    top: 0;
    background: ${theme.colors.background};
    z-index: 10;
    padding: ${theme.spacing.md} ${theme.spacing.md};
    margin: 0;
    margin-bottom: ${theme.spacing.xs};
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${theme.spacing.sm};
    border-bottom: 1px solid ${theme.colors.border};
`;

const Logo = styled.div<{ $collapsed: boolean }>`
    height: auto;
    min-height: 40px;
    display: flex;
    align-items: center;
    justify-content: ${props => (props.$collapsed ? 'center' : 'flex-start')}; 
    padding: 0;
    margin: 0;
    flex: 1;
    font-size: ${theme.typography.fontSizes.xxl};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${theme.colors.primary};
    transition: all ${theme.transitions.default};
    position: relative;
    min-width: 0;
`;

const SectionTitle = styled.h3<{ $collapsed: boolean; $isOpen?: boolean; $isAccountSection?: boolean }>`
    font-size: ${theme.typography.fontSizes.xs};
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: ${theme.colors.textSecondary};
    padding: ${props => props.$isAccountSection ? `${theme.spacing.md} ${theme.spacing.xl} ${theme.spacing.sm}` : `${theme.spacing.lg} ${theme.spacing.xl} ${theme.spacing.sm}`};
    margin: 0;
    margin-top: ${props => props.$isAccountSection ? '0' : theme.spacing.md};
    opacity: ${props => (props.$collapsed ? 0 : 1)};
    pointer-events: ${props => (props.$collapsed ? 'none' : 'auto')};
    transition: opacity ${theme.transitions.default};
    font-weight: ${theme.typography.fontWeights.medium};
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: ${props => (props.$collapsed ? 'default' : 'pointer')};
    user-select: none;

    &:hover {
        color: ${props => (props.$collapsed ? theme.colors.textSecondary : theme.colors.primary)};
    }
`;

const SectionContent = styled.div<{ $isOpen: boolean; $collapsed: boolean }>`
    display: ${props => (props.$isOpen ? 'block' : 'none')};
    opacity: ${props => (props.$isOpen ? 1 : 0)};
    transition: opacity ${theme.transitions.default};
    padding-bottom: ${theme.spacing.sm};
    margin-bottom: ${theme.spacing.sm};
`;

const AccountSectionContent = styled(SectionContent)`
    padding-top: ${theme.spacing.xs};
    padding-bottom: ${theme.spacing.sm};
    margin-bottom: ${theme.spacing.md};
`;

// Icon color mapping for different icon types
const getIconColor = (iconType: string, active: boolean): string => {
    if (active) {
        // Active state colors (brighter)
        const activeColors: Record<string, string> = {
            'home': '#3b82f6',           // Blue
            'arrow-down-circle': '#10b981', // Green
            'arrow-up-circle': '#ef4444',   // Red
            'receipt': '#8b5cf6',         // Purple
            'package': '#f59e0b',         // Amber
            'shopping-cart': '#06b6d4',   // Cyan
            'book-open': '#6366f1',       // Indigo
            'pie-chart': '#ec4899',       // Pink
            'trending-up': '#14b8a6',     // Teal
            'git-compare': '#a855f7',      // Purple
            'bar-chart-3': '#f97316',      // Orange
            'dollar-sign': '#22c55e',      // Green
            'shield': '#e74c3c',          // Red
            'wallet': '#3b82f6',          // Blue
            'users': '#8b5cf6',           // Purple
            'building': '#06b6d4',        // Cyan
            'briefcase': '#f59e0b',       // Amber
            'user-cog': '#6366f1',        // Indigo
            'settings': '#64748b',         // Slate
            'list': '#6b7280',            // Gray
            'calculator': '#10b981',      // Green
            'plus': '#22c55e',            // Green
            'file-text': '#3b82f6',       // Blue
            'key': '#8b5cf6',             // Purple
            'activity': '#f43f5e',        // Rose
            'bell': '#f59e0b',            // Amber
            'database': '#3b82f6',        // Blue
            'lockKeyhole': '#8b5cf6',     // Purple
            'network': '#3b82f6',         // Blue
            'banking': '#10b981',         // Green
            'coins': '#f59e0b',           // Amber
            'book-text': '#3b82f6',       // Blue
            'banknote': '#8b5cf6',        // Purple
            'file-percent': '#ef4444',    // Red
        };
        return activeColors[iconType] || theme.colors.primary;
    } else {
        // Inactive state colors (muted)
        const inactiveColors: Record<string, string> = {
            'home': '#60a5fa',            // Light Blue
            'arrow-down-circle': '#34d399', // Light Green
            'arrow-up-circle': '#f87171',  // Light Red
            'receipt': '#a78bfa',         // Light Purple
            'package': '#fbbf24',         // Light Amber
            'shopping-cart': '#22d3ee',   // Light Cyan
            'book-open': '#818cf8',       // Light Indigo
            'pie-chart': '#f472b6',       // Light Pink
            'trending-up': '#2dd4bf',     // Light Teal
            'git-compare': '#c084fc',      // Light Purple
            'bar-chart-3': '#fb923c',      // Light Orange
            'dollar-sign': '#4ade80',      // Light Green
            'shield': '#f87171',          // Light Red
            'wallet': '#60a5fa',          // Light Blue
            'users': '#a78bfa',           // Light Purple
            'building': '#22d3ee',        // Light Cyan
            'briefcase': '#fbbf24',       // Light Amber
            'user-cog': '#818cf8',        // Light Indigo
            'settings': '#94a3b8',        // Light Slate
            'list': '#9ca3af',            // Light Gray
            'calculator': '#34d399',      // Light Green
            'plus': '#4ade80',            // Light Green
            'file-text': '#60a5fa',       // Light Blue
            'key': '#a78bfa',             // Light Purple
            'activity': '#fb7185',        // Light Rose
            'bell': '#fbbf24',            // Light Amber
            'database': '#60a5fa',        // Light Blue
            'lockKeyhole': '#a78bfa',     // Light Purple
            'network': '#60a5fa',         // Light Blue
            'banking': '#34d399',         // Light Green
            'coins': '#fbbf24',           // Light Amber
            'book-text': '#60a5fa',       // Light Blue
            'banknote': '#a78bfa',        // Light Purple
            'file-percent': '#f87171',    // Light Red
        };
        return inactiveColors[iconType] || theme.colors.textSecondary;
    }
};

const IconWrapper = styled.div<{ $active?: boolean; $collapsed?: boolean; $size?: number; $iconType?: string }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: ${props => props.$size ? `${props.$size}px` : '20px'};
    height: ${props => props.$size ? `${props.$size}px` : '20px'};
    flex-shrink: 0;
    margin-right: ${props => (props.$collapsed ? 0 : theme.spacing.md)};
    transition: all ${theme.transitions.default};
    color: ${props => props.$iconType ? getIconColor(props.$iconType, props.$active || false) : (props.$active ? theme.colors.primary : theme.colors.textSecondary)};
    opacity: ${props => props.$active ? 1 : 0.8};

    svg {
        width: 100%;
        height: 100%;
        transition: all ${theme.transitions.default};
    }

    &:hover {
        opacity: 1;
        transform: scale(1.15);
    }
`;

const NavIcon = styled(IconWrapper)`
    ${props => !props.$collapsed && `
        margin-right: ${theme.spacing.md};
    `}
`;

const DropdownIcon = styled(IconWrapper)`
    ${props => !props.$collapsed && `
        margin-right: ${theme.spacing.md};
    `}
`;

const ChevronIcon = styled.div<{ $open?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    transition: transform ${theme.transitions.default};
    transform: ${props => (props.$open ? 'rotate(180deg)' : 'rotate(0)')};
    color: ${theme.colors.textSecondary};

    svg {
        width: 100%;
        height: 100%;
    }
`;

const NavItem = styled(Link) <{ $active?: boolean; $collapsed?: boolean }>`
    display: flex;
    align-items: center;
    padding: ${theme.spacing.sm} ${props => (props.$collapsed ? theme.spacing.md : theme.spacing.xl)};
    color: ${props => (props.$active ? theme.colors.primary : theme.colors.textSecondary)};
    text-decoration: none;
    border-left: 3px solid ${props => (props.$active ? theme.colors.primary : 'transparent')};
    transition: all ${theme.transitions.default};
    justify-content: ${props => (props.$collapsed ? 'center' : 'flex-start')};
    position: relative;
    margin: ${theme.spacing.xs} ${theme.spacing.md};
    border-radius: ${theme.borderRadius.sm};
    font-weight: ${props => (props.$active ? theme.typography.fontWeights.medium : 400)};

    &:hover {
        background: ${theme.colors.backgroundSecondary};
        color: ${theme.colors.primary};
        transform: translateX(${props => (props.$collapsed ? '0' : '4px')});
        
        ${NavIcon} {
            opacity: 1;
            transform: scale(1.1);
        }
    }

    ${props => props.$active && `
        background: ${theme.colors.backgroundSecondary};
        font-weight: ${theme.typography.fontWeights.medium};
    `}
`;

const DropdownHeader = styled.div<{ $open?: boolean; $collapsed?: boolean; $active?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: ${props => (props.$collapsed ? 'center' : 'space-between')}; 
    padding: ${theme.spacing.sm} ${props => (props.$collapsed ? theme.spacing.md : theme.spacing.xl)};
    color: ${props => (props.$active ? theme.colors.primary : theme.colors.textSecondary)};
    cursor: pointer;
    border-left: 3px solid ${props => (props.$active ? theme.colors.primary : 'transparent')};
    transition: all ${theme.transitions.default};
    position: relative;
    margin: ${theme.spacing.xs} ${theme.spacing.md};
    border-radius: ${theme.borderRadius.sm};
    font-weight: ${props => (props.$active ? theme.typography.fontWeights.medium : 400)};
    gap: ${props => (props.$collapsed ? theme.spacing.xs : '0')};

    &:hover {
        background: ${theme.colors.backgroundSecondary};
        color: ${theme.colors.primary};
        transform: translateX(${props => (props.$collapsed ? '0' : '4px')});
        
        ${DropdownIcon} {
            opacity: 1;
            transform: scale(1.1);
        }
        
        ${ChevronIcon} {
            color: ${theme.colors.primary};
            transform: ${props => (props.$open ? 'rotate(180deg) scale(1.1)' : 'rotate(0) scale(1.1)')};
        }
    }

    ${props => props.$active && `
        background: ${theme.colors.backgroundSecondary};
    `}
`;

const SubMenu = styled.div<{ $collapsed: boolean }>`
    margin-left: ${props => (props.$collapsed ? 0 : '24px')}; 
    border-left: ${props => (props.$collapsed ? 'none' : `2px solid ${theme.colors.border}`)};
    padding-left: ${props => (props.$collapsed ? 0 : theme.spacing.sm)};
    margin-top: ${props => (props.$collapsed ? theme.spacing.xs : theme.spacing.xs)};
    margin-bottom: ${theme.spacing.xs};
    padding-bottom: ${theme.spacing.xs};
    animation: ${props => (!props.$collapsed ? 'slideDown 0.2s ease-out' : 'none')};

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-8px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    /* Correct NavItem padding inside SubMenu */
    ${NavItem} {
        padding-left: ${props => (props.$collapsed ? theme.spacing.lg : `calc(${theme.spacing.xl} + 4px)`)};
        border-left: none;
        margin-left: ${props => (props.$collapsed ? theme.spacing.sm : '0')};
        margin-right: ${props => (props.$collapsed ? theme.spacing.sm : theme.spacing.md)};
        margin-top: ${theme.spacing.xs};
        margin-bottom: ${theme.spacing.xs};
        font-size: ${theme.typography.fontSizes.sm};

        &::before {
            content: '';
            position: absolute;
            left: ${props => (props.$collapsed ? '0' : theme.spacing.xl)};
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: ${theme.colors.textSecondary};
            opacity: 0.5;
        }
    }
`;

const AccountSection = styled.div<{ $collapsed: boolean }>`
    margin-top: auto;
    padding-top: ${theme.spacing.lg};
    padding-bottom: ${theme.spacing.md};
    border-top: 2px solid ${theme.colors.border};
    margin-left: 0;
    margin-right: 0;
    padding-left: 0;
    padding-right: 0;
`;

const Sidebar: React.FC = () => {
    const pathname = usePathname();
    const { hasUserType } = useAuthorization();
    const { user } = useAuth();

    const [collapsed, setCollapsed] = useState(false);
    const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
    const [mainSectionOpen, setMainSectionOpen] = useState(true);
    const [adminSectionOpen, setAdminSectionOpen] = useState(true);
    const [userSectionOpen, setUserSectionOpen] = useState(true);

    const toggleSection = (key: string) => {
        if (collapsed) setCollapsed(false);
        setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const isOpen = (key: string) => openSections[key] || pathname.includes(`/${key}`);
    const isAdmin = hasUserType(UserType.ADMIN) || user?.userType?.toLowerCase() === "admin";
    const isFinanceAdmin = hasUserType(UserType.FINANCE_ADMIN) || user?.userType?.toLowerCase() === "finance_admin";
    const isManager = user?.role?.toLowerCase() === "manager";
    const isEmployee = hasUserType(UserType.EMPLOYEE) || user?.userType?.toLowerCase() === "employee";
    const isAccountant = hasUserType(UserType.ACCOUNTANT) || user?.userType?.toLowerCase() === "accountant";

    return (
        <SidebarContainer $collapsed={collapsed}>
            <StickyHeader>
                <CollapseButton onClick={() => setCollapsed(!collapsed)}>
                    {collapsed ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
                </CollapseButton>

                <Logo $collapsed={collapsed}>
                    {!collapsed ? 'Finance' : null}
                </Logo>
            </StickyHeader>
            <SectionTitle
                $collapsed={collapsed}
                $isOpen={mainSectionOpen}
                onClick={() => !collapsed && setMainSectionOpen(!mainSectionOpen)}
            >
                Main
                {!collapsed && (
                    <ChevronIcon $open={mainSectionOpen}>
                        <ChevronDown />
                    </ChevronIcon>
                )}
            </SectionTitle>

            <SectionContent $isOpen={mainSectionOpen} $collapsed={collapsed}>
                <ComponentGate componentId={ComponentId.SIDEBAR_DASHBOARD}>
                    <NavItem href="/dashboard" $active={pathname === '/dashboard'} $collapsed={collapsed}>
                        <NavIcon $active={pathname === '/dashboard'} $collapsed={collapsed} $iconType="home">
                            <Home />
                        </NavIcon>
                        {!collapsed && 'Dashboard'}
                    </NavItem>
                </ComponentGate>

                {/* Revenue - Hidden for employees */}
                {!isEmployee && (
                    <ComponentGate componentId={ComponentId.SIDEBAR_REVENUE}>
                        <>
                            <DropdownHeader
                                onClick={() => toggleSection('revenue')}
                                $open={isOpen('revenue')}
                                $active={pathname.includes('/revenue')}
                                $collapsed={collapsed}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <DropdownIcon $active={pathname.includes('/revenue')} $collapsed={collapsed} $iconType="arrow-down-circle">
                                        <ArrowDownCircle />
                                    </DropdownIcon>
                                    {!collapsed && <span style={{ marginLeft: '12px' }}>Revenue</span>}
                                </div>
                                <ChevronIcon $open={isOpen('revenue')}>
                                    <ChevronDown />
                                </ChevronIcon>
                            </DropdownHeader>
                            {isOpen('revenue') && (
                                <SubMenu $collapsed={collapsed}>
                                    <ComponentGate componentId={ComponentId.REVENUE_LIST}>
                                        <NavItem href="/revenue/list" $active={pathname === '/revenue/list'} $collapsed={collapsed}>
                                            <NavIcon $active={pathname === '/revenue/list'} $collapsed={collapsed} $size={16} $iconType="list">
                                                <List />
                                            </NavIcon>
                                            {!collapsed && 'Revenues'}
                                        </NavItem>
                                    </ComponentGate>
                                </SubMenu>
                            )}
                        </>
                    </ComponentGate>
                )}

                {/* Expenses */}
                <ComponentGate componentId={ComponentId.SIDEBAR_EXPENSE}>
                    <>
                        <DropdownHeader
                            onClick={() => toggleSection('expense')}
                            $open={isOpen('expense')}
                            $active={pathname.includes('/expense')}
                            $collapsed={collapsed}
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <DropdownIcon $active={pathname.includes('/expense')} $collapsed={collapsed} $iconType="arrow-up-circle">
                                    <ArrowUpCircle />
                                </DropdownIcon>
                                {!collapsed && <span style={{ marginLeft: '12px' }}>Expenses</span>}
                            </div>
                            <ChevronIcon $open={isOpen('expense')}>
                                <ChevronDown />
                            </ChevronIcon>
                        </DropdownHeader>
                        {isOpen('expense') && (
                            <SubMenu $collapsed={collapsed}>
                                <ComponentGate componentId={ComponentId.EXPENSE_LIST}>
                                    <NavItem href="/expenses/list" $active={pathname === '/expense/list'} $collapsed={collapsed}>
                                        <NavIcon $active={pathname === '/expense/list'} $collapsed={collapsed} $size={16} $iconType="list">
                                            <List />
                                        </NavIcon>
                                        {!collapsed && 'Expenses'}
                                    </NavItem>
                                </ComponentGate>
                                <ComponentGate componentId={ComponentId.EXPENSE_CREATE}>
                                    <NavItem href="/expenses/items" $active={pathname === '/expenses/items'} $collapsed={collapsed}>
                                        <NavIcon $active={pathname === '/expenses/items'} $collapsed={collapsed} $size={16} $iconType="calculator">
                                            <Calculator />
                                        </NavIcon>
                                        {!collapsed && 'Cal-Expense'}
                                    </NavItem>
                                </ComponentGate>
                            </SubMenu>
                        )}
                    </>
                </ComponentGate>

                {/* Transactions */}
                <ComponentGate componentId={ComponentId.SIDEBAR_TRANSACTION}>
                    <NavItem href="/transaction/list" $active={pathname.includes('/transaction')} $collapsed={collapsed}>
                        <NavIcon $active={pathname.includes('/transaction')} $collapsed={collapsed} $iconType="receipt">
                            <Receipt />
                        </NavIcon>
                        {!collapsed && 'Transactions'}
                    </NavItem>
                </ComponentGate>

                {/* Inventory & Sales */}
                <ComponentGate componentId={ComponentId.SIDEBAR_TRANSACTION}>
                    <>
                        <DropdownHeader
                            onClick={() => toggleSection('inventory')}
                            $open={isOpen('inventory')}
                            $active={pathname.includes('/inventory') || pathname.includes('/sales')}
                            $collapsed={collapsed}
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <DropdownIcon $active={pathname.includes('/inventory') || pathname.includes('/sales')} $collapsed={collapsed} $iconType="package">
                                    <Package />
                                </DropdownIcon>
                                {!collapsed && <span style={{ marginLeft: '12px' }}>Inventory</span>}
                            </div>
                            <ChevronIcon $open={isOpen('inventory')}>
                                <ChevronDown />
                            </ChevronIcon>
                        </DropdownHeader>
                        {isOpen('inventory') && (
                            <SubMenu $collapsed={collapsed}>
                                {/* Inventory Management - Finance Admin and Manager */}
                                {(isAdmin || isFinanceAdmin || isManager) && (
                                    <NavItem href="/inventory/manage" $active={pathname === '/inventory/manage'} $collapsed={collapsed}>
                                        <NavIcon $active={pathname === '/inventory/manage'} $collapsed={collapsed} $size={16} $iconType="package">
                                            <Package />
                                        </NavIcon>
                                        {!collapsed && 'item Manage'}
                                    </NavItem>
                                )}
                                {/* Inventory View - Accountant (view only) */}
                                {isAccountant && (
                                    <NavItem href="/inventory/manage" $active={pathname === '/inventory/manage'} $collapsed={collapsed}>
                                        <NavIcon $active={pathname === '/inventory/manage'} $collapsed={collapsed} $size={16} $iconType="package">
                                            <Package />
                                        </NavIcon>
                                        {!collapsed && 'View Items'}
                                    </NavItem>
                                )}
                                {/* Sales - Employee only */}
                                {isEmployee && (
                                    <NavItem href="/inventory/sales" $active={pathname === '/inventory/sales'} $collapsed={collapsed}>
                                        <NavIcon $active={pathname === '/inventory/sales'} $collapsed={collapsed} $size={16} $iconType="shopping-cart">
                                            <ShoppingCart />
                                        </NavIcon>
                                        {!collapsed && 'Sales'}
                                    </NavItem>
                                )}
                                {/* Accounting Dashboard - Accountant only */}
                                {isAccountant && (
                                    <NavItem href="/sales/accounting" $active={pathname === '/sales/accounting'} $collapsed={collapsed}>
                                        <NavIcon $active={pathname === '/sales/accounting'} $collapsed={collapsed} $size={16} $iconType="book-open">
                                            <BookOpen />
                                        </NavIcon>
                                        {!collapsed && 'Accounting'}
                                    </NavItem>
                                )}
                                {/* Finance Admin can also access Accounting Dashboard */}
                                {/* Accounting - Finance Admin and Admin */}
                                {(isAdmin || isFinanceAdmin) && (
                                    <NavItem href="/sales/accounting" $active={pathname === '/sales/accounting'} $collapsed={collapsed}>
                                        <NavIcon $active={pathname === '/sales/accounting'} $collapsed={collapsed} $size={16} $iconType="book-open">
                                            <BookOpen />
                                        </NavIcon>
                                        {!collapsed && 'Accounting'}
                                    </NavItem>
                                )}

                                {/* Warehouse, Mappings, Banking - Admin Only */}
                                {isAdmin && (
                                    <>
                                        <NavItem href="/inventory/warehouses" $active={pathname === '/inventory/warehouses'} $collapsed={collapsed}>
                                            <NavIcon $active={pathname === '/inventory/warehouses'} $collapsed={collapsed} $size={16} $iconType="book-open">
                                                <BookOpen />
                                            </NavIcon>
                                            {!collapsed && 'Warehouse'}
                                        </NavItem>
                                        <NavItem href="/accounting/mappings" $active={pathname === '/accounting/mappings'} $collapsed={collapsed}>
                                            <NavIcon $active={pathname === '/accounting/mappings'} $collapsed={collapsed} $size={16} $iconType="git-compare">
                                                <GitCompare />
                                            </NavIcon>
                                            {!collapsed && 'Mappings'}
                                        </NavItem>
                                        <NavItem href="/banking" $active={pathname === '/banking'} $collapsed={collapsed}>
                                            <NavIcon $active={pathname === '/banking'} $collapsed={collapsed} $iconType="banking">
                                                <Landmark />
                                            </NavIcon>
                                            {!collapsed && 'Banking'}
                                        </NavItem>
                                    </>
                                )}
                            </SubMenu>
                        )}
                    </>
                </ComponentGate>

                {/* Reports */}
                <ComponentGate componentId={ComponentId.SIDEBAR_REPORT}>
                    <NavItem href="/report" $active={pathname.includes('/report')} $collapsed={collapsed}>
                        <NavIcon $active={pathname.includes('/report')} $collapsed={collapsed} $iconType="pie-chart">
                            <PieChart />
                        </NavIcon>
                        {!collapsed && 'Reports'}
                    </NavItem>
                </ComponentGate>

                {/* AI Dropdown - New Section */}
                {(isAdmin) && (
                    <>
                        <DropdownHeader
                            onClick={() => toggleSection('ai-tools')}
                            $open={isOpen('ai-tools')}
                            $active={pathname.includes('/accounting/ai') || pathname.includes('/accounting/documents') || pathname.includes('/accounting/accounts')}
                            $collapsed={collapsed}
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <DropdownIcon $active={pathname.includes('/accounting/ai') || pathname.includes('/accounting/documents')} $collapsed={collapsed} $iconType="brain">
                                    <Brain />
                                </DropdownIcon>
                                {!collapsed && <span style={{ marginLeft: '12px' }}>AI Center</span>}
                            </div>
                            <ChevronIcon $open={isOpen('ai-tools')}>
                                <ChevronDown />
                            </ChevronIcon>
                        </DropdownHeader>
                        {isOpen('ai-tools') && (
                            <SubMenu $collapsed={collapsed}>
                                <NavItem href="/accounting/documents" $active={pathname === '/accounting/documents'} $collapsed={collapsed}>
                                    <NavIcon $active={pathname === '/accounting/documents'} $collapsed={collapsed} $size={16} $iconType="file-text">
                                        <FileText />
                                    </NavIcon>
                                    {!collapsed && 'AI Documents'}
                                </NavItem>
                                <NavItem href="/accounting/ai" $active={pathname === '/accounting/ai' && !pathname.includes('tab=fraud')} $collapsed={collapsed}>
                                    <NavIcon $active={pathname === '/accounting/ai'} $collapsed={collapsed} $size={16} $iconType="activity">
                                        <Activity />
                                    </NavIcon>
                                    {!collapsed && 'Applied AI'}
                                </NavItem>
                                <NavItem href="/accounting/ai?tab=fraud" $active={pathname.includes('tab=fraud')} $collapsed={collapsed}>
                                    <NavIcon $active={pathname.includes('tab=fraud')} $collapsed={collapsed} $size={16} $iconType="shield">
                                        <Shield />
                                    </NavIcon>
                                    {!collapsed && 'Fraud Detection'}
                                </NavItem>
                                <NavItem href="/accounting/accounts" $active={pathname === '/accounting/accounts'} $collapsed={collapsed}>
                                    <NavIcon $active={pathname === '/accounting/accounts'} $collapsed={collapsed} $size={16} $iconType="building">
                                        <Building />
                                    </NavIcon>
                                    {!collapsed && 'AI Accounts'}
                                </NavItem>
                            </SubMenu>
                        )}
                    </>
                )}

                {/* Collections Dropdown */}
                {(isAdmin) && (
                    <>
                        <DropdownHeader
                            onClick={() => toggleSection('collections')}
                            $open={isOpen('collections')}
                            $active={pathname.includes('/accounting/currencies') || pathname.includes('/accounting/fixed-assets') || pathname.includes('/accounting/journal-entries') || pathname.includes('/accounting/payroll') || pathname.includes('/accounting/taxes')}
                            $collapsed={collapsed}
                        >
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <DropdownIcon $active={isOpen('collections')} $collapsed={collapsed} $iconType="list">
                                    <List />
                                </DropdownIcon>
                                {!collapsed && <span style={{ marginLeft: '12px' }}>Collections</span>}
                            </div>
                            <ChevronIcon $open={isOpen('collections')}>
                                <ChevronDown />
                            </ChevronIcon>
                        </DropdownHeader>
                        {isOpen('collections') && (
                            <SubMenu $collapsed={collapsed}>
                                <NavItem href="/accounting/currencies" $active={pathname === '/accounting/currencies'} $collapsed={collapsed}>
                                    <NavIcon $active={pathname === '/accounting/currencies'} $collapsed={collapsed} $size={16} $iconType="coins">
                                        <Coins />
                                    </NavIcon>
                                    {!collapsed && 'Currencies'}
                                </NavItem>
                                <NavItem href="/accounting/fixed-assets" $active={pathname === '/accounting/fixed-assets'} $collapsed={collapsed}>
                                    <NavIcon $active={pathname === '/accounting/fixed-assets'} $collapsed={collapsed} $size={16} $iconType="banking">
                                        <Landmark />
                                    </NavIcon>
                                    {!collapsed && 'Fixed Assets'}
                                </NavItem>
                                <NavItem href="/accounting/journal-entries" $active={pathname === '/accounting/journal-entries'} $collapsed={collapsed}>
                                    <NavIcon $active={pathname === '/accounting/journal-entries'} $collapsed={collapsed} $size={16} $iconType="book-text">
                                        <BookText />
                                    </NavIcon>
                                    {!collapsed && 'Journal Entries'}
                                </NavItem>
                                <NavItem href="/accounting/payroll" $active={pathname === '/accounting/payroll'} $collapsed={collapsed}>
                                    <NavIcon $active={pathname === '/accounting/payroll'} $collapsed={collapsed} $size={16} $iconType="banknote">
                                        <Banknote />
                                    </NavIcon>
                                    {!collapsed && 'Payroll'}
                                </NavItem>
                                <NavItem href="/accounting/taxes" $active={pathname === '/accounting/taxes'} $collapsed={collapsed}>
                                    <NavIcon $active={pathname === '/accounting/taxes'} $collapsed={collapsed} $size={16} $iconType="file-percent">
                                        <CirclePercent />
                                    </NavIcon>
                                    {!collapsed && 'Taxes'}
                                </NavItem>
                                <NavItem href="/admin/feedback" $active={pathname === '/admin/feedback'} $collapsed={collapsed}>
                                    <NavIcon $active={pathname === '/admin/feedback'} $collapsed={collapsed} $size={16} $iconType="message-square">
                                        <MessageSquare />
                                    </NavIcon>
                                    {!collapsed && 'Feedback'}
                                </NavItem>
                            </SubMenu>
                        )}
                    </>
                )}

                {/* Help & Support - Available to ALL users */}
                <ComponentGate componentId={ComponentId.SIDEBAR_FEEDBACK}>
                    <NavItem href="/feedback" $active={pathname === '/feedback'} $collapsed={collapsed}>
                        <NavIcon $active={pathname === '/feedback'} $collapsed={collapsed} $iconType="message-square">
                            <MessageSquare />
                        </NavIcon>
                        {!collapsed && 'Feedback'}
                    </NavItem>
                </ComponentGate>

                {/* Forecasts - Only for Admin, Finance Admin, and Manager (hidden from Accountant and Employee) */}
                {!isAccountant && !isEmployee && (
                    <ComponentGate componentId={ComponentId.SIDEBAR_FORECAST}>
                        <>
                            <DropdownHeader
                                onClick={() => toggleSection('forecast')}
                                $open={isOpen('forecast')}
                                $active={pathname.includes('/forecast')}
                                $collapsed={collapsed}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <DropdownIcon $active={pathname.includes('/forecast')} $collapsed={collapsed} $iconType="trending-up">
                                        <TrendingUp />
                                    </DropdownIcon>
                                    {!collapsed && <span style={{ marginLeft: '12px' }}>Forecasts</span>}
                                </div>
                                <ChevronIcon $open={isOpen('forecast')}>
                                    <ChevronDown />
                                </ChevronIcon>
                            </DropdownHeader>
                            {isOpen('forecast') && (
                                <SubMenu $collapsed={collapsed}>
                                    {/* Create - Only for Admin */}
                                    {isAdmin && (
                                        <ComponentGate componentId={ComponentId.FORECAST_CREATE}>
                                            <NavItem href="/forecast/create" $active={pathname === '/forecast/create'} $collapsed={collapsed}>
                                                <NavIcon $active={pathname === '/forecast/create'} $collapsed={collapsed} $size={16} $iconType="plus">
                                                    <Plus />
                                                </NavIcon>
                                                {!collapsed && 'new forecast'}
                                            </NavItem>
                                        </ComponentGate>
                                    )}
                                    {/* List - Available for all authorized users */}
                                    <ComponentGate componentId={ComponentId.FORECAST_LIST}>
                                        <NavItem href="/forecast/list" $active={pathname === '/forecast/list'} $collapsed={collapsed}>
                                            <NavIcon $active={pathname === '/forecast/list'} $collapsed={collapsed} $size={16} $iconType="list">
                                                <List />
                                            </NavIcon>
                                            {!collapsed && 'forecasts'}
                                        </NavItem>
                                    </ComponentGate>
                                    {/* ML Training - Only for Admin and Finance Admin */}
                                    {(isAdmin || user?.role === 'finance_admin') && (
                                        <NavItem href="/ml-training" $active={pathname === '/ml-training'} $collapsed={collapsed}>
                                            <NavIcon $active={pathname === '/ml-training'} $collapsed={collapsed} $size={16} $iconType="brain">
                                                <Brain />
                                            </NavIcon>
                                            {!collapsed && 'ML Training'}
                                        </NavItem>
                                    )}
                                </SubMenu>
                            )}
                        </>
                    </ComponentGate>
                )}

                {/* Scenarios - Only for Admin */}
                {isAdmin && (
                    <ComponentGate componentId={ComponentId.SIDEBAR_SCENARIO}>
                        <>
                            <DropdownHeader
                                onClick={() => toggleSection('scenario')}
                                $open={isOpen('scenario')}
                                $active={pathname.includes('/scenario')}
                                $collapsed={collapsed}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <DropdownIcon $active={pathname.includes('/scenario')} $collapsed={collapsed} $iconType="git-compare">
                                        <GitCompare />
                                    </DropdownIcon>
                                    {!collapsed && <span style={{ marginLeft: '12px' }}>Scenarios</span>}
                                </div>
                                <ChevronIcon $open={isOpen('scenario')}>
                                    <ChevronDown />
                                </ChevronIcon>
                            </DropdownHeader>
                            {isOpen('scenario') && (
                                <SubMenu $collapsed={collapsed}>
                                    <ComponentGate componentId={ComponentId.SCENARIO_CREATE}>
                                        <NavItem href="/scenarios/create" $active={pathname === '/scenarios/create'} $collapsed={collapsed}>
                                            <NavIcon $active={pathname === '/scenarios/create'} $collapsed={collapsed} $size={16} $iconType="plus">
                                                <Plus />
                                            </NavIcon>
                                            {!collapsed && 'new scenarios'}
                                        </NavItem>
                                    </ComponentGate>
                                    <ComponentGate componentId={ComponentId.SCENARIO_LIST}>
                                        <NavItem href="/scenarios/list" $active={pathname === '/scenarios/list'} $collapsed={collapsed}>
                                            <NavIcon $active={pathname === '/scenarios/list'} $collapsed={collapsed} $size={16} $iconType="list">
                                                <List />
                                            </NavIcon>
                                            {!collapsed && 'scenarios'}
                                        </NavItem>
                                    </ComponentGate>
                                    <ComponentGate componentId={ComponentId.SCENARIO_COMPARE}>
                                        <NavItem href="/scenarios/compare" $active={pathname.includes('/scenarios/compare')} $collapsed={collapsed}>
                                            <NavIcon $active={pathname.includes('/scenarios/compare')} $collapsed={collapsed} $size={16} $iconType="git-compare">
                                                <GitCompare />
                                            </NavIcon>
                                            {!collapsed && 'compare scenarios'}
                                        </NavItem>
                                    </ComponentGate>
                                </SubMenu>
                            )}
                        </>
                    </ComponentGate>
                )}

                {/* Variance - Only for Admin */}
                {isAdmin && (
                    <ComponentGate componentId={ComponentId.SIDEBAR_VARIANCE}>
                        <>
                            <DropdownHeader
                                onClick={() => toggleSection('variance')}
                                $open={isOpen('variance')}
                                $active={pathname.includes('/variance')}
                                $collapsed={collapsed}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <DropdownIcon $active={pathname.includes('/variance')} $collapsed={collapsed} $iconType="bar-chart-3">
                                        <BarChart3 />
                                    </DropdownIcon>
                                    {!collapsed && <span style={{ marginLeft: '12px' }}>Variance</span>}
                                </div>
                                <ChevronIcon $open={isOpen('variance')}>
                                    <ChevronDown />
                                </ChevronIcon>
                            </DropdownHeader>
                            {isOpen('variance') && (
                                <SubMenu $collapsed={collapsed}>
                                    <ComponentGate componentId={ComponentId.VARIANCE_CALCULATE}>
                                        <NavItem href="/variance/calculatevariance" $active={pathname.includes('/variance/calculatevariance')} $collapsed={collapsed}>
                                            <NavIcon $active={pathname.includes('/variance/calculatevariance')} $collapsed={collapsed} $size={16} $iconType="calculator">
                                                <Calculator />
                                            </NavIcon>
                                            {!collapsed && 'calculate variance'}
                                        </NavItem>
                                    </ComponentGate>
                                    <ComponentGate componentId={ComponentId.VARIANCE_HISTORY}>
                                        <NavItem href="/variance/variancehistory" $active={pathname.includes('/variance/variancehistory')} $collapsed={collapsed}>
                                            <NavIcon $active={pathname.includes('/variance/variancehistory')} $collapsed={collapsed} $size={16} $iconType="file-text">
                                                <FileText />
                                            </NavIcon>
                                            {!collapsed && 'variance history'}
                                        </NavItem>
                                    </ComponentGate>
                                    <ComponentGate componentId={ComponentId.VARIANCE_SUMMARY}>
                                        <NavItem href="/variance/variancesummery" $active={pathname.includes('/variance/variancesummery')} $collapsed={collapsed}>
                                            <NavIcon $active={pathname.includes('/variance/variancesummery')} $collapsed={collapsed} $size={16} $iconType="bar-chart-3">
                                                <BarChart3 />
                                            </NavIcon>
                                            {!collapsed && 'variance summary'}
                                        </NavItem>
                                    </ComponentGate>
                                </SubMenu>
                            )}
                        </>
                    </ComponentGate>
                )}

                {/* Budgets - Only for Admin and Finance Admin */}
                {(isAdmin || isFinanceAdmin) && (
                    <ComponentGate componentId={ComponentId.SIDEBAR_BUDGETS}>
                        <>
                            <DropdownHeader
                                onClick={() => toggleSection('budget')}
                                $open={isOpen('budget')}
                                $active={pathname.includes('/budget')}
                                $collapsed={collapsed}
                            >
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <DropdownIcon $active={pathname.includes('/budget')} $collapsed={collapsed} $iconType="dollar-sign">
                                        <DollarSign />
                                    </DropdownIcon>
                                    {!collapsed && <span style={{ marginLeft: '12px' }}>Budgets</span>}
                                </div>
                                <ChevronIcon $open={isOpen('budget')}>
                                    <ChevronDown />
                                </ChevronIcon>
                            </DropdownHeader>
                            {isOpen('budget') && (
                                <SubMenu $collapsed={collapsed}>
                                    <NavItem href="/budgets/create" $active={pathname === '/budgets/create'} $collapsed={collapsed}>
                                        <NavIcon $active={pathname === '/budgets/create'} $collapsed={collapsed} $size={16} $iconType="plus">
                                            <Plus />
                                        </NavIcon>
                                        {!collapsed && 'new budget'}
                                    </NavItem>
                                    <NavItem href="/budgets" $active={pathname === '/budgets'} $collapsed={collapsed}>
                                        <NavIcon $active={pathname === '/budgets'} $collapsed={collapsed} $size={16} $iconType="list">
                                            <List />
                                        </NavIcon>
                                        {!collapsed && 'budgets'}
                                    </NavItem>
                                    <NavItem href="/budgets/additems" $active={pathname.includes('/budgets/additems')} $collapsed={collapsed}>
                                        <NavIcon $active={pathname.includes('/budgets/additems')} $collapsed={collapsed} $size={16} $iconType="calculator">
                                            <Calculator />
                                        </NavIcon>
                                        {!collapsed && 'Add Items'}
                                    </NavItem>
                                    <NavItem href="/budgets/listitems" $active={pathname.includes('/budgets/listitems')} $collapsed={collapsed}>
                                        <NavIcon $active={pathname.includes('/budgets/listitems')} $collapsed={collapsed} $size={16} $iconType="file-text">
                                            <FileText />
                                        </NavIcon>
                                        {!collapsed && 'List Items'}
                                    </NavItem>
                                </SubMenu>
                            )}
                        </>
                    </ComponentGate>
                )}
            </SectionContent>

            {/* ==============================================
            ADMINISTRATION SECTION 🛡️
            ==============================================
        */}
            {(isAdmin || isFinanceAdmin) && (
                <>
                    <SectionTitle
                        $collapsed={collapsed}
                        $isOpen={adminSectionOpen}
                        onClick={() => !collapsed && setAdminSectionOpen(!adminSectionOpen)}
                    >
                        Admin
                        {!collapsed && (
                            <ChevronIcon $open={adminSectionOpen}>
                                <ChevronDown />
                            </ChevronIcon>
                        )}
                    </SectionTitle>

                    <SectionContent $isOpen={adminSectionOpen} $collapsed={collapsed}>

                        {/* 1. Finance Managers (Create, List) */}
                        {isAdmin && ( // Only show the main dropdown if Admin
                            <ComponentGate componentId={ComponentId.SIDEBAR_FINANCE_ADMINS}>
                                <>
                                    <DropdownHeader
                                        onClick={() => toggleSection('finance-admin')}
                                        $open={isOpen('finance-admin')}
                                        $active={pathname.includes('/finance-admin')}
                                        $collapsed={collapsed}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <DropdownIcon $active={pathname.includes('/finance-admin')} $collapsed={collapsed} $iconType="shield">
                                                <Shield />
                                            </DropdownIcon>
                                            {!collapsed && <span style={{ marginLeft: '12px' }}>Finance</span>}
                                        </div>
                                        <ChevronIcon $open={isOpen('finance-admin')}>
                                            <ChevronDown />
                                        </ChevronIcon>
                                    </DropdownHeader>
                                    {isOpen('finance-admin') && (
                                        <SubMenu $collapsed={collapsed}>
                                            {/* Finance Create Link */}
                                            <ComponentGate componentId={ComponentId.FINANCE_MANAGER_CREATE}>
                                                <NavItem href="/finance/create" $active={pathname === '/finance-admin/create'} $collapsed={collapsed}>
                                                    <NavIcon $active={pathname === '/finance-admin/create'} $collapsed={collapsed} $size={16} $iconType="plus">
                                                        <UserPlus />
                                                    </NavIcon>
                                                    {!collapsed && 'Add Manager'}
                                                </NavItem>
                                            </ComponentGate>
                                            {/* Finance List Link */}
                                            <ComponentGate componentId={ComponentId.FINANCE_MANAGER_LIST}>
                                                <NavItem href="/finance/list" $active={pathname === '/finance-admin/list'} $collapsed={collapsed}>
                                                    <NavIcon $active={pathname === '/finance-admin/list'} $collapsed={collapsed} $size={16} $iconType="list">
                                                        <List />
                                                    </NavIcon>
                                                    {!collapsed && 'All Managers'}
                                                </NavItem>
                                            </ComponentGate>
                                        </SubMenu>
                                    )}
                                </>
                            </ComponentGate>
                        )}

                        {/* 2. Accountants (Create, List) */}
                        {isAdmin && (
                            <ComponentGate componentId={ComponentId.SIDEBAR_ACCOUNTANTS}>
                                <>
                                    <DropdownHeader
                                        onClick={() => toggleSection('accountant')}
                                        $open={isOpen('accountant')}
                                        $active={pathname.includes('/accountant')}
                                        $collapsed={collapsed}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <DropdownIcon $active={pathname.includes('/accountant')} $collapsed={collapsed} $iconType="wallet">
                                                <Wallet />
                                            </DropdownIcon>
                                            {!collapsed && <span style={{ marginLeft: '12px' }}>Accountants</span>}
                                        </div>
                                        <ChevronIcon $open={isOpen('accountant')}>
                                            <ChevronDown />
                                        </ChevronIcon>
                                    </DropdownHeader>
                                    {isOpen('accountant') && (
                                        <SubMenu $collapsed={collapsed}>
                                            {/* Accountant Create Link */}
                                            <ComponentGate componentId={ComponentId.ACCOUNTANT_CREATE}>
                                                <NavItem href="/accountants/create" $active={pathname === '/accountant/create'} $collapsed={collapsed}>
                                                    <NavIcon $active={pathname === '/accountant/create'} $collapsed={collapsed} $size={16} $iconType="plus">
                                                        <UserPlus />
                                                    </NavIcon>
                                                    {!collapsed && 'Add Accountant'}
                                                </NavItem>
                                            </ComponentGate>
                                            {/* Accountant List Link */}
                                            <ComponentGate componentId={ComponentId.ACCOUNTANT_LIST}>
                                                <NavItem href="/accountants/list" $active={pathname === '/accountant/list'} $collapsed={collapsed}>
                                                    <NavIcon $active={pathname === '/accountant/list'} $collapsed={collapsed} $size={16} $iconType="list">
                                                        <List />
                                                    </NavIcon>
                                                    {!collapsed && 'All Accountants'}
                                                </NavItem>
                                            </ComponentGate>
                                        </SubMenu>
                                    )}
                                </>
                            </ComponentGate>
                        )}

                        {/* 3. Employees (Create, List) */}
                        {isAdmin && (
                            <ComponentGate componentId={ComponentId.SIDEBAR_EMPLOYEES}>
                                <>
                                    <DropdownHeader
                                        onClick={() => toggleSection('employee')}
                                        $open={isOpen('employee')}
                                        $active={pathname.includes('/employee')}
                                        $collapsed={collapsed}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center' }}>
                                            <DropdownIcon $active={pathname.includes('/employee')} $collapsed={collapsed} $iconType="users">
                                                <Users />
                                            </DropdownIcon>
                                            {!collapsed && <span style={{ marginLeft: '12px' }}>Employees</span>}
                                        </div>
                                        <ChevronIcon $open={isOpen('employee')}>
                                            <ChevronDown />
                                        </ChevronIcon>
                                    </DropdownHeader>
                                    {isOpen('employee') && (
                                        <SubMenu $collapsed={collapsed}>
                                            {/* Employee Create Link */}
                                            <ComponentGate componentId={ComponentId.EMPLOYEE_CREATE}>
                                                <NavItem href="/employees/create" $active={pathname === '/employee/create'} $collapsed={collapsed}>
                                                    <NavIcon $active={pathname === '/employee/create'} $collapsed={collapsed} $size={16} $iconType="plus">
                                                        <UserPlus />
                                                    </NavIcon>
                                                    {!collapsed && 'Add Employee'}
                                                </NavItem>
                                            </ComponentGate>
                                            {/* Employee List Link */}
                                            <ComponentGate componentId={ComponentId.EMPLOYEE_LIST}>
                                                <NavItem href="/employees/list" $active={pathname === '/employee/list'} $collapsed={collapsed}>
                                                    <NavIcon $active={pathname === '/employee/list'} $collapsed={collapsed} $size={16} $iconType="list">
                                                        <List />
                                                    </NavIcon>
                                                    {!collapsed && 'All Employees'}
                                                </NavItem>
                                            </ComponentGate>
                                        </SubMenu>
                                    )}
                                </>
                            </ComponentGate>
                        )}

                        {/* Departments */}
                        <ComponentGate componentId={ComponentId.SIDEBAR_DEPARTMENT}>
                            <NavItem href="/department/list" $active={pathname.includes('/department')} $collapsed={collapsed}>
                                <NavIcon $active={pathname.includes('/department')} $collapsed={collapsed} $iconType="building">
                                    <Building />
                                </NavIcon>
                                {!collapsed && 'Departments'}
                            </NavItem>
                        </ComponentGate>

                        {/* Projects */}
                        <ComponentGate componentId={ComponentId.SIDEBAR_PROJECT}>
                            <NavItem href="/project/list" $active={pathname.includes('/project')} $collapsed={collapsed}>
                                <NavIcon $active={pathname.includes('/project')} $collapsed={collapsed} $iconType="briefcase">
                                    <Briefcase />
                                </NavIcon>
                                {!collapsed && 'Projects'}
                            </NavItem>
                        </ComponentGate>

                        {/* Permissions */}
                        <ComponentGate componentId={ComponentId.SIDEBAR_PERMISSIONS}>
                            <NavItem href="/permissions" $active={pathname.includes('/permissions')} $collapsed={collapsed}>
                                <NavIcon $active={pathname.includes('/permissions')} $collapsed={collapsed} $iconType="shield">
                                    <Key />
                                </NavIcon>
                                {!collapsed && 'Permissions'}
                            </NavItem>
                        </ComponentGate>
                        {/* Audit Logs */}
                        {isAdmin && (
                            <ComponentGate componentId={ComponentId.SIDEBAR_AUDIT_LOGS}>
                                <NavItem href="/admin/audit" $active={pathname.includes('/admin/audit')} $collapsed={collapsed}>
                                    <NavIcon $active={pathname.includes('/admin/audit')} $collapsed={collapsed} $iconType="activity">
                                        <Activity />
                                    </NavIcon>
                                    {!collapsed && 'Audit Logs'}
                                </NavItem>
                            </ComponentGate>
                        )}
                    </SectionContent>
                </>
            )}

            {/* ========== ACCOUNT SECTION (Bottom) 👤 ========== */}
            <AccountSection $collapsed={collapsed}>
                <SectionTitle
                    $collapsed={collapsed}
                    $isOpen={userSectionOpen}
                    $isAccountSection={true}
                    onClick={() => !collapsed && setUserSectionOpen(!userSectionOpen)}
                >
                    user
                    {!collapsed && (
                        <ChevronIcon $open={userSectionOpen}>
                            <ChevronDown />
                        </ChevronIcon>
                    )}
                </SectionTitle>

                <AccountSectionContent $isOpen={userSectionOpen} $collapsed={collapsed}>

                    <ComponentGate componentId={ComponentId.SIDEBAR_PROFILE}>
                        <NavItem href="/profile" $active={pathname === '/profile'} $collapsed={collapsed}>
                            <NavIcon $active={pathname === '/profile'} $collapsed={collapsed} $iconType="user-cog">
                                <UserCog />
                            </NavIcon>
                            {!collapsed && 'Profile'}
                        </NavItem>
                    </ComponentGate>

                    <ComponentGate componentId={ComponentId.SIDEBAR_SETTINGS}>
                        {(isAdmin || isFinanceAdmin || isAccountant || isEmployee) ? (
                            <>
                                <DropdownHeader
                                    onClick={() => toggleSection('settings')}
                                    $open={isOpen('settings')}
                                    $active={pathname.startsWith('/settings')}
                                    $collapsed={collapsed}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <DropdownIcon $active={pathname.startsWith('/settings')} $collapsed={collapsed} $iconType="settings">
                                            <Settings />
                                        </DropdownIcon>
                                        {!collapsed && <span style={{ marginLeft: '12px' }}>Settings</span>}
                                    </div>
                                    <ChevronIcon $open={isOpen('settings')}>
                                        <ChevronDown />
                                    </ChevronIcon>
                                </DropdownHeader>
                                {isOpen('settings') && (
                                    <SubMenu $collapsed={collapsed}>
                                        <NavItem href="/settings/general" $active={pathname === '/settings' || pathname === '/settings/general'} $collapsed={collapsed}>
                                            <NavIcon $active={pathname === '/settings' || pathname === '/settings/general'} $collapsed={collapsed} $size={16} $iconType="settings">
                                                <Settings />
                                            </NavIcon>
                                            {!collapsed && 'General'}
                                        </NavItem>

                                        {isAdmin && (
                                            <>
                                                <NavItem href="/settings/notifications" $active={pathname === '/settings/notifications'} $collapsed={collapsed}>
                                                    <NavIcon $active={pathname === '/settings/notifications'} $collapsed={collapsed} $size={16} $iconType="bell">
                                                        <Bell />
                                                    </NavIcon>
                                                    {!collapsed && 'Notifications'}
                                                </NavItem>

                                                <NavItem href="/settings/logs" $active={pathname === '/settings/logs'} $collapsed={collapsed}>
                                                    <NavIcon $active={pathname === '/settings/logs'} $collapsed={collapsed} $size={16} $iconType="list">
                                                        <List />
                                                    </NavIcon>
                                                    {!collapsed && 'Audit Logs'}
                                                </NavItem>
                                                <NavItem href="/settings/ipmanagement" $active={pathname === '/settings/ipmanagement'} $collapsed={collapsed}>
                                                    <NavIcon $active={pathname === '/settings/ipmanagement'} $collapsed={collapsed} $size={16} $iconType="network">
                                                        <Network />
                                                    </NavIcon>
                                                    {!collapsed && 'IP Management'}
                                                </NavItem>

                                                <NavItem href="/settings/backup" $active={pathname === '/settings/backup'} $collapsed={collapsed}>
                                                    <NavIcon $active={pathname === '/settings/backup'} $collapsed={collapsed} $size={16} $iconType="database">
                                                        <Database />
                                                    </NavIcon>
                                                    {!collapsed && 'Backup Center'}
                                                </NavItem>
                                            </>
                                        )}
                                        {(isAdmin || isFinanceAdmin) && (
                                            <>
                                                <NavItem href="/settings/passwordmanagement" $active={pathname === '/settings/passwordmanagement'} $collapsed={collapsed}>
                                                    <NavIcon $active={pathname === '/settings/passwordmanagement'} $collapsed={collapsed} $size={16} $iconType="lockKeyhole">
                                                        <LockKeyhole />
                                                    </NavIcon>
                                                    {!collapsed && 'Password Management'}
                                                </NavItem>
                                                <NavItem href="/settings/history" $active={pathname === '/settings/history'} $collapsed={collapsed}>
                                                    <NavIcon $active={pathname === '/settings/history'} $collapsed={collapsed} $size={16} $iconType="history">
                                                        <History />
                                                    </NavIcon>
                                                    {!collapsed && 'History'}
                                                </NavItem>
                                                <NavItem href="/settings/security" $active={pathname === '/settings/security'} $collapsed={collapsed}>
                                                    <NavIcon $active={pathname === '/settings/security'} $collapsed={collapsed} $size={16} $iconType="shield">
                                                        <Shield />
                                                    </NavIcon>
                                                    {!collapsed && 'Security Control'}
                                                </NavItem>
                                            </>
                                        )}
                                    </SubMenu>
                                )}
                            </>
                        ) : (
                            <NavItem href="/settings" $active={pathname.startsWith('/settings')} $collapsed={collapsed}>
                                <NavIcon $active={pathname.startsWith('/settings')} $collapsed={collapsed} $iconType="settings">
                                    <Settings />
                                </NavIcon>
                                {!collapsed && 'Settings'}
                            </NavItem>
                        )}
                    </ComponentGate>
                </AccountSectionContent>
            </AccountSection>
        </SidebarContainer>
    );
};

export default Sidebar;