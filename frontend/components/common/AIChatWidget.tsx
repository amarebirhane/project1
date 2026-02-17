"use client";

import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { Send, X, Bot, Sparkles, User, Loader2, Trash2, RotateCcw, Paperclip, ImageIcon, History, Plus, Mic, MicOff } from "lucide-react";
import { apiClient, ChatMessage } from "@/lib/api";
import { useAuth } from "@/lib/rbac/auth-context";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

// --- Types ---
interface ChatSession {
  id: string;
  title: string;
  history: ChatMessage[];
  timestamp: number;
}

// --- Styled Components ---
const WidgetContainer = styled.div`
  position: fixed;
  bottom: 100px; /* Above Feedback Widget */
  right: 30px;
  z-index: 9999;
  font-family: 'Inter', sans-serif;
  display: flex;
  align-items: flex-end;
  gap: 12px;
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
  position: relative;
  width: 450px;
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

const HistorySidebar = styled(motion.div)`
  width: 250px;
  height: 600px;
  max-height: calc(100vh - 180px);
  background: ${props => props.theme.colors.backgroundSecondary};
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  border: 1px solid ${props => props.theme.colors.border};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 9998;
`;

const HistoryHeader = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${props => props.theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: ${props => props.theme.colors.textDark};
`;

const SessionList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SessionItem = styled.div<{ $active: boolean }>`
  padding: 10px 12px;
  border-radius: 8px;
  background: ${props => props.$active ? props.theme.colors.card : 'transparent'};
  border: 1px solid ${props => props.$active ? props.theme.colors.border : 'transparent'};
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme.colors.card};
    border-color: ${props => props.theme.colors.border};
  }

  .session-info {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .session-title {
    font-size: 0.85rem;
    font-weight: 500;
    color: ${props => props.theme.colors.textDark};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .session-date {
    font-size: 0.7rem;
    color: ${props => props.theme.colors.textSecondary};
  }
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

const IconButton = styled.button<{ size?: 'small' | 'medium' }>`
  background: transparent;
  border: none;
  color: ${props => props.theme.colors.textSecondary};
  cursor: pointer;
  padding: ${props => props.size === 'small' ? '4px' : '8px'};
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

const MicButton = styled(motion.button) <{ $isRecording: boolean }>`
  background: ${props => props.$isRecording ? '#ef4444' : 'transparent'};
  color: ${props => props.$isRecording ? 'white' : props.theme.colors.textSecondary};
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

  &:hover {
    background: ${props => props.$isRecording ? '#dc2626' : props.theme.colors.backgroundSecondary};
    color: ${props => props.$isRecording ? 'white' : '#2563eb'};
  }
`;

