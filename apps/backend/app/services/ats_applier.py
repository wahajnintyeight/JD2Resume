"""ATS Suggestions Application Service - Applies ATS scan suggestions to resumes."""

import copy
import logging
from typing import Any

from app.schemas.models import ResumeData

logger = logging.getLogger(__name__)


def apply_ats_suggestions(
    resume_data: dict[str, Any],
    ats_results: dict[str, Any],
) -> dict[str, Any]:
    """Apply ATS scan suggestions to resume data.
    
    Args:
        resume_data: Original resume data dict
        ats_results: ATS scan results containing suggestions
        
    Returns:
        Modified resume data with ATS suggestions applied
    """
    # Deep copy to avoid modifying original
    modified = copy.deepcopy(resume_data)
    
    # Ensure all required structures exist
    if "personalInfo" not in modified:
        modified["personalInfo"] = {}
    if "additional" not in modified:
        modified["additional"] = {}
    if "technicalSkills" not in modified["additional"]:
        modified["additional"]["technicalSkills"] = []
    
    # 1. Apply title changes if title_analysis exists
    title_analysis = ats_results.get("title_analysis", {})
    if title_analysis and title_analysis.get("match_status") != "Exact":
        jd_title = title_analysis.get("jd_title", "").strip()
        if jd_title:
            modified["personalInfo"]["title"] = jd_title
            logger.info(f"Updated resume title to: {jd_title}")
    
    # 2. Add missing keywords to technical skills (append at the end)
    # Support both nested and top-level missing_keywords
    hard_skills = ats_results.get("hard_skills_analysis", {})
    missing_keywords = (
        hard_skills.get("missing_exact_keywords", []) or 
        ats_results.get("missing_keywords", [])
    )
    
    if missing_keywords:
        existing_skills_lower = {
            skill.lower().strip() 
            for skill in modified["additional"]["technicalSkills"]
        }
        
        # Append missing keywords at the end
        for keyword in missing_keywords:
            keyword_lower = keyword.lower().strip()
            # Only add if not already present (case-insensitive check)
            if keyword_lower not in existing_skills_lower:
                modified["additional"]["technicalSkills"].append(keyword)
                existing_skills_lower.add(keyword_lower)
                logger.info(f"Added missing keyword to skills: {keyword}")
    
    # 3. Apply synonym replacements in experience descriptions
    # Support both nested and extracted from weaknesses
    synonym_traps = hard_skills.get("synonym_traps", [])
    
    # If no synonym_traps in hard_skills_analysis, extract from weaknesses
    if not synonym_traps:
        synonym_traps = _extract_synonym_traps_from_weaknesses(
            ats_results.get("weaknesses", [])
        )
    
    if synonym_traps:
        modified["workExperience"] = _apply_synonym_replacements(
            modified.get("workExperience", []),
            synonym_traps
        )
        
        # Also apply synonym replacements in projects
        if modified.get("personalProjects"):
            modified["personalProjects"] = _apply_synonym_replacements(
                modified.get("personalProjects", []),
                synonym_traps
            )
        
        # Also replace synonyms in summary if present (case-insensitive)
        if modified.get("summary"):
            import re
            for trap in synonym_traps:
                resume_term = trap.get("resume_term", "")
                jd_term = trap.get("jd_term", "")
                if resume_term and jd_term:
                    pattern = re.compile(re.escape(resume_term), re.IGNORECASE)
                    if pattern.search(modified["summary"]):
                        modified["summary"] = pattern.sub(jd_term, modified["summary"])
                        logger.info(f"Replaced synonym in summary: {resume_term} -> {jd_term}")
    
    # 4. Update summary/headline to include target title and top skills
    placement_audit = ats_results.get("placement_audit", {})
    if placement_audit.get("headline_score", 100) < 75:
        target_title = title_analysis.get("jd_title", "")
        top_skills = hard_skills.get("exact_matches_found", [])[:4] if isinstance(
            hard_skills.get("exact_matches_found"), list
        ) else []
        
        if target_title or top_skills:
            modified["summary"] = _enhance_headline(
                modified.get("summary", ""),
                target_title,
                top_skills
            )
    
    # 5. Process action plan recommendations intelligently
    action_plan = ats_results.get("action_plan", [])
    if action_plan:
        modified = _apply_action_plan_recommendations(
            modified,
            action_plan,
            ats_results
        )
    
    # 6. Process general recommendations if action_plan not available
    recommendations = ats_results.get("recommendations", [])
    if recommendations and not action_plan:
        modified = _apply_general_recommendations(
            modified,
            recommendations,
            ats_results
        )
    
    return modified


