import google.generativeai as genai
from ..core.config import settings

class AIChatService:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            # Using gemini-1.5-flash as it is more robust and faster
            self.model = genai.GenerativeModel('gemini-1.5-flash')
        else:
            self.model = None

    async def generate_response(self, message: str, history: list = []) -> str:
        if not self.model:
            return "AI Chat is not configured (missing GEMINI_API_KEY)."

        try:
            # System prompt to give context to the assistant
            system_context = "You are an expert AI Financial Assistant for a Finance Management System. Use the provided context to help users with accounting, budgeting, and financial analysis. Be professional and concise."
            
            # Start chat with history
            # Gemini history format: [{"role": "user"|"model", "parts": ["..."]}]
            chat_history = []
            for msg in history:
                role = "user" if msg.role == "user" else "model"
                chat_history.append({"role": role, "parts": [msg.content]})
            
            # We add the system context as a first message or instruction if supported.
            # In older versions, we prefix the message. In newer, we use system_instruction in GenerativeModel.
            # For compatibility with 0.3.2, we'll try a simpler approach if Needed, but let's try starting chat.
            
            chat = self.model.start_chat(history=chat_history)
            
            # If it's the first message, prepend system context
            full_message = f"{system_context}\n\nUser: {message}" if not history else message
            
            response = chat.send_message(full_message)
            return response.text
        except Exception as e:
            print(f"Error generating AI response: {e}")
            return "I apologize, but I encountered an error processing your request."

ai_chat_service = AIChatService()
