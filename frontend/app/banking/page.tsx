"use client";

import { useState, useEffect } from "react";
import styled from "styled-components";
import { Plus, TrendingUp, Upload, DollarSign } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { ComponentGate } from '@/lib/rbac';
import Layout from "@/components/layout";
import { X, Search, Filter, ArrowDown, ArrowUp, Loader2, Info } from "lucide-react";
import { BankLinkModal } from "@/components/banking/BankLinkModal";

// Styled Components

const PageWrapper = styled.div`
  min-height: 100vh;
  background-color: ${props => props.theme.colors.backgroundSecondary};
  background-image: radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.05) 0px, transparent 50%),
                    radial-gradient(at 50% 0%, rgba(139, 92, 246, 0.05) 0px, transparent 50%);
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
`;

const HeaderText = styled.div``;

const Title = styled.h1`
  font-size: 1.875rem; /* 3xl */
  font-weight: 700;
  color: ${props => props.theme.colors.textDark};
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.textSecondary};
  margin-top: ${props => props.theme.spacing.xs};
`;

const ConnectButton = styled.button`
  background-color: #2563eb; /* blue-600 */
  &:hover {
    background-color: #1d4ed8; /* blue-700 */
  }
  color: white;
  padding: 0.5rem 1rem;
  border-radius: ${props => props.theme.borderRadius.md}; /* rounded-lg */
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
`;

const ChartCard = styled.div`
  background-color: ${props => props.theme.colors.card};
  padding: ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.sm};
  border: 1px solid ${props => props.theme.colors.border};
`;

const ChartHeader = styled.h2`
  font-size: 1.25rem; /* xl */
  font-weight: 600;
  margin-bottom: ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: ${props => props.theme.colors.textDark};
`;

const ChartContainerWrapper = styled.div`
  height: 300px;
  width: 100%;
`;

const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${props => props.theme.spacing.lg};

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const AccountCard = styled.div`
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  padding: ${props => props.theme.spacing.lg};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.8);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border-color: #3b82f6;
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 4px;
    background: linear-gradient(to right, #2563eb, #8b5cf6);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover::before {
    opacity: 1;
  }
`;

const AccountHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${props => props.theme.spacing.md};
`;

const IconWrapper = styled.div`
  padding: 0.75rem;
  background-color: #eff6ff; /* blue-50 */
  border-radius: ${props => props.theme.borderRadius.md};
  color: #2563eb; /* blue-600 */
`;

const StatusBadge = styled.span`
  font-size: 0.875rem; /* sm */
  padding: 0.25rem 0.5rem;
  background-color: #dcfce7; /* green-100 */
  color: #15803d; /* green-700 */
  border-radius: 9999px; /* rounded-full */
  font-weight: 500;
`;

const AccountName = styled.h3`
  font-size: 1.125rem; /* lg */
  font-weight: 700;
  color: ${props => props.theme.colors.textDark};
`;

const AccountDetails = styled.p`
  font-size: 0.875rem; /* sm */
  color: ${props => props.theme.colors.textSecondary};
`;

const ActionGroup = styled.div`
  margin-top: ${props => props.theme.spacing.lg};
  display: flex;
  gap: 0.5rem;
`;

const UploadLabel = styled.label`
  flex: 1;
  cursor: pointer;
  background-color: #f3f4f6; /* gray-100 */
  &:hover {
    background-color: #e5e7eb; /* gray-200 */
  }
  color: #374151; /* gray-700 */
  padding: 0.5rem 1rem;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.875rem; /* sm */
  font-weight: 500;
  text-align: center;
  transition: background-color 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const SecondaryButton = styled.button`
  flex: 1;
  border: 1px solid ${props => props.theme.colors.border};
  &:hover {
    background-color: ${props => props.theme.colors.muted};
  }
  color: ${props => props.theme.colors.text};
  padding: 0.5rem 1rem;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.875rem; /* sm */
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
`;

