// components/common/Sidebar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Home,
  Users,
  UserCog,
  Settings,
  ChevronDown,
  Shield,
  FileText,
  Receipt,
  DollarSign,
  TrendingUp,
  Building,
  Briefcase,
  UserCheck,
  Menu,
  PieChart,
  FileBarChart,
  CreditCard,
  Wallet,
  ArrowUpDown,
  Lock,
  Globe,
  SidebarClose,
} from 'lucide-react';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import { useAuthorization } from '@/lib/rbac/use-authorization';
import { UserType } from '@/lib/rbac/models';
import { useAuth } from '@/lib/rbac/auth-context';
import { useUserStore } from '@/store/userStore'; // Integrated from original snippet for auth consistency
import { Badge } from '@/components/ui/badge'; // Optional for indicators

// EAT Clock Component
const EATClock: React.FC = () => {
  const [time, setTime] = useState('');
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const eat = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Addis_Ababa',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(now);
      setTime(eat);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);
  return <div className="text-xs text-muted-foreground">{time}</div>;
};

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  href?: string;
  onClick?: () => void;
  className?: string;
}

const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  active = false,
  href,
  onClick,
  className,
}) => {
  const content = (
    <div
      className={cn(
        'group flex w-full items-center rounded-md border border-transparent px-2 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
        active && 'bg-accent text-accent-foreground',
        className,
      )}
      onClick={onClick}
    >
      {icon}
      <span className="ml-3">{label}</span>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="flex w-full">
        {content}
      </Link>
    );
  }

  return content;
};

interface DropdownProps {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
  defaultOpen?: boolean;
  className?: string;
}

