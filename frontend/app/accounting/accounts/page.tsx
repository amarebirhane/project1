"use client";

import { useState, useEffect } from "react";
import styled, { css, keyframes } from "styled-components";
import {
    Plus,
    Edit,
    Trash2,
    ChevronRight,
    ChevronDown,
    Search,
    Filter,
    MoreVertical,
    Check,
    X,
    Building2,
    Wallet,
    CreditCard,
    TrendingUp,
    TrendingDown,
    Activity,
    AlertCircle
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import Layout from "@/components/layout";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";

// --- Styled Components ---

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.background};
  padding: ${props => props.theme.spacing.xl};
`;

const ContentContainer = styled.div`
  flex: 1;
  width: 100%;
  max-width: 940px;
  margin-left: auto;
  margin-right: 0;
  padding: ${props => props.theme.spacing.sm};
`;

const Header = styled.div`
  margin-bottom: ${props => props.theme.spacing.xxl};
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
`;

const TitleSection = styled.div``;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: ${props => props.theme.colors.text};
  letter-spacing: -0.025em;
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 1.125rem;
  font-weight: 500;
`;

const ActionsRow = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const PrimaryButton = styled.button`
  background: ${props => props.theme.colors.text};
  color: ${props => props.theme.colors.background};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.xl};
  border-radius: ${props => props.theme.borderRadius.lg};
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  transition: all 0.2s;
  box-shadow: ${props => props.theme.shadows.md};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px -10px rgba(0,0,0,0.5);
    opacity: 0.9;
  }

  &:active {
    transform: translateY(0);
  }
`;

const FilterGroup = styled.div`
  background: ${props => props.theme.colors.card};
  padding: 4px;
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  display: flex;
  gap: 4px;
  width: fit-content;
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    display: none;
  }
`;

const FilterButton = styled.button<{ $active: boolean; $color?: string }>`
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  transition: all 0.2s ease;
  
  ${props => props.$active ? css`
    background-color: ${props.$color || props.theme.colors.text};
    color: white;
    box-shadow: ${props.theme.shadows.sm};
  ` : css`
    color: ${props.theme.colors.textSecondary};
    &:hover {
      background-color: ${props.theme.colors.muted};
      color: ${props.theme.colors.text};
    }
  `}
`;

const Card = styled.div`
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 24px;
  border: 1px solid ${props => props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.3)'};
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.05);
  overflow: hidden;

  @media (prefers-color-scheme: dark) {
    background: rgba(17, 24, 39, 0.6);
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Th = styled.th`
  text-align: left;
  padding: ${props => props.theme.spacing.lg};
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${props => props.theme.colors.textSecondary};
  border-bottom: 2px solid ${props => props.theme.colors.border};
`;

const Td = styled.td`
  padding: ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${props => props.theme.colors.border};
  vertical-align: middle;
`;

const Tr = styled.tr`
  transition: background-color 0.2s;
  &:hover {
    background-color: rgba(0,0,0,0.01);
  }
`;

const AccountCode = styled.span`
  font-family: inherit;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
  background: ${props => props.theme.colors.muted};
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 0.875rem;
`;

const TypeBadge = styled.span<{ $type: string }>`
  padding: 4px 12px;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  
  ${props => {
        switch (props.$type) {
            case 'ASSET': return css`background: #dcfce7; color: #15803d;`;
            case 'LIABILITY': return css`background: #fee2e2; color: #b91c1c;`;
            case 'EQUITY': return css`background: #f3e8ff; color: #7e22ce;`;
            case 'REVENUE': return css`background: #dbeafe; color: #1d4ed8;`;
            case 'EXPENSE': return css`background: #ffedd5; color: #c2410c;`;
            default: return css`background: #f3f4f6; color: #374151;`;
        }
    }}
`;

const StatusBadge = styled.span<{ $active: boolean }>`
    width: 8px;
    height: 8px;
    border-radius: 50%;
    margin-right: 8px;
    display: inline-block;
    background-color: ${props => props.$active ? '#22c55e' : '#9ca3af'};
`;

const ActionButton = styled.button<{ $variant?: 'edit' | 'delete' }>`
  padding: 8px;
  border-radius: 8px;
  color: ${props => props.theme.colors.textSecondary};
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.$variant === 'delete' ? '#fee2e2' : props.theme.colors.muted};
    color: ${props => props.$variant === 'delete' ? '#dc2626' : props.theme.colors.primary};
  }
