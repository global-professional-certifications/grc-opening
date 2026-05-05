

import os
from functools import lru_cache

import structlog
from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from fastapi.responses import HTMLResponse

from .schemas import EnhancedResume, TemplateStyle
from .service import ACCEPTED_MIME, IMAGE_MIME, ResumeEnhancerService

router = APIRouter()
logger = structlog.get_logger(__name__)

MAX_SIZE_BYTES = 5 * 1024 * 1024   # 5 MB per FRD RA-01

# All accepted + image MIME types so we can give a specific error for images
ALL_KNOWN_MIME = ACCEPTED_MIME | IMAGE_MIME


# ── Service dependency ─────────────────────────────────────────────────────────

@lru_cache(maxsize=1)
def _get_service() -> ResumeEnhancerService:
    api_key = os.environ.get("OPENROUTER_API_KEY", "")
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY environment variable is not set.")
    model = os.environ.get("OPENROUTER_MODEL", "anthropic/claude-sonnet-4-5")
    return ResumeEnhancerService(api_key=api_key, model=model)


def get_service() -> ResumeEnhancerService:
    return _get_service()


# ── File validation ────────────────────────────────────────────────────────────

async def _validate_upload(file: UploadFile) -> bytes:
    
    ct = file.content_type or ""

    # Specific, helpful error for image uploads
    if ct in IMAGE_MIME:
        raise HTTPException(
            status_code=415,
            detail=(
                "You uploaded an image file. Images cannot be parsed as resumes. "
                "Please upload your resume as a PDF, DOCX, or TXT file. "
                
            ),
        )

    if ct not in ACCEPTED_MIME:
        raise HTTPException(
            status_code=415,
            detail=(
                f"File type '{ct}' is not supported. "
                "Please upload your resume as PDF, DOCX, DOC, or TXT."
            ),
        )

    content = await file.read()

    if len(content) > MAX_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"File is too large ({len(content)/1024/1024:.1f} MB). Maximum is 5 MB.",
        )

    # Magic-byte check for PDFs
    if ct == "application/pdf" and not content.startswith(b"%PDF"):
        raise HTTPException(
            status_code=422,
            detail=(
                "The file doesn't look like a valid PDF. "
                "Please re-export your resume from Word or Google Docs."
            ),
        )

    return content




# ── Cleaned up Routes ──────────────────────────────────────────────────────────

@router.post(
    "/enhance",
    response_model=EnhancedResume,
    summary="Enhance resume for a specific job",
    description=(
        "Upload your resume and paste the job description. "
        "Receive your resume rewritten as structured JSON."
    ),
)
async def enhance_resume(
    resume: UploadFile = File(...),
    job_description: str = Form(..., min_length=50),
    style: TemplateStyle = Form(TemplateStyle.MODERN),
    service: ResumeEnhancerService = Depends(get_service),
):
    content = await _validate_upload(resume)
    try:
        # This now returns your clean, structured JSON model
        return await service.enhance(
            file_bytes=content,
            filename=resume.filename or "resume",
            content_type=resume.content_type or "application/pdf",
            job_description=job_description,
            style=style,
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except RuntimeError as e:
        logger.error("enhance_failed", error=str(e))
        raise HTTPException(status_code=503, detail=str(e))

