'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styled, { useTheme } from 'styled-components';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  CreditCard,
  AlertCircle,
  User,
  Calendar,
  Building,
  FileText,
  Edit,
  Trash2,
  Loader2,
  Tag,
  ExternalLink,
} from 'lucide-react';
import Layout from '@/components/layout';
import apiClient from '@/lib/api';
import { useAuth } from '@/lib/rbac/auth-context';
import { useUserStore } from '@/store/userStore';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import CommentSection from '@/components/common/CommentSection';

const PRIMARY_COLOR = (props: any) => props.theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = (props: any) => props.theme.colors.textDark;
const TEXT_COLOR_MUTED = (props: any) => props.theme.colors.textSecondary || '#666';
const BORDER_COLOR = (props: any) => props.theme.colors.border;
const BACKGROUND_CARD = (props: any) => props.theme.colors.background || '#ffffff';
const BACKGROUND_PAGE = (props: any) => props.theme.colors.backgroundSecondary || '#f5f6fa';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 980px;
  margin-left: auto;
  margin-right: 0;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.sm} ${props => props.theme.spacing.sm};
`;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${TEXT_COLOR_MUTED};
  text-decoration: none;
  margin-bottom: ${props => props.theme.spacing.md};
  transition: color ${props => props.theme.transitions.default};

  &:hover {
    color: ${TEXT_COLOR_DARK};
  }
`;

const HeaderSection = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const HeaderContent = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: ${props => props.theme.spacing.md};
  flex-wrap: wrap;
`;

const HeaderText = styled.div`
  flex: 1;
  
  h1 {
    font-size: clamp(24px, 3vw, 36px);
    font-weight: ${props => props.theme.typography.fontWeights.bold};
    margin: 0 0 ${props => props.theme.spacing.xs};
    color: ${TEXT_COLOR_DARK};
  }

  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${props => props.theme.typography.fontSizes.md};
    margin: 0;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  flex-wrap: wrap;
`;

const Card = styled.div`
  background: ${BACKGROUND_CARD};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${BORDER_COLOR};
  padding: ${props => props.theme.spacing.lg};
  box-shadow: ${props => props.theme.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.03), inset 0 0 0 1px rgba(0, 0, 0, 0.02)'};
  margin-bottom: ${props => props.theme.spacing.lg};
`;

const CardTitle = styled.h2`
  font-size: ${props => props.theme.typography.fontSizes.lg};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0 0 ${props => props.theme.spacing.md};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
`;

const StatusBadge = styled.span<{ $status: boolean }>`
  display: inline-flex;
  align-items: center;
  padding: ${props => props.theme.spacing.xs} ${props => props.theme.spacing.md};
  border-radius: 999px;
  font-size: ${props => props.theme.typography.fontSizes.xs};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background-color: ${props => props.$status ? (props.theme.mode === 'dark' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.12)') : (props.theme.mode === 'dark' ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.12)')};
  color: ${props => props.$status ? (props.theme.mode === 'dark' ? '#6ee7b7' : '#065f46') : (props.theme.mode === 'dark' ? '#fcd34d' : '#b45309')};
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: ${props => props.theme.spacing.md};

  @media (min-width: 768px) {
    grid-template-columns: 1fr 1fr;
  }
`;

const InfoItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${props => props.theme.spacing.md};
`;

const IconWrapper = styled.div`
  color: ${TEXT_COLOR_MUTED};
  flex-shrink: 0;
  margin-top: 2px;
`;

const InfoContent = styled.div`
  flex: 1;
  
  p:first-child {
    font-size: ${props => props.theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
    margin: 0 0 ${props => props.theme.spacing.xs};
  }

  p:last-child {
    font-size: ${props => props.theme.typography.fontSizes.sm};
    font-weight: ${props => props.theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_DARK};
    margin: 0;
    word-break: break-word;
  }
`;

