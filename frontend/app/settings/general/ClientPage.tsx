'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { ComponentGate, ComponentId } from '@/lib/rbac';
import { useAuth } from '@/lib/rbac/auth-context';
import { useAuthorization } from '@/lib/rbac/use-authorization';
import { UserType } from '@/lib/rbac/models';
import { Save, Globe, Bell, Moon, Sun, Monitor, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { theme, darkTheme, lightTheme } from '@/components/common/theme';
import { toast } from 'sonner';
import { useThemeStore } from '@/store/useThemeStore';
import { useRouter } from 'next/navigation';

const PRIMARY_COLOR = (props: any) => props.theme.colors.primary;
const TEXT_COLOR = (props: any) => props.theme.colors.text;
const TEXT_COLOR_MUTED = (props: any) => props.theme.colors.textSecondary;
const TEXT_COLOR_DARK = (props: any) => props.theme.colors.textDark;
const BORDER_COLOR = (props: any) => props.theme.colors.border;
const BACKGROUND_COLOR = (props: any) => props.theme.colors.background;


const Container = styled.div`
  max-width: 1000px;
  margin: 20px auto;
  padding: ${props => props.theme.spacing.md};
  min-height: 100vh;
  background-color: ${BACKGROUND_COLOR};
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${props => props.theme.spacing.xl};
  padding-bottom: ${props => props.theme.spacing.md};
  border-bottom: 2px solid ${BORDER_COLOR};
`;

const Title = styled.h1`
  font-size: ${props => props.theme.typography.fontSizes.xxl};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR};
  margin: 0;
`;

const Card = styled.div`
  background-color: ${props => props.theme.colors.card};
  border-radius: ${props => props.theme.borderRadius.md};
  border: 1px solid ${props => props.theme.colors.border};
  box-shadow: ${props => props.theme.shadows.sm};
  margin-bottom: ${props => props.theme.spacing.lg};
  transition: all ${props => props.theme.transitions.default};

  &:hover {
    box-shadow: ${props => props.theme.shadows.md};
  }
`;

const CardHeader = styled.div`
  padding: ${props => props.theme.spacing.lg};
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid ${props => props.theme.colors.border};
`;

const CardTitle = styled.h3`
  font-size: ${props => props.theme.typography.fontSizes.lg};
  font-weight: ${props => props.theme.typography.fontWeights.bold};
  color: ${TEXT_COLOR_DARK};
  margin: 0;
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  
  svg {
    width: 20px;
    height: 20px;
    color: ${PRIMARY_COLOR};
  }
`;

const CardContent = styled.div`
  padding: ${props => props.theme.spacing.lg};
`;

const FormGroup = styled.div`
  margin-bottom: ${props => props.theme.spacing.lg};
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  display: block;
  font-size: ${props => props.theme.typography.fontSizes.md};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  margin-bottom: ${props => props.theme.spacing.sm};
  color: ${TEXT_COLOR_DARK};
`;

const HelperText = styled.p`
  font-size: ${props => props.theme.typography.fontSizes.sm};
  color: ${TEXT_COLOR_MUTED};
  margin-top: ${props => props.theme.spacing.xs};
  margin-bottom: 0;
`;

const Select = styled.select`
  width: 100%;
  padding: ${props => props.theme.spacing.sm} ${props => props.theme.spacing.md};
  border: 1px solid ${props => props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  font-size: ${props => props.theme.typography.fontSizes.md};
  background-color: ${props => props.theme.colors.card};
  color: ${TEXT_COLOR};
  transition: all ${props => props.theme.transitions.default};
  cursor: pointer;
  
  &:focus {
    outline: none;
    border-color: ${PRIMARY_COLOR};
    box-shadow: 0 0 0 3px color-mix(in srgb, ${props => props.theme.colors.primary}, transparent 90%);
  }
  
  &:hover {
    border-color: ${PRIMARY_COLOR};
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: ${props => props.theme.spacing.md};
  margin-top: ${props => props.theme.spacing.xl};
`;

const Switch = styled.label`
  position: relative;
  display: inline-block;
  width: 48px;
  height: 24px;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  
  &:checked + span {
    background-color: ${PRIMARY_COLOR};
  }
  
  &:checked + span:before {
    transform: translateX(24px);
  }
  
  &:focus + span {
    box-shadow: 0 0 0 3px rgba(0, 170, 0, 0.1);
  }
`;

const SwitchSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${props => props.theme.colors.border};
  transition: ${props => props.theme.transitions.default};
  border-radius: 24px;
  
  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: ${props => props.theme.colors.card};
    transition: ${props => props.theme.transitions.default};
    border-radius: 50%;
    box-shadow: ${props => props.theme.shadows.sm};
  }
