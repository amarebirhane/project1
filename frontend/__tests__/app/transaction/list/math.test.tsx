import React from 'react';
import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import TransactionListPage from '@/app/transaction/list/ClientPage';
import apiClient from '@/lib/api';

// Router & Navigation mocks
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));

// API mock
jest.mock('@/lib/api', () => ({
    __esModule: true,
    default: {
        getTransactions: jest.fn(),
        getSales: jest.fn(),
        getInventoryItems: jest.fn(),
        getFinancialSummary: jest.fn(),
        getSalesSummary: jest.fn(),
        getInventorySummary: jest.fn(),
        getSubordinates: jest.fn(),
        getCurrentUser: jest.fn().mockResolvedValue({ data: { id: 1, role: 'admin' } }),
    },
}));

// Auth mock
jest.mock('@/lib/rbac/auth-context', () => ({
    useAuth: () => ({
        user: {
            id: 1,
            role: 'admin',
            username: 'admin',
            email: 'admin@test.com',
        },
        isAuthenticated: true,
    }),
}));

// Layout mock - CRITICAL to avoid infinite loops from Sidebar/Navbar
jest.mock('@/components/layout', () => {
    return {
        __esModule: true,
        default: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-layout">{children}</div>
    };
});

describe('TransactionListPage Inventory Math', () => {
    it('correctly calculates total inventory cost (unit_cost * quantity)', async () => {
        // Mock inventory with multiple units
        const mockInventory = [
            {
                id: 1,
                item_name: 'Test Item',
                quantity: 10,
                buying_price: 100,
                total_cost: 110, // unit cost including taxes/shipping
                category: 'Electronics',
                is_active: true,
                created_at: new Date().toISOString(),
            }
        ];

        (apiClient.getTransactions as jest.Mock).mockResolvedValue({ data: [] });
        (apiClient.getSales as jest.Mock).mockResolvedValue({ data: [] });
        (apiClient.getInventoryItems as jest.Mock).mockResolvedValue({ data: mockInventory });
        (apiClient.getFinancialSummary as jest.Mock).mockResolvedValue({ data: { financials: { total_revenue: 0, total_expenses: 0 } } });
        (apiClient.getSalesSummary as jest.Mock).mockResolvedValue({ data: { total_revenue: 0 } });
        (apiClient.getInventorySummary as jest.Mock).mockResolvedValue({ data: { total_cost_value: 0 } });

        render(<TransactionListPage />);

        // Wait for data to load
        await waitFor(() => {
            expect(screen.queryByText(/Loading transactions/i)).not.toBeInTheDocument();
            expect(screen.getByText('Test Item')).toBeInTheDocument();
        }, { timeout: 5000 });

        // The amount in the table for a unit cost of 110 and quantity of 10 should be 1100
        // formatCurrency typically adds $ or similar, but the value should match 1,100
        // Find the table row containing "Test Item" and verify the amount within it
        const tableRow = screen.getByText('Test Item').closest('tr');
        expect(tableRow).toHaveTextContent(/[-$]*1,100/);

        // Check Total Inventory Cost summary card
        const inventoryCostCard = screen.getByText(/Total Inventory Cost/i).closest('div')?.parentElement;
        expect(inventoryCostCard).toHaveTextContent(/1,100/);

        // Check Net Amount (should be -1100 since everything else is 0)
        const netAmountCard = screen.getByText(/Net Amount/i).closest('div')?.parentElement;
        expect(netAmountCard).toHaveTextContent(/1,100/);
    });
});
