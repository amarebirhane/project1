import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Android Emulator: 10.0.2.2 maps to host machine localhost
// Physical Device: Use your computer's IP address
const BASE_URL = Platform.select({
    android: 'http://10.0.2.2:8000/api/v1',
    ios: 'http://localhost:8000/api/v1',
    default: 'http://localhost:8000/api/v1',
});

const client = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
client.interceptors.request.use(
    async (config) => {
        try {
            let token = null;
            if (Platform.OS === 'web') {
                // Use localStorage for web
                token = localStorage.getItem('auth_token');
            } else {
                // Use SecureStore for native
                token = await SecureStore.getItemAsync('auth_token');
            }
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Error reading token:', error);
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle errors
client.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Handle 401 (Unauthorized) - could trigger logout here
        if (error.response?.status === 401) {
            // We might want to clear token or notify store, 
            // but circular dependency with store is tricky.
            // For now, just reject.
        }
        return Promise.reject(error);
    }
);

export default client;
