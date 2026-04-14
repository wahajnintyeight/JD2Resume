"""ATS Scanner Service - Analyzes resume compatibility based on modern ATS behavior."""

import logging
from typing import Any
from app.llm import complete_json

logger = logging.getLogger(__name__)


ATS_SCAN_PROMPT = """You are a multi-layer ATS analysis engine that simulates the full candidate screening pipeline used by modern Applicant Tracking Systems (Workday, Greenhouse, Lever, Taleo, iCIMS). Your analysis has TWO phases that must be evaluated separately.

IMPORTANT BEHAVIORAL RULES:
- Do NOT pretend Greenhouse auto-rejects or auto-scores resumes in the same way as a standalone scoring bot; Greenhouse is primarily a searchability + human review system
- Model modern ATS behavior from 2025-2026: parsing quality matters first, semantic/NLP matching exists, but exact matches still outperform semantic equivalents
- Do NOT reward keyword stuffing; repeated filler usage can hurt modern ATS and recruiter outcomes
- Prefer exact title and keyword alignment where reasonable, but treat semantic matches as partial credit rather than total misses
- Keep the analysis practical, prioritized, and honest

RESUME:
{resume_json}

JOB DESCRIPTION:
{job_description}

---

## PHASE 1: PARSING INTEGRITY CHECK
Before any keyword analysis, determine if the resume's content would survive extraction.

Simulate the 4-step parsing pipeline:
1. EXTRACTION: Can the text be converted from PDF/DOCX into clean plain text?
2. SEGMENTATION: Are standard section headers used? (Work Experience, Education, Skills — NOT creative names like "My Journey")
3. FIELD MAPPING: Can Job Title, Company, Start/End Dates, and Descriptions be cleanly mapped to structured fields?
4. RED FLAGS: Identify any elements that would cause silent parsing failures:
   - Contact info in headers/footers (invisible to most parsers)
   - Multi-column layouts (scramble text order in legacy systems)
   - Tables, text boxes, graphics (content gets dropped)
   - Icons/decorative bullets instead of standard • or -
   - Skill rating bars or progress graphics
   - Inconsistent date formats (mix of "Jan '22" and "2022-01")
   - Creative section headers

Parsing integrity is BINARY: PASS or FAIL. If FAIL, no score can exceed 50 regardless of keyword match.

---

## PHASE 2: MATCHING ANALYSIS

### 2A. JOB TITLE ALIGNMENT
ATS systems rank candidates who match job titles higher. Evaluate:
- Does the resume headline/title contain the EXACT job title from the JD?
- Is the target title present in the Summary section?
- Note: Exact match is best, but modern semantic ATS (including Workday / Greenhouse-style matching) may recognize near-equivalents. Flag semantic matches separately from exact matches.

Match levels: EXACT | SEMANTIC | PARTIAL | MISS

### 2B. HARD KEYWORD EXTRACTION & SCORING

Step 1 — Extract JD keywords:
Identify 15–30 hard technical keywords from the JD. Categorize each as:
- TIER 1 (Critical): Appears 2+ times in JD OR is in the job title/requirements header
- TIER 2 (Important): Appears once in responsibilities or qualifications
- TIER 3 (Nice-to-have): Mentioned in "preferred" or "bonus" sections

Step 2 — Match against resume:
For each keyword, classify the resume's treatment:
- EXACT_MATCH: Term appears verbatim in resume
- ACRONYM_MATCH: Resume uses only the abbreviation (e.g., "AWS" but JD says "Amazon Web Services") — flag; include both forms
- SEMANTIC_MATCH: Resume uses a near-synonym — flag as a moderate risk
- MISSING: Not found in any form

Step 3 — Keyword density check:
- Ideal density: 2–3% of total word count
- High-value placements: Summary > Skills Section > First bullet of each role > Body bullets
- Penalize: keywords appearing ONLY in a skills list with no contextual usage in bullets
- Flag: any keyword that appears 4+ times (potential stuffing risk on modern ATS)

### 2C. CONTEXTUAL QUALITY AUDIT
Modern ATS and recruiters score keywords more highly when paired with measurable outcomes. Audit:
- Are Tier 1 keywords used in bullet points that include metrics (%, $, time saved, scale)?
- Are keywords in the Summary contextualized or just listed?
- Are action verbs strong (Developed, Architected, Reduced) vs. weak (Helped with, Responsible for)?

### 2D. SECTION PLACEMENT ANALYSIS
Score each placement zone (0–100):
- Headline/Title (25%): Contains exact JD title + top 2 skills
- Summary (20%): Contains title + 3–5 Tier 1 keywords in context
- Skills Section (25%): Lists all hard skills; includes full terms AND acronyms when useful
- Experience Bullets (30%): Tier 1 keywords appear in quantified or contextualized bullets

### 2E. KNOCKOUT FILTER SIMULATION
Identify binary hard filters:
- Years of experience (required vs. detected — calculate from dates when possible)
- Degree requirement (required level vs. detected)
- Location/work authorization (if stated)
- Mandatory certifications (if stated)

Each is PASS or FAIL. Any FAIL is a hard rejection regardless of score.

---

## SCORING RULES
Base score starts at 100. Apply deductions:
- Parsing FAIL: Max score = 50
- Job title is MISS: -20 points
- Job title is SEMANTIC only: -8 points
- Tier 1 keyword match rate < 70%: -15 points
- Tier 1 keyword match rate < 50%: -25 points
- Keywords only in skills list, never in bullets: -10 points
- Keyword stuffing detected (4+ repetitions of same term): -5 points per term
- Acronym-only matches (missing full form): -3 points per instance
- Any knockout filter FAIL: Score = 0

OUTPUT FORMAT (JSON only, no markdown):
{{
  "overall_match_score": 78,
  "pass_probability": "Medium",
  "parsing_integrity": {{
    "status": "PASS",
    "issues_found": [],
    "recommendation": "No formatting issues detected."
  }},
  "title_analysis": {{
    "jd_title": "Senior Backend Engineer",
    "resume_title": "Backend Developer",
    "match_level": "SEMANTIC",
    "score_impact": -8,
    "recommendation": "Change your headline to exactly 'Senior Backend Engineer' for a full point recovery."
  }},
  "keyword_analysis": {{
    "tier_1_keywords": [
      {{"keyword": "Kubernetes", "tier": 1, "resume_status": "MISSING", "jd_frequency": 3}},
      {{"keyword": "Docker", "tier": 1, "resume_status": "EXACT_MATCH", "jd_frequency": 2, "placement": ["Skills Section", "Experience Bullet"]}}
    ],
    "tier_2_keywords": [],
    "tier_3_keywords": [],
    "match_summary": {{
      "tier_1_match_rate": "60%",
      "tier_2_match_rate": "80%",
      "missing_critical": ["Kubernetes", "Helm"],
      "acronym_only_risks": [{{"term": "AWS", "advice": "Add 'Amazon Web Services (AWS)' on first mention"}}],
      "semantic_traps": [{{"jd_term": "Microservices Architecture", "resume_term": "Microservices", "risk": "Low — modern ATS will likely match, but add full phrase to be safe"}}],
      "stuffing_risks": []
    }}
  }},
  "placement_audit": {{
    "headline_score": 60,
    "headline_feedback": "Title present but missing top hard skills.",
    "summary_score": 75,
    "summary_feedback": "Good keyword density; add 'Kubernetes' and exact JD title.",
    "skills_section_score": 85,
    "skills_section_feedback": "Strong. Add full forms for acronyms (AWS, CI/CD).",
    "bullets_score": 70,
    "bullets_feedback": "Most Tier 1 keywords appear in bullets. Docker and Redis lack metrics."
  }},
  "keyword_density": {{
    "estimated_word_count": 480,
    "density_percent": 2.1,
    "status": "OPTIMAL",
    "stuffing_risks": []
  }},
  "knockout_filters": {{
    "years_experience": {{"required": "5+", "detected": "5.5", "status": "PASS"}},
    "education": {{"required": "Bachelor's", "detected": "Bachelor's CS", "status": "PASS"}},
    "certifications": {{"required": "None stated", "detected": "N/A", "status": "PASS"}}
  }},
  "action_plan": [
    {{
      "priority": "CRITICAL",
      "impact": "High",
      "action": "Change headline to exactly 'Senior Backend Engineer'. Recover up to 8 points."
    }},
    {{
      "priority": "CRITICAL",
      "impact": "High",
      "action": "Add 'Kubernetes' and 'Helm' to Skills section AND weave into at least one experience bullet with a metric."
    }},
    {{
      "priority": "HIGH",
      "impact": "Medium",
      "action": "Expand 'AWS' to 'Amazon Web Services (AWS)' on first mention to capture both forms in ATS parsing."
    }},
    {{
      "priority": "MEDIUM",
      "impact": "Low",
      "action": "Add quantified outcomes to Docker and Redis bullets when real metrics exist."
    }}
  ]
}}
"""