const PulsingRing = styled(motion.div)`
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.4);
  z-index: -1;
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [retryStatus, setRetryStatus] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Computed state
  const activeSession = sessions.find(s => s.id === activeSessionId) || null;
  const history = activeSession?.history || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- Voice Logic ---
  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result) => result.transcript)
          .join('');

        setMessage(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsRecording(false);
        toast.error("Voice recognition failed. Check your microphone.");
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleVoiceRecording = () => {
    if (!recognitionRef.current) {
      toast.error("Speech recognition is not supported in this browser.");
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setMessage(""); // Clear message for new recording
      recognitionRef.current.start();
      setIsRecording(true);
      toast.info("Listening...");
    }
  };

  // Load logic
  useEffect(() => {
    const savedSessions = localStorage.getItem("fms_ai_sessions");
    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to load sessions:", e);
      }
    }
  }, []);

  // Sync active session history to main sessions state
  const setHistory = (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
    if (!activeSessionId) {
      // Create a default session if none exists
      const newSession: ChatSession = {
        id: Date.now().toString(),
        title: "New Conversation",
        history: updater([]),
        timestamp: Date.now()
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setSessions([newSession]);
      setActiveSessionId(newSession.id);
      return;
    }

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        const newHistory = updater(s.history);
        // Only update title if it's still "New Conversation" and we have a message
        const newTitle = s.title === "New Conversation" && newHistory.length > 0
          ? newHistory[0].content.slice(0, 30) + (newHistory[0].content.length > 30 ? "..." : "")
          : s.title;

        return { ...s, history: newHistory, title: newTitle, timestamp: Date.now() };
      }
      return s;
    }));
  };

  // Persist sessions
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("fms_ai_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Conversation",
      history: [],
      timestamp: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setIsHistoryOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => prev.filter(s => s.id !== id));
    if (activeSessionId === id) {
      setActiveSessionId(null);
    }
    if (sessions.length <= 1) {
      localStorage.removeItem("fms_ai_sessions");
    }
  };

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

    // Capture current history + new message to avoid closure issues
    const chatHistoryForAPI = [...history];

    const handleChat = async (): Promise<void> => {
      let retryCount = 0;
      const maxRetries = 1;

      while (retryCount <= maxRetries) {
        try {
          const response = await apiClient.chatWithAI({
            message: userMsg.content,
            history: chatHistoryForAPI, // Use the captured history
            current_page: pathname,
            image_data: userMsg.image_data
          });

          const content = response.data.response;

          // Check if it's a rate limit message from our backend
          if (retryCount < maxRetries && (content.includes("wait a moment") || content.includes("many requests") || content.includes("try again in"))) {
            let delay = 2000;
            const match = content.match(/try again in (\d+) seconds/);
            if (match) {
              const seconds = parseInt(match[1]);
              delay = (seconds + 1) * 1000;
              setRetryStatus(`Rate limit hit. Re-trying in ${seconds}s...`);
            } else {
              setRetryStatus("Assistant is resting, retrying...");
            }
            await new Promise(resolve => setTimeout(resolve, delay));
            retryCount++;
            continue; // try again
          }

          const aiMsg: ChatMessage = { role: 'model', content };
          setHistory(prev => [...prev, aiMsg]);
          break; // success or final message
        } catch (error) {
          console.error("Chat error:", error);
          const errorMsg: ChatMessage = { role: 'model', content: "Sorry, I encountered an error. Please try again." };
          setHistory(prev => [...prev, errorMsg]);
          break;
        }
      }
      setLoading(false);
      setRetryStatus(null);
    };

    handleChat();
  };

  const clearHistory = () => {
    if (activeSessionId) {
      setSessions(prev => prev.map(s =>
        s.id === activeSessionId ? { ...s, history: [], title: "New Conversation" } : s
      ));
    }
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
                <CloseButton onClick={() => setIsHistoryOpen(!isHistoryOpen)} title="View History">
                  <History size={18} />
                </CloseButton>
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
                placeholder={isRecording ? "Listening..." : (selectedImage ? "Describe this image..." : "Ask a question...")}
                disabled={loading}
              />

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <AnimatePresence>
                  {isRecording && (
                    <PulsingRing
                      initial={{ scale: 1, opacity: 0.8 }}
                      animate={{ scale: 1.6, opacity: 0 }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                    />
                  )}
                </AnimatePresence>
                <MicButton
                  type="button"
                  onClick={toggleVoiceRecording}
                  $isRecording={isRecording}
                  title={isRecording ? "Stop Recording" : "Voice Query"}
                >
                  {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                </MicButton>
              </div>

              <SendButton type="submit" disabled={(!message.trim() && !selectedImage) || loading || isRecording}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={20} />}
              </SendButton>
            </InputArea>
          </PopupCard>
        )}
      </AnimatePresence>

      {isOpen && (
        <HistorySidebar
          initial={{ opacity: 0, x: 20, scale: 0.95 }}
          animate={{ opacity: isHistoryOpen ? 1 : 0, x: isHistoryOpen ? 0 : 20, width: isHistoryOpen ? 250 : 0 }}
          style={{ pointerEvents: isHistoryOpen ? 'auto' : 'none', display: isHistoryOpen ? 'flex' : 'none' }}
        >
          <HistoryHeader>
            <span>History</span>
            <IconButton onClick={createNewSession} title="New Chat">
              <Plus size={18} />
            </IconButton>
          </HistoryHeader>
          <SessionList>
            {sessions.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280', fontSize: '0.85rem' }}>
                No history yet.
              </div>
            )}
            {sessions.map(s => (
              <SessionItem
                key={s.id}
                $active={s.id === activeSessionId}
                onClick={() => { setActiveSessionId(s.id); setIsHistoryOpen(false); }}
              >
                <div className="session-info">
                  <div className="session-title">{s.title}</div>
                  <div className="session-date">{new Date(s.timestamp).toLocaleDateString()}</div>
                </div>
                <IconButton size="small" onClick={(e) => deleteSession(e, s.id)} style={{ padding: '4px' }}>
                  <Trash2 size={14} color="#ef4444" />
                </IconButton>
              </SessionItem>
            ))}
          </SessionList>
        </HistorySidebar>
      )}

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
