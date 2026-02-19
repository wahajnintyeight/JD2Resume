"""Prompt templates and blacklists for multi-pass resume refinement."""

# AI Phrase Blacklist - Words and phrases that sound AI-generated
AI_PHRASE_BLACKLIST: set[str] = {
    # Action verbs (overused in AI resume writing)
    "spearheaded",
    "orchestrated",
    "championed",
    "synergized",
    "leveraged",
    "revolutionized",
    "pioneered",
    "catalyzed",
    "operationalized",
    "architected",
    "envisioned",
    "effectuated",
    "endeavored",
    "facilitated",
    "utilized",
    # Corporate buzzwords
    "synergy",
    "synergies",
    "paradigm",
    "paradigm shift",
    "best-in-class",
    "world-class",
    "cutting-edge",
    "bleeding-edge",
    "game-changer",
    "game-changing",
    "disruptive",
    "disruptor",
    "holistic",
    "robust",
    "scalable",
    "actionable",
    "impactful",
    "proactive",
    "proactively",
    "stakeholder",
    "deliverables",
    "bandwidth",
    "circle back",
    "deep dive",
    "move the needle",
    "low-hanging fruit",
    "touch base",
    "value-add",
    # Filler phrases
    "in order to",
    "for the purpose of",
    "with a view to",
    "at the end of the day",
    "moving forward",
    "going forward",
    "on a daily basis",
    "on a regular basis",
    "in a timely manner",
    "at this point in time",
    "due to the fact that",
    "in the event that",
    "in light of the fact that",
    # Punctuation patterns
    "\u2014",  # Em-dash
    "---",
    "--",  # Double hyphen often used as em-dash substitute
}

# Replacements for AI phrases - maps AI phrase to simpler alternative
AI_PHRASE_REPLACEMENTS: dict[str, str] = {
    # Action verb replacements
    "spearheaded": "led",
    "orchestrated": "coordinated",
    "championed": "advocated for",
    "synergized": "collaborated",
    "leveraged": "used",
    "revolutionized": "transformed",
    "pioneered": "introduced",
    "catalyzed": "initiated",
    "operationalized": "implemented",
    "architected": "designed",
    "envisioned": "planned",
    "effectuated": "completed",
    "endeavored": "worked",
    "facilitated": "helped",
    "utilized": "used",
    # Buzzword replacements
    "synergy": "collaboration",
    "synergies": "collaborations",
    "paradigm": "approach",
    "paradigm shift": "change",
    "best-in-class": "top-performing",
    "world-class": "high-quality",
    "cutting-edge": "modern",
    "bleeding-edge": "modern",
    "game-changer": "innovation",
    "game-changing": "innovative",
    "disruptive": "innovative",
    "holistic": "comprehensive",
    "robust": "strong",
    "scalable": "expandable",
    "actionable": "practical",
    "impactful": "effective",
    "proactive": "active",
    "proactively": "actively",
    "stakeholder": "team member",
    "deliverables": "outputs",
    "bandwidth": "capacity",
    "circle back": "follow up",
    "deep dive": "analysis",
    "move the needle": "make progress",
    "low-hanging fruit": "quick wins",
    "touch base": "connect",
    "value-add": "benefit",
    # Phrase simplifications
    "in order to": "to",
    "for the purpose of": "to",
    "with a view to": "to",
    "at the end of the day": "",
    "moving forward": "",
    "going forward": "",
    "on a daily basis": "daily",
    "on a regular basis": "regularly",
    "in a timely manner": "promptly",
    "at this point in time": "now",
    "due to the fact that": "because",
    "in the event that": "if",
    "in light of the fact that": "since",
    # Punctuation replacements
    "\u2014": ", ",  # Em-dash to comma
    "---": ", ",
    "--": ", ",
}


# Prompt for injecting missing keywords into a resume
KEYWORD_INJECTION_PROMPT = """Inject the following keywords into this resume where they can be naturally and TRUTHFULLY incorporated.

CRITICAL RULES:
1. Only add keywords where the master resume provides supporting evidence
2. Do NOT add skills, technologies, or certifications not in the master resume
3. Rephrase existing bullet points to include keywords - do not invent new content
4. Maintain the exact same JSON structure
5. Do not use em-dashes (—) or their variants (---, --)

SKILL HANDLING RULES (CRITICAL):
- PRESERVE ALL EXISTING SKILLS: You must NEVER remove skills already present in the technicalSkills list
- ONLY ADD GENUINE TECHNICAL SKILLS: Only add skills that are actual technologies, tools, programming languages, frameworks, platforms, databases, cloud services, or technical methodologies
- DO NOT ADD BUZZWORDS OR SOFT SKILLS: Avoid adding terms like "communication", "leadership", "stakeholder management", "strategic thinking", "cross-functional collaboration"
- DO NOT ADD GENERIC CONCEPTS: Do not add "agile", "scrum", "waterfall" unless specifically requested as hard requirements
- VALIDATE BEFORE ADDING: Only add a skill if it is a recognized technical competency (e.g., "Python", "Kubernetes", "AWS Lambda", "GraphQL", "TensorFlow", "PostgreSQL", "Docker", "React")
- EXAMPLES OF VALID TECHNICAL SKILLS: Programming languages, databases, cloud platforms, frameworks, libraries, tools, DevOps technologies, ML/AI frameworks, security tools, testing frameworks
- EXAMPLES OF INVALID "SKILLS": "data storytelling", "product thinking", "growth mindset", "problem solving", "teamwork", "adaptability"

Keywords to inject (only if supported by master resume):
{keywords_to_inject}

Current tailored resume:
{current_resume}

Master resume (source of truth):
{master_resume}

Job description context:
{job_description}

Output the complete resume JSON with keywords naturally integrated. Return ONLY valid JSON."""


# Prompt for validation and polish pass
VALIDATION_POLISH_PROMPT = """Review and polish this resume content. Remove any AI-sounding language and ensure all content is truthful.

REMOVE or REPLACE:
- Buzzwords: "spearheaded", "synergy", "leverage", "orchestrated", etc.
- Em-dashes (use commas or semicolons instead)
- Overly formal language: "utilized" -> "used", "endeavored" -> "worked"
- Generic filler: "in order to" -> "to"

VERIFY:
- All skills exist in the master resume
- All certifications exist in the master resume
- No fabricated metrics or achievements

SKILL PRESERVATION RULES (CRITICAL):
- PRESERVE ALL EXISTING SKILLS: You must NEVER remove skills already present in the technicalSkills list from the original resume
- ONLY RETAIN GENUINE TECHNICAL SKILLS: Ensure all skills in technicalSkills are actual technologies, tools, programming languages, frameworks, platforms, databases, or cloud services
- REMOVE SOFT SKILLS from technicalSkills: If "communication", "leadership", "teamwork" appear in technicalSkills, remove them
- REMOVE BUSINESS CONCEPTS from technicalSkills: If generic terms like "stakeholder management", "strategic planning", "data storytelling" appear in technicalSkills, remove them
- VALIDATE TECHNICAL SKILLS: Ensure all skills are recognized technical competencies (e.g., "Python", "Kubernetes", "AWS Lambda", "GraphQL", "PostgreSQL", "Docker", "React")
- ONLY ADD TECHNICAL SKILLS: If adding new skills, only add actual technical tools/languages/frameworks from the job description that are supported by the master resume

Resume to polish:
{resume}

Master resume (verify all claims against this):
{master_resume}

Output the polished resume JSON. Return ONLY valid JSON."""
