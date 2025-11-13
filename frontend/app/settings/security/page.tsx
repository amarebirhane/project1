'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { ComponentGate, ComponentId } from '/@/lib/rbac';
import { useAuth } from '/@/lib/rbac/auth-context';
import { Save, Lock, Shield, Key, AlertTriangle, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
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

const ErrorText = styled.p`
  font-size: 0.75rem;
  color: #ef4444;
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

const PasswordInputContainer = styled.div`
  position: relative;
`;

const TogglePasswordButton = styled.button`
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  
  &:hover {
    color: #4b5563;
  }
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
  padding: 0.5rem 0;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 1.5rem 0;
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
`;

const PasswordStrengthMeter = styled.div`
  margin-top: 0.5rem;
`;

const PasswordStrengthBar = styled.div`
  height: 4px;
  background-color: #e5e7eb;
  border-radius: 2px;
  margin-top: 0.25rem;
  overflow: hidden;
`;

const PasswordStrengthIndicator = styled.div<{ strength: number }>`
  height: 100%;
  width: ${props => `${props.strength}%`};
  background-color: ${props => {
    if (props.strength < 25) return '#ef4444'; // Red (weak)
    if (props.strength < 50) return '#f97316'; // Orange (fair)
    if (props.strength < 75) return '#eab308'; // Yellow (good)
    return '#22c55e'; // Green (strong)
  }};
  transition: width 0.3s ease, background-color 0.3s ease;
`;

const PasswordStrengthLabel = styled.div<{ strength: number }>`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  
  span:first-child {
    color: ${props => {
      if (props.strength < 25) return '#ef4444'; // Red (weak)
      if (props.strength < 50) return '#f97316'; // Orange (fair)
      if (props.strength < 75) return '#eab308'; // Yellow (good)
      return '#22c55e'; // Green (strong)
    }};
    font-weight: 500;
  }
  
  span:last-child {
    color: #6b7280;
  }
`;

const VerificationHistoryContainer = styled.div`
  max-height: 250px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  margin-top: 0.5rem;
`;

const VerificationHistoryItem = styled.div`
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:nth-child(even) {
    background-color: #f9fafb;
  }
`;

const VerificationHistoryDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const VerificationHistoryDevice = styled.div`
  font-weight: 500;
  color: #4b5563;
`;

const VerificationHistoryMeta = styled.div`
  color: #6b7280;
  font-size: 0.75rem;
  margin-top: 0.25rem;
`;

const VerificationHistoryStatus = styled.span<{ success: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  color: ${props => props.success ? '#22c55e' : '#ef4444'};
  font-size: 0.75rem;
  font-weight: 500;
`;

const Message = styled.div<{ type: 'error' | 'success' }>`
  background-color: ${props => props.type === 'error' ? '#fee2e2' : '#dcfce7'};
  color: ${props => props.type === 'error' ? '#b91c1c' : '#166534'};
  padding: 0.75rem;
  border-radius: 0.25rem;
  margin-bottom: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
`;

interface VerificationHistoryEntry {
  id: string;
  device: string;
  location: string;
  ip: string;
  date: string;
  success: boolean;
}

export default function SecuritySettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Security settings state
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorEnabled: false,
    loginAlerts: true,
    requirePasswordChange: 90, // days
    allowMultipleSessions: true,
    ipRestriction: false
  });
  
  // Password strength
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  // Mock verification history
  const [verificationHistory] = useState<VerificationHistoryEntry[]>([
    {
      id: '1',
      device: 'Windows PC - Chrome',
      location: 'New York, USA',
      ip: '192.168.1.1',
      date: '2023-08-15 14:30:22',
      success: true
    },
    {
      id: '2',
      device: 'iPhone - Safari',
      location: 'Boston, USA',
      ip: '192.168.1.2',
      date: '2023-08-14 09:15:47',
      success: true
    },
    {
      id: '3',
      device: 'Android - Chrome',
      location: 'Unknown',
      ip: '192.168.1.3',
      date: '2023-08-13 22:41:10',
      success: false
    },
    {
      id: '4',
      device: 'Mac - Firefox',
      location: 'Chicago, USA',
      ip: '192.168.1.4',
      date: '2023-08-12 16:05:33',
      success: true
    },
    {
      id: '5',
      device: 'Windows PC - Edge',
      location: 'Dallas, USA',
      ip: '192.168.1.5',
      date: '2023-08-11 11:22:15',
      success: true
    }
  ]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
    
    // Reset specific error when user is typing
    setPasswordErrors(prev => ({ ...prev, [name]: '' }));
    
    // Calculate password strength if changing new password
    if (name === 'newPassword') {
      calculatePasswordStrength(value);
    }
  };

  const handleSecuritySettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setSecuritySettings(prev => ({ ...prev, [name]: checked }));
    } else {
      setSecuritySettings(prev => ({ ...prev, [name]: value }));
    }
  };

  const calculatePasswordStrength = (password: string) => {
    // Basic password strength calculation
    let strength = 0;
    
    // Length contribution (up to 25%)
    const lengthFactor = Math.min(password.length / 12, 1) * 25;
    strength += lengthFactor;
    
    // Character variety contribution (up to 75% more)
    if (/[A-Z]/.test(password)) strength += 15; // Uppercase
    if (/[a-z]/.test(password)) strength += 15; // Lowercase
    if (/[0-9]/.test(password)) strength += 15; // Numbers
    if (/[^A-Za-z0-9]/.test(password)) strength += 30; // Special characters
    
    setPasswordStrength(Math.min(strength, 100));
  };

  const getPasswordStrengthLabel = (): string => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  const validatePasswordForm = (): boolean => {
    const errors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
    
    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters';
    } else if (passwordForm.newPassword === passwordForm.currentPassword) {
      errors.newPassword = 'New password must be different from current password';
    }
    
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.confirmPassword !== passwordForm.newPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(errors);
    
    // Check if there are any errors
    return !Object.values(errors).some(error => error !== '');
  };

  const handleSavePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real app, this would call an API to change the password
      console.log('Saving new password:', passwordForm);
      
      // Reset form
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordStrength(0);
      
      setSuccess('Password updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecuritySettings = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real app, this would save the security settings to the backend
      console.log('Saving security settings:', securitySettings);
      
      setSuccess('Security settings updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError('Failed to update security settings. Please try again.');
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
          <Title>Security Settings</Title>
        </Header>

        {error && (
          <Message type="error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </Message>
        )}
        
        {success && (
          <Message type="success">
            <CheckCircle size={16} />
            <span>{success}</span>
          </Message>
        )}

        <Card>
          <CardHeader>
            <CardTitle>
              <Key size={18} />
              Change Password
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormGroup>
              <Label htmlFor="currentPassword">Current Password</Label>
              <PasswordInputContainer>
                <Input
                  id="currentPassword"
                  name="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordChange}
                />
                <TogglePasswordButton
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </TogglePasswordButton>
              </PasswordInputContainer>
              {passwordErrors.currentPassword && (
                <ErrorText>{passwordErrors.currentPassword}</ErrorText>
              )}
            </FormGroup>

            <FormGroup>
              <Label htmlFor="newPassword">New Password</Label>
              <PasswordInputContainer>
                <Input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={handlePasswordChange}
                />
                <TogglePasswordButton
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </TogglePasswordButton>
              </PasswordInputContainer>
              {passwordErrors.newPassword && (
                <ErrorText>{passwordErrors.newPassword}</ErrorText>
              )}
              
              {passwordForm.newPassword && (
                <PasswordStrengthMeter>
                  <PasswordStrengthLabel strength={passwordStrength}>
                    <span>{getPasswordStrengthLabel()}</span>
                    <span>Password Strength</span>
                  </PasswordStrengthLabel>
                  <PasswordStrengthBar>
                    <PasswordStrengthIndicator strength={passwordStrength} />
                  </PasswordStrengthBar>
                </PasswordStrengthMeter>
              )}
              
              <HelperText>
                Password must be at least 8 characters and include uppercase, lowercase, numbers, and special characters.
              </HelperText>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <PasswordInputContainer>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordChange}
                />
                <TogglePasswordButton
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </TogglePasswordButton>
              </PasswordInputContainer>
              {passwordErrors.confirmPassword && (
                <ErrorText>{passwordErrors.confirmPassword}</ErrorText>
              )}
            </FormGroup>

            <ActionButtons>
              <Button 
                variant="primary" 
                onClick={handleSavePassword} 
                disabled={loading}
              >
                <Save size={16} />
                Update Password
              </Button>
            </ActionButtons>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Shield size={18} />
              Account Security
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SwitchContainer>
              <div>
                <Label htmlFor="twoFactorEnabled">Two-Factor Authentication</Label>
                <HelperText>Add an extra layer of security to your account</HelperText>
              </div>
              <Switch>
                <SwitchInput
                  type="checkbox"
                  id="twoFactorEnabled"
                  name="twoFactorEnabled"
                  checked={securitySettings.twoFactorEnabled}
                  onChange={handleSecuritySettingChange}
                />
                <SwitchSlider />
              </Switch>
            </SwitchContainer>

            <Divider />
            
            <SwitchContainer>
              <div>
                <Label htmlFor="loginAlerts">Login Alerts</Label>
                <HelperText>Receive notifications for new login attempts</HelperText>
              </div>
              <Switch>
                <SwitchInput
                  type="checkbox"
                  id="loginAlerts"
                  name="loginAlerts"
                  checked={securitySettings.loginAlerts}
                  onChange={handleSecuritySettingChange}
                />
                <SwitchSlider />
              </Switch>
            </SwitchContainer>

            <Divider />
            
            <FormGroup>
              <Label htmlFor="requirePasswordChange">Password Expiry</Label>
              <select
                id="requirePasswordChange"
                name="requirePasswordChange"
                value={securitySettings.requirePasswordChange}
                onChange={handleSecuritySettingChange}
                style={{ 
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.25rem',
                  fontSize: '0.875rem',
                  backgroundColor: 'white'
                }}
              >
                <option value={30}>Every 30 days</option>
                <option value={60}>Every 60 days</option>
                <option value={90}>Every 90 days</option>
                <option value={180}>Every 180 days</option>
                <option value={0}>Never</option>
              </select>
              <HelperText>How often you'll be required to change your password</HelperText>
            </FormGroup>

            <Divider />

            <SwitchContainer>
              <div>
                <Label htmlFor="allowMultipleSessions">Multiple Active Sessions</Label>
                <HelperText>Allow multiple devices to be logged in at the same time</HelperText>
              </div>
              <Switch>
                <SwitchInput
                  type="checkbox"
                  id="allowMultipleSessions"
                  name="allowMultipleSessions"
                  checked={securitySettings.allowMultipleSessions}
                  onChange={handleSecuritySettingChange}
                />
                <SwitchSlider />
              </Switch>
            </SwitchContainer>

            <Divider />
            
            <SwitchContainer>
              <div>
                <Label htmlFor="ipRestriction">IP Address Restriction</Label>
                <HelperText>Restrict login attempts to known IP addresses</HelperText>
              </div>
              <Switch>
                <SwitchInput
                  type="checkbox"
                  id="ipRestriction"
                  name="ipRestriction"
                  checked={securitySettings.ipRestriction}
                  onChange={handleSecuritySettingChange}
                />
                <SwitchSlider />
              </Switch>
            </SwitchContainer>

            <ActionButtons>
              <Button 
                variant="primary" 
                onClick={handleSaveSecuritySettings} 
                disabled={loading}
              >
                <Save size={16} />
                Save Security Settings
              </Button>
            </ActionButtons>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <AlertTriangle size={18} />
              Login Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <HelperText>Recent login attempts to your account</HelperText>
            <VerificationHistoryContainer>
              {verificationHistory.map(entry => (
                <VerificationHistoryItem key={entry.id}>
                  <VerificationHistoryDetails>
                    <VerificationHistoryDevice>{entry.device}</VerificationHistoryDevice>
                    <VerificationHistoryStatus success={entry.success}>
                      {entry.success ? (
                        <>
                          <CheckCircle size={12} />
                          Success
                        </>
                      ) : (
                        <>
                          <AlertCircle size={12} />
                          Failed
                        </>
                      )}
                    </VerificationHistoryStatus>
                  </VerificationHistoryDetails>
                  <VerificationHistoryMeta>
                    {entry.location} • {entry.ip} • {entry.date}
                  </VerificationHistoryMeta>
                </VerificationHistoryItem>
              ))}
            </VerificationHistoryContainer>
          </CardContent>
        </Card>
      </Container>
    </ComponentGate>
  );
} 