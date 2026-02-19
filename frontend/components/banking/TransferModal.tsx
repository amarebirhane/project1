"use client";

import React, { useState, useEffect } from 'react';
import styled, { useTheme } from 'styled-components';
import { X, Send, Loader2, CheckCircle2, Landmark, DollarSign, User } from 'lucide-react';
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
  max-width: 550px;
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

const FormContainer = styled.div`
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;
`;

const SectionTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${props => props.theme.colors.textSecondary};
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
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
  padding: 14px;
  border-radius: ${props => props.theme.borderRadius.lg};
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  ${props => props.$primary ? `
    background: ${props.theme.colors.primary};
    color: ${props.theme.colors.primaryForeground};
    &:hover:not(:disabled) { filter: brightness(0.9); transform: translateY(-1px); box-shadow: 0 4px 12px ${props.theme.colors.primary}4d; }
    &:disabled { opacity: 0.7; cursor: not-allowed; }
  ` : `
    background: ${props.theme.colors.muted};
    color: ${props.theme.colors.textSecondary};
    &:hover { background: ${props.theme.colors.border}; }
  `}
`;

const SuccessView = styled.div`
  padding: 48px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

interface TransferModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({ onClose, onSuccess }) => {
    const theme = useTheme();
    const [step, setStep] = useState<'form' | 'success'>('form');
    const [banks, setBanks] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        source_account_id: '',
        amount: '',
        bank_code: '',
        account_number: '',
        beneficiary_name: '',
        reference: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [banksRes, accountsRes] = await Promise.all([
                    apiClient.getBanks(),
                    apiClient.getBankAccounts()
                ]);
                if (banksRes.data) setBanks(banksRes.data);
                if (accountsRes.data) setAccounts(accountsRes.data);
            } catch (err) {
                toast.error("Failed to load transfer data");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.source_account_id || !formData.amount || !formData.bank_code || !formData.account_number || !formData.beneficiary_name) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            setIsSubmitting(true);
            const res = await apiClient.initiateMoneyTransfer({
                source_account_id: parseInt(formData.source_account_id),
                amount: parseFloat(formData.amount),
                bank_code: formData.bank_code,
                account_number: formData.account_number,
                beneficiary_name: formData.beneficiary_name,
                reference: formData.reference || undefined
            });

            if (res.data?.status === 'success') {
                toast.success("Transfer initiated successfully");
                setStep('success');
            } else {
                toast.error(res.data?.message || "Transfer failed");
            }
        } catch (err) {
            toast.error("Transfer failed. Please check your connection.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <ModalOverlay onClick={onClose}>
                <ModalContent style={{ padding: '60px', alignItems: 'center' }}>
                    <Loader2 className="animate-spin" size={40} color={theme.colors.primary} />
                </ModalContent>
            </ModalOverlay>
        );
    }

    return (
        <ModalOverlay onClick={onClose}>
            <ModalContent onClick={e => e.stopPropagation()}>
                <Header>
                    <Title>
                        <Send size={24} color={theme.colors.primary} />
                        {step === 'form' ? 'Transfer Funds' : 'Transfer Sent'}
                    </Title>
                    <CloseButton onClick={onClose}>
                        <X size={24} />
                    </CloseButton>
                </Header>

                {step === 'form' ? (
                    <form onSubmit={handleSubmit}>
                        <FormContainer>
                            <SectionTitle><DollarSign size={14} /> Source & Amount</SectionTitle>

                            <InputGroup>
                                <Label>Select Source Account</Label>
                                <StyledSelect
                                    name="source_account_id"
                                    value={formData.source_account_id}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Choose an account...</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>
                                            {acc.account_name} ({acc.bank_name} •••• {acc.account_number_last4})
                                        </option>
                                    ))}
                                </StyledSelect>
                            </InputGroup>

                            <InputGroup>
                                <Label>Amount (ETB)</Label>
                                <StyledInput
                                    type="number"
                                    name="amount"
                                    placeholder="0.00"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    required
                                    min="1"
                                    step="0.01"
                                />
                            </InputGroup>

                            <SectionTitle><Landmark size={14} /> Destination Details</SectionTitle>

                            <InputGroup>
                                <Label>Destination Bank</Label>
                                <StyledSelect
                                    name="bank_code"
                                    value={formData.bank_code}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="">Select bank...</option>
                                    {banks.map(bank => (
                                        <option key={bank.id} value={bank.id}>{bank.name}</option>
                                    ))}
                                </StyledSelect>
                            </InputGroup>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <InputGroup>
                                    <Label>Account Number</Label>
                                    <StyledInput
                                        name="account_number"
                                        placeholder="Destination account"
                                        value={formData.account_number}
                                        onChange={handleChange}
                                        required
                                    />
                                </InputGroup>
                                <InputGroup>
                                    <Label>Beneficiary Name</Label>
                                    <StyledInput
                                        name="beneficiary_name"
                                        placeholder="Full name"
                                        value={formData.beneficiary_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </InputGroup>
                            </div>

                            <InputGroup>
                                <Label>Reference (Optional)</Label>
                                <StyledInput
                                    name="reference"
                                    placeholder="e.g. Payment for services"
                                    value={formData.reference}
                                    onChange={handleChange}
                                />
                            </InputGroup>
                        </FormContainer>

                        <Footer>
                            <Button type="button" onClick={onClose}>Cancel</Button>
                            <Button
                                type="submit"
                                $primary
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Send Money</>}
                            </Button>
                        </Footer>
                    </form>
                ) : (
                    <SuccessView>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            background: `${theme.colors.primary}1a`,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '24px',
                            border: `2px solid ${theme.colors.primary}33`
                        }}>
                            <CheckCircle2 size={48} color={theme.colors.primary} />
                        </div>
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px', color: theme.colors.textDark }}>Transfer In Progress</h3>
                        <p style={{ color: theme.colors.textSecondary, marginBottom: '32px' }}>
                            We've initiated the transfer of {formData.amount} ETB to {formData.beneficiary_name}.
                            It will appear in your transactions shortly once confirmed by the bank.
                        </p>
                        <Button $primary style={{ width: '100%' }} onClick={() => { onSuccess(); onClose(); }}>
                            Back to Dashboard
                        </Button>
                    </SuccessView>
                )}
            </ModalContent>
        </ModalOverlay>
    );
};
