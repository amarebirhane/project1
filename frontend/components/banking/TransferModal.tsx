"use client";

import React, { useState, useEffect } from 'react';
import styled, { useTheme } from 'styled-components';
import { X, Send, Loader2, CheckCircle2, Landmark, DollarSign, User, ArrowRight, ArrowLeft, Info, Calendar, Clock, ChevronRight } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { toast } from 'sonner';

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled.div`
  background: ${props => props.theme.colors.card};
  width: 100%;
  max-width: 600px;
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
  position: relative;
`;

const ProgressTracker = styled.div`
  display: flex;
  padding: 20px 24px 0;
  gap: 8px;
`;

const ProgressStep = styled.div<{ $active: boolean; $completed: boolean }>`
  flex: 1;
  height: 4px;
  border-radius: 2px;
  background: ${props => props.$completed ? props.theme.colors.primary : props.$active ? `${props.theme.colors.primary}4d` : props.theme.colors.muted};
  transition: all 0.3s ease;
`;

const Header = styled.div`
  padding: 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 800;
  color: ${props => props.theme.colors.text};
  letter-spacing: -0.02em;
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${props => props.theme.colors.muted};
    color: ${props => props.theme.colors.error};
  }
`;

const FormContainer = styled.div`
  padding: 0 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  overflow-y: auto;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: ${props => props.theme.colors.textSecondary};
`;

const AccountCard = styled.div<{ $selected: boolean; $interactive?: boolean }>`
  padding: 16px;
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 2px solid ${props => props.$selected ? props.theme.colors.primary : props.theme.colors.border};
  background: ${props => props.$selected ? `${props.theme.colors.primary}08` : props.theme.colors.inputBg};
  cursor: ${props => props.$interactive ? 'pointer' : 'default'};
  transition: all 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;

  &:hover {
    ${props => props.$interactive && !props.$selected && `border-color: ${props.theme.colors.textSecondary};`}
  }
`;

const AccountInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const AccountName = styled.div`
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const AccountDetails = styled.div`
  font-size: 0.8125rem;
  color: ${props => props.theme.colors.textSecondary};
`;

const AccountBalance = styled.div`
  font-weight: 700;
  color: ${props => props.theme.colors.primary};
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

const ToggleContainer = styled.div`
  display: flex;
  background: ${props => props.theme.colors.muted}4d;
  padding: 4px;
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: 8px;
`;

const ToggleOption = styled.button<{ $active: boolean }>`
  flex: 1;
  padding: 8px;
  border-radius: ${props => props.theme.borderRadius.sm};
  border: none;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: ${props => props.$active ? props.theme.colors.card : 'transparent'};
  color: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.textSecondary};
  box-shadow: ${props => props.$active ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'};

  &:hover {
    color: ${props => props.$active ? props.theme.colors.primary : props.theme.colors.text};
  }
`;

const GlCreationCard = styled.div`
  background: ${props => props.theme.colors.muted}1a;
  border: 1px dashed ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  padding: 16px;
  margin-top: 8px;
`;

const GlCreationHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const GlCreationTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 700;
  color: ${props => props.theme.colors.text};
`;

const GlCreationGrid = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr;
  gap: 12px;
  margin-bottom: 12px;
`;

const StyledInput = styled.input`
  padding: 14px 16px;
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.inputBg};
  color: ${props => props.theme.colors.text};
  font-size: 1rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
    box-shadow: 0 0 0 4px ${props => props.theme.colors.primary}1a;
  }
`;

const StyledSelect = styled.select`
  padding: 14px 16px;
  border-radius: ${props => props.theme.borderRadius.lg};
  border: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.inputBg};
  color: ${props => props.theme.colors.text};
  font-size: 1rem;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 16px center;
  background-size: 16px;

  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.primary};
  }
`;

const ReviewRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  
  &:last-child {
    border-bottom: none;
  }
`;

const ReviewLabel = styled.span`
  color: ${props => props.theme.colors.textSecondary};
  font-size: 0.875rem;
