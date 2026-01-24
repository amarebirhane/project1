// app/accounting/taxes/page.tsx
"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Edit,
    Trash2,
    Receipt,
    Percent,
    X,
    Search,
    TrendingUp,
    DollarSign
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import Layout from "@/components/layout";
import styled, { keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";

interface TaxType {
    id: number;
    code: string;
    name: string;
    description?: string;
    is_active: boolean;
}

interface TaxRate {
    id: number;
    tax_type: TaxType;
    name: string;
    rate_percentage: number;
    jurisdiction?: string;
    effective_from: string;
    effective_to?: string;
    is_default: boolean;
    is_active: boolean;
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

const ActionButtonGroup = styled.div`
  display: flex;
  gap: 12px;
`;

const HeaderButton = styled.button<{ $variant?: 'primary' | 'secondary' }>`
  background: ${props => props.$variant === 'secondary' ? props.theme.colors.card : 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)'};
  color: ${props => props.$variant === 'secondary' ? props.theme.colors.textDark : 'white'};
  padding: 14px 28px;
  border-radius: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 12px;
  border: ${props => props.$variant === 'secondary' ? `1px solid ${props.theme.colors.border}` : 'none'};
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${props => props.$variant === 'secondary' ? 'none' : '0 10px 20px -5px rgba(147, 51, 234, 0.3)'};

  &:hover {
    transform: translateY(-2px);
    box-shadow: ${props => props.$variant === 'secondary' ? props.theme.shadows.md : '0 15px 25px -5px rgba(147, 51, 234, 0.4)'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 32px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  margin-bottom: 32px;
`;

const TabButton = styled.button<{ $active: boolean }>`
  padding-bottom: 16px;
  font-size: 0.875rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 1px;
  border: none;
  background: transparent;
  cursor: pointer;
  position: relative;
  color: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.textSecondary};
  transition: color 0.2s;

  &::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => props.theme.colors.primary};
    border-radius: 3px;
    transform: scaleX(${props => props.$active ? 1 : 0});
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const StatCard = styled(motion.div) <{ $color: string }>`
  background: ${props => props.theme.colors.card};
  padding: 32px;
  border-radius: 32px;
  border: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  gap: 24px;

  .icon {
    width: 64px;
    height: 64px;
    border-radius: 20px;
    background: ${props => props.$color}15;
    color: ${props => props.$color};
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .content {
    .label { font-size: 0.875rem; color: ${props => props.theme.colors.textSecondary}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .value { font-size: 2rem; font-weight: 900; color: ${props => props.theme.colors.textDark}; }
    .sub { font-size: 0.875rem; color: #10b981; font-weight: 700; margin-top: 4px; display: flex; align-items: center; gap: 4px; }
  }
`;

const GlassPanel = styled(motion.div)`
  background: ${props => props.theme.colors.card};
  border-radius: 32px;
  border: 1px solid ${props => props.theme.colors.border};
  overflow: hidden;
  box-shadow: ${props => props.theme.shadows.sm};
`;

const PanelHeader = styled.div`
  padding: 24px 32px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SearchInputContainer = styled.div`
  position: relative;
  width: 100%;
  max-width: 400px;
  
  input {
    width: 100%;
    padding: 12px 16px 12px 48px;
    background: ${props => props.theme.colors.muted};
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: 14px;
    font-weight: 600;
    color: ${props => props.theme.colors.textDark};
    transition: all 0.2s;

    &:focus { outline: none; border-color: ${props => props.theme.colors.primary}; background: ${props => props.theme.colors.card}; }
  }

  svg { position: absolute; left: 16px; top: 12px; color: ${props => props.theme.colors.textSecondary}; }
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-flex;
  align-items: center;
  background: ${props => props.$status === 'true' || props.$status === 'active' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  color: ${props => props.$status === 'true' || props.$status === 'active' ? '#10b981' : '#ef4444'};
  border: 1px solid ${props => props.$status === 'true' || props.$status === 'active' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
`;

const ModernTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th {
    text-align: left;
    padding: 16px 32px;
    font-size: 0.75rem;
    font-weight: 800;
    color: ${props => props.theme.colors.textSecondary};
    text-transform: uppercase;
    letter-spacing: 1px;
    background: ${props => props.theme.colors.backgroundSecondary};
  }

  td {
    padding: 20px 32px;
    border-bottom: 1px solid ${props => props.theme.colors.border};
    font-weight: 600;
    color: ${props => props.theme.colors.textDark};
  }

  tr:last-child td { border-bottom: none; }
  
  tr:hover td {
    background: ${props => props.theme.colors.muted}50;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.25rem;
  font-weight: 800;
  color: ${props => props.theme.colors.textDark};
`;

const HelperText = styled.span`
  color: ${props => props.theme.colors.textSecondary};
  font-weight: 700;
  font-size: 0.875rem;
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
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
  max-width: 600px;
  border-radius: 32px;
  padding: 40px;
  position: relative;
  border: 1px solid ${props => props.theme.colors.border};
  max-height: 90vh;
  overflow-y: auto;
`;

const FormGroup = styled.div`
  margin-bottom: 24px;
  label { display: block; font-size: 0.875rem; font-weight: 700; color: ${props => props.theme.colors.textDark}; margin-bottom: 8px; }
  input, select, textarea {
    width: 100%;
    padding: 14px 18px;
    background: ${props => props.theme.colors.muted};
    border: 2px solid transparent;
    border-radius: 16px;
    font-weight: 600;
    color: ${props => props.theme.colors.textDark};
    &:focus { outline: none; border-color: ${props => props.theme.colors.primary}; background: ${props => props.theme.colors.card}; }
  }

  textarea {
    min-height: 100px;
    resize: vertical;
    font-family: inherit;
  }

  select option {
    background: ${props => props.theme.colors.card};
    color: ${props => props.theme.colors.textDark};
  }
`;

const IconButton = styled.button`
  padding: 8px;
  border-radius: 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all 0.2s;
  color: ${props => props.theme.colors.textSecondary};

  &:hover {
    background: ${props => props.theme.colors.muted};
    color: ${props => props.theme.colors.textDark};
  }

  &.edit:hover {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  &.delete:hover {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }
`;

export default function TaxConfigurationPage() {
    const [taxTypes, setTaxTypes] = useState<TaxType[]>([]);
    const [taxRates, setTaxRates] = useState<TaxRate[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<"types" | "rates">("types");
    const [searchQuery, setSearchQuery] = useState("");

    // Modals
    const [isTaxTypeModalOpen, setIsTaxTypeModalOpen] = useState(false);
    const [isTaxRateModalOpen, setIsTaxRateModalOpen] = useState(false);
    const [editingTaxType, setEditingTaxType] = useState<TaxType | null>(null);
    const [editingTaxRate, setEditingTaxRate] = useState<TaxRate | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [typesRes, ratesRes] = await Promise.all([
                apiClient.getTaxTypes(),
                apiClient.getTaxRates()
            ]);
            if (typesRes.data) setTaxTypes(typesRes.data);
            if (ratesRes.data) setTaxRates(ratesRes.data);
        } catch (error) {
            console.error("Failed to fetch tax data:", error);
            toast.error("Failed to load tax configuration");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTaxType = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            await apiClient.createTaxType({
                code: formData.get("code") as string,
                name: formData.get("name") as string,
                description: formData.get("description") as string || undefined,
                is_active: formData.get("is_active") === "true",
            });
            toast.success("Tax type created successfully");
            setIsTaxTypeModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.detail || "Failed to create tax type");
        }
    };

    const handleUpdateTaxType = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingTaxType) return;
        const formData = new FormData(e.currentTarget);
        try {
            await apiClient.put(`/accounting/taxes/types/${editingTaxType.id}`, {
                code: formData.get("code") as string,
                name: formData.get("name") as string,
                description: formData.get("description") as string || undefined,
                is_active: formData.get("is_active") === "true",
            });
            toast.success("Tax type updated successfully");
            setEditingTaxType(null);
            setIsTaxTypeModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.detail || "Failed to update tax type");
        }
    };

    const handleDeleteTaxType = async (id: number) => {
        if (!confirm("Are you sure you want to delete this tax type? This will fail if tax rates are linked to it.")) return;
        try {
            await apiClient.delete(`/accounting/taxes/types/${id}`);
            toast.success("Tax type deleted successfully");
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.detail || "Failed to delete tax type");
        }
    };

    const handleCreateTaxRate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
            await apiClient.createTaxRate({
                tax_type_id: parseInt(formData.get("tax_type_id") as string),
                name: formData.get("name") as string,
                rate_percentage: parseFloat(formData.get("rate_percentage") as string),
                jurisdiction: formData.get("jurisdiction") as string || undefined,
                effective_from: formData.get("effective_from") as string,
                effective_to: formData.get("effective_to") as string || undefined,
                is_default: formData.get("is_default") === "true",
                is_active: formData.get("is_active") === "true",
            });
            toast.success("Tax rate created successfully");
            setIsTaxRateModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.detail || "Failed to create tax rate");
        }
    };

    const handleUpdateTaxRate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!editingTaxRate) return;
        const formData = new FormData(e.currentTarget);
        try {
            await apiClient.put(`/accounting/taxes/rates/${editingTaxRate.id}`, {
                tax_type_id: parseInt(formData.get("tax_type_id") as string),
                name: formData.get("name") as string,
                rate_percentage: parseFloat(formData.get("rate_percentage") as string),
                jurisdiction: formData.get("jurisdiction") as string || undefined,
                effective_from: formData.get("effective_from") as string,
                effective_to: formData.get("effective_to") as string || undefined,
                is_default: formData.get("is_default") === "true",
                is_active: formData.get("is_active") === "true",
            });
            toast.success("Tax rate updated successfully");
            setEditingTaxRate(null);
            setIsTaxRateModalOpen(false);
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.detail || "Failed to update tax rate");
        }
    };

    const handleDeleteTaxRate = async (id: number) => {
        if (!confirm("Are you sure you want to delete this tax rate?")) return;
        try {
            await apiClient.delete(`/accounting/taxes/rates/${id}`);
            toast.success("Tax rate deleted successfully");
            fetchData();
        } catch (error: any) {
            toast.error(error?.response?.data?.detail || "Failed to delete tax rate");
        }
    };

    const openTaxTypeModal = (taxType?: TaxType) => {
        setEditingTaxType(taxType || null);
        setIsTaxTypeModalOpen(true);
    };

    const openTaxRateModal = (taxRate?: TaxRate) => {
        setEditingTaxRate(taxRate || null);
        setIsTaxRateModalOpen(true);
    };

    const filteredTaxTypes = taxTypes.filter(type =>
        type.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        type.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredTaxRates = taxRates.filter(rate =>
        rate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rate.tax_type.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const stats = {
        totalTypes: taxTypes.length,
        activeTypes: taxTypes.filter(t => t.is_active).length,
        totalRates: taxRates.length,
        activeRates: taxRates.filter(r => r.is_active).length,
    };

    return (
        <Layout>
            <PageWrapper>
                <ContentContainer>
                    <Header>
                        <TitleSection>
                            <h1>Tax Configuration</h1>
                            <p>Configure tax types and rates for automatic calculations</p>
                        </TitleSection>
                        <ActionButtonGroup>
                            <HeaderButton onClick={() => openTaxTypeModal()}>
                                <Plus size={20} /> Add Tax Type
                            </HeaderButton>
                            <HeaderButton onClick={() => openTaxRateModal()}>
                                <Plus size={20} /> Add Tax Rate
                            </HeaderButton>
                        </ActionButtonGroup>
                    </Header>

                    <TabsContainer>
                        {["types", "rates"].map((tab) => (
                            <TabButton
                                key={tab}
                                $active={activeTab === tab}
                                onClick={() => setActiveTab(tab as any)}
                            >
                                {tab === "types" ? <><Receipt size={16} style={{ display: 'inline', marginRight: '8px' }} /> Tax Types</> : <><Percent size={16} style={{ display: 'inline', marginRight: '8px' }} /> Tax Rates</>}
                            </TabButton>
                        ))}
                    </TabsContainer>

                    {/* Stats */}
                    <StatsGrid>
                        <StatCard $color="#9333ea" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                            <div className="icon"><Receipt size={32} /></div>
                            <div className="content">
                                <div className="label">Tax Types</div>
                                <div className="value">{stats.totalTypes}</div>
                                <div className="sub"><TrendingUp size={14} /> {stats.activeTypes} Active</div>
                            </div>
                        </StatCard>
                        <StatCard $color="#10b981" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
                            <div className="icon"><Percent size={32} /></div>
                            <div className="content">
                                <div className="label">Tax Rates</div>
                                <div className="value">{stats.totalRates}</div>
                                <div className="sub">{stats.activeRates} Active</div>
                            </div>
                        </StatCard>
                    </StatsGrid>

                    {/* Tax Types Tab */}
                    {activeTab === "types" && (
                        <GlassPanel initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <PanelHeader>
                                <SearchInputContainer>
                                    <Search size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search tax types..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </SearchInputContainer>
                                <HelperText>{filteredTaxTypes.length} Results</HelperText>
                            </PanelHeader>
                            <ModernTable>
                                <thead>
                                    <tr>
                                        <th>Code</th>
                                        <th>Tax Type</th>
                                        <th>Description</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTaxTypes.length === 0 ? (
                                        <tr><td colSpan={5} style={{ textAlign: 'center', padding: '100px', color: '#64748b' }}>No tax types configured</td></tr>
                                    ) : (
                                        filteredTaxTypes.map((type) => (
                                            <tr key={type.id}>
                                                <td style={{ fontWeight: 800, fontFamily: 'monospace' }}>{type.code}</td>
                                                <td style={{ fontWeight: 700 }}>{type.name}</td>
                                                <td style={{ color: '#64748b' }}>{type.description || "—"}</td>
                                                <td><StatusBadge $status={type.is_active.toString()}>{type.is_active ? "Active" : "Inactive"}</StatusBadge></td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <IconButton className="edit" onClick={() => openTaxTypeModal(type)}><Edit size={16} /></IconButton>
                                                        <IconButton className="delete" onClick={() => handleDeleteTaxType(type.id)}><Trash2 size={16} /></IconButton>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </ModernTable>
                        </GlassPanel>
                    )}

                    {/* Tax Rates Tab */}
                    {activeTab === "rates" && (
                        <GlassPanel initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                            <PanelHeader>
                                <SearchInputContainer>
                                    <Search size={20} />
                                    <input
                                        type="text"
                                        placeholder="Search tax rates..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </SearchInputContainer>
                                <HelperText>{filteredTaxRates.length} Results</HelperText>
                            </PanelHeader>
                            <ModernTable>
                                <thead>
                                    <tr>
                                        <th>Tax Type</th>
                                        <th>Rate Name</th>
                                        <th>Rate</th>
                                        <th>Jurisdiction</th>
                                        <th>Effective Period</th>
                                        <th>Status</th>
                                        <th style={{ textAlign: 'right' }}>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTaxRates.length === 0 ? (
                                        <tr><td colSpan={7} style={{ textAlign: 'center', padding: '100px', color: '#64748b' }}>No tax rates configured</td></tr>
                                    ) : (
                                        filteredTaxRates.map((rate) => (
                                            <tr key={rate.id}>
                                                <td style={{ fontWeight: 800, fontFamily: 'monospace' }}>{rate.tax_type.code}</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <span style={{ fontWeight: 700 }}>{rate.name}</span>
                                                        {rate.is_default && (
                                                            <span style={{ padding: '2px 8px', fontSize: '0.7rem', fontWeight: 800, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '6px' }}>
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td style={{ fontWeight: 900, fontSize: '1.1rem', color: '#9333ea' }}>{rate.rate_percentage}%</td>
                                                <td style={{ color: '#64748b' }}>{rate.jurisdiction || "—"}</td>
                                                <td style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                                    {new Date(rate.effective_from).toLocaleDateString()}
                                                    {rate.effective_to && ` → ${new Date(rate.effective_to).toLocaleDateString()}`}
                                                </td>
                                                <td><StatusBadge $status={rate.is_active.toString()}>{rate.is_active ? "Active" : "Inactive"}</StatusBadge></td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <IconButton className="edit" onClick={() => openTaxRateModal(rate)}><Edit size={16} /></IconButton>
                                                        <IconButton className="delete" onClick={() => handleDeleteTaxRate(rate.id)}><Trash2 size={16} /></IconButton>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </ModernTable>
                        </GlassPanel>
                    )}
                </ContentContainer>
            </PageWrapper>

            {/* Tax Type Modal */}
            <AnimatePresence>
                {isTaxTypeModalOpen && (
                    <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsTaxTypeModalOpen(false); setEditingTaxType(null); }}>
                        <ModalContent initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                                <SectionTitle style={{ fontSize: '1.5rem', fontWeight: 900 }}>{editingTaxType ? "Edit Tax Type" : "Create Tax Type"}</SectionTitle>
                                <button onClick={() => { setIsTaxTypeModalOpen(false); setEditingTaxType(null); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
                            </div>
                            <form onSubmit={editingTaxType ? handleUpdateTaxType : handleCreateTaxType}>
                                <FormGroup>
                                    <label>Tax Code *</label>
                                    <input name="code" placeholder="VAT" defaultValue={editingTaxType?.code} required />
                                </FormGroup>
                                <FormGroup>
                                    <label>Tax Name *</label>
                                    <input name="name" placeholder="Value Added Tax" defaultValue={editingTaxType?.name} required />
                                </FormGroup>
                                <FormGroup>
                                    <label>Description</label>
                                    <textarea name="description" placeholder="Optional description" defaultValue={editingTaxType?.description} />
                                </FormGroup>
                                <FormGroup>
                                    <label>Status *</label>
                                    <select name="is_active" defaultValue={editingTaxType?.is_active !== undefined ? editingTaxType.is_active.toString() : "true"}>
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </FormGroup>
                                <HeaderButton type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
                                    {editingTaxType ? "Update Tax Type" : "Create Tax Type"}
                                </HeaderButton>
                            </form>
                        </ModalContent>
                    </ModalOverlay>
                )}
            </AnimatePresence>

            {/* Tax Rate Modal */}
            <AnimatePresence>
                {isTaxRateModalOpen && (
                    <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => { setIsTaxRateModalOpen(false); setEditingTaxRate(null); }}>
                        <ModalContent initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} onClick={(e) => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                                <SectionTitle style={{ fontSize: '1.5rem', fontWeight: 900 }}>{editingTaxRate ? "Edit Tax Rate" : "Create Tax Rate"}</SectionTitle>
                                <button onClick={() => { setIsTaxRateModalOpen(false); setEditingTaxRate(null); }} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b' }}><X size={24} /></button>
                            </div>
                            <form onSubmit={editingTaxRate ? handleUpdateTaxRate : handleCreateTaxRate}>
                                <FormGroup>
                                    <label>Tax Type *</label>
                                    <select name="tax_type_id" defaultValue={editingTaxRate?.tax_type.id} required>
                                        <option value="">Select Tax Type...</option>
                                        {taxTypes.filter(t => t.is_active).map(type => (
                                            <option key={type.id} value={type.id}>{type.code} - {type.name}</option>
                                        ))}
                                    </select>
                                </FormGroup>
                                <FormGroup>
                                    <label>Rate Name *</label>
                                    <input name="name" placeholder="Standard Rate" defaultValue={editingTaxRate?.name} required />
                                </FormGroup>
                                <FormGroup>
                                    <label>Rate Percentage (%) *</label>
                                    <input type="number" step="0.01" min="0" max="100" name="rate_percentage" placeholder="15.00" defaultValue={editingTaxRate?.rate_percentage} required />
                                </FormGroup>
                                <FormGroup>
                                    <label>Jurisdiction</label>
                                    <input name="jurisdiction" placeholder="Federal, State, etc." defaultValue={editingTaxRate?.jurisdiction} />
                                </FormGroup>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <FormGroup>
                                        <label>Effective From *</label>
                                        <input type="date" name="effective_from" defaultValue={editingTaxRate?.effective_from ? new Date(editingTaxRate.effective_from).toISOString().split('T')[0] : ''} required />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Effective To</label>
                                        <input type="date" name="effective_to" defaultValue={editingTaxRate?.effective_to ? new Date(editingTaxRate.effective_to).toISOString().split('T')[0] : ''} />
                                    </FormGroup>
                                </div>
                                <FormGroup>
                                    <label>Default Rate</label>
                                    <select name="is_default" defaultValue={editingTaxRate?.is_default !== undefined ? editingTaxRate.is_default.toString() : "false"}>
                                        <option value="false">No</option>
                                        <option value="true">Yes</option>
                                    </select>
                                </FormGroup>
                                <FormGroup>
                                    <label>Status *</label>
                                    <select name="is_active" defaultValue={editingTaxRate?.is_active !== undefined ? editingTaxRate.is_active.toString() : "true"}>
                                        <option value="true">Active</option>
                                        <option value="false">Inactive</option>
                                    </select>
                                </FormGroup>
                                <HeaderButton type="submit" style={{ width: '100%', justifyContent: 'center', marginTop: '12px' }}>
                                    {editingTaxRate ? "Update Tax Rate" : "Create Tax Rate"}
                                </HeaderButton>
                            </form>
                        </ModalContent>
                    </ModalOverlay>
                )}
            </AnimatePresence>
        </Layout>
    );
}
