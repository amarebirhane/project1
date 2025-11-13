'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { ComponentGate, ComponentId } from '/@/lib/rbac';
import { useAuth } from '/@/lib/rbac/auth-context';
import { Save, Mail, MessageSquare, Bell, BellRing, PhoneCall, BellOff } from 'lucide-react';
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

const NotificationGroup = styled.div`
  margin-bottom: 1.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const NotificationTitle = styled.h4`
  font-size: 0.875rem;
  font-weight: 600;
  color: #4b5563;
  margin-bottom: 0.75rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChannelOptions = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  
  @media (max-width: 640px) {
    flex-direction: column;
  }
`;

const ChannelOption = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  cursor: pointer;
  
  &:hover {
    background-color: #f9fafb;
  }
`;

const ChannelLabel = styled.label`
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  cursor: pointer;
`;

const HelperText = styled.p`
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
`;

const Checkbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #3b82f6;
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

// Notification types enum for clarity
enum NotificationType {
  CLAIMS = 'claims',
  APPOINTMENTS = 'appointments',
  MESSAGES = 'messages',
  BILLING = 'billing',
  POLICY = 'policy',
  MARKETING = 'marketing',
  SYSTEM = 'system'
}

// Channel types enum
enum ChannelType {
  EMAIL = 'email',
  SMS = 'sms',
  APP = 'app',
  PUSH = 'push'
}

interface NotificationSettings {
  [key: string]: {
    [key: string]: boolean;
  };
}