def _apply_synonym_replacements(
    experiences: list[dict],
    synonym_traps: list[dict]
) -> list[dict]:
    """Replace synonym terms with exact JD terms in experience descriptions."""
    import re
    modified_experiences = copy.deepcopy(experiences)
    
    for exp in modified_experiences:
        descriptions = exp.get("description", [])
        if descriptions:
            modified_descriptions = []
            for desc in descriptions:
                modified_desc = desc
                for trap in synonym_traps:
                    resume_term = trap.get("resume_term", "")
                    jd_term = trap.get("jd_term", "")
                    if resume_term and jd_term:
                        # Case-insensitive replacement while preserving the JD term's case
                        pattern = re.compile(re.escape(resume_term), re.IGNORECASE)
                        if pattern.search(modified_desc):
                            modified_desc = pattern.sub(jd_term, modified_desc)
                            logger.info(
                                f"Replaced synonym in experience: {resume_term} -> {jd_term}"
                            )
                modified_descriptions.append(modified_desc)
            exp["description"] = modified_descriptions
    
    return modified_experiences


def _extract_synonym_traps_from_weaknesses(weaknesses: list[str]) -> list[dict]:
    """Extract synonym traps from weakness strings.
    
    Parses strings like "Synonym Trap: Using 'X' instead of 'Y'" into structured format.
    """
    import re
    synonym_traps = []
    
    for weakness in weaknesses:
        # Match pattern: "Synonym Trap: Using 'X' instead of 'Y'"
        match = re.search(r"Synonym Trap: Using ['\"](.+?)['\"] instead of ['\"](.+?)['\"]", weakness)
        if match:
            resume_term = match.group(1)
            jd_term = match.group(2)
            synonym_traps.append({
                "resume_term": resume_term,
                "jd_term": jd_term,
                "advice": f"Change '{resume_term}' to '{jd_term}'"
            })
            logger.info(f"Extracted synonym trap: {resume_term} -> {jd_term}")
    
    return synonym_traps


def _enhance_headline(
    current_summary: str,
    target_title: str,
    top_skills: list[str]
) -> str:
    """Enhance summary/headline to include target title and key skills."""
    parts = []
    
    if target_title and target_title not in current_summary:
        parts.append(target_title)
    
    if top_skills:
        skills_text = ", ".join(top_skills)
        if skills_text not in current_summary:
            parts.append(f"with expertise in {skills_text}")
    
    if parts:
        # If there's already a summary, prepend the headline
        if current_summary.strip():
            return f"{' '.join(parts)}\n\n{current_summary}"
        else:
            return " ".join(parts)
    
    return current_summary


def _apply_action_plan_recommendations(
    resume_data: dict[str, Any],
    action_plan: list[dict[str, Any]],
    ats_results: dict[str, Any]
) -> dict[str, Any]:
    """Apply action plan recommendations intelligently.
    
    Processes structured action plan items and applies changes where possible.
    """
    modified = resume_data
    
    for action_item in action_plan:
        priority = action_item.get("priority", "").upper()
        action = action_item.get("action", "").lower()
        
        # Handle title changes
        if "headline" in action or "title" in action:
            jd_title = ats_results.get("title_analysis", {}).get("jd_title", "")
            if jd_title and jd_title not in modified.get("personalInfo", {}).get("title", ""):
                modified["personalInfo"]["title"] = jd_title
                logger.info(f"Applied action plan: Updated title to {jd_title}")
        
        # Handle keyword additions
        elif "add" in action and ("keyword" in action or "skill" in action):
            # Extract keywords from the action text or use missing_keywords
            missing_keywords = (
                ats_results.get("hard_skills_analysis", {}).get("missing_exact_keywords", []) or
                ats_results.get("missing_keywords", [])
            )
            if missing_keywords:
                existing_skills_lower = {
                    skill.lower().strip() 
                    for skill in modified["additional"]["technicalSkills"]
                }
                for keyword in missing_keywords:
                    if keyword.lower().strip() not in existing_skills_lower:
                        modified["additional"]["technicalSkills"].append(keyword)
                        existing_skills_lower.add(keyword.lower().strip())
                        logger.info(f"Applied action plan: Added skill {keyword}")
        
        # Handle soft skills removal
        elif "remove" in action and "soft skill" in action:
            soft_skills_keywords = [
                "leadership", "communication", "teamwork", "problem solving",
                "critical thinking", "time management", "adaptability", "creativity",
                "collaboration", "interpersonal", "organizational", "detail-oriented"
            ]
            original_count = len(modified["additional"]["technicalSkills"])
            modified["additional"]["technicalSkills"] = [
                skill for skill in modified["additional"]["technicalSkills"]
                if not any(soft in skill.lower() for soft in soft_skills_keywords)
            ]
            removed_count = original_count - len(modified["additional"]["technicalSkills"])
            if removed_count > 0:
                logger.info(f"Applied action plan: Removed {removed_count} soft skills")
    
    return modified