`;

const SummaryGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  margin-top: ${props => props.theme.spacing.xxl};
`;

const SummaryCard = styled(Card) <{ $color: string }>`
  padding: ${props => props.theme.spacing.lg};
  border-left: 4px solid ${props => props.$color};
`;

const SummaryLabel = styled.p`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 4px;
`;

const SummaryValue = styled.p`
  font-size: 1.5rem;
  font-weight: 800;
  color: ${props => props.theme.colors.text};
`;

// --- Modal Styled Components ---

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${props => props.theme.spacing.md};
`;

const ModalContent = styled(motion.div)`
  background: ${props => props.theme.colors.card};
  width: 100%;
  max-width: 500px;
  border-radius: 28px;
  padding: ${props => props.theme.spacing.xxl};
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
`;

const FormGroup = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: ${props => props.theme.colors.text};
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  background: ${props => props.theme.colors.muted};
  border: 2px solid transparent;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.text};
    background: ${props => props.theme.colors.card};
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 12px 16px;
  background: ${props => props.theme.colors.muted};
  border: 2px solid transparent;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
`;

// --- Interfaces ---

interface Account {
    id: number;
    code: string;
    name: string;
    account_type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
    description?: string;
    parent_account_id?: number;
    currency_code?: string;
    is_active: boolean;
    is_system_account: boolean;
}

