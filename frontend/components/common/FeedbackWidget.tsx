"use client";

import { useState } from "react";
import styled, { keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Star, MessageSquare, AlertCircle, CheckCircle, X } from "lucide-react";
import { apiClient } from "@/lib/api";

// --- Animations ---
const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

// --- Styled Components ---
const WidgetContainer = styled.div`
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 9999;
  font-family: 'Inter', sans-serif;
`;

const FloatingButton = styled(motion.button)`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
  position: relative;
  z-index: 10000;

  &:hover {
    box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4);
  }
`;

const PopupCard = styled(motion.div)`
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 380px;
  background: ${props => props.theme.colors.card};
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid ${props => props.theme.colors.border};
  padding: 24px;
  overflow: hidden;
  max-width: calc(100vw - 40px);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;

  h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: ${props => props.theme.colors.textDark};
  }
`;

const CloseButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme.colors.backgroundSecondary};
    color: ${props => props.theme.colors.textDark};
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;

  label {
    display: block;
    font-size: 0.9rem;
    font-weight: 600;
    color: ${props => props.theme.colors.textDark};
    margin-bottom: 8px;
  }
`;

const StarRatingContainer = styled.div`
  display: flex;
  gap: 6px;
  justify-content: center;
  margin: 12px 0;
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
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.inputBg || props.theme.colors.background};
  color: ${props => props.theme.colors.textDark};
  font-size: 0.95rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 12px;
  border-radius: 8px;
  border: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.inputBg || props.theme.colors.background};
  color: ${props => props.theme.colors.textDark};
  font-size: 0.95rem;
  font-family: inherit;
  resize: vertical;

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
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  background: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: 6px;
  color: #ef4444;
  font-size: 0.85rem;
  margin-bottom: 20px;
`;

const SuccessView = styled(motion.div)`
  text-align: center;
  padding: 20px 0;

  .icon {
    width: 60px;
    height: 60px;
    background: #dcfce7;
    color: #16a34a;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }

  h4 {
    margin: 0 0 8px;
    color: ${props => props.theme.colors.textDark};
  }

  p {
    color: ${props => props.theme.colors.textSecondary};
    font-size: 0.95rem;
    margin-bottom: 24px;
  }
`;

export default function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);
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
            // Auto close after success? Maybe not, allow user to read message
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

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen && submitted) {
            // Reset if reopening after successful submission
            setTimeout(() => handleReset(), 300);
        }
    };

    return (
        <WidgetContainer>
            <AnimatePresence>
                {isOpen && (
                    <PopupCard
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Header>
                            <h3>Send Feedback</h3>
                            <CloseButton onClick={toggleOpen}>
                                <X size={20} />
                            </CloseButton>
                        </Header>

                        {submitted ? (
                            <SuccessView
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                            >
                                <div className="icon">
                                    <CheckCircle size={32} />
                                </div>
                                <h4>Thank You!</h4>
                                <p>Your feedback has been sent.</p>
                                <SubmitButton
                                    onClick={handleReset}
                                    style={{ background: 'transparent', border: '1px solid currentColor', color: '#6b7280' }}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    Send Another
                                </SubmitButton>
                            </SuccessView>
                        ) : (
                            <form onSubmit={handleSubmit}>
                                {error && (
                                    <ErrorMessage>
                                        <AlertCircle size={16} />
                                        {error}
                                    </ErrorMessage>
                                )}

                                <FormGroup>
                                    <label>Experience Rating</label>
                                    <StarRatingContainer>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <StarButton
                                                key={star}
                                                type="button"
                                                $active={rating >= star}
                                                onClick={() => setRating(star)}
                                            >
                                                <Star size={24} fill={rating >= star ? "currentColor" : "none"} />
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
                                    <label>Message</label>
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
                                    {loading ? "Sending..." : (
                                        <>
                                            <Send size={16} /> Send Feedback
                                        </>
                                    )}
                                </SubmitButton>
                            </form>
                        )}
                    </PopupCard>
                )}
            </AnimatePresence>

            <FloatingButton
                onClick={toggleOpen}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={{ rotate: isOpen ? 45 : 0 }}
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </FloatingButton>
        </WidgetContainer>
    );
}
