'use client';

import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import { theme } from '../../styles/theme';
import Button from '../common/Button';
import Checkbox from '../common/Checkbox';
import { Save, Filter, Copy, Check } from 'lucide-react';
import { Resource, Action, UserType } from '../lib/rbac/models';
import { 
  Table, 
  TableHeader, 
  TableBody, 
  TableRow, 
  TableHead, 
  TableCell 
} from '../common/Table';

// Styled components
const Container = styled.div`
  padding: 24px;
`;

const Title = styled.h1`
  font-size: 24px;
  margin-bottom: 24px;
  color: ${theme.colors.textPrimary};
`;

const Subtitle = styled.h2`
  font-size: 18px;
  margin-bottom: 16px;
  margin-top: 24px;
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
  margin-top: 24px;
  justify-content: flex-end;
`;

const SelectionCard = styled.div`
  padding: 16px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: 20px;
`;

const SelectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
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

const TemplateContainer = styled.div`
  margin-top: 24px;
  margin-bottom: 24px;
`;

const TemplateControls = styled.div`
  display: flex;
  gap: 16px;
  margin-top: 16px;
`;

const TemplateName = styled.input`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.sm};
  min-width: 250px;
`;

const TemplateSelect = styled.select`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.typography.fontSizes.sm};
  min-width: 250px;
`;

const SuccessMessage = styled.div`
  color: ${theme.colors.primary};
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: ${theme.typography.fontSizes.sm};
  margin-top: 8px;
`;

// Interfaces
interface PermissionItem {
  resource: Resource;
  actions: {
    [key in Action]?: boolean;
  };
}

interface UserPermissionMap {
  [key: string]: PermissionItem[];
}

interface UserPermissions {
  userId: string;
  userName: string;
  email: string;
  userType: UserType;
  permissions: PermissionItem[];
  isActive: boolean;
}

interface PermissionManagerProps {
  title: string;
  adminType: UserType.ADMIN | UserType.INSURANCE_ADMIN | UserType.PROVIDER_ADMIN | UserType.CORPORATE_ADMIN;
  managedUserTypes: UserType[];
}

interface RoleTemplate {
  id: string;
  name: string;
  userType: UserType;
  permissions: PermissionItem[];
}

