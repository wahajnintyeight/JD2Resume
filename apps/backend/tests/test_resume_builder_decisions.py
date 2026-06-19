from app.routers.resume_builder import _apply_change_decisions
from app.schemas import ResumeFieldDiff


def test_rejected_new_skill_is_removed_from_all_skill_containers() -> None:
    original = {
        "additional": {
            "technicalSkills": ["Python"],
            "skillSections": {"Tools": ["Docker"]},
        }
    }
    improved = {
        "additional": {
            "technicalSkills": ["Python", "Kubernetes"],
            "skillSections": {"Tools": ["Docker", "Kubernetes"]},
        }
    }
    changes = [
        ResumeFieldDiff(
            field_path="additional.technicalSkills",
            field_type="skill",
            change_type="added",
            new_value="Kubernetes",
            confidence="high",
        )
    ]

    final_data, warnings = _apply_change_decisions(
        original,
        improved,
        changes,
        {0: "rejected"},
    )

    assert warnings == []
    assert final_data["additional"]["technicalSkills"] == ["Python"]
    assert final_data["additional"]["skillSections"]["Tools"] == ["Docker"]


def test_rejected_existing_skill_addition_preserves_original_skill_container() -> None:
    original = {
        "additional": {
            "technicalSkills": ["Python"],
            "skillSections": {"Tools": ["Docker"]},
        }
    }
    improved = {
        "additional": {
            "technicalSkills": ["Python", "Docker"],
            "skillSections": {"Tools": ["Docker"]},
        }
    }
    changes = [
        ResumeFieldDiff(
            field_path="additional.technicalSkills",
            field_type="skill",
            change_type="added",
            new_value="Docker",
            confidence="high",
        )
    ]

    final_data, warnings = _apply_change_decisions(
        original,
        improved,
        changes,
        {0: "rejected"},
    )

    assert warnings == []
    assert final_data["additional"]["technicalSkills"] == ["Python"]
    assert final_data["additional"]["skillSections"]["Tools"] == ["Docker"]
