from pydantic import BaseModel
from typing import List, Optional
from enum import Enum
 
 
class IssueLevel(str, Enum):
    NO_ISSUES = "no_issues"
    WARNING   = "warning"
    ERROR     = "error"
 
 
class CategoryIssue(BaseModel):
    message:       str            # Short description of the problem
    original_text: Optional[str] = None   # Exact quoted text from resume that has the issue
    corrected_text: Optional[str] = None  # What it should be replaced with
    suggestion:    str            # Actionable fix instruction
 
 
class CategoryResult(BaseModel):
    name:        str
    score:       int              # 0–100
    issue_count: int
    level:       IssueLevel
    issues:      List[CategoryIssue]
    passed:      bool
 
 
class SectionResult(BaseModel):
    name:    str
    present: bool
 
 
class HyperlinkStatus(str, Enum):
    OK      = "ok"        # 2xx response
    BROKEN  = "broken"    # 4xx / 5xx / connection error
    TIMEOUT = "timeout"   # no response within threshold
 
 
class HyperlinkResult(BaseModel):
    url:         str
    status:      HyperlinkStatus
    status_code: Optional[int] = None   # HTTP code if we got one
    source:      str = "text"           # "text" | "pdf_annotation" | "docx_hyperlink"
 
 
class ResumeAnalysisResponse(BaseModel):
    overall_score:      int
    total_issues:       int
    ats_parse_rate:     CategoryResult
    quantifying_impact: CategoryResult
    repetition:         CategoryResult
    spelling_grammar:   CategoryResult
    format:             CategoryResult
    style:              CategoryResult
    sections_found:     List[SectionResult]
    hyperlinks:         List[HyperlinkResult]
    enhancements:       List[str]
 