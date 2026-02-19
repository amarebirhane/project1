'use client';

import { useWebSocket } from '@/hooks/useWebSocket';

export default function WebSocketInitializer() {
    // This hook will handle connection/disconnection based on auth state
    useWebSocket();

    // This component doesn't render anything
    return null;
}
