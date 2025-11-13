'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from '/@components/common/theme';
import { Resource, Action } from '/@/lib/rbac/models';
import { PermissionGate } from '/@/lib/rbac/permission-gate';
import Button from '/@/components/ui/button';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '../../../common/Table';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Copy
} from 'lucide-react';

// Styled components
const Container = styled.div`
  padding: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 24px;
  color: ${theme.colors.textPrimary};
`;

const Card = styled.div`
  background: ${theme.colors.background};
  border-radius: ${theme.borderRadius.md};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 24px;
  margin-bottom: 24px;
`;

const SearchInput = styled.input`
  width: 100%;
  max-width: 400px;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: 24px;
  font-size: ${theme.typography.fontSizes.sm};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const Message = styled.div`
  padding: 16px;
  background-color: ${theme.colors.background};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: 24px;
  color: ${theme.colors.textSecondary};
`;

// Mock data interfaces
interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissionCount: number;
  createdAt: string;
}

const RolesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const router = useRouter();
  
  // Mock data for demonstration
  useEffect(() => {
    const mockRoles: Role[] = [
      {
        id: '1',
        name: 'Admin',
        description: 'Full system access and management capabilities',
        userCount: 5,
        permissionCount: 25,
        createdAt: '2023-01-15'
      },
      {
        id: '2',
        name: 'Insurance admin',
        description: 'Can manage insurance-related activities',
        userCount: 8,
        permissionCount: 15,
        createdAt: '2023-02-10'
      },
      {
        id: '3',
        name: 'Provider Admin',
        description: 'Can manage healthcare providers',
        userCount: 12,
        permissionCount: 12,
        createdAt: '2023-03-22'
      },
      {
        id: '4',
        name: 'Staff',
        description: 'Support access for member-facing operations',
        userCount: 20,
        permissionCount: 8,
        createdAt: '2023-04-05'
      },
      {
        id: '5',
        name: 'Member',
        description: 'View-only access to system data',
        userCount: 30,
        permissionCount: 5,
        createdAt: '2023-05-18'
      }
    ];
    
    setRoles(mockRoles);
  }, []);
  
  // Filter roles by search term
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleCreateRole = () => {
    router.push('/settings/users-roles/roles/create');
  };
  
  const handleEditRole = (roleId: string) => {
    router.push(`/settings/users-roles/roles/edit/${roleId}`);
  };
  
  const handleDuplicateRole = (roleId: string) => {
    router.push(`/settings/users-roles/roles/duplicate/${roleId}`);
  };
  
  const handleDeleteRole = (roleId: string) => {
    // In a real application, you would show a confirmation dialog
    if (confirm('Are you sure you want to delete this role?')) {
      // In a real application, you would make an API call to delete the role
      setRoles(prev => prev.filter(role => role.id !== roleId));
    }
  };
  
  const navigateToUserRoles = () => {
    router.push('/settings/users-roles/user-roles');
  };

  return (
    <Container>
      <Title>Role Management</Title>
      
      <PermissionGate 
        resource={Resource.SETTINGS} 
        action={Action.UPDATE}
        fallback={
          <Message>
            You do not have permission to access the role management settings.
          </Message>
        }
      >
        <Card>
          <ButtonGroup>
            <Button 
              onClick={handleCreateRole}
              icon={<Plus size={16} />}
            >
              Create New Role
            </Button>
            <Button onClick={navigateToUserRoles}>
              Assign User Roles
            </Button>
          </ButtonGroup>
          
          <SearchInput 
            placeholder="Search roles..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map(role => (
                <TableRow key={role.id}>
                  <TableCell>{role.name}</TableCell>
                  <TableCell>{role.description}</TableCell>
                  <TableCell>{role.userCount}</TableCell>
                  <TableCell>{role.permissionCount}</TableCell>
                  <TableCell>{role.createdAt}</TableCell>
                  <TableCell>
                    <ActionButtons>
                      <Button 
                        size="small" 
                        variant="secondary"
                        onClick={() => handleEditRole(role.id)}
                        icon={<Edit size={14} />}
                      >
                        Edit
                      </Button>
                      <Button 
                        size="small" 
                        variant="secondary"
                        onClick={() => handleDuplicateRole(role.id)}
                        icon={<Copy size={14} />}
                      >
                        Duplicate
                      </Button>
                      <Button 
                        size="small" 
                        variant="danger"
                        onClick={() => handleDeleteRole(role.id)}
                        icon={<Trash2 size={14} />}
                      >
                        Delete
                      </Button>
                    </ActionButtons>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </PermissionGate>
    </Container>
  );
};

export default RolesPage; 