`;

const SwitchContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ThemeOptions = styled.div`
  display: flex;
  gap: ${props => props.theme.spacing.md};
  flex-wrap: wrap;
`;

const ThemeOption = styled.div<{ $isSelected: boolean }>`
  padding: ${props => props.theme.spacing.md};
  border: 2px solid ${props => props.$isSelected ? props.theme.colors.primary : props.theme.colors.border};
  border-radius: ${props => props.theme.borderRadius.md};
  cursor: pointer;
  background-color: ${props => props.$isSelected ? `color-mix(in srgb, ${props.theme.colors.primary}, transparent 90%)` : props.theme.colors.card};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  min-width: 100px;
  transition: all ${props => props.theme.transitions.default};
  user-select: none;
  position: relative;
  
  &:hover {
    border-color: ${props => props.theme.colors.primary};
    transform: translateY(-2px);
    box-shadow: ${props => props.theme.shadows.md};
    background-color: ${props => props.$isSelected
    ? `color-mix(in srgb, ${props.theme.colors.primary}, transparent 85%)`
    : `color-mix(in srgb, ${props.theme.colors.primary}, transparent 95%)`};
  }
  
  &:active {
    transform: translateY(0);
  }

  &::after {
    content: ${props => props.$isSelected ? "'✓'" : "''"};
    position: absolute;
    top: 4px;
    right: 4px;
    width: 20px;
    height: 20px;
    background: ${props => props.$isSelected ? props.theme.colors.primary : 'transparent'};
    color: white;
    border-radius: 50%;
    display: ${props => props.$isSelected ? 'flex' : 'none'};
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
  }
`;

const ThemeIcon = styled.div`
  background-color: ${props => props.theme.colors.backgroundSecondary};
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color ${props => props.theme.transitions.default};
  
  ${ThemeOption}:hover & {
    background-color: color-mix(in srgb, ${props => props.theme.colors.primary}, transparent 90%);
  }
  
  svg {
    width: 24px;
    height: 24px;
    color: ${TEXT_COLOR_DARK};
  }
`;

const ThemeLabel = styled.span`
  font-size: ${props => props.theme.typography.fontSizes.sm};
  font-weight: ${props => props.theme.typography.fontWeights.medium};
  color: ${TEXT_COLOR_DARK};
`;

const SuccessBanner = styled.div`
  background: color-mix(in srgb, ${props => props.theme.colors.primary}, transparent 90%);
  border: 1px solid color-mix(in srgb, ${props => props.theme.colors.primary}, transparent 70%);
  border-radius: ${props => props.theme.borderRadius.md};
  padding: ${props => props.theme.spacing.md};
  margin-bottom: ${props => props.theme.spacing.lg};
  display: flex;
  align-items: center;
  gap: ${props => props.theme.spacing.sm};
  color: ${props => props.theme.colors.primary};
  font-size: ${props => props.theme.typography.fontSizes.md};
  
  svg {
    flex-shrink: 0;
    width: 20px;
    height: 20px;
  }
