//components/common/Navbar.tsx
'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import styled, { keyframes, css, useTheme } from 'styled-components';
import {
  Search, Plus, Bell, FileSpreadsheet, Globe, User, Users, LogOut, Settings, HelpCircle,
  Clock, ChevronDown, ChevronUp, AlertCircle, XCircle, CheckCircle, Info, Sun, Moon, Monitor, Check, Sparkles, Brain,
  Bot, AtSign
} from 'lucide-react';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import { useAuth } from '@/lib/rbac/auth-context';
import { useUserStore, type StoreUser } from '@/store/userStore';
import { type User as RbacUser } from '@/lib/rbac/models';
import { theme as staticTheme } from './theme';
import apiClient from '@/lib/api';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { debounce } from '@/lib/utils';
import useNotificationStore, { type Notification } from '@/store/notificationStore';
import { useThemeStore } from '@/store/useThemeStore';

const PRIMARY_ACCENT = '#06b6d4';
const PRIMARY_HOVER = '#0891b2';
const DANGER_COLOR = '#ef4444';

const PRIMARY_COLOR = (props: any) => props.theme.colors.primary || '#00AA00';
const TEXT_COLOR_DARK = (props: any) => props.theme.colors.textDark;
const TEXT_COLOR_MUTED = (props: any) => props.theme.colors.textSecondary || '#666';
const BACKGROUND_SECONDARY = (props: any) => props.theme.colors.backgroundSecondary;
const BORDER_COLOR = (props: any) => props.theme.colors.border;
const CARD_BG = (props: any) => props.theme.colors.card;

// Animations
const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

const slideDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const getIconColor = (iconType: string, active: boolean = false, theme?: any): string => {
  if (active) {
    const activeColors: Record<string, string> = {
      'search': '#3b82f6',
      'plus': '#22c55e',
      'bell': '#f59e0b',
      'file-spreadsheet': '#8b5cf6',
      'globe': '#06b6d4',
      'user': '#6366f1',
      'users': '#ec4899',
      'settings': '#64748b',
      'help-circle': '#14b8a6',
      'log-out': '#ef4444',
    };
    return activeColors[iconType] || PRIMARY_ACCENT;
  } else {
    const inactiveColors: Record<string, string> = {
      'search': '#60a5fa',
      'plus': '#4ade80',
      'bell': '#fbbf24',
      'file-spreadsheet': '#a78bfa',
      'globe': '#22d3ee',
      'user': '#818cf8',
      'users': '#f472b6',
      'settings': '#94a3b8',
      'help-circle': '#2dd4bf',
      'log-out': '#f87171',
    };
    return inactiveColors[iconType] || (theme?.colors?.textSecondary || '#666');
  }
};

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  right: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  background: ${props => props.theme.colors.background};
  border-bottom: 1px solid ${BORDER_COLOR};
  height: 46px;
  width: calc(100% - 280px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  max-width: 400px;
  margin: 0 ${props => props.theme.spacing.lg};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  padding-left: 48px;
  padding-right: 40px;
  border: 2px solid ${BORDER_COLOR};
  border-radius: ${props => props.theme.borderRadius.md};
  background: ${BACKGROUND_SECONDARY};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);

  &:focus {
    outline: none;
    border-color: ${PRIMARY_ACCENT};
    background: ${props => props.theme.colors.background};
    box-shadow: 0 0 0 4px ${PRIMARY_ACCENT}15, 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-1px);
  }

  &::placeholder {
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.5;
  }
`;

const SearchIcon = styled.div<{ $active?: boolean }>`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: ${props => props.$active ? getIconColor('search', true) : getIconColor('search', false)};
  opacity: ${props => props.$active ? 1 : 0.6};
  pointer-events: none;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  svg {
    width: 18px;
    height: 18px;
    transition: all 0.2s;
  }
  
  ${SearchInput}:focus ~ & {
    opacity: 1;
    color: ${getIconColor('search', true)};
    transform: translateY(-50%) scale(1.1);
  }
