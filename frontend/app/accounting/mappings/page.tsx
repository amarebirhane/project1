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
  color: #6b7280; /* text-gray-500 */
`;

const NewMappingButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #4f46e5; /* indigo-600 */
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem; /* rounded-xl */
  font-weight: 500; /* font-medium */
  transition: all 0.2s;
  box-shadow: 0 0 20px rgba(79, 70, 229, 0.3);
  border: none;
  cursor: pointer;

  &:hover {
    background-color: #6366f1; /* indigo-500 */
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
    color: #818cf8; /* indigo-400 */
  }
`;

const StyledSearchIcon = styled(Search)`
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280; /* text-gray-500 */
  transition: color 0.2s;
`;

const SearchInput = styled.input`
  width: 100%;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 1rem; /* rounded-2xl */
  padding: 1rem;
  padding-left: 3rem;
  padding-right: 1rem;
  color: inherit;
  backdrop-filter: blur(24px); /* backdrop-blur-xl */
  transition: all 0.2s;
  outline: none;

  &:focus {
    box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.5); /* ring-indigo-500/50 */
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const GlassPanel = styled.div`
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 24px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  text-align: left;
  border-collapse: collapse;
`;

const Thead = styled.thead`
  background-color: rgba(255, 255, 255, 0.05);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const Th = styled.th`
  padding: 1rem 1.5rem;
  font-size: 0.75rem; /* xs */
  font-weight: 600; /* font-semibold */
  text-transform: uppercase;
  letter-spacing: 0.05em; /* tracking-wider */
  color: #9ca3af; /* text-gray-400 */
`;

const Tbody = styled.tbody`
  & > tr:not(:last-child) {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
`;

const Tr = styled.tr`
  transition: background-color 0.2s;
  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

const Td = styled.td`
  padding: 1rem 1.5rem;
`;

const ActionButton = styled.button`
  padding: 0.5rem;
  color: #6b7280; /* text-gray-500 */
  border-radius: 0.5rem; /* rounded-lg */
  transition: all 0.2s;
  opacity: 0;
  border: none;
  background: transparent;
  cursor: pointer;

  ${Tr}:hover & {
    opacity: 1;
  }

  &:hover {
    color: #f43f5e; /* rose-500 */
    background-color: rgba(244, 63, 94, 0.1); /* bg-rose-500/10 */
  }
`;

const HeaderButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #4f46e5;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  font-weight: 700;
  transition: all 0.2s;
  box-shadow: 0 10px 20px -5px rgba(79, 70, 229, 0.4);
  border: none;
  cursor: pointer;

  &:hover {
    background-color: #6366f1;
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
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
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const Select = styled.select`
  width: 100%;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  color: #1e293b;
  outline: none;
  font-weight: 600;
  
  &:focus {
    border-color: #6366f1;
  }
