'use client';

import { useEffect, useRef, useCallback } from 'react';
import useNotificationStore from '@/store/notificationStore';
import { useAuth } from '@/lib/rbac/auth-context';

const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/ws';
const MAX_RECONNECT_DELAY = 30000; // 30s cap

export const useWebSocket = () => {
    const { isAuthenticated } = useAuth();
    const { setNotifications } = useNotificationStore();
    const socketRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectDelayRef = useRef<number>(2000); // start at 2s

    const connect = useCallback(() => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        if (!token || socketRef.current?.readyState === WebSocket.OPEN) return;

        const wsUrl = `${WEBSOCKET_URL}?token=${token}`;
        const socket = new WebSocket(wsUrl);

        socket.onopen = () => {
            reconnectDelayRef.current = 2000; // reset backoff on success
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data && data.id) {
                    setNotifications((prev) => {
                        if (prev.find(n => n.id === data.id)) return prev;
                        return [data, ...prev];
                    });
                }
            } catch {
                // silently ignore parse errors
            }
        };

        socket.onclose = () => {
            const currentToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
            if (currentToken) {
                // Exponential backoff: 2s → 4s → 8s → ... capped at 30s
                reconnectTimeoutRef.current = setTimeout(() => {
                    connect();
                }, reconnectDelayRef.current);
                reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, MAX_RECONNECT_DELAY);
            }
        };

        socket.onerror = () => {
            // Silently close — onclose will handle reconnect
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
