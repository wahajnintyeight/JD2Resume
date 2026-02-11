"""Test enhanced ATS applier functionality."""

import pytest
from app.services.ats_applier import apply_ats_suggestions, calculate_ats_diff


def test_append_missing_skills():
    """Test that missing skills are appended to the end of skills list."""
    resume_data = {
        "personalInfo": {"title": "Software Developer"},
        "additional": {
            "technicalSkills": ["Python", "JavaScript", "React"]
        }
    }
    
    ats_results = {
        "hard_skills_analysis": {
            "missing_exact_keywords": ["PostgreSQL", "Docker", "AWS"]
        }
    }
    
    modified = apply_ats_suggestions(resume_data, ats_results)
    
    # Check that original skills are preserved in order
    assert modified["additional"]["technicalSkills"][:3] == ["Python", "JavaScript", "React"]
    
    # Check that new skills are appended
    assert "PostgreSQL" in modified["additional"]["technicalSkills"]
    assert "Docker" in modified["additional"]["technicalSkills"]
    assert "AWS" in modified["additional"]["technicalSkills"]
    
    # Check total count
    assert len(modified["additional"]["technicalSkills"]) == 6


def test_no_duplicate_skills():
    """Test that duplicate skills are not added."""
    resume_data = {
        "personalInfo": {"title": "Software Developer"},
        "additional": {
            "technicalSkills": ["Python", "JavaScript", "postgresql"]
        }
    }
    
    ats_results = {
        "hard_skills_analysis": {
            "missing_exact_keywords": ["PostgreSQL", "Docker"]
        }
    }
    
    modified = apply_ats_suggestions(resume_data, ats_results)
    
    # PostgreSQL should not be added (case-insensitive match)
    skills_lower = [s.lower() for s in modified["additional"]["technicalSkills"]]
    assert skills_lower.count("postgresql") == 1
    
    # Docker should be added
    assert "Docker" in modified["additional"]["technicalSkills"]
    assert len(modified["additional"]["technicalSkills"]) == 4


def test_action_plan_title_change():
    """Test that action plan title changes are applied."""
    resume_data = {
        "personalInfo": {"title": "Software Developer"},
        "additional": {"technicalSkills": []}
    }
    
    ats_results = {
        "title_analysis": {
            "jd_title": "Senior Full Stack Engineer",
            "match_status": "Partial"
        },
        "action_plan": [
            {
                "priority": "CRITICAL",
                "action": "Change your Resume Headline to exactly 'Senior Full Stack Engineer'."
            }
        ]
    }
    
    modified = apply_ats_suggestions(resume_data, ats_results)
    
    assert modified["personalInfo"]["title"] == "Senior Full Stack Engineer"


def test_action_plan_add_keywords():
    """Test that action plan keyword additions are applied."""
    resume_data = {
        "personalInfo": {"title": "Developer"},
        "additional": {"technicalSkills": ["Python"]}
    }
    
    ats_results = {
        "hard_skills_analysis": {
            "missing_exact_keywords": ["Kubernetes", "Terraform"]
        },
        "action_plan": [
            {
                "priority": "HIGH",
                "action": "Add these exact keywords to your Skills section: Kubernetes, Terraform."
            }
        ]
    }
    
    modified = apply_ats_suggestions(resume_data, ats_results)
    
    assert "Kubernetes" in modified["additional"]["technicalSkills"]
    assert "Terraform" in modified["additional"]["technicalSkills"]


def test_soft_skills_removal():
    """Test that soft skills are removed when recommended."""
    resume_data = {
        "personalInfo": {"title": "Developer"},
        "additional": {
            "technicalSkills": [
                "Python", "Leadership", "JavaScript", 
                "Communication", "Docker", "Teamwork"
            ]
        }
    }
    
    ats_results = {
        "action_plan": [
            {
                "priority": "MEDIUM",
                "action": "Remove soft skills (Leadership, Communication) from Skills section to reduce noise."
            }
        ]
    }
    
    modified = apply_ats_suggestions(resume_data, ats_results)
    
    # Technical skills should remain
    assert "Python" in modified["additional"]["technicalSkills"]
    assert "JavaScript" in modified["additional"]["technicalSkills"]
    assert "Docker" in modified["additional"]["technicalSkills"]
    
    # Soft skills should be removed
    assert "Leadership" not in modified["additional"]["technicalSkills"]
    assert "Communication" not in modified["additional"]["technicalSkills"]
    assert "Teamwork" not in modified["additional"]["technicalSkills"]


def test_synonym_replacement_in_projects():
    """Test that synonym replacements work in projects."""
    resume_data = {
        "personalInfo": {"title": "Developer"},
        "additional": {"technicalSkills": []},
        "personalProjects": [
            {
                "id": 1,
                "name": "E-commerce Platform",
                "description": [
                    "Built CRM system for customer management",
                    "Implemented data visualization dashboard"
                ]
            }
        ]
    }
    
    ats_results = {
        "hard_skills_analysis": {
            "synonym_traps": [
                {
                    "jd_term": "Salesforce",
                    "resume_term": "CRM system",
                    "advice": "Change 'CRM system' to 'Salesforce'"
                },
                {
                    "jd_term": "Tableau",
                    "resume_term": "data visualization",
                    "advice": "Be specific. List 'Tableau' explicitly."
                }
            ]
        }
    }
    
    modified = apply_ats_suggestions(resume_data, ats_results)
    
    # Check replacements in project descriptions
    assert "Salesforce" in modified["personalProjects"][0]["description"][0]
    assert "CRM system" not in modified["personalProjects"][0]["description"][0]
    assert "Tableau" in modified["personalProjects"][0]["description"][1]


def test_calculate_diff_with_changes():
    """Test diff calculation shows all types of changes."""
    original = {
        "personalInfo": {"title": "Developer"},
        "additional": {"technicalSkills": ["Python", "JavaScript"]},
        "summary": "Software developer with experience"
    }
    
    modified = {
        "personalInfo": {"title": "Senior Full Stack Engineer"},
        "additional": {"technicalSkills": ["Python", "JavaScript", "Docker", "Kubernetes"]},
        "summary": "Senior Full Stack Engineer with experience"
    }
    
    diff_summary, detailed_changes = calculate_ats_diff(original, modified)
    
    # Check summary
    assert diff_summary["total_changes"] == 3  # title + 2 skills + summary
    assert diff_summary["title_changed"] is True
    assert diff_summary["skills_added"] == 2
    assert diff_summary["summary_changed"] is True
    
    # Check detailed changes
    assert len(detailed_changes) == 4
    
    # Verify change types
    change_types = {change["field_type"] for change in detailed_changes}
    assert "title" in change_types
    assert "skill" in change_types
    assert "summary" in change_types


def test_calculate_diff_with_skill_removal():
    """Test diff calculation tracks skill removals."""
    original = {
        "personalInfo": {"title": "Developer"},
        "additional": {"technicalSkills": ["Python", "Leadership", "JavaScript", "Communication"]},
    }
    
    modified = {
        "personalInfo": {"title": "Developer"},
        "additional": {"technicalSkills": ["Python", "JavaScript"]},
    }
    
    diff_summary, detailed_changes = calculate_ats_diff(original, modified)
    
    # Check that removals are tracked
    assert diff_summary["skills_removed"] == 2
    
    # Check detailed changes include removals
    removed_changes = [c for c in detailed_changes if c["change_type"] == "removed"]
    assert len(removed_changes) == 2


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
