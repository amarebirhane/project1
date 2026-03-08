'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import styled from 'styled-components';
import {
  Package, Plus, Edit, Trash2, Search,
  DollarSign, TrendingUp, AlertCircle,
  Loader2, Save, X, Power, PowerOff, Download, Warehouse as WarehouseIcon,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/rbac/auth-context';
import useUserStore from '@/store/userStore';
import { toast } from 'sonner';
import { theme } from '@/components/common/theme';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

// Icon color mapping for different icon types
const getIconColor = (iconType: string, active: boolean = false): string => {
  if (active) {
    // Active state colors (brighter)
    const activeColors: Record<string, string> = {
      'package': '#3b82f6',           // Blue
      'plus': '#22c55e',              // Green
      'edit': '#3b82f6',              // Blue
      'trash2': '#ef4444',            // Red
      'search': '#6366f1',            // Indigo
      'filter': '#8b5cf6',            // Purple
      'dollar-sign': '#16a34a',        // Green
      'trending-up': '#22c55e',       // Green
      'alert-circle': '#f59e0b',       // Amber
      'check-circle': '#22c55e',      // Green
      'loader2': '#3b82f6',           // Blue
      'eye': '#6366f1',               // Indigo
      'eye-off': '#6b7280',           // Gray
      'save': '#22c55e',              // Green
      'x': '#6b7280',                 // Gray
      'power': '#22c55e',             // Green
      'power-off': '#f59e0b',         // Amber
      'download': '#3b82f6',          // Blue
    };
    return activeColors[iconType] || '#6b7280';
  } else {
    // Inactive state colors (muted but colorful)
    const inactiveColors: Record<string, string> = {
      'package': '#60a5fa',           // Light Blue
      'plus': '#4ade80',              // Light Green
      'edit': '#60a5fa',              // Light Blue
      'trash2': '#f87171',            // Light Red
      'search': '#818cf8',            // Light Indigo
      'filter': '#a78bfa',            // Light Purple
      'dollar-sign': '#4ade80',        // Light Green
      'trending-up': '#4ade80',       // Light Green
      'alert-circle': '#fbbf24',       // Light Amber
      'check-circle': '#4ade80',      // Light Green
      'loader2': '#60a5fa',           // Light Blue
      'eye': '#818cf8',               // Light Indigo
      'eye-off': '#9ca3af',           // Light Gray
      'save': '#4ade80',              // Light Green
      'x': '#9ca3af',                 // Light Gray
      'power': '#4ade80',             // Light Green
      'power-off': '#fbbf24',         // Light Amber
      'download': '#60a5fa',          // Light Blue
    };
    return inactiveColors[iconType] || '#9ca3af';
  }
};

// Icon styled components
const IconWrapper = styled.div<{ $iconType?: string; $active?: boolean; $size?: number }>`
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${props => props.$iconType ? getIconColor(props.$iconType, props.$active || false) : '#6b7280'};
    opacity: ${props => props.$active ? 1 : 0.8};
    transition: all 0.2s ease;
    
    svg {
        width: ${props => props.$size ? `${props.$size}px` : '20px'};
        height: ${props => props.$size ? `${props.$size}px` : '20px'};
        transition: all 0.2s ease;
    }

    &:hover {
        opacity: 1;
        transform: scale(1.1);
    }
`;

const HeaderIcon = styled(IconWrapper)`
    margin-right: ${theme.spacing.md};
`;

const ButtonIcon = styled(IconWrapper)`
    margin-right: ${theme.spacing.sm};
`;

const StatIcon = styled(IconWrapper)`
    flex-shrink: 0;
`;

const ActionIcon = styled(IconWrapper)`
    cursor: pointer;
`;

const MessageIcon = styled(IconWrapper)`
    margin-right: ${theme.spacing.xs};
    vertical-align: middle;
`;

const PRIMARY_COLOR = theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = (props: any) => props.theme.colors.textDark;
const TEXT_COLOR_MUTED = theme.colors.textSecondary || '#666';

const CardShadow = `
  0 2px 4px -1px rgba(0, 0, 0, 0.06),
  0 1px 2px -1px rgba(0, 0, 0, 0.03),
  inset 0 0 0 1px rgba(0, 0, 0, 0.02)
`;

const PageContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 980px;
  margin-left: auto;
  margin-right: 0;
  padding: ${theme.spacing.sm} ${theme.spacing.sm} ${theme.spacing.sm};
`;

const HeaderContainer = styled.div`
  background: linear-gradient(135deg, ${PRIMARY_COLOR} 0%, #008800 100%);
  color: #ffffff;
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};
  border-radius: ${theme.borderRadius.md};
  box-shadow: ${CardShadow};
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
`;

const HeaderText = styled.div`
  h1 {
    font-size: clamp(24px, 3vw, 32px);
    font-weight: ${theme.typography.fontWeights.bold};
    margin: 0 0 ${theme.spacing.xs};
    color: #ffffff;
  }
  p {
    color: rgba(255, 255, 255, 0.9);
    margin: 0;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ParallelStatsContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.lg};
  grid-column: 1 / -1;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.xl};
  box-shadow: ${CardShadow};
  min-height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const StatContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StatInfo = styled.div`
  p:first-child {
    font-size: ${theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
    margin: 0 0 ${theme.spacing.xs};
  }
  p:last-child {
    font-size: clamp(24px, 3vw, 32px);
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
  }
`;

const FiltersContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  align-items: center;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StyledInput = styled.input`
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.textDark};
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: ${props => props.theme.colors.background};
  }

  &:hover:not(:disabled) {
    border-color: #d1d5db;
  }

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    background-color: ${theme.colors.backgroundSecondary};
    color: #6b7280;
    cursor: not-allowed;
    opacity: 0.7;
    border-color: #e5e7eb;
  }

  &[type="number"] {
    -moz-appearance: textfield;
    
    &::-webkit-outer-spin-button,
    &::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  }
`;

const SearchInput = styled(StyledInput)`
  flex: 1;
  min-width: 200px;
`;

const StyledTextarea = styled.textarea`
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.textDark};
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;
  resize: vertical;
  min-height: 100px;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: ${props => props.theme.colors.background};
  }

  &:hover:not(:disabled) {
    border-color: #d1d5db;
  }

  &::placeholder {
    color: #9ca3af;
  }

  &:disabled {
    background-color: ${theme.colors.backgroundSecondary};
    color: #6b7280;
    cursor: not-allowed;
    opacity: 0.7;
    border-color: #e5e7eb;
  }
`;