const SimulateGroup = styled.div`
  margin-top: 0.5rem;
  display: flex;
  gap: 0.5rem;
`;

const SimulateSyncButton = styled.button`
  flex: 1;
  background-color: #eff6ff; /* blue-50 */
  &:hover {
    background-color: #dbeafe; /* blue-100 */
  }
  color: #1d4ed8; /* blue-700 */
  padding: 0.5rem 1rem;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.875rem; /* sm */
  font-weight: 500;
  transition: background-color 0.2s;
  border: none;
  cursor: pointer;
`;

const WebhookButton = styled.button`
  flex: 1;
  background-color: #faf5ff; /* purple-50 */
  &:hover {
    background-color: #f3e8ff; /* purple-100 */
  }
  color: #7e22ce; /* purple-700 */
  padding: 0.5rem 1rem;
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: 0.875rem; /* sm */
  font-weight: 500;
  transition: background-color 0.2s;
  border: none;
  cursor: pointer;
`;

const AddAccountButton = styled.button`
  border: 2px dashed ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  padding: ${props => props.theme.spacing.lg};
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: ${props => props.theme.colors.textSecondary};
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 200px; /* approximates the height of other cards */

  &:hover {
    color: #2563eb; /* blue-600 */
    border-color: #3b82f6; /* blue-500 */
  }
`;

const AddAccountText = styled.span`
  font-weight: 500;
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.3s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background: ${props => props.theme.colors.card};
  width: 100%;
  max-width: 500px;
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);

  @keyframes slideUp {
    from { transform: translateY(20px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const ModalHeader = styled.div`
  padding: 24px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: ${props => props.theme.colors.textDark};
  margin: 0;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme.colors.backgroundSecondary};
    color: ${props => props.theme.colors.textDark};
  }
`;

const ModalForm = styled.form`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const InputLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textSecondary};
`;

const StyledInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  color: ${props => props.theme.colors.textDark};
  font-size: 1rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  }
`;

const SubmitButton = styled.button`
  margin-top: 8px;
  background: linear-gradient(to right, #2563eb, #1d4ed8);
  color: white;
  padding: 14px;
  border-radius: ${props => props.theme.borderRadius.lg};
  font-size: 1rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: wait;
  }
`;

const TxModalContent = styled(ModalContent)`
  max-width: 800px;
  height: 80vh;
  display: flex;
  flex-direction: column;
`;

const TxListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
`;

const TxTable = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TxTh = styled.th`
  padding: 12px 24px;
  background: ${props => props.theme.colors.backgroundSecondary};
  text-align: left;
  font-size: 0.75rem;
  text-transform: uppercase;
  color: ${props => props.theme.colors.textSecondary};
  letter-spacing: 0.05em;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const Thead = styled.thead`
  border-bottom: 2px solid ${props => props.theme.colors.border};
`;

const TxTr = styled.tr`
  border-bottom: 1px solid ${props => props.theme.colors.border};
  &:hover {
    background: ${props => props.theme.colors.backgroundSecondary};
  }
`;

const TxTd = styled.td`
  padding: 16px 24px;
  font-size: 0.875rem;
  color: ${props => props.theme.colors.textDark};
`;

const SkeletonCard = styled.div`
  height: 250px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%);
  background-size: 200% 100%;
  animation: loading 1.5s infinite;
  border-radius: ${props => props.theme.borderRadius.lg};

  @keyframes loading {
    from { background-position: 200% 0; }
    to { background-position: -200% 0; }
  }
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  color: ${props => props.theme.colors.textSecondary};
  background: ${props => props.theme.colors.backgroundSecondary};
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 2px dashed ${props => props.theme.colors.border};
`;

