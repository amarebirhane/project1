'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import {
    Home, DollarSign, ArrowUpCircle, Receipt,
    Settings, User, Moon, Sun, Monitor, Search
} from 'lucide-react';
import { theme } from './theme';
import { useThemeStore } from '@/store/useThemeStore';
import { useTranslations } from 'next-intl';

const DialogOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  z-index: 9999;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 15vh;
`;

const StyledCommand = styled(Command)`
  width: 100%;
  max-width: 600px;
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  box-shadow: 0 16px 70px rgba(0, 0, 0, 0.2);
  border: 1px solid ${theme.colors.border};
  overflow: hidden;

  [cmdk-input] {
    width: 100%;
    padding: ${theme.spacing.lg};
    border: none;
    border-bottom: 1px solid ${theme.colors.border};
    background: transparent;
    color: ${theme.colors.text};
    font-size: ${theme.typography.fontSizes.lg};
    outline: none;
    
    &::placeholder {
      color: ${theme.colors.textSecondary};
    }
  }

  [cmdk-list] {
    max-height: 400px;
    overflow: auto;
    padding: ${theme.spacing.sm};
    
    &::-webkit-scrollbar {
      width: 6px;
    }
    &::-webkit-scrollbar-thumb {
      background: ${theme.colors.border};
      border-radius: 3px;
    }
  }

  [cmdk-group-heading] {
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    color: ${theme.colors.textSecondary};
    font-size: ${theme.typography.fontSizes.xs};
    font-weight: ${theme.typography.fontWeights.bold};
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  [cmdk-item] {
    padding: ${theme.spacing.md};
    border-radius: ${theme.borderRadius.sm};
    display: flex;
    align-items: center;
    gap: ${theme.spacing.md};
    color: ${theme.colors.text};
    cursor: pointer;
    font-size: ${theme.typography.fontSizes.md};
    margin-bottom: ${theme.spacing.xs};
    transition: all 0.1s ease;

    svg {
      width: 18px;
      height: 18px;
      color: ${theme.colors.textSecondary};
    }

    &[data-selected="true"] {
      background: ${theme.colors.backgroundSecondary};
      color: ${theme.colors.primary};
      transform: translateX(4px);
      
      svg {
        color: ${theme.colors.primary};
      }
    }
  }

  [cmdk-empty] {
    padding: ${theme.spacing.xl};
    text-align: center;
    color: ${theme.colors.textSecondary};
  }
`;

const HelpText = styled.div`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-top: 1px solid ${theme.colors.border};
  color: ${theme.colors.textSecondary};
  font-size: ${theme.typography.fontSizes.xs};
  display: flex;
  justify-content: space-between;
  background: ${theme.colors.backgroundSecondary};
  
  kbd {
    background: ${theme.colors.background};
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.sm};
    padding: 2px 6px;
    font-size: 10px;
    font-family: monospace;
    margin: 0 2px;
  }
`;

export default function CommandPalette() {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const { setThemePreference } = useThemeStore();
    const t = useTranslations('Common');

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };

        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const runCommand = useCallback((command: () => void) => {
        setOpen(false);
        command();
    }, []);

    if (!open) return null;

    return (
        <DialogOverlay onClick={() => setOpen(false)}>
            <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: '600px', margin: '0 16px' }}>
                <StyledCommand label="Global Command Menu">
                    <Command.Input placeholder="Type a command or search..." autoFocus />
                    <Command.List>
                        <Command.Empty>No results found.</Command.Empty>

                        <Command.Group heading="Navigation">
                            <Command.Item onSelect={() => runCommand(() => router.push('/dashboard'))}>
                                <Home /> {t('dashboard')}
                            </Command.Item>
                            <Command.Item onSelect={() => runCommand(() => router.push('/revenue/list'))}>
                                <DollarSign /> {t('revenue')}
                            </Command.Item>
                            <Command.Item onSelect={() => runCommand(() => router.push('/expenses/list'))}>
                                <ArrowUpCircle /> {t('expenses')}
                            </Command.Item>
                            <Command.Item onSelect={() => runCommand(() => router.push('/transaction/list'))}>
                                <Receipt /> Transactions
                            </Command.Item>
                            <Command.Item onSelect={() => runCommand(() => router.push('/search'))}>
                                <Search /> Global Search
                            </Command.Item>
                            <Command.Item onSelect={() => runCommand(() => router.push('/settings/general'))}>
                                <Settings /> {t('settings')}
                            </Command.Item>
                        </Command.Group>

                        <Command.Group heading="Theme">
                            <Command.Item onSelect={() => runCommand(() => setThemePreference('light'))}>
                                <Sun /> Light Theme
                            </Command.Item>
                            <Command.Item onSelect={() => runCommand(() => setThemePreference('dark'))}>
                                <Moon /> Dark Theme
                            </Command.Item>
                            <Command.Item onSelect={() => runCommand(() => setThemePreference('system'))}>
                                <Monitor /> System Theme
                            </Command.Item>
                        </Command.Group>

                    </Command.List>

                    <HelpText>
                        <span>Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
                        <span><kbd>Enter</kbd> to select</span>
                        <span><kbd>Esc</kbd> to close</span>
                    </HelpText>
                </StyledCommand>
            </div>
        </DialogOverlay>
    );
}
