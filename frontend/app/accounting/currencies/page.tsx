// app/accounting/currencies/page.tsx
"use client";

import { useState, useEffect } from "react";
import styled, { css } from "styled-components";
import { Plus, Edit, Trash2, TrendingUp, DollarSign, X, Check, AlertCircle } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import Layout from "@/components/layout";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { Suspense } from "react";

interface Currency {
    id: number;
    code: string;
    name: string;
    symbol: string;
    decimal_places: number;
    is_base_currency: boolean;
    is_active: boolean;
}

interface ExchangeRate {
    id: number;
    from_currency: Currency;
    to_currency: Currency;
    rate: number;
    effective_date: string;
    source: string;
}

const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(to bottom right, ${props => props.theme.colors.background}, ${props => props.theme.colors.muted});
  padding: ${props => props.theme.spacing.lg};
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
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const Title = styled.h1`
  font-size: 2.25rem; /* 4xl */
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  color: ${props => props.theme.colors.textDark};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const Description = styled.p`
  color: ${props => props.theme.colors.textSecondary};
`;

const HeaderButton = styled.button`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  background-color: #ea580c; /* orange-600 */
  color: white;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.lg};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  transition: all 0.2s;
  box-shadow: ${props => props.theme.shadows.md};
  border: none;
  cursor: pointer;

  &:hover {
    background-color: #c2410c; /* orange-700 */
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04); /* shadow-xl */
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

interface TabButtonProps {
    $active: boolean;
}

const TabButton = styled.button<TabButtonProps>`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.lg};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  border: none;
  cursor: pointer;

  ${props => props.$active ? css`
    background-color: #ea580c; /* orange-600 */
    color: white;
    box-shadow: ${props => props.theme.shadows.md};
  ` : css`
    background-color: ${props => props.theme.colors.card};
    color: ${props => props.theme.colors.text};
    &:hover {
      background-color: ${props => props.theme.colors.muted};
    }
  `}
`;

const Card = styled.div`
  background-color: ${props => props.theme.colors.card};
  border-radius: 1rem; /* 2xl equivalent approx */
  box-shadow: ${props => props.theme.shadows.md}; /* shadow-xl equivalent might need custom shadow */
  overflow: hidden;
  border: 1px solid ${props => props.theme.colors.border};
`;

