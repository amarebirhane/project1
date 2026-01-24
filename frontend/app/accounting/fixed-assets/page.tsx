"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Building2, Calculator, Calendar, MapPin, Search, X, TrendingUp, DollarSign, PieChart, Activity } from "lucide-react";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";
import Layout from "@/components/layout";
import styled, { css, keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { Suspense } from "react";

interface FixedAsset {
    id: number;
    name: string;
    asset_category: string;
    purchase_date: string;
    purchase_cost: number;
    salvage_value: number;
    useful_life_years: number;
    accumulated_depreciation: number;
    current_book_value: number;
    status: string;
    location?: string;
    description?: string;
    asset_account_id: number;
    depreciation_expense_account_id: number;
    accumulated_depreciation_account_id: number;
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

const RegisterButton = styled.button`
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
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
  box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.3);

  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 20px 25px -5px rgba(37, 99, 235, 0.4);
  }

  &:active { transform: translateY(1px); }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-cols: 1;
  gap: ${props => props.theme.spacing.lg};
  margin-bottom: ${props => props.theme.spacing.xxl};

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const StatCard = styled.div<{ $color: string }>`
  background: ${props => props.theme.colors.card};
  padding: ${props => props.theme.spacing.xl};
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
    width: 56px;
    height: 56px;
    border-radius: 16px;
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

const ActionRow = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: ${props => props.theme.spacing.xl};
`;

const SearchWrapper = styled.div`
  position: relative;
  flex: 1;
  
  input {
    width: 100%;
    padding: 16px 16px 16px 52px;
    background: ${props => props.theme.colors.card};
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: 18px;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.2s;

    &:focus {
      outline: none;
      border-color: #2563eb;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
    }
  }

  svg {
    position: absolute;
    left: 18px;
    top: 50%;
    transform: translateY(-50%);
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const AssetGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 24px;
`;

const AssetCard = styled(motion.div)`
  background: ${props => props.theme.colors.card};
  border-radius: 24px;
  padding: 24px;
  border: 1px solid ${props => props.theme.colors.border};
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;

  &:hover {
    border-color: #2563eb;
    box-shadow: ${props => props.theme.shadows.md};
  }
`;

const Badge = styled.span<{ $status: string }>`
  padding: 6px 12px;
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${props => props.$status === 'active' ? css`
    background: #dcfce7; color: #166534;
  ` : props.$status === 'disposed' ? css`
    background: #fee2e2; color: #991b1b;
  ` : css`
    background: #fefce8; color: #854d0e;
  `}
`;

const AssetIcon = styled.div`
  width: 48px;
  height: 48px;
  background: #f1f5f9;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  margin-bottom: 20px;
`;

const ValueBar = styled.div<{ $percent: number }>`
  height: 8px;
  background: #f1f5f9;
  border-radius: 4px;
  margin: 16px 0 8px;
  overflow: hidden;
  position: relative;

  .fill {
    height: 100%;
    width: ${props => props.$percent}%;
    background: linear-gradient(90deg, #2563eb 0%, #60a5fa 100%);
    border-radius: 4px;
    transition: width 1s ease-out;
  }
`;

const CardActions = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid ${props => props.theme.colors.border};
`;

const IconButton = styled.button<{ $variant?: 'primary' | 'danger' | 'ghost' }>`
  padding: 10px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 600;

  ${props => props.$variant === 'primary' ? css`
    background: #1e293b; color: white; flex: 1;
    &:hover { background: #0f172a; }
  ` : props.$variant === 'danger' ? css`
    background: transparent; color: #ef4444;
    &:hover { background: #fee2e2; }
  ` : css`
    background: transparent; color: #64748b;
    &:hover { background: #f1f5f9; color: #1e293b; }
  `}
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
  max-width: 600px;
  max-height: 90vh;
  border-radius: 32px;
  padding: 40px;
  box-shadow: 0 40px 100px -20px rgba(0,0,0,0.3);
  border: 1px solid ${props => props.theme.colors.border};
  overflow-y: auto;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const FormGroup = styled.div<{ $full?: boolean }>`
  grid-column: ${props => props.$full ? 'span 2' : 'span 1'};
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

    &:focus {
      outline: none;
      border-color: #2563eb;
      background: white;
    }
  }
`;

function FixedAssetContent() {
    const [assets, setAssets] = useState<FixedAsset[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAsset, setEditingAsset] = useState<FixedAsset | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const { register, handleSubmit, reset, setValue } = useForm();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [assetsRes, accountsRes] = await Promise.all([
                apiClient.getFixedAssets(),
                apiClient.getAccountingAccounts()
            ]);
            if (assetsRes.data) setAssets(assetsRes.data);
            if (accountsRes.data) setAccounts(accountsRes.data);
        } catch (error) {
            console.error("Failed to fetch fixed assets data:", error);
            toast.error("Failed to load fixed assets management data");
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (data: any) => {
        try {
            setSubmitting(true);
            const payload = {
                ...data,
                purchase_cost: parseFloat(data.purchase_cost),
                salvage_value: parseFloat(data.salvage_value || 0),
                useful_life_years: parseInt(data.useful_life_years),
                asset_account_id: parseInt(data.asset_account_id),
                depreciation_expense_account_id: parseInt(data.depreciation_expense_account_id),
                accumulated_depreciation_account_id: parseInt(data.accumulated_depreciation_account_id),
                purchase_date: new Date(data.purchase_date).toISOString()
            };

            if (editingAsset) {
                await apiClient.updateFixedAsset(editingAsset.id, payload);
                toast.success("Asset updated successfully");
            } else {
                await apiClient.createFixedAsset(payload);
                toast.success("Asset registered successfully");
            }
            setIsModalOpen(false);
            setEditingAsset(null);
            reset();
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to save asset");
        } finally {
            setSubmitting(false);
        }
    };

    const deleteAsset = async (id: number) => {
        if (!confirm("Are you sure you want to delete this asset? This will remove all depreciation records.")) return;
        try {
            await apiClient.deleteFixedAsset(id);
            toast.success("Asset deleted successfully");
            fetchData();
        } catch (error) {
            toast.error("Failed to delete asset");
        }
    };

    const openEditModal = (asset: FixedAsset) => {
        setEditingAsset(asset);
        setValue("name", asset.name);
        setValue("asset_category", asset.asset_category);
        setValue("purchase_date", asset.purchase_date.split('T')[0]);
        setValue("purchase_cost", asset.purchase_cost);
        setValue("salvage_value", asset.salvage_value);
        setValue("useful_life_years", asset.useful_life_years);
        setValue("asset_account_id", asset.asset_account_id);
        setValue("depreciation_expense_account_id", asset.depreciation_expense_account_id);
        setValue("accumulated_depreciation_account_id", asset.accumulated_depreciation_account_id);
        setValue("location", asset.location);
        setValue("description", asset.description);
        setIsModalOpen(true);
    };

    const handleDepreciate = async (id: number) => {
        try {
            await apiClient.depreciateFixedAsset(id);
            toast.success("Depreciation processed successfully");
            fetchData();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || "Failed to process depreciation");
        }
    };

    const filteredAssets = assets.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.asset_category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const stats = {
        totalCost: assets.reduce((sum, a) => sum + a.purchase_cost, 0),
        bookValue: assets.reduce((sum, a) => sum + a.current_book_value, 0),
        count: assets.length
    };

    return (
        <Layout>
            <PageWrapper>
                <ContentContainer>
                    {/* Header */}
                    <Header>
                        <TitleSection>
                            <h1>Fixed Assets</h1>
                            <p>Strategic asset management and automated depreciation</p>
                        </TitleSection>
                        <RegisterButton onClick={() => { setEditingAsset(null); reset(); setIsModalOpen(true); }}>
                            <Plus size={20} />
                            Register Asset
                        </RegisterButton>
                    </Header>

                    {/* Stats */}
                    <StatsGrid>
                        <StatCard $color="#2563eb">
                            <div className="icon"><Building2 size={24} /></div>
                            <div className="content">
                                <div className="label">Total Assets</div>
                                <div className="value">{stats.count}</div>
                            </div>
                        </StatCard>
                        <StatCard $color="#10b981">
                            <div className="icon"><DollarSign size={24} /></div>
                            <div className="content">
                                <div className="label">Total Acquisition Cost</div>
                                <div className="value">${stats.totalCost.toLocaleString()}</div>
                            </div>
                        </StatCard>
                        <StatCard $color="#8b5cf6">
                            <div className="icon"><Activity size={24} /></div>
                            <div className="content">
                                <div className="label">Current Net Book Value</div>
                                <div className="value">${stats.bookValue.toLocaleString()}</div>
                            </div>
                        </StatCard>
                    </StatsGrid>

                    {/* Search & Actions */}
                    <ActionRow>
                        <SearchWrapper>
                            <Search size={20} />
                            <input
                                type="text"
                                placeholder="Search by name, category, or serial number..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </SearchWrapper>
                    </ActionRow>

                    {/* Asset Grid */}
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                        </div>
                    ) : (
                        <AssetGrid>
                            <AnimatePresence mode="popLayout">
                                {filteredAssets.length === 0 ? (
                                    <div key="empty" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '80px', background: 'white', borderRadius: '32px', border: '2px dashed #e2e8f0' }}>
                                        <Building2 size={64} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
                                        <p style={{ color: '#64748b', fontSize: '1.1rem', fontWeight: 600 }}>No assets found matching your criteria</p>
                                    </div>
                                ) : (
                                    filteredAssets.map((asset) => (
                                        <AssetCard
                                            key={asset.id}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                                <AssetIcon><Building2 size={24} /></AssetIcon>
                                                <Badge $status={asset.status}>{asset.status}</Badge>
                                            </div>

                                            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}>{asset.name}</h3>
                                            <p style={{ color: '#64748b', fontWeight: 600, fontSize: '0.875rem', marginBottom: '20px' }}>{asset.asset_category}</p>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Purchase Date</div>
                                                    <div style={{ fontWeight: 600, color: '#475569' }}>{new Date(asset.purchase_date).toLocaleDateString()}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Useful Life</div>
                                                    <div style={{ fontWeight: 600, color: '#475569' }}>{asset.useful_life_years} Years</div>
                                                </div>
                                            </div>

                                            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#64748b' }}>Book Value</span>
                                                    <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1e293b' }}>${asset.current_book_value.toLocaleString()}</span>
                                                </div>
                                                <ValueBar $percent={(asset.current_book_value / asset.purchase_cost) * 100}>
                                                    <div className="fill" />
                                                </ValueBar>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
                                                    <span>Depreciated: ${asset.accumulated_depreciation.toLocaleString()}</span>
                                                    <span>Cost: ${asset.purchase_cost.toLocaleString()}</span>
                                                </div>
                                            </div>

                                            <CardActions>
                                                <IconButton $variant="primary" onClick={() => handleDepreciate(asset.id)}>
                                                    <Calculator size={18} />
                                                    Depreciate
                                                </IconButton>
                                                <IconButton $variant="ghost" onClick={() => openEditModal(asset)}>
                                                    <Edit size={18} />
                                                </IconButton>
                                                <IconButton $variant="danger" onClick={() => deleteAsset(asset.id)}>
                                                    <Trash2 size={18} />
                                                </IconButton>
                                            </CardActions>
                                        </AssetCard>
                                    ))
                                )}
                            </AnimatePresence>
                        </AssetGrid>
                    )}
                </ContentContainer>
            </PageWrapper>

            {/* Asset Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <ModalContent initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#1e293b' }}>{editingAsset ? 'Edit Asset' : 'Register New Asset'}</h2>
                                <IconButton onClick={() => setIsModalOpen(false)}><X size={24} /></IconButton>
                            </div>

                            <form onSubmit={handleSubmit(handleFormSubmit)}>
                                <FormGrid>
                                    <FormGroup $full>
                                        <label>Asset Name</label>
                                        <input {...register("name", { required: true })} placeholder="e.g., MacBook Pro M3" />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Category</label>
                                        <select {...register("asset_category", { required: true })}>
                                            <option value="Vehicles">Vehicles</option>
                                            <option value="Buildings">Buildings</option>
                                            <option value="Computer Equipment">Computer Equipment</option>
                                            <option value="Furniture">Furniture</option>
                                            <option value="Machinery">Machinery</option>
                                        </select>
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Purchase Date</label>
                                        <input type="date" {...register("purchase_date", { required: true })} />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Purchase Cost ($)</label>
                                        <input type="number" step="0.01" {...register("purchase_cost", { required: true })} placeholder="0.00" />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Salvage Value ($)</label>
                                        <input type="number" step="0.01" {...register("salvage_value")} placeholder="0.00" />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Useful Life (Years)</label>
                                        <input type="number" {...register("useful_life_years", { required: true })} placeholder="5" />
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Location</label>
                                        <input {...register("location")} placeholder="e.g., Headquarters, Lab 1" />
                                    </FormGroup>

                                    <FormGroup $full>
                                        <label>Asset Account (COA)</label>
                                        <select {...register("asset_account_id", { required: true })}>
                                            <option value="">Select Asset Account</option>
                                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                                        </select>
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Depreciation Expense Account</label>
                                        <select {...register("depreciation_expense_account_id", { required: true })}>
                                            <option value="">Select Expense Account</option>
                                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                                        </select>
                                    </FormGroup>
                                    <FormGroup>
                                        <label>Acc. Depreciation Account</label>
                                        <select {...register("accumulated_depreciation_account_id", { required: true })}>
                                            <option value="">Select Contra-Asset Account</option>
                                            {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                                        </select>
                                    </FormGroup>

                                    <FormGroup $full>
                                        <label>Description (Optional)</label>
                                        <textarea {...register("description")} rows={3} placeholder="Additional asset details or specs..." />
                                    </FormGroup>
                                </FormGrid>

                                <button type="submit" disabled={submitting} style={{
                                    width: '100%',
                                    background: '#2563eb',
                                    color: 'white',
                                    padding: '16px',
                                    borderRadius: '16px',
                                    fontWeight: 700,
                                    border: 'none',
                                    marginTop: '12px',
                                    cursor: 'pointer'
                                }}>
                                    {submitting ? 'Processing...' : editingAsset ? 'Update Asset' : 'Register Asset'}
                                </button>
                            </form>
                        </ModalContent>
                    </ModalOverlay>
                )}
            </AnimatePresence>
        </Layout>
    );
}

export default function FixedAssetsPage() {
    return (
        <Suspense fallback={<div>Loading Fixed Assets...</div>}>
            <FixedAssetContent />
        </Suspense>
    );
}