const StyledSelect = styled.select`
  width: 100%;
  max-width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: inherit;
  background: ${props => props.theme.colors.background};
  color: ${props => props.theme.colors.textDark};
  transition: all 0.2s ease-in-out;
  outline: none;
  box-sizing: border-box;
  margin: 0;
  cursor: pointer;

  &:focus {
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    background: ${props => props.theme.colors.background};
  }

  &:hover:not(:disabled) {
    border-color: #d1d5db;
  }

  &:disabled {
    background-color: ${theme.colors.backgroundSecondary};
    color: #6b7280;
    cursor: not-allowed;
    opacity: 0.7;
    border-color: #e5e7eb;
  }
`;

const ItemsTable = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  box-shadow: ${CardShadow};
  overflow: hidden;
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};
  background: ${theme.colors.background};
  margin-top: ${theme.spacing.md};
  border-radius: 0 0 ${theme.borderRadius.md} ${theme.borderRadius.md};
`;

const PaginationActions = styled.div`
  display: flex;
  gap: ${theme.spacing.sm};
  align-items: center;
`;

const PageInfo = styled.span`
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
  font-weight: ${theme.typography.fontWeights.medium};
`;

const PageButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${props => props.$active ? PRIMARY_COLOR : theme.colors.border};
  background: ${props => props.$active ? PRIMARY_COLOR : theme.colors.background};
  color: ${props => props.$active ? '#ffffff' : TEXT_COLOR_DARK(props)};
  font-size: ${theme.typography.fontSizes.sm};
  font-weight: ${theme.typography.fontWeights.medium};
  cursor: pointer;
  transition: all ${theme.transitions.default};

  &:hover:not(:disabled) {
    border-color: ${PRIMARY_COLOR};
    color: ${props => props.$active ? '#ffffff' : PRIMARY_COLOR};
    background: ${props => props.$active ? PRIMARY_COLOR : theme.colors.backgroundSecondary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TableHeader = styled.div<{ $isAccountant?: boolean }>`
  display: grid;
  grid-template-columns: ${props => props.$isAccountant
    ? '3fr 1.2fr 1fr 1fr'  // Accountant: Item Name, Selling Price, Stock, Status
    : '2.5fr 1fr 0.9fr 1fr 1.2fr 1fr 1fr 1fr 1fr 100px'};  // Full: Item Name, Buying Price, Expense, Total Cost, Selling Price, Stock, Profit/Unit, Margin %, Status, Actions
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  background: ${theme.colors.backgroundSecondary};
  border-bottom: 1px solid ${theme.colors.border};
  font-weight: ${theme.typography.fontWeights.bold};
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_DARK};
  
  @media (max-width: 1200px) {
    grid-template-columns: ${props => props.$isAccountant
    ? '2.5fr 1.2fr 1fr 1fr'
    : '2fr 0.9fr 0.8fr 0.9fr 1.1fr 0.9fr 0.9fr 0.9fr 0.9fr 90px'};
    gap: ${theme.spacing.sm};
    font-size: ${theme.typography.fontSizes.xs};
  }
`;

const TableRow = styled.div<{ $isAccountant?: boolean }>`
  display: grid;
  grid-template-columns: ${props => props.$isAccountant
    ? '3fr 1.2fr 1fr 1fr'  // Accountant: Item Name, Selling Price, Stock, Status
    : '2.5fr 1fr 0.9fr 1fr 1.2fr 1fr 1fr 1fr 1fr 100px'};  // Full: Item Name, Buying Price, Expense, Total Cost, Selling Price, Stock, Profit/Unit, Margin %, Status, Actions
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  border-bottom: 1px solid ${theme.colors.border};
  align-items: center;
  transition: background-color ${theme.transitions.default};

  &:hover {
    background: ${theme.colors.backgroundSecondary};
  }

  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: 1200px) {
    grid-template-columns: ${props => props.$isAccountant
    ? '2.5fr 1.2fr 1fr 1fr'
    : '2fr 0.9fr 0.8fr 0.9fr 1.1fr 0.9fr 0.9fr 0.9fr 0.9fr 90px'};
    gap: ${theme.spacing.sm};
    padding: ${theme.spacing.sm};
  }
`;

const TableCell = styled.div`
  font-size: ${theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_DARK};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0; /* Allows text truncation in grid */
  
  @media (max-width: 1200px) {
    font-size: ${theme.typography.fontSizes.xs};
  }
`;

const ActionButton = styled.button`
  padding: ${theme.spacing.xs};
  background: none;
  border: none;
  cursor: pointer;
  color: ${TEXT_COLOR_MUTED};
  transition: color ${theme.transitions.default};
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: ${TEXT_COLOR_DARK};
  }

  &[data-destructive='true'] {
    color: #dc2626;
    &:hover {
      color: #b91c1c;
    }
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  border: 1px solid ${theme.colors.border};
  padding: ${theme.spacing.xl};
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.lg};
  
  h2 {
    font-size: ${theme.typography.fontSizes.lg};
    font-weight: ${theme.typography.fontWeights.bold};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
  }
`;

const FormGroup = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.md};
`;

const ModalActions = styled.div`
  display: flex;
  gap: 16px;
  justify-content: space-between;
  margin-top: ${theme.spacing.xl};
`;

const Badge = styled.span<{ $variant: 'success' | 'warning' | 'danger' | 'info' }>`
  display: inline-flex;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  font-size: ${theme.typography.fontSizes.xs};
  font-weight: ${theme.typography.fontWeights.bold};
  border-radius: 9999px;
  ${(p) => {
    switch (p.$variant) {
      case 'success':
        return 'background-color: #dcfce7; color: #166534;';
      case 'warning':
        return 'background-color: #fef3c7; color: #92400e;';
      case 'danger':
        return 'background-color: #fee2e2; color: #991b1b;';
      default:
        return 'background-color: #dbeafe; color: #1e40af;';
    }
  }}
`;

interface InventoryItem {
  id: number;
  item_name: string;
  buying_price?: number;
  expense_amount?: number;
  total_cost?: number;
  selling_price: number;
  quantity: number;
  description?: string;
  category?: string;
  sku?: string;
  is_active: boolean;
  profit_per_unit?: number;
  profit_margin?: number;
  created_at: string;
  updated_at?: string;
  created_by_id?: number;
}

