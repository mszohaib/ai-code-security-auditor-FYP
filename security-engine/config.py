"""Application configuration loaded from environment variables."""

import os

from dotenv import load_dotenv

load_dotenv()


class Config:
    HOST = os.getenv("SECURITY_ENGINE_HOST", "0.0.0.0")
    PORT = int(os.getenv("SECURITY_ENGINE_PORT", "5001"))
    MAX_CODE_BYTES = int(os.getenv("MAX_CODE_BYTES", str(512 * 1024)))
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