const TableWrapper = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const Thead = styled.thead`
  background-color: ${props => props.theme.colors.muted};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const Th = styled.th`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  text-align: left;
  font-size: ${props => props.theme.typography.fontSizes.sm}; /* xs in tailwind usually smaller but matching theme */
  font-weight: ${props => props.theme.typography.fontWeights.bold}; /* semibold */
  color: ${props => props.theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em; /* tracking-wider */
`;

const Tr = styled.tr`
  transition: background-color 0.15s;
  &:hover {
    background-color: ${props => props.theme.colors.muted};
  }
`;

const Tbody = styled.tbody`
  & > tr:not(:last-child) {
      border-bottom: 1px solid ${props => props.theme.colors.border};
  }
`;

const Td = styled.td`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  white-space: nowrap;
`;

const CodeText = styled.span`
  font-family: monospace;
  font-size: ${props => props.theme.typography.fontSizes.sm};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  color: ${props => props.theme.colors.textDark};
`;

const BaseBadge = styled.span`
  padding: 0.25rem 0.5rem; /* px-2 py-1 */
  font-size: ${props => props.theme.typography.fontSizes.xs};
  font-weight: ${props => props.theme.typography.fontWeights.bold}; /* semibold */
  background-color: #dbeafe; /* blue-100 */
  color: #1e40af; /* blue-800 */
  border-radius: 0.25rem; /* rounded */
`;

interface StatusBadgeProps {
    $active: boolean;
}

const StatusBadge = styled.span<StatusBadgeProps>`
  padding: 0.25rem 0.75rem; /* px-3 py-1 */
  border-radius: 9999px; /* rounded-full */
  font-size: ${props => props.theme.typography.fontSizes.xs};
  font-weight: ${props => props.theme.typography.fontWeights.bold}; /* semibold */
  
  ${props => props.$active ? css`
    background-color: #dcfce7; /* green-100 */
    color: #166534; /* green-800 */
  ` : css`
    background-color: #f3f4f6; /* gray-100 */
    color: #1f2937; /* gray-800 */
  `}
`;

const SymbolText = styled.span`
  font-size: ${props => props.theme.typography.fontSizes.lg};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  color: ${props => props.theme.colors.textDark};
`;

const RateText = styled.span`
  font-size: ${props => props.theme.typography.fontSizes.lg};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  color: ${props => props.theme.colors.textDark};
`;

const SourceBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: ${props => props.theme.typography.fontSizes.xs};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  background-color: ${props => props.theme.colors.muted};
  color: ${props => props.theme.colors.text};
`;

const ActionButton = styled.button<{ $variant: 'edit' | 'delete' }>`
  padding: 0.5rem;
  border-radius: ${props => props.theme.borderRadius.md}; /* rounded-lg */
  transition: colors 0.2s;
  border: none;
  cursor: pointer;
  background: transparent;

  ${props => props.$variant === 'edit' ? css`
    color: #2563eb; /* blue-600 */
    &:hover {
      background-color: #eff6ff; /* blue-50 */
    }
  ` : css`
    color: #dc2626; /* red-600 */
    &:hover {
      background-color: #fef2f2; /* red-50 */
    }
  `}
`;

const ActionsCell = styled(Td)`
  text-align: right;
`;

const ActionGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${props => props.theme.spacing.sm};
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
  border: 1px solid ${props => props.theme.colors.border};
`;

const FormGroup = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 700;
  margin-bottom: 8px;
  color: ${props => props.theme.colors.textDark};
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  background: ${props => props.theme.colors.muted};
  border: 2px solid transparent;
  border-radius: 12px;
  font-weight: 600;
  transition: all 0.2s;
  color: ${props => props.theme.colors.text};
  
  &:focus {
    outline: none;
    border-color: #ea580c;
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
  color: ${props => props.theme.colors.text};

  &:focus {
    outline: none;
    border-color: #ea580c;
  }
`;

const ModalHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: ${props => props.theme.spacing.xl};

    h2 {
        font-size: 1.5rem;
        font-weight: 800;
        color: ${props => props.theme.colors.textDark};
    }

    button {
        background: none;
        border: none;
        color: ${props => props.theme.colors.textSecondary};
        cursor: pointer;
        &:hover { color: ${props => props.theme.colors.textDark}; }
    }
`;

const SubmitButton = styled(HeaderButton)`
    width: 100%;
    justify-content: center;
    margin-top: ${props => props.theme.spacing.lg};
`;

function CurrencyManagementContent() {
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"currencies" | "rates">("currencies");

    // Modal State
    const [isCurrencyModalOpen, setIsCurrencyModalOpen] = useState(false);
    const [isRateModalOpen, setIsRateModalOpen] = useState(false);
    const [editingCurrency, setEditingCurrency] = useState<Currency | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const { register, handleSubmit, reset, setValue } = useForm();
    const rateForm = useForm();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [currenciesRes, ratesRes] = await Promise.all([
                apiClient.getCurrencies(),
                apiClient.getExchangeRates()
            ]);
            if (currenciesRes.data) setCurrencies(currenciesRes.data);
            if (ratesRes.data) setExchangeRates(ratesRes.data);
        } catch (error) {
            console.error("Failed to fetch currency data:", error);
            toast.error("Failed to load currency management data");
        } finally {
            setLoading(false);
        }
    };

    const handleCurrencySubmit = async (data: any) => {
        try {
            setSubmitting(true);
            const payload = {
                ...data,
                decimal_places: parseInt(data.decimal_places),
                is_base_currency: data.is_base_currency === "true" || data.is_base_currency === true,
                is_active: data.is_active === "true" || data.is_active === true,
            };

            if (editingCurrency) {
                await apiClient.updateCurrency(editingCurrency.id, payload);
                toast.success("Currency updated successfully");
            } else {
                await apiClient.createCurrency(payload);
                toast.success("Currency added successfully");
            }
            setIsCurrencyModalOpen(false);
            setEditingCurrency(null);
            reset();
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to save currency");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRateSubmit = async (data: any) => {
        try {
            setSubmitting(true);
            const payload = {
                ...data,
                from_currency_id: parseInt(data.from_currency_id),
                to_currency_id: parseInt(data.to_currency_id),
                rate: parseFloat(data.rate),
            };
            await apiClient.createExchangeRate(payload);
            toast.success("Exchange rate added successfully");
            setIsRateModalOpen(false);
            rateForm.reset();
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to add exchange rate");
        } finally {
            setSubmitting(false);
        }
    };

    const deleteCurrency = async (id: number) => {
        if (!confirm("Are you sure you want to delete this currency?")) return;
        try {
            await apiClient.deleteCurrency(id);
            toast.success("Currency deleted");
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Delete failed");
        }
    };

    const deleteRate = async (id: number) => {
        if (!confirm("Are you sure you want to delete this exchange rate record?")) return;
        try {
            await apiClient.deleteExchangeRate(id);
            toast.success("Record removed");
            fetchData();
        } catch (error: any) {
            toast.error("Delete failed");
        }
    };

    const openEditCurrency = (currency: Currency) => {
        setEditingCurrency(currency);
        setValue("code", currency.code);
        setValue("name", currency.name);
        setValue("symbol", currency.symbol);
        setValue("decimal_places", currency.decimal_places);
        setValue("is_base_currency", currency.is_base_currency);
        setValue("is_active", currency.is_active);
        setIsCurrencyModalOpen(true);
    };

    return (
        <Layout>
            <PageWrapper>
                <ContentContainer>
                    {/* Header */}
                    <Header>
                        <div>
                            <Title>Currency Management</Title>
                            <Description>
                                Manage currencies and exchange rates
                            </Description>
                        </div>
                        <HeaderButton onClick={() => {
                            if (activeTab === "currencies") {
                                setEditingCurrency(null);
                                reset();
                                setIsCurrencyModalOpen(true);
                            } else {
                                rateForm.reset();
                                setIsRateModalOpen(true);
                            }
                        }}>
                            <Plus className="w-5 h-5" />
                            {activeTab === "currencies" ? "Add Currency" : "Add Exchange Rate"}
                        </HeaderButton>
                    </Header>

                    {/* Tabs */}
                    <TabsContainer>
                        <TabButton
                            onClick={() => setActiveTab("currencies")}
                            $active={activeTab === "currencies"}
                        >
                            <DollarSign className="w-5 h-5" />
                            Currencies
                        </TabButton>
                        <TabButton
                            onClick={() => setActiveTab("rates")}
                            $active={activeTab === "rates"}
                        >
                            <TrendingUp className="w-5 h-5" />
                            Exchange Rates
                        </TabButton>
                    </TabsContainer>

                    {/* Currencies Tab */}
                    {activeTab === "currencies" && (
                        <Card>
                            <TableWrapper>
                                <Table>
                                    <Thead>
                                        <tr>
                                            <Th>Code</Th>
                                            <Th>Currency</Th>
                                            <Th>Symbol</Th>
                                            <Th>Decimal Places</Th>
                                            <Th>Status</Th>
                                            <Th style={{ textAlign: 'right' }}>Actions</Th>
                                        </tr>
                                    </Thead>
                                    <Tbody>
                                        {currencies.length === 0 ? (
                                            <tr>
                                                <Td colSpan={6} style={{ textAlign: 'center', color: '#6b7280' }}>
                                                    No currencies configured. Add your first currency to enable multi-currency support.
                                                </Td>
                                            </tr>
                                        ) : (
                                            currencies.map((currency) => (
                                                <Tr key={currency.id}>
                                                    <Td>
                                                        <CodeText>{currency.code}</CodeText>
                                                    </Td>
                                                    <Td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontWeight: 500, color: 'var(--text-dark)' }}>
                                                                {currency.name}
                                                            </span>
                                                            {currency.is_base_currency && (
                                                                <BaseBadge>Base</BaseBadge>
                                                            )}
                                                        </div>
                                                    </Td>
                                                    <Td>
                                                        <SymbolText>{currency.symbol}</SymbolText>
                                                    </Td>
                                                    <Td style={{ fontSize: '0.875rem' }}>
                                                        {currency.decimal_places}
                                                    </Td>
                                                    <Td>
                                                        <StatusBadge $active={currency.is_active}>
                                                            {currency.is_active ? "Active" : "Inactive"}
                                                        </StatusBadge>
                                                    </Td>
                                                    <ActionsCell>
                                                        <ActionGroup>
                                                            <ActionButton $variant="edit" onClick={() => openEditCurrency(currency)}>
                                                                <Edit className="w-4 h-4" />
                                                            </ActionButton>
                                                            {!currency.is_base_currency && (
                                                                <ActionButton $variant="delete" onClick={() => deleteCurrency(currency.id)}>
                                                                    <Trash2 className="w-4 h-4" />
                                                                </ActionButton>
                                                            )}
                                                        </ActionGroup>
                                                    </ActionsCell>
                                                </Tr>
                                            ))
                                        )}
                                    </Tbody>
                                </Table>
                            </TableWrapper>
                        </Card>
                    )}

                    {/* Exchange Rates Tab */}
                    {activeTab === "rates" && (
                        <Card>
                            <TableWrapper>
                                <Table>
                                    <Thead>
                                        <tr>
                                            <Th>From</Th>
                                            <Th>To</Th>
                                            <Th>Exchange Rate</Th>
                                            <Th>Effective Date</Th>
                                            <Th>Source</Th>
                                            <Th style={{ textAlign: 'right' }}>Actions</Th>
                                        </tr>
                                    </Thead>
                                    <Tbody>
                                        {exchangeRates.length === 0 ? (
                                            <tr>
                                                <Td colSpan={6} style={{ textAlign: 'center', color: '#6b7280' }}>
                                                    No exchange rates configured. Add exchange rates to enable currency conversion.
                                                </Td>
                                            </tr>
                                        ) : (
                                            exchangeRates.map((rate) => (
                                                <Tr key={rate.id}>
                                                    <Td>
                                                        <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: 600 }}>
                                                            {rate.from_currency.code}
                                                        </span>
                                                    </Td>
                                                    <Td>
                                                        <span style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: 600 }}>
                                                            {rate.to_currency.code}
                                                        </span>
                                                    </Td>
                                                    <Td>
                                                        <RateText>{rate.rate.toFixed(4)}</RateText>
                                                    </Td>
                                                    <Td style={{ fontSize: '0.875rem' }}>
                                                        {new Date(rate.effective_date).toLocaleDateString()}
                                                    </Td>
                                                    <Td>
                                                        <SourceBadge>{rate.source}</SourceBadge>
                                                    </Td>
                                                    <ActionsCell>
                                                        <ActionGroup>
                                                            <ActionButton $variant="delete" onClick={() => deleteRate(rate.id)}>
                                                                <Trash2 className="w-4 h-4" />
                                                            </ActionButton>
                                                        </ActionGroup>
                                                    </ActionsCell>
                                                </Tr>
                                            ))
                                        )}
                                    </Tbody>
                                </Table>
                            </TableWrapper>
                        </Card>
                    )}
                </ContentContainer>
            </PageWrapper>

            {/* Currency Modal */}
            <AnimatePresence>
                {isCurrencyModalOpen && (
                    <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <ModalContent initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
                            <ModalHeader>
                                <h2>{editingCurrency ? "Edit Currency" : "Add New Currency"}</h2>
                                <button onClick={() => setIsCurrencyModalOpen(false)}><X size={24} /></button>
                            </ModalHeader>
                            <form onSubmit={handleSubmit(handleCurrencySubmit)}>
                                <FormGroup>
                                    <Label>Currency Code (ISO)</Label>
                                    <Input {...register("code", { required: true })} placeholder="e.g. USD" />
                                </FormGroup>
                                <FormGroup>
                                    <Label>Name</Label>
                                    <Input {...register("name", { required: true })} placeholder="e.g. US Dollar" />
                                </FormGroup>
                                <FormGroup>
                                    <Label>Symbol</Label>
                                    <Input {...register("symbol", { required: true })} placeholder="e.g. $" />
                                </FormGroup>
                                <FormGroup>
                                    <Label>Decimal Places</Label>
                                    <Input type="number" {...register("decimal_places", { required: true })} defaultValue={2} />
                                </FormGroup>
                                <FormGroup style={{ display: 'flex', gap: '20px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                                        <input type="checkbox" {...register("is_base_currency")} /> Base Currency
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem' }}>
                                        <input type="checkbox" {...register("is_active")} defaultChecked /> Active
                                    </label>
                                </FormGroup>
                                <SubmitButton type="submit" disabled={submitting}>
                                    {submitting ? "Saving..." : (editingCurrency ? "Update Currency" : "Add Currency")}
                                </SubmitButton>
                            </form>
                        </ModalContent>
                    </ModalOverlay>
                )}
            </AnimatePresence>

            {/* Exchange Rate Modal */}
            <AnimatePresence>
                {isRateModalOpen && (
                    <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <ModalContent initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>
                            <ModalHeader>
                                <h2>Add Exchange Rate</h2>
                                <button onClick={() => setIsRateModalOpen(false)}><X size={24} /></button>
                            </ModalHeader>
                            <form onSubmit={rateForm.handleSubmit(handleRateSubmit)}>
                                <FormGroup>
                                    <Label>From Currency</Label>
                                    <Select {...rateForm.register("from_currency_id", { required: true })}>
                                        <option value="">Select Currency</option>
                                        {currencies.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                                    </Select>
                                </FormGroup>
                                <FormGroup>
                                    <Label>To Currency</Label>
                                    <Select {...rateForm.register("to_currency_id", { required: true })}>
                                        <option value="">Select Currency</option>
                                        {currencies.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                                    </Select>
                                </FormGroup>
                                <FormGroup>
                                    <Label>Rate (1 From = X To)</Label>
                                    <Input type="number" step="0.000001" {...rateForm.register("rate", { required: true })} placeholder="e.g. 1.25" />
                                </FormGroup>
                                <FormGroup>
                                    <Label>Effective Date</Label>
                                    <Input type="date" {...rateForm.register("effective_date", { required: true })} defaultValue={new Date().toISOString().split('T')[0]} />
                                </FormGroup>
                                <FormGroup>
                                    <Label>Source</Label>
                                    <Select {...rateForm.register("source")}>
                                        <option value="manual">Manual</option>
                                        <option value="api">API</option>
                                        <option value="bank">Bank</option>
                                    </Select>
                                </FormGroup>
                                <SubmitButton type="submit" disabled={submitting}>
                                    {submitting ? "Adding..." : "Add Exchange Rate"}
                                </SubmitButton>
                            </form>
                        </ModalContent>
                    </ModalOverlay>
                )}
            </AnimatePresence>
        </Layout>
    );
}

export default function CurrencyManagementPage() {
    return (
        <Suspense fallback={<div>Loading Currencies...</div>}>
            <CurrencyManagementContent />
        </Suspense>
    );
}
