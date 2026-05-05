
import os
from fastapi import FastAPI
from .router import router
from pathlib import Path
from dotenv import load_dotenv

# This forces it to look in the folder where main.py lives
env_path = Path('.') / '.env'
load_dotenv(dotenv_path=env_path)

# Quick check to see if the key is actually loaded
api_key = os.getenv("OPENROUTER_API_KEY")
if not api_key:
    print("CRITICAL: OPENAI_API_KEY is not being detected!")
else:
    print("Success: API Key loaded.")

app = FastAPI(
    title="Resume Analyzer",
    description="API for resume enhancement and testing steps generation"
)

# This line is CRITICAL - ensure you are including the router
app.include_router(router, prefix="/api/resume", tags=["Resume Analyzer"])

@app.get("/health")
def health():
    return {
        "status": "ok",
        "openrouter_key_set": bool(os.environ.get("OPENROUTER_API_KEY")),
        "model": os.environ.get("OPENROUTER_MODEL", "anthropic/claude-sonnet-4-5"),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