const PermissionManager: React.FC<PermissionManagerProps> = ({ 
  title, 
  adminType,
  managedUserTypes
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissions[]>([]);
  const [userTypeFilter, setUserTypeFilter] = useState<string>('all');
  const [templates, setTemplates] = useState<RoleTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [newTemplateName, setNewTemplateName] = useState<string>('');
  const [showSavedMessage, setShowSavedMessage] = useState<boolean>(false);
  const messageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Mock users based on the managedUserTypes
  useEffect(() => {
    // In a real app, you would fetch this data from API
    const mockUsers: UserPermissions[] = [
      {
        userId: '1',
        userName: 'John Smith',
        email: 'john@acmeinsurance.com',
        userType: UserType.INSURANCE_ADMIN,
        isActive: true,
        permissions: [
          {
            resource: Resource.INSURANCE_COMPANIES,
            actions: {
              [Action.READ]: true,
              [Action.CREATE]: true,
              [Action.UPDATE]: true,
              [Action.DELETE]: false,
            }
          },
          {
            resource: Resource.USERS,
            actions: {
              [Action.READ]: true,
              [Action.CREATE]: true,
              [Action.UPDATE]: true,
              [Action.DELETE]: false,
            }
          },
        ]
      },
      {
        userId: '2',
        userName: 'Sarah Johnson',
        email: 'sarah@healthplus.com',
        userType: UserType.PROVIDER_ADMIN,
        isActive: true,
        permissions: [
          {
            resource: Resource.USERS,
            actions: {
              [Action.READ]: true,
              [Action.CREATE]: true,
              [Action.UPDATE]: true,
              [Action.DELETE]: false,
            }
          },
        ]
      },
      {
        userId: '3',
        userName: 'Alex Thompson',
        email: 'alex@company.com',
        userType: UserType.CORPORATE_ADMIN,
        isActive: true,
        permissions: [
          {
            resource: Resource.CORPORATE_CLIENTS,
            actions: {
              [Action.READ]: true,
              [Action.CREATE]: true,
              [Action.UPDATE]: true,
              [Action.DELETE]: false,
            }
          },
        ]
      },
      {
        userId: '4',
        userName: 'Lisa Taylor',
        email: 'lisa@health.com',
        userType: UserType.INSURANCE_STAFF,
        isActive: true,
        permissions: [
          {
            resource: Resource.COVERAGE_PLANS,
            actions: {
              [Action.READ]: true,
              [Action.CREATE]: false,
              [Action.UPDATE]: false,
              [Action.DELETE]: false,
            }
          },
        ]
      },
      {
        userId: '5',
        userName: 'Mark Wilson',
        email: 'mark@provider.com',
        userType: UserType.PROVIDER,
        isActive: true,
        permissions: [
          {
            resource: Resource.PROFILE,
            actions: {
              [Action.READ]: true,
              [Action.UPDATE]: true,
            }
          },
        ]
      },
      {
        userId: '6',
        userName: 'Emily Brown',
        email: 'emily@member.com',
        userType: UserType.MEMBER,
        isActive: true,
        permissions: [
          {
            resource: Resource.PROFILE,
            actions: {
              [Action.READ]: true,
              [Action.UPDATE]: true,
            }
          },
        ]
      },
    ];

    // Filter users based on managedUserTypes
    const filteredUsers = mockUsers.filter(user => 
      managedUserTypes.includes(user.userType)
    );
    
    setUserPermissions(filteredUsers);
    if (filteredUsers.length > 0) {
      setSelectedUser(filteredUsers[0].userId);
    }
  }, [managedUserTypes]);

  // Handlers
  const handlePermissionChange = (
    userId: string, 
    resource: Resource, 
    action: Action, 
    value: boolean
  ) => {
    setUserPermissions(prev => 
      prev.map(user => {
        if (user.userId === userId) {
          // Find the resource in the user's permissions
          const resourceIndex = user.permissions.findIndex(p => p.resource === resource);
          
          // If resource exists, update the action; otherwise add a new resource
          if (resourceIndex !== -1) {
            const updatedPermissions = [...user.permissions];
            updatedPermissions[resourceIndex] = {
              ...updatedPermissions[resourceIndex],
              actions: {
                ...updatedPermissions[resourceIndex].actions,
                [action]: value
              }
            };
            return { ...user, permissions: updatedPermissions };
          } else {
            // Create new resource with this action
            return {
              ...user,
              permissions: [
                ...user.permissions,
                {
                  resource,
                  actions: { [action]: value }
                }
              ]
            };
          }
        }
        return user;
      })
    );
  };

  const handleToggleAllForResource = (userId: string, resource: Resource, value: boolean) => {
    setUserPermissions(prev => 
      prev.map(user => {
        if (user.userId === userId) {
          // Find the resource in the user's permissions
          const resourceIndex = user.permissions.findIndex(p => p.resource === resource);
          
          // Create an object with all actions set to the specified value
          const allActions = {
            [Action.READ]: value,
            [Action.CREATE]: value,
            [Action.UPDATE]: value,
            [Action.DELETE]: value,
            [Action.MANAGE]: value
          };
          
          // If resource exists, update all actions; otherwise add a new resource
          if (resourceIndex !== -1) {
            const updatedPermissions = [...user.permissions];
            updatedPermissions[resourceIndex] = {
              ...updatedPermissions[resourceIndex],
              actions: allActions
            };
            return { ...user, permissions: updatedPermissions };
          } else {
            // Create new resource with all actions
            return {
              ...user,
              permissions: [
                ...user.permissions,
                {
                  resource,
                  actions: allActions
                }
              ]
            };
          }
        }
        return user;
      })
    );
  };

  const areAllActionsSelected = (permissions: PermissionItem[], resource: Resource): boolean => {
    const resourcePermission = permissions.find(p => p.resource === resource);
    if (!resourcePermission) return false;
    
    // Check if all actions are true
    return Object.values(Action).every(action => 
      resourcePermission.actions[action] === true
    );
  };

  const handleSavePermissions = () => {
    // In a real app, you would send the updated permissions to your API
    alert('Permissions saved successfully!');
  };

  // Template handlers
  const handleSaveTemplate = () => {
    if (!selectedUser || !newTemplateName.trim()) return;
    
    const userToTemplate = userPermissions.find(u => u.userId === selectedUser);
    if (!userToTemplate) return;
    
    const newTemplate: RoleTemplate = {
      id: `template-${Date.now()}`,
      name: newTemplateName,
      userType: userToTemplate.userType,
      permissions: [...userToTemplate.permissions]
    };
    
    setTemplates(prev => [...prev, newTemplate]);
    setNewTemplateName('');
    
    // Show saved message
    setShowSavedMessage(true);
    
    // Clear previous timeout if it exists
    if (messageTimeoutRef.current) {
      clearTimeout(messageTimeoutRef.current);
    }
    
    // Hide message after 3 seconds
    messageTimeoutRef.current = setTimeout(() => {
      setShowSavedMessage(false);
    }, 3000);
  };
  
  const handleApplyTemplate = () => {
    if (!selectedUser || !selectedTemplate) return;
    
    const template = templates.find(t => t.id === selectedTemplate);
    if (!template) return;
    
    setUserPermissions(prev => 
      prev.map(user => {
        if (user.userId === selectedUser) {
          return {
            ...user,
            permissions: JSON.parse(JSON.stringify(template.permissions))
          };
        }
        return user;
      })
    );
  };
  
  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (messageTimeoutRef.current) {
        clearTimeout(messageTimeoutRef.current);
      }
    };
  }, []);

  // Get selected user data
  const selectedUserData = userPermissions.find(u => u.userId === selectedUser);

  // Get all available resources for checkboxes
  const allResources = Object.values(Resource);
  
  // Filter users by search term and user type
  const filteredUsers = userPermissions.filter(user => {
    const matchesSearch = 
      user.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = userTypeFilter === 'all' || user.userType === userTypeFilter;
    
    return matchesSearch && matchesType;
  });

  return (
    <Container>
      <Title>{title}</Title>
      
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
            {managedUserTypes.map(type => (
              <option key={type} value={type}>
                {type.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())}
              </option>
            ))}
          </Select>
        </FilterLabel>
      </FilterContainer>
      
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>User Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map(user => (
              <TableRow key={user.userId}>
                <TableCell>{user.userName}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.userType}</TableCell>
                <TableCell>{user.isActive ? 'Active' : 'Inactive'}</TableCell>
                <TableCell>
                  <Button 
                    size="small" 
                    variant="secondary"
                    onClick={() => setSelectedUser(user.userId)}
                  >
                    {selectedUser === user.userId ? 'Editing' : 'Edit Permissions'}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
      
      {selectedUserData && (
        <Card>
          <SelectionHeader>
            <Subtitle>
              Managing Permissions for {selectedUserData.userName} ({selectedUserData.userType})
            </Subtitle>
          </SelectionHeader>
          
          <TemplateContainer>
            <Subtitle>Permission Templates</Subtitle>
            <TemplateControls>
              <TemplateName 
                placeholder="New template name..."
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
              <Button 
                variant="secondary" 
                icon={<Copy size={16} />}
                onClick={handleSaveTemplate}
                disabled={!newTemplateName.trim()}
              >
                Save as Template
              </Button>
              
              <TemplateSelect
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.target.value)}
              >
                <option value="">Select template to apply...</option>
                {templates
                  .filter(t => t.userType === selectedUserData.userType)
                  .map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))
                }
              </TemplateSelect>
              
              <Button 
                variant="secondary"
                onClick={handleApplyTemplate}
                disabled={!selectedTemplate}
              >
                Apply Template
              </Button>
            </TemplateControls>
            
            {showSavedMessage && (
              <SuccessMessage>
                <Check size={16} />
                Template saved successfully
              </SuccessMessage>
            )}
          </TemplateContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resource</TableHead>
                <TableHead>View</TableHead>
                <TableHead>Create</TableHead>
                <TableHead>Edit</TableHead>
                <TableHead>Delete</TableHead>
                <TableHead>Manage All</TableHead>
                <TableHead>Select All</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allResources.map(resource => {
                // Find if this user has permissions for this resource
                const resourcePermission = selectedUserData.permissions.find(
                  p => p.resource === resource
                );
                
                // Check if all permissions are selected
                const allSelected = areAllActionsSelected(selectedUserData.permissions, resource);
                
                return (
                  <TableRow key={resource}>
                    <TableCell>{resource}</TableCell>
                    <TableCell>
                      <Checkbox 
                        checked={resourcePermission?.actions[Action.READ] || false}
                        onChange={(e) => handlePermissionChange(
                          selectedUserData.userId, 
                          resource, 
                          Action.READ, 
                          e.target.checked
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox 
                        checked={resourcePermission?.actions[Action.CREATE] || false}
                        onChange={(e) => handlePermissionChange(
                          selectedUserData.userId, 
                          resource, 
                          Action.CREATE, 
                          e.target.checked
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox 
                        checked={resourcePermission?.actions[Action.UPDATE] || false}
                        onChange={(e) => handlePermissionChange(
                          selectedUserData.userId, 
                          resource, 
                          Action.UPDATE, 
                          e.target.checked
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox 
                        checked={resourcePermission?.actions[Action.DELETE] || false}
                        onChange={(e) => handlePermissionChange(
                          selectedUserData.userId, 
                          resource, 
                          Action.DELETE, 
                          e.target.checked
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox 
                        checked={resourcePermission?.actions[Action.MANAGE] || false}
                        onChange={(e) => handlePermissionChange(
                          selectedUserData.userId, 
                          resource, 
                          Action.MANAGE, 
                          e.target.checked
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <Checkbox 
                        checked={allSelected}
                        onChange={(e) => handleToggleAllForResource(
                          selectedUserData.userId,
                          resource,
                          e.target.checked
                        )}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          <ButtonGroup>
            <Button variant="secondary" onClick={() => setSelectedUser(null)}>
              Cancel
            </Button>
            <Button icon={<Save size={16} />} onClick={handleSavePermissions}>
              Save Permissions
            </Button>
          </ButtonGroup>
        </Card>
      )}
    </Container>
  );
};

export default PermissionManager; 