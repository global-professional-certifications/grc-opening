import os
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.middleware.cors import CORSMiddleware
from pathlib import Path
from dotenv import load_dotenv

from parser_logic import parse_resume

load_dotenv()

# ─────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# App & Security
# ─────────────────────────────────────────────
app = FastAPI(title="GRC Resume Parser – Secure Mode", version="2.0.0")

# Allow your frontend origin; tighten this in production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

security = HTTPBearer()
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

API_AUTH_TOKEN = os.getenv("APP_SECURITY_KEY")

ALLOWED_EXTENSIONS = {"pdf", "docx", "txt"}
MAX_FILE_SIZE_MB = 10


def validate_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Validates the Bearer token against APP_SECURITY_KEY."""
    if not API_AUTH_TOKEN:
        raise HTTPException(
            status_code=500,
            detail="Server misconfiguration: APP_SECURITY_KEY is not set in .env"
        )
    if credentials.credentials != API_AUTH_TOKEN:
        raise HTTPException(
            status_code=403,
            detail="Invalid or missing Authorization Token"
        )
    return credentials.credentials


# ─────────────────────────────────────────────
# Routes
# ─────────────────────────────────────────────

@app.get("/")
def health_check():
    return {"status": "online", "security": "enabled", "version": "2.0.0"}


@app.post("/parse-resume")
async def upload_and_parse(
    file: UploadFile = File(...),
    token: str = Depends(validate_token),
):
    """
    Accepts a PDF, DOCX, or TXT resume and returns structured JSON data.
    Processes the file entirely in memory (no disk write required).
    """

    # ── File-type guard ──
    ext = (file.filename or "").lower().rsplit(".", 1)[-1]
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '.{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # ── Read into memory ──
    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    # ── File-size guard ──
    size_mb = len(file_bytes) / (1024 * 1024)
    if size_mb > MAX_FILE_SIZE_MB:
        raise HTTPException(
            status_code=413,
            detail=f"File too large ({size_mb:.1f} MB). Max allowed: {MAX_FILE_SIZE_MB} MB."
        )

    logger.info(f"Received file: '{file.filename}' ({size_mb:.2f} MB)")

    # ── Parse ──
    try:
        parsed_data = parse_resume(file_bytes, file.filename)
    except ValueError as ve:
        raise HTTPException(status_code=422, detail=str(ve))
    except Exception as e:
        logger.exception(f"Parsing failed for '{file.filename}'")
        raise HTTPException(
            status_code=500,
            detail=f"Parsing error: {str(e)}"
        )

    return {
        "status": "success",
        "filename": file.filename,
        "data": parsed_data,
    }


@app.get("/download/{filename}")
async def download_file(filename: str, token: str = Depends(validate_token)):
    """
    Download a previously saved file from UPLOAD_DIR.
    NOTE: only works if files were saved to disk; memory-only mode will return 404.
    """
    # Basic path traversal guard
    safe_filename = Path(filename).name
    file_path = UPLOAD_DIR / safe_filename

    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail="File not found. The parser operates in memory-only mode by default."
        )

    return FileResponse(path=file_path, filename=safe_filename)


# ─────────────────────────────────────────────
# Entry point
# ─────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
