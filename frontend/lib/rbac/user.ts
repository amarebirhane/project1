// lib/rabc/user.ts
import { UserType, AdminType } from './models';

export interface BaseUser {
    id: string;
    username: string;
    email: string | null;
    userType: UserType;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    isActive: boolean;
    lastLoginAt: Date | null;
    managerId: string | null; // For hierarchy: Admin has null, others point to manager
    departmentId: string | null; // Optional department assignment
    createdAt: Date;
    updatedAt: Date;
}

export interface Admin extends BaseUser {
  adminType: AdminType;
  corporateClientId: string | null;
  roles?: any[];
  permissions?: any;
}