`;

const Input = styled.input`
  width: 100%;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 0.75rem 1rem;
  color: #1e293b;
  outline: none;
  font-weight: 600;

  &:focus {
    border-color: #6366f1;
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border-radius: 0.75rem;
  font-weight: 700;
  color: white;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
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
  background-color: #f1f5f9;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
`;

const InfoTitle = styled.h3`
  font-weight: 700;
  font-size: 1.125rem;
`;

const InfoText = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.625;
`;

const Badge = styled.span<{ $colorClass?: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  ${props => props.$colorClass === 'revenue' && css`color: #10b981; background-color: #f0fdf4; border: 1px solid #dcfce7;`}
  ${props => props.$colorClass === 'expense' && css`color: #f43f5e; background-color: #fff1f2; border: 1px solid #fee2e2;`}
  ${props => props.$colorClass === 'banking' && css`color: #3b82f6; background-color: #eff6ff; border: 1px solid #dbeafe;`}
  ${props => !props.$colorClass && css`color: #64748b; background-color: #f8fafc; border: 1px solid #f1f5f9;`}
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
                    style={{ background: 'white', borderColor: '#e2e8f0', color: '#1e293b' }}
                  />
                </SearchWrapper>
              </ControlBar>

              <TableWrapper layout>
                <Table>
                  <Thead style={{ background: '#f8fafc' }}>
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
                          <Loader2 className="animate-spin" size={32} style={{ color: '#6366f1', margin: '0 auto' }} />
                          <div style={{ marginTop: '12px', color: '#64748b', fontWeight: 600 }}>Syncing Mappings...</div>
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
                                <div style={{ fontWeight: 700, color: '#1e293b' }}>{m.category}</div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Technical Key</div>
                              </Td>
                              <Td>
                                {account ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', background: '#f1f5f9', borderRadius: '10px', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', fontWeight: 800, color: '#64748b', fontSize: '0.875rem' }}>
                                      {account.code.substring(0, 2)}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 800, color: '#1e293b' }}>{account.name}</div>
                                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'monospace' }}>{account.code}</div>
                                    </div>
                                  </div>
                                ) : (
                                  <span style={{ color: '#ef4444', fontWeight: 700 }}>Orphaned ID: {m.account_id}</span>
                                )}
                              </Td>
                              <Td style={{ textAlign: 'right' }}>
                                <ActionButton onClick={() => handleDelete(m.id)} style={{ color: '#ef4444' }}>
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
                    style={{ position: 'relative', background: 'white', borderColor: '#e2e8f0', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
                  >
                    <PanelHeader style={{ borderColor: '#f1f5f9' }}>
                      <div style={{ background: '#e0e7ff', padding: '10px', borderRadius: '12px' }}>
                        <Settings2 size={20} style={{ color: '#6366f1' }} />
                      </div>
                      <PanelTitle style={{ color: '#1e293b' }}>Configure Rule</PanelTitle>
                    </PanelHeader>

                    <Form onSubmit={handleSubmit}>
                      <FormGroup>
                        <Label style={{ color: '#94a3b8' }}>Business Module</Label>
                        <Select
                          value={formData.module}
                          onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                          style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#1e293b' }}
                        >
                          <option value="revenue">Revenue Recognition</option>
                          <option value="expense">Expense Categorization</option>
                          <option value="payroll">Payroll Control</option>
                          <option value="inventory">Inventory Asset/Shrinkage</option>
                          <option value="banking">Banking & Reconcile</option>
                        </Select>
                      </FormGroup>

                      <FormGroup>
                        <Label style={{ color: '#94a3b8' }}>Category / Unique Key</Label>
                        <Input
                          type="text"
                          placeholder="e.g. software_subs, tax_withholding"
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          required
                          style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#1e293b' }}
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label style={{ color: '#94a3b8' }}>Target GL Account</Label>
                        <Select
                          value={formData.account_id}
                          onChange={(e) => setFormData({ ...formData, account_id: e.target.value })}
                          required
                          style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#1e293b' }}
                        >
                          <option value="">Select Account...</option>
                          {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                          ))}
                        </Select>
                      </FormGroup>

                      <SubmitButton type="submit" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)', height: '56px', borderRadius: '16px' }}>
                        <Save size={18} /> Commit Configuration
                      </SubmitButton>
                    </Form>
                  </CreatePanel>
                )}
              </AnimatePresence>

              {!isAdding && (
                <InfoPanel style={{ background: 'white', borderColor: '#e2e8f0' }}>
                  <IconCircle style={{ background: '#f1f5f9' }}>
                    <LinkIcon style={{ color: '#6366f1' }} size={24} />
                  </IconCircle>
                  <InfoTitle style={{ color: '#1e293b' }}>Smart Bridging</InfoTitle>
                  <InfoText>
                    Connect operational categories to specific ledger accounts to automate the "Gluing" logic across the platform.
                  </InfoText>
                  <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px', textAlign: 'left', border: '1px dashed #e2e8f0' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }}></div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Automated Postings</span>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>Audit Trail Registry</span>
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