export default function NotificationsSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [doNotDisturb, setDoNotDisturb] = useState(false);
  const [quietHours, setQuietHours] = useState({
    enabled: false,
    startTime: '22:00',
    endTime: '08:00'
  });
  
  // Initialize notification preferences for each type and channel
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationSettings>({
    [NotificationType.CLAIMS]: {
      [ChannelType.EMAIL]: true,
      [ChannelType.SMS]: false,
      [ChannelType.APP]: true,
      [ChannelType.PUSH]: true
    },
    [NotificationType.APPOINTMENTS]: {
      [ChannelType.EMAIL]: true,
      [ChannelType.SMS]: true,
      [ChannelType.APP]: true,
      [ChannelType.PUSH]: true
    },
    [NotificationType.MESSAGES]: {
      [ChannelType.EMAIL]: true,
      [ChannelType.SMS]: false,
      [ChannelType.APP]: true,
      [ChannelType.PUSH]: true
    },
    [NotificationType.BILLING]: {
      [ChannelType.EMAIL]: true,
      [ChannelType.SMS]: false,
      [ChannelType.APP]: true,
      [ChannelType.PUSH]: false
    },
    [NotificationType.POLICY]: {
      [ChannelType.EMAIL]: true,
      [ChannelType.SMS]: false,
      [ChannelType.APP]: true,
      [ChannelType.PUSH]: false
    },
    [NotificationType.MARKETING]: {
      [ChannelType.EMAIL]: false,
      [ChannelType.SMS]: false,
      [ChannelType.APP]: false,
      [ChannelType.PUSH]: false
    },
    [NotificationType.SYSTEM]: {
      [ChannelType.EMAIL]: true,
      [ChannelType.SMS]: false,
      [ChannelType.APP]: true,
      [ChannelType.PUSH]: false
    }
  });

  const handleNotificationToggle = (type: NotificationType, channel: ChannelType) => {
    setNotificationPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: !prev[type][channel]
      }
    }));
  };

  const handleQuietHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setQuietHours(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setQuietHours(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSave = async () => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a real app, this would save the notification settings to the backend
    console.log('Saving notification settings:', {
      notificationPreferences,
      doNotDisturb,
      quietHours
    });
    
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
          <Title>Notification Settings</Title>
        </Header>

        <Card>
          <CardHeader>
            <CardTitle>
              <BellRing size={18} />
              Global Notification Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SwitchContainer>
              <div>
                <Label htmlFor="doNotDisturb">Do Not Disturb</Label>
                <HelperText>When enabled, all notifications will be muted</HelperText>
              </div>
              <Switch>
                <SwitchInput
                  type="checkbox"
                  id="doNotDisturb"
                  checked={doNotDisturb}
                  onChange={() => setDoNotDisturb(prev => !prev)}
                />
                <SwitchSlider />
              </Switch>
            </SwitchContainer>

            <Divider />

            <div>
              <SwitchContainer>
                <div>
                  <Label htmlFor="quietHoursEnabled">Quiet Hours</Label>
                  <HelperText>Mute notifications during specific hours</HelperText>
                </div>
                <Switch>
                  <SwitchInput
                    type="checkbox"
                    id="quietHoursEnabled"
                    name="enabled"
                    checked={quietHours.enabled}
                    onChange={handleQuietHoursChange}
                  />
                  <SwitchSlider />
                </Switch>
              </SwitchContainer>

              {quietHours.enabled && (
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                  <div>
                    <Label htmlFor="startTime">From</Label>
                    <input
                      type="time"
                      id="startTime"
                      name="startTime"
                      value={quietHours.startTime}
                      onChange={handleQuietHoursChange}
                      style={{ 
                        padding: '0.5rem', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '0.25rem' 
                      }}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">To</Label>
                    <input
                      type="time"
                      id="endTime"
                      name="endTime"
                      value={quietHours.endTime}
                      onChange={handleQuietHoursChange}
                      style={{ 
                        padding: '0.5rem', 
                        border: '1px solid #d1d5db', 
                        borderRadius: '0.25rem' 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              <Bell size={18} />
              Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationGroup>
              <NotificationTitle>
                <BellRing size={16} />
                Claims Notifications
              </NotificationTitle>
              <HelperText>Receive updates about claim submissions, processing, and status changes</HelperText>
              <ChannelOptions>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.CLAIMS, ChannelType.EMAIL)}>
                  <Checkbox
                    type="checkbox"
                    id="claims-email"
                    checked={notificationPreferences[NotificationType.CLAIMS][ChannelType.EMAIL]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="claims-email">
                    <Mail size={16} />
                    Email
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.CLAIMS, ChannelType.SMS)}>
                  <Checkbox
                    type="checkbox"
                    id="claims-sms"
                    checked={notificationPreferences[NotificationType.CLAIMS][ChannelType.SMS]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="claims-sms">
                    <MessageSquare size={16} />
                    SMS
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.CLAIMS, ChannelType.APP)}>
                  <Checkbox
                    type="checkbox"
                    id="claims-app"
                    checked={notificationPreferences[NotificationType.CLAIMS][ChannelType.APP]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="claims-app">
                    <Bell size={16} />
                    App Notifications
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.CLAIMS, ChannelType.PUSH)}>
                  <Checkbox
                    type="checkbox"
                    id="claims-push"
                    checked={notificationPreferences[NotificationType.CLAIMS][ChannelType.PUSH]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="claims-push">
                    <PhoneCall size={16} />
                    Push Notifications
                  </ChannelLabel>
                </ChannelOption>
              </ChannelOptions>
            </NotificationGroup>

            <Divider />

            <NotificationGroup>
              <NotificationTitle>
                <BellRing size={16} />
                Appointment Notifications
              </NotificationTitle>
              <HelperText>Receive reminders for upcoming appointments and schedule changes</HelperText>
              <ChannelOptions>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.APPOINTMENTS, ChannelType.EMAIL)}>
                  <Checkbox
                    type="checkbox"
                    id="appointments-email"
                    checked={notificationPreferences[NotificationType.APPOINTMENTS][ChannelType.EMAIL]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="appointments-email">
                    <Mail size={16} />
                    Email
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.APPOINTMENTS, ChannelType.SMS)}>
                  <Checkbox
                    type="checkbox"
                    id="appointments-sms"
                    checked={notificationPreferences[NotificationType.APPOINTMENTS][ChannelType.SMS]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="appointments-sms">
                    <MessageSquare size={16} />
                    SMS
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.APPOINTMENTS, ChannelType.APP)}>
                  <Checkbox
                    type="checkbox"
                    id="appointments-app"
                    checked={notificationPreferences[NotificationType.APPOINTMENTS][ChannelType.APP]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="appointments-app">
                    <Bell size={16} />
                    App Notifications
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.APPOINTMENTS, ChannelType.PUSH)}>
                  <Checkbox
                    type="checkbox"
                    id="appointments-push"
                    checked={notificationPreferences[NotificationType.APPOINTMENTS][ChannelType.PUSH]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="appointments-push">
                    <PhoneCall size={16} />
                    Push Notifications
                  </ChannelLabel>
                </ChannelOption>
              </ChannelOptions>
            </NotificationGroup>

            <Divider />

            <NotificationGroup>
              <NotificationTitle>
                <BellRing size={16} />
                Billing & Payment Notifications
              </NotificationTitle>
              <HelperText>Receive alerts about billing statements, payment confirmations, and due dates</HelperText>
              <ChannelOptions>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.BILLING, ChannelType.EMAIL)}>
                  <Checkbox
                    type="checkbox"
                    id="billing-email"
                    checked={notificationPreferences[NotificationType.BILLING][ChannelType.EMAIL]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="billing-email">
                    <Mail size={16} />
                    Email
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.BILLING, ChannelType.SMS)}>
                  <Checkbox
                    type="checkbox"
                    id="billing-sms"
                    checked={notificationPreferences[NotificationType.BILLING][ChannelType.SMS]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="billing-sms">
                    <MessageSquare size={16} />
                    SMS
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.BILLING, ChannelType.APP)}>
                  <Checkbox
                    type="checkbox"
                    id="billing-app"
                    checked={notificationPreferences[NotificationType.BILLING][ChannelType.APP]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="billing-app">
                    <Bell size={16} />
                    App Notifications
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.BILLING, ChannelType.PUSH)}>
                  <Checkbox
                    type="checkbox"
                    id="billing-push"
                    checked={notificationPreferences[NotificationType.BILLING][ChannelType.PUSH]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="billing-push">
                    <PhoneCall size={16} />
                    Push Notifications
                  </ChannelLabel>
                </ChannelOption>
              </ChannelOptions>
            </NotificationGroup>

            <Divider />

            <NotificationGroup>
              <NotificationTitle>
                <BellOff size={16} />
                Marketing Communications
              </NotificationTitle>
              <HelperText>Receive updates about new services, promotions, and educational content</HelperText>
              <ChannelOptions>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.MARKETING, ChannelType.EMAIL)}>
                  <Checkbox
                    type="checkbox"
                    id="marketing-email"
                    checked={notificationPreferences[NotificationType.MARKETING][ChannelType.EMAIL]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="marketing-email">
                    <Mail size={16} />
                    Email
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.MARKETING, ChannelType.SMS)}>
                  <Checkbox
                    type="checkbox"
                    id="marketing-sms"
                    checked={notificationPreferences[NotificationType.MARKETING][ChannelType.SMS]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="marketing-sms">
                    <MessageSquare size={16} />
                    SMS
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.MARKETING, ChannelType.APP)}>
                  <Checkbox
                    type="checkbox"
                    id="marketing-app"
                    checked={notificationPreferences[NotificationType.MARKETING][ChannelType.APP]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="marketing-app">
                    <Bell size={16} />
                    App Notifications
                  </ChannelLabel>
                </ChannelOption>
                <ChannelOption onClick={() => handleNotificationToggle(NotificationType.MARKETING, ChannelType.PUSH)}>
                  <Checkbox
                    type="checkbox"
                    id="marketing-push"
                    checked={notificationPreferences[NotificationType.MARKETING][ChannelType.PUSH]}
                    readOnly
                  />
                  <ChannelLabel htmlFor="marketing-push">
                    <PhoneCall size={16} />
                    Push Notifications
                  </ChannelLabel>
                </ChannelOption>
              </ChannelOptions>
            </NotificationGroup>
          </CardContent>
        </Card>

        <ActionButtons>
          <Button 
            variant="primary" 
            onClick={handleSave} 
            disabled={loading}
          >
            <Save size={16} />
            Save Notification Settings
          </Button>
        </ActionButtons>
      </Container>
    </ComponentGate>
  );
} 