async def scan_resume_ats(resume_data: dict[str, Any], job_description: str) -> dict[str, Any]:
    """
    Perform ATS scan based on modern parsing, matching, and knockout-filter logic.
    """
    try:
        import json

        prompt = ATS_SCAN_PROMPT.format(
            resume_json=json.dumps(resume_data, indent=2),
            job_description=job_description,
        )

        result = await complete_json(prompt=prompt, max_tokens=4096)

        # ---------------------------------------------------------
        # POST-PROCESSING FOR UI COMPATIBILITY
        # Preserve legacy frontend expectations while supporting the
        # richer ATS JSON schema returned by the prompt above.
        # ---------------------------------------------------------

        # 1. Map Overall Score & Probability
        result.setdefault("overall_score", result.get("overall_match_score", 0))
        score = result.get("overall_score", 0)
        result["pass_probability"] = "High" if score >= 85 else ("Medium" if score >= 70 else "Low")

        # 2. Backward-compatible searchability status
        parsing_status = result.get("parsing_integrity", {}).get("status", "FAIL")
        result["searchability_status"] = "High" if parsing_status == "PASS" else "Low"

        # 3. Normalize title analysis fields for old consumers
        title_analysis = result.setdefault("title_analysis", {})
        if "match_status" not in title_analysis and "match_level" in title_analysis:
            raw_level = str(title_analysis.get("match_level", "")).upper()
            mapped_level = {
                "EXACT": "Exact",
                "SEMANTIC": "Semantic",
                "PARTIAL": "Partial",
                "MISS": "Miss",
            }.get(raw_level, title_analysis.get("match_level"))
            title_analysis["match_status"] = mapped_level

        # 4. Build a legacy-compatible hard_skills_analysis block from keyword_analysis
        keyword_analysis = result.get("keyword_analysis", {})
        match_summary = keyword_analysis.get("match_summary", {})

        tier_1_keywords = keyword_analysis.get("tier_1_keywords", [])
        tier_2_keywords = keyword_analysis.get("tier_2_keywords", [])
        tier_3_keywords = keyword_analysis.get("tier_3_keywords", [])
        all_keywords = tier_1_keywords + tier_2_keywords + tier_3_keywords

        def _is_exact(status: str) -> bool:
            return str(status).upper() == "EXACT_MATCH"

        exact_matches_found = sum(1 for kw in all_keywords if _is_exact(kw.get("resume_status", "")))
        missing_critical = match_summary.get("missing_critical", [])
        semantic_traps = match_summary.get("semantic_traps", [])

        result["hard_skills_analysis"] = {
            "total_keywords_searched": len(all_keywords),
            "exact_matches_found": exact_matches_found,
            "match_rate": match_summary.get("tier_1_match_rate", "0%"),
            "missing_exact_keywords": missing_critical,
            "synonym_traps": [
                {
                    "jd_term": trap.get("jd_term"),
                    "resume_term": trap.get("resume_term"),
                    "advice": trap.get("risk", "Add the exact JD phrase for safer ATS matching."),
                }
                for trap in semantic_traps
            ],
        }

        # 5. Construct strengths
        strengths = []
        if title_analysis.get("match_status") == "Exact":
            strengths.append("Perfect Job Title Match")
        if result.get("placement_audit", {}).get("skills_section_score", 0) > 90:
            strengths.append("Excellent Hard Skills Density")
        if parsing_status == "PASS":
            strengths.append("Resume Appears Parse-Friendly")
        result["strengths"] = strengths

        # 6. Construct weaknesses & missing keywords
        weaknesses = []
        missing_kws = result["hard_skills_analysis"].get("missing_exact_keywords", [])
        result["missing_keywords"] = missing_kws

        for trap in result["hard_skills_analysis"].get("synonym_traps", []):
            if trap.get("resume_term") and trap.get("jd_term"):
                weaknesses.append(
                    f"Semantic Match Risk: Using '{trap['resume_term']}' instead of exact JD term '{trap['jd_term']}'"
                )

        if title_analysis.get("match_status") != "Exact":
            weaknesses.append(
                f"Title Mismatch: '{title_analysis.get('resume_title')}' vs JD '{title_analysis.get('jd_title')}'"
            )

        parsing_issues = result.get("parsing_integrity", {}).get("issues_found", [])
        for issue in parsing_issues:
            weaknesses.append(f"Parsing Risk: {issue}")

        for risk in match_summary.get("acronym_only_risks", []):
            term = risk.get("term")
            if term:
                weaknesses.append(f"Acronym-Only Risk: '{term}' should appear with its full form on first mention")

        for risk in match_summary.get("stuffing_risks", []):
            weaknesses.append(f"Keyword Stuffing Risk: {risk}")

        result["weaknesses"] = weaknesses

        # 7. Map recommendations
        recommendations = []
        for action in result.get("action_plan", []):
            action_text = action.get("action")
            if action_text:
                recommendations.append(action_text)

        parsing_recommendation = result.get("parsing_integrity", {}).get("recommendation")
        if parsing_recommendation:
            recommendations.insert(0, parsing_recommendation)

        result["recommendations"] = recommendations

        # 8. Knockout risks
        knockout_risks = []
        filters = result.get("knockout_filters", {})
        for key, val in filters.items():
            if val.get("status") == "FAIL":
                knockout_risks.append(
                    f"{key.replace('_', ' ').title()}: Required {val.get('required')}, found {val.get('detected')}"
                )
        result["knockout_risks"] = knockout_risks

        # 9. Category scores for existing UI graphs
        result["category_scores"] = {
            "keyword_match": {
                "score": int(str(result["hard_skills_analysis"].get("match_rate", "0%")).strip("%") or 0),
                "weight": 40,
                "details": "Tier 1 keyword alignment with exact, acronym, and semantic matching considerations",
            },
            "experience_alignment": {
                "score": result.get("placement_audit", {}).get("headline_score", 0),
                "weight": 25,
                "details": "Job title alignment and role relevance to the JD",
            },
            "technical_skills": {
                "score": result.get("placement_audit", {}).get("skills_section_score", 0),
                "weight": 20,
                "details": "Coverage and placement quality of technical skills",
            },
            "format_structure": {
                "score": 100 if parsing_status == "PASS" else 50,
                "weight": 10,
                "details": "Parsing integrity, section structure, and extraction safety",
            },
            "education_certifications": {
                "score": 100 if filters.get("education", {}).get("status") == "PASS" else 0,
                "weight": 5,
                "details": "Education and certification requirement alignment",
            },
        }

        return result

    except Exception as e:
        logger.error(f"ATS scan failed: {e}")
        raise
