"use client";

import { useState, useEffect } from 'react';
import { apiClient, Feedback, FeedbackStats } from '@/lib/api';
import Layout from '@/components/layout';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Star,
    Filter,
    TrendingUp,
    MessageSquare,
    CheckCircle,
    Clock,
    Archive,
    Trash2,
    Edit,
    X,
    Save,
    AlertCircle
} from 'lucide-react';

// --- Animations ---
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
`;

const shimmer = keyframes`
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
`;

// --- Styled Components ---
const PageWrapper = styled.div`
  min-height: 100vh;
  background: ${props => props.theme.colors.background};
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
  margin-bottom: ${props => props.theme.spacing.xxl};
  animation: ${fadeIn} 0.5s ease-out;
  
  h1 {
    font-size: 2.5rem;
    font-weight: 900;
    color: ${props => props.theme.colors.textDark};
    letter-spacing: -1px;
    margin-bottom: 8px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  p {
    color: ${props => props.theme.colors.textSecondary};
    font-size: 1.1rem;
    font-weight: 600;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
`;

const StatCard = styled(motion.div) <{ $color: string }>`
  background: ${props => props.theme.colors.card};
  border-radius: 20px;
  padding: 28px;
  border: 1px solid ${props => props.theme.colors.border};
  box-shadow: ${props => props.theme.shadows.sm};
  position: relative;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => props.$color};
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: ${props => props.theme.shadows.md};
  }

  .content {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .info {
      .label {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: ${props => props.theme.colors.textSecondary};
        margin-bottom: 8px;
      }
      
      .value {
        font-size: 2.5rem;
        font-weight: 900;
        color: ${props => props.theme.colors.textDark};
        line-height: 1;
      }
    }

    .icon {
      width: 56px;
      height: 56px;
      border-radius: 14px;
      background: ${props => props.$color}15;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${props => props.$color};
      animation: ${float} 3s ease-in-out infinite;
    }
  }
`;

const FilterSection = styled.div`
  background: ${props => props.theme.colors.card};
  border-radius: 20px;
  padding: 28px;
  border: 1px solid ${props => props.theme.colors.border};
  box-shadow: ${props => props.theme.shadows.sm};
  margin-bottom: 24px;

  .filter-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;

    h2 {
      font-size: 1.25rem;
      font-weight: 800;
      color: ${props => props.theme.colors.textDark};
      margin: 0;
    }

    svg {
      color: ${props => props.theme.colors.textSecondary};
    }
  }

  .filter-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }
`;

const FilterGroup = styled.div`
  label {
    display: block;
    font-size: 0.875rem;
    font-weight: 700;
    color: ${props => props.theme.colors.textDark};
    margin-bottom: 8px;
  }

  select {
    width: 100%;
    padding: 12px 16px;
    border: 1px solid ${props => props.theme.colors.border};
    border-radius: 12px;
    font-size: 0.9375rem;
    font-weight: 600;
    color: ${props => props.theme.colors.textDark};
    background: ${props => props.theme.colors.card};
    transition: all 0.2s;
    cursor: pointer;

    &:hover {
      border-color: #667eea;
    }

    &:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }
`;

const FeedbackListCard = styled.div`
  background: ${props => props.theme.colors.card};
  border-radius: 20px;
  border: 1px solid ${props => props.theme.colors.border};
  box-shadow: ${props => props.theme.shadows.sm};
  overflow: hidden;

  .list-header {
    padding: 24px 28px;
    border-bottom: 1px solid ${props => props.theme.colors.border};
    background: ${props => props.theme.colors.backgroundSecondary};

    h2 {
      font-size: 1.5rem;
      font-weight: 800;
      color: ${props => props.theme.colors.textDark};
      margin: 0;
    }
  }
`;

const LoadingState = styled.div`
  padding: 80px 20px;
  text-align: center;

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid #e4e9f2;
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 20px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  p {
    color: ${props => props.theme.colors.textSecondary};
    font-weight: 600;
    font-size: 1rem;
  }
`;

const EmptyState = styled.div`
  padding: 80px 20px;
  text-align: center;

  svg {
    color: #cbd5e0;
    margin: 0 auto 20px;
  }

  p {
    color: ${props => props.theme.colors.textSecondary};
    font-weight: 600;
    font-size: 1rem;
  }