const Description = styled.div`
  padding: ${props => props.theme.spacing.md};
  background: ${BACKGROUND_PAGE};
  border-radius: ${props => props.theme.borderRadius.md};
  margin-top: ${props => props.theme.spacing.md};
  
  p {
    margin: 0;
    color: ${TEXT_COLOR_DARK};
    line-height: 1.6;
  }
`;

const ErrorBanner = styled.div`
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)'};
  border: 1px solid ${props => props.theme.mode === 'dark' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
  border-radius: ${props => props.theme.borderRadius.md};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.mode === 'dark' ? '#fca5a5' : '#dc2626'};
  margin-bottom: ${props => props.theme.spacing.md};
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: ${props => props.theme.spacing.md};
  
  p {
    color: ${TEXT_COLOR_MUTED};
    font-size: ${props => props.theme.typography.fontSizes.md};
  }
`;

const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid ${BORDER_COLOR};
  border-top-color: ${PRIMARY_COLOR};
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const AmountDisplay = styled.div`
  font-size: ${props => props.theme.typography.fontSizes.xxl};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  color: ${PRIMARY_COLOR};
  margin: ${props => props.theme.spacing.md} 0;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: ${props => props.theme.mode === 'dark' ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)'};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
`;

const ModalContent = styled.div`
  background: ${BACKGROUND_CARD};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${BORDER_COLOR};
  padding: ${props => props.theme.spacing.xl};
  max-width: 500px;
  width: 90%;
  box-shadow: ${props => props.theme.mode === 'dark' ? '0 20px 50px rgba(0, 0, 0, 0.6)' : '0 20px 50px rgba(0, 0, 0, 0.3)'};
`;

const ModalTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSizes.lg};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0 0 ${props => props.theme.spacing.lg};
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: ${props => props.theme.spacing.md};
  border: 1px solid ${BORDER_COLOR};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${BACKGROUND_CARD};
  color: ${TEXT_COLOR_DARK};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  font-family: inherit;
  resize: vertical;
  min-height: 120px;
  margin-bottom: ${props => props.theme.spacing.md};
  
  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
  }
`;

const PasswordInput = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing.md};
  border: 1px solid ${BORDER_COLOR};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${BACKGROUND_CARD};
  color: ${TEXT_COLOR_DARK};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  font-family: inherit;
  margin-bottom: ${props => props.theme.spacing.md};
  
  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px ${PRIMARY_COLOR}15;
  }
`;

const FormGroup = styled.div`
  margin-bottom: ${props => props.theme.spacing.md};
`;

const Label = styled.label`
  display: block;
  font-size: ${props => props.theme.typography.fontSizes.sm};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
  margin-bottom: ${props => props.theme.spacing.xs};
`;

const ErrorText = styled.p`
  color: ${props => props.theme.mode === 'dark' ? '#fca5a5' : '#dc2626'};
  font-size: ${props => props.theme.typography.fontSizes.xs};
  margin-top: ${props => props.theme.spacing.xs};
  margin-bottom: 0;
`;

const WarningBox = styled.div`
  padding: ${props => props.theme.spacing.md};
  background-color: ${props => props.theme.mode === 'dark' ? 'rgba(251, 191, 36, 0.15)' : 'rgba(251, 191, 36, 0.1)'};
  border: 1px solid ${props => props.theme.mode === 'dark' ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 191, 36, 0.3)'};
  border-radius: ${props => props.theme.borderRadius.md};
  margin-bottom: ${props => props.theme.spacing.md};
  
  p {
    margin: 0;
    color: ${TEXT_COLOR_DARK};
    font-size: ${props => props.theme.typography.fontSizes.sm};
    line-height: 1.5;
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  justify-content: flex-end;
`;

interface ExpenseDetail {
  id: number;
  title: string;
  description?: string;
  amount: number;
  category: string;
  vendor?: string;
  date: string;
  is_recurring: boolean;
  recurring_frequency?: string;
  attachment_url?: string;
  receipt_url?: string;
  created_by_id: number;
  created_at: string;
  updated_at?: string;
  is_approved: boolean;
  approved_by_id?: number;
  approved_at?: string;
}

