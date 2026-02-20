'use client';

import React, { useState, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';
import Layout from '@/components/layout';
import {
  LayoutDashboard,
  Link as LinkIcon,
  Plus,
  Trash2,
  Settings2,
  Save,
  Search,
  ChevronRight,
  Loader2,
  Shield,
  Database,
  Zap,
  X,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Styled Components Definitions

const PageWrapper = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, ${props => props.theme.colors.background} 0%, ${props => props.theme.colors.muted} 100%);
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

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 800;
  color: ${props => props.theme.colors.textDark};
  letter-spacing: -1px;
`;

const Subtitle = styled.p`
  color: ${props => props.theme.colors.textSecondary};
`;

const NewMappingButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.primaryForeground};
  padding: 0.75rem 1.5rem;
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 500;
  transition: all 0.2s;
  border: none;
  cursor: pointer;

  &:hover {
    filter: brightness(1.1);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const MainContent = styled.div`
  grid-column: span 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;

  @media (min-width: 1024px) {
    grid-column: span 2;
  }
`;

const SearchWrapper = styled.div`
  position: relative;
  &:focus-within svg {
    color: ${props => props.theme.colors.primary};
  }
`;

const StyledSearchIcon = styled(Search)`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.theme.colors.textSecondary};
  transition: color 0.2s;
