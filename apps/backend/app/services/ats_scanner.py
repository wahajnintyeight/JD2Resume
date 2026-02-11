"""ATS Scanner Service - Analyzes resume compatibility based on Search Engine Logic."""

import logging
from typing import Any
from app.llm import complete_json

logger = logging.getLogger(__name__)


ATS_SCAN_PROMPT = """You are simulating the search algorithms of major ATS platforms (Greenhouse, Lever, Rippling). You are NOT a human recruiter. You are a search engine. Your job is to determine if this resume will appear in a recruiter's boolean search results based on the Job Description (JD).

RESUME:
{resume_json}

JOB DESCRIPTION:
{job_description}

ANALYSIS LOGIC:

1. EXACT TITLE MATCH (Critical):
   - Does the resume's "Target Title" or "Headline" EXACTLY match the Job Title in the JD? 
   - Strict string matching is preferred over semantic matching.
   - Example: JD "Senior Data Analyst" vs Resume "Data Professional" = FAIL.

2. SEARCHABILITY & FORMATTING:
   - Is the text parseable? (Simulate selecting text).
   - Are standard headers used?

3. HARD KEYWORD EXTRACTION (The "Search Bar" Test):
   - Identify the top 15-30 HARD technical skills/tools from the JD.
   - Ignore soft skills (communication, leadership) for this phase.
   - Check for EXACT matches in the resume. 
   - Do NOT count synonyms (e.g., if JD says "Customer Lifecycle", "Client Journey" is a MISS).

4. PLACEMENT ANALYSIS (SEO for Resumes):
   - Headline/Summary: Must contain target title + top 3-4 hard skills.
   - Skills Section: Must list hard skills (comma-separated).
   - Experience Bullets: Must contextualize keywords.

5. KNOCKOUT FILTER SIMULATION:
   - Identify binary constraints (Years of Experience, Visa, Location, Degree).
   - Pass/Fail assessment.

OUTPUT FORMAT (JSON only):
{{
  "overall_match_score": 85,
  "searchability_status": "High",
  "title_analysis": {{
    "jd_title": "Senior Product Manager",
    "resume_title": "Product Lead",
    "match_status": "Partial",
    "recommendation": "CHANGE IMMEDIATELY. Rename your headline to 'Senior Product Manager' to match the JD exactly."
  }},
  "hard_skills_analysis": {{
    "total_keywords_searched": 20,
    "exact_matches_found": 14,
    "match_rate": "70%",
    "missing_exact_keywords": [
      "Tableau",
      "GTM Strategy",
      "SQL"
    ],
    "synonym_traps": [
      {{ "jd_term": "GTM Strategy", "resume_term": "Launch Planning", "advice": "Change 'Launch Planning' to 'GTM Strategy'" }},
      {{ "jd_term": "Tableau", "resume_term": "Data Visualization", "advice": "Be specific. List 'Tableau' explicitly." }}
    ]
  }},
  "placement_audit": {{
    "headline_score": 50,
    "headline_feedback": "Missing target title and top skills.",
    "skills_section_score": 100,
    "skills_section_feedback": "Good density of hard skills.",
    "bullet_points_score": 80,
    "bullet_points_feedback": "Keywords found, but some lack metrics."
  }},
  "knockout_filters": {{
    "years_experience": {{ "required": "5+", "detected": "6", "status": "PASS" }},
    "education": {{ "required": "Bachelor", "detected": "Master", "status": "PASS" }}
  }},
  "action_plan": [
    {{
      "priority": "CRITICAL",
      "action": "Change your Resume Headline to exactly '{job_title}'."
    }},
    {{
      "priority": "HIGH",
      "action": "Add these exact keywords to your Skills section: {missing_keywords}."
    }},
    {{
      "priority": "MEDIUM",
      "action": "Remove soft skills (Leadership, Communication) from Skills section to reduce noise."
    }}
  ]
}}

SCORING RULES:
- If Title does not match exactly: Max score 80.
- If less than 80% exact keyword match: Max score 70.
- If soft skills appear in "Hard Skills" analysis: Penalize score.
- Be harsh on "Synonym Traps". If JD says "Salesforce" and resume says "CRM", mark it as missing.
"""

