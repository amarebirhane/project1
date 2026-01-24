import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import client from '../api/client';
import { Platform } from 'react-native';

interface User {
    id: number;
    email: string;
    username: string;
    full_name: string;
    role?: string;
    // Add other user fields as needed
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;

    login: (email: string, password: string) => Promise<void>;
    register: (data: any) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true, // Start loading to check for initial token
    error: null,

    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            const formData = new FormData();
            formData.append('username', email); // OAuth2 expects username
            formData.append('password', password);

            const response = await client.post('/auth/login', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const { access_token } = response.data;

            if (Platform.OS === 'web') {
                localStorage.setItem('auth_token', access_token);
            } else {
                await SecureStore.setItemAsync('auth_token', access_token);
            }

            // Load user profile after login
            const profileResponse = await client.get('/users/me', {
                headers: { Authorization: `Bearer ${access_token}` }
            });

            set({
                token: access_token,
                user: profileResponse.data,
                isAuthenticated: true,
                isLoading: false
            });

        } catch (error: any) {
            console.error('Login error:', error);
            const msg = error.response?.data?.detail || 'Login failed';
            set({ error: msg, isLoading: false, isAuthenticated: false });
            throw error;
        }
    },

    register: async (data) => {
        set({ isLoading: true, error: null });
        try {
            // Backend expects username as well. If not provided, use email prefix.
            const registrationData = {
                ...data,
                username: data.username || data.email.split('@')[0],
                role: 'employee' // Map mobile USER to backend employee
            };
            await client.post('/auth/register', registrationData);
            set({ isLoading: false });
            // Optionally login automatically or require separate login
        } catch (error: any) {
            const msg = error.response?.data?.detail || 'Registration failed';
            set({ error: msg, isLoading: false });
            throw error;
        }
    },

    logout: async () => {
        set({ isLoading: true });
        try {
            if (Platform.OS === 'web') {
                localStorage.removeItem('auth_token');
            } else {
                await SecureStore.deleteItemAsync('auth_token');
            }
            // Optional: Call logout endpoint if exists
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            set({ user: null, token: null, isAuthenticated: false, isLoading: false, error: null });
        }
    },

    checkAuth: async () => {
        set({ isLoading: true });
        try {
            let token = null;
            if (Platform.OS === 'web') {
                token = localStorage.getItem('auth_token');
            } else {
                token = await SecureStore.getItemAsync('auth_token');
            }

            if (token) {
                // Verify token by fetching user
                try {
                    const profileResponse = await client.get('/users/me', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    set({
                        token,
                        user: profileResponse.data,
                        isAuthenticated: true,
                        isLoading: false
                    });
                } catch (err) {
                    // Token invalid or expired
                    if (Platform.OS === 'web') {
                        localStorage.removeItem('auth_token');
                    } else {
                        await SecureStore.deleteItemAsync('auth_token');
                    }
                    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
                }
            } else {
                set({ token: null, user: null, isAuthenticated: false, isLoading: false });
            }
        } catch (error) {
            set({ isLoading: false, isAuthenticated: false });
        }
    }
}));
