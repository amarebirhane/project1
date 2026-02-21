import requests
import json
import hmac
import hashlib
import time

# Configuration
BASE_URL = "http://localhost:8000/api/v1"
WEBHOOK_URL = f"{BASE_URL}/banking/chapa/webhook"
CHAPA_WEBHOOK_HASH = "test_hash" # This should match your .env if set

def test_chapa_webhook():
    print("--- Chapa Webhook Verification ---")
    
    # 1. Prepare payload
    payload = {
        "event": "charge.success",
        "reference": f"test_tx_{int(time.time())}",
        "amount": 1250.75,
        "currency": "ETB",
        "tx_ref": f"tx_{int(time.time())}",
        "first_name": "Antigravity",
        "last_name": "Tester",
        "email": "tester@example.com",
        "meta": {
            "bank_account_id": 1 # Assumes bank account ID 1 exists
        },
        "status": "success"
    }
    
    payload_str = json.dumps(payload)
    
    # 2. Generate signature
    signature = hmac.new(
        CHAPA_WEBHOOK_HASH.encode('utf-8'),
        payload_str.encode('utf-8'),
        hashlib.sha256
    ).hexdigest()
    
    # 3. Send request
    print(f"Sending mock webhook to {WEBHOOK_URL}...")
    headers = {
        "Content-Type": "application/json",
        "x-chapa-signature": signature
    }
    
    try:
        response = requests.post(WEBHOOK_URL, data=payload_str, headers=headers)
        print(f"Response Status: {response.status_code}")
        print(f"Response Body: {response.text}")
        
        if response.status_code == 200:
            print("SUCCESS: Webhook processed successfully.")
        else:
            print("FAILURE: Webhook processing failed.")
            
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    test_chapa_webhook()
