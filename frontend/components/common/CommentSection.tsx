
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { MessageSquare, Send, User, AtSign, Calendar } from 'lucide-react';
import apiClient from '@/lib/api';
import { toast } from 'sonner';

interface Comment {
    id: number;
    content: string;
    user_id: number;
    user: {
        username: string;
        full_name: string | null;
        profile_image_url: string | null;
    };
    created_at: string;
}

interface CommentSectionProps {
    sourceType: 'revenue_entries' | 'expense_entries';
    sourceId: number;
}

const Section = styled.div`
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid ${props => props.theme.colors.border};
`;

const Title = styled.h3`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textDark};
  margin-bottom: 20px;
`;

const CommentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
`;

const CommentItem = styled.div`
  display: flex;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  background: ${props => props.theme.colors.backgroundSecondary};
`;

const Avatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: ${props => props.theme.colors.primary};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
  flex-shrink: 0;
  overflow: hidden;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const CommentBody = styled.div`
  flex: 1;
`;

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;

  .name {
    font-weight: 600;
    font-size: 0.9rem;
    color: ${props => props.theme.colors.textDark};
  }

  .date {
    font-size: 0.75rem;
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const CommentContent = styled.div`
  font-size: 0.9rem;
  color: ${props => props.theme.colors.textSecondary};
  line-height: 1.5;

  .mention {
    color: ${props => props.theme.colors.primary};
    font-weight: 600;
  }
`;

const InputWrapper = styled.div`
  display: flex;
  gap: 12px;
  background: ${props => props.theme.colors.card};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 12px;
  padding: 8px 12px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);

  &:focus-within {
    border-color: ${props => props.theme.colors.primary};
  }
`;

const Input = styled.input`
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  padding: 8px 0;
  font-size: 0.9rem;
  color: ${props => props.theme.colors.textDark};

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const SendButton = styled.button`
  background: ${props => props.theme.colors.primary};
  color: white;
  border: none;
  border-radius: 8px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CommentSection: React.FC<CommentSectionProps> = ({ sourceType, sourceId }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchComments();
    }, [sourceId]);

    const fetchComments = async () => {
        try {
            const response = await apiClient.get(`/comments/${sourceType}/${sourceId}`);
            setComments(response.data as Comment[]);
        } catch (error) {
            console.error('Failed to fetch comments:', error);
        }
    };

    const handlePostComment = async () => {
        if (!newComment.trim() || loading) return;

        setLoading(true);
        try {
            await apiClient.post('/comments/', {
                content: newComment.trim(),
                source_type: sourceType,
                source_id: sourceId
            });
            setNewComment('');
            fetchComments();
            toast.success('Comment posted');
        } catch (error) {
            toast.error('Failed to post comment');
        } finally {
            setLoading(false);
        }
    };

    const renderContent = (content: string) => {
        // Basic mention highlighting
        const parts = content.split(/(@\w+)/g);
        return parts.map((part, i) =>
            part.startsWith('@') ? <span key={i} className="mention">{part}</span> : part
        );
    };

    return (
        <Section>
            <Title>
                <MessageSquare size={20} />
                Team Discussion
            </Title>

            <CommentList>
                {comments.map(comment => (
                    <CommentItem key={comment.id}>
                        <Avatar>
                            {comment.user.profile_image_url ? (
                                <img src={comment.user.profile_image_url} alt={comment.user.username} />
                            ) : (
                                comment.user.username[0].toUpperCase()
                            )}
                        </Avatar>
                        <CommentBody>
                            <CommentHeader>
                                <span className="name">{comment.user.full_name || comment.user.username}</span>
                                <span className="date">{new Date(comment.created_at).toLocaleString()}</span>
                            </CommentHeader>
                            <CommentContent>
                                {renderContent(comment.content)}
                            </CommentContent>
                        </CommentBody>
                    </CommentItem>
                ))}
                {comments.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '0.9rem' }}>
                        No comments yet. Start the conversation!
                    </div>
                )}
            </CommentList>

            <InputWrapper>
                <AtSign size={18} color="#999" />
                <Input
                    placeholder="Add a comment... Use @username to tag someone"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                />
                <SendButton onClick={handlePostComment} disabled={!newComment.trim() || loading}>
                    <Send size={18} />
                </SendButton>
            </InputWrapper>
        </Section>
    );
};

export default CommentSection;