const Dropdown: React.FC<DropdownProps> = ({
  label,
  icon,
  children,
  active = false,
  defaultOpen = false,
  className,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const toggle = () => setOpen(!open);

  return (
    <div className={cn('space-y-1', className)}>
      <button
        onClick={toggle}
        className={cn(
          'group flex w-full items-center rounded-md border border-transparent px-2 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
          active && 'bg-accent text-accent-foreground',
        )}
      >
        <div className="mr-2">{icon}</div>
        {label}
        <ChevronDown
          className={cn(
            'ml-auto h-4 w-4 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>
      {open && <div className="ml-4 space-y-1">{children}</div>}
    </div>
  );
};

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const pathname = usePathname();
  const { hasUserType, isAdmin, isSuperAdmin } = useAuthorization();
  const { user } = useAuth();
  const userStore = useUserStore(); // Integrated for additional auth checks if needed

  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({
    users: false,
    transactions: false,
    reports: false,
    settings: false,
  });

  useEffect(() => {
    const newOpen = { ...openDropdowns };
    if (pathname.includes('/users')) newOpen.users = true;
    if (pathname.includes('/transactions')) newOpen.transactions = true;
    if (pathname.includes('/reports')) newOpen.reports = true;
    if (pathname.includes('/settings')) newOpen.settings = true;
    setOpenDropdowns(newOpen);
  }, [pathname]);

  const toggleDropdown = (key: string) => {
    setOpenDropdowns((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isSuperAdminLike = () => isSuperAdmin() || hasUserType(UserType.SUPER_ADMIN);
  const isAdminLike = () => isAdmin() || hasUserType(UserType.ADMIN);

  const navContent = (
    <div className={cn('flex min-h-0 flex-col gap-2', className)}>
      {/* Logo */}
      <div className="mb-4 flex h-9 items-center px-4">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-primary" /> {/* Placeholder for logo */}
          <span className="font-bold">FinancePro ET</span>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex flex-1 flex-col gap-2">
        <nav className="grid gap-2 px-2 text-sm">
          {/* Dashboard */}
          <ComponentGate componentId={ComponentId.SIDEBAR_DASHBOARD}>
            <NavItem
              href="/dashboard"
              icon={<Home className="h-4 w-4" />}
              label="Dashboard"
              active={pathname === '/dashboard'}
            />
          </ComponentGate>

          {/* Users & Roles */}
          {(isSuperAdminLike() || isAdminLike()) && (
            <ComponentGate componentId={ComponentId.SIDEBAR_USERS}>
              <Dropdown
                label="Users & Roles"
                icon={<Users className="h-4 w-4" />}
                active={pathname.includes('/users')}
                defaultOpen={openDropdowns.users}
              >
                <NavItem
                  href="/users/list"
                  icon={<Users className="mr-0 h-4 w-4" />}
                  label="All Users"
                  active={pathname === '/users/list'}
                />
                <NavItem
                  href="/users/create"
                  icon={<UserCheck className="mr-0 h-4 w-4" />}
                  label="Create User"
                  active={pathname === '/users/create'}
                />
                <NavItem
                  href="/roles"
                  icon={<Shield className="mr-0 h-4 w-4" />}
                  label="Role Management"
                  active={pathname === '/roles'}
                />
              </Dropdown>
            </ComponentGate>
          )}

          {/* Transactions */}
          {hasUserType([UserType.MANAGER, UserType.ADMIN, UserType.SUPER_ADMIN]) && (
            <ComponentGate componentId={ComponentId.SIDEBAR_TRANSACTIONS}>
              <Dropdown
                label="Transactions"
                icon={<ArrowUpDown className="h-4 w-4" />}
                active={pathname.includes('/transactions')}
                defaultOpen={openDropdowns.transactions}
              >
                <NavItem
                  href="/transactions/list"
                  icon={<FileText className="mr-0 h-4 w-4" />}
                  label="All Transactions"
                  active={pathname === '/transactions/list'}
                />
                <NavItem
                  href="/transactions/create"
                  icon={<Receipt className="mr-0 h-4 w-4" />}
                  label="New Transaction"
                  active={pathname === '/transactions/create'}
                />
                <NavItem
                  href="/transactions/approval"
                  icon={<UserCog className="mr-0 h-4 w-4" />}
                  label="Pending Approval"
                  active={pathname === '/transactions/approval'}
                />
              </Dropdown>
            </ComponentGate>
          )}

          {/* Reports */}
          {hasUserType([UserType.ACCOUNTANT, UserType.MANAGER, UserType.ADMIN, UserType.SUPER_ADMIN]) && (
            <ComponentGate componentId={ComponentId.SIDEBAR_REPORTS}>
              <Dropdown
                label="Reports"
                icon={<FileBarChart className="h-4 w-4" />}
                active={pathname.includes('/reports')}
                defaultOpen={openDropdowns.reports}
              >
                <NavItem
                  href="/reports/income"
                  icon={<TrendingUp className="mr-0 h-4 w-4" />}
                  label="Income Statement"
                  active={pathname === '/reports/income'}
                />
                <NavItem
                  href="/reports/expenses"
                  icon={<DollarSign className="mr-0 h-4 w-4" />}
                  label="Expense Report"
                  active={pathname === '/reports/expenses'}
                />
                <NavItem
                  href="/reports/balance"
                  icon={<Building className="mr-0 h-4 w-4" />}
                  label="Balance Sheet"
                  active={pathname === '/reports/balance'}
                />
                <NavItem
                  href="/reports/cashflow"
                  icon={<CreditCard className="mr-0 h-4 w-4" />}
                  label="Cash Flow"
                  active={pathname === '/reports/cashflow'}
                />
              </Dropdown>
            </ComponentGate>
          )}

          {/* Accounts */}
          {hasUserType([UserType.ACCOUNTANT, UserType.ADMIN, UserType.SUPER_ADMIN]) && (
            <ComponentGate componentId={ComponentId.SIDEBAR_ACCOUNTS}>
              <NavItem
                href="/accounts"
                icon={<Wallet className="h-4 w-4" />}
                label="Chart of Accounts"
                active={pathname === '/accounts'}
              />
            </ComponentGate>
          )}

          {/* Budgets */}
          {hasUserType([UserType.MANAGER, UserType.ADMIN, UserType.SUPER_ADMIN]) && (
            <ComponentGate componentId={ComponentId.SIDEBAR_BUDGETS}>
              <NavItem
                href="/budgets"
                icon={<PieChart className="h-4 w-4" />}
                label="Budgets"
                active={pathname === '/budgets'}
              />
            </ComponentGate>
          )}
        </nav>
      </div>

      {/* User Section */}
      <div className="mt-auto space-y-2 px-2 pb-4">
        <nav className="grid gap-2 text-sm">
          <ComponentGate componentId={ComponentId.SIDEBAR_PROFILE}>
            <NavItem
              href="/profile"
              icon={<UserCog className="h-4 w-4" />}
              label="Profile"
              active={pathname === '/profile'}
            />
          </ComponentGate>
          <ComponentGate componentId={ComponentId.SIDEBAR_SETTINGS}>
            <Dropdown
              label="Settings"
              icon={<Settings className="h-4 w-4" />}
              active={pathname.includes('/settings')}
              defaultOpen={openDropdowns.settings}
            >
              <NavItem
                href="/settings/general"
                icon={<Globe className="mr-0 h-4 w-4" />}
                label="General"
                active={pathname === '/settings/general'}
              />
              <NavItem
                href="/settings/security"
                icon={<Lock className="mr-0 h-4 w-4" />}
                label="Security"
                active={pathname === '/settings/security'}
              />
              <NavItem
                href="/settings/company"
                icon={<Building className="mr-0 h-4 w-4" />}
                label="Company"
                active={pathname === '/settings/company'}
              />
            </Dropdown>
          </ComponentGate>
        </nav>
      </div>

      {/* Footer: Time & Country */}
      <div className="border-t p-4 text-xs text-muted-foreground">
        <EATClock />
        <div className="mt-1 font-semibold">ET</div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="mr-2 md:hidden">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle Sidebar</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="p-4">
            <SheetTitle>FinancePro ET</SheetTitle>
            <SheetDescription>Navigation menu</SheetDescription>
          </SheetHeader>
          {navContent}
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-4"
            onClick={() => setMobileOpen(false)}
          >
            <SidebarClose className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <div className="hidden border-r bg-background md:block md:w-64">
        {navContent}
      </div>
    </>
  );
};

export default Sidebar;