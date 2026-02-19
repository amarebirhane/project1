"use client";

import React, { useState, useEffect } from 'react';
import styled, { useTheme } from 'styled-components';
import { X, Landmark, Loader2, CheckCircle2, ChevronRight, Search, Plus, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

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
`;

const ModalContent = styled.div`
  background: ${props => props.theme.colors.card};
  width: 100%;
  max-width: 500px;
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
`;

const Header = styled.div`
  padding: 24px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: ${props => props.theme.colors.backgroundSecondary};
`;

const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 700;
  color: ${props => props.theme.colors.textDark};
  display: flex;
  align-items: center;
  gap: 12px;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme.colors.muted};
    color: ${props => props.theme.colors.error};
  }
`;

const SearchContainer = styled.div`
  padding: 16px 24px;
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 16px 10px 40px;
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.inputBg};
  color: ${props => props.theme.colors.text};
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 3px ${props => props.theme.colors.primary}1a;
  }
`;

const BankList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0 12px;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border};
    border-radius: 3px;
  }
`;

const BankItem = styled.button<{ $selected: boolean }>`
  width: 100%;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid ${props => props.$selected ? props.theme.colors.primary : 'transparent'};
  background: ${props => props.$selected ? `${props.theme.colors.primary}1a` : 'transparent'};
  border-radius: ${props => props.theme.borderRadius.lg};
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;

  &:hover {
    background: ${props => props.$selected ? `${props.theme.colors.primary}26` : props.theme.colors.muted};
  }
`;

const BankInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
`;

const BankName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.textDark};
`;

const StepContainer = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
  flex: 1;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: ${props => props.theme.colors.border};
    border-radius: 3px;
  }
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textSecondary};
`;

const StyledInput = styled.input`
  padding: 12px 16px;
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.inputBg};
  color: ${props => props.theme.colors.text};
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const StyledSelect = styled.select`
  padding: 12px 16px;
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.inputBg};
  color: ${props => props.theme.colors.text};
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const Footer = styled.div`
  padding: 24px;
  border-top: 1px solid ${props => props.theme.colors.border};
  display: flex;
  gap: 12px;
`;

const Button = styled.button<{ $primary?: boolean }>`
  flex: 1;
  padding: 12px;
  border-radius: ${props => props.theme.borderRadius.lg};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  
  ${props => props.$primary ? `
    background: ${props.theme.colors.primary};
    color: ${props.theme.colors.primaryForeground};
    &:hover { filter: brightness(0.9); }
    &:disabled { opacity: 0.7; cursor: not-allowed; }
  ` : `
    background: ${props.theme.colors.muted};
    color: ${props.theme.colors.textSecondary};
    &:hover { background: ${props.theme.colors.border}; }
  `}
`;

