import json
import os
import logging
from typing import Dict, Any, Optional
from .config import settings

logger = logging.getLogger(__name__)

class I18nService:
    _translations: Dict[str, Dict[str, Any]] = {}
    _loaded = False

    @classmethod
    def load_translations(cls):
        """Load all translation files from the locales directory."""
        if cls._loaded:
            return
            
        locales_dir = settings.LOCALES_DIR
        if not os.path.exists(locales_dir):
            os.makedirs(locales_dir, exist_ok=True)
            # Create a default empty en.json if it doesn't exist
            default_en = os.path.join(locales_dir, "en.json")
            if not os.path.exists(default_en):
                with open(default_en, "w") as f:
                    json.dump({}, f)
        
        supported = [l.strip() for l in settings.SUPPORTED_LOCALES.split(",")]
        
        for lang in supported:
            file_path = os.path.join(locales_dir, f"{lang}.json")
            if os.path.exists(file_path):
                try:
                    with open(file_path, "r", encoding="utf-8") as f:
                        cls._translations[lang] = json.load(f)
                    logger.info(f"Loaded translation for: {lang}")
                except Exception as e:
                    logger.error(f"Failed to load translation {lang}: {e}")
            else:
                cls._translations[lang] = {}
                
        cls._loaded = True

    @classmethod
    def translate(cls, key: str, locale: Optional[str] = None, **kwargs) -> str:
        """Translate a key to the given locale."""
        if not cls._loaded:
            cls.load_translations()
            
        lang = locale or settings.DEFAULT_LOCALE
        # Fallback to default if requested lang not supported
        if lang not in cls._translations:
            lang = settings.DEFAULT_LOCALE
            
        # Get message, fallback to default English if missing in requested lang
        message = cls._translations.get(lang, {}).get(key)
        if message is None and lang != settings.DEFAULT_LOCALE:
            message = cls._translations.get(settings.DEFAULT_LOCALE, {}).get(key)
            
        # Return key if still not found
        if message is None:
            return key
            
        # Format if kwargs provided
        try:
            return message.format(**kwargs)
        except Exception:
            return message

# Global shortcut
def _(key: str, locale: Optional[str] = None, **kwargs) -> str:
    return I18nService.translate(key, locale, **kwargs)
