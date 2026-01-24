import google.generativeai as genai
import base64
from ..core.config import settings
from .ai_tools import AI_TOOLS

class AIChatService:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            # Using gemini-flash-latest with registered tools for multi-modal + function calling
            self.model = genai.GenerativeModel(
                model_name='models/gemini-flash-latest',
                tools=AI_TOOLS
            )
        else:
            self.model = None

    async def generate_response(self, message: str, history: list = [], current_page: str = None, user_id: int = None, image_data: str = None) -> str:
        if not self.model:
            return "AI Chat is not configured (missing GEMINI_API_KEY)."

        try:
            # Enriched System prompt for Vision + Data + Security
            system_context = f"""You are the Financial Management System AI Assistant (FMS Assistant). 
            
            **User Info**: The current authenticated user ID is **{user_id or 'unknown'}**. 
            Always use this ID when calling tools to create drafts (expenses/revenue).
            
            **Vision Capabilities**: You can analyze images of receipts, invoices, or financial charts. 
            If the user uploads an image, extract relevant data and offer to save it.
            
            **Data Awareness**: Use your provided tools to query real-time data for revenue, expenses, and inventory.
            
            **Instructions**:
            - Use **Markdown formatting**.
            - Be professional, helpful, and concise. 
            
            {f'The user is currently viewing: **{current_page}**' if current_page else ''}
            """
            
            # Prepare history with image support
            chat_history = []
            for msg in history:
                role = "user" if msg.role == "user" else "model"
                parts = [{"text": msg.content}]
                
                # Use getattr to safely check for image_data from Pydantic model
                msg_image = getattr(msg, 'image_data', None)
                if msg_image:
                    try:
                        if "," in msg_image:
                            _, img_str = msg_image.split(",")
                        else:
                            img_str = msg_image
                        
                        parts.append({
                            "mime_type": "image/jpeg",
                            "data": base64.b64decode(img_str)
                        })
                    except Exception as e:
                        print(f"Error decoding image in history: {e}")
                
                chat_history.append({"role": role, "parts": parts})
            
            # Enable automatic function calling
            chat = self.model.start_chat(history=chat_history, enable_automatic_function_calling=True)
            
            # Prepend system context to initial message
            prompt_parts = []
            if not history:
                prompt_parts.append(f"[SYSTEM CONTEXT: {system_context}]\n\nUser: {message}")
            else:
                prompt_parts.append(message)

            # Add current image if provided
            if image_data:
                try:
                    if "," in image_data:
                        _, img_str = image_data.split(",")
                    else:
                        img_str = image_data
                    
                    prompt_parts.append({
                        "mime_type": "image/jpeg",
                        "data": base64.b64decode(img_str)
                    })
                except Exception as e:
                    print(f"Error decoding current image: {e}")

            response = chat.send_message(prompt_parts)
            return response.text
        except Exception as e:
            print(f"Error generating AI response: {e}")
            return f"I apologize, but I encountered an error: {str(e)}"

ai_chat_service = AIChatService()