`;

const FeedbackItem = styled(motion.div)`
  padding: 24px 28px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  cursor: pointer;
  transition: all 0.2s;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: ${props => props.theme.colors.backgroundSecondary};
  }

  .item-content {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 20px;

    .item-main {
      flex: 1;

      .item-meta {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        flex-wrap: wrap;

        .stars {
          display: flex;
          gap: 2px;
        }
      }

      .item-message {
        color: ${props => props.theme.colors.textDark};
        font-size: 0.9375rem;
        font-weight: 500;
        line-height: 1.6;
        margin-bottom: 12px;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .item-footer {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 0.8125rem;
        color: ${props => props.theme.colors.textSecondary};
        font-weight: 600;

        span {
          display: flex;
          align-items: center;
          gap: 4px;
        }
      }
    }

    .item-action {
      color: ${props => props.theme.colors.textSecondary};
      transition: all 0.2s;
    }
  }

  &:hover .item-action {
    color: #667eea;
    transform: translateX(4px);
  }
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: capitalize;
  
  ${props => {
        switch (props.$status) {
            case 'new':
                return `
          background: #dbeafe;
          color: #1e40af;
        `;
            case 'reviewed':
                return `
          background: #fef3c7;
          color: #92400e;
        `;
            case 'resolved':
                return `
          background: #d1fae5;
          color: #065f46;
        `;
            case 'archived':
                return `
          background: #e5e7eb;
          color: #374151;
        `;
            default:
                return `
          background: #e5e7eb;
          color: #374151;
        `;
        }
    }}
`;

const CategoryBadge = styled.span`
  font-size: 0.75rem;
  font-weight: 700;
  color: ${props => props.theme.colors.textSecondary};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  z-index: 1000;
`;

const ModalContent = styled(motion.div)`
  background: ${props => props.theme.colors.card};
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 700px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;

  .modal-header {
    padding: 28px;
    border-bottom: 1px solid ${props => props.theme.colors.border};
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: sticky;
    top: 0;
    background: ${props => props.theme.colors.card};
    z-index: 10;

    h2 {
      font-size: 1.75rem;
      font-weight: 900;
      color: ${props => props.theme.colors.textDark};
      margin: 0;
    }

    button {
      padding: 8px;
      border: none;
      background: ${props => props.theme.colors.muted};
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      color: ${props => props.theme.colors.textDark};

      &:hover {
        background: ${props => props.theme.colors.border};
        transform: scale(1.05);
      }
    }
  }

  .modal-body {
    padding: 28px;

    .section {
      margin-bottom: 28px;

      &:last-child {
        margin-bottom: 0;
      }

      h3 {
        font-size: 0.875rem;
        font-weight: 800;
        color: ${props => props.theme.colors.textDark};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 12px;
      }

      .content {
        background: ${props => props.theme.colors.muted};
        padding: 16px;
        border-radius: 12px;
        color: ${props => props.theme.colors.textDark};
        font-weight: 500;
        line-height: 1.6;
        white-space: pre-wrap;
      }

      .info {
        color: ${props => props.theme.colors.textSecondary};
        font-weight: 600;
        line-height: 1.6;

        .highlight {
          color: ${props => props.theme.colors.textDark};
          font-weight: 700;
        }
      }

      select, textarea {
        width: 100%;
        padding: 14px 16px;
        border: 1px solid ${props => props.theme.colors.border};
        border-radius: 12px;
        font-size: 0.9375rem;
        font-weight: 600;
        color: ${props => props.theme.colors.textDark};
        background: ${props => props.theme.colors.card};
        font-family: inherit;
        transition: all 0.2s;

        &:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
      }

      textarea {
        resize: none;
        font-weight: 500;
      }
    }

    .actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 24px;
      border-top: 1px solid ${props => props.theme.colors.border};
      margin-top: 28px;
    }
  }
`;

const Button = styled.button<{ $variant?: 'primary' | 'danger' }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: none;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  ${props => props.$variant === 'danger' ? `
    background: #dc2626;
    color: white;

    &:hover:not(:disabled) {
      background: #b91c1c;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
    }
  ` : `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;

    &:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
    }
  `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid white;
    border-top-color: transparent;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
`;

const STATUS_OPTIONS = [
    { value: 'all', label: 'All Status' },
    { value: 'new', label: 'New' },
    { value: 'reviewed', label: 'Reviewed' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'archived', label: 'Archived' },
];

const RATING_OPTIONS = [
    { value: 'all', label: 'All Ratings' },
    { value: '5', label: '5 Stars' },
    { value: '4', label: '4 Stars' },
    { value: '3', label: '3 Stars' },
    { value: '2', label: '2 Stars' },
    { value: '1', label: '1 Star' },
];

const CATEGORY_OPTIONS = [
    { value: 'all', label: 'All Categories' },
    { value: 'general', label: 'General' },
    { value: 'ui_ux', label: 'UI/UX' },
    { value: 'performance', label: 'Performance' },
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'bug_report', label: 'Bug Report' },
    { value: 'other', label: 'Other' },
];