def _apply_general_recommendations(
    resume_data: dict[str, Any],
    recommendations: list[str],
    ats_results: dict[str, Any]
) -> dict[str, Any]:
    """Apply general text-based recommendations intelligently.
    
    Parses recommendation strings and applies changes where possible.
    """
    modified = resume_data
    
    for rec in recommendations:
        rec_lower = rec.lower()
        
        # Handle title changes
        if "change" in rec_lower and ("title" in rec_lower or "headline" in rec_lower):
            jd_title = ats_results.get("title_analysis", {}).get("jd_title", "")
            if jd_title:
                modified["personalInfo"]["title"] = jd_title
                logger.info(f"Applied recommendation: Updated title to {jd_title}")
        
        # Handle keyword additions
        elif "add" in rec_lower and ("keyword" in rec_lower or "skill" in rec_lower):
            missing_keywords = (
                ats_results.get("hard_skills_analysis", {}).get("missing_exact_keywords", []) or
                ats_results.get("missing_keywords", [])
            )
            if missing_keywords:
                existing_skills_lower = {
                    skill.lower().strip() 
                    for skill in modified["additional"]["technicalSkills"]
                }
                for keyword in missing_keywords:
                    if keyword.lower().strip() not in existing_skills_lower:
                        modified["additional"]["technicalSkills"].append(keyword)
                        existing_skills_lower.add(keyword.lower().strip())
                        logger.info(f"Applied recommendation: Added skill {keyword}")
        
        # Handle soft skills removal
        elif "remove" in rec_lower and "soft skill" in rec_lower:
            soft_skills_keywords = [
                "leadership", "communication", "teamwork", "problem solving",
                "critical thinking", "time management", "adaptability", "creativity",
                "collaboration", "interpersonal", "organizational", "detail-oriented"
            ]
            original_count = len(modified["additional"]["technicalSkills"])
            modified["additional"]["technicalSkills"] = [
                skill for skill in modified["additional"]["technicalSkills"]
                if not any(soft in skill.lower() for soft in soft_skills_keywords)
            ]
            removed_count = original_count - len(modified["additional"]["technicalSkills"])
            if removed_count > 0:
                logger.info(f"Applied recommendation: Removed {removed_count} soft skills")
    
    return modified


