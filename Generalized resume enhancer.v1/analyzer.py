import json
import re
import os
from openai import OpenAI

client = OpenAI(
    api_key=os.environ.get("OPENROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1",
)

MODEL = os.environ.get("OPENROUTER_MODEL", "openai/gpt-4o-mini")

# ---------------------------------------------------------------------------
# Prompt — forces the LLM to quote exact text and provide exact corrections
# ---------------------------------------------------------------------------
ANALYSIS_PROMPT = """
You are a strict ATS resume expert. Your job is to find REAL, SPECIFIC issues in the resume below.

CRITICAL RULES:
- NEVER give generic feedback. Every issue MUST quote the EXACT sentence or phrase from the resume.
- For every issue provide the exact corrected replacement text.
- Do NOT invent issues that don't exist. If a dimension is clean, give it a high score and empty issues.
- Be precise: cite the actual words, numbers, bullet points that are problematic.

Evaluate across these 5 dimensions:

1. quantifying_impact
   - Find bullet points / sentences that describe an achievement but use NO numbers.
   - Example bad:  "Improved API performance significantly"
   - Example good: "Improved API response time by 40%, reducing p99 latency from 800ms to 480ms"

2. repetition
   - Find repeated action verbs, repeated phrases, or structurally identical bullets.
   - List each repeated word/phrase and how many times it appears.

3. spelling_grammar
   - Find every spelling mistake, grammar error, wrong capitalisation, or broken punctuation.
   - Quote the bad text and the corrected version exactly.

4. format
   - Check section order, date consistency (e.g. "Jan 2022" vs "01/2022"), missing sections,
     inconsistent bullet styles (•, -, *, mixed), overly long paragraphs.

5. style
   - Find weak/passive phrases ("responsible for", "worked on", "helped with", "assisted in").
   - Find clichés ("team player", "go-getter", "hard worker", "passionate about").
   - Quote the weak phrase and give a strong action-verb replacement.

Return ONLY valid JSON — no markdown fences, no explanation outside JSON.

Schema:
{
  "quantifying_impact": {
    "score": <0-100>,
    "issues": [
      {
        "message": "<one-line description of the problem>",
        "original_text": "<exact quoted text from the resume>",
        "corrected_text": "<the improved replacement text>",
        "suggestion": "<brief instruction on how to fix>"
      }
    ]
  },
  "repetition": {
    "score": <0-100>,
    "issues": [
      {
        "message": "<e.g. 'developed' used 4 times>",
        "original_text": "<list all occurrences, comma-separated>",
        "corrected_text": "<suggested alternatives, e.g. Built / Engineered / Implemented / Deployed>",
        "suggestion": "<brief instruction>"
      }
    ]
  },
  "spelling_grammar": {
    "score": <0-100>,
    "issues": [
      {
        "message": "<description>",
        "original_text": "<exact bad text>",
        "corrected_text": "<corrected text>",
        "suggestion": "<brief instruction>"
      }
    ]
  },
  "format": {
    "score": <0-100>,
    "issues": [
      {
        "message": "<description>",
        "original_text": "<exact bad text or section name>",
        "corrected_text": "<how it should look>",
        "suggestion": "<brief instruction>"
      }
    ]
  },
  "style": {
    "score": <0-100>,
    "issues": [
      {
        "message": "<description>",
        "original_text": "<exact weak phrase>",
        "corrected_text": "<strong replacement>",
        "suggestion": "<brief instruction>"
      }
    ]
  },
  "enhancements": [
    "<specific, actionable tip referencing actual content in the resume>",
    "<tip 2>",
    "<tip 3>"
  ]
}

Scoring guide: 90-100 = excellent (0 issues), 75-89 = good (1-2 minor issues),
50-74 = needs work (3-4 issues), below 50 = poor (5+ issues).

Resume text:
"""


def analyze_with_llm(resume_text: str) -> dict:
    """Send resume text to OpenRouter and receive a detailed structured analysis."""
    truncated = resume_text[:6000]
    prompt = ANALYSIS_PROMPT + f'"""\n{truncated}\n"""'

    response = client.chat.completions.create(
        model=MODEL,
        max_tokens=2500,        # higher cap for detailed per-issue corrections
        temperature=0.1,        # low temperature = more deterministic, less hallucination
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.choices[0].message.content.strip()

    # Strip accidental markdown fences
    raw = re.sub(r"^```json\s*", "", raw)
    raw = re.sub(r"^```\s*",     "", raw)
    raw = re.sub(r"```$",        "", raw).strip()

    return json.loads(raw)