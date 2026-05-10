import io
import re
from pathlib import Path


def extract_text(file_bytes: bytes, filename: str) -> tuple[str, bool]:
    """
    Extract plain text from a resume file.
    Returns (text, is_parseable).
    Supports: PDF, DOCX, TXT
    """
    ext = Path(filename).suffix.lower()

    if ext == ".pdf":
        return _extract_pdf(file_bytes)
    elif ext == ".docx":
        return _extract_docx(file_bytes)
    elif ext == ".txt":
        text = file_bytes.decode("utf-8", errors="ignore")
        return text.strip(), bool(text.strip())
    else:
        raise ValueError(f"Unsupported file type: {ext}. Supported: pdf, docx, txt")


def _extract_pdf(file_bytes: bytes) -> tuple[str, bool]:
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            pages_text = []
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    pages_text.append(t)
            text = "\n".join(pages_text).strip()
            # ATS parse rate: ratio of extractable chars vs file size
            is_parseable = len(text) > 100
            return text, is_parseable
    except Exception as e:
        raise RuntimeError(f"PDF extraction failed: {e}")


def _extract_docx(file_bytes: bytes) -> tuple[str, bool]:
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
        text = "\n".join(paragraphs).strip()
        is_parseable = len(text) > 100
        return text, is_parseable
    except Exception as e:
        raise RuntimeError(f"DOCX extraction failed: {e}")


def compute_ats_parse_rate(text: str, file_bytes: bytes, is_parseable: bool) -> int:
    """
    Score 0–100 based on how well the resume text can be extracted.
    Penalise image-based or heavily formatted resumes.
    """
    if not is_parseable:
        return 10

    char_count = len(text)
    # Rough heuristic: 500+ chars is a decent resume
    if char_count < 200:
        return 30
    if char_count < 500:
        return 60

    # Check for garbled text (high ratio of non-ASCII)
    non_ascii = sum(1 for c in text if ord(c) > 127)
    ratio = non_ascii / max(char_count, 1)
    if ratio > 0.3:
        return 50

    # Check for very short lines (table/column artefacts)
    lines = [l for l in text.split("\n") if l.strip()]
    very_short = sum(1 for l in lines if len(l.strip()) < 5)
    short_ratio = very_short / max(len(lines), 1)
    if short_ratio > 0.5:
        return 65

    return 95


def detect_sections(text: str) -> list[dict]:
    """Return which standard resume sections are present."""
    section_patterns = {
        "Contact Info":    r"(email|phone|linkedin|github|address|\@)",
        "Summary/Objective": r"(summary|objective|profile|about me)",
        "Experience":      r"(experience|work history|employment|career)",
        "Education":       r"(education|degree|university|college|school)",
        "Skills":          r"(skills|technologies|tools|competencies)",
        "Projects":        r"(projects|portfolio|works)",
        "Certifications":  r"(certification|certificate|licence|license|credential)",
        "Achievements":    r"(achievement|award|honor|honour|recognition)",
    }
    lower_text = text.lower()
    results = []
    for name, pattern in section_patterns.items():
        present = bool(re.search(pattern, lower_text))
        results.append({"name": name, "present": present})
    return results
