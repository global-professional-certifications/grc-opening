import os
import fitz  # PyMuPDF
import io
import logging
from typing import List, Optional
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()

# Set up logging for easier debugging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────
# 1.  SCHEMAS  (strict but complete)
# ─────────────────────────────────────────────

class Experience(BaseModel):
    organization: str = Field(description="Name of the company or audit firm")
    designation: str = Field(description="Official job title / role (e.g. 'Assistant Manager – Risk Advisory')")
    duration: str = Field(description="Employment period, e.g. 'Jan 2022 – Present'")
    work_location: Optional[str] = Field(None, description="City / State where this job was located")
    responsibilities: List[str] = Field(
        description="Bullet-point list of audit / GRC tasks exactly as written in the resume"
    )


class Certification(BaseModel):
    name: str = Field(description="Certification acronym or full name, e.g. CISA, CIA, CRMA")
    issuing_body: str = Field(
        description="Organisation that granted the cert, e.g. ISACA, IIA, AICPA. "
                    "If unknown write 'Unknown'."
    )


class Education(BaseModel):
    school: str = Field(
        description="Name of the UNIVERSITY or SCHOOL only. "
                    "Do NOT put hackathons, bootcamps, or online courses here."
    )
    degree: str = Field(
        description="Formal degree obtained, e.g. 'B.Tech in Computer Science', 'MBA'. "
                    "Do NOT put hackathon names or certifications here."
    )
    year: str = Field(description="Graduation year or expected year, e.g. '2024' or 'May 2025'")
    location: Optional[str] = Field(None, description="City / State of the institution")


class ResumeSchema(BaseModel):
    full_name: str = Field(description="Candidate's full legal name")

    current_designation: Optional[str] = Field(
        None,
        description="Professional title found just below the name in the header section. "
                    "If the candidate is a student, use their degree level, e.g. "
                    "'B.Tech Student – Computer Science'. Never leave this null if any title exists."
    )

    location: Optional[str] = Field(
        None, description="Candidate's current residential City and State / Country"
    )

    email: str = Field(description="Candidate's primary email address")
    phone: str = Field(description="Candidate's phone number including country code if present")

    linkedin: Optional[str] = Field(
        None,
        description="Full LinkedIn profile URL. "
                    "First check the '--- EXTRACTED METADATA LINKS ---' section for a linkedin.com URL. "
                    "If not found there, search the resume text. Return the full URL or null."
    )

    summary: str = Field(
        description="A concise professional summary (max 300 characters) derived from the resume's "
                    "own summary or objective section. If the resume has no explicit summary, "
                    "generate one from the candidate's experience and skills. NEVER leave this blank."
    )

    certifications: List[Certification] = Field(
        description="List of formal professional certifications ONLY (e.g. CISA, CIA, CPA, PMP). "
                    "Do NOT include online courses, hackathon wins, or academic degrees here."
    )

    frameworks: List[str] = Field(
        description="Compliance / security frameworks and methodologies mentioned "
                    "(e.g. ISO 27001, NIST, GDPR, SOC 2, COBIT, IFC, COSO). "
                    "Also include technical tools / software (e.g. ACL, IDEA, SAP, Power BI, Python, Excel)."
    )

    skills: List[str] = Field(
        description="Technical and soft skills listed explicitly in the resume's Skills section "
                    "or mentioned throughout (e.g. 'Risk Assessment', 'Data Analysis', "
                    "'Internal Audit', 'SQL', 'Tableau'). Deduplicate with frameworks."
    )

    experience: List[Experience] = Field(
        description="ONLY paid professional work experience — full-time, part-time, or internships. "
                    "Do NOT include hackathons, academic projects, or certifications here."
    )

    education: List[Education] = Field(
        description="ONLY formal academic degrees from universities or colleges. "
                    "Hackathons, coding bootcamps, online courses, and certifications must NOT appear here."
    )


# ─────────────────────────────────────────────
# 2.  TEXT EXTRACTION
# ─────────────────────────────────────────────

