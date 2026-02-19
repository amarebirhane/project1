# app/api/v1/websocket.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, Depends
from sqlalchemy.orm import Session
import logging

from ...core.websocket import manager
from ...core.security import verify_token
from ...core.database import get_db
from ...crud.user import user as user_crud

router = APIRouter()
logger = logging.getLogger(__name__)

@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time notifications.
    Expects a JWT token in the query params for authentication.
    """
    user_id = None
    try:
        # 1. Authenticate user via token
        payload = verify_token(token)
        user_email = payload.get("sub")
        if not user_email:
            await websocket.close(code=1008) # Policy Violation
            return

        user = user_crud.get_by_email(db, email=user_email)
        if not user or not user.is_active:
            await websocket.close(code=1008)
            return
        
        user_id = user.id
        
        # 2. Register connection
        await manager.connect(websocket, user_id)
        
        # 3. Keep connection alive and listen for messages (if needed)
        # For notifications, we mostly push from server to client
        while True:
            # Wait for any message from client (can be used for heartbeats/pings)
            data = await websocket.receive_text()
            # We don't expect specific messages for now, just logging
            logger.debug(f"Received message from user {user_id}: {data}")

    except WebSocketDisconnect:
        if user_id is not None:
            manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {str(e)}")
        if websocket:
            try:
                await websocket.close(code=1011) # Internal Error
            except:
                pass
        if user_id is not None:
            manager.disconnect(websocket, user_id)
