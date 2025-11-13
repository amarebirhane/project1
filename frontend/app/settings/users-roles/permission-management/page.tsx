'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { theme } from '/@components/common/theme';
import PermissionManager from '../../../permissions/PermissionManager';
import { Resource, Action, UserType } from '/@/lib/rbac/models';
import { PermissionGate } from '/@/lib/rbac/permission-gate';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '/@/components/common/Tabs';
import Button from '/@components/ui/button';
import { useRouter } from 'next/navigation';

// Styled components
const Container = styled.div`
  padding: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 24px;
  color: ${theme.colors.textPrimary};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
`;

const Card = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 24px;
`;

const Message = styled.div`
  padding: 16px;
  background-color: ${theme.colors.background};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: 24px;
  color: ${theme.colors.textSecondary};
`;

const PermissionManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('system');
  const router = useRouter();
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };
  
  const navigateToRoles = () => {
    router.push('/settings/users-roles/roles');
  };
  
  const navigateToUserRoles = () => {
    router.push('/settings/users-roles/user-roles');
  };

  return (
    <Container>
      <Title>Permission Management</Title>
      
      <PermissionGate 
        resource={Resource.SETTINGS} 
        action={Action.UPDATE}
        fallback={
          <Message>
            You do not have permission to access the permission management settings.
          </Message>
        }
      >
        <Card>
          <ButtonGroup>
            <Button onClick={navigateToRoles}>
              Manage Roles
            </Button>
            <Button onClick={navigateToUserRoles}>
              Assign User Roles
            </Button>
          </ButtonGroup>
          
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="system">System Admin</TabsTrigger>
              <TabsTrigger value="insurance">Insurance Admin</TabsTrigger>
              <TabsTrigger value="provider">Provider Admin</TabsTrigger>
              <TabsTrigger value="corporate">Corporate Admin</TabsTrigger>
            </TabsList>
            
            <TabsContent value="system">
              <PermissionManager 
                title="System Admin Permission Management" 
                adminType={UserType.ADMIN}
                managedUserTypes={[
                  UserType.ADMIN,
                  UserType.INSURANCE_ADMIN,
                  UserType.PROVIDER_ADMIN,
                  UserType.CORPORATE_ADMIN,
                  UserType.STAFF,
                  UserType.INSURANCE_STAFF,
                  UserType.PROVIDER,
                  UserType.MEMBER
                ]}
              />
            </TabsContent>
            
            <TabsContent value="insurance">
              <PermissionManager 
                title="Insurance Admin Permission Management" 
                adminType={UserType.INSURANCE_ADMIN}
                managedUserTypes={[
                  UserType.INSURANCE_STAFF,
                  UserType.MEMBER
                ]}
              />
            </TabsContent>
            
            <TabsContent value="provider">
              <PermissionManager 
                title="Provider Admin Permission Management" 
                adminType={UserType.PROVIDER_ADMIN}
                managedUserTypes={[
                  UserType.PROVIDER,
                  UserType.STAFF
                ]}
              />
            </TabsContent>
            
            <TabsContent value="corporate">
              <PermissionManager 
                title="Corporate Admin Permission Management" 
                adminType={UserType.CORPORATE_ADMIN}
                managedUserTypes={[
                  UserType.MEMBER,
                  UserType.STAFF
                ]}
              />
            </TabsContent>
          </Tabs>
        </Card>
      </PermissionGate>
    </Container>
  );
};

export default PermissionManagementPage; 