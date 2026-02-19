import asyncio
import websockets # type: ignore
import json
import httpx
import sys

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
WS_URL = "ws://localhost:8000/api/v1/ws"
LOGIN_USER = "admin"
LOGIN_PASS = "admin1234"

async def verify_websocket():
    print("--- WebSocket Verification Script ---")
    
    # 1. Login to get token
    print(f"Logging in as {LOGIN_USER}...")
    async with httpx.AsyncClient() as client:
        try:
            print(f"POST {BASE_URL}/auth/login-json with {LOGIN_USER}")
            response = await client.post(
                f"{BASE_URL}/auth/login-json",
                json={"username": LOGIN_USER, "password": LOGIN_PASS}
            )
            print(f"Status: {response.status_code}")
            if response.status_code != 200:
                print(f"Login failed: {response.status_code} - {response.text}")
                return
            
            data = response.json()
            token = data["access_token"]
            user_id = data["user"]["id"]
            print(f"Logged in successfully. User ID: {user_id}")
        except Exception as e:
            print(f"Login error ({type(e).__name__}): {str(e)}")
            import traceback
            traceback.print_exc()
            return

    # 2. Connect to WebSocket
    print("Connecting to WebSocket...")
    try:
        async with websockets.connect(f"{WS_URL}?token={token}") as websocket:
            print("WebSocket connected!")
            
            # 3. Trigger a notification (e.g., via a dummy notify call if we had one, 
            # or just creating something that triggers a notification)
            # Since we don't have a direct test notification endpoint, 
            # let's try to notify pending approvals which is triggered on GET /notifications/
            print("Triggering notification via /notifications/ endpoint...")
            async with httpx.AsyncClient() as client:
                await client.get(
                    f"{BASE_URL}/notifications/",
                    headers={"Authorization": f"Bearer {token}"}
                )
            
            # 4. Wait for message
            print("Waiting for notification message...")
            try:
                # Set a timeout so we don't wait forever
                message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                notification = json.loads(message)
                print("Received Notification via WebSocket:")
                print(json.dumps(notification, indent=2))
                print("\nSUCCESS: WebSocket real-time notification received!")
            except asyncio.TimeoutError:
                print("TIMEOUT: No notification received via WebSocket within 5 seconds.")
            
    except Exception as e:
        print(f"WebSocket connection error: {str(e)}")

if __name__ == "__main__":
    asyncio.run(verify_websocket())
