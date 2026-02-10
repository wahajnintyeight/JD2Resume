"""DOCX resume generation service using templates.

This module provides template-based DOCX generation using placeholder replacement.
"""

from typing import Any
from app.services.docx_template import generate_resume_from_template


def generate_resume_docx(resume_data: dict[str, Any]) -> bytes:
    """Generate a DOCX file from resume data using template.
    
    Args:
        resume_data: Dictionary containing resume sections
        
    Returns:
        Bytes of the generated DOCX file
    """
    return generate_resume_from_template(resume_data)
