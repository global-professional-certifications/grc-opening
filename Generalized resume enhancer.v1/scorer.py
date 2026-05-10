from models import (
    CategoryResult, CategoryIssue, IssueLevel,
    SectionResult, HyperlinkResult, ResumeAnalysisResponse
)
from typing import List


def _issue_level(issue_count: int) -> IssueLevel:
    if issue_count == 0:   return IssueLevel.NO_ISSUES
    if issue_count <= 2:   return IssueLevel.WARNING
    return IssueLevel.ERROR


def _build_category(name: str, data: dict) -> CategoryResult:
    issues = [
        CategoryIssue(
            message=i.get("message", ""),
            original_text=i.get("original_text"),
            corrected_text=i.get("corrected_text"),
            suggestion=i.get("suggestion", ""),
        )
        for i in data.get("issues", [])
    ]
    score       = max(0, min(100, int(data.get("score", 50))))
    issue_count = len(issues)
    return CategoryResult(
        name=name,
        score=score,
        issue_count=issue_count,
        level=_issue_level(issue_count),
        issues=issues,
        passed=issue_count == 0,
    )


def build_response(
    ats_score:    int,
    llm_result:   dict,
    sections:     list[dict],
    hyperlinks:   List[HyperlinkResult],
    enhancements: list[str],
) -> ResumeAnalysisResponse:

    # ATS parse rate — local heuristic, not LLM
    ats_issues = [] if ats_score >= 90 else [
        CategoryIssue(
            message="Resume may not be fully ATS-readable",
            original_text=None,
            corrected_text=None,
            suggestion="Use a plain single-column layout; avoid tables, text boxes, or images",
        )
    ]
    ats_category = CategoryResult(
        name="ATS Parse Rate",
        score=ats_score,
        issue_count=len(ats_issues),
        level=IssueLevel.NO_ISSUES if ats_score >= 90 else IssueLevel.WARNING,
        issues=ats_issues,
        passed=ats_score >= 90,
    )

    qi  = _build_category("Quantifying Impact", llm_result.get("quantifying_impact", {}))
    rep = _build_category("Repetition",         llm_result.get("repetition",         {}))
    sg  = _build_category("Spelling & Grammar", llm_result.get("spelling_grammar",   {}))
    fmt = _build_category("Format",             llm_result.get("format",             {}))
    sty = _build_category("Style",              llm_result.get("style",              {}))

    all_categories = [ats_category, qi, rep, sg, fmt, sty]
    total_issues   = sum(c.issue_count for c in all_categories)

    # Add broken links to issue count
    broken_links = [h for h in hyperlinks if h.status.value != "ok"]
    total_issues += len(broken_links)

    # Weighted score: ATS 20%, LLM dimensions 16% each
    weights = [0.20, 0.16, 0.16, 0.16, 0.16, 0.16]
    scores  = [c.score for c in all_categories]
    overall = int(sum(w * s for w, s in zip(weights, scores)))

    return ResumeAnalysisResponse(
        overall_score=overall,
        total_issues=total_issues,
        ats_parse_rate=ats_category,
        quantifying_impact=qi,
        repetition=rep,
        spelling_grammar=sg,
        format=fmt,
        style=sty,
        sections_found=[SectionResult(name=s["name"], present=s["present"]) for s in sections],
        hyperlinks=hyperlinks,
        enhancements=enhancements,
    )