export default function AdminFeedbackPage() {
    const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
    const [stats, setStats] = useState<FeedbackStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('all');
    const [ratingFilter, setRatingFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
    const [editingStatus, setEditingStatus] = useState('');
    const [adminNotes, setAdminNotes] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchData();
    }, [statusFilter, ratingFilter, categoryFilter]);

    const fetchData = async () => {
        try {
            setLoading(true);

            const params: any = {};
            if (statusFilter !== 'all') params.status_filter = statusFilter;
            if (ratingFilter !== 'all') params.rating_filter = parseInt(ratingFilter);
            if (categoryFilter !== 'all') params.category_filter = categoryFilter;

            const [feedbackRes, statsRes] = await Promise.all([
                apiClient.getFeedback(params),
                apiClient.getFeedbackStats(),
            ]);

            setFeedbackList(feedbackRes.data || []);
            setStats(statsRes.data || null);
        } catch (error: any) {
            console.error('Failed to fetch feedback:', error);
            if (error?.response?.status === 403) {
                alert('You do not have permission to view feedback. Admin access required.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleViewFeedback = (feedback: Feedback) => {
        setSelectedFeedback(feedback);
        setEditingStatus(feedback.status);
        setAdminNotes(feedback.admin_notes || '');
    };

    const handleUpdateFeedback = async () => {
        if (!selectedFeedback) return;

        try {
            setSaving(true);
            await apiClient.updateFeedback(selectedFeedback.id, {
                status: editingStatus,
                admin_notes: adminNotes,
            });

            await fetchData();
            setSelectedFeedback(null);
            alert('Feedback updated successfully!');
        } catch (error: any) {
            console.error('Failed to update feedback:', error);
            alert('Failed to update feedback: ' + (error?.response?.data?.detail || error?.message));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteFeedback = async (id: number) => {
        if (!confirm('Are you sure you want to delete this feedback? This action cannot be undone.')) {
            return;
        }

        try {
            await apiClient.deleteFeedback(id);
            await fetchData();
            setSelectedFeedback(null);
            alert('Feedback deleted successfully!');
        } catch (error: any) {
            console.error('Failed to delete feedback:', error);
            alert('Failed to delete feedback: ' + (error?.response?.data?.detail || error?.message));
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'new': return <Clock className="w-4 h-4" />;
            case 'reviewed': return <CheckCircle className="w-4 h-4" />;
            case 'resolved': return <CheckCircle className="w-4 h-4" />;
            case 'archived': return <Archive className="w-4 h-4" />;
            default: return <MessageSquare className="w-4 h-4" />;
        }
    };

    return (
        <Layout>
            <PageWrapper>
                <ContentContainer>
                    <Header>
                        <h1>Feedback Management</h1>
                        <p>View and manage user feedback submissions</p>
                    </Header>

                    {/* Statistics Cards */}
                    {stats && (
                        <StatsGrid>
                            <StatCard
                                $color="#667eea"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <div className="content">
                                    <div className="info">
                                        <div className="label">Total Feedback</div>
                                        <div className="value">{stats.total_feedback}</div>
                                    </div>
                                    <div className="icon">
                                        <MessageSquare size={28} />
                                    </div>
                                </div>
                            </StatCard>

                            <StatCard
                                $color="#f59e0b"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className="content">
                                    <div className="info">
                                        <div className="label">Average Rating</div>
                                        <div className="value">{stats.average_rating.toFixed(1)}</div>
                                    </div>
                                    <div className="icon">
                                        <Star size={28} fill="currentColor" />
                                    </div>
                                </div>
                            </StatCard>

                            <StatCard
                                $color="#10b981"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className="content">
                                    <div className="info">
                                        <div className="label">Recent (7 days)</div>
                                        <div className="value">{stats.recent_feedback_count}</div>
                                    </div>
                                    <div className="icon">
                                        <TrendingUp size={28} />
                                    </div>
                                </div>
                            </StatCard>

                            <StatCard
                                $color="#8b5cf6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                <div className="content">
                                    <div className="info">
                                        <div className="label">New Feedback</div>
                                        <div className="value">{stats.status_breakdown.new || 0}</div>
                                    </div>
                                    <div className="icon">
                                        <Clock size={28} />
                                    </div>
                                </div>
                            </StatCard>
                        </StatsGrid>
                    )}

                    {/* Filters */}
                    <FilterSection>
                        <div className="filter-header">
                            <Filter size={20} />
                            <h2>Filters</h2>
                        </div>
                        <div className="filter-grid">
                            <FilterGroup>
                                <label>Status</label>
                                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                                    {STATUS_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </FilterGroup>

                            <FilterGroup>
                                <label>Rating</label>
                                <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)}>
                                    {RATING_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </FilterGroup>

                            <FilterGroup>
                                <label>Category</label>
                                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                                    {CATEGORY_OPTIONS.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </FilterGroup>
                        </div>
                    </FilterSection>

                    {/* Feedback List */}
                    <FeedbackListCard>
                        <div className="list-header">
                            <h2>Feedback Submissions</h2>
                        </div>

                        {loading ? (
                            <LoadingState>
                                <div className="spinner"></div>
                                <p>Loading feedback...</p>
                            </LoadingState>
                        ) : feedbackList.length === 0 ? (
                            <EmptyState>
                                <MessageSquare size={64} />
                                <p>No feedback found matching your filters</p>
                            </EmptyState>
                        ) : (
                            <div>
                                {feedbackList.map((feedback, index) => (
                                    <FeedbackItem
                                        key={feedback.id}
                                        onClick={() => handleViewFeedback(feedback)}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <div className="item-content">
                                            <div className="item-main">
                                                <div className="item-meta">
                                                    <div className="stars">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star
                                                                key={i}
                                                                size={16}
                                                                fill={i < feedback.rating ? '#f59e0b' : 'none'}
                                                                color={i < feedback.rating ? '#f59e0b' : '#d1d5db'}
                                                            />
                                                        ))}
                                                    </div>
                                                    <StatusBadge $status={feedback.status}>
                                                        {getStatusIcon(feedback.status)}
                                                        <span>{feedback.status}</span>
                                                    </StatusBadge>
                                                    <CategoryBadge>
                                                        {feedback.category.replace('_', ' ')}
                                                    </CategoryBadge>
                                                </div>
                                                <div className="item-message">{feedback.message}</div>
                                                <div className="item-footer">
                                                    <span>
                                                        {feedback.user_id ? `User #${feedback.user_id}` : 'Anonymous'}
                                                    </span>
                                                    <span>•</span>
                                                    <span>{new Date(feedback.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                            <div className="item-action">
                                                <Edit size={20} />
                                            </div>
                                        </div>
                                    </FeedbackItem>
                                ))}
                            </div>
                        )}
                    </FeedbackListCard>
                </ContentContainer>

                {/* Edit Modal */}
                <AnimatePresence>
                    {selectedFeedback && (
                        <ModalOverlay
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setSelectedFeedback(null)}
                        >
                            <ModalContent
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="modal-header">
                                    <h2>Feedback Details</h2>
                                    <button onClick={() => setSelectedFeedback(null)}>
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="modal-body">
                                    <div className="section">
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                {[...Array(5)].map((_, i) => (
                                                    <Star
                                                        key={i}
                                                        size={24}
                                                        fill={i < selectedFeedback.rating ? '#f59e0b' : 'none'}
                                                        color={i < selectedFeedback.rating ? '#f59e0b' : '#d1d5db'}
                                                    />
                                                ))}
                                            </div>
                                            <CategoryBadge>
                                                {selectedFeedback.category.replace('_', ' ')}
                                            </CategoryBadge>
                                        </div>
                                    </div>

                                    <div className="section">
                                        <h3>Feedback Message</h3>
                                        <div className="content">{selectedFeedback.message}</div>
                                    </div>

                                    <div className="section">
                                        <h3>Submitted By</h3>
                                        <div className="info">
                                            <div className="highlight">
                                                {selectedFeedback.user_id ? `User ID: ${selectedFeedback.user_id}` : 'Anonymous User'}
                                            </div>
                                            <div>{new Date(selectedFeedback.created_at).toLocaleString()}</div>
                                        </div>
                                    </div>

                                    <div className="section">
                                        <h3>Status</h3>
                                        <select value={editingStatus} onChange={(e) => setEditingStatus(e.target.value)}>
                                            <option value="new">New</option>
                                            <option value="reviewed">Reviewed</option>
                                            <option value="resolved">Resolved</option>
                                            <option value="archived">Archived</option>
                                        </select>
                                    </div>

                                    <div className="section">
                                        <h3>Admin Notes</h3>
                                        <textarea
                                            value={adminNotes}
                                            onChange={(e) => setAdminNotes(e.target.value)}
                                            rows={4}
                                            placeholder="Add internal notes or response..."
                                            maxLength={2000}
                                        />
                                    </div>

                                    <div className="actions">
                                        <Button $variant="danger" onClick={() => handleDeleteFeedback(selectedFeedback.id)}>
                                            <Trash2 size={16} />
                                            <span>Delete</span>
                                        </Button>

                                        <Button onClick={handleUpdateFeedback} disabled={saving}>
                                            {saving ? (
                                                <>
                                                    <div className="spinner"></div>
                                                    <span>Saving...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Save size={16} />
                                                    <span>Save Changes</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </ModalContent>
                        </ModalOverlay>
                    )}
                </AnimatePresence>
            </PageWrapper>
        </Layout>
    );
}

