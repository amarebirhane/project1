'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { theme } from '/@/components/common/theme';
import { useRouter } from 'next/navigation';
import { Resource, Action, UserType } from '/@/lib/rbac/models';
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
import { Search, Filter, Save, Check, User } from 'lucide-react';

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

const FilterContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
  align-items: center;
`;

const Select = styled.select`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.sm};
  background-color: white;
`;

const FilterLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${theme.typography.fontSizes.sm};
  color: ${theme.colors.textSecondary};
  
  svg {
    color: ${theme.colors.primary};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 12px;
  margin-top: 24px;
  justify-content: flex-end;
`;

const RoleChip = styled.div`
  background-color: ${theme.colors.primaryLight};
  color: ${theme.colors.primary};
  font-size: ${theme.typography.fontSizes.xs};
  padding: 4px 8px;
  border-radius: ${theme.borderRadius.sm};
  display: inline-block;
  margin-right: 4px;
  margin-bottom: 4px;
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
}

interface UserData {
  id: string;
  name: string;
  email: string;
  userType: UserType;
  roles: Role[];
}

const UserRolesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [users, setUsers] = useState<UserData[]>([]);
  const router = useRouter();
  
  // Mock data for demonstration
  useEffect(() => {
    const mockRoles = [
      { id: '1', name: 'Admin', description: 'Full system access' },
      { id: '2', name: 'Manager', description: 'Can manage specific areas' },
      { id: '3', name: 'User', description: 'Basic user access' },
      { id: '4', name: 'Guest', description: 'Limited view-only access' },
      { id: '5', name: 'Support', description: 'Customer support role' }
    ];
    
    const mockUsers: UserData[] = [
      {
        id: '1',
        name: 'John Smith',
        email: 'john@example.com',
        userType: UserType.ADMIN,
        roles: [mockRoles[0], mockRoles[1]]
      },
      {
        id: '2',
        name: 'Jane Doe',
        email: 'jane@example.com',
        userType: UserType.INSURANCE_ADMIN,
        roles: [mockRoles[1]]
      },
      {
        id: '3',
        name: 'Bob Johnson',
        email: 'bob@example.com',
        userType: UserType.PROVIDER_ADMIN,
        roles: [mockRoles[2], mockRoles[4]]
      },
      {
        id: '4',
        name: 'Alice Brown',
        email: 'alice@example.com',
        userType: UserType.CORPORATE_ADMIN,
        roles: [mockRoles[3]]
      },
      {
        id: '5',
        name: 'Charlie Wilson',
        email: 'charlie@example.com',
        userType: UserType.MEMBER,
        roles: [mockRoles[3]]
      }
    ];
    
    setUsers(mockUsers);
  }, []);
  
  // Filter users by search term and user type
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = userTypeFilter === 'all' || user.userType === userTypeFilter;
    
    return matchesSearch && matchesType;
  });
  
  const handleAssignRoles = (userId: string) => {
    // Navigate to a page to assign roles to this specific user
    router.push(`/settings/users-roles/user-roles/assign/${userId}`);
  };
  
  const navigateToRoles = () => {
    router.push('/settings/users-roles/roles');
  };

  return (
    <Container>
      <Title>User Role Assignment</Title>
      
      <PermissionGate 
        resource={Resource.SETTINGS} 
        action={Action.UPDATE}
        fallback={
          <Message>
            You do not have permission to access the user role assignment settings.
          </Message>
        }
      >
        <Card>
          <Button onClick={navigateToRoles} style={{ marginBottom: '16px' }}>
            Manage Roles
          </Button>
          
          <FilterContainer>
            <SearchInput 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <FilterLabel>
              <Filter size={16} />
              <Select 
                value={userTypeFilter}
                onChange={(e) => setUserTypeFilter(e.target.value)}
              >
                <option value="all">All User Types</option>
                {Object.values(UserType).map(type => (
                  <option key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
                  </option>
                ))}
              </Select>
            </FilterLabel>
          </FilterContainer>
          
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>User Type</TableHead>
                <TableHead>Assigned Roles</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.userType}</TableCell>
                  <TableCell>
                    {user.roles.map(role => (
                      <RoleChip key={role.id}>{role.name}</RoleChip>
                    ))}
                  </TableCell>
                  <TableCell>
                    <Button 
                      size="small" 
                      variant="secondary"
                      onClick={() => handleAssignRoles(user.id)}
                    >
                      Assign Roles
                    </Button>
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

export default UserRolesPage; 