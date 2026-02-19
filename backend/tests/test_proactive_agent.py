
import os
import sys
import asyncio
from sqlalchemy.orm import Session

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.curdir))

from app.core.database import SessionLocal
from app.services.proactive_agent import proactive_agent_service
from app.models.notification import Notification

async def test_proactive_scan():
    print("Testing Proactive AI Agent Scan...")
    
    # 1. Check current notification count
    db = SessionLocal()
    initial_count = db.query(Notification).filter(Notification.title.like("%AI Insight%")).count()
    print(f"Initial AI insights in DB: {initial_count}")
    
    # 2. Trigger the scan
    print("Running proactive scan (this may take a moment for AI generation)...")
    await proactive_agent_service.run_daily_insight_scan()
    
    # 3. Check new notification count
    final_count = db.query(Notification).filter(Notification.title.like("%AI Insight%")).count()
    print(f"Final AI insights in DB: {final_count}")
    
    if final_count > initial_count:
        print("SUCCESS: New AI insights generated!")
        latest = db.query(Notification).filter(Notification.title.like("%AI Insight%")).order_by(Notification.created_at.desc()).first()
        print("-" * 20)
        print(f"Latest Insight Title: {latest.title}")
        print(f"Insight Message: {latest.message}")
        print("-" * 20)
    else:
        print("FAILURE: No new insights generated. Check logs for issues.")
    
    db.close()

if __name__ == "__main__":
    asyncio.run(test_proactive_scan())
