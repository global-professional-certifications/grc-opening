import os
from typing import List, Optional
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_community.document_loaders import PyPDFLoader, Docx2txtLoader, TextLoader
from langchain_core.prompts import ChatPromptTemplate


load_dotenv()



class Experience(BaseModel, extra="forbid"):
    company: str = Field(description="Name of the company")
    role: str = Field(description="Job title")
    duration: str = Field(description="Dates worked, e.g., Jan 2020 - Present")
    description: List[str] = Field(description="Verbatim bullet points of responsibilities")

class Education(BaseModel, extra="forbid"):
    school: str = Field(description="Name of the university or school")
    degree: str = Field(description="Degree obtained")
    year: str = Field(description="Year of graduation")

class Project(BaseModel, extra="forbid"):
    title: str = Field(description="Title of the project")
    description: str = Field(description="Exhaustive description of the project")

class ResumeSchema(BaseModel, extra="forbid"):
    full_name: str = Field(description="Candidate's full name")
    email: str = Field(description="Email address")
    phone: str = Field(description="Phone number")
    linkedin: Optional[str] = Field(None, description="LinkedIn URL")
    summary: str = Field(description="Professional summary or profile")
    skills: List[str] = Field(description="List of all technical and soft skills")
    experience: List[Experience] = Field(description="List of every work experience entry")
    education: List[Education] = Field(description="List of all educational qualifications")
    projects: List[Project] = Field(description="List of all projects mentioned")

# --- 2. The Multi-Format Parser Logic ---
def parse_resume(file_path: str):
    # Determine the file extension
    ext = file_path.lower().split('.')[-1]
    
    # Select the appropriate loader
    if ext == "pdf":
        loader = PyPDFLoader(file_path)
    elif ext == "docx":
        loader = Docx2txtLoader(file_path)
    elif ext == "txt":
        loader = TextLoader(file_path)
    else:
        raise ValueError(f"Unsupported file extension: .{ext}")

    pages = loader.load()
    full_text = " ".join([p.page_content for p in pages])

    
    api_key = os.getenv("OPENROUTER_API_KEY")
    model_name = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")

    if not api_key:
        raise ValueError("OPENROUTER_API_KEY is missing from the .env file")

    
    llm = ChatOpenAI(
        model=model_name,
        openai_api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
        temperature=0,
        default_headers={
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "Resume Parser App"
        }
    )
    
    # Using method="json_schema" is the safest way to ensure the AI follows the Pydantic model
    structured_llm = llm.with_structured_output(ResumeSchema, method="json_schema")

    
    prompt = ChatPromptTemplate.from_template(
        """
        You are a professional Data Extraction Engine. Your task is to perform an 
        exhaustive and verbatim extraction of all professional information from the text.

        INSTRUCTIONS:
        1. EXTRACT ALL DETAILS: For every section (Experience, Education, Projects), 
           capture every single sub-detail and bullet point. Do not summarize or skip content.
        2. STRUCTURE: Map the text headlines to the provided JSON schema accurately.
        3. GRANULARITY: In the 'description' fields, maintain the original detail. 
           Every bullet point in the resume should be a separate string in the description list.
        4. VERBATIM: Use the exact wording from the resume where possible.

        Resume Text:
        {text}
        """
    )

    # Run the chain
    chain = prompt | structured_llm
    return chain.invoke({"text": full_text})