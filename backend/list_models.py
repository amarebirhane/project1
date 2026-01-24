import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

with open("available_models.txt", "w") as f:
    if not api_key:
        f.write("GEMINI_API_KEY not found in environment.\n")
    else:
        genai.configure(api_key=api_key)
        try:
            f.write("Listing available models:\n")
            for m in genai.list_models():
                f.write(f"Model: {m.name} (Display: {m.display_name})\n")
                f.write(f"Methods: {m.supported_generation_methods}\n\n")
        except Exception as e:
            f.write(f"Error listing models: {e}\n")
print("Done listing models to available_models.txt")
