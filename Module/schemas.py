from typing import Dict, List, Optional, Union
from enum import Enum
from pydantic import BaseModel, field_validator


class TemplateStyle(str, Enum):
    CLASSIC    = "classic"
    MODERN     = "modern"
    CREATIVE   = "creative"
    MINIMALIST = "minimalist"
    EXECUTIVE  = "executive"


class ContactInfo(BaseModel):
    name: str = ""
    email: str = ""
    phone: str = ""
    location: str = ""
    linkedin: str = ""
    github: str = ""
    website: str = ""

    @field_validator("*", mode="before")
    @classmethod
    def clean_strings(cls, v):
        if v is None:
            return ""
        return str(v).strip()


class ExperienceItem(BaseModel):
    company: str
    title: str
    dates: str = ""
    location: str = ""
    bullets: List[str] = []

    @field_validator("company", "title")
    @classmethod
    def required_fields(cls, v):
        if not v or not str(v).strip():
            raise ValueError("Company and title are required")
        return str(v).strip()

    @field_validator("bullets", mode="before")
    @classmethod
    def ensure_bullets_list(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            return [v.strip()] if v.strip() else []
        if isinstance(v, list):
            return [str(b).strip() for b in v if b and str(b).strip()]
        return []


class EducationItem(BaseModel):
    institution: str
    degree: str
    dates: str = ""
    details: str = ""

    @field_validator("institution", "degree")
    @classmethod
    def required_fields(cls, v):
        if not v or not str(v).strip():
            raise ValueError("Institution and degree are required")
        return str(v).strip()


class EnhancedResume(BaseModel):
    """
    The fully enhanced resume with support for:
    - PDF, DOCX, DOC, TXT files
    - Skills as flat list OR grouped dictionary
    - All fields have fallback validators
    """
    style: TemplateStyle = TemplateStyle.MODERN
    contact: ContactInfo = ContactInfo()
    summary: str = ""
    
    # Accepts flat list ["Python", "SOX"] OR grouped dict {"grc": [...], "tools": [...]}
    skills: Union[List[str], Dict[str, List[str]]] = []
    
    experience: List[ExperienceItem] = []
    education: List[EducationItem] = []
    certifications: List[str] = []
    keywords_woven_in: List[str] = []
    keywords_added: List[str] = []
    enhancement_notes: str = ""
    sections_modified: List[str] = []
    sections_untouched: List[str] = []

    @field_validator("skills", mode="before")
    @classmethod
    def normalize_skills(cls, v):
        """Handle both flat list and grouped dictionary."""
        if v is None:
            return []
        
        # If dictionary, flatten it
        if isinstance(v, dict):
            flat = []
            for key, value in v.items():
                if isinstance(value, list):
                    flat.extend([str(item).strip() for item in value if item and str(item).strip()])
                elif value:
                    flat.append(str(value).strip())
            return flat
        
        # If list, clean it
        if isinstance(v, list):
            return [str(s).strip() for s in v if s and str(s).strip()]
        
        # If string, make it a list
        if isinstance(v, str):
            return [v.strip()] if v.strip() else []
        
        return []

    @field_validator("certifications", "keywords_woven_in", "keywords_added", 
                     "sections_modified", "sections_untouched", mode="before")
    @classmethod
    def ensure_list_fields(cls, v):
        """Ensure these fields are always lists."""
        if v is None:
            return []
        if isinstance(v, str):
            return [v.strip()] if v.strip() else []
        if isinstance(v, list):
            return [str(item).strip() for item in v if item and str(item).strip()]
        return []

    @field_validator("contact", mode="before")
    @classmethod
    def ensure_contact(cls, v):
        """Ensure contact is always ContactInfo."""
        if v is None:
            return ContactInfo()
        if isinstance(v, dict):
            return ContactInfo(**v)
        return v

    @field_validator("experience", mode="before")
    @classmethod
    def ensure_experience_list(cls, v):
        """Ensure experience is a valid list."""
        if v is None:
            return []
        if not isinstance(v, list):
            return []
        result = []
        for item in v:
            try:
                if isinstance(item, dict):
                    result.append(ExperienceItem(**item))
                else:
                    result.append(item)
            except Exception:
                continue
        return result

    @field_validator("education", mode="before")
    @classmethod
    def ensure_education_list(cls, v):
        """Ensure education is a valid list."""
        if v is None:
            return []
        if not isinstance(v, list):
            return []
        result = []
        for item in v:
            try:
                if isinstance(item, dict):
                    result.append(EducationItem(**item))
                else:
                    result.append(item)
            except Exception:
                continue
        return result

    def get_flat_skills(self) -> List[str]:
        """Always return skills as a flat list."""
        if isinstance(self.skills, list):
            return self.skills
        if isinstance(self.skills, dict):
            flat = []
            for key, value in self.skills.items():
                if isinstance(value, list):
                    flat.extend([str(item).strip() for item in value if item])
                elif value:
                    flat.append(str(value).strip())
            return flat
        return []