`;

const SearchInput = styled.input`
  width: 100%;
  background-color: ${props => props.theme.colors.inputBg};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.full};
  padding: 1rem;
  padding-left: 3rem;
  padding-right: 1rem;
  color: ${props => props.theme.colors.text};
  transition: all 0.2s;
  outline: none;

  &:focus {
    box-shadow: 0 0 0 2px ${props => `${props.theme.colors.primary}80`};
    border-color: ${props => props.theme.colors.primary};
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const GlassPanel = styled.div`
  background: ${props => props.theme.colors.card};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.lg};
  box-shadow: ${props => props.theme.shadows.sm};
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  text-align: left;
  border-collapse: collapse;
`;

const Thead = styled.thead`
  background-color: ${props => props.theme.colors.backgroundSecondary};
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const Th = styled.th`
  padding: 1rem 1.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${props => props.theme.colors.textSecondary};
`;

const Tbody = styled.tbody`
  & > tr:not(:last-child) {
      border-bottom: 1px solid ${props => props.theme.colors.border};
  }
`;

const Tr = styled.tr`
  transition: background-color 0.2s;
  &:hover {
    background-color: ${props => props.theme.colors.backgroundSecondary};
  }
`;

const Td = styled.td`
  padding: 1rem 1.5rem;
`;

const ActionButton = styled.button`
  padding: 0.5rem;
  color: ${props => props.theme.colors.textSecondary};
  border-radius: 0.5rem;
  transition: all 0.2s;
  opacity: 0;
  border: none;
  background: transparent;
  cursor: pointer;

  ${Tr}:hover & {
    opacity: 1;
  }

  &:hover {
    color: ${props => props.theme.colors.error};
    background-color: ${props => `${props.theme.colors.error}1a`};
  }
`;

const HeaderButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${props => props.theme.colors.primary};
  color: ${props => props.theme.colors.primaryForeground};
  padding: 0.75rem 1.5rem;
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 700;
  transition: all 0.2s;
  border: none;
  cursor: pointer;

  &:hover {
    filter: brightness(0.9);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const ControlBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const SidePanel = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const CreatePanel = styled(GlassPanel) <{ $isVisible: boolean }>`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  transition: all 0.3s;
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  padding-bottom: 1rem;
`;

const PanelTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Select = styled.select`
  width: 100%;
  background-color: ${props => props.theme.colors.inputBg};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: 0.75rem 1rem;
  color: ${props => props.theme.colors.text};
  outline: none;
  font-weight: 600;
  
  &:focus {
    border-color: ${props => props.theme.colors.primary};
  }
`;

const Input = styled.input`
  width: 100%;
  background-color: ${props => props.theme.colors.inputBg};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: 0.75rem 1rem;
  color: ${props => props.theme.colors.text};
  outline: none;
  font-weight: 600;

  &:focus {
    border-color: ${props => props.theme.colors.primary};
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: ${props => props.theme.borderRadius.md};
  font-weight: 700;
  color: ${props => props.theme.colors.primaryForeground};
  background-color: ${props => props.theme.colors.primary};
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    filter: brightness(0.9);
  }
`;

const InfoPanel = styled(GlassPanel)`
  padding: 2rem;
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const IconCircle = styled.div`
  width: 4rem;
  height: 4rem;
  background-color: ${props => props.theme.colors.muted};
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
`;

const InfoTitle = styled.h3`
  font-weight: 700;
  font-size: 1.125rem;
  color: ${props => props.theme.colors.textDark};
`;

const InfoText = styled.p`
  font-size: 0.875rem;
  color: ${props => props.theme.colors.textSecondary};
  line-height: 1.625;
`;

const Badge = styled.span<{ $colorClass?: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  ${props => {
    const isDark = props.theme.mode === 'dark';
    if (props.$colorClass === 'revenue') {
      return `color: ${isDark ? '#34d399' : '#10b981'}; background-color: ${isDark ? '#064e3b' : '#f0fdf4'}; border: 1px solid ${isDark ? '#047857' : '#dcfce7'};`;
    }
    if (props.$colorClass === 'expense') {
      return `color: ${isDark ? '#fb7185' : '#f43f5e'}; background-color: ${isDark ? '#4c0519' : '#fff1f2'}; border: 1px solid ${isDark ? '#be123c' : '#fee2e2'};`;
    }
    if (props.$colorClass === 'banking') {
      return `color: ${isDark ? '#60a5fa' : '#3b82f6'}; background-color: ${isDark ? '#1e3a8a' : '#eff6ff'}; border: 1px solid ${isDark ? '#1d4ed8' : '#dbeafe'};`;
    }
    return `color: ${props.theme.colors.textSecondary}; background-color: ${props.theme.colors.muted}; border: 1px solid ${props.theme.colors.border};`;
  }}
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xxl};
`;

const StatCard = styled.div<{ $color: string }>`
  background: ${props => props.theme.colors.card};
  padding: 24px;
  border-radius: 24px;
  border: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  gap: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &:hover {
    transform: translateY(-5px);
    box-shadow: ${props => props.theme.shadows.md};
  }

  .icon {
    width: 52px;
    height: 52px;
    border-radius: 14px;
    background: ${props => props.$color}15;
    color: ${props => props.$color};
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .content {
    .label { font-size: 0.875rem; color: ${props => props.theme.colors.textSecondary}; font-weight: 600; }
    .value { font-size: 1.5rem; font-weight: 800; color: ${props => props.theme.colors.textDark}; }
  }
`;

const TableWrapper = styled(motion.div)`
  background: ${props => props.theme.colors.card};
  border-radius: 32px;
  border: 1px solid ${props => props.theme.colors.border};
  box-shadow: ${props => props.theme.shadows.sm};
  overflow: hidden;
`;

const EmptyState = styled.div`
  padding: 80px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  color: ${props => props.theme.colors.textSecondary};

  svg { color: #cbd5e1; }
  h3 { font-size: 1.25rem; font-weight: 700; color: ${props => props.theme.colors.textDark}; }
`;

export default function AccountMappingsPage() {
  const [mappings, setMappings] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [formData, setFormData] = useState({
    module: 'revenue',
    category: '',
    account_id: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [mappingsRes, accountsRes] = await Promise.all([
        apiClient.getAccountMappings(),
        apiClient.getAccountingAccounts()
      ]);
      setMappings(mappingsRes.data);
      setAccounts(accountsRes.data);
    } catch (error) {
      toast.error("Failed to load mappings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.createAccountMapping({
        module: formData.module,
        category: formData.category,
        account_id: parseInt(formData.account_id)
      });
      toast.success("Mapping saved successfully");
      setIsAdding(false);
      setFormData({ module: 'revenue', category: '', account_id: '' });
      loadData();
    } catch (error) {
      toast.error("Failed to save mapping");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this mapping?")) return;
    try {
      await apiClient.deleteAccountMapping(id);
      toast.success("Mapping deleted");
      loadData();
    } catch (error) {
      toast.error("Failed to delete mapping");
    }
  };

  const findAccount = (id: number) => accounts.find(a => a.id === id);

  const filteredMappings = mappings.filter(m => {
    const account = findAccount(m.account_id);
    const searchStr = `${m.module} ${m.category} ${account?.name || ''} ${account?.code || ''}`.toLowerCase();
    return searchStr.includes(searchQuery.toLowerCase());
  });

  const stats = {
    total: mappings.length,
    modules: new Set(mappings.map(m => m.module)).size,
    revenue: mappings.filter(m => m.module === 'revenue').length
  };

  return (
    <Layout>
      <PageWrapper>
        <ContentContainer>
          <Header style={{ marginBottom: '40px' }}>
            <HeaderContent>
              <Title>
                Account Mappings
              </Title>
              <Subtitle>Define dynamic routing rules between system events and the COA</Subtitle>
            </HeaderContent>
            <HeaderButton onClick={() => setIsAdding(!isAdding)}>
              {isAdding ? <X size={20} /> : <Plus size={20} />}
              {isAdding ? "Close Panel" : "New Rule"}
            </HeaderButton>
          </Header>

          {/* Stats Section */}
          <StatsGrid>
            <StatCard $color="#6366f1">
              <div className="icon"><Database size={24} /></div>
              <div className="content">
                <div className="label">Active Rules</div>
                <div className="value">{stats.total}</div>
              </div>
            </StatCard>
            <StatCard $color="#10b981">
              <div className="icon"><Shield size={24} /></div>
              <div className="content">
                <div className="label">Modules Covered</div>
                <div className="value">{stats.modules}</div>
              </div>
            </StatCard>
            <StatCard $color="#f59e0b">
              <div className="icon"><Zap size={24} /></div>
              <div className="content">
                <div className="label">Revenue Rules</div>
                <div className="value">{stats.revenue}</div>
              </div>
            </StatCard>
          </StatsGrid>

          <MainGrid>
            <MainContent>
              <ControlBar>
                <SearchWrapper style={{ flex: 1 }}>
                  <StyledSearchIcon size={18} />
                  <SearchInput
                    type="text"
                    placeholder="Filter by module, category, or account..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </SearchWrapper>
              </ControlBar>

              <TableWrapper layout>
                <Table>
                  <Thead>
                    <tr>
                      <Th>Source Module</Th>
                      <Th>Category / Key</Th>
                      <Th>Target Account</Th>
                      <Th style={{ width: '80px' }}></Th>
                    </tr>
                  </Thead>
                  <Tbody>
                    {loading ? (
                      <tr>
                        <Td colSpan={4} style={{ textAlign: 'center', padding: '100px' }}>
                          <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)', margin: '0 auto' }} />
                          <div style={{ marginTop: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>Syncing Mappings...</div>
                        </Td>
                      </tr>
                    ) : filteredMappings.length === 0 ? (
                      <tr>
                        <Td colSpan={4}>
                          <EmptyState>
                            <Database size={48} />
                            <h3>No Mappings Found</h3>
                            <p>Adjust your search or create a new mapping rule.</p>
                          </EmptyState>
                        </Td>
                      </tr>
                    ) : (
                      <AnimatePresence mode="popLayout">
                        {filteredMappings.map((m) => {
                          const account = findAccount(m.account_id);
                          return (
                            <Tr key={m.id} as={motion.tr} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} layout>
                              <Td>
                                <Badge $colorClass={m.module === 'revenue' ? 'revenue' : m.module === 'expense' ? 'expense' : 'banking'}>
                                  {m.module}
                                </Badge>
                              </Td>
                              <Td>
                                <div style={{ fontWeight: 700, color: 'var(--text-dark)' }}>{m.category}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Technical Key</div>
                              </Td>
                              <Td>
                                {account ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', background: 'var(--muted)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: 800, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                                      {account.code.substring(0, 2)}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 800, color: 'var(--text-dark)' }}>{account.name}</div>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{account.code}</div>
                                    </div>
                                  </div>
                                ) : (
                                  <span style={{ color: 'var(--error)', fontWeight: 700 }}>Orphaned ID: {m.account_id}</span>
                                )}
                              </Td>
                              <Td style={{ textAlign: 'right' }}>
                                <ActionButton onClick={() => handleDelete(m.id)}>
                                  <Trash2 size={18} />
                                </ActionButton>
                              </Td>
                            </Tr>
                          );
                        })}
                      </AnimatePresence>
                    )}
                  </Tbody>
                </Table>
              </TableWrapper>
            </MainContent>

            <SidePanel>
              <AnimatePresence>
                {isAdding && (
                  <CreatePanel
                    as={motion.div}
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 50, opacity: 0 }}
                    $isVisible={true}
                  >
                    <PanelHeader>
                      <div style={{ background: 'var(--primary-light)', padding: '10px', borderRadius: '12px' }}>
                        <Settings2 size={20} style={{ color: 'var(--primary)' }} />
                      </div>
                      <PanelTitle>Configure Rule</PanelTitle>
                    </PanelHeader>

                    <Form onSubmit={handleSubmit}>
                      <FormGroup>
                        <Label>Business Module</Label>
                        <Select
                          value={formData.module}
                          onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                        >
                          <option value="revenue">Revenue Recognition</option>
                          <option value="expense">Expense Categorization</option>
                          <option value="payroll">Payroll Control</option>
                          <option value="inventory">Inventory Asset/Shrinkage</option>
                          <option value="banking">Banking & Reconcile</option>
                        </Select>
                      </FormGroup>

                      <FormGroup>
                        <Label>Category / Unique Key</Label>
                        <Input
                          type="text"
                          placeholder="e.g. software_subs, tax_withholding"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          required
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>Target GL Account</Label>
                        <Select
                          value={formData.account_id}
                          onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                          required
                        >
                          <option value="">Select Account...</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                          ))}
                        </Select>
                      </FormGroup>

                      <SubmitButton type="submit">
                        <Save size={18} /> Commit Configuration
                      </SubmitButton>
                    </Form>
                  </CreatePanel>
                )}
              </AnimatePresence>

              {!isAdding && (
                <InfoPanel>
                  <IconCircle>
                    <LinkIcon style={{ color: 'var(--primary)' }} size={24} />
                  </IconCircle>
                  <InfoTitle>Smart Bridging</InfoTitle>
                  <InfoText>
                    Connect operational categories to specific ledger accounts to automate the "Gluing" logic across the platform.
                  </InfoText>
                  <div style={{ padding: '20px', background: 'var(--background-secondary)', borderRadius: '16px', textAlign: 'left', border: '1px dashed var(--border)' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }}></div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Automated Postings</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)' }}></div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Audit Trail Registry</span>
                    </div>
                  </div>
                </InfoPanel>
              )}
            </SidePanel>
          </MainGrid>
        </ContentContainer>
      </PageWrapper>
    </Layout>
  );
}