interface Approval {
  id: number;
  expense_entry_id?: number | null;
}

interface StoreUser {
  id: number | string;
  name?: string | null;
  full_name?: string | null;
  email?: string | null;
}

export default function ExpenseDetailPage() {
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();
  const expenseId = params?.id ? parseInt(params.id as string, 10) : null;
  const { user } = useAuth();
  const { canApproveTransactions, allUsers, fetchAllUsers } = useUserStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectPassword, setRejectPassword] = useState('');
  const [rejectPasswordError, setRejectPasswordError] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deletePasswordError, setDeletePasswordError] = useState<string | null>(null);
  const [relatedApprovalId, setRelatedApprovalId] = useState<number | null>(null);

  const canApprove = () => {
    if (canApproveTransactions()) return true;
    if (!user) return false;
    const role = user.role?.toLowerCase();
    return role === 'admin' || role === 'super_admin' || role === 'manager' || role === 'finance_manager';
  };

  const canEdit = () => {
    if (!expense || !user) return false;
    const role = user.role?.toLowerCase();
    const isOwner = expense.created_by_id === parseInt(user.id);
    const isAdmin = role === 'admin' || role === 'super_admin';
    return isOwner || isAdmin;
  };

  const loadExpense = useCallback(async () => {
    if (!expenseId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getExpense(expenseId);
      setExpense(response.data as unknown as ExpenseDetail);
    } catch (err: unknown) {
      const errorMessage =
        (err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) || 'Failed to load expense details';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [expenseId]);

  const loadRelatedApproval = useCallback(async () => {
    if (!expenseId) return;

    try {
      // Fetch all approvals and find one linked to this expense
      const response = await apiClient.getApprovals();
      const approvals: Approval[] = Array.isArray(response.data)
        ? (response.data as unknown as Approval[])
        : [];
      const relatedApproval = approvals.find((a) => a.expense_entry_id === expenseId);
      if (relatedApproval) {
        setRelatedApprovalId(relatedApproval.id);
      }
    } catch {
      // Silently fail - approval lookup is optional
      setRelatedApprovalId(null);
    }
  }, [expenseId]);

  useEffect(() => {
    if (expenseId) {
      loadExpense();
      loadRelatedApproval();
    }
    if (allUsers.length === 0) {
      fetchAllUsers();
    }
  }, [allUsers.length, expenseId, fetchAllUsers, loadExpense, loadRelatedApproval]);

  const handleApprove = async () => {
    if (!expenseId || !canApprove()) {
      toast.error('You do not have permission to approve expenses');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      await apiClient.approveItem(expenseId, 'expense');
      toast.success('Expense entry approved successfully');
      await loadExpense();
    } catch (err: unknown) {
      const errorMessage =
        (err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) || 'Failed to approve expense';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (reason: string, password: string) => {
    if (!expenseId || !canApprove()) {
      toast.error('You do not have permission to reject expenses');
      return;
    }

    if (!reason.trim()) {
      setRejectPasswordError('Please provide a rejection reason');
      return;
    }

    if (reason.trim().length < 10) {
      setRejectPasswordError('Rejection reason must be at least 10 characters long');
      return;
    }

    if (!password.trim()) {
      setRejectPasswordError('Password is required');
      return;
    }

    setProcessing(true);
    setError(null);
    setRejectPasswordError(null);

    try {
      await apiClient.rejectItem(expenseId, 'expense', reason, password.trim());
      toast.success('Expense entry rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      setRejectPassword('');
      await loadExpense();
    } catch (err: unknown) {
      const errorMessage =
        (err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) || 'Failed to reject expense';
      setRejectPasswordError(errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (password: string) => {
    if (!expenseId || !expense) return;

    if (!password.trim()) {
      setDeletePasswordError('Password is required');
      return;
    }

    setDeleting(true);
    setError(null);
    setDeletePasswordError(null);

    try {
      await apiClient.deleteExpense(expenseId, password.trim());
      toast.success('Expense entry deleted successfully');
      setShowDeleteModal(false);
      setDeletePassword('');
      router.push('/expenses/list');
    } catch (err: unknown) {
      const errorMessage =
        (err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { detail?: string } } }).response?.data?.detail
          : undefined) || 'Failed to delete expense';
      setDeletePasswordError(errorMessage);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setDeleting(false);
    }
  };

  const getUserName = (userId: number) => {
    if (!allUsers || allUsers.length === 0) {
      return `User #${userId}`;
    }
    const userIdStr = userId.toString();
    const foundUser = (allUsers as StoreUser[]).find((u) => {
      if (u.id === userId) return true;
      if (typeof u.id === 'string' && u.id === userIdStr) return true;
      const parsed = Number(u.id);
      return !Number.isNaN(parsed) && parsed === userId;
    });
    if (!foundUser) {
      return `User #${userId}`;
    }
    return foundUser.name || foundUser.full_name || foundUser.email || `User #${userId}`;
  };

  const getCategoryDisplayName = (category: string) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <Layout>
        <PageContainer>
          <LoadingContainer>
            <Spinner />
            <p>Loading expense details...</p>
          </LoadingContainer>
        </PageContainer>
      </Layout>
    );
  }

  if (error && !expense) {
    return (
      <Layout>
        <PageContainer>
          <BackLink href="/expenses/list">
            <ArrowLeft size={16} />
            Back to Expenses
          </BackLink>
          <ErrorBanner>
            <AlertCircle size={16} />
            <span>{error}</span>
          </ErrorBanner>
        </PageContainer>
      </Layout>
    );
  }

  if (!expense) {
    return null;
  }

  return (
    <Layout>
      <PageContainer>
        <HeaderSection>
          <BackLink href="/expenses/list">
            <ArrowLeft size={16} />
            Back to Expenses
          </BackLink>

          <HeaderContent>
            <HeaderText>
              <div style={{ display: 'flex', alignItems: 'center', gap: theme.spacing.md, flexWrap: 'wrap' }}>
                <h1>{expense.title}</h1>
                <StatusBadge $status={expense.is_approved}>
                  {expense.is_approved ? 'APPROVED' : 'PENDING'}
                </StatusBadge>
              </div>
              <p>Expense Entry #{expense.id}</p>
            </HeaderText>

            <ActionButtons>
              {!expense.is_approved && canApprove() && (
                <>
                  <Button
                    onClick={handleApprove}
                    disabled={processing}
                    style={{ backgroundColor: PRIMARY_COLOR({ theme }), color: '#fff' }}
                  >
                    {processing ? (
                      <>
                        <Loader2 size={16} style={{ marginRight: theme.spacing.sm }} className="animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} style={{ marginRight: theme.spacing.sm }} />
                        Approve
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setShowRejectModal(true)}
                    disabled={processing}
                  >
                    <XCircle size={16} style={{ marginRight: theme.spacing.sm }} />
                    Reject
                  </Button>
                </>
              )}

              {canEdit() && (
                <Button
                  variant="outline"
                  onClick={() => router.push(`/expenses/edit/${expenseId}`)}
                  disabled={processing || deleting}
                >
                  <Edit size={16} style={{ marginRight: theme.spacing.sm }} />
                  Edit
                </Button>
              )}

              {canEdit() && (
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowDeleteModal(true);
                    setDeletePassword('');
                    setDeletePasswordError(null);
                  }}
                  disabled={processing || deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 size={16} style={{ marginRight: theme.spacing.sm }} className="animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} style={{ marginRight: theme.spacing.sm }} />
                      Delete
                    </>
                  )}
                </Button>
              )}
            </ActionButtons>
          </HeaderContent>
        </HeaderSection>

        {error && (
          <ErrorBanner>
            <AlertCircle size={16} />
            <span>{error}</span>
          </ErrorBanner>
        )}

        <Card>
          <CardTitle>
            <CreditCard size={20} />
            Expense Information
          </CardTitle>

          <AmountDisplay>
            {formatCurrency(expense.amount)}
          </AmountDisplay>

          <InfoGrid>
            <InfoItem>
              <IconWrapper>
                <Tag size={20} />
              </IconWrapper>
              <InfoContent>
                <p>Category</p>
                <p>{getCategoryDisplayName(expense.category)}</p>
              </InfoContent>
            </InfoItem>

            {expense.vendor && (
              <InfoItem>
                <IconWrapper>
                  <Building size={20} />
                </IconWrapper>
                <InfoContent>
                  <p>Vendor</p>
                  <p>{expense.vendor}</p>
                </InfoContent>
              </InfoItem>
            )}

            <InfoItem>
              <IconWrapper>
                <Calendar size={20} />
              </IconWrapper>
              <InfoContent>
                <p>Date</p>
                <p>{formatDateTime(expense.date)}</p>
              </InfoContent>
            </InfoItem>

            <InfoItem>
              <IconWrapper>
                <User size={20} />
              </IconWrapper>
              <InfoContent>
                <p>Created By</p>
                <p>{getUserName(expense.created_by_id)}</p>
              </InfoContent>
            </InfoItem>

            {expense.is_recurring && (
              <InfoItem>
                <IconWrapper>
                  <Clock size={20} />
                </IconWrapper>
                <InfoContent>
                  <p>Recurring</p>
                  <p>{expense.recurring_frequency ? getCategoryDisplayName(expense.recurring_frequency) : 'Yes'}</p>
                </InfoContent>
              </InfoItem>
            )}

            {expense.approved_by_id && (
              <InfoItem>
                <IconWrapper>
                  <CheckCircle size={20} />
                </IconWrapper>
                <InfoContent>
                  <p>Approved By</p>
                  <p>{getUserName(expense.approved_by_id)}</p>
                </InfoContent>
              </InfoItem>
            )}

            {expense.approved_at && (
              <InfoItem>
                <IconWrapper>
                  <Calendar size={20} />
                </IconWrapper>
                <InfoContent>
                  <p>Approved At</p>
                  <p>{formatDateTime(expense.approved_at)}</p>
                </InfoContent>
              </InfoItem>
            )}

            <InfoItem>
              <IconWrapper>
                <Calendar size={20} />
              </IconWrapper>
              <InfoContent>
                <p>Created</p>
                <p>{formatDateTime(expense.created_at)}</p>
              </InfoContent>
            </InfoItem>

            {expense.updated_at && expense.updated_at !== expense.created_at && (
              <InfoItem>
                <IconWrapper>
                  <Calendar size={20} />
                </IconWrapper>
                <InfoContent>
                  <p>Last Updated</p>
                  <p>{formatDateTime(expense.updated_at)}</p>
                </InfoContent>
              </InfoItem>
            )}
          </InfoGrid>

          {expense.description && (
            <Description>
              <p>{expense.description}</p>
            </Description>
          )}

          {(expense.receipt_url || expense.attachment_url) && (
            <div style={{ marginTop: theme.spacing.md, display: 'flex', flexDirection: 'column', gap: theme.spacing.sm }}>
              {expense.receipt_url && (
                <a
                  href={expense.receipt_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    color: PRIMARY_COLOR({ theme }),
                    textDecoration: 'none',
                    fontSize: theme.typography.fontSizes.sm,
                  }}
                >
                  <FileText size={16} />
                  View Receipt
                  <ExternalLink size={14} />
                </a>
              )}
              {expense.attachment_url && (
                <a
                  href={expense.attachment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: theme.spacing.sm,
                    color: PRIMARY_COLOR({ theme }),
                    textDecoration: 'none',
                    fontSize: theme.typography.fontSizes.sm,
                  }}
                >
                  <FileText size={16} />
                  View Attachment
                  <ExternalLink size={14} />
                </a>
              )}
            </div>
          )}

          {relatedApprovalId && (
            <div style={{ marginTop: theme.spacing.md }}>
              <Button
                variant="outline"
                onClick={() => router.push(`/approvals/${relatedApprovalId}`)}
              >
                <FileText size={16} style={{ marginRight: theme.spacing.sm }} />
                View Approval Workflow
              </Button>
            </div>
          )}
        </Card>

        {/* Rejection Modal */}
        {showRejectModal && (
          <ModalOverlay onClick={() => {
            setShowRejectModal(false);
            setRejectionReason('');
            setRejectPassword('');
            setRejectPasswordError(null);
          }}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalTitle>Reject Expense Entry</ModalTitle>
              <WarningBox>
                <p>
                  <strong>Warning:</strong> You are about to reject this expense entry. This action cannot be undone.
                  Please enter your own password to verify this action.
                </p>
              </WarningBox>
              <FormGroup>
                <Label htmlFor="reject-reason">
                  Rejection Reason (minimum 10 characters):
                </Label>
                <TextArea
                  id="reject-reason"
                  value={rejectionReason}
                  onChange={(e) => {
                    setRejectionReason(e.target.value);
                    setRejectPasswordError(null);
                  }}
                  placeholder="Please provide a reason for rejection (minimum 10 characters)..."
                  rows={4}
                />
              </FormGroup>
              <FormGroup>
                <Label htmlFor="reject-password">
                  Enter your own password to confirm rejection:
                </Label>
                <PasswordInput
                  id="reject-password"
                  type="password"
                  value={rejectPassword}
                  onChange={(e) => {
                    setRejectPassword(e.target.value);
                    setRejectPasswordError(null);
                  }}
                  placeholder="Enter your password"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && rejectionReason.trim().length >= 10 && rejectPassword.trim()) {
                      handleReject(rejectionReason, rejectPassword);
                    }
                  }}
                />
                {rejectPasswordError && (
                  <ErrorText>{rejectPasswordError}</ErrorText>
                )}
              </FormGroup>
              <ModalActions>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                    setRejectPassword('');
                    setRejectPasswordError(null);
                  }}
                  disabled={processing}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleReject(rejectionReason, rejectPassword)}
                  disabled={!rejectionReason.trim() || rejectionReason.trim().length < 10 || !rejectPassword.trim() || processing}
                >
                  {processing ? (
                    <>
                      <Loader2 size={16} style={{ marginRight: theme.spacing.xs }} />
                      Rejecting...
                    </>
                  ) : (
                    'Reject'
                  )}
                </Button>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}

        {/* Delete Modal with Password Verification */}
        {showDeleteModal && (
          <ModalOverlay onClick={() => {
            setShowDeleteModal(false);
            setDeletePassword('');
            setDeletePasswordError(null);
          }}>
            <ModalContent onClick={(e) => e.stopPropagation()}>
              <ModalTitle>Delete Expense Entry</ModalTitle>
              <WarningBox>
                <p>
                  <strong>Warning:</strong> You are about to permanently delete this expense entry.
                  This action cannot be undone. Please enter your password to confirm this deletion.
                </p>
              </WarningBox>
              <FormGroup>
                <Label htmlFor="delete-password">
                  Enter your password to confirm deletion:
                </Label>
                <PasswordInput
                  id="delete-password"
                  type="password"
                  value={deletePassword}
                  onChange={(e) => {
                    setDeletePassword(e.target.value);
                    setDeletePasswordError(null);
                  }}
                  placeholder="Enter your password"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && deletePassword.trim()) {
                      handleDelete(deletePassword);
                    }
                  }}
                />
                {deletePasswordError && (
                  <ErrorText>{deletePasswordError}</ErrorText>
                )}
              </FormGroup>
              <ModalActions>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                    setDeletePasswordError(null);
                  }}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(deletePassword)}
                  disabled={!deletePassword.trim() || deleting}
                >
                  {deleting ? (
                    <>
                      <Loader2 size={16} style={{ marginRight: theme.spacing.xs }} />
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </Button>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}
      </PageContainer>
    </Layout>
  );
}