export default function ChartOfAccountsPage() {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
    const [selectedType, setSelectedType] = useState<string>("ALL");
    const [searchQuery, setSearchQuery] = useState("");

    const { register, handleSubmit, reset, setValue } = useForm();

    const accountTypes = [
        { value: "ALL", label: "All Accounts", color: "#333" },
        { value: "ASSET", label: "Assets", color: "#16a34a" },
        { value: "LIABILITY", label: "Liabilities", color: "#dc2626" },
        { value: "EQUITY", label: "Equity", color: "#7e22ce" },
        { value: "REVENUE", label: "Revenue", color: "#2563eb" },
        { value: "EXPENSE", label: "Expenses", color: "#ea580c" },
    ];

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await apiClient.getAccountingAccounts();
            if (response.data) {
                const normalizedAccounts = (response.data as any[]).map(acc => ({
                    ...acc,
                    account_type: acc.account_type?.toUpperCase()
                }));
                setAccounts(normalizedAccounts);
            }
        } catch (error) {
            toast.error("Failed to load accounts");
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data: any) => {
        try {
            if (modalMode === 'create') {
                await apiClient.createAccountingAccount(data);
                toast.success("Account created successfully");
            } else if (modalMode === 'edit' && selectedAccount) {
                await apiClient.updateAccountingAccount(selectedAccount.id, data);
                toast.success("Account updated successfully");
            }
            setModalMode(null);
            reset();
            fetchAccounts();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Action failed");
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm("Are you sure you want to delete this account?")) return;
        try {
            await apiClient.deleteAccountingAccount(id);
            toast.success("Account deleted");
            fetchAccounts();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Delete failed");
        }
    };

    const handleEdit = (account: Account) => {
        setSelectedAccount(account);
        setModalMode('edit');
        setValue('code', account.code);
        setValue('name', account.name);
        setValue('account_type', account.account_type.toLowerCase());
        setValue('description', account.description);
        setValue('is_active', account.is_active);
    };

    const filteredAccounts = accounts.filter(acc => {
        const matchesType = selectedType === "ALL" || acc.account_type === selectedType;
        const matchesSearch = acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            acc.code.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <Layout>
            <PageContainer>
                <ContentContainer>
                    <Header>
                        <TitleSection>
                            <Title>Chart of Accounts</Title>
                            <Subtitle>Organize and manage your financial structure</Subtitle>
                        </TitleSection>
                        <PrimaryButton onClick={() => { setModalMode('create'); reset(); }}>
                            <Plus size={20} />
                            Add Account
                        </PrimaryButton>
                    </Header>

                    <ActionsRow>
                        <FilterGroup>
                            {accountTypes.map((type) => (
                                <FilterButton
                                    key={type.value}
                                    $active={selectedType === type.value}
                                    $color={type.color}
                                    onClick={() => setSelectedType(type.value)}
                                >
                                    {type.label}
                                </FilterButton>
                            ))}
                        </FilterGroup>
                        <div style={{ flex: 1, position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                            <Input
                                placeholder="Search accounts..."
                                style={{ paddingLeft: 48 }}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </ActionsRow>

                    <Card>
                        <Table>
                            <thead>
                                <tr>
                                    <Th>Code</Th>
                                    <Th>Account Name</Th>
                                    <Th>Type</Th>
                                    <Th>Status</Th>
                                    <Th style={{ textAlign: 'right' }}>Actions</Th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <Td colSpan={5} style={{ textAlign: 'center', height: 200 }}>
                                            Loading accounts...
                                        </Td>
                                    </tr>
                                ) : filteredAccounts.length === 0 ? (
                                    <tr>
                                        <Td colSpan={5} style={{ textAlign: 'center', height: 200, color: '#9ca3af' }}>
                                            No accounts found.
                                        </Td>
                                    </tr>
                                ) : (
                                    filteredAccounts.map((account) => (
                                        <Tr key={account.id}>
                                            <Td><AccountCode>{account.code}</AccountCode></Td>
                                            <Td>
                                                <div style={{ fontWeight: 700 }}>{account.name}</div>
                                                {account.description && <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{account.description}</div>}
                                            </Td>
                                            <Td><TypeBadge $type={account.account_type}>{account.account_type}</TypeBadge></Td>
                                            <Td>
                                                <div style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', fontWeight: 600 }}>
                                                    <StatusBadge $active={account.is_active} />
                                                    {account.is_active ? 'Active' : 'Deactivated'}
                                                </div>
                                            </Td>
                                            <Td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                                    <ActionButton onClick={() => handleEdit(account)}>
                                                        <Edit size={16} />
                                                    </ActionButton>
                                                    {!account.is_system_account && (
                                                        <ActionButton $variant="delete" onClick={() => handleDelete(account.id)}>
                                                            <Trash2 size={16} />
                                                        </ActionButton>
                                                    )}
                                                </div>
                                            </Td>
                                        </Tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </Card>

                    <SummaryGrid>
                        {accountTypes.slice(1).map(type => (
                            <SummaryCard key={type.value} $color={type.color}>
                                <SummaryLabel>{type.label}</SummaryLabel>
                                <SummaryValue>{accounts.filter(a => a.account_type === type.value).length}</SummaryValue>
                            </SummaryCard>
                        ))}
                    </SummaryGrid>
                </ContentContainer>
            </PageContainer>

            {/* Create/Edit Modal */}
            <AnimatePresence>
                {modalMode && (
                    <ModalOverlay
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <ModalContent
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
                                    {modalMode === 'create' ? 'New Account' : 'Edit Account'}
                                </h2>
                                <button onClick={() => setModalMode(null)}><X /></button>
                            </div>

                            <form onSubmit={handleSubmit(onSubmit)}>
                                <FormGroup>
                                    <Label>Account Code</Label>
                                    <Input {...register('code', { required: true })} placeholder="e.g. 1010" disabled={modalMode === 'edit'} />
                                </FormGroup>
                                <FormGroup>
                                    <Label>Account Name</Label>
                                    <Input {...register('name', { required: true })} placeholder="e.g. Cash in Hand" />
                                </FormGroup>
                                <FormGroup>
                                    <Label>Account Type</Label>
                                    <Select {...register('account_type', { required: true })}>
                                        <option value="asset">Asset</option>
                                        <option value="liability">Liability</option>
                                        <option value="equity">Equity</option>
                                        <option value="revenue">Revenue</option>
                                        <option value="expense">Expense</option>
                                    </Select>
                                </FormGroup>
                                <FormGroup>
                                    <Label>Description</Label>
                                    <Input {...register('description')} placeholder="Optional notes" />
                                </FormGroup>
                                <FormGroup>
                                    <Label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <input type="checkbox" {...register('is_active')} />
                                        Active Account
                                    </Label>
                                </FormGroup>

                                <PrimaryButton style={{ width: '100%', marginTop: 24 }} type="submit">
                                    {modalMode === 'create' ? 'Create Account' : 'Save Changes'}
                                </PrimaryButton>
                            </form>
                        </ModalContent>
                    </ModalOverlay>
                )}
            </AnimatePresence>
        </Layout>
    );
}