def _extract_text_and_links(file_content: bytes, ext: str) -> str:
    """Extract all text and hyperlinks from the resume file."""
    full_text = ""
    metadata_links: List[str] = []

    if ext == "pdf":
        doc = fitz.open(stream=file_content, filetype="pdf")
        for page in doc:
            full_text += page.get_text()
            for link in page.get_links():
                if "uri" in link:
                    metadata_links.append(link["uri"])
        doc.close()

    elif ext == "docx":
        from docx import Document  # type: ignore
        doc = Document(io.BytesIO(file_content))
        paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
        full_text = "\n".join(paragraphs)

        # Also extract hyperlinks from docx relationships
        for rel in doc.part.rels.values():
            if "hyperlink" in rel.reltype:
                metadata_links.append(rel._target)

    else:
        # Plain text fallback
        full_text = file_content.decode("utf-8", errors="replace")

    # Append extracted links so the LLM can see them
    if metadata_links:
        unique_links = list(dict.fromkeys(metadata_links))  # preserve order, deduplicate
        full_text += "\n\n--- EXTRACTED METADATA LINKS ---\n" + "\n".join(unique_links)
        logger.info(f"Extracted {len(unique_links)} hyperlinks from document")

    logger.info(f"Total extracted text length: {len(full_text)} characters")
    return full_text


# ─────────────────────────────────────────────
# 3.  PROMPT
# ─────────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert resume data extraction engine specialising in GRC (Governance, Risk & Compliance) professionals.

Your job is to extract EXACTLY the data present in the resume. Follow these rules strictly:

### PERSONAL INFORMATION
- Extract the full name from the very top of the resume.
- Extract location (City, State/Country) from the header or contact block.
- Extract email and phone verbatim.
- For LinkedIn: check the "--- EXTRACTED METADATA LINKS ---" block first for a linkedin.com URL. If not there, scan the resume text. Return the complete URL.

### CURRENT DESIGNATION
- Look for a professional title immediately below the candidate's name.
- If none, use the most recent job title from experience.
- If a student, use their current degree, e.g. "B.Tech Student – IT".
- NEVER return null if any title or degree is present.

### SUMMARY
- Use the resume's own summary / objective section verbatim (truncate to 300 chars if needed).
- If no summary section exists, write a 2-sentence summary from their experience and skills.
- NEVER return an empty string.

### CERTIFICATIONS
- Include ONLY formal professional credentials: CISA, CIA, CPA, CRMA, PMP, etc.
- Hackathon participations and online course completions are NOT certifications.

### EXPERIENCE
- List ONLY paid employment: full-time, part-time, internships.
- Each entry needs: organisation, designation, duration, location (if mentioned), responsibilities.
- DO NOT list hackathons, personal projects, or academic courses as experience.

### EDUCATION
- List ONLY formal academic degrees from universities/colleges.
- Hackathons, bootcamps, certifications, and online courses are STRICTLY FORBIDDEN here.

### SKILLS & FRAMEWORKS
- skills: specific competencies (e.g. Internal Audit, Risk Assessment, Data Analysis, SQL).
- frameworks: standards, tools, and software (e.g. ISO 27001, NIST, SAP, Power BI, Python).
- It is acceptable for some items to appear in both if truly relevant to both categories.

### DEDUPLICATION
- An item must appear in exactly ONE section.
- ISO 27001 → frameworks only. CISA → certifications only. "B.Tech" → education only.
"""

EXTRACTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    ("human", "Please extract all resume data from the following resume text:\n\n{text}")
])


# ─────────────────────────────────────────────
# 4.  MAIN PARSE FUNCTION
# ─────────────────────────────────────────────

def parse_resume(file_content: bytes, filename: str) -> dict:
    ext = filename.lower().rsplit(".", 1)[-1]
    full_text = _extract_text_and_links(file_content, ext)

    if not full_text.strip():
        raise ValueError("No text could be extracted from the uploaded file.")

    # ── LLM setup ──
    llm = ChatOpenAI(
        model=os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
        openai_api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1",
        temperature=0,
        # Increase timeout for large resumes
        request_timeout=60,
    )

    
    structured_llm = llm.with_structured_output(ResumeSchema, method="function_calling")

    chain = EXTRACTION_PROMPT | structured_llm

    logger.info(f"Sending resume '{filename}' to LLM for extraction…")
    result: ResumeSchema = chain.invoke({"text": full_text})
    logger.info("Extraction complete.")

    # Post-processing guard: ensure summary is never blank
    result_dict = result.model_dump()
    if not result_dict.get("summary"):
        name = result_dict.get("full_name", "The candidate")
        desig = result_dict.get("current_designation", "a professional")
        result_dict["summary"] = f"{name} is {desig} with experience in GRC and related domains."

    return result_dict
