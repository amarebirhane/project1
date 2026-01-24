// app/accounting/currencies/page.tsx
"use client";

import { useState, useEffect } from "react";
import styled, { css } from "styled-components";
import { Plus, Edit, Trash2, TrendingUp, DollarSign } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import Layout from "@/components/layout";

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

export default function CurrencyManagementPage() {
    const [currencies, setCurrencies] = useState<Currency[]>([]);
    const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"currencies" | "rates">("currencies");

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
                        <HeaderButton>
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
                                                            <ActionButton $variant="edit">
                                                                <Edit className="w-4 h-4" />
                                                            </ActionButton>
                                                            {!currency.is_base_currency && (
                                                                <ActionButton $variant="delete">
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
                                                            <ActionButton $variant="edit">
                                                                <Edit className="w-4 h-4" />
                                                            </ActionButton>
                                                            <ActionButton $variant="delete">
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
        </Layout>
    );
}
