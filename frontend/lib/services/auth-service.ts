// lib/services/auth-service.ts

import { Admin } from '../rabc/user';
import { AdminType, UserType } from '../rabc/models';
import { cn } from "/@/lib/utils"

interface LoginResponse {
  user: {
    id: string;
    username: string;
    email: string | null;
    firstName: string;
    lastName: string;
    adminType: AdminType;
    userType: UserType;
    isActive: boolean;
    insuranceCompanyId: string | null;
    roles?: any[];
    permissions?: any;
  };
  access_token: string;
}
export const authService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      console.log('Login Request:', JSON.stringify({
        requestData: { username, password: '********' },
        timestamp: new Date().toISOString()
      }, null, 2));

      const response = await fetch('http://localhost:3000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      // Log the exact JSON response from the backend with formatting
      console.group('Backend Response Details');
      console.log('Raw Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.url
      });
      console.log('JSON Data:', data);
      console.table(data.user); // Shows user data in table format
      console.groupEnd();

      // Handle unauthorized access
      if (response.status === 401) {
        throw new Error('Invalid credentials');
      }

      // Ensure `data.user` exists
      if (!data || !data.user) {
        console.error('Unexpected Response:', JSON.stringify(data, null, 2));
        throw new Error('Unexpected response from server: User data is missing');
      }

      // Destructure user with default values for optional fields
      const {
        id,
        username: userUsername,
        email = null,
        firstName = '',
        lastName = '',
        phoneNumber = '',
        userType,
        adminType: rawAdminType,
        isActive = true,
        lastLoginAt,
        insuranceCompanyId = null,
        corporateClientId = null,
        createdAt,
        updatedAt,
        roles = [],
        permissions = {}
      } = data.user;

      // Validate userType and determine adminType
      let adminType = rawAdminType; // Default to the value from the backend
      if (userType === UserType.PROVIDER_ADMIN) {
        adminType = AdminType.PROVIDER_ADMIN;
      } else if (userType === UserType.ADMIN && rawAdminType === AdminType.SYSTEM_ADMIN) {
        adminType = AdminType.SYSTEM_ADMIN;
      } else if (userType === UserType.INSURANCE_ADMIN) {
        adminType = AdminType.INSURANCE_ADMIN;
      } else if (userType === UserType.CORPORATE_ADMIN) {
        adminType = AdminType.CORPORATE_ADMIN;
      }

      // Create the complete user object
      const completeUser: Admin = {
        id,
        username: userUsername,
        email,
        firstName,
        lastName,
        phoneNumber,
        userType,
        adminType, // Use the determined adminType
        isActive,
        lastLoginAt: lastLoginAt ? new Date(lastLoginAt) : null,
        createdAt: createdAt ? new Date(createdAt) : new Date(),
        updatedAt: updatedAt ? new Date(updatedAt) : new Date(),
        roles,
        permissions
      };

      // Log processed response
      console.log('Processed Response:', {
        user: completeUser,
        token: data.access_token ? '[PRESENT]' : '[MISSING]'
      });

      return {
        access_token: data.access_token,
        user: completeUser
      };
    } catch (error) {
      console.error('Login Error:', error);
      throw error;
    }
  }
};