def calculate_ats_diff(
    original: dict[str, Any],
    modified: dict[str, Any],
) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    """Calculate diff between original and ATS-modified resume.
    
    Args:
        original: Original resume data
        modified: Modified resume data with ATS suggestions
        
    Returns:
        Tuple of (diff_summary dict, detailed_changes list)
    """
    from app.services.improver import ResumeDiffSummary, ResumeFieldDiff
    
    changes: list[dict] = []
    
    # Track statistics
    skills_added = 0
    skills_removed = 0
    skills_replaced = 0
    title_changed = False
    descriptions_modified = 0
    summary_changed = False
    
    # 1. Check title changes
    original_title = original.get("personalInfo", {}).get("title", "").strip()
    modified_title = modified.get("personalInfo", {}).get("title", "").strip()
    if original_title != modified_title:
        title_changed = True
        changes.append({
            "field_path": "personalInfo.title",
            "field_type": "title",
            "change_type": "modified",
            "original_value": original_title or None,
            "new_value": modified_title,
            "confidence": "high",
            "reason": "ATS title match optimization"
        })
    
    # 2. Check skills changes
    original_skills = original.get("additional", {}).get("technicalSkills", [])
    modified_skills = modified.get("additional", {}).get("technicalSkills", [])
    
    original_skills_set = {s.lower().strip() for s in original_skills}
    modified_skills_set = {s.lower().strip() for s in modified_skills}
    
    # Skills added
    added_skills = modified_skills_set - original_skills_set
    for skill in added_skills:
        # Find the actual case of the skill
        actual_skill = next(
            (s for s in modified_skills if s.lower().strip() == skill),
            skill
        )
        skills_added += 1
        changes.append({
            "field_path": "additional.technicalSkills",
            "field_type": "skill",
            "change_type": "added",
            "new_value": actual_skill,
            "confidence": "high",
            "reason": "Missing ATS keyword"
        })
    
    # Skills removed
    removed_skills = original_skills_set - modified_skills_set
    for skill in removed_skills:
        # Find the actual case of the skill
        actual_skill = next(
            (s for s in original_skills if s.lower().strip() == skill),
            skill
        )
        skills_removed += 1
        changes.append({
            "field_path": "additional.technicalSkills",
            "field_type": "skill",
            "change_type": "removed",
            "original_value": actual_skill,
            "confidence": "medium",
            "reason": "Soft skill removal for ATS optimization"
        })
    
    # 3. Check summary changes
    original_summary = (original.get("summary") or "").strip()
    modified_summary = (modified.get("summary") or "").strip()
    if original_summary != modified_summary:
        summary_changed = True
        changes.append({
            "field_path": "summary",
            "field_type": "summary",
            "change_type": "modified",
            "original_value": original_summary or None,
            "new_value": modified_summary,
            "confidence": "medium",
            "reason": "Headline optimization with target keywords"
        })
    
    # 4. Check experience description changes (for synonym replacements)
    original_exp = original.get("workExperience", [])
    modified_exp = modified.get("workExperience", [])
    
    for idx, (orig, mod) in enumerate(zip(original_exp, modified_exp)):
        orig_descs = orig.get("description", [])
        mod_descs = mod.get("description", [])
        
        if orig_descs != mod_descs:
            descriptions_modified += 1
            # Show which specific descriptions changed
            for desc_idx, (orig_desc, mod_desc) in enumerate(zip(orig_descs, mod_descs)):
                if orig_desc != mod_desc:
                    changes.append({
                        "field_path": f"workExperience[{idx}].description[{desc_idx}]",
                        "field_type": "description",
                        "change_type": "modified",
                        "original_value": orig_desc,
                        "new_value": mod_desc,
                        "confidence": "high",
                        "reason": "Synonym replacement for exact ATS keyword match",
                        "context": f"{mod.get('title', 'Experience')} at {mod.get('company', 'Company')}"
                    })
    
    # 5. Check project description changes (for synonym replacements)
    original_projects = original.get("personalProjects", [])
    modified_projects = modified.get("personalProjects", [])
    
    for idx, (orig, mod) in enumerate(zip(original_projects, modified_projects)):
        orig_descs = orig.get("description", [])
        mod_descs = mod.get("description", [])
        
        if orig_descs != mod_descs:
            # Show which specific descriptions changed
            for desc_idx, (orig_desc, mod_desc) in enumerate(zip(orig_descs, mod_descs)):
                if orig_desc != mod_desc:
                    changes.append({
                        "field_path": f"personalProjects[{idx}].description[{desc_idx}]",
                        "field_type": "description",
                        "change_type": "modified",
                        "original_value": orig_desc,
                        "new_value": mod_desc,
                        "confidence": "high",
                        "reason": "Synonym replacement for exact ATS keyword match",
                        "context": f"Project: {mod.get('name', 'Project')}"
                    })
    
    # Build summary
    total_changes = len(changes)
    
    diff_summary = {
        "total_changes": total_changes,
        "skills_added": skills_added,
        "skills_removed": skills_removed,
        "skills_replaced": skills_replaced,
        "descriptions_modified": descriptions_modified,
        "title_changed": title_changed,
        "summary_changed": summary_changed,
        "ats_specific_changes": True,
    }
    
    return diff_summary, changes