`;

interface GeneralSettings {
  language: string;
  timezone: string;
  theme: 'light' | 'dark' | 'system';
  dateFormat: string;
  autoSave: boolean;
  compactView: boolean;
}

const defaultSettings: GeneralSettings = {
  language: 'en',
  timezone: 'UTC',
  theme: 'light',
  dateFormat: 'MM/DD/YYYY',
  autoSave: true,
  compactView: false
};

const getSettingsStorageKey = (userId?: number | string): string => {
  return userId ? `user_${userId}_general_settings` : 'user_general_settings';
};

const loadSettings = (userId?: number | string): GeneralSettings => {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const key = getSettingsStorageKey(userId);
    const stored = localStorage.getItem(key);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return defaultSettings;
};

const saveSettings = (settings: GeneralSettings, userId?: number | string): void => {
  if (typeof window === 'undefined') return;
  try {
    const key = getSettingsStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings:', error);
    throw error;
  }
};

const applyCompactView = (enabled: boolean): void => {
  if (typeof window === 'undefined') return;
  if (enabled) {
    document.documentElement.classList.add('compact-view');
  } else {
    document.documentElement.classList.remove('compact-view');
  }
};

export default function GeneralSettingsPage() {
  const { user } = useAuth();
  const { hasUserType } = useAuthorization();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const themePreference = useThemeStore(state => state.themePreference);
  const setThemePreference = useThemeStore(state => state.setThemePreference);

  const [settings, setSettings] = useState<GeneralSettings>(() => loadSettings(user?.id));

  // Load settings when user changes
  useEffect(() => {
    if (user?.id) {
      const loadedSettings = loadSettings(user.id);
      setSettings(loadedSettings);

      // Update global theme store if local storage for this user has a preference
      if (loadedSettings.theme !== themePreference) {
        setThemePreference(loadedSettings.theme);
      }

      // Apply compact view immediately on load
      setTimeout(() => {
        applyCompactView(loadedSettings.compactView);
      }, 0);
    }
  }, [user?.id]);

  // Apply compact view when it changes
  useEffect(() => {
    applyCompactView(settings.compactView);
  }, [settings.compactView]);

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: checked }));
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    // Apply theme immediately via global store
    setThemePreference(theme);

    // Update local state
    const newSettings = { ...settings, theme };
    setSettings(newSettings);

    // Auto-save theme change immediately (don't wait for Save button)
    try {
      saveSettings(newSettings, user?.id);

      const themeNames = {
        light: 'Light',
        dark: 'Dark',
        system: 'System'
      };
      toast.success(`Theme changed to ${themeNames[theme]}`);
    } catch (error) {
      console.error('Failed to auto-save theme:', error);
      toast.error('Failed to save theme preference');
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess(null);

    try {
      // Save to localStorage
      saveSettings(settings, user?.id);

      // Save language to cookie for next-intl
      document.cookie = `NEXT_LOCALE=${settings.language}; path=/; max-age=31536000`;

      // Apply compact view immediately
      applyCompactView(settings.compactView);

      setSuccess('Settings saved successfully!');
      toast.success('Settings saved successfully!');

      // Refresh router so server components pick up the new language
      router.refresh();
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container>
        <p>Loading...</p>
      </Container>
    );
  }

  return (
    <ComponentGate componentId={ComponentId.SETTINGS_VIEW}>
      <Container>
        <Header>
          <Title>General Settings</Title>
        </Header>

        {success && (
          <SuccessBanner>
            <CheckCircle />
            <span>{success}</span>
          </SuccessBanner>
        )}

        {hasUserType(UserType.ADMIN) && (
          <Card>
            <CardHeader>
              <CardTitle>
                <Globe />
                Regional Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormGroup>
                <Label htmlFor="language">Language</Label>
                <Select
                  id="language"
                  name="language"
                  value={settings.language}
                  onChange={handleInputChange}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                  <option value="zh">Chinese</option>
                  <option value="ja">Japanese</option>
                </Select>
                <HelperText>The language used throughout the application.</HelperText>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  id="timezone"
                  name="timezone"
                  value={settings.timezone}
                  onChange={handleInputChange}
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="America/New_York">EST (Eastern Standard Time)</option>
                  <option value="America/Chicago">CST (Central Standard Time)</option>
                  <option value="America/Los_Angeles">PST (Pacific Standard Time)</option>
                  <option value="Europe/London">GMT (Greenwich Mean Time)</option>
                  <option value="Europe/Paris">CET (Central European Time)</option>
                  <option value="Asia/Dubai">GST (Gulf Standard Time)</option>
                  <option value="Asia/Tokyo">JST (Japan Standard Time)</option>
                  <option value="Asia/Shanghai">CST (China Standard Time)</option>
                </Select>
                <HelperText>Affects how dates and times are displayed throughout the application.</HelperText>
              </FormGroup>

              <FormGroup>
                <Label htmlFor="dateFormat">Date Format</Label>
                <Select
                  id="dateFormat"
                  name="dateFormat"
                  value={settings.dateFormat}
                  onChange={handleInputChange}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US Format)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (European Format)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO Format)</option>
                  <option value="DD MMM YYYY">DD MMM YYYY (e.g., 01 Jan 2024)</option>
                </Select>
                <HelperText>The format in which dates will be displayed throughout the application.</HelperText>
              </FormGroup>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              <Bell />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormGroup>
              <Label>Theme</Label>
              <ThemeOptions>
                <ThemeOption
                  $isSelected={settings.theme === 'light'}
                  onClick={() => handleThemeChange('light')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleThemeChange('light');
                    }
                  }}
                >
                  <ThemeIcon>
                    <Sun />
                  </ThemeIcon>
                  <ThemeLabel>Light</ThemeLabel>
                </ThemeOption>
                <ThemeOption
                  $isSelected={settings.theme === 'dark'}
                  onClick={() => handleThemeChange('dark')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleThemeChange('dark');
                    }
                  }}
                >
                  <ThemeIcon>
                    <Moon />
                  </ThemeIcon>
                  <ThemeLabel>Dark</ThemeLabel>
                </ThemeOption>
                <ThemeOption
                  $isSelected={settings.theme === 'system'}
                  onClick={() => handleThemeChange('system')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleThemeChange('system');
                    }
                  }}
                >
                  <ThemeIcon>
                    <Monitor />
                  </ThemeIcon>
                  <ThemeLabel>System</ThemeLabel>
                </ThemeOption>
              </ThemeOptions>
              <HelperText>
                Choose your preferred color theme. Changes apply immediately.
                System will match your operating system preference.
              </HelperText>
            </FormGroup>

            <FormGroup>
              <SwitchContainer>
                <div>
                  <Label htmlFor="compactView">Compact View</Label>
                  <HelperText>Display more content with less spacing for better productivity</HelperText>
                </div>
                <Switch>
                  <SwitchInput
                    type="checkbox"
                    id="compactView"
                    name="compactView"
                    checked={settings.compactView}
                    onChange={handleSwitchChange}
                  />
                  <SwitchSlider />
                </Switch>
              </SwitchContainer>
            </FormGroup>
          </CardContent>
        </Card>

        {hasUserType(UserType.ADMIN) && (
          <Card>
            <CardHeader>
              <CardTitle>
                Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FormGroup>
                <SwitchContainer>
                  <div>
                    <Label htmlFor="autoSave">Auto-save</Label>
                    <HelperText>Automatically save changes when editing forms and documents</HelperText>
                  </div>
                  <Switch>
                    <SwitchInput
                      type="checkbox"
                      id="autoSave"
                      name="autoSave"
                      checked={settings.autoSave}
                      onChange={handleSwitchChange}
                    />
                    <SwitchSlider />
                  </Switch>
                </SwitchContainer>
              </FormGroup>
            </CardContent>
          </Card>
        )}

        <ActionButtons>
          <Button
            variant="default"
            onClick={handleSave}
            disabled={loading}
            style={{ minWidth: '150px' }}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Save Settings
              </>
            )}
          </Button>
        </ActionButtons>
      </Container>
    </ComponentGate>
  );
}
