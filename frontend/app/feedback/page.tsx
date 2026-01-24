"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styled, { keyframes } from "styled-components";
import { motion } from "framer-motion";
import { Send, Star, MessageSquare, AlertCircle, CheckCircle } from "lucide-react";
import Layout from "@/components/layout";
import { apiClient } from "@/lib/api";

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
  text-align: center;
  margin-bottom: 48px;
  animation: ${fadeIn} 0.5s ease-out;

  h1 {
    font-size: 2.5rem;
    font-weight: 800;
    color: ${props => props.theme.colors.textDark};
    margin-bottom: 12px;
    background: linear-gradient(135deg, #2563eb 0%, #9333ea 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  p {
    color: ${props => props.theme.colors.textSecondary};
    font-size: 1.1rem;
    max-width: 600px;
    margin: 0 auto;
  }
`;

const FormCard = styled(motion.div)`
  background: ${props => props.theme.colors.card};
  border-radius: 24px;
  padding: 40px;
  box-shadow: ${props => props.theme.shadows.md};
  border: 1px solid ${props => props.theme.colors.border};
`;

const FormGroup = styled.div`
  margin-bottom: 28px;

  label {
    display: block;
    font-size: 0.95rem;
    font-weight: 700;
    color: ${props => props.theme.colors.textDark};
    margin-bottom: 10px;
    margin-left: 4px;
  }
`;

const StarRatingContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const StarButton = styled.button<{ $active: boolean }>`
  background: transparent;
  border: none;
  cursor: pointer;
  color: ${props => (props.$active ? '#fbbf24' : props.theme.colors.border)};
  transition: all 0.2s;
  padding: 4px;
  
  &:hover {
    transform: scale(1.1);
    color: #fbbf24;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.inputBg || props.theme.colors.background};
  color: ${props => props.theme.colors.textDark};
  font-size: 1rem;
  transition: all 0.2s;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 150px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.inputBg || props.theme.colors.background};
  color: ${props => props.theme.colors.textDark};
  font-size: 1rem;
  font-family: inherit;
  resize: vertical;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  &::placeholder {
    color: ${props => props.theme.colors.textSecondary};
  }
`;

const SubmitButton = styled(motion.button)`
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: 12px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const SuccessMessage = styled(motion.div)`
  text-align: center;
  padding: 40px;
  
  .icon {
    width: 80px;
    height: 80px;
    background: #dcfce7;
    color: #16a34a;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
    
    svg {
      width: 40px;
      height: 40px;
    }
  }

  h2 {
    font-size: 1.75rem;
    font-weight: 800;
    color: ${props => props.theme.colors.textDark};
    margin-bottom: 12px;
  }

  p {
    color: ${props => props.theme.colors.textSecondary};
    font-size: 1.1rem;
    margin-bottom: 32px;
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: 8px;
  color: #ef4444;
  font-size: 0.9rem;
  margin-bottom: 24px;
`;

export default function FeedbackPage() {
    const router = useRouter();
    const [rating, setRating] = useState(0);
    const [category, setCategory] = useState("general");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            setError("Please select a rating");
            return;
        }
        if (!message.trim()) {
            setError("Please enter a message");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            await apiClient.submitFeedback({
                rating,
                category,
                message,
            });

            setSubmitted(true);
        } catch (err: any) {
            console.error("Failed to submit feedback:", err);
            setError(err.message || "Failed to submit feedback. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setRating(0);
        setCategory("general");
        setMessage("");
        setSubmitted(false);
        setError(null);
    };

    if (submitted) {
        return (
            <Layout>
                <PageWrapper>
                    <ContentContainer>
                        <FormCard
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <SuccessMessage>
                                <div className="icon">
                                    <CheckCircle />
                                </div>
                                <h2>Thank You!</h2>
                                <p>Your feedback has been submitted successfully. We appreciate your input!</p>
                                <Button onClick={handleReset} variant="outline">
                                    Submit Another Response
                                </Button>
                            </SuccessMessage>
                        </FormCard>
                    </ContentContainer>
                </PageWrapper>
            </Layout>
        );
    }

    return (
        <Layout>
            <PageWrapper>
                <ContentContainer>
                    <Header>
                        <h1>Send Feedback</h1>
                        <p>Help us improve your experience. Share your thoughts, report bugs, or suggest new features.</p>
                    </Header>

                    <FormCard
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <form onSubmit={handleSubmit}>
                            {error && (
                                <ErrorMessage>
                                    <AlertCircle size={18} />
                                    {error}
                                </ErrorMessage>
                            )}

                            <FormGroup>
                                <label>How would you rate your experience?</label>
                                <StarRatingContainer>
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <StarButton
                                            key={star}
                                            type="button"
                                            $active={rating >= star}
                                            onClick={() => setRating(star)}
                                        >
                                            <Star size={32} fill={rating >= star ? "currentColor" : "none"} />
                                        </StarButton>
                                    ))}
                                </StarRatingContainer>
                            </FormGroup>

                            <FormGroup>
                                <label>Category</label>
                                <Select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                >
                                    <option value="general">General Feedback</option>
                                    <option value="bug">Report a Bug</option>
                                    <option value="feature">Feature Request</option>
                                    <option value="support">Support</option>
                                    <option value="other">Other</option>
                                </Select>
                            </FormGroup>

                            <FormGroup>
                                <label>Your Feedback</label>
                                <TextArea
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Tell us what you think..."
                                />
                            </FormGroup>

                            <SubmitButton
                                type="submit"
                                disabled={loading}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                {loading ? (
                                    "Sending..."
                                ) : (
                                    <>
                                        <Send size={20} />
                                        Submit Feedback
                                    </>
                                )}
                            </SubmitButton>
                        </form>
                    </FormCard>
                </ContentContainer>
            </PageWrapper>
        </Layout>
    );
}

const Button = styled.button<{ variant?: 'outline' | 'primary' }>`
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  
  ${props => props.variant === 'outline' ? `
    background: transparent;
    border: 2px solid ${props.theme.colors.border};
    color: ${props.theme.colors.textDark};
    
    &:hover {
      border-color: ${props.theme.colors.primary};
      color: ${props.theme.colors.primary};
      background: ${props.theme.colors.primary}10;
    }
  ` : `
    background: ${props.theme.colors.primary};
    color: white;
    border: none;
    
    &:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
  `}
`;
