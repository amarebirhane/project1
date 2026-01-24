"use client";

import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Bot, Sparkles, User, Loader2 } from "lucide-react";
import { apiClient, ChatMessage } from "@/lib/api";
import { useAuth } from "@/lib/rbac/auth-context";

// --- Styled Components ---
const WidgetContainer = styled.div`
  position: fixed;
  bottom: 100px; /* Above Feedback Widget */
  right: 30px;
  z-index: 9999;
  font-family: 'Inter', sans-serif;
`;

const FloatingButton = styled(motion.button)`
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  position: relative;
  z-index: 10000;

  &:hover {
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  }
`;

const PopupCard = styled(motion.div)`
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 380px;
  height: 500px;
  background: ${props => props.theme.colors.card};
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-width: calc(100vw - 40px);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.backgroundSecondary};

  h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 700;
    color: ${props => props.theme.colors.textDark};
    display: flex;
    align-items: center;
    gap: 8px;
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
    background: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.textDark};
  }
`;

const ChatArea = styled.div`
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: ${props => props.theme.colors.background};
`;

const MessageContainer = styled.div<{ $role: 'user' | 'model' }>`
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-self: ${props => props.$role === 'user' ? 'flex-end' : 'flex-start'};
  max-width: 85%;
`;

const MessageAuthor = styled.span<{ $role: 'user' | 'model' }>`
  font-size: 0.75rem;
  font-weight: 600;
  color: ${props => props.theme.colors.textSecondary};
  margin-left: ${props => props.$role === 'model' ? '4px' : '0'};
  margin-right: ${props => props.$role === 'user' ? '4px' : '0'};
  text-align: ${props => props.$role === 'user' ? 'right' : 'left'};
`;

const MessageBubble = styled.div<{ $role: 'user' | 'model' }>`
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 0.95rem;
  line-height: 1.5;
  background: ${props => props.$role === 'user'
    ? '#2563eb'
    : props.theme.colors.backgroundSecondary};
  color: ${props => props.$role === 'user'
    ? 'white'
    : props.theme.colors.textDark};
  border-bottom-right-radius: ${props => props.$role === 'user' ? '4px' : '12px'};
  border-bottom-left-radius: ${props => props.$role === 'model' ? '4px' : '12px'};
`;

const InputArea = styled.form`
  padding: 16px;
  border-top: 1px solid ${props => props.theme.colors.border};
  display: flex;
  gap: 8px;
  background: ${props => props.theme.colors.card};
`;

const Input = styled.input`
  flex: 1;
  padding: 10px 14px;
  border-radius: 20px;
  border: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.inputBg || props.theme.colors.background};
  color: ${props => props.theme.colors.textDark};
  font-size: 0.95rem;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
  }
`;

const SendButton = styled.button`
  background: #2563eb;
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: #1d4ed8;
  }

  &:disabled {
    background: ${props => props.theme.colors.border};
    cursor: not-allowed;
  }
`;

const TypingIndicator = styled.div`
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  background: ${props => props.theme.colors.backgroundSecondary};
  border-radius: 12px;
  align-self: flex-start;
  width: fit-content;

  span {
    width: 6px;
    height: 6px;
    background: #9ca3af;
    border-radius: 50%;
    animation: bounce 1.4s infinite ease-in-out both;
  }

  span:nth-child(1) { animation-delay: -0.32s; }
  span:nth-child(2) { animation-delay: -0.16s; }

  @keyframes bounce {
    0%, 80%, 100% { transform: scale(0); }
    40% { transform: scale(1); }
  }
`;

export default function AIChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: message };
    setHistory(prev => [...prev, userMsg]);
    setMessage("");
    setLoading(true);

    try {
      // Pass full history including the new message
      const response = await apiClient.chatWithAI({
        message: userMsg.content,
        history: history // Pass previous history
      });

      const aiMsg: ChatMessage = { role: 'model', content: response.data.response };
      setHistory(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMsg: ChatMessage = { role: 'model', content: "Sorry, I encountered an error. Please try again." };
      setHistory(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
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
              <h3>
                <Sparkles size={18} fill="#fbbf24" stroke="#d97706" />
                AI Assistant
              </h3>
              <CloseButton onClick={() => setIsOpen(false)}>
                <X size={20} />
              </CloseButton>
            </Header>

            <ChatArea>
              {history.length === 0 && (
                <div style={{ textAlign: 'center', color: '#6b7280', marginTop: '40px' }}>
                  <Bot size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p>How can I help you with your finances today, {user?.username || 'User'}?</p>
                </div>
              )}

              {history.map((msg, i) => (
                <MessageContainer key={i} $role={msg.role}>
                  <MessageAuthor $role={msg.role}>
                    {msg.role === 'user' ? (user?.full_name || user?.username || 'You') : 'AI Assistant'}
                  </MessageAuthor>
                  <MessageBubble $role={msg.role}>
                    {msg.content}
                  </MessageBubble>
                </MessageContainer>
              ))}

              {loading && (
                <TypingIndicator>
                  <span />
                  <span />
                  <span />
                </TypingIndicator>
              )}
              <div ref={messagesEndRef} />
            </ChatArea>

            <InputArea onSubmit={handleSubmit}>
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask anything..."
                disabled={loading}
              />
              <SendButton type="submit" disabled={!message.trim() || loading}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </SendButton>
            </InputArea>
          </PopupCard>
        )}
      </AnimatePresence>

      <FloatingButton
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
      >
        {isOpen ? <X size={24} /> : <Bot size={28} />}
      </FloatingButton>
    </WidgetContainer>
  );
}
