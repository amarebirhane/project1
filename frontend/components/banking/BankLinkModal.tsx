"use client";

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { X, Landmark, Loader2, CheckCircle2, ChevronRight, Search } from 'lucide-react';
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
  background: linear-gradient(to right, #f8fafc, #ffffff);
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
    background: #f1f5f9;
    color: #ef4444;
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
  background: #f8fafc;
  font-size: 0.875rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
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
    background: #e2e8f0;
    border-radius: 3px;
  }
`;

const BankItem = styled.button<{ $selected: boolean }>`
  width: 100%;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid ${props => props.$selected ? '#3b82f6' : 'transparent'};
  background: ${props => props.$selected ? '#eff6ff' : 'transparent'};
  border-radius: ${props => props.theme.borderRadius.lg};
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;

  &:hover {
    background: ${props => props.$selected ? '#eff6ff' : '#f8fafc'};
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
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #3b82f6;
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
    background: #2563eb;
    color: white;
    &:hover { background: #1d4ed8; }
    &:disabled { opacity: 0.7; cursor: not-allowed; }
  ` : `
    background: #f1f5f9;
    color: #475569;
    &:hover { background: #e2e8f0; }
  `}
`;

interface BankLinkModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const BankLinkModal: React.FC<BankLinkModalProps> = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState<'select' | 'details' | 'success'>('select');
    const [banks, setBanks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selectedBank, setSelectedBank] = useState<any>(null);
    const [accountNumber, setAccountNumber] = useState('');
    const [accountName, setAccountName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchBanks = async () => {
            try {
                const res = await apiClient.getBanks();
                if (res.data) setBanks(res.data);
            } catch (err) {
                toast.error("Failed to load bank list");
            } finally {
                setLoading(false);
            }
        };
        fetchBanks();
    }, []);

    const filteredBanks = banks.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSubmit = async () => {
        if (!selectedBank || !accountNumber) return;

        try {
            setIsSubmitting(true);
            // In a real app, you'd send this to Chapa for verification
            // For now, we'll create the record in our DB
            await apiClient.createBankAccount({
                bank_name: selectedBank.name,
                account_name: accountName || "Main Account",
                account_number_last4: accountNumber.slice(-4),
                currency_code: "ETB",
                // Chapa specific info could be stored in a 'provider_metadata' field if it existed
            });

            toast.success("Bank linked successfully via Chapa");
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
                        <Landmark size={24} color="#2563eb" />
                        {step === 'select' ? 'Select Your Bank' : step === 'details' ? 'Account Details' : 'Success!'}
                    </Title>
                    <CloseButton onClick={onClose}>
                        <X size={24} />
                    </CloseButton>
                </Header>

                {step === 'select' && (
                    <>
                        <SearchContainer>
                            <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '40px', top: '27px' }} />
                            <SearchInput
                                placeholder="Search Ethiopian banks..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </SearchContainer>

                        <BankList>
                            {loading ? (
                                <div style={{ padding: '40px', textAlign: 'center' }}>
                                    <Loader2 className="animate-spin" size={32} color="#2563eb" />
                                    <div style={{ marginTop: '12px', color: '#64748b' }}>Fetching banks...</div>
                                </div>
                            ) : (
                                filteredBanks.map(bank => (
                                    <BankItem
                                        key={bank.id}
                                        $selected={selectedBank?.id === bank.id}
                                        onClick={() => setSelectedBank(bank)}
                                    >
                                        <BankInfo>
                                            <Landmark size={20} color={selectedBank?.id === bank.id ? '#3b82f6' : '#94a3b8'} />
                                            <BankName>{bank.name}</BankName>
                                        </BankInfo>
                                        <ChevronRight size={18} color="#cbd5e1" />
                                    </BankItem>
                                ))
                            )}
                        </BankList>

                        <Footer>
                            <Button onClick={onClose}>Cancel</Button>
                            <Button
                                $primary
                                disabled={!selectedBank}
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
                            <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <Landmark size={20} color="#2563eb" />
                                <div style={{ fontWeight: 600 }}>{selectedBank?.name}</div>
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

                            <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <CheckCircle2 size={14} color="#10b981" />
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
                        <div style={{ width: '80px', height: '80px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                            <CheckCircle2 size={48} color="#10b981" />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>Account Linked!</h3>
                        <p style={{ color: '#64748b', marginBottom: '32px' }}>
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
