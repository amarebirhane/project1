import { useColorScheme } from 'react-native';

export function useTheme() {
    const colorScheme = useColorScheme();

    const isDark = colorScheme === 'dark';

    const colors = {
        background: isDark ? '#0f172a' : '#ffffff',
        text: isDark ? '#f8fafc' : '#0f172a',
        primary: '#06b6d4',
        secondary: isDark ? '#1e293b' : '#f1f5f9',
        muted: isDark ? '#94a3b8' : '#64748b',
        card: isDark ? '#1e293b' : '#ffffff',
        border: isDark ? '#334155' : '#e2e8f0',
        error: '#ef4444',
        warning: '#f59e0b',
    };

    return {
        isDark,
        colors,
        theme: colorScheme,
    };
}
