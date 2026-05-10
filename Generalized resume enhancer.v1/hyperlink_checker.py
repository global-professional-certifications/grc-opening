"""
Extract all URLs from a resume (text regex + PDF annotations + DOCX relationships)
then async-check each one with an HTTP HEAD request.
"""
import re
import io
import asyncio
from typing import List
from models import HyperlinkResult, HyperlinkStatus

# Regex that catches http(s) and bare www. URLs
URL_RE = re.compile(
    r"https?://[^\s\]\[\"'<>)]+|www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}[^\s\]\[\"'<>)]*"
)

TIMEOUT_SECONDS = 6
HEADERS = {"User-Agent": "Mozilla/5.0 (ResumeAnalyzer/1.0)"}


# ── Extraction ──────────────────────────────────────────────────────────────

def extract_urls_from_text(text: str) -> List[dict]:
    urls = []
    for m in URL_RE.finditer(text):
        raw = m.group().rstrip(".,;)")
        url = raw if raw.startswith("http") else f"https://{raw}"
        urls.append({"url": url, "source": "text"})
    return urls


def extract_urls_from_pdf(file_bytes: bytes) -> List[dict]:
    """Pull hyperlinks from PDF annotation objects (not visible in extracted text)."""
    urls = []
    try:
        import pdfplumber
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                for annot in (page.annots or []):
                    uri = annot.get("uri") or annot.get("URI")
                    if uri and isinstance(uri, str) and uri.startswith("http"):
                        urls.append({"url": uri.strip(), "source": "pdf_annotation"})
    except Exception:
        pass
    return urls


def extract_urls_from_docx(file_bytes: bytes) -> List[dict]:
    """Pull hyperlinks from DOCX relationship table (the <a href> equivalent)."""
    urls = []
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        for rel in doc.part.rels.values():
            if "hyperlink" in rel.reltype:
                url = rel._target
                if isinstance(url, str) and url.startswith("http"):
                    urls.append({"url": url.strip(), "source": "docx_hyperlink"})
    except Exception:
        pass
    return urls


def collect_all_urls(text: str, file_bytes: bytes, filename: str) -> List[dict]:
    """Merge and deduplicate URLs from all sources."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    seen, result = set(), []

    sources = extract_urls_from_text(text)
    if ext == "pdf":
        sources += extract_urls_from_pdf(file_bytes)
    elif ext == "docx":
        sources += extract_urls_from_docx(file_bytes)

    for item in sources:
        if item["url"] not in seen:
            seen.add(item["url"])
            result.append(item)
    return result


# ── Async HTTP checking ─────────────────────────────────────────────────────

async def _check_one(session, item: dict) -> HyperlinkResult:
    import httpx
    url    = item["url"]
    source = item["source"]
    try:
        async with session as client:
            r = await client.head(url, follow_redirects=True, timeout=TIMEOUT_SECONDS,
                                  headers=HEADERS)
            if r.status_code < 400:
                return HyperlinkResult(url=url, status=HyperlinkStatus.OK,
                                       status_code=r.status_code, source=source)
            else:
                return HyperlinkResult(url=url, status=HyperlinkStatus.BROKEN,
                                       status_code=r.status_code, source=source)
    except Exception:
        return HyperlinkResult(url=url, status=HyperlinkStatus.BROKEN, source=source)


async def _check_all_async(items: List[dict]) -> List[HyperlinkResult]:
    import httpx
    async with httpx.AsyncClient(headers=HEADERS, follow_redirects=True,
                                  timeout=TIMEOUT_SECONDS) as client:
        tasks = []
        for item in items:
            tasks.append(_check_single(client, item))
        return await asyncio.gather(*tasks)


async def _check_single(client, item: dict) -> HyperlinkResult:
    import httpx
    url    = item["url"]
    source = item["source"]
    try:
        r = await client.head(url, timeout=TIMEOUT_SECONDS)
        ok = r.status_code < 400
        return HyperlinkResult(
            url=url,
            status=HyperlinkStatus.OK if ok else HyperlinkStatus.BROKEN,
            status_code=r.status_code,
            source=source,
        )
    except httpx.TimeoutException:
        return HyperlinkResult(url=url, status=HyperlinkStatus.TIMEOUT, source=source)
    except Exception:
        return HyperlinkResult(url=url, status=HyperlinkStatus.BROKEN, source=source)


def check_hyperlinks(text: str, file_bytes: bytes, filename: str) -> List[HyperlinkResult]:
    """Public sync wrapper — collects URLs then checks them concurrently."""
    items = collect_all_urls(text, file_bytes, filename)
    if not items:
        return []
    return asyncio.run(_check_all_async(items))