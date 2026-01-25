import google.generativeai as genai
import base64
from ..core.config import settings
from .ai_tools import AI_TOOLS

class AIChatService:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            # Using gemini-2.0-flash for stability + multi-modal + AFC
            self.model = genai.GenerativeModel(
                model_name='models/gemini-2.0-flash',
                tools=AI_TOOLS
            )
        else:
            self.model = None

    async def generate_response(self, message: str, history: list = [], current_page: str = None, user_id: int = None, image_data: str = None) -> str:
        if not self.model:
            return "AI Chat is not configured (missing GEMINI_API_KEY)."

        try:
            # Enriched System prompt for Vision + Data + Security
            system_instruction = f"""You are the Financial Management System AI Assistant (FMS Assistant). 
            
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
            
            # Re-initialize model WITH system instruction (since it depends on request params)
            # Note: We create a temporary model instance for this specific request context
            request_model = genai.GenerativeModel(
                model_name=self.model.model_name,
                tools=AI_TOOLS,
                system_instruction=system_instruction
            )

            # Enable automatic function calling
            chat = request_model.start_chat(history=chat_history, enable_automatic_function_calling=True)
            
            # Prepare prompt parts
            prompt_parts = [message]

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
            error_msg = str(e)
            print(f"Error generating AI response: {error_msg}")
            
            # Handle Quota / Rate Limit errors (429)
            if "429" in error_msg or "quota" in error_msg.lower():
                import re
                # Check for "exhausted" quota (billing/daily limit) vs "rate limit" (temporary wait)
                is_exhausted = "quota" in error_msg.lower() and ("exhausted" in error_msg.lower() or "limit" in error_msg.lower())
                
                # Try to extract "retry in X.Xs" for rate limits
                match = re.search(r"retry in (\d+\.?\d*)s", error_msg)
                if match:
                    seconds = int(float(match.group(1)))
                    return f"The AI Assistant is resting (Rate Limit). Please try again in {seconds} seconds."
                
                if is_exhausted:
                    return "The AI Assistant has reached its daily quota (Free Tier). Please check your plan in Google AI Studio or try again later."
                
                return "The AI Assistant is currently receiving many requests. Please wait a moment before trying again."
                
            return f"I apologize, but I encountered an error: {error_msg}"

ai_chat_service = AIChatService()
