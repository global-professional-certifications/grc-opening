import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

from auth import get_api_key
from parser import extract_text, compute_ats_parse_rate, detect_sections
from analyzer import analyze_with_llm
from hyperlink_checker import check_hyperlinks
from scorer import build_response
from models import ResumeAnalysisResponse

app = FastAPI(
    title="Resume Analyzer API",
    description="ATS-based resume scoring, issue detection with exact corrections, and hyperlink validation",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Public ──────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    """No auth required — useful for load balancer / uptime checks."""
    return {"status": "ok", "service": "resume-analyzer", "version": "2.0.0"}


# ── Protected ───────────────────────────────────────────────────────────────

@app.post("/analyze", response_model=ResumeAnalysisResponse)
async def analyze_resume(
    file: UploadFile = File(...),
    _key: str = Depends(get_api_key),          # ← API key guard
):
    """
    Upload a resume (PDF, DOCX, or TXT).
    Requires header:  X-API-Key: <your-key>

    Returns:
    - Per-category scores with EXACT quoted issues and corrected replacements
    - Hyperlink validation (working / broken / timeout)
    - Section detection
    - Actionable enhancement tips
    """
    allowed = {".pdf", ".docx", ".txt"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in allowed:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(allowed)}"
        )

    file_bytes = await file.read()
    if len(file_bytes) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Max 5 MB.")

    # ── 1. Extract text ────────────────────────────────────────────────────
    try:
        resume_text, is_parseable = extract_text(file_bytes, file.filename)
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))

    if not resume_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract text. File may be image-only or password-protected."
        )

    # ── 2. Local checks ────────────────────────────────────────────────────
    ats_score = compute_ats_parse_rate(resume_text, file_bytes, is_parseable)
    sections  = detect_sections(resume_text)

    # ── 3. Hyperlink validation ────────────────────────────────────────────
    try:
        hyperlinks = check_hyperlinks(resume_text, file_bytes, file.filename)
    except Exception:
        hyperlinks = []

    # ── 4. LLM analysis ────────────────────────────────────────────────────
    try:
        llm_result = analyze_with_llm(resume_text)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"LLM analysis failed: {e}")

    enhancements = llm_result.get("enhancements", [])

    # ── 5. Build & return response ─────────────────────────────────────────
    return build_response(ats_score, llm_result, sections, hyperlinks, enhancements)
