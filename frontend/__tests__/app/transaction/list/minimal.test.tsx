import React from 'react';
import { render } from '@/__tests__/utils/test-utils';
import TransactionListPage from '@/app/transaction/list/ClientPage';

// Minimal mocks
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push: jest.fn() }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
}));

jest.mock('@/lib/rbac/auth-context', () => ({
    useAuth: () => ({ user: { id: 1, role: 'admin' }, isAuthenticated: true }),
}));

jest.mock('@/lib/api', () => ({
    __esModule: true,
    default: {
        getTransactions: jest.fn().mockResolvedValue({ data: [] }),
        getSales: jest.fn().mockResolvedValue({ data: [] }),
        getInventoryItems: jest.fn().mockResolvedValue({ data: [] }),
        getFinancialSummary: jest.fn().mockResolvedValue({ data: {} }),
        getSalesSummary: jest.fn().mockResolvedValue({ data: {} }),
        getInventorySummary: jest.fn().mockResolvedValue({ data: {} }),
    },
}));

jest.mock('@/components/layout', () => ({
    __esModule: true,
    default: ({ children }: any) => <div>{children}</div>
}));

describe('Minimal Render', () => {
    it('renders without crashing', () => {
        render(<TransactionListPage />);
    });
});
