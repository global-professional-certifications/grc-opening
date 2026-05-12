import os
import fitz  # PyMuPDF
from typing import List, Optional
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()



class Experience(BaseModel, extra="forbid"):
    organization: str = Field(description="Name of the audit firm or company")
    designation: str = Field(description="Official role title (e.g., Assistant Manager - Risk)")
    duration: str = Field(description="Tenure dates")
    work_location: Optional[str] = Field(None, description="City/State where this job was located")
    responsibilities: List[str] = Field(description="Verbatim, concise list of audit/GRC tasks")

class Certification(BaseModel, extra="forbid"):
    name: str = Field(description="Certification acronym like CISA, CIA, or CRMA")
    issuing_body: str = Field(description="The organization that granted the cert (ISACA, IIA, etc.)")

class Education(BaseModel, extra="forbid"):
    school: str = Field(description="Name of the university or school")
    degree: str = Field(description="Degree obtained")
    year: str = Field(description="Year of graduation or expected graduation")
    location: Optional[str] = Field(None, description="City/State of the institution")

class ResumeSchema(BaseModel, extra="forbid"):
    full_name: str = Field(description="Candidate's full name")
    current_designation: Optional[str] = Field(None, description="The professional title found in the header")
    location: Optional[str] = Field(None, description="Candidate's current residential City and State")
    email: str
    phone: str
    linkedin: Optional[str] = Field(None, description="Full LinkedIn URL (extracted from text or metadata links)")
    summary: str = Field(description="GRC profile summary (strictly max 300 characters)")
    certifications: List[Certification] = Field(description="List of formal professional credentials")
    frameworks: List[str] = Field(description="Compliance standards like ISO 27001, NIST, GDPR, SOC2")
    experience: List[Experience]
    education: List[Education] = Field(description="Academic history including school, degree, and year")



def parse_resume(file_content: bytes, filename: str):
    ext = filename.lower().split('.')[-1]
    full_text = ""
    metadata_links = []

    if ext == "pdf":
        doc = fitz.open(stream=file_content, filetype="pdf")
        for page in doc:
            full_text += page.get_text()
            for link in page.get_links():
                if "uri" in link:
                    metadata_links.append(link["uri"])
        doc.close()
    elif ext == "docx":
        import io
        from docx import Document  # type: ignore
        doc_stream = io.BytesIO(file_content)
        doc = Document(doc_stream)
        full_text = "\n".join([para.text for para in doc.paragraphs])
    else:
        full_text = file_content.decode("utf-8")

    # --- THE FIX FOR HYPERLINKS ---
    # We must append the metadata links to the text so the LLM can "see" them
    if metadata_links:
        unique_links = list(set(metadata_links))
        full_text += "\n\n--- EXTRACTED METADATA LINKS ---\n" + "\n".join(unique_links)
    # -----------------------------

    # --- LLM Setup ---
    llm = ChatOpenAI(
        model=os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini"),
        openai_api_key=os.getenv("OPENROUTER_API_KEY"),
        base_url="https://openrouter.ai/api/v1",
        temperature=0
    )
    
    structured_llm = llm.with_structured_output(ResumeSchema, method="json_schema")

    # --- 3. The "Pure Parsing" GRC Prompt ---
    prompt = ChatPromptTemplate.from_template(
        """
        You are a Specialized GRC Data Extraction Engine. 
    
    INSTRUCTIONS:
    1. CURRENT DESIGNATION: Look for a title immediately under the name in the header. 
       IF NOT FOUND, look at the most recent 'Experience' or current 'Education' degree 
       (e.g., 'B.Tech Student' or 'Information Technology Student') and use that.
    
    2. HEADER EXTRACTION: Identify the Name and Resident Location (City/State).
    
    3. HYPERLINK MAPPING: Look in 'EXTRACTED METADATA LINKS' for a LinkedIn URI. (Done - working!)
    
    4. DEDUPLICATION: Standards like ISO 27001 belong in 'frameworks'. 
       Audit roles belong in 'experience'.
    
    5. NULLS: Only use null if absolutely no title or education level is found.

    Resume Text:
    
        {text}
        """
    )

    chain = prompt | structured_llm
    return chain.invoke({"text": full_text})
