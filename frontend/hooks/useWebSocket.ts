'use client';

import { useEffect, useRef, useCallback } from 'react';
import useNotificationStore from '@/store/notificationStore';
import { useAuth } from '@/lib/rbac/auth-context';

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/ws';

export const useWebSocket = () => {
    const { isAuthenticated } = useAuth();
    const { setNotifications } = useNotificationStore();
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const connect = useCallback(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (!token || socketRef.current?.readyState === WebSocket.OPEN) return;

        const wsUrl = `${WEBSOCKET_URL}?token=${token}`;
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            console.log('WebSocket connected');
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('WebSocket notification received:', data);

                if (data && data.id) {
                    // Update the notification store
                    // We prepend the new notification to the list
                    setNotifications((prev) => {
                        // Avoid duplicates
                        if (prev.find(n => n.id === data.id)) return prev;
                        return [data, ...prev];
                    });

                    // Optionally update unread count if it's not already updated by the store
                    // fetchUnreadCount(); 
                }
            } catch (err) {
                console.error('Failed to parse WebSocket message:', err);
            }
        };

        socket.onclose = (event) => {
            console.log('WebSocket disconnected:', event.reason);
            // Reconnect logic
            const currentToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            if (currentToken) {
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('Attempting to reconnect WebSocket...');
                    connect();
                }, 5000);
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            socket.close();
        };

        socketRef.current = socket;
    }, [setNotifications]);

    useEffect(() => {
        connect();
        return () => {
            if (socketRef.current) {
                socketRef.current.close();
            }
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connect, isAuthenticated]);

    return { socket: socketRef.current };
};
