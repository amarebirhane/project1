"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Bot, Sparkles, User, Loader2, Trash2, RotateCcw, Paperclip, ImageIcon } from "lucide-react";
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
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
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
  height: 600px;
  max-height: calc(100vh - 180px); /* Ensure it doesn't go off screen */
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

const ActionChipContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 20px;
`;

const ActionChip = styled(motion.button)`
  padding: 8px 16px;
  background: ${props => props.theme.colors.background};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: 20px;
  font-size: 0.85rem;
  color: #2563eb;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;

  &:hover {
    background: #eff6ff;
    border-color: #3b82f6;
    transform: translateY(-1px);
  }
`;

const MessageBubble = styled(motion.div) <{ $role: 'user' | 'model' }>`
  padding: 12px 16px;
  border-radius: 16px;
  font-size: 0.95rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  background: ${props => props.$role === 'user'
    ? 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)'
    : props.theme.colors.backgroundSecondary};
  color: ${props => props.$role === 'user'
    ? 'white'
    : props.theme.colors.textDark};
  border-bottom-right-radius: ${props => props.$role === 'user' ? '4px' : '16px'};
  border-bottom-left-radius: ${props => props.$role === 'model' ? '4px' : '16px'};

  strong {
    font-weight: 700;
  }

  code {
    background: rgba(0, 0, 0, 0.1);
    padding: 2px 4px;
    border-radius: 4px;
    font-family: 'Fira Code', monospace;
    font-size: 0.85rem;
  }
`;

const BubbleImage = styled.img`
  max-width: 100%;
  max-height: 200px;
  border-radius: 8px;
  margin-bottom: 8px;
  display: block;
`;

const InputArea = styled.form`
  padding: 16px;
  border-top: 1px solid ${props => props.theme.colors.border};
  display: flex;
  gap: 12px;
  background: ${props => props.theme.colors.card};
  align-items: center;
  position: relative;
`;

const ImagePreview = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  right: 0;
  padding: 12px;
  background: ${props => props.theme.colors.card};
  border-top: 1px solid ${props => props.theme.colors.border};
  display: flex;
  align-items: center;
  gap: 12px;
  animation: slideUp 0.2s ease-out;

  @keyframes slideUp {
    from { transform: translateY(10px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`;

const PreviewThumbnail = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid ${props => props.theme.colors.border};
  img { width: 100%; height: 100%; object-fit: cover; }
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme.colors.backgroundSecondary};
    color: #2563eb;
  }
`;

const Input = styled.input`
  flex: 1;
  padding: 12px 18px;
  border-radius: 24px;
  border: 1px solid ${props => props.theme.colors.border};
  background: ${props => props.theme.colors.inputBg || props.theme.colors.background};
  color: ${props => props.theme.colors.textDark};
  font-size: 0.95rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
  }
`;

const SendButton = styled.button`
  background: #2563eb;
  color: white;
  border: none;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    background: #1d4ed8;
    transform: scale(1.05);
    box-shadow: 0 4px 10px rgba(37, 99, 235, 0.2);
  }

  &:disabled {
    background: ${props => props.theme.colors.border};
    color: ${props => props.theme.colors.textSecondary};
    cursor: not-allowed;
  }
`;

const TypingIndicator = styled(motion.div)`
  display: flex;
  gap: 4px;
  padding: 10px 16px;
  background: ${props => props.theme.colors.backgroundSecondary};
  border-radius: 12px;
  align-self: flex-start;
  width: fit-content;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.03);

  span {
    width: 6px;
    height: 6px;
    background: #2563eb;
    border-radius: 50%;
    opacity: 0.6;
  }
