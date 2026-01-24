"use client";

import { Plus, FileText, CheckCircle, XCircle, RotateCcw, Search, Filter, Calendar, User, ArrowRightLeft, DollarSign, Activity, ListChecks, ArrowUpRight, ArrowDownRight, Trash2, Edit, X } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import Layout from "@/components/layout";
import styled, { css, keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { useState, useEffect, Suspense } from "react";

interface JournalEntryLine {
    id: number;
    account: {
        id: number;
        code: string;
        name: string;
    };
    debit_amount: number;
    credit_amount: number;
    description?: string;
}

interface JournalEntry {
    id: number;
    entry_number: string;
    entry_date: string;
    description: string;
    reference_type: string;
    reference_id?: number;
    status: "DRAFT" | "POSTED" | "REVERSED";
    lines: JournalEntryLine[];
    created_by: {
        full_name: string;
    };
    posted_at?: string;
    posted_by?: {
        full_name: string;
    };
}

interface Account {
    id: number;
    name: string;
    code: string;
}

// --- Animations ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

// --- Styled Components ---

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

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xxl};
  animation: ${fadeIn} 0.5s ease-out;
`;

const TitleSection = styled.div`
  h1 {
    font-size: 2.5rem;
    font-weight: 800;
    color: ${props => props.theme.colors.textDark};
    letter-spacing: -1px;
    margin-bottom: 4px;
  }
  p {
    color: ${props => props.theme.colors.textSecondary};
    font-size: 1.1rem;
  }
`;

const HeaderButton = styled.button`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  padding: 14px 28px;
  border-radius: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 10px 20px -5px rgba(16, 185, 129, 0.3);

  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 20px 25px -5px rgba(16, 185, 129, 0.4);
  }

  &:active { transform: translateY(1px); }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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
  transition: all 0.3s;

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

const ControlBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: ${props => props.theme.spacing.xl};

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  gap: 8px;
  background: ${props => props.theme.colors.card};
  padding: 6px;
  border-radius: 14px;
  border: 1px solid ${props => props.theme.colors.border};
`;

const FilterButton = styled.button<{ $active: boolean; $color: string }>`
  padding: 8px 16px;
  border-radius: 10px;
  font-size: 0.875rem;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.2s;

  ${props => props.$active ? css`
    background: ${props.$color};
    color: white;
    box-shadow: 0 4px 12px ${props.$color}30;
  ` : css`
    background: transparent;
    color: ${props => props.theme.colors.textSecondary};
    &:hover { background: #f1f5f9; color: ${props => props.theme.colors.textDark}; }
  `}
`;

const EntryCard = styled(motion.div)`
  background: ${props => props.theme.colors.card};
  border-radius: 24px;
  border: 1px solid ${props => props.theme.colors.border};
  margin-bottom: 20px;
  overflow: hidden;
  transition: border-color 0.2s;

  &:hover { border-color: #10b981; }
`;

const EntryHeader = styled.div`
  padding: 24px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) { flex-direction: column; align-items: flex-start; gap: 16px; }
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  
  ${props => props.$status === 'POSTED' ? css`
    background: #dcfce7; color: #166534;
  ` : props.$status === 'DRAFT' ? css`
    background: #fefce8; color: #854d0e;
  ` : css`
    background: #fee2e2; color: #991b1b;
  `}
`;

const DetailTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th {
    background: #f8fafc;
    padding: 12px 24px;
    text-align: left;
    font-size: 0.75rem;
    font-weight: 800;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    border-bottom: 1px solid #e2e8f0;
  }

  td {
    padding: 16px 24px;
    border-bottom: 1px solid #f1f5f9;
    font-size: 0.875rem;
  }

  .account-cell {
    .code { font-family: monospace; font-weight: 700; color: #1e293b; }
    .name { color: #64748b; font-size: 0.75rem; font-weight: 600; }
  }

  .amount { font-weight: 800; color: #1e293b; }
`;

