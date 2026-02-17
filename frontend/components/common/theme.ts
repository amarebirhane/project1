import 'styled-components';

// theme.ts
export interface Theme {
  colors: {
    background: string;
    backgroundSecondary: string;
    primary: string;
    text: string;
    textDark: string;
    textSecondary: string;
    border: string;
    error: string;
    card: string;
    muted: string;
    mutedForeground: string;
    warning: string;
    primaryForeground: string;
    inputBg: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  typography: {
    fontFamily: string;
    fontSizes: {
      sm: string;
      md: string;
      lg: string;
      xs: string;
      xxl: string;
    };
    fontWeights: {
      medium: number;
      bold: number;
    };
  };
  shadows: {
    sm: string;
    md: string;
  };
  transitions: {
    default: string;
  };
  mode: 'light' | 'dark';
}

declare module 'styled-components' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  export interface DefaultTheme extends Theme { }
}

const commonTokens = {
  borderRadius: {
    sm: "4px",
    md: "8px",
    lg: "12px",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "64px",
  },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
    fontSizes: {
      sm: "12px",
      md: "14px",
      lg: "18px",
      xs: "10px",
      xxl: "36px"
    },
    fontWeights: {
      medium: 500,
      bold: 700,
    },
  },
  transitions: {
    default: "0.2s ease-in-out",
  },
};

// These themes now return CSS variables instead of static values
export const lightTheme: Theme = {
  ...commonTokens,
  mode: 'light',
  colors: {
    background: "var(--background, #fff)",
    backgroundSecondary: "var(--background-secondary, #f5f5f5)",
    primary: "var(--primary, #00AA00)",
    text: "var(--text, #333)",
    textDark: "var(--text-dark, #111827)",
    textSecondary: "var(--text-secondary, #666)",
    border: "var(--border, #ddd)",
    error: "var(--error, #ef4444)",
    card: "var(--card, #fff)",
    muted: "var(--muted, #f3f4f6)",
    mutedForeground: "var(--muted-foreground, #6b7280)",
    warning: "var(--warning, #f59e0b)",
    primaryForeground: "var(--primary-foreground, #fff)",
    inputBg: "var(--input-bg, #fff)",
  },
  shadows: {
    sm: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.1))",
    md: "var(--shadow-md, 0 4px 8px rgba(0,0,0,0.1))",
  },
};

export const darkTheme: Theme = {
  ...commonTokens,
  mode: 'dark',
  colors: {
    background: "var(--background, #0f172a)",
    backgroundSecondary: "var(--background-secondary, #1e293b)",
    primary: "var(--primary, #00AA00)",
    text: "var(--text, #f1f5f9)",
    textDark: "var(--text-dark, #f8fafc)",
    textSecondary: "var(--text-secondary, #94a3b8)",
    border: "var(--border, #334155)",
    error: "var(--error, #f87171)",
    card: "var(--card, #1e293b)",
    muted: "var(--muted, #1e293b)",
    mutedForeground: "var(--muted-foreground, #94a3b8)",
    warning: "var(--warning, #fbbf24)",
    primaryForeground: "var(--primary-foreground, #fff)",
    inputBg: "var(--input-bg, #1e293b)",
  },
  shadows: {
    sm: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.3))",
    md: "var(--shadow-md, 0 4px 8px rgba(0,0,0,0.4))",
  },
};

export const theme = lightTheme;