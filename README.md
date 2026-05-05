# Resume Analyzer Service

A drop-in FastAPI module for the GRC Openings platform.
No separate database, no message queue, no Redis — just copy the folder in.

## Integration (2 lines)

In your main platform's `main.py` (or wherever you define your FastAPI app):

```python
from resume_analyzer_service.router import router as resume_analyzer_router

app.include_router(
    resume_analyzer_router,
    prefix="/api/resume-analyzer",
    tags=["Resume Analyzer"],
    # If your platform uses JWT auth, add your dependency here:
    # dependencies=[Depends(get_current_user)],
)
```

Set the environment variable:
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

That's it. The service is live at `/api/resume-analyzer`.

---

## Endpoints

| Method | Path | What it does |
|--------|------|------|
| `POST` | `/api/resume-analyzer/analyze` | Score resume vs JD |
| `POST` | `/api/resume-analyzer/generate` | Rewrite resume for JD |

| `GET`  | `/api/resume-analyzer/preview/{style}` | HTML preview for template carousel |

All `POST` endpoints accept `multipart/form-data`:
- `resume` — PDF file, max 5 MB
- `job_description` — plain text, min 50 chars
- `style` — (generate only) `classic` / `modern` / `creative` / `minimalist` / `executive`

---

## Example: curl

```bash
# Analyse
curl -X POST http://localhost:8000/api/resume-analyzer/analyze \
  -H "Authorization: Bearer <your_jwt>" \
  -F "resume=@/path/to/resume.pdf" \
  -F "job_description=We are looking for a Senior Internal Auditor..."

# Generate optimised resume (JSON)
curl -X POST http://localhost:8000/api/resume-analyzer/generate \
  -F "resume=@/path/to/resume.pdf" \
  -F "job_description=..." \
  -F "style=modern"

# Download PDF
curl -X POST http://localhost:8000/api/resume-analyzer/generate/pdf \
  -F "resume=@/path/to/resume.pdf" \
  -F "job_description=..." \
  -F "style=executive" \
  -o resume_optimised.pdf
```

---

## Sample Response — `/analyze`

```json
{
  "overall_score": 78.5,
  "ats_score": 82.0,
  "skills_score": 75.0,
  "matched_skills": [
    {"skill": "Internal Audit", "matched": true, "confidence": 0.95},
    {"skill": "SOX Compliance", "matched": true, "confidence": 0.88}
  ],
  "missing_skills": ["ISO 27001", "CISA"],
  "bonus_skills": ["Python", "Power BI"],
  "section_feedback": [
    {
      "section": "experience",
      "score": 80.0,
      "strengths": ["Quantified achievements"],
      "weaknesses": ["No audit software mentioned"],
      "suggestions": ["Add ACL/TeamMate experience"]
    }
  ],
  "summary": "Strong GRC professional. Matches 70% of required skills.",
  "recommendations": [
    "Add ISO 27001 to skills section",
    "Quantify audit findings with numbers"
  ]
}
```

---

## Install

```bash
# Minimum (just analysis + JSON generate)
pip install anthropic pypdf fastapi pydantic structlog

# + PDF export
pip install weasyprint   # also needs: apt install libpango-1.0-0

# + Better PDF parsing for complex layouts
pip install "unstructured[pdf]"
```

## Tests

```bash
pip install pytest pytest-asyncio httpx
pytest resume_analyzer_service/tests.py -v
```

---

## Architecture

```
resume_analyzer_service/
├── __init__.py      ← Package marker + usage comment
├── schemas.py       ← Pydantic request/response models
├── prompts.py       ← Versioned Claude prompt templates
├── service.py       ← Core logic: PDF parse → Claude → validate → return
├── router.py        ← FastAPI routes (mount into your app)
├── tests.py         ← Unit + integration tests
└── requirements.txt ← Minimal deps
```

**How a request flows:**

```
POST /analyze
  │
  ├─ Validate: PDF magic bytes + MIME + size ≤ 5MB
  ├─ Extract text: pypdf (thread pool, non-blocking)
  ├─ Sanitize: strip control chars, truncate to 12k chars
  ├─ Cache check: SHA-256(resume[:500] + jd[:500]) → in-memory LRU
  │     └─ Hit → return instantly, no Claude call
  ├─ Claude Sonnet: structured JSON response
  ├─ Validate output: clamp scores 0–100, fill missing fields
  └─ Return AnalysisResult
```

**Caching:** Same resume + same JD → LRU cache hit, no API call. 256-slot
in-memory cache (per process). For multi-instance deploys, swap the dict
for Redis with the same interface — the service code doesn't need to change.

**Scalability:** The service is stateless. Add more uvicorn workers or
replicas and it scales horizontally. The `ThreadPoolExecutor` keeps PDF
parsing off the async event loop so it never blocks other requests.