async def scan_resume_ats(resume_data: dict[str, Any], job_description: str) -> dict[str, Any]:
    """
    Perform ATS scan based on exact-match search engine logic.
    """
    try:
        import json
        
        # Pre-process JD title extraction could happen here for better prompting, 
        # but we let the LLM extract it to keep the interface clean.
        
        prompt = ATS_SCAN_PROMPT.format(
            resume_json=json.dumps(resume_data, indent=2),
            job_description=job_description,
            # Placeholder variables that are dynamically filled by LLM logic, 
            # but brackets must be escaped in the f-string if not used here.
            # Since we used the prompt variable directly, we just map the inputs.
            job_title="{job_title}", 
            missing_keywords="{missing_keywords}"
        )
        
        result = await complete_json(
            prompt=prompt,
            max_tokens=4096
        )
        
        # ---------------------------------------------------------
        # POST-PROCESSING FOR UI COMPATIBILITY
        # The frontend likely expects specific keys (strengths, weaknesses, etc.)
        # We map the new "Insider" logic to the expected structure.
        # ---------------------------------------------------------
        
        # 1. Map Overall Score & Probability
        result.setdefault("overall_score", result.get("overall_match_score", 0))
        score = result.get("overall_score", 0)
        result["pass_probability"] = "High" if score >= 85 else ("Medium" if score >= 70 else "Low")

        # 2. Construct "Strengths"
        strengths = []
        if result.get("title_analysis", {}).get("match_status") == "Exact":
            strengths.append("Perfect Job Title Match")
        if result.get("placement_audit", {}).get("skills_section_score", 0) > 90:
            strengths.append("Excellent Hard Skills Density")
        result["strengths"] = strengths

        # 3. Construct "Weaknesses" & "Missing Keywords"
        weaknesses = []
        missing_kws = result.get("hard_skills_analysis", {}).get("missing_exact_keywords", [])
        result["missing_keywords"] = missing_kws
        
        synonym_traps = result.get("hard_skills_analysis", {}).get("synonym_traps", [])
        for trap in synonym_traps:
            weaknesses.append(f"Synonym Trap: Using '{trap['resume_term']}' instead of '{trap['jd_term']}'")
            
        if result.get("title_analysis", {}).get("match_status") != "Exact":
            weaknesses.append(f"Title Mismatch: '{result.get('title_analysis', {}).get('resume_title')}' vs JD '{result.get('title_analysis', {}).get('jd_title')}'")
            
        result["weaknesses"] = weaknesses

        # 4. Map Recommendations
        recommendations = []
        for action in result.get("action_plan", []):
            recommendations.append(action.get("action"))
        result["recommendations"] = recommendations

        # 5. Knockout Risks
        knockout_risks = []
        filters = result.get("knockout_filters", {})
        for key, val in filters.items():
            if val.get("status") == "FAIL":
                knockout_risks.append(f"{key.replace('_', ' ').title()}: Required {val.get('required')}, found {val.get('detected')}")
        result["knockout_risks"] = knockout_risks
        
        # 6. Category Scores (UI usually needs this graph)
        result["category_scores"] = {
            "keyword_match": {
                "score": int(result.get("hard_skills_analysis", {}).get("match_rate", "0").strip("%")),
                "weight": 40,
                "details": "Exact keyword matching based on search relevance"
            },
            "experience_alignment": {
                "score": result.get("placement_audit", {}).get("headline_score", 0), # Proxying headline/exp alignment
                "weight": 25,
                "details": "Title match and experience relevance"
            },
             "technical_skills": {
                "score": result.get("placement_audit", {}).get("skills_section_score", 0),
                "weight": 20,
                "details": "Hard skills density in dedicated section"
            },
             "format_structure": {
                "score": 100 if result.get("searchability_status") == "High" else 50,
                "weight": 10,
                "details": "Parsing and searchability check"
            },
            "education_certifications": {
                 "score": 100 if filters.get("education", {}).get("status") == "PASS" else 0,
                 "weight": 5,
                 "details": "Education requirements check"
            }
        }

        return result
        
    except Exception as e:
        logger.error(f"ATS scan failed: {e}")
        raise