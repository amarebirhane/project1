# app/core/websocket.py
from typing import Dict, List, Any
from fastapi import WebSocket
import logging

logger = logging.getLogger(__name__)

class ConnectionManager:
    """
    Manages WebSocket connections for users to enable real-time notifications.
    Stores connections in a dictionary keyed by user_id.
    """
    def __init__(self):
        # Dictionary of user_id -> List of WebSockets (one user can have multiple active tabs)
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"User {user_id} connected via WebSocket. Active connections for user: {len(self.active_connections[user_id])}")

    def disconnect(self, websocket: WebSocket, user_id: int):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"User {user_id} disconnected from WebSocket.")

    async def send_personal_message(self, message: Any, user_id: int):
        """Send a message to all active connections for a specific user"""
        if user_id in self.active_connections:
            # We iterate over a copy to avoid issues if a connection is dropped during iteration
            for connection in self.active_connections[user_id][:]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending WebSocket message to user {user_id}: {str(e)}")
                    # Optionally handle stale connections here
                    self.disconnect(connection, user_id)

    async def broadcast(self, message: Any):
        """Send a message to ALL connected users"""
        for user_id, connections in self.active_connections.items():
            for connection in connections[:]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting WebSocket message to user {user_id}: {str(e)}")
                    self.disconnect(connection, user_id)

manager = ConnectionManager()
