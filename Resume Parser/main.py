import os
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pathlib import Path
from dotenv import load_dotenv

# Ensure parser_logic.py has the updated parse_resume(file_content, filename)
from parser_logic import parse_resume

load_dotenv()

app = FastAPI(title="GRC Resume Parser - Secure Mode")
security = HTTPBearer()

# We keep UPLOAD_DIR only if you decide to save files later. 
# For now, we process in memory for speed and link extraction.
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Define your secret key in the .env file
API_AUTH_TOKEN = os.getenv("APP_SECURITY_KEY")

def validate_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validates the Bearer token against the APP_SECURITY_KEY."""
    if not API_AUTH_TOKEN or credentials.credentials != API_AUTH_TOKEN:
        raise HTTPException(
            status_code=403, 
            detail="Invalid or missing Authorization Token"
        )
    return credentials.credentials

@app.get("/")
def health_check():
    return {"status": "online", "security": "enabled"}

@app.post("/parse-resume")
async def upload_and_parse(
    file: UploadFile = File(...), 
    token: str = Depends(validate_token)
):
    """
    Parses the resume directly from memory. 
    This ensures 'fitz' can read the hyperlink metadata layer.
    """
    try:
        # 1. Read the file into memory
        file_bytes = await file.read()
        
        if not file_bytes:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        # 2. Pass the bytes to the parser
        # The parser_logic.py MUST use fitz.open(stream=file_bytes, filetype="pdf")
        parsed_data = parse_resume(file_bytes, file.filename)
        
        return {
            "status": "success",
            "filename": file.filename,
            "data": parsed_data
        }
    except Exception as e:
        # Detailed error for debugging GRC extraction
        raise HTTPException(status_code=500, detail=f"AI Parsing Error: {str(e)}")

# NOTE: The download route will only work if you save the file to UPLOAD_DIR.
# If you want to remain memory-only, this route can be removed.
@app.get("/download/{filename}")
async def download_file(filename: str, token: str = Depends(validate_token)):
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found. (Memory-only mode is active)")
    
    return FileResponse(path=file_path, filename=filename)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
