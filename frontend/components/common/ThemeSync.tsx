'use client';

import { useEffect } from 'react';
import useThemeStore from '@/store/useThemeStore';

export default function ThemeSync() {
    const themePreference = useThemeStore((state) => state.themePreference);

    useEffect(() => {
        const applyTheme = () => {
            const html = document.documentElement;
            let effectiveTheme: 'light' | 'dark' = 'light';

            if (themePreference === 'dark') {
                effectiveTheme = 'dark';
            } else if (themePreference === 'light') {
                effectiveTheme = 'light';
            } else {
                // system
                effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
                    ? 'dark'
                    : 'light';
            }

            // Apply class for standard Tailwind-like support
            if (effectiveTheme === 'dark') {
                html.classList.add('dark');
                html.style.colorScheme = 'dark';
            } else {
                html.classList.remove('dark');
                html.style.colorScheme = 'light';
            }

            // Set CSS variables for our dynamic theme system
            if (effectiveTheme === 'dark') {
                html.style.setProperty('--background', '#0f172a');
                html.style.setProperty('--background-secondary', '#1e293b');
                html.style.setProperty('--primary', '#00AA00');
                html.style.setProperty('--text', '#f1f5f9');
                html.style.setProperty('--text-dark', '#f8fafc');
                html.style.setProperty('--text-secondary', '#94a3b8');
                html.style.setProperty('--border', '#334155');
                html.style.setProperty('--error', '#f87171');
                html.style.setProperty('--card', '#1e293b');
                html.style.setProperty('--muted', '#1e293b');
                html.style.setProperty('--muted-foreground', '#94a3b8');
                html.style.setProperty('--background-tertiary', '#2d3748');
                html.style.setProperty('--shadow-sm', '0 1px 3px rgba(0,0,0,0.3)');
                html.style.setProperty('--shadow-md', '0 4px 8px rgba(0,0,0,0.4)');
            } else {
                html.style.setProperty('--background', '#ffffff');
                html.style.setProperty('--background-secondary', '#f5f5f5');
                html.style.setProperty('--primary', '#00AA00');
                html.style.setProperty('--text', '#333');
                html.style.setProperty('--text-dark', '#111827');
                html.style.setProperty('--text-secondary', '#666');
                html.style.setProperty('--border', '#ddd');
                html.style.setProperty('--error', '#ef4444');
                html.style.setProperty('--card', '#ffffff');
                html.style.setProperty('--muted', '#f3f4f6');
                html.style.setProperty('--muted-foreground', '#6b7280');
                html.style.setProperty('--background-tertiary', '#f0f2f5');
                html.style.setProperty('--shadow-sm', '0 1px 3px rgba(0,0,0,0.1)');
                html.style.setProperty('--shadow-md', '0 4px 8px rgba(0,0,0,0.1)');
            }
        };

        applyTheme();

        if (themePreference === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            const handler = () => applyTheme();
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        }
    }, [themePreference]);

    return null;
}