`;

const ReviewValue = styled.span`
  font-weight: 600;
  color: ${props => props.theme.colors.text};
`;

const Footer = styled.div`
  padding: 24px;
  border-top: 1px solid ${props => props.theme.colors.border};
  display: flex;
  gap: 16px;
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
    const [step, setStep] = useState<1 | 2 | 3 | 'success'>(1);
    const [banks, setBanks] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Accountant transfer states
    const [transferType, setTransferType] = useState<'bank' | 'accountant'>('bank');
    const [selectedAccountantId, setSelectedAccountantId] = useState<string>('');
    const [glAccounts, setGlAccounts] = useState<any[]>([]);
    const [selectedGlAccountId, setSelectedGlAccountId] = useState<string>('');

    // GL Account creation states
    const [isCreatingGl, setIsCreatingGl] = useState(false);
    const [newGlCode, setNewGlCode] = useState('');
    const [newGlName, setNewGlName] = useState('');
    const [isCreatingGlLoading, setIsCreatingGlLoading] = useState(false);

    const [formData, setFormData] = useState({
        source_account_id: '',
        amount: '',
        bank_code: '',
        account_number: '',
        beneficiary_name: '',
        reference: '',
        frequency: 'one-time',
        speed: 'standard'
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [banksRes, accountsRes, usersRes, glAccountsRes] = await Promise.all([
                    apiClient.getBanks(),
                    apiClient.getBankAccounts(),
                    apiClient.getUsers(),
                    apiClient.getAccountingAccounts()
                ]);
                if (banksRes.data) setBanks(banksRes.data);
                if (accountsRes.data) setAccounts(accountsRes.data);
                if (usersRes.data) {
                    // Filter for accountants or employees
                    const team = usersRes.data.filter((u: any) =>
                        u.role === 'accountant' || u.role === 'employee' || u.role === 'finance_manager'
                    );
                    setUsers(team);
                }
                if (glAccountsRes.data) setGlAccounts(glAccountsRes.data);
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

    const selectedSource = accounts.find(acc => acc.id.toString() === formData.source_account_id);
    const selectedBank = banks.find(b => b.id === formData.bank_code);
    const selectedAccountant = users.find(u => u.id.toString() === selectedAccountantId);

    const handleCreateGl = async () => {
        if (!newGlCode || !newGlName) return;
        try {
            setIsCreatingGlLoading(true);
            const res = await apiClient.createAccountingAccount({
                code: newGlCode,
                name: newGlName,
                type: 'ASSET',
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

    const nextStep = () => {
        if (step === 1) {
            if (!formData.source_account_id || !formData.amount) {
                toast.error("Please select a source account and enter an amount");
                return;
            }
            if (transferType === 'bank' && !formData.bank_code) {
                toast.error("Please select a destination bank");
                return;
            }
            if (transferType === 'accountant' && !selectedAccountantId) {
                toast.error("Please select an accountant");
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (transferType === 'bank' && (!formData.account_number || !formData.beneficiary_name)) {
                toast.error("Please enter recipient details");
                return;
            }
            // For accountant, we might not need as many fields or they can be auto-filled
            setStep(3);
        }
    };

    const prevStep = () => {
        if (step === 2) setStep(1);
        if (step === 3) setStep(2);
    };

    const handleFinalSubmit = async () => {
        try {
            setIsSubmitting(true);
            const payload: any = {
                source_account_id: parseInt(formData.source_account_id),
                amount: parseFloat(formData.amount),
                reference: formData.reference || undefined,
                transfer_type: transferType
            };

            if (transferType === 'bank') {
                payload.bank_code = formData.bank_code;
                payload.account_number = formData.account_number;
                payload.beneficiary_name = formData.beneficiary_name;
            } else {
                payload.recipient_user_id = parseInt(selectedAccountantId);
                payload.gl_account_id = selectedGlAccountId ? parseInt(selectedGlAccountId) : undefined;
                payload.beneficiary_name = selectedAccountant?.full_name || selectedAccountant?.username;
                // Add a default or system bank code for internal transfers if backend requires it
                payload.bank_code = 'INTERNAL';
                payload.account_number = `USER-${selectedAccountantId}`;
            }

            const res = await apiClient.initiateMoneyTransfer(payload);

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
                {step !== 'success' && (
                    <ProgressTracker>
                        <ProgressStep $active={step === 1} $completed={step > 1} />
                        <ProgressStep $active={step === 2} $completed={step > 2} />
                        <ProgressStep $active={step === 3} $completed={false} />
                    </ProgressTracker>
                )}

                <Header>
                    <Title>
                        {step === 'success' ? 'Transfer Complete' : 'Transfer Money'}
                    </Title>
                    <CloseButton onClick={onClose}>
                        <X size={24} />
                    </CloseButton>
                </Header>

                <FormContainer>
                    {step === 1 && (
                        <>
                            <Section>
                                <SectionLabel>Transfer Type</SectionLabel>
                                <ToggleContainer>
                                    <ToggleOption
                                        $active={transferType === 'bank'}
                                        onClick={() => setTransferType('bank')}
                                    >
                                        <Landmark size={14} style={{ marginRight: '6px' }} />
                                        External Bank
                                    </ToggleOption>
                                    <ToggleOption
                                        $active={transferType === 'accountant'}
                                        onClick={() => setTransferType('accountant')}
                                    >
                                        <User size={14} style={{ marginRight: '6px' }} />
                                        Individual Accountant
                                    </ToggleOption>
                                </ToggleContainer>
                            </Section>

                            <Section>
                                <SectionLabel>From Account</SectionLabel>
                                <InputGroup>
                                    <StyledSelect
                                        name="source_account_id"
                                        value={formData.source_account_id}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select source account</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>
                                                {acc.account_name} ({acc.bank_name} •••• {acc.account_number_last4})
                                            </option>
                                        ))}
                                    </StyledSelect>
                                </InputGroup>
                                {selectedSource && (
                                    <AccountCard $selected={true}>
                                        <AccountInfo>
                                            <AccountName>{selectedSource.account_name}</AccountName>
                                            <AccountDetails>{selectedSource.bank_name} •••• {selectedSource.account_number_last4}</AccountDetails>
                                        </AccountInfo>
                                        <AccountBalance>
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: selectedSource.currency_code }).format(125000.50)}
                                        </AccountBalance>
                                    </AccountCard>
                                )}
                            </Section>

                            <Section>
                                <SectionLabel>{transferType === 'bank' ? 'To Account (External Bank)' : 'To Accountant (Internal)'}</SectionLabel>
                                <InputGroup>
                                    {transferType === 'bank' ? (
                                        <StyledSelect
                                            name="bank_code"
                                            value={formData.bank_code}
                                            onChange={handleChange}
                                        >
                                            <option value="">Select destination bank</option>
                                            {banks.map(bank => (
                                                <option key={bank.id} value={bank.id}>{bank.name}</option>
                                            ))}
                                        </StyledSelect>
                                    ) : (
                                        <StyledSelect
                                            value={selectedAccountantId}
                                            onChange={(e) => setSelectedAccountantId(e.target.value)}
                                        >
                                            <option value="">Select accountant/employee</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>
                                                    {u.full_name || u.username} ({u.role})
                                                </option>
                                            ))}
                                        </StyledSelect>
                                    )}
                                </InputGroup>
                            </Section>

                            <Section>
                                <SectionLabel>How much would you like to send?</SectionLabel>
                                <InputGroup>
                                    <Label>Amount (ETB)</Label>
                                    <div style={{ position: 'relative' }}>
                                        <DollarSign size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: theme.colors.textSecondary }} />
                                        <StyledInput
                                            type="number"
                                            name="amount"
                                            placeholder="0.00"
                                            value={formData.amount}
                                            onChange={handleChange}
                                            style={{ paddingLeft: '44px', width: '100%', fontSize: '1.25rem', fontWeight: 700 }}
                                        />
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: theme.colors.textSecondary }}>
                                        Enter the specific amount you wish to transfer.
                                    </div>
                                </InputGroup>
                            </Section>
                        </>
                    )}

                    {step === 2 && (
                        <>
                            <Section>
                                <SectionLabel>{transferType === 'bank' ? 'Recipient Details' : 'Accountant Settings'}</SectionLabel>
                                {transferType === 'bank' ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <InputGroup>
                                            <Label>Account Number</Label>
                                            <StyledInput
                                                name="account_number"
                                                placeholder="Enter recipient account"
                                                value={formData.account_number}
                                                onChange={handleChange}
                                            />
                                        </InputGroup>
                                        <InputGroup>
                                            <Label>Recipient Name</Label>
                                            <StyledInput
                                                name="beneficiary_name"
                                                placeholder="Enter full name"
                                                value={formData.beneficiary_name}
                                                onChange={handleChange}
                                            />
                                        </InputGroup>
                                    </div>
                                ) : (
                                    <InputGroup>
                                        <Label>Accountant Number (GL Account)</Label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <StyledSelect
                                                value={selectedGlAccountId}
                                                onChange={(e) => setSelectedGlAccountId(e.target.value)}
                                                style={{ flex: 1 }}
                                            >
                                                <option value="">Select GL Account</option>
                                                {glAccounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>
                                                ))}
                                            </StyledSelect>
                                            <Button
                                                onClick={() => setIsCreatingGl(!isCreatingGl)}
                                                style={{ flex: '0 0 auto', width: 'auto', padding: '0 16px' }}
                                            >
                                                {isCreatingGl ? 'Cancel' : 'Create New'}
                                            </Button>
                                        </div>

                                        {isCreatingGl && (
                                            <GlCreationCard>
                                                <GlCreationHeader>
                                                    <GlCreationTitle>Quick Create Accountant Number</GlCreationTitle>
                                                </GlCreationHeader>
                                                <GlCreationGrid>
                                                    <StyledInput
                                                        placeholder="Code"
                                                        value={newGlCode}
                                                        onChange={(e) => setNewGlCode(e.target.value)}
                                                    />
                                                    <StyledInput
                                                        placeholder="Account Name (e.g. Salary Account - John)"
                                                        value={newGlName}
                                                        onChange={(e) => setNewGlName(e.target.value)}
                                                    />
                                                </GlCreationGrid>
                                                <Button
                                                    $primary
                                                    onClick={handleCreateGl}
                                                    disabled={isCreatingGlLoading || !newGlCode || !newGlName}
                                                    style={{ width: '100%', padding: '10px' }}
                                                >
                                                    {isCreatingGlLoading ? <Loader2 className="animate-spin" size={16} /> : "Create & Select"}
                                                </Button>
                                            </GlCreationCard>
                                        )}
                                    </InputGroup>
                                )}
                            </Section>

                            <Section>
                                <SectionLabel>Options</SectionLabel>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                    <InputGroup>
                                        <Label>Frequency</Label>
                                        <StyledSelect name="frequency" value={formData.frequency} onChange={handleChange}>
                                            <option value="one-time">One-time</option>
                                            <option value="weekly">Weekly</option>
                                            <option value="monthly">Monthly</option>
                                        </StyledSelect>
                                    </InputGroup>
                                    <InputGroup>
                                        <Label>Transfer Speed</Label>
                                        <StyledSelect name="speed" value={formData.speed} onChange={handleChange}>
                                            <option value="standard">Standard (Free)</option>
                                            <option value="express">Express (5.00 Br)</option>
                                        </StyledSelect>
                                    </InputGroup>
                                </div>
                                <InputGroup>
                                    <Label>Memo</Label>
                                    <StyledInput
                                        name="reference"
                                        placeholder="Add a note (optional)"
                                        value={formData.reference}
                                        onChange={handleChange}
                                    />
                                </InputGroup>
                            </Section>
                        </>
                    )}

                    {step === 3 && (
                        <Section>
                            <SectionLabel>Review Transaction</SectionLabel>
                            <div style={{ background: `${theme.colors.muted}4d`, borderRadius: theme.borderRadius.lg, padding: '20px' }}>
                                <ReviewRow>
                                    <ReviewLabel>From</ReviewLabel>
                                    <ReviewValue>{selectedSource?.account_name}</ReviewValue>
                                </ReviewRow>
                                <ReviewRow>
                                    <ReviewLabel>To</ReviewLabel>
                                    <ReviewValue>
                                        {transferType === 'bank'
                                            ? `${formData.beneficiary_name} (${selectedBank?.name})`
                                            : `${selectedAccountant?.full_name || selectedAccountant?.username} (Internal Accountant)`
                                        }
                                    </ReviewValue>
                                </ReviewRow>
                                <ReviewRow>
                                    <ReviewLabel>{transferType === 'bank' ? 'Account Number' : 'Accountant Number'}</ReviewLabel>
                                    <ReviewValue>
                                        {transferType === 'bank'
                                            ? formData.account_number
                                            : glAccounts.find((g: any) => g.id.toString() === selectedGlAccountId)?.code || 'Internal Transfer'
                                        }
                                    </ReviewValue>
                                </ReviewRow>
                                <ReviewRow>
                                    <ReviewLabel>Amount</ReviewLabel>
                                    <ReviewValue style={{ fontSize: '1.25rem', color: theme.colors.primary }}>
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(parseFloat(formData.amount))}
                                    </ReviewValue>
                                </ReviewRow>
                                <ReviewRow>
                                    <ReviewLabel>Frequency</ReviewLabel>
                                    <ReviewValue style={{ textTransform: 'capitalize' }}>{formData.frequency}</ReviewValue>
                                </ReviewRow>
                                <ReviewRow>
                                    <ReviewLabel>Memo</ReviewLabel>
                                    <ReviewValue>{formData.reference || 'None'}</ReviewValue>
                                </ReviewRow>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', background: `${theme.colors.primary}0d`, padding: '16px', borderRadius: theme.borderRadius.md, border: `1px solid ${theme.colors.primary}26` }}>
                                <Info size={20} color={theme.colors.primary} style={{ flexShrink: 0 }} />
                                <p style={{ fontSize: '0.8125rem', color: theme.colors.textSecondary, margin: 0 }}>
                                    Your transfer will be processed immediately. Once sent, it cannot be canceled.
                                </p>
                            </div>
                        </Section>
                    )}

                    {step === 'success' && (
                        <SuccessView>
                            <div style={{ width: '80px', height: '80px', background: `${theme.colors.primary}1a`, borderRadius: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                                <CheckCircle2 size={48} color={theme.colors.primary} />
                            </div>
                            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>Sent!</h3>
                            <p style={{ color: theme.colors.textSecondary, marginBottom: '32px' }}>
                                Your transfer of <span style={{ fontWeight: 700, color: theme.colors.text }}>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(parseFloat(formData.amount))}</span> to {formData.beneficiary_name} is on its way.
                            </p>
                            <Button $primary style={{ width: '100%' }} onClick={() => { onSuccess(); onClose(); }}>
                                Done
                            </Button>
                        </SuccessView>
                    )}
                </FormContainer>

                {step !== 'success' && (
                    <Footer>
                        {step > 1 ? (
                            <Button onClick={prevStep} style={{ flex: 0.4 }}>
                                <ArrowLeft size={18} /> Back
                            </Button>
                        ) : (
                            <Button onClick={onClose} style={{ flex: 0.4 }}>Cancel</Button>
                        )}

                        {step < 3 ? (
                            <Button $primary onClick={nextStep}>
                                Continue <ArrowRight size={18} />
                            </Button>
                        ) : (
                            <Button $primary onClick={handleFinalSubmit} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><Send size={18} /> Send {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'ETB' }).format(parseFloat(formData.amount))}</>}
                            </Button>
                        )}
                    </Footer>
                )}
            </ModalContent>
        </ModalOverlay >
    );
};