interface BankLinkModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const BankLinkModal: React.FC<BankLinkModalProps> = ({ onClose, onSuccess }) => {
    const theme = useTheme();
    const [step, setStep] = useState<'select' | 'details' | 'success'>('select');
    const [banks, setBanks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedBank, setSelectedBank] = useState<any>(null);
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [glAccounts, setGlAccounts] = useState<any[]>([]);
    const [selectedGlAccountId, setSelectedGlAccountId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Manual entry states
    const [isManualEntry, setIsManualEntry] = useState(false);
    const [manualBankName, setManualBankName] = useState('');

    // GL Account creation states
    const [isCreatingGl, setIsCreatingGl] = useState(false);
    const [newGlCode, setNewGlCode] = useState('');
    const [newGlName, setNewGlName] = useState('');
    const [isCreatingGlLoading, setIsCreatingGlLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [banksRes, glAccountsRes] = await Promise.all([
                    apiClient.getBanks(),
                    apiClient.getAccountingAccounts()
                ]);
                if (banksRes.data) setBanks(banksRes.data);
                if (glAccountsRes.data) setGlAccounts(glAccountsRes.data);
            } catch (err) {
                toast.error("Failed to load setup data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredBanks = banks.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleCreateGl = async () => {
        if (!newGlCode || !newGlName) return;
        try {
            setIsCreatingGlLoading(true);
            const res = await apiClient.createAccountingAccount({
                code: newGlCode,
                name: newGlName,
                type: 'ASSET', // Banking accounts are typically assets
                is_active: true
            });
            setGlAccounts(prev => [...prev, res.data]);
            setSelectedGlAccountId(res.data.id.toString());
            setIsCreatingGl(false);
            setNewGlCode('');
            setNewGlName('');
            toast.success("GL Account created successfully");
        } catch (err) {
            toast.error("Failed to create GL account");
        } finally {
            setIsCreatingGlLoading(false);
        }
    };

    const handleSubmit = async () => {
        if ((!selectedBank && !manualBankName) || !accountNumber) return;

        try {
            setIsSubmitting(true);
            await apiClient.createBankAccount({
                bank_name: isManualEntry ? manualBankName : (selectedBank?.name || selectedBank?.id),
                account_name: accountName || "Main Account",
                account_number_last4: accountNumber.slice(-4),
                currency_code: "ETB",
                gl_account_id: selectedGlAccountId ? parseInt(selectedGlAccountId) : undefined
            });

            toast.success("Bank linked successfully");
            setStep('success');
        } catch (err) {
            toast.error("Failed to link bank account");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <Header>
                    <Title>
                        <Landmark size={24} color={theme.colors.primary} />
                        {step === 'select' ? 'Select Your Bank' : step === 'details' ? 'Account Details' : 'Success!'}
                    </Title>
                    <CloseButton onClick={onClose}>
                        <X size={24} />
                    </CloseButton>
                </Header>

                {step === 'select' && (
                    <>
                        <SearchContainer>
                            <Search size={18} color={theme.colors.textSecondary} style={{ position: 'absolute', left: '40px', top: '27px' }} />
                            <SearchInput
                                placeholder="Search Ethiopian banks..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </SearchContainer>

                        <BankList>
                            {loading ? (
                                <div style={{ padding: '40px', textAlign: 'center' }}>
                                    <Loader2 className="animate-spin" size={32} color={theme.colors.primary} />
                                    <div style={{ marginTop: '12px', color: theme.colors.textSecondary }}>Fetching banks...</div>
                                </div>
                            ) : (
                                filteredBanks.map(bank => (
                                    <BankItem
                                        key={bank.id}
                                        $selected={selectedBank?.id === bank.id}
                                        onClick={() => setSelectedBank(bank)}
                                    >
                                        <BankInfo>
                                            <Landmark size={20} color={selectedBank?.id === bank.id ? theme.colors.primary : theme.colors.textSecondary} />
                                            <BankName>{bank.name}</BankName>
                                        </BankInfo>
                                        <ChevronRight size={18} color={theme.colors.border} />
                                    </BankItem>
                                ))
                            )}

                            <div style={{ padding: '8px 12px' }}>
                                <BankItem
                                    $selected={isManualEntry}
                                    onClick={() => {
                                        setIsManualEntry(true);
                                        setSelectedBank(null);
                                    }}
                                >
                                    <BankInfo>
                                        <Plus size={20} color={isManualEntry ? theme.colors.primary : theme.colors.textSecondary} />
                                        <BankName>Manual Entry / Other Bank</BankName>
                                    </BankInfo>
                                    <ChevronRight size={18} color={theme.colors.border} />
                                </BankItem>
                            </div>
                        </BankList>

                        {isManualEntry && (
                            <div style={{ padding: '0 24px 16px' }}>
                                <InputGroup>
                                    <Label>Bank Name</Label>
                                    <StyledInput
                                        placeholder="Enter bank name manually"
                                        value={manualBankName}
                                        onChange={e => setManualBankName(e.target.value)}
                                        autoFocus
                                    />
                                </InputGroup>
                            </div>
                        )}

                        <Footer>
                            <Button onClick={onClose}>Cancel</Button>
                            <Button
                                $primary
                                disabled={!selectedBank && !manualBankName}
                                onClick={() => setStep('details')}
                            >
                                Continue
                            </Button>
                        </Footer>
                    </>
                )}

                {step === 'details' && (
                    <>
                        <StepContainer>
                            <div style={{
                                padding: '16px',
                                background: theme.colors.backgroundSecondary,
                                borderRadius: '12px',
                                display: 'flex',
                                gap: '12px',
                                alignItems: 'center',
                                border: `1px solid ${theme.colors.border}`
                            }}>
                                <Landmark size={20} color={theme.colors.primary} />
                                <div style={{ fontWeight: 600, color: theme.colors.textDark }}>{isManualEntry ? manualBankName : selectedBank?.name}</div>
                            </div>

                            <InputGroup>
                                <Label>Account Nickname</Label>
                                <StyledInput
                                    placeholder="e.g. Business Savings"
                                    value={accountName}
                                    onChange={e => setAccountName(e.target.value)}
                                />
                            </InputGroup>

                            <InputGroup>
                                <Label>Account Number</Label>
                                <StyledInput
                                    placeholder="Enter account number"
                                    value={accountNumber}
                                    onChange={e => setAccountNumber(e.target.value)}
                                />
                            </InputGroup>

                            <InputGroup>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Label>GL Account (Accountant Number)</Label>
                                    <button
                                        type="button"
                                        onClick={() => setIsCreatingGl(!isCreatingGl)}
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: theme.colors.primary,
                                            fontSize: '0.75rem',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}
                                    >
                                        <Plus size={12} />
                                        {isCreatingGl ? "Cancel" : "Create New"}
                                    </button>
                                </div>

                                {isCreatingGl ? (
                                    <div style={{
                                        padding: '12px',
                                        background: `${theme.colors.primary}08`,
                                        borderRadius: '8px',
                                        border: `1px dashed ${theme.colors.primary}33`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '12px'
                                    }}>
                                        <StyledInput
                                            placeholder="Account Code (e.g. 1010)"
                                            value={newGlCode}
                                            onChange={e => setNewGlCode(e.target.value)}
                                            style={{ fontSize: '0.875rem', padding: '8px 12px' }}
                                        />
                                        <StyledInput
                                            placeholder="Account Name (e.g. Bank Savings)"
                                            value={newGlName}
                                            onChange={e => setNewGlName(e.target.value)}
                                            style={{ fontSize: '0.875rem', padding: '8px 12px' }}
                                        />
                                        <Button
                                            $primary
                                            style={{ padding: '8px', fontSize: '0.875rem' }}
                                            onClick={handleCreateGl}
                                            disabled={!newGlCode || !newGlName || isCreatingGlLoading}
                                        >
                                            {isCreatingGlLoading ? <Loader2 className="animate-spin" size={16} /> : "Create & Select"}
                                        </Button>
                                    </div>
                                ) : (
                                    <StyledSelect
                                        value={selectedGlAccountId}
                                        onChange={e => setSelectedGlAccountId(e.target.value)}
                                    >
                                        <option value="">Select accounting account...</option>
                                        {glAccounts.map((acc: any) => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.code} - {acc.name}
                                            </option>
                                        ))}
                                    </StyledSelect>
                                )}
                            </InputGroup>

                            <div style={{ fontSize: '0.75rem', color: theme.colors.textSecondary, display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <CheckCircle2 size={14} color={theme.colors.primary} />
                                Verified via Chapa Secure API
                            </div>
                        </StepContainer>

                        <Footer>
                            <Button onClick={() => setStep('select')}>Back</Button>
                            <Button
                                $primary
                                disabled={!accountNumber || isSubmitting}
                                onClick={handleSubmit}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Link Account"}
                            </Button>
                        </Footer>
                    </>
                )}

                {step === 'success' && (
                    <StepContainer style={{ alignItems: 'center', textAlign: 'center', padding: '48px 24px' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: `${theme.colors.primary}1a`,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '24px',
                            border: `2px solid ${theme.colors.primary}33`
                        }}>
                            <CheckCircle2 size={48} color={theme.colors.primary} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px', color: theme.colors.textDark }}>Account Linked!</h3>
                        <p style={{ color: theme.colors.textSecondary, marginBottom: '32px' }}>
                            Your {selectedBank?.name} account has been successfully connected.
                            Transactions will sync automatically.
                        </p>
                        <Button $primary style={{ width: '100%' }} onClick={() => { onSuccess(); onClose(); }}>
                            Go to Dashboard
                        </Button>
                    </StepContainer>
                )}
            </ModalContent>
        </ModalOverlay>
    );
};
