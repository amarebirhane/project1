import google.generativeai as genai
from ..core.config import settings

class AIChatService:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            # Using gemini-flash-latest which is confirmed in available_models.txt
            self.model = genai.GenerativeModel('models/gemini-flash-latest')
        else:
            self.model = None

    async def generate_response(self, message: str, history: list = [], current_page: str = None) -> str:
        if not self.model:
            return "AI Chat is not configured (missing GEMINI_API_KEY)."

        try:
            # Enriched System prompt to give deep context to the assistant
            system_context = f"""You are the Financial Management System AI Assistant (FMS Assistant). 
            You have expert knowledge about this specific application's architecture and features:
            
            1. **Automated Forecasting**: The system uses 6 ML algorithms (ARIMA, SARIMA, Prophet, XGBoost, LSTM, Linear Regression) to predict Revenue, Expenses, and Inventory.
            2. **Auto-Learning**: Models retrain automatically when new data is added (e.g., after 5 new entries or 24 hours).
            3. **Fraud Detection**: AI scans transactions (Revenue, Expenses, Sales) to identify anomalies and flag potential fraud with high precision.
            4. **Financial Simulation**: Users can run "What If" scenarios to see how revenue/expense multipliers affect long-term projections.
            5. **Modular Design**: Modules include Accounting (General Ledger, Taxes, Payroll), Inventory (Transfer, Warehousing), and advanced Reporting.
            6. **Permissions**: Features are restricted by role (Admin, Finance Manager, Accountant, Employee).
            
            {f'The user is currently viewing the page: {current_page}' if current_page else ''}
            
            Be professional, helpful, and concise. Use this knowledge to answer questions specifically about how the system works or how to use its financial tools.
            """
            
            # Start chat with history
            chat_history = []
            for msg in history:
                role = "user" if msg.role == "user" else "model"
                chat_history.append({"role": role, "parts": [msg.content]})
            
            chat = self.model.start_chat(history=chat_history)
            
            # Add system context to the message if it's the start of conversation or context changed
            prompt = f"[SYSTEM CONTEXT: {system_context}]\n\nUser: {message}" if not history else message
            
            response = chat.send_message(prompt)
            return response.text
        except Exception as e:
            print(f"Error generating AI response: {e}")
            return "I apologize, but I encountered an error processing your request."

ai_chat_service = AIChatService()