export default function BankingPage() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncingId, setSyncingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    bank_name: "",
    account_name: "",
    account_number_last4: "",
    currency_code: "USD"
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsRes, forecastRes] = await Promise.all([
        apiClient.getBankAccounts(),
        apiClient.getCashFlowForecast(30)
      ]);

      if (accountsRes.data) setAccounts(accountsRes.data);
      if (forecastRes.data && forecastRes.data.forecast) setForecast(forecastRes.data.forecast);

    } catch (error) {
      console.error("Failed to load banking data", error);
      toast.error("Failed to load banking dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFetchTransactions = async (account: any) => {
    try {
      setSelectedAccount(account);
      setIsTxModalOpen(true);
      setTxLoading(true);
      const res = await apiClient.getBankTransactions(account.id);
      if (res.data) setTransactions(res.data);
    } catch (error) {
      toast.error("Failed to fetch transactions");
    } finally {
      setTxLoading(false);
    }
  };

  const handleUpload = async (accountId: number, file: File) => {
    try {
      await apiClient.uploadBankStatement(accountId, file);
      toast.success("Statement uploaded and processed successfully");
      loadData();
    } catch (error) {
      toast.error("Failed to upload statement");
    }
  };

  const handleSimulateFetch = async (accountId: number) => {
    try {
      setSyncingId(accountId);
      const res = await apiClient.simulateBankFetch(accountId);
      toast.success(`Successfully fetched ${res.data.length} new transactions`);
      loadData();
    } catch (error) {
      toast.error("Failed to simulate fetch");
    } finally {
      setSyncingId(null);
    }
  };

  const handleSimulateWebhook = async (accountId: number) => {
    try {
      setSyncingId(accountId);
      const payload = {
        amount: -(Math.abs(Math.random() * 200)).toFixed(2),
        description: `Coffee shop #${Math.floor(Math.random() * 1000)}`,
        date: new Date().toISOString()
      };
      await apiClient.simulateBankWebhook(accountId, payload);
      toast.success("Incoming transaction detected via webhook");
      loadData();
    } catch (error) {
      toast.error("Failed to simulate webhook");
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <Layout>
      <PageWrapper>
        {isModalOpen && (
          <BankLinkModal
            onClose={() => setIsModalOpen(false)}
            onSuccess={loadData}
          />
        )}
        <ContentContainer>
          {/* Header */}
          <Header>
            <HeaderText>
              <Title>Banking & Cash Flow</Title>
              <Subtitle>Manage bank feeds and view AI-powered cash forecasts</Subtitle>
            </HeaderText>
            <ConnectButton onClick={() => setIsModalOpen(true)}>
              <Plus size={20} /> Connect Account
            </ConnectButton>
          </Header>

          {/* Cash Flow Forecast Chart */}
          <ChartCard>
            <ChartHeader>
              <TrendingUp className="text-green-500" /> 30-Day Cash Flow Forecast
            </ChartHeader>
            <ChartContainerWrapper>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecast}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    dy={10}
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      padding: '12px'
                    }}
                  />
                  <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ paddingBottom: '20px' }} />
                  <Line
                    type="monotone"
                    dataKey="predicted_amount"
                    stroke="#10b981"
                    strokeWidth={4}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    name="AI Predicted Net Cash Flow"
                    animationDuration={2000}
                  />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainerWrapper>
          </ChartCard>

          {/* Bank Accounts Grid */}
          <GridContainer>
            {loading ? (
              Array(3).fill(0).map((_, i) => <SkeletonCard key={i} />)
            ) : accounts.length === 0 ? (
              <div style={{ gridColumn: '1 / -1' }}>
                <EmptyState>
                  <Info size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <h3>No Bank Accounts Connected</h3>
                  <p>Connect your first business account to start tracking cash flow.</p>
                </EmptyState>
              </div>
            ) : (
              accounts.map(account => (
                <AccountCard key={account.id}>
                  <AccountHeader>
                    <IconWrapper>
                      <DollarSign />
                    </IconWrapper>
                    <StatusBadge>Active</StatusBadge>
                  </AccountHeader>

                  <AccountName>{account.account_name}</AccountName>
                  <AccountDetails>{account.bank_name} •••• {account.account_number_last4}</AccountDetails>

                  <ActionGroup>
                    <UploadLabel>
                      <input
                        type="file"
                        className="hidden"
                        accept=".csv"
                        onChange={(e) => e.target.files?.[0] && handleUpload(account.id, e.target.files[0])}
                      />
                      <Upload size={16} /> Upload CSV
                    </UploadLabel>
                    <SecondaryButton onClick={() => handleFetchTransactions(account)}>
                      View Txns
                    </SecondaryButton>
                  </ActionGroup>

                  <SimulateGroup>
                    <SimulateSyncButton
                      onClick={() => handleSimulateFetch(account.id)}
                      disabled={syncingId === account.id}
                    >
                      {syncingId === account.id ? <Loader2 className="animate-spin" size={16} /> : "Simulate Sync"}
                    </SimulateSyncButton>
                    <WebhookButton
                      onClick={() => handleSimulateWebhook(account.id)}
                      disabled={syncingId === account.id}
                    >
                      {syncingId === account.id ? <Loader2 className="animate-spin" size={16} /> : "Webhook (Mock)"}
                    </WebhookButton>
                  </SimulateGroup>
                </AccountCard>
              ))
            )}

            {!loading && (
              <AddAccountButton onClick={() => setIsModalOpen(true)}>
                <Plus size={40} style={{ marginBottom: '0.5rem' }} />
                <AddAccountText>Connect New Bank</AddAccountText>
              </AddAccountButton>
            )}
          </GridContainer>

          {/* Transactions Modal */}
          {isTxModalOpen && (
            <ModalOverlay onClick={() => setIsTxModalOpen(false)}>
              <TxModalContent onClick={(e) => e.stopPropagation()}>
                <ModalHeader>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <IconWrapper style={{ padding: '8px' }}>
                      <TrendingUp size={20} />
                    </IconWrapper>
                    <ModalTitle>Transactions: {selectedAccount?.account_name}</ModalTitle>
                  </div>
                  <CloseButton onClick={() => setIsTxModalOpen(false)}>
                    <X size={24} />
                  </CloseButton>
                </ModalHeader>
                <TxListContainer>
                  {txLoading ? (
                    <div style={{ padding: '40px', display: 'flex', justifyContent: 'center' }}>
                      <Loader2 className="animate-spin" size={32} color="#2563eb" />
                    </div>
                  ) : transactions.length === 0 ? (
                    <EmptyState style={{ margin: '24px', border: 'none' }}>
                      <p>No transactions found for this account.</p>
                    </EmptyState>
                  ) : (
                    <TxTable>
                      <Thead>
                        <tr>
                          <TxTh>Date</TxTh>
                          <TxTh>Description</TxTh>
                          <TxTh>Amount</TxTh>
                          <TxTh>Status</TxTh>
                        </tr>
                      </Thead>
                      <tbody>
                        {transactions.map((tx) => (
                          <TxTr key={tx.id}>
                            <TxTd>{new Date(tx.date).toLocaleDateString()}</TxTd>
                            <TxTd style={{ fontWeight: 500 }}>{tx.description}</TxTd>
                            <TxTd>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: tx.amount < 0 ? '#ef4444' : '#10b981', fontWeight: 600 }}>
                                {tx.amount < 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedAccount?.currency_code || 'USD' }).format(Math.abs(tx.amount))}
                              </div>
                            </TxTd>
                            <TxTd>
                              <StatusBadge style={{
                                backgroundColor: tx.status === 'MATCHED' ? '#dcfce7' : '#f3f4f6',
                                color: tx.status === 'MATCHED' ? '#15803d' : '#6b7280'
                              }}>
                                {tx.status}
                              </StatusBadge>
                            </TxTd>
                          </TxTr>
                        ))}
                      </tbody>
                    </TxTable>
                  )}
                </TxListContainer>
              </TxModalContent>
            </ModalOverlay>
          )}

        </ContentContainer>
      </PageWrapper>
    </Layout>
  );
}