`;

// Helper to format basic markdown-like syntax
const formatText = (text: string) => {
  // Bold: **text**
  let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Simple code: `text`
  formatted = formatted.replace(/`(.*?)`/g, '<code>$1</code>');
  return <span dangerouslySetInnerHTML={{ __html: formatted }} />;
};

export default function AIChatWidget() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [retryStatus, setRetryStatus] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("fms_ai_chat_history");
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("fms_ai_chat_history", JSON.stringify(history));
    }
  }, [history]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [history, isOpen]);

  const handleActionClick = (prompt: string) => {
    handleSubmit(null, prompt);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit for Flash
        alert("Image too large (max 10MB)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent | null, directMessage?: string) => {
    if (e) e.preventDefault();
    const finalMessage = directMessage || message;
    if ((!finalMessage.trim() && !selectedImage) || loading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: finalMessage.trim() || (selectedImage ? "[Sent an image]" : ""),
      image_data: selectedImage || undefined
    };

    setHistory(prev => [...prev, userMsg]);
    if (!directMessage) setMessage("");
    setSelectedImage(null);
    setLoading(true);

    const attemptChat = async (retryCount = 0): Promise<void> => {
      try {
        const response = await apiClient.chatWithAI({
          message: userMsg.content,
          history: history,
          current_page: pathname,
          image_data: userMsg.image_data
        });

        const content = response.data.response;

        // Handle the "friendly" rate limit message from backend by retrying once
        if (retryCount === 0 && (content.includes("wait a moment") || content.includes("many requests") || content.includes("try again in"))) {
          let delay = 2000; // default 2s
          const match = content.match(/try again in (\d+) seconds/);
          if (match) {
            const seconds = parseInt(match[1]);
            delay = (seconds + 1) * 1000; // add 1s buffer and conv to ms
            setRetryStatus(`Rate limit hit. Re-trying in ${seconds}s...`);
          } else {
            setRetryStatus("Wait a moment, retrying...");
          }
          await new Promise(resolve => setTimeout(resolve, delay));
          setRetryStatus(null);
          return attemptChat(retryCount + 1);
        }

        const aiMsg: ChatMessage = { role: 'model', content };
        setHistory(prev => [...prev, aiMsg]);
      } catch (error) {
        console.error("Chat error:", error);
        const errorMsg: ChatMessage = { role: 'model', content: "Sorry, I encountered an error. Please try again." };
        setHistory(prev => [...prev, errorMsg]);
      } finally {
        setLoading(false);
        setRetryStatus(null);
      }
    };

    await attemptChat();
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("fms_ai_chat_history");
  };

  return (
    <WidgetContainer>
      <AnimatePresence>
        {isOpen && (
          <PopupCard
            initial={{ opacity: 0, scale: 0.92, y: 30, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 30 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            <Header>
              <h3>
                <Bot size={20} className="text-blue-500" />
                <span style={{ letterSpacing: '-0.01em' }}>FMS Assistant</span>
              </h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                {history.length > 0 && (
                  <CloseButton onClick={clearHistory} title="Clear Chat history">
                    <RotateCcw size={16} />
                  </CloseButton>
                )}
                <CloseButton onClick={() => setIsOpen(false)}>
                  <X size={20} />
                </CloseButton>
              </div>
            </Header>

            <ChatArea>
              {history.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ textAlign: 'center', color: '#6b7280', marginTop: '60px', padding: '0 20px' }}
                >
                  <div style={{ background: '#eff6ff', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                    <Bot size={32} color="#3b82f6" />
                  </div>
                  <h4 style={{ color: '#1f2937', marginBottom: '8px', fontSize: '1.1rem' }}>Welcome, {user?.username || 'User'}!</h4>
                  <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>How can I assist you with the Financial Management System today?</p>

                  <ActionChipContainer>
                    <ActionChip
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleActionClick("What can I do on this page?")}
                    >
                      <Sparkles size={14} /> Summarize Page
                    </ActionChip>
                    <ActionChip
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleActionClick("What ML algorithms are used for forecasting?")}
                    >
                      <Bot size={14} /> Forecasting AI
                    </ActionChip>
                    <ActionChip
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleActionClick("Tell me about fraud detection.")}
                    >
                      <User size={14} /> Fraud Security
                    </ActionChip>
                  </ActionChipContainer>
                </motion.div>
              )}

              {history.map((msg, i) => (
                <MessageContainer
                  key={i}
                  $role={msg.role}
                  as={motion.div}
                  initial={{ opacity: 0, x: msg.role === 'user' ? 10 : -10, y: 5 }}
                  animate={{ opacity: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <MessageAuthor $role={msg.role}>
                    {msg.role === 'user' ? (user?.full_name || 'You') : 'AI Assistant'}
                  </MessageAuthor>
                  <MessageBubble $role={msg.role}>
                    {msg.image_data && <BubbleImage src={msg.image_data} alt="Sent attachment" />}
                    {formatText(msg.content)}
                  </MessageBubble>
                </MessageContainer>
              ))}

              {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <TypingIndicator
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0 }} />
                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }} />
                    <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1.2, delay: 0.4 }} />
                  </TypingIndicator>
                  {retryStatus && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ fontSize: '0.75rem', color: '#3b82f6', marginLeft: '4px', fontWeight: 500 }}
                    >
                      {retryStatus}
                    </motion.div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </ChatArea>

            <InputArea onSubmit={(e) => handleSubmit(e)}>
              <AnimatePresence>
                {selectedImage && (
                  <ImagePreview>
                    <PreviewThumbnail>
                      <img src={selectedImage} alt="Preview" />
                    </PreviewThumbnail>
                    <div style={{ flex: 1, fontSize: '0.85rem', color: '#6b7280' }}>Image attached</div>
                    <IconButton onClick={() => setSelectedImage(null)} type="button">
                      <X size={16} />
                    </IconButton>
                  </ImagePreview>
                )}
              </AnimatePresence>

              <input
                type="file"
                hidden
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageSelect}
              />

              <IconButton
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach Receipt or Invoice"
              >
                <Paperclip size={20} />
              </IconButton>

              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={selectedImage ? "Describe this image..." : "Ask a question..."}
                disabled={loading}
              />
              <SendButton type="submit" disabled={(!message.trim() && !selectedImage) || loading}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={20} />}
              </SendButton>
            </InputArea>
          </PopupCard>
        )}
      </AnimatePresence>

      <FloatingButton
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{
          rotate: isOpen ? 90 : 0,
        }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
      >
        {isOpen ? <X size={24} /> : <Bot size={28} />}
      </FloatingButton>
    </WidgetContainer>
  );
}
