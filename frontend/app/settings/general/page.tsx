'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { ComponentGate, ComponentId } from '/@/lib/rbac';
import { useAuth } from '/@/lib/rbac/auth-context';
import { Save, Globe, Bell, Moon, Sun } from 'lucide-react';
import Button from '/@/components/ui/button';

// Styled components
const Container = styled.div`
  max-width: 1000px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
`;

const Title = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
`;

const Card = styled.div`
  background-color: white;
  border-radius: 0.375rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1.25rem;
`;

const CardHeader = styled.div`
  padding: 1rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #f3f4f6;
`;

const CardTitle = styled.h3`
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CardContent = styled.div`
  padding: 1.25rem;
`;

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.375rem;
  color: #4b5563;
`;

const HelperText = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  transition: border-color 0.15s ease;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  transition: border-color 0.15s ease;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 1px #3b82f6;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
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
    background-color: #3b82f6;
  }
  
  &:checked + span:before {
    transform: translateX(24px);
  }
`;

const SwitchSlider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #e5e7eb;
  transition: 0.4s;
  border-radius: 24px;
  
  &:before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }
`;

const SwitchContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ThemeOptions = styled.div`
  display: flex;
  gap: 1rem;
`;

const ThemeOption = styled.div<{ isSelected: boolean }>`
  padding: 0.75rem;
  border: 1px solid ${props => props.isSelected ? '#3b82f6' : '#d1d5db'};
  border-radius: 0.375rem;
  cursor: pointer;
  background-color: ${props => props.isSelected ? '#eff6ff' : 'white'};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  width: 100px;
  
  &:hover {
    border-color: #3b82f6;
  }
`;

const ThemeIcon = styled.div`
  background-color: #f3f4f6;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ThemeLabel = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
`;

export default function GeneralSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    language: 'en',
    timezone: 'UTC',
    theme: 'light',
    dateFormat: 'MM/DD/YYYY',
    autoSave: true,
    compactView: false
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSettings(prev => ({ ...prev, [name]: checked }));
  };

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    setSettings(prev => ({ ...prev, theme }));
  };

  const handleSave = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a real app, this would save the settings to the backend
    console.log('Saving settings:', settings);
    
    setLoading(false);
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

        <Card>
          <CardHeader>
            <CardTitle>
              <Globe size={18} />
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
                <option value="EST">EST (Eastern Standard Time)</option>
                <option value="CST">CST (Central Standard Time)</option>
                <option value="PST">PST (Pacific Standard Time)</option>
                <option value="CET">CET (Central European Time)</option>
              </Select>
              <HelperText>Affects how dates and times are displayed.</HelperText>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select
                id="dateFormat"
                name="dateFormat"
                value={settings.dateFormat}
                onChange={handleInputChange}
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </Select>
              <HelperText>The format in which dates will be displayed.</HelperText>
            </FormGroup>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Bell size={18} />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormGroup>
              <Label>Theme</Label>
              <ThemeOptions>
                <ThemeOption 
                  isSelected={settings.theme === 'light'}
                  onClick={() => handleThemeChange('light')}
                >
                  <ThemeIcon>
                    <Sun size={20} />
                  </ThemeIcon>
                  <ThemeLabel>Light</ThemeLabel>
                </ThemeOption>
                <ThemeOption 
                  isSelected={settings.theme === 'dark'}
                  onClick={() => handleThemeChange('dark')}
                >
                  <ThemeIcon>
                    <Moon size={20} />
                  </ThemeIcon>
                  <ThemeLabel>Dark</ThemeLabel>
                </ThemeOption>
                <ThemeOption 
                  isSelected={settings.theme === 'system'}
                  onClick={() => handleThemeChange('system')}
                >
                  <ThemeIcon>
                    <Globe size={20} />
                  </ThemeIcon>
                  <ThemeLabel>System</ThemeLabel>
                </ThemeOption>
              </ThemeOptions>
            </FormGroup>

            <FormGroup>
              <SwitchContainer>
                <div>
                  <Label htmlFor="compactView">Compact View</Label>
                  <HelperText>Display more content with less spacing</HelperText>
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

        <Card>
          <CardHeader>
            <CardTitle>Other Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <FormGroup>
              <SwitchContainer>
                <div>
                  <Label htmlFor="autoSave">Auto-save</Label>
                  <HelperText>Automatically save changes when editing</HelperText>
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

        <ActionButtons>
          <Button 
            variant="primary" 
            onClick={handleSave} 
            disabled={loading}
          >
            <Save size={16} />
            Save Settings
          </Button>
        </ActionButtons>
      </Container>
    </ComponentGate>
  );
} 