`;

const KeyboardHint = styled.div`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: ${BACKGROUND_SECONDARY};
  border: 1px solid ${BORDER_COLOR};
  border-radius: ${props => props.theme.borderRadius.sm};
  font-size: 11px;
  color: ${TEXT_COLOR_MUTED};
  opacity: 0.6;
  pointer-events: none;
  transition: opacity 0.2s;

  ${SearchInput}:focus ~ & {
    opacity: 0;
  }

  kbd {
    background: ${props => props.theme.colors.background};
    border: 1px solid ${BORDER_COLOR};
    border-radius: 3px;
    padding: 2px 6px;
    font-family: monospace;
    font-size: 10px;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
`;

const SearchSuggestions = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: ${props => props.theme.colors.background};
  border: 1px solid ${BORDER_COLOR};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
  opacity: ${props => props.$isOpen ? 1 : 0};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transform: ${props => props.$isOpen ? 'translateY(0)' : 'translateY(-8px)'};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  ${props => props.$isOpen && css`
    animation: ${slideDown} 0.2s ease-out;
  `}
`;

const SuggestionSection = styled.div`
  padding: ${props => props.theme.spacing.sm} 0;
  border-bottom: 1px solid ${BORDER_COLOR};

  &:last-child {
    border-bottom: none;
  }

  h4 {
    padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
    font-size: ${props => props.theme.typography.fontSizes.xs};
    text-transform: uppercase;
    letter-spacing: 1px;
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.7;
    margin: 0;
    font-weight: ${props => props.theme.typography.fontWeights.bold};
  }
`;

const SuggestionItem = styled.div<{ $active?: boolean; $isRecent?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md};
  cursor: pointer;
  transition: all 0.15s;
  background: ${props => props.$active ? BACKGROUND_SECONDARY : 'transparent'};
  border-left: 3px solid ${props => props.$active ? PRIMARY_ACCENT : 'transparent'};

  &:hover {
    background: ${BACKGROUND_SECONDARY};
    padding-left: ${props => props.theme.spacing.lg};
    border-left-color: ${PRIMARY_ACCENT};
  }

  svg {
    width: 16px;
    height: 16px;
    color: ${props => props.$isRecent ? getIconColor('clock', false) : getIconColor('search', false)};
    flex-shrink: 0;
  }

  span {
    flex: 1;
    font-size: ${props => props.theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
  }

  kbd {
    background: ${BACKGROUND_SECONDARY};
    border: 1px solid ${BORDER_COLOR};
    border-radius: 3px;
    padding: 2px 6px;
    font-family: monospace;
    font-size: 10px;
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.6;
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
`;

const IconWrapper = styled.div<{ $iconType?: string; $active?: boolean; $size?: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$iconType ? getIconColor(props.$iconType, props.$active || false, props.theme) : TEXT_COLOR_MUTED};
  opacity: ${props => props.$active ? 1 : 0.8};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  svg {
    width: ${props => props.$size ? `${props.$size}px` : '20px'};
    height: ${props => props.$size ? `${props.$size}px` : '20px'};
    stroke-width: 1.5px;
    transition: all 0.2s;
  }

  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
`;

const NavIcon = styled.div<{ $iconType?: string; $active?: boolean; $size?: number }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$iconType ? getIconColor(props.$iconType, props.$active || false, props.theme) : TEXT_COLOR_MUTED};
  opacity: ${props => props.$active ? 1 : 0.8};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  svg {
    width: ${props => props.$size ? `${props.$size}px` : '18px'};
    height: ${props => props.$size ? `${props.$size}px` : '18px'};
    transition: all 0.2s;
  }

  &:hover {
    opacity: 1;
    transform: scale(1.15);
  }
`;

const ButtonIcon = styled.div<{ $iconType?: string; $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$iconType ? getIconColor(props.$iconType, props.$active || false, props.theme) : 'white'};
  transition: all 0.2s;
  
  svg {
    width: 18px;
    height: 18px;
    stroke-width: 2.5;
    transition: all 0.2s;
  }
`;

const DropdownIcon = styled.div<{ $iconType?: string; $active?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.$iconType ? getIconColor(props.$iconType, props.$active || false, props.theme) : TEXT_COLOR_MUTED};
  opacity: ${props => props.$active ? 1 : 0.8};
  transition: all 0.2s;
  
  svg {
    width: 16px;
    height: 16px;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  &:hover {
    opacity: 1;
    transform: scale(1.1);
  }
`;

const AddButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  background: linear-gradient(135deg, ${props => getIconColor('plus', true, props.theme)} 0%, #16a34a 100%);
  color: white;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 8px rgba(34, 197, 94, 0.25);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  &:hover {
    background: linear-gradient(135deg, #16a34a 0%, ${props => getIconColor('plus', true, props.theme)} 100%);
    filter: brightness(1.1);
    transform: translateY(-2px) scale(1.05);
    box-shadow: 0 6px 16px rgba(34, 197, 94, 0.35);
    
    &::before {
      left: 100%;
    }
    
    svg {
      transform: scale(1.15) rotate(90deg);
    }
  }

  &:active {
    transform: translateY(0) scale(1);
  }
`;

const IconButton = styled.button<{ $iconType?: string; $hasBadge?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: ${props => props.theme.borderRadius.md};
  background: transparent;
  color: ${props => props.$iconType ? getIconColor(props.$iconType, false, props.theme) : TEXT_COLOR_MUTED};
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;

  &:hover {
    background: ${BACKGROUND_SECONDARY};
    color: ${props => props.$iconType ? getIconColor(props.$iconType, true, props.theme) : PRIMARY_ACCENT};
    transform: translateY(-1px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
    
    svg {
      opacity: 1;
      transform: scale(1.15);
    }
  }

  &:active {
    transform: translateY(0);
  }
`;

const NotificationBadge = styled.div`
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover ${IconWrapper} {
    opacity: 1;
    transform: scale(1.1);
  }

  span {
    position: absolute;
    top: -6px;
    right: -6px;
    background: linear-gradient(135deg, ${DANGER_COLOR} 0%, #dc2626 100%);
    color: white;
    font-size: 10px;
    font-weight: ${props => props.theme.typography.fontWeights.bold};
    min-width: 20px;
    height: 20px;
    padding: 0 0px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid ${props => props.theme.colors.background};
    box-shadow: 0 2px 8px rgba(239, 68, 68, 0.4);
    animation: ${pulse} 2s ease-in-out infinite;
    z-index: 1;
  }
`;

const ActivityIndicator = styled.div<{ $isActive: boolean }>`
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${props => props.$isActive ? '#22c55e' : '#94a3b8'};
  border: 2px solid ${props => props.theme.colors.background};
  box-shadow: 0 0 0 2px ${props => props.$isActive ? '#22c55e' : 'transparent'};
  ${props => props.$isActive && css`
    animation: ${pulse} 2s infinite;
  `}
  z-index: 2;
`;

const LanguageSelector = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  cursor: pointer;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;

  &:hover {
    background: ${BACKGROUND_SECONDARY};
    border-color: ${BORDER_COLOR};
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    
    span {
      color: ${PRIMARY_ACCENT};
    }
    ${IconWrapper} { 
      svg {
        color: ${PRIMARY_ACCENT};
        transform: scale(1.1);
      }
    }
  }

  span {
    font-size: ${props => props.theme.typography.fontSizes.sm};
    font-weight: ${props => props.theme.typography.fontWeights.medium};
    color: ${TEXT_COLOR_MUTED};
    transition: color 0.2s;
  }
`;

const UserProfileContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  cursor: pointer;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border-radius: ${props => props.theme.borderRadius.md};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;

  &:hover {
    background: ${BACKGROUND_SECONDARY};
    border-color: ${BORDER_COLOR};
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, ${PRIMARY_ACCENT} 0%, ${PRIMARY_HOVER} 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  font-size: ${props => props.theme.typography.fontSizes.sm};
  box-shadow: 0 4px 8px rgba(6, 182, 212, 0.25);
  transition: transform 0.2s;
  position: relative;
  
  ${UserProfileContainer}:hover & {
    transform: scale(1.05);
  }
`;

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const UserName = styled.span`
  font-size: ${props => props.theme.typography.fontSizes.sm};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_MUTED};
  line-height: 1.2;
`;

const UserRole = styled.span`
  font-size: ${props => props.theme.typography.fontSizes.xs};
  color: ${TEXT_COLOR_MUTED};
  opacity: 0.7;
  line-height: 1.2;
`;

const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + ${props => props.theme.spacing.sm});
  right: 0;
  width: 260px;
  background: ${props => props.theme.colors.background};
  border: 1px solid ${BORDER_COLOR};
  border-radius: ${props => props.theme.borderRadius.md};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  opacity: ${props => (props.$isOpen ? 1 : 0)};
  visibility: ${props => (props.$isOpen ? 'visible' : 'hidden')};
  transform: ${props => (props.$isOpen ? 'translateY(0)' : 'translateY(-8px)')};
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  backdrop-filter: blur(10px);
  
  ${props => props.$isOpen && css`
    animation: ${slideDown} 0.2s ease-out;
  `}
`;

const DropdownItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.md};
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  color: ${TEXT_COLOR_MUTED};
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  font-size: ${props => props.theme.typography.fontSizes.sm};
  position: relative;

  &:hover {
    background: ${PRIMARY_ACCENT}10;
    color: ${PRIMARY_ACCENT};
    padding-left: ${props => props.theme.spacing.xl};
    
    ${DropdownIcon} {
      opacity: 1;
      transform: scale(1.15);
    }
  }

  &:not(:last-child) {
    border-bottom: 1px solid ${BORDER_COLOR};
  }
  
  span {
    flex: 1;
  }
`;

const SignOutItem = styled(DropdownItem)`
  color: ${DANGER_COLOR};
  border-top: 2px solid ${BORDER_COLOR};
  margin-top: ${props => props.theme.spacing.xs};
  
  &:hover {
    background: ${DANGER_COLOR}10;
    color: #dc2626;
    padding-left: ${props => props.theme.spacing.xl};
    
    ${DropdownIcon} {
      opacity: 1;
      transform: scale(1.15);
    }
  }
  
  &:active {
    background: ${DANGER_COLOR}20;
  }
`;

const NotificationPanel = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 12px);
  right: 0;
  width: 420px;
  max-height: 500px; // 500px is the maximum height of the notification panel amare
  background: ${props => props.theme.mode === 'dark' ? 'rgba(30, 41, 59, 0.85)' : 'rgba(255, 255, 255, 0.85)'};
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid ${BORDER_COLOR};
  border-radius: 20px;
  box-shadow: 
    0 20px 40px rgba(0, 0, 0, 0.12),
    0 1px 3px rgba(0, 0, 0, 0.04),
    inset 0 0 0 1px ${props => props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.5)'};
  z-index: 1000;
  opacity: ${props => (props.$isOpen ? 1 : 0)};
  visibility: ${props => (props.$isOpen ? 'visible' : 'hidden')};
  transform: ${props => (props.$isOpen ? 'translateY(0)' : 'translateY(-12px)')};
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  
  ${props => props.$isOpen && css`
    animation: ${slideDown} 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  `}

  @media (max-width: 480px) {
    width: calc(100vw - 32px);
    right: -16px;
  }
`;

const NotificationPanelHeader = styled.div`
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: ${props => props.theme.mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(255, 255, 255, 0.4)'};
  
  h3 {
    font-size: 18px;
    font-weight: 700;
    color: ${props => props.theme.colors.text};
    margin: 0;
    letter-spacing: -0.02em;
  }
  
  .unread-badge {
    font-size: 11px;
    color: white;
    font-weight: 700;
    padding: 4px 10px;
    background: linear-gradient(135deg, ${PRIMARY_ACCENT} 0%, ${PRIMARY_HOVER} 100%);
    border-radius: 20px;
    box-shadow: 0 4px 8px ${PRIMARY_ACCENT}30;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .mark-all-read {
    font-size: 12px;
    font-weight: 600;
    color: ${PRIMARY_ACCENT};
    cursor: pointer;
    background: transparent;
    border: none;
    padding: 4px 8px;
    border-radius: 6px;
    transition: all 0.2s;

    &:hover {
      background: ${PRIMARY_ACCENT}10;
      transform: translateY(-1px);
    }
  }
`;

const NotificationPanelBody = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0px;
  background: transparent;
  scroll-behavior: smooth;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 10px;
    
    &:hover {
      background: rgba(0, 0, 0, 0.2);
    }
  }
`;

const NotificationList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const NotificationListItem = styled.div<{ $isRead: boolean; $type?: string }>`
  padding: 8px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  background: ${props => props.$isRead ? 'transparent' : (props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : '#ffffff')};
  border: 1px solid ${props => props.$isRead ? 'transparent' : BORDER_COLOR};
  display: flex;
  gap: 16px;
  position: relative;
  box-shadow: ${props => props.$isRead ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.04)'};
  
  &:hover {
    background: ${props => props.theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#ffffff'};
    transform: scale(1.01);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
    border-color: ${PRIMARY_ACCENT}40;
  }

  &::after {
    display: none; /* Hide the default left-side dot if using the right-side one */
  }

  .unread-dot {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    width: 12px;
    height: 12px;
    background: #0084ff;
    border-radius: 50%;
    box-shadow: 0 0 0 2px #fff;
  }
`;

const NotificationIconBox = styled.div<{ $type?: string }>`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${props => {
    switch (props.$type) {
      case 'success': return '#dcfce7';
      case 'error': return '#fee2e2';
      case 'warning': return '#fef3c7';
      default: return '#e0f2fe';
    }
  }};
  color: ${props => {
    switch (props.$type) {
      case 'success': return '#16a34a';
      case 'error': return '#dc2626';
      case 'warning': return '#d97706';
      default: return PRIMARY_ACCENT;
    }
  }};

  svg {
    width: 20px;
    height: 20px;
  }
`;

const NotificationContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const NotificationTitle = styled.h4<{ $isRead: boolean }>`
  font-size: 14px;
  font-weight: ${props => props.$isRead ? 500 : 700};
  color: ${props => props.theme.colors.text};
  margin: 0;
  line-height: 1.4;
`;

const NotificationMessage = styled.p`
  font-size: 13px;
  color: ${TEXT_COLOR_MUTED};
  margin: 0;
  line-height: 1.5;
`;

const NotificationMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  
  .time {
    font-size: 11px;
    font-weight: 600;
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.8;
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .priority {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;
  }
`;

const CollapseButton = styled.button`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
    width: 14px;
    height: 14px;
  }
`;

const NotificationItem = styled.div<{ $isRead: boolean }>`
  padding: ${props => props.theme.spacing.md} ${props => props.theme.spacing.lg};
  border-bottom: 1px solid ${BORDER_COLOR};
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  background: ${props => props.$isRead ? props.theme.colors.background : 'rgba(6, 182, 212, 0.05)'};
  position: relative;
  
  &:hover {
    background: ${BACKGROUND_SECONDARY};
    padding-left: ${props => props.theme.spacing.xl};
    transform: translateX(4px);
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  ${props => !props.$isRead && `
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: ${PRIMARY_ACCENT};
      border-radius: 0 2px 2px 0;
    }
  `}
`;

const NotificationItemContent = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.sm};
`;

const NotificationText = styled.div<{ $isRead?: boolean }>`
  flex: 1;
  
  p {
    font-size: ${props => props.theme.typography.fontSizes.sm};
    color: ${TEXT_COLOR_MUTED};
    margin: 0 0 ${props => props.theme.spacing.xs};
    line-height: 1.5;
    font-weight: ${props => props.$isRead ? props.theme.typography.fontWeights.medium : props.theme.typography.fontWeights.bold};
  }
  
  span {
    font-size: ${props => props.theme.typography.fontSizes.xs};
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.7;
  }
`;

const NotificationListText = styled.div<{ $isRead?: boolean }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  
  p {
    font-size: 14px;
    color: ${props => props.$isRead ? TEXT_COLOR_MUTED : props.theme.colors.text};
    margin: 0;
    line-height: 1.5;
    font-weight: ${props => props.$isRead ? 500 : 600};
    letter-spacing: -0.01em;
  }
  
  .notification-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .notification-time {
    font-size: 12px;
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.8;
    font-weight: 500;
    white-space: nowrap;
  }
  
  span {
    font-size: 12px;
    color: ${TEXT_COLOR_MUTED};
    opacity: 0.8;
    font-weight: 500;
  }
`;

const NotificationPanelFooter = styled.div`
  padding: 16px 24px;
  border-top: 1px solid ${BORDER_COLOR};
  background: ${BACKGROUND_SECONDARY};
  display: flex;
  gap: 12px;
`;

const ViewAllButton = styled.button`
  flex: 1;
  padding: 10px;
  font-size: 13px;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, ${PRIMARY_ACCENT} 0%, ${PRIMARY_HOVER} 100%);
  border: none;
  cursor: pointer;
  border-radius: 12px;
  transition: all 0.2s;
  box-shadow: 0 4px 12px ${PRIMARY_ACCENT}30;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 16px ${PRIMARY_ACCENT}40;
    filter: brightness(1.05);
  }
`;

const EmptyNotifications = styled.div`
  padding: 60px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  
  .icon-box {
    width: 64px;
    height: 64px;
    border-radius: 20px;
    background: ${BACKGROUND_SECONDARY};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${TEXT_COLOR_MUTED};
    margin-bottom: 8px;
  }

  p {
    font-size: 15px;
    font-weight: 600;
    color: ${props => props.theme.colors.text};
    margin: 0;
  }

  span {
    font-size: 13px;
    color: ${TEXT_COLOR_MUTED};
  }
`;

const LoadingNotifications = styled.div`
  padding: 60px 24px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  
  .spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(6, 182, 212, 0.1);
    border-top-color: ${PRIMARY_ACCENT};
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  p {
    font-size: 14px;
    font-weight: 600;
    color: #64748b;
  }
`;


const AppearanceSection = styled.div`
  border-top: 1px solid ${BORDER_COLOR};
  margin-top: ${props => props.theme.spacing.xs};
`;

const AppearanceToggle = styled.div`
  padding: 10px 16px;
  font-size: 11px;
  font-weight: 700;
  color: ${TEXT_COLOR_MUTED};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: ${BACKGROUND_SECONDARY};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;

  &:hover {
    background: ${props => props.theme.colors.background};
    color: ${props => props.theme.colors.text};
  }
`;

const AppearanceMenu = styled.div<{ $isOpen: boolean }>`
  max-height: ${props => props.$isOpen ? '200px' : '0'};
  overflow: hidden;
  transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s;
  opacity: ${props => props.$isOpen ? 1 : 0};
  background: ${props => props.theme.colors.background};
`;

const AppearanceItem = styled(DropdownItem) <{ $isActive?: boolean }>`
  padding-left: ${props => props.$isActive ? props.theme.spacing.xl : props.theme.spacing.lg};
  background: ${props => props.$isActive ? PRIMARY_ACCENT + '10' : 'transparent'};
  
  span {
    color: ${props => props.$isActive ? PRIMARY_ACCENT : 'inherit'};
    font-weight: ${props => props.$isActive ? 600 : 400};
  }
  
  ${DropdownIcon} {
    color: ${props => props.$isActive ? PRIMARY_ACCENT : undefined};
  }
`;

export default function Navbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [language, setLanguage] = useState('EN');

  // Use the new notification store
  const {
    notifications,
    unreadCount,
    isLoading: loadingNotifications,
    fetchNotifications: fetchNotificationsFromStore,
    markAsRead: markAsReadInStore,
    markAllAsRead: markAllAsReadInStore,
    setAccessibleUserIds,
    accessibleUserIds
  } = useNotificationStore();

  const { themePreference, setThemePreference } = useThemeStore();

  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [notificationsExpanded, setNotificationsExpanded] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationPanelRef = useRef<HTMLDivElement>(null);
  const notificationBadgeRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const previousUnreadCountRef = useRef<number>(0);
  const lastNotificationIdsRef = useRef<Set<number>>(new Set());
  const isInitialLoadRef = useRef(true);
  const { user, logout, isAuthenticated } = useAuth();
  const { user: storeUser } = useUserStore();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Initialize accessible user IDs for Finance Admin/Manager
  useEffect(() => {
    const initializeAccessibleUsers = async () => {
      if (!user) {
        setAccessibleUserIds(null);
        return;
      }

      const userRole = user?.role?.toLowerCase() || '';
      const isFinanceAdmin = userRole === 'finance_manager' || userRole === 'finance_admin' || userRole === 'manager';
      const isAdmin = userRole === 'admin' || userRole === 'super_admin';

      if (isAdmin) {
        // Admin sees all - no filtering needed
        setAccessibleUserIds(null);
        return;
      }

      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      const managerId = user.manager_id ? (typeof user.manager_id === 'string' ? parseInt(user.manager_id, 10) : user.manager_id) : null;

      if (isFinanceAdmin && userId) {
        // Finance Admin/Manager: Get their own valid subordinates (accountants and employees)
        try {
          const subordinatesRes = await apiClient.getSubordinates(userId);
          const subordinates = Array.isArray(subordinatesRes?.data) ? subordinatesRes.data : [];

          const validSubordinateIds = subordinates
            .map((sub: { id?: number | string; role?: string }) => {
              const subId = typeof sub.id === 'string' ? parseInt(sub.id, 10) : sub.id;
              const subRole = (sub.role || '').toLowerCase();
              if (typeof subId === 'number' && (subRole === 'accountant' || subRole === 'employee')) {
                return subId;
              }
              return null;
            })
            .filter((id): id is number => id !== null);

          setAccessibleUserIds([userId, ...validSubordinateIds]);
        } catch (err) {
          console.error('Failed to fetch subordinates for Finance Admin:', err);
          setAccessibleUserIds([userId]);
        }
      } else if (userRole === 'accountant' && userId && managerId) {
        // Accountant: Own + other subordinates of their manager who are Employees (for sales)
        try {
          const subordinatesRes = await apiClient.getSubordinates(managerId);
          const subordinates = Array.isArray(subordinatesRes?.data) ? subordinatesRes.data : [];

          const employeeIds = subordinates
            .map((sub: { id?: number | string; role?: string }) => {
              const subId = typeof sub.id === 'string' ? parseInt(sub.id, 10) : sub.id;
              const subRole = (sub.role || '').toLowerCase();
              if (typeof subId === 'number' && subRole === 'employee') return subId;
              return null;
            })
            .filter((id): id is number => id !== null);

          setAccessibleUserIds([userId, ...employeeIds]);
        } catch (err) {
          setAccessibleUserIds([userId]);
        }
      } else if (userRole === 'employee' && userId && managerId) {
        // Employee: Own + manager (for items created by finance admin)
        setAccessibleUserIds([userId, managerId]);
      } else {
        // Other roles: only see own notifications
        setAccessibleUserIds(userId ? [userId] : null);
      }
    };

    initializeAccessibleUsers();
  }, [user, setAccessibleUserIds]);

  // Online/Offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load recent searches
  useEffect(() => {
    const stored = localStorage.getItem('recent_searches');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored).slice(0, 5));
      } catch {
        setRecentSearches([]);
      }
    }
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchFocused(true);
      }
      if (e.key === 'Escape') {
        if (isDropdownOpen) setIsDropdownOpen(false);
        if (isNotificationPanelOpen) setIsNotificationPanelOpen(false);
        if (searchFocused) {
          setSearchFocused(false);
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDropdownOpen, isNotificationPanelOpen, searchFocused]);

  // Search suggestions
  useEffect(() => {
    if (search.trim().length > 2) {
      const suggestions = [
        'revenue', 'expense', 'budget', 'forecast', 'scenario',
        'variance', 'report', 'transaction', 'user', 'project'
      ].filter(s => s.toLowerCase().includes(search.toLowerCase()));
      setSearchSuggestions(suggestions.slice(0, 5));
    } else {
      setSearchSuggestions([]);
    }
  }, [search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const isSignOutClick = target?.closest('[data-signout]');
      const isDropdownClick = target?.closest('[data-dropdown-menu]');
      const isNotificationClick = target?.closest('[data-notification-panel]');
      const isNotificationBadgeClick = target?.closest('[data-notification-badge]');
      const isSearchClick = target?.closest('[data-search-container]');

      if (dropdownRef.current && !dropdownRef.current.contains(target as Node) && !isSignOutClick && !isDropdownClick) {
        setIsDropdownOpen(false);
      }

      const isNotificationArea = isNotificationClick || isNotificationBadgeClick ||
        (notificationPanelRef.current && notificationPanelRef.current.contains(target as Node)) ||
        (notificationBadgeRef.current && notificationBadgeRef.current.contains(target as Node));

      if (!isNotificationArea && isNotificationPanelOpen) {
        setIsNotificationPanelOpen(false);
      }

      if (!isSearchClick && searchFocused) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isNotificationPanelOpen, searchFocused]);

  // Store-based polling and toast synchronization
  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial fetch
    fetchNotificationsFromStore();

    // Set up polling (every 30 seconds for Navbar unread count - optimization)
    const intervalId = setInterval(() => {
      // Use fetchUnreadCount instead of fetchNotifications to save bandwidth
      // The store will trigger fetchNotifications automatically if count increases
      useNotificationStore.getState().fetchUnreadCount();
    }, 30000);

    return () => clearInterval(intervalId);
  }, [isAuthenticated, fetchNotificationsFromStore]);

  // Toast synchronization effect
  useEffect(() => {
    if (notifications.length === 0) return;

    // On initial load, just populate the seen IDs but don't show toasts
    if (isInitialLoadRef.current) {
      notifications.forEach(n => lastNotificationIdsRef.current.add(n.id));
      isInitialLoadRef.current = false;
      previousUnreadCountRef.current = unreadCount;
      return;
    }

    // Check for new notifications to toast
    const newNotifications = notifications.filter(n => !n.is_read && !lastNotificationIdsRef.current.has(n.id));

    if (newNotifications.length > 0) {
      newNotifications.forEach(notification => {
        lastNotificationIdsRef.current.add(notification.id);

        const toastType = notification.display_type || 'info';
        const toastFn = (toast as any)[toastType] || toast.info;

        toastFn(notification.title || 'New Notification', {
          description: notification.message,
          action: notification.action_url ? {
            label: 'View',
            onClick: () => {
              if (notification.action_url) {
                const url = notification.action_url.startsWith('/')
                  ? notification.action_url
                  : `/${notification.action_url}`;
                router.push(url);
                markAsReadInStore(notification.id);
              }
            }
          } : undefined
        });
      });
    }

    previousUnreadCountRef.current = unreadCount;
  }, [notifications, unreadCount, markAsReadInStore, router]);

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') || 'EN';
    setLanguage(savedLanguage);
  }, []);

  const queryParam = searchParams?.get('q') || '';
  useEffect(() => {
    if (pathname === '/search') {
      setSearch(prev => {
        if (prev !== queryParam) {
          return queryParam;
        }
        return prev;
      });
    } else {
      setSearch(prev => prev ? '' : prev);
    }
  }, [pathname, queryParam]);

  const navigateToSearch = useCallback((searchQuery: string) => {
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setRecentSearches(prev => {
        const updated = [searchQuery.trim(), ...prev.filter(s => s !== searchQuery.trim())].slice(0, 5);
        localStorage.setItem('recent_searches', JSON.stringify(updated));
        return updated;
      });
    } else if (pathname === '/search') {
      router.push('/search');
    }
  }, [router, pathname]);

  const debouncedSearchRef = useRef<((value: unknown) => void) | null>(null);

  useEffect(() => {
    debouncedSearchRef.current = debounce((value: unknown) => {
      if (typeof value === 'string') {
        navigateToSearch(value);
      } else {
        navigateToSearch(String(value));
      }
    }, 500);

    return () => {
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current = null;
      }
    };
  }, [navigateToSearch]);

  // The notification store now handles background fetching and synchronization.
  // We no longer need an independent effect for the notification panel.

  const handleAddClick = () => {
    if (pathname?.includes('/expenses')) {
      router.push('/expenses/items');
    } else if (pathname?.includes('/revenue')) {
      router.push('/revenue/list');
    } else if (pathname?.includes('/project')) {
      router.push('/project/create');
    } else if (pathname?.includes('/employees')) {
      router.push('/employees/create');
    } else if (pathname?.includes('/finance')) {
      router.push('/finance/create');
    } else if (pathname?.includes('/accountants')) {
      router.push('/accountants/create');
    } else if (pathname?.includes('/department')) {
      router.push('/department/create');
    } else {
      router.push('/expenses/items');
    }
  };

  const handleReportsClick = () => {
    router.push('/report');
  };

  const handleNotificationsClick = () => {
    const nextState = !isNotificationPanelOpen;
    setIsNotificationPanelOpen(nextState);
    setIsDropdownOpen(false);
    if (!nextState) {
      setNotificationsExpanded(false);
    } else {
      // Trigger a fresh fetch when opening the panel
      fetchNotificationsFromStore(true);
    }
  };

  const handleExpandNotifications = () => {
    setNotificationsExpanded(!notificationsExpanded);
    // Scroll to bottom after a brief delay to ensure DOM update
    setTimeout(() => {
      const panelBody = notificationPanelRef.current?.querySelector('[data-notification-body]');
      if (panelBody && !notificationsExpanded) {
        panelBody.scrollTo({
          top: panelBody.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  const handleViewAllNotifications = () => {
    setIsNotificationPanelOpen(false);
    router.push('/notifications');
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      try {
        await markAsReadInStore(notification.id);
      } catch (err) {
        console.error('Failed to mark notification as read:', err);
      }
    }
    setIsNotificationPanelOpen(false);

    // Navigate to action URL if available, otherwise to notifications page
    if (notification.action_url) {
      const url = notification.action_url.startsWith('/')
        ? notification.action_url
        : `/${notification.action_url}`;
      router.push(url);
    } else {
      router.push('/notifications');
    }
  };

  const formatNotificationDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleLanguageClick = () => {
    const newLanguage = language === 'EN' ? 'AR' : 'EN';
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const handleProfileClick = () => {
    router.push('/profile');
    setIsDropdownOpen(false);
  };

  const handleUsersClick = () => {
    router.push('/users');
    setIsDropdownOpen(false);
  };

  const handleSettingsClick = () => {
    const role = currentUser?.role?.toLowerCase();
    if (role === 'finance_admin' || role === 'finance_manager') {
      router.push('/settings/history');
    } else {
      router.push('/settings');
    }
    setIsDropdownOpen(false);
  };

  const handleRolesClick = () => {
    router.push('/permissions');
    setIsDropdownOpen(false);
  };

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropdownOpen(false);
    toast.loading('Signing out...', { id: 'signout' });

    try {
      try {
        await apiClient.logout();
      } catch {
      }
      try {
        const store = useUserStore.getState();
        if (store.logout) {
          await store.logout();
        }
      } catch (storeErr) {
        console.error('Store logout error:', storeErr);
        useUserStore.setState({
          user: null,
          isAuthenticated: false,
          subordinates: [],
          allUsers: [],
          isLoading: false,
          error: null,
        });
      }
      if (logout) {
        try {
          await logout();
        } catch (authErr) {
          console.error('Auth context logout error:', authErr);
        }
      }
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('language');
        localStorage.removeItem('recent_searches');
      }
      toast.success('Signed out successfully', { id: 'signout' });
      setTimeout(() => {
        window.location.href = '/';
      }, 500);

    } catch (error) {
      console.error('Sign out error:', error);
      if (typeof window !== 'undefined') {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('language');
        localStorage.removeItem('recent_searches');
      }
      try {
        useUserStore.setState({
          user: null,
          isAuthenticated: false,
          subordinates: [],
          allUsers: [],
          isLoading: false,
          error: null,
        });
      } catch (err) {
        console.error('Error clearing store:', err);
      }

      toast.success('Signed out', { id: 'signout' });
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }
  };

  const handleSignOutMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    handleSignOut(e);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigateToSearch(search);
      setSearchFocused(false);
    }
  };

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearch(value);
    if (value.trim()) {
      if (debouncedSearchRef.current) {
        debouncedSearchRef.current(value);
      }
    } else {
      if (pathname === '/search') {
        router.push('/search');
      }
    }
  }, [router, pathname]);

  const handleSuggestionClick = (suggestion: string) => {
    setSearch(suggestion);
    navigateToSearch(suggestion);
    setSearchFocused(false);
  };

  const showSuggestions = searchFocused && (searchSuggestions.length > 0 || recentSearches.length > 0);

  const currentUser: StoreUser | RbacUser | null = storeUser || user;
  const getUserName = (person: StoreUser | RbacUser | null): string => {
    if (!person) return 'User';
    if ('full_name' in person && person.full_name) return person.full_name;
    if ('name' in person && person.name) return person.name;
    if ('username' in person && person.username) return person.username;
    return person.email ?? 'User';
  };
  const userName = getUserName(currentUser);
  const initials = userName
    ? userName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
    : '?';
  const getRoleDisplayName = (role?: string) => {
    const roleMap: Record<string, string> = {
      admin: 'Administrator',
      finance_manager: 'Finance Manager',
      manager: 'Manager',
      accountant: 'Accountant',
      employee: 'Employee',
    };
    const normalizedRole = (role || '').toLowerCase();
    return roleMap[normalizedRole] || role || 'User';
  };

  const displayRole = getRoleDisplayName(currentUser?.role);

  return (
    <HeaderContainer>
      <SearchContainer data-search-container>
        <form onSubmit={handleSearch} style={{ width: '100%', position: 'relative' }}>
          <SearchIcon $active={search.length > 0 || searchFocused}>
            <Search size={18} />
          </SearchIcon>
          <SearchInput
            ref={searchInputRef}
            placeholder="Search... (Ctrl/Cmd + K)"
            value={search}
            onChange={handleSearchChange}
            onFocus={() => setSearchFocused(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch(e);
              }
            }}
          />
          <KeyboardHint>
            <kbd>{navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}</kbd>
            <span>+</span>
            <kbd>K</kbd>
          </KeyboardHint>
          {showSuggestions && (
            <SearchSuggestions $isOpen={showSuggestions}>
              {searchSuggestions.length > 0 && (
                <SuggestionSection>
                  <h4>Suggestions</h4>
                  {searchSuggestions.map((suggestion, idx) => (
                    <SuggestionItem
                      key={idx}
                      onClick={() => handleSuggestionClick(suggestion)}
                      $active={false}
                    >
                      <Search size={16} />
                      <span>{suggestion}</span>
                    </SuggestionItem>
                  ))}
                </SuggestionSection>
              )}
              {recentSearches.length > 0 && (
                <SuggestionSection>
                  <h4>Recent Searches</h4>
                  {recentSearches.map((recent, idx) => (
                    <SuggestionItem
                      key={idx}
                      onClick={() => handleSuggestionClick(recent)}
                      $active={false}
                      $isRecent={true}
                    >
                      <Clock size={16} />
                      <span>{recent}</span>
                    </SuggestionItem>
                  ))}
                </SuggestionSection>
              )}
            </SearchSuggestions>
          )}
        </form>
      </SearchContainer>

      <ActionsContainer>
        <ComponentGate componentId={ComponentId.EXPENSE_CREATE}>
          <AddButton onClick={handleAddClick} title="Add new item (Ctrl/Cmd + N)">
            <ButtonIcon $iconType="plus">
              <Plus />
            </ButtonIcon>
          </AddButton>
        </ComponentGate>
        {user && (
          <div ref={notificationBadgeRef} style={{ position: 'relative' }}>
            <NotificationBadge
              data-notification-badge="true"
              onClick={handleNotificationsClick}
            >
              <IconWrapper $iconType="bell" $active={unreadCount > 0} $size={30}>
                <Bell />
              </IconWrapper>
              {unreadCount > 0 && (
                <span>{unreadCount > 99 ? '99+' : unreadCount}</span>
              )}
              <ActivityIndicator $isActive={isOnline} />
            </NotificationBadge>
            <div ref={notificationPanelRef}>
              <NotificationPanel
                data-notification-panel="true"
                $isOpen={isNotificationPanelOpen}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
              >
                <NotificationPanelHeader>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h3>Notifications</h3>
                    {unreadCount > 0 && (
                      <div className="unread-badge">{unreadCount}</div>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      className="mark-all-read"
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllAsReadInStore();
                      }}
                    >
                      Mark all as read
                    </button>
                  )}
                </NotificationPanelHeader>
                <NotificationPanelBody data-notification-body>
                  {loadingNotifications ? (
                    <LoadingNotifications>
                      <div className="spinner" />
                      <p>Fetching notifications...</p>
                    </LoadingNotifications>
                  ) : notifications.length === 0 ? (
                    <EmptyNotifications>
                      <div className="icon-box">
                        <Bell size={28} />
                      </div>
                      <p>All caught up!</p>
                      <span>No new notifications at the moment.</span>
                    </EmptyNotifications>
                  ) : (
                    <NotificationList>
                      {(notificationsExpanded ? notifications.slice(0, 20) : notifications.slice(0, 5))
                        .map((notification) => {
                          // Determine type for styling
                          const notifType = notification.display_type ||
                            (notification.type?.includes('error') ? 'error' :
                              notification.type?.includes('warning') ? 'warning' :
                                notification.type?.includes('success') ? 'success' : 'info');

                          return (
                            <NotificationListItem
                              key={notification.id}
                              $isRead={notification.is_read}
                              $type={notifType}
                              onClick={() => handleNotificationClick(notification)}
                            >
                              <NotificationIconBox $type={notifType}>
                                {notification.title?.includes('🤖') || notification.title?.includes('AI') ? <Bot size={18} color="#06b6d4" /> :
                                  notification.type?.includes('mention') ? <AtSign size={18} color="#8b5cf6" /> :
                                    notifType === 'success' ? <CheckCircle size={18} /> :
                                      notifType === 'error' ? <XCircle size={18} /> :
                                        notifType === 'warning' ? <AlertCircle size={18} /> :
                                          <Info size={18} />}
                              </NotificationIconBox>

                              <NotificationContent>
                                <NotificationTitle $isRead={notification.is_read}>
                                  {notification.title || 'Notification'}
                                </NotificationTitle>
                                <NotificationMessage>
                                  {notification.message}
                                </NotificationMessage>
                                <NotificationMeta>
                                  <div className="time">
                                    {formatNotificationDate(notification.created_at)}
                                  </div>
                                </NotificationMeta>
                              </NotificationContent>
                              {!notification.is_read && <div className="unread-dot" />}
                            </NotificationListItem>
                          );
                        })}
                    </NotificationList>
                  )}
                </NotificationPanelBody>
                {notifications.length > 0 && (
                  <NotificationPanelFooter>
                    {notifications.length > 3 && (
                      <CollapseButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExpandNotifications();
                        }}
                      >
                        {notificationsExpanded ? (
                          <>
                            <ChevronUp size={14} />
                            Show Less
                          </>
                        ) : (
                          <>
                            <ChevronDown size={14} />
                            Show More ({notifications.length - 3})
                          </>
                        )}
                      </CollapseButton>
                    )}
                    <ViewAllButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewAllNotifications();
                      }}
                    >
                      All Notifications
                    </ViewAllButton>
                  </NotificationPanelFooter>
                )}
              </NotificationPanel>
            </div>
          </div>
        )}
        <ComponentGate componentId={ComponentId.REPORT_LIST}>
          <IconButton onClick={handleReportsClick} title="View reports" $iconType="file-spreadsheet">
            <NavIcon $iconType="file-spreadsheet">
              <FileSpreadsheet />
            </NavIcon>
          </IconButton>
        </ComponentGate>
        <LanguageSelector onClick={handleLanguageClick} title="Toggle language">
          <IconWrapper $iconType="globe">
            <Globe />
          </IconWrapper>
          <span>{language}</span>
        </LanguageSelector>
        <UserProfileContainer ref={dropdownRef} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
          <UserAvatar style={{ overflow: 'hidden' }}>
            {currentUser?.profileImageUrl ? (
              <img
                src={currentUser.profileImageUrl.startsWith('http') ? currentUser.profileImageUrl : `http://localhost:8000${currentUser.profileImageUrl}`}
                alt="Profile"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              initials
            )}
            <ActivityIndicator $isActive={isOnline} />
          </UserAvatar>
          <UserInfo>
            <UserName>{userName}</UserName>
            <UserRole>{displayRole}</UserRole>
          </UserInfo>
        </UserProfileContainer>
        <DropdownMenu
          data-dropdown-menu="true"
          $isOpen={isDropdownOpen}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
        >
          <DropdownItem onClick={handleProfileClick}>
            <DropdownIcon $iconType="user">
              <User size={16} />
            </DropdownIcon>
            <span>Profile</span>
          </DropdownItem>
          {currentUser && (
            (currentUser.role?.toLowerCase() === 'admin' ||
              currentUser.role?.toLowerCase() === 'super_admin' ||
              currentUser.role?.toLowerCase() === 'finance_admin' ||
              currentUser.role?.toLowerCase() === 'finance_manager'
            ) && (
              <DropdownItem onClick={handleUsersClick}>
                <DropdownIcon $iconType="users">
                  <Users size={16} />
                </DropdownIcon>
                <span>Users</span>
              </DropdownItem>
            )
          )}
          {currentUser && (
            (currentUser.role?.toLowerCase() !== 'accountant' &&
              currentUser.role?.toLowerCase() !== 'employee'
            ) && (
              <DropdownItem onClick={handleSettingsClick}>
                <DropdownIcon $iconType={(currentUser?.role?.toLowerCase() === 'finance_admin' || currentUser?.role?.toLowerCase() === 'finance_manager') ? "history" : "settings"}>
                  {(currentUser?.role?.toLowerCase() === 'finance_admin' || currentUser?.role?.toLowerCase() === 'finance_manager') ? <Clock size={16} /> : <Settings size={16} />}
                </DropdownIcon>
                <span>{(currentUser?.role?.toLowerCase() === 'finance_admin' || currentUser?.role?.toLowerCase() === 'finance_manager') ? "History" : "Settings"}</span>
              </DropdownItem>
            )
          )}
          <ComponentGate componentId={ComponentId.PERMISSION_EDIT}>
            <DropdownItem onClick={handleRolesClick}>
              <DropdownIcon $iconType="help-circle">
                <HelpCircle size={16} />
              </DropdownIcon>
              <span>Role & Permission Management</span>
            </DropdownItem>
          </ComponentGate>

          <AppearanceSection>
            <AppearanceToggle onClick={() => setIsAppearanceOpen(!isAppearanceOpen)}>
              <span>Appearance</span>
              <ChevronDown
                size={14}
                style={{
                  transform: isAppearanceOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </AppearanceToggle>

            <AppearanceMenu $isOpen={isAppearanceOpen}>
              <AppearanceItem
                onClick={() => setThemePreference('light')}
                $isActive={themePreference === 'light'}
              >
                <DropdownIcon $iconType="sun" $active={themePreference === 'light'}>
                  <Sun size={16} />
                </DropdownIcon>
                <span>Light Mode</span>
                {themePreference === 'light' && <Check size={14} style={{ color: PRIMARY_ACCENT }} />}
              </AppearanceItem>

              <AppearanceItem
                onClick={() => setThemePreference('dark')}
                $isActive={themePreference === 'dark'}
              >
                <DropdownIcon $iconType="moon" $active={themePreference === 'dark'}>
                  <Moon size={16} />
                </DropdownIcon>
                <span>Dark Mode</span>
                {themePreference === 'dark' && <Check size={14} style={{ color: PRIMARY_ACCENT }} />}
              </AppearanceItem>

              <AppearanceItem
                onClick={() => setThemePreference('system')}
                $isActive={themePreference === 'system'}
              >
                <DropdownIcon $iconType="monitor" $active={themePreference === 'system'}>
                  <Monitor size={16} />
                </DropdownIcon>
                <span>System Default</span>
                {themePreference === 'system' && <Check size={14} style={{ color: PRIMARY_ACCENT }} />}
              </AppearanceItem>
            </AppearanceMenu>
          </AppearanceSection>
          <SignOutItem
            data-signout="true"
            onMouseDown={handleSignOutMouseDown}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            style={{ cursor: 'pointer' }}
          >
            <DropdownIcon $iconType="log-out" $active={true}>
              <LogOut size={16} />
            </DropdownIcon>
            <span>Sign Out</span>
          </SignOutItem>
        </DropdownMenu>
      </ActionsContainer>
    </HeaderContainer>
  );
}