interface InventorySummary {
  total_items?: number;
  total_value?: number;
  total_profit?: number;
  active_items?: number;
  low_stock_items?: number;
  [key: string]: number | undefined;
}

interface Subordinate {
  id: number | string;
}

export default function InventoryManagePage() {
  const router = useRouter();
  const { user } = useAuth();
  const storeUser = useUserStore((state) => state.user);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showActivateDeactivateModal, setShowActivateDeactivateModal] = useState(false);
  const [itemToActivateDeactivate, setItemToActivateDeactivate] = useState<InventoryItem | null>(null);
  const [activateDeactivatePassword, setActivateDeactivatePassword] = useState('');
  const [activateDeactivatePasswordError, setActivateDeactivatePasswordError] = useState<string | null>(null);
  const [activatingDeactivating, setActivatingDeactivating] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [accessibleUserIds, setAccessibleUserIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Showing 8 items per page for inventory cards (2x4 grid or 1x8)

  // Form state
  const [formData, setFormData] = useState({
    item_name: '',
    buying_price: '',
    expense_amount: '0',
    selling_price: '',
    quantity: '0',
    description: '',
    category: '',
    sku: '',
    is_active: true,
  });

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.sku || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadItems = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getInventoryItems({ limit: 1000 });
      // Handle both direct array response and wrapped response
      const rawData = response?.data as unknown;
      let itemsData: InventoryItem[] = [];
      if (Array.isArray(rawData)) {
        itemsData = rawData as InventoryItem[];
      } else if (rawData && typeof rawData === 'object' && Array.isArray((rawData as { data?: unknown }).data)) {
        itemsData = (rawData as { data: InventoryItem[] }).data;
      }

      // Get accessible user IDs for finance admins (themselves + subordinates)
      // Accountants can see ALL items from Finance Admin and Employee for revenue posting
      // Admin/Super Admin can see ALL items (no filtering)
      const currentUserRole = user?.role?.toLowerCase();
      const isAdmin = currentUserRole === 'admin' || currentUserRole === 'super_admin';
      const isFinanceAdminRole = currentUserRole === 'finance_admin' || currentUserRole === 'finance_manager';
      const isAccountant = currentUserRole === 'accountant';
      const isSubordinateRole = currentUserRole === 'accountant' || currentUserRole === 'employee';
      let currentAccessibleUserIds: number[] = [];

      // Admins can see all items - skip filtering
      if (isAdmin) {
        // No filtering needed for admins
        setAccessibleUserIds([]);
      } else if (isAccountant) {
        // Accountants can only see items from their Finance Admin (manager) and their team
        // Get the accountant's manager_id (Finance Admin)
        const accountantId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
        let managerId: number | null = null;

        // Try to get managerId from storeUser first
        const managerIdStr = storeUser?.managerId;
        if (managerIdStr) {
          managerId = typeof managerIdStr === 'string' ? parseInt(managerIdStr, 10) : Number(managerIdStr);
        } else {
          // If not in storeUser, try to fetch current user profile from API
          try {
            const currentUserRes = await apiClient.getCurrentUser();
            const currentUserData = currentUserRes?.data;
            if (currentUserData?.manager_id !== undefined && currentUserData?.manager_id !== null) {
              managerId = typeof currentUserData.manager_id === 'string'
                ? parseInt(currentUserData.manager_id, 10)
                : Number(currentUserData.manager_id);
            }
          } catch (err) {
            console.warn('Failed to fetch current user profile for manager_id:', err);
          }
        }

        if (managerId) {
          try {
            const financeAdminId = managerId;

            // Get all subordinates of the Finance Admin (including the Finance Admin themselves)
            const subordinatesRes = await apiClient.getSubordinates(financeAdminId);
            const subordinates = Array.isArray(subordinatesRes?.data) ? (subordinatesRes.data as Subordinate[]) : [];

            // Include the Finance Admin themselves and all their subordinates
            currentAccessibleUserIds = [financeAdminId, ...subordinates.map((sub) => {
              const subId = typeof sub.id === 'string' ? parseInt(sub.id, 10) : Number(sub.id);
              return subId;
            })];

            // Store in state for use in filtering
            setAccessibleUserIds(currentAccessibleUserIds);

            if (process.env.NODE_ENV === 'development') {
              console.log('Accountant - Accessible User IDs for Inventory (from Finance Admin):', {
                accountantId: accountantId,
                financeAdminId: financeAdminId,
                subordinatesCount: subordinates.length,
                accessibleUserIds: currentAccessibleUserIds
              });
            }
          } catch (err) {
            console.error('Failed to fetch Finance Admin subordinates for accountant:', err);
            // Fallback: if we can't get subordinates, at least try to show items from the Finance Admin
            // This prevents all items from vanishing if there's a temporary API issue
            currentAccessibleUserIds = [managerId];
            setAccessibleUserIds(currentAccessibleUserIds);

            if (process.env.NODE_ENV === 'development') {
              console.log('Accountant - Using fallback (Finance Admin only):', {
                accountantId: accountantId,
                financeAdminId: managerId,
                accessibleUserIds: currentAccessibleUserIds
              });
            }
          }
        } else {
          // Accountant has no manager assigned - this is a data issue, but don't hide all items
          // Instead, show a warning and allow them to see items (fallback behavior)
          console.warn('Accountant has no manager (Finance Admin) assigned - showing all items as fallback');
          // Don't set currentAccessibleUserIds to empty - let it remain unset so filtering doesn't apply
          // This way items won't vanish completely
          setAccessibleUserIds([]);
        }
      } else if (isFinanceAdminRole && user?.id) {
        try {
          // Get subordinates - backend already filters to return only accountants and employees under this finance admin
          const financeAdminId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
          const subordinatesRes = await apiClient.getSubordinates(financeAdminId);
          const subordinates = Array.isArray(subordinatesRes?.data) ? (subordinatesRes.data as Subordinate[]) : [];
          // Include the finance admin themselves
          currentAccessibleUserIds = [financeAdminId, ...subordinates.map((sub) => {
            const subId = typeof sub.id === 'string' ? parseInt(sub.id, 10) : Number(sub.id);
            return subId;
          })];

          // Store in state for use in action handlers
          setAccessibleUserIds(currentAccessibleUserIds);

          if (process.env.NODE_ENV === 'development') {
            console.log('Finance Admin - Accessible User IDs for Inventory:', {
              financeAdminId: financeAdminId,
              subordinatesCount: subordinates.length,
              accessibleUserIds: currentAccessibleUserIds
            });
          }
        } catch (err) {
          console.warn('Failed to fetch subordinates, using only finance admin ID:', err);
          const financeAdminId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
          currentAccessibleUserIds = [financeAdminId];
          setAccessibleUserIds(currentAccessibleUserIds);
        }
      } else if (user?.id) {
        // For employees and other non-finance-admin roles:
        // They can ONLY see their own items
        const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
        currentAccessibleUserIds = [userId];
        setAccessibleUserIds(currentAccessibleUserIds);

        if (process.env.NODE_ENV === 'development' && isSubordinateRole) {
          console.log('Subordinate User - Can only access own inventory items:', {
            userId: userId,
            role: currentUserRole,
            accessibleUserIds: currentAccessibleUserIds
          });
        }
      }

      // Filter items based on access control
      if (!isAdmin) {
        if (isAccountant) {
          if (currentAccessibleUserIds.length > 0) {
            // Accountant: show items from their Finance Admin and their team only
            itemsData = itemsData.filter((item: InventoryItem) => {
              const createdById = item.created_by_id;
              return createdById && currentAccessibleUserIds.includes(createdById);
            });
          } else {
            // If accessibleUserIds is empty but we're an accountant, it means no manager was found
            // In this case, don't filter (show all items as fallback) rather than hiding everything
            // This prevents items from vanishing due to data issues
            console.warn('Accountant filtering skipped - no manager found, showing all items');
          }
        } else if (isFinanceAdminRole && currentAccessibleUserIds.length > 0) {
          // Finance admin: show items from themselves and their subordinates only
          itemsData = itemsData.filter((item: InventoryItem) => {
            const createdById = item.created_by_id;
            return createdById && currentAccessibleUserIds.includes(createdById);
          });
        } else if (user?.id) {
          // For employees and other roles: ONLY show their own items
          const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
          itemsData = itemsData.filter((item: InventoryItem) => {
            return item.created_by_id === userId;
          });
        }
      }
      // Admins see all items (no filtering)

      setItems(itemsData);
    } catch (err: unknown) {
      const errorMessage =
        (typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) ||
        (err instanceof Error ? err.message : 'Failed to load inventory items');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [storeUser, user]);

  const loadSummary = useCallback(async () => {
    try {
      const response = await apiClient.getInventorySummary();
      // Handle both direct object response and wrapped response
      const rawData = response?.data as unknown;
      const summaryData =
        rawData && typeof rawData === 'object' && !Array.isArray(rawData)
          ? (rawData as InventorySummary)
          : null;
      setSummary(summaryData);
    } catch (err: unknown) {
      // Silently fail - summary is optional
      console.warn('Failed to load inventory summary:', err);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      router.push('/dashboard');
      return;
    }
    // Allow Admin, Finance Admin, Manager, and Accountant (read-only) to view inventory
    const userRole = user?.role?.toLowerCase() || '';
    const allowedRoles = ['admin', 'super_admin', 'finance_manager', 'finance_admin', 'manager', 'accountant'];
    if (!allowedRoles.includes(userRole)) {
      router.push('/dashboard');
      return;
    }
    loadItems();
    // Only Finance Admin and Admin can see summary
    if (userRole !== 'accountant') {
      loadSummary();
    }
  }, [user, router, loadItems, loadSummary]);

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({
      item_name: '',
      buying_price: '',
      expense_amount: '0',
      selling_price: '',
      quantity: '0',
      description: '',
      category: '',
      sku: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (item: InventoryItem) => {
    // Check access control - admins can edit all items
    const currentUserRole = user?.role?.toLowerCase();
    const isAdmin = currentUserRole === 'admin' || currentUserRole === 'super_admin';
    const isFinanceAdminRole = currentUserRole === 'finance_admin' || currentUserRole === 'finance_manager';

    // Admins can edit any item
    if (isAdmin) {
      // No access check needed
    } else if (isFinanceAdminRole && accessibleUserIds.length > 0) {
      // Finance admins can only edit items created by themselves or their subordinates
      const createdById = item.created_by_id;
      if (createdById && !accessibleUserIds.includes(createdById)) {
        toast.error('You can only edit items created by yourself or your subordinates');
        return;
      }
    } else if (user?.id && item.created_by_id) {
      // For subordinates and other roles: can only edit their own items
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
      if (item.created_by_id !== userId) {
        toast.error('You can only edit your own items');
        return;
      }
    }

    setEditingItem(item);
    setFormData({
      item_name: item.item_name,
      buying_price: item.buying_price?.toString() || '',
      expense_amount: item.expense_amount?.toString() || '0',
      selling_price: item.selling_price.toString(),
      quantity: item.quantity.toString(),
      description: item.description || '',
      category: item.category || '',
      sku: item.sku || '',
      is_active: item.is_active,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.item_name || !formData.buying_price || !formData.selling_price) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const itemPayload = {
        item_name: formData.item_name,
        buying_price: parseFloat(formData.buying_price),
        expense_amount: parseFloat(formData.expense_amount || '0'),
        selling_price: parseFloat(formData.selling_price),
        quantity: parseInt(formData.quantity || '0'),
        description: formData.description || undefined,
        category: formData.category || undefined,
        sku: formData.sku || undefined,
        is_active: formData.is_active,
      };

      if (editingItem) {
        await apiClient.updateInventoryItem(editingItem.id, itemPayload);
        toast.success('Item updated successfully');
      } else {
        await apiClient.createInventoryItem(itemPayload);
        toast.success('Item created successfully');
      }

      setShowModal(false);
      await loadItems();
      await loadSummary();
    } catch (err: unknown) {
      const errorMessage =
        (typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) ||
        (err instanceof Error ? err.message : 'Failed to save item');
      toast.error(errorMessage);
      console.error('Error saving item:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete || !deletePassword.trim()) {
      setDeletePasswordError('Password is required');
      return;
    }

    // Check access control - admins can delete all items
    const currentUserRole = user?.role?.toLowerCase();
    const isAdmin = currentUserRole === 'admin' || currentUserRole === 'super_admin';
    const isFinanceAdminRole = currentUserRole === 'finance_admin' || currentUserRole === 'finance_manager';

    // Admins can delete any item
    if (isAdmin) {
      // No access check needed
    } else if (isFinanceAdminRole && accessibleUserIds.length > 0) {
      // Finance admins can only delete items created by themselves or their subordinates
      const createdById = itemToDelete.created_by_id;
      if (createdById && !accessibleUserIds.includes(createdById)) {
        setDeletePasswordError('You can only delete items created by yourself or your subordinates');
        toast.error('You can only delete items created by yourself or your subordinates');
        return;
      }
    } else if (user?.id && itemToDelete.created_by_id) {
      // For subordinates and other roles: can only delete their own items
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
      if (itemToDelete.created_by_id !== userId) {
        setDeletePasswordError('You can only delete your own items');
        toast.error('You can only delete your own items');
        return;
      }
    }

    setDeleting(true);
    setDeletePasswordError(null);

    try {
      await apiClient.deleteInventoryItem(itemToDelete.id, deletePassword.trim());
      toast.success('Item deleted successfully');
      setShowDeleteModal(false);
      setItemToDelete(null);
      setDeletePassword('');
      await loadItems();
      await loadSummary();
    } catch (err: unknown) {
      const errorMessage =
        (typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) ||
        (err instanceof Error ? err.message : 'Failed to delete item');
      setDeletePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const handleActivateDeactivate = async () => {
    if (!itemToActivateDeactivate || !activateDeactivatePassword.trim()) {
      setActivateDeactivatePasswordError('Password is required');
      return;
    }

    // Check access control - admins can activate/deactivate all items
    const currentUserRole = user?.role?.toLowerCase();
    const isAdmin = currentUserRole === 'admin' || currentUserRole === 'super_admin';
    const isFinanceAdminRole = currentUserRole === 'finance_admin' || currentUserRole === 'finance_manager';

    // Admins can activate/deactivate any item
    if (isAdmin) {
      // No access check needed
    } else if (isFinanceAdminRole && accessibleUserIds.length > 0) {
      // Finance admins can only activate/deactivate items created by themselves or their subordinates
      const createdById = itemToActivateDeactivate.created_by_id;
      if (createdById && !accessibleUserIds.includes(createdById)) {
        setActivateDeactivatePasswordError('You can only activate/deactivate items created by yourself or your subordinates');
        toast.error('You can only activate/deactivate items created by yourself or your subordinates');
        return;
      }
    } else if (user?.id && itemToActivateDeactivate.created_by_id) {
      // For subordinates and other roles: can only activate/deactivate their own items
      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : Number(user.id);
      if (itemToActivateDeactivate.created_by_id !== userId) {
        setActivateDeactivatePasswordError('You can only activate/deactivate your own items');
        toast.error('You can only activate/deactivate your own items');
        return;
      }
    }

    setActivatingDeactivating(true);
    setActivateDeactivatePasswordError(null);

    try {
      if (isActivating) {
        await apiClient.activateInventoryItem(itemToActivateDeactivate.id, activateDeactivatePassword.trim());
        toast.success('Item activated successfully');
      } else {
        await apiClient.deactivateInventoryItem(itemToActivateDeactivate.id, activateDeactivatePassword.trim());
        toast.success('Item deactivated successfully');
      }
      setShowActivateDeactivateModal(false);
      setItemToActivateDeactivate(null);
      setActivateDeactivatePassword('');
      await loadItems();
      await loadSummary();
    } catch (err: unknown) {
      const errorMessage =
        (typeof err === 'object' && err !== null && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) ||
        (err instanceof Error ? err.message : `Failed to ${isActivating ? 'activate' : 'deactivate'} item`);
      setActivateDeactivatePasswordError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setActivatingDeactivating(false);
    }
  };

  const handleExport = () => {
    try {
      if (filteredItems.length === 0) {
        toast.error('No items to export');
        return;
      }

      // Check role for export permission
      // Accountants should not see financial details (buying price, expense, cost, profit)
      const isAccountantRole = user?.role?.toLowerCase() === 'accountant';

      // Define columns to export based on role
      const headers = [
        'Item Name',
        'SKU',
        'Category',
        // Financials only for non-accountants
        ...(!isAccountantRole ? [
          'Buying Price',
          'Expense Amount',
          'Total Cost'
        ] : []),
        'Selling Price',
        'Quantity',
        // Profit metrics only for non-accountants
        ...(!isAccountantRole ? [
          'Profit Per Unit',
          'Profit Margin %'
        ] : []),
        'Status',
        'Description'
      ];

      // Format data as CSV
      const csvRows = filteredItems.map(item => {
        const row = [
          `"${(item.item_name || '').replace(/"/g, '""')}"`,
          `"${(item.sku || '').replace(/"/g, '""')}"`,
          `"${(item.category || '').replace(/"/g, '""')}"`
        ];

        if (!isAccountantRole) {
          row.push(
            (item.buying_price || 0).toString(),
            (item.expense_amount || 0).toString(),
            (item.total_cost || 0).toString()
          );
        }

        row.push(
          (item.selling_price || 0).toString(),
          (item.quantity || 0).toString()
        );

        if (!isAccountantRole) {
          row.push(
            (item.profit_per_unit || 0).toString(),
            (item.profit_margin || 0).toString()
          );
        }

        row.push(
          item.is_active ? 'Active' : 'Inactive',
          `"${(item.description || '').replace(/"/g, '""')}"`
        );

        return row.join(',');
      });

      const csvContent = [headers.join(','), ...csvRows].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];

      link.setAttribute('href', url);
      link.setAttribute('download', `inventory_export_${date}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('Inventory exported successfully');
    } catch (err) {
      console.error('Export failed:', err);
      toast.error('Failed to export inventory');
    }
  };



  const categories = Array.from(new Set(items.map(item => item.category).filter(Boolean)));

  const userRole = user?.role?.toLowerCase() || '';
  const isAccountant = userRole === 'accountant';
  const allowedRoles = ['admin', 'super_admin', 'finance_manager', 'finance_admin', 'manager', 'accountant'];

  if (!user || !allowedRoles.includes(userRole)) {
    return null;
  }

  return (
    <Layout>
      <PageContainer>
        <HeaderContainer>
          <HeaderContent>
            <HeaderText>
              <h1>
                <HeaderIcon $iconType="package" $size={32} $active={true}>
                  <Package size={32} />
                </HeaderIcon>
                {isAccountant ? 'Inventory Items' : 'Inventory Management'}
              </h1>
              <p>
                {isAccountant
                  ? 'View inventory items, selling prices, and quantities (Read Only)'
                  : 'Manage inventory items, costs, and pricing (Finance Admin Only)'
                }
              </p>
            </HeaderText>
            {!isAccountant && (
              <div style={{ display: 'flex', gap: '10px' }}>
                <Button
                  variant="outline"
                  onClick={() => router.push('/inventory/warehouses')}
                  style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm, backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', borderColor: 'rgba(255,255,255,0.2)' }}
                >
                  <WarehouseIcon size={16} />
                  Warehouses
                </Button>
                <Button onClick={handleCreate} style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}>
                  <ButtonIcon $iconType="plus" $size={16} $active={true}>
                    <Plus size={16} />
                  </ButtonIcon>
                  Add Item
                </Button>
              </div>
            )}
          </HeaderContent>
        </HeaderContainer>

        {summary && (
          <StatsGrid>
            <StatCard>
              <StatContent>
                <StatInfo>
                  <p>Total Items</p>
                  <p>{summary.total_unique_items || summary.total_items || 0}</p>
                </StatInfo>
                <StatIcon $iconType="package" $size={24} $active={true}>
                  <Package size={24} />
                </StatIcon>
              </StatContent>
            </StatCard>
            <StatCard>
              <StatContent>
                <StatInfo>
                  <p>Total Stock</p>
                  <p>{summary.total_quantity_in_stock || 0}</p>
                </StatInfo>
                <StatIcon $iconType="package" $size={24} $active={true}>
                  <Package size={24} />
                </StatIcon>
              </StatContent>
            </StatCard>
            {summary.total_cost_value !== undefined && (
              <StatCard>
                <StatContent>
                  <StatInfo>
                    <p>Total Cost Value</p>
                    <p>${Number(summary.total_cost_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                  </StatInfo>
                  <StatIcon $iconType="dollar-sign" $size={24} $active={true}>
                    <DollarSign size={24} />
                  </StatIcon>
                </StatContent>
              </StatCard>
            )}
            {(summary.total_selling_value !== undefined || summary.potential_profit !== undefined) && (
              <ParallelStatsContainer>
                {summary.total_selling_value !== undefined && (
                  <StatCard>
                    <StatContent>
                      <StatInfo>
                        <p>Total Selling Value</p>
                        <p>${Number(summary.total_selling_value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </StatInfo>
                      <StatIcon $iconType="trending-up" $size={24} $active={true}>
                        <TrendingUp size={24} />
                      </StatIcon>
                    </StatContent>
                  </StatCard>
                )}
                {summary.potential_profit !== undefined && (
                  <StatCard>
                    <StatContent>
                      <StatInfo>
                        <p>Potential Profit</p>
                        <p style={{ color: '#16a34a' }}>
                          ${Number(summary.potential_profit || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </StatInfo>
                      <StatIcon $iconType="trending-up" $size={24} $active={true}>
                        <TrendingUp size={24} />
                      </StatIcon>
                    </StatContent>
                  </StatCard>
                )}
              </ParallelStatsContainer>
            )}
          </StatsGrid>
        )}

        <FiltersContainer>
          <SearchInput
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '40px' }}
          />
          <StyledSelect value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </StyledSelect>
          <Button
            variant="outline"
            onClick={handleExport}
            style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}
          >
            <ButtonIcon $iconType="download" $size={16} $active={true}>
              <Download size={16} />
            </ButtonIcon>
            Export
          </Button>
        </FiltersContainer>

        {loading ? (
          <div style={{ textAlign: 'center', padding: theme.spacing.xxl }}>
            <IconWrapper $iconType="loader2" $size={32} $active={true}>
              <Loader2 size={32} className="animate-spin" style={{ margin: '0 auto' }} />
            </IconWrapper>
            <p style={{ marginTop: theme.spacing.md, color: TEXT_COLOR_MUTED }}>Loading inventory...</p>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: theme.spacing.xxl }}>
            <MessageIcon $iconType="alert-circle" $size={32} $active={true}>
              <AlertCircle size={32} style={{ margin: '0 auto' }} />
            </MessageIcon>
            <p style={{ marginTop: theme.spacing.md, color: '#dc2626' }}>{error}</p>
          </div>
        ) : (
          <ItemsTable>
            <TableHeader $isAccountant={isAccountant}>
              <div>Item Name</div>
              {!isAccountant && <div>Buying Price</div>}
              {!isAccountant && <div>Expense</div>}
              {!isAccountant && <div>Total Cost</div>}
              <div>Selling Price</div>
              <div>Stock</div>
              {!isAccountant && <div>Profit/Unit</div>}
              {!isAccountant && <div>Margin %</div>}
              <div>Status</div>
              {!isAccountant && <div>Actions</div>}
            </TableHeader>
            {filteredItems.length === 0 ? (
              <div style={{ padding: theme.spacing.xxl, textAlign: 'center', color: TEXT_COLOR_MUTED }}>
                {items.length === 0 ? (
                  <>
                    <IconWrapper $iconType="package" $size={48} $active={false} style={{ margin: '0 auto', opacity: 0.5, marginBottom: theme.spacing.md }}>
                      <Package size={48} />
                    </IconWrapper>
                    <p style={{ margin: 0, marginBottom: theme.spacing.sm }}>No inventory items yet</p>
                    <p style={{ margin: 0, fontSize: theme.typography.fontSizes.sm }}>Click &quot;Add Item&quot; to create your first inventory item</p>
                  </>
                ) : (
                  <>
                    <IconWrapper $iconType="search" $size={48} $active={false} style={{ margin: '0 auto', opacity: 0.5, marginBottom: theme.spacing.md }}>
                      <Search size={48} />
                    </IconWrapper>
                    <p style={{ margin: 0 }}>No items match your search criteria</p>
                  </>
                )}
              </div>
            ) : (
              paginatedItems.map((item) => (
                <TableRow key={item.id} $isAccountant={isAccountant}>
                  <TableCell>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.item_name}</div>
                      {item.sku && <div style={{ fontSize: '12px', color: TEXT_COLOR_MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>SKU: {item.sku}</div>}
                    </div>
                  </TableCell>
                  {!isAccountant && (
                    <TableCell>
                      {item.buying_price !== undefined && item.buying_price !== null
                        ? `$${Number(item.buying_price).toFixed(2)}`
                        : 'N/A'}
                    </TableCell>
                  )}
                  {!isAccountant && (
                    <TableCell>
                      {item.expense_amount !== undefined && item.expense_amount !== null
                        ? `$${Number(item.expense_amount).toFixed(2)}`
                        : '$0.00'}
                    </TableCell>
                  )}
                  {!isAccountant && (
                    <TableCell>
                      {item.total_cost !== undefined && item.total_cost !== null
                        ? `$${Number(item.total_cost).toFixed(2)}`
                        : 'N/A'}
                    </TableCell>
                  )}
                  <TableCell>${Number(item.selling_price).toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge $variant={item.quantity < 10 ? 'danger' : item.quantity < 50 ? 'warning' : 'success'}>
                      {item.quantity}
                    </Badge>
                  </TableCell>
                  {!isAccountant && (
                    <TableCell>
                      {item.profit_per_unit !== undefined && item.profit_per_unit !== null
                        ? `$${Number(item.profit_per_unit).toFixed(2)}`
                        : 'N/A'}
                    </TableCell>
                  )}
                  {!isAccountant && (
                    <TableCell>
                      {item.profit_margin !== undefined && item.profit_margin !== null
                        ? `${Number(item.profit_margin).toFixed(1)}%`
                        : 'N/A'}
                    </TableCell>
                  )}
                  <TableCell>
                    <Badge $variant={item.is_active ? 'success' : 'danger'}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  {!isAccountant && (
                    <TableCell>
                      <div style={{ display: 'flex', gap: theme.spacing.xs }}>
                        <ActionButton onClick={() => handleEdit(item)} title="Edit">
                          <ActionIcon $iconType="edit" $size={16} $active={true}>
                            <Edit size={16} />
                          </ActionIcon>
                        </ActionButton>
                        <ActionButton
                          onClick={() => {
                            setItemToDelete(item);
                            setShowDeleteModal(true);
                            setDeletePassword('');
                            setDeletePasswordError(null);
                          }}
                          title="Delete"
                          data-destructive="true"
                        >
                          <ActionIcon $iconType="trash2" $size={16} $active={true}>
                            <Trash2 size={16} />
                          </ActionIcon>
                        </ActionButton>
                        {item.is_active ? (
                          <ActionButton
                            onClick={() => {
                              setItemToActivateDeactivate(item);
                              setIsActivating(false);
                              setShowActivateDeactivateModal(true);
                              setActivateDeactivatePassword('');
                              setActivateDeactivatePasswordError(null);
                            }}
                            title="Deactivate"
                          >
                            <ActionIcon $iconType="power-off" $size={16} $active={true}>
                              <PowerOff size={16} />
                            </ActionIcon>
                          </ActionButton>
                        ) : (
                          <ActionButton
                            onClick={() => {
                              setItemToActivateDeactivate(item);
                              setIsActivating(true);
                              setShowActivateDeactivateModal(true);
                              setActivateDeactivatePassword('');
                              setActivateDeactivatePasswordError(null);
                            }}
                            title="Activate"
                          >
                            <ActionIcon $iconType="power" $size={16} $active={true}>
                              <Power size={16} />
                            </ActionIcon>
                          </ActionButton>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </ItemsTable>
        )}

        {filteredItems.length > 0 && (
          <PaginationContainer>
            <PageInfo>
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredItems.length)} of {filteredItems.length} items
            </PageInfo>
            <PaginationActions>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
              >
                First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} />
              </Button>

              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <PageButton
                    key={pageNum}
                    $active={currentPage === pageNum}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </PageButton>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <ChevronRight size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
              >
                Last
              </Button>
            </PaginationActions>
          </PaginationContainer>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <ModalOverlay onClick={() => setShowModal(false)}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
                <ActionButton onClick={() => setShowModal(false)}>
                  <IconWrapper $iconType="x" $size={20} $active={false}>
                    <X size={20} />
                  </IconWrapper>
                </ActionButton>
              </ModalHeader>

              <FormGroup>
                <Label htmlFor="item_name">Item Name :</Label>
                <StyledInput
                  id="item_name"
                  value={formData.item_name}
                  onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                  placeholder="Enter item name"
                />
              </FormGroup>

              <FormRow>
                <FormGroup>
                  <Label htmlFor="buying_price">Buying Price: </Label>
                  <StyledInput
                    id="buying_price"
                    type="number"
                    step="0.01"
                    value={formData.buying_price}
                    onChange={(e) => setFormData({ ...formData, buying_price: e.target.value })}
                    placeholder="0.00"
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="expense_amount">Expense Amount: </Label>
                  <StyledInput
                    id="expense_amount"
                    type="number"
                    step="0.01"
                    value={formData.expense_amount}
                    onChange={(e) => setFormData({ ...formData, expense_amount: e.target.value })}
                    placeholder="0.00"
                  />
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup>
                  <Label htmlFor="selling_price">Selling Price: </Label>
                  <StyledInput
                    id="selling_price"
                    type="number"
                    step="0.01"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                    placeholder="0.00"
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="quantity">Initial Stock: </Label>
                  <StyledInput
                    id="quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="0"
                  />
                </FormGroup>
              </FormRow>

              <FormRow>
                <FormGroup>
                  <Label htmlFor="category">Category: </Label>
                  <StyledInput
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Electronics, Clothing"
                  />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="sku">SKU: </Label>
                  <StyledInput
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="Stock Keeping Unit"
                  />
                </FormGroup>
              </FormRow>

              <FormGroup>
                <Label htmlFor="description">Description: </Label>
                <StyledTextarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Item description"
                  rows={4}
                />
              </FormGroup>

              <ModalActions>
                <Button variant="outline" onClick={() => setShowModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.sm }}
                >
                  {saving ? (
                    <>
                      <ButtonIcon $iconType="loader2" $size={16} $active={true}>
                        <Loader2 size={16} className="animate-spin" />
                      </ButtonIcon>
                      Saving...
                    </>
                  ) : (
                    <>
                      <ButtonIcon $iconType="save" $size={16} $active={true}>
                        <Save size={16} />
                      </ButtonIcon>
                      {editingItem ? 'Update' : 'Create'} Item
                    </>
                  )}
                </Button>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && itemToDelete && (
          <ModalOverlay onClick={() => {
            setShowDeleteModal(false);
            setItemToDelete(null);
            setDeletePassword('');
            setDeletePasswordError(null);
          }}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <h2>Delete Inventory Item</h2>
                <ActionButton onClick={() => {
                  setShowDeleteModal(false);
                  setItemToDelete(null);
                  setDeletePassword('');
                  setDeletePasswordError(null);
                }}>
                  <IconWrapper $iconType="x" $size={20} $active={false}>
                    <X size={20} />
                  </IconWrapper>
                </ActionButton>
              </ModalHeader>

              <div style={{
                padding: theme.spacing.md,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: theme.borderRadius.md,
                marginBottom: theme.spacing.lg
              }}>
                <p style={{ margin: 0, color: '#dc2626', fontSize: theme.typography.fontSizes.sm, display: 'flex', alignItems: 'center' }}>
                  <MessageIcon $iconType="alert-circle" $size={16} $active={true}>
                    <AlertCircle size={16} />
                  </MessageIcon>
                  You are about to permanently delete <strong>&quot;{itemToDelete.item_name}&quot;</strong>. This action cannot be undone.
                </p>
              </div>

              <FormGroup>
                <Label htmlFor="delete-password">
                  Enter your password to confirm deletion:
                </Label>
                <StyledInput
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeletePasswordError(null);
                  }}
                  placeholder="Enter your password"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && deletePassword.trim() && !deleting) {
                      handleDelete();
                    }
                  }}
                />
                {deletePasswordError && (
                  <p style={{ color: '#dc2626', fontSize: theme.typography.fontSizes.sm, marginTop: theme.spacing.xs, margin: 0 }}>
                    {deletePasswordError}
                  </p>
                )}
              </FormGroup>

              <ModalActions>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setItemToDelete(null);
                    setDeletePassword('');
                    setDeletePasswordError(null);
                  }}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={!deletePassword.trim() || deleting}
                >
                  {deleting ? (
                    <>
                      <ButtonIcon $iconType="loader2" $size={16} $active={true}>
                        <Loader2 size={16} className="animate-spin" />
                      </ButtonIcon>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <ButtonIcon $iconType="trash2" $size={16} $active={true}>
                        <Trash2 size={16} />
                      </ButtonIcon>
                      Delete Item
                    </>
                  )}
                </Button>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}

        {/* Activate/Deactivate Confirmation Modal */}
        {showActivateDeactivateModal && itemToActivateDeactivate && (
          <ModalOverlay onClick={() => {
            setShowActivateDeactivateModal(false);
            setItemToActivateDeactivate(null);
            setActivateDeactivatePassword('');
            setActivateDeactivatePasswordError(null);
          }}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalHeader>
                <h2>{isActivating ? 'Activate Inventory Item' : 'Deactivate Inventory Item'}</h2>
                <ActionButton onClick={() => {
                  setShowActivateDeactivateModal(false);
                  setItemToActivateDeactivate(null);
                  setActivateDeactivatePassword('');
                  setActivateDeactivatePasswordError(null);
                }}>
                  <IconWrapper $iconType="x" $size={20} $active={false}>
                    <X size={20} />
                  </IconWrapper>
                </ActionButton>
              </ModalHeader>

              <div style={{
                padding: theme.spacing.md,
                background: isActivating ? 'rgba(16, 185, 129, 0.1)' : 'rgba(251, 191, 36, 0.1)',
                border: isActivating ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(251, 191, 36, 0.3)',
                borderRadius: theme.borderRadius.md,
                marginBottom: theme.spacing.lg
              }}>
                <p style={{ margin: 0, color: isActivating ? '#059669' : '#d97706', fontSize: theme.typography.fontSizes.sm, display: 'flex', alignItems: 'center' }}>
                  <MessageIcon $iconType="alert-circle" $size={16} $active={true}>
                    <AlertCircle size={16} />
                  </MessageIcon>
                  You are about to {isActivating ? 'activate' : 'deactivate'} <strong>&quot;{itemToActivateDeactivate.item_name}&quot;</strong>.
                  {!isActivating && ' Deactivated items will not be available for sale.'}
                </p>
              </div>

              <FormGroup>
                <Label htmlFor="activate-deactivate-password">
                  Enter your password to confirm:
                </Label>
                <StyledInput
                  id="activate-deactivate-password"
                  type="password"
                  value={activateDeactivatePassword}
                  onChange={(e) => {
                    setActivateDeactivatePassword(e.target.value);
                    setActivateDeactivatePasswordError(null);
                  }}
                  placeholder="Enter your password"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && activateDeactivatePassword.trim() && !activatingDeactivating) {
                      handleActivateDeactivate();
                    }
                  }}
                />
                {activateDeactivatePasswordError && (
                  <p style={{ color: '#dc2626', fontSize: theme.typography.fontSizes.sm, marginTop: theme.spacing.xs, margin: 0 }}>
                    {activateDeactivatePasswordError}
                  </p>
                )}
              </FormGroup>

              <ModalActions>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowActivateDeactivateModal(false);
                    setItemToActivateDeactivate(null);
                    setActivateDeactivatePassword('');
                    setActivateDeactivatePasswordError(null);
                  }}
                  disabled={activatingDeactivating}
                >
                  Cancel
                </Button>
                <Button
                  variant={isActivating ? 'default' : 'destructive'}
                  onClick={handleActivateDeactivate}
                  disabled={!activateDeactivatePassword.trim() || activatingDeactivating}
                >
                  {activatingDeactivating ? (
                    <>
                      <ButtonIcon $iconType="loader2" $size={16} $active={true}>
                        <Loader2 size={16} className="animate-spin" />
                      </ButtonIcon>
                      {isActivating ? 'Activating...' : 'Deactivating...'}
                    </>
                  ) : (
                    <>
                      {isActivating ? (
                        <ButtonIcon $iconType="power" $size={16} $active={true}>
                          <Power size={16} />
                        </ButtonIcon>
                      ) : (
                        <ButtonIcon $iconType="power-off" $size={16} $active={true}>
                          <PowerOff size={16} />
                        </ButtonIcon>
                      )}
                      {isActivating ? 'Activate' : 'Deactivate'} Item
                    </>
                  )}
                </Button>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}
      </PageContainer>
    </Layout>
  );
}