// --- Modal Styled Components ---

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
`;

const ModalContent = styled(motion.div)`
  background: ${props => props.theme.colors.card};
  width: 100%;
  max-width: 1000px;
  max-height: 90vh;
  border-radius: 32px;
  padding: 40px;
  box-shadow: 0 40px 100px -20px rgba(0,0,0,0.3);
  border: 1px solid ${props => props.theme.colors.border};
  overflow-y: auto;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 8px;
  }
  input, select, textarea {
    width: 100%;
    padding: 14px 18px;
    background: #f8fafc;
    border: 2px solid transparent;
    border-radius: 16px;
    font-weight: 600;
    transition: all 0.2s;
    &:focus { outline: none; border-color: #10b981; background: white; }
  }
`;

const LinesSection = styled.div`
    margin-top: 32px;
    h3 { font-size: 1.25rem; font-weight: 800; color: #1e293b; margin-bottom: 20px; }
`;

const LineRow = styled.div`
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 2fr 48px;
    gap: 12px;
    margin-bottom: 12px;
    align-items: flex-start;
`;

const BalanceBanner = styled.div<{ $balanced: boolean }>`
    padding: 16px 24px;
    border-radius: 16px;
    margin-top: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 700;
    
    ${props => props.$balanced ? css`
        background: #dcfce7; color: #166534;
    ` : css`
        background: #fee2e2; color: #991b1b;
    `}
`;

const ActionButton = styled.button<{ $variant: 'primary' | 'secondary' | 'danger' | 'ghost' }>`
    padding: 10px 20px;
    border-radius: 12px;
    font-weight: 700;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    display: flex;
    align-items: center;
    gap: 8px;

    ${props => props.$variant === 'primary' ? css`
        background: #10b981; color: white;
        &:hover { background: #059669; }
    ` : props.$variant === 'secondary' ? css`
        background: #1e293b; color: white;
        &:hover { background: #0f172a; }
    ` : props.$variant === 'danger' ? css`
        background: #fee2e2; color: #dc2626;
        &:hover { background: #fecaca; }
    ` : css`
        background: transparent; color: #64748b;
        &:hover { background: #f1f5f9; color: #1e293b; }
    `}
    
    &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

function JournalEntriesContent() {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
    const [expandedEntry, setExpandedEntry] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const { register, control, handleSubmit, reset, watch, setValue } = useForm({
        defaultValues: {
            entry_date: new Date().toISOString().split('T')[0],
            description: "",
            reference_type: "MANUAL",
            lines: [{ account_id: "", debit_amount: 0, credit_amount: 0, description: "" }]
        }
    });

    const { fields, append, remove } = useFieldArray({ control, name: "lines" });
    const watchedLines = watch("lines");

    const statuses = [
        { value: "ALL", label: "All Entries", color: "#64748b" },
        { value: "DRAFT", label: "Draft", color: "#f59e0b" },
        { value: "POSTED", label: "Posted", color: "#10b981" },
        { value: "REVERSED", label: "Reversed", color: "#ef4444" },
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [entriesRes, accountsRes] = await Promise.all([
                apiClient.getAccountingJournalEntries(),
                apiClient.getAccountingAccounts()
            ]);
            if (entriesRes.data) setEntries(entriesRes.data);
            if (accountsRes.data) setAccounts(accountsRes.data);
        } catch (error) {
            console.error("Failed to fetch journal data:", error);
            toast.error("Failed to load journal entries");
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (data: any) => {
        try {
            setSubmitting(true);
            const payload = {
                ...data,
                entry_date: new Date(data.entry_date).toISOString(),
                lines: data.lines.map((l: any) => ({
                    ...l,
                    account_id: parseInt(l.account_id),
                    debit_amount: parseFloat(l.debit_amount || 0),
                    credit_amount: parseFloat(l.credit_amount || 0)
                }))
            };

            if (editingEntry) {
                await apiClient.updateAccountingJournalEntry(editingEntry.id, payload);
                toast.success("Entry updated successfully");
            } else {
                await apiClient.createAccountingJournalEntry(payload);
                toast.success("Entry created successfully");
            }
            setIsModalOpen(false);
            setEditingEntry(null);
            reset();
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to save entry");
        } finally {
            setSubmitting(false);
        }
    };

    const handlePostEntry = async (entryId: number) => {
        try {
            await apiClient.postAccountingJournalEntry(entryId);
            toast.success("Entry posted to ledger");
            fetchData();
        } catch (error: any) {
            toast.error("Failed to post entry");
        }
    };

    const handleReverseEntry = async (entryId: number) => {
        if (!confirm("Are you sure you want to reverse this entry? This will create a counter-balancing entry.")) return;
        try {
            await apiClient.reverseAccountingJournalEntry(entryId);
            toast.success("Entry reversed");
            fetchData();
        } catch (error: any) {
            toast.error("Failed to reverse entry");
        }
    };

    const handleDeleteEntry = async (entryId: number) => {
        if (!confirm("Delete this draft entry?")) return;
        try {
            await apiClient.deleteAccountingJournalEntry(entryId);
            toast.success("Entry deleted");
            fetchData();
        } catch (error: any) {
            toast.error("Delete failed");
        }
    };

    const openEditModal = (entry: JournalEntry) => {
        setEditingEntry(entry);
        setValue("entry_date", entry.entry_date.split('T')[0]);
        setValue("description", entry.description);
        setValue("reference_type", entry.reference_type as any);
        setValue("lines", entry.lines.map(l => ({
            account_id: l.account.id.toString(),
            debit_amount: l.debit_amount,
            credit_amount: l.credit_amount,
            description: l.description || ""
        })) as any);
        setIsModalOpen(true);
    };

    const filteredEntries = selectedStatus === "ALL"
        ? entries
        : entries.filter(entry => entry.status === selectedStatus);

    const getTotalDebits = (lines: any[]) => lines.reduce((sum, line) => sum + parseFloat(line.debit_amount || 0), 0);
    const getTotalCredits = (lines: any[]) => lines.reduce((sum, line) => sum + parseFloat(line.credit_amount || 0), 0);
    const isBalanced = (lines: any[]) => Math.abs(getTotalDebits(lines) - getTotalCredits(lines)) < 0.01;

    const stats = {
        totalDraft: entries.filter(e => e.status === 'DRAFT').length,
        totalPosted: entries.filter(e => e.status === 'POSTED').length,
        totalValue: entries.filter(e => e.status === 'POSTED').reduce((sum, e) => sum + getTotalDebits(e.lines), 0)
    };

    return (
        <Layout>
            <PageWrapper>
                <ContentContainer>
                    {/* Header */}
                    <Header>
                        <TitleSection>
                            <h1>Journal Entries</h1>
                            <p>Double-entry bookkeeping and ledger management</p>
                        </TitleSection>
                        <HeaderButton onClick={() => { setEditingEntry(null); reset(); setIsModalOpen(true); }}>
                            <Plus size={20} />
                            Manual Entry
                        </HeaderButton>
                    </Header>

                    {/* Stats */}
                    <StatsGrid>
                        <StatCard $color="#f59e0b">
                            <div className="icon"><FileText size={24} /></div>
                            <div className="content">
                                <div className="label">Open Drafts</div>
                                <div className="value">{stats.totalDraft}</div>
                            </div>
                        </StatCard>
                        <StatCard $color="#10b981">
                            <div className="icon"><ListChecks size={24} /></div>
                            <div className="content">
                                <div className="label">Posted Entries</div>
                                <div className="value">{stats.totalPosted}</div>
                            </div>
                        </StatCard>
                        <StatCard $color="#2563eb">
                            <div className="icon"><Activity size={24} /></div>
                            <div className="content">
                                <div className="label">Ledger Throughput</div>
                                <div className="value">${stats.totalValue.toLocaleString()}</div>
                            </div>
                        </StatCard>
                    </StatsGrid>

                    {/* Controls */}
                    <ControlBar>
                        <FilterGroup>
                            {statuses.map((s) => (
                                <FilterButton
                                    key={s.value}
                                    $active={selectedStatus === s.value}
                                    $color={s.color}
                                    onClick={() => setSelectedStatus(s.value)}
                                >
                                    {s.label}
                                </FilterButton>
                            ))}
                        </FilterGroup>
                    </ControlBar>

                    {/* Entry List */}
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <AnimatePresence mode="popLayout">
                                {filteredEntries.length === 0 ? (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '80px', background: 'white', borderRadius: '32px', border: '1px solid #e2e8f0' }}>
                                        <FileText size={64} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
                                        <p style={{ color: '#64748b', fontWeight: 600 }}>No journal entries found</p>
                                    </motion.div>
                                ) : (
                                    filteredEntries.map((entry) => (
                                        <EntryCard key={entry.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                            <EntryHeader onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}>
                                                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                                    <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '14px' }}>
                                                        <ArrowRightLeft size={24} style={{ color: '#64748b' }} />
                                                    </div>
                                                    <div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                                                            <span style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem', fontFamily: 'monospace' }}>{entry.entry_number}</span>
                                                            <StatusBadge $status={entry.status}>{entry.status}</StatusBadge>
                                                            {!isBalanced(entry.lines) && <XCircle size={18} style={{ color: '#ef4444' }} />}
                                                        </div>
                                                        <div style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>{entry.description}</div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Date</div>
                                                        <div style={{ fontWeight: 700, color: '#1e293b' }}>{new Date(entry.entry_date).toLocaleDateString()}</div>
                                                    </div>
                                                    <div style={{ textAlign: 'right', minWidth: '120px' }}>
                                                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>Total Debit</div>
                                                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b' }}>${getTotalDebits(entry.lines).toLocaleString()}</div>
                                                    </div>
                                                </div>
                                            </EntryHeader>

                                            <AnimatePresence>
                                                {expandedEntry === entry.id && (
                                                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} style={{ overflow: 'hidden', background: '#fcfdfe' }}>
                                                        <DetailTable>
                                                            <thead>
                                                                <tr>
                                                                    <th>Account</th>
                                                                    <th>Line Description</th>
                                                                    <th style={{ textAlign: 'right' }}>Debit</th>
                                                                    <th style={{ textAlign: 'right' }}>Credit</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {entry.lines.map((line, idx) => (
                                                                    <tr key={idx}>
                                                                        <td className="account-cell">
                                                                            <div className="code">{line.account.code}</div>
                                                                            <div className="name">{line.account.name}</div>
                                                                        </td>
                                                                        <td style={{ color: '#64748b' }}>{line.description || "—"}</td>
                                                                        <td style={{ textAlign: 'right' }} className="amount">
                                                                            {line.debit_amount > 0 ? `$${line.debit_amount.toLocaleString()}` : <span style={{ color: '#cbd5e1' }}>—</span>}
                                                                        </td>
                                                                        <td style={{ textAlign: 'right' }} className="amount">
                                                                            {line.credit_amount > 0 ? `$${line.credit_amount.toLocaleString()}` : <span style={{ color: '#cbd5e1' }}>—</span>}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                <tr style={{ background: '#f8fafc', fontWeight: 900 }}>
                                                                    <td colSpan={2} style={{ textAlign: 'right', color: '#64748b' }}>Totals</td>
                                                                    <td style={{ textAlign: 'right' }}>${getTotalDebits(entry.lines).toLocaleString()}</td>
                                                                    <td style={{ textAlign: 'right' }}>${getTotalCredits(entry.lines).toLocaleString()}</td>
                                                                </tr>
                                                            </tbody>
                                                        </DetailTable>

                                                        <div style={{ padding: '24px', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #f1f5f9' }}>
                                                            {entry.status === 'DRAFT' && (
                                                                <>
                                                                    <ActionButton $variant="primary" onClick={() => handlePostEntry(entry.id)}>
                                                                        <CheckCircle size={16} />
                                                                        Post to Ledger
                                                                    </ActionButton>
                                                                    <ActionButton $variant="secondary" onClick={() => openEditModal(entry)}>
                                                                        <Edit size={16} />
                                                                        Edit Draft
                                                                    </ActionButton>
                                                                    <ActionButton $variant="danger" onClick={() => handleDeleteEntry(entry.id)}>
                                                                        <Trash2 size={16} />
                                                                    </ActionButton>
                                                                </>
                                                            )}
                                                            {entry.status === 'POSTED' && (
                                                                <ActionButton $variant="danger" onClick={() => handleReverseEntry(entry.id)}>
                                                                    <RotateCcw size={16} />
                                                                    Reverse Entry
                                                                </ActionButton>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </EntryCard>
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </ContentContainer>
            </PageWrapper>

            {/* Manual Entry Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <ModalContent initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b' }}>{editingEntry ? 'Edit Manual Entry' : 'New Manual Entry'}</h2>
                                <ActionButton $variant="ghost" onClick={() => setIsModalOpen(false)}><X size={24} /></ActionButton>
                            </div>

                            <form onSubmit={handleSubmit(handleFormSubmit)}>
                                <FormRow>
                                    <FormGroup>
                                        <label>Description</label>
                                        <input {...register("description", { required: true })} placeholder="Summary of entry..." />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Date</label>
                                        <input type="date" {...register("entry_date", { required: true })} />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Reference</label>
                                        <select {...register("reference_type")}>
                                            <option value="MANUAL">Manual</option>
                                            <option value="ADJUSTMENT">Adjustment</option>
                                            <option value="CLOSING">Closing</option>
                                        </select>
                                    </FormGroup>
                                </FormRow>

                                <LinesSection>
                                    <h3>Entry Lines</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 2fr 48px', gap: '12px', padding: '0 0 10px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>
                                        <div>Account</div>
                                        <div>Debit</div>
                                        <div>Credit</div>
                                        <div>Line Description</div>
                                        <div></div>
                                    </div>
                                    {fields.map((field, index) => (
                                        <LineRow key={field.id}>
                                            <select {...register(`lines.${index}.account_id` as const, { required: true })} style={{ padding: '12px', background: '#f8fafc', border: 'none', borderRadius: '12px', fontWeight: 600 }}>
                                                <option value="">Select Account</option>
                                                {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                                            </select>
                                            <input type="number" step="0.01" {...register(`lines.${index}.debit_amount` as const)} placeholder="0.00" style={{ padding: '12px', background: '#f8fafc', border: 'none', borderRadius: '12px', fontWeight: 600 }} />
                                            <input type="number" step="0.01" {...register(`lines.${index}.credit_amount` as const)} placeholder="0.00" style={{ padding: '12px', background: '#f8fafc', border: 'none', borderRadius: '12px', fontWeight: 600 }} />
                                            <input {...register(`lines.${index}.description` as const)} placeholder="Optional line info" style={{ padding: '12px', background: '#f8fafc', border: 'none', borderRadius: '12px', fontWeight: 600 }} />
                                            <ActionButton $variant="danger" type="button" onClick={() => remove(index)} style={{ padding: '12px' }}>
                                                <Trash2 size={18} />
                                            </ActionButton>
                                        </LineRow>
                                    ))}
                                    <ActionButton $variant="ghost" type="button" onClick={() => append({ account_id: "", debit_amount: 0, credit_amount: 0, description: "" })} style={{ marginTop: '12px' }}>
                                        <Plus size={18} /> Add Line
                                    </ActionButton>
                                </LinesSection>

                                <BalanceBanner $balanced={isBalanced(watchedLines)}>
                                    <div style={{ display: 'flex', gap: '32px' }}>
                                        <div>Debits: ${getTotalDebits(watchedLines).toLocaleString()}</div>
                                        <div>Credits: ${getTotalCredits(watchedLines).toLocaleString()}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {isBalanced(watchedLines) ? <CheckCircle size={20} /> : <XCircle size={20} />}
                                        {isBalanced(watchedLines) ? "Balanced" : "Out of Balance"}
                                    </div>
                                </BalanceBanner>

                                <div style={{ marginTop: '40px', display: 'flex', gap: '12px' }}>
                                    <HeaderButton type="submit" disabled={submitting || !isBalanced(watchedLines)} style={{ flex: 1, justifyContent: 'center' }}>
                                        {submitting ? 'Saving...' : editingEntry ? 'Update Entry' : 'Create Entry'}
                                    </HeaderButton>
                                    <ActionButton $variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>Cancel</ActionButton>
                                </div>
                            </form>
                        </ModalContent>
                    </ModalOverlay>
                )}
            </AnimatePresence>
        </Layout>
    );
}

export default function JournalEntriesPage() {
    return (
        <Suspense fallback={<div>Loading Journal Entries...</div>}>
            <JournalEntriesContent />
        </Suspense>
    );
}
