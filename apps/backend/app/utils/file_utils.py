"""File utility functions."""

import re
from datetime import datetime
from typing import Any

def sanitize_filename(filename: str) -> str:
    """Sanitize filename to remove invalid characters.
    
    Args:
        filename: Original filename
        
    Returns:
        Sanitized filename safe for filesystem
    """
    # Remove characters that are unsafe for filenames
    # Keep alphanumerics, spaces, dots, underscores, dashes
    clean = re.sub(r'[^\w\s\.\-_]', '', filename)
    # Collapse whitespace
    clean = re.sub(r'\s+', '_', clean)
    return clean.strip('_')

def generate_resume_filename(resume_data: dict[str, Any], extension: str) -> str:
    """Generate a filename for a resume download.
    
    Format: user_name_job_title_dd_mm_yyyy.extension
    Example: John_Doe_Software_Engineer_15_01_2024.pdf
    
    Args:
        resume_data: Resume data dictionary
        extension: File extension (e.g., 'pdf', 'docx')
        
    Returns:
        Formatted filename string
    """
    personal_info = resume_data.get("personalInfo", {})
    name = personal_info.get("name", "Resume")
    title = personal_info.get("title", "")
    
    # Get current date in dd_mm_yyyy format
    date_str = datetime.now().strftime("%d_%m_%Y")
    
    if name and title:
        base_name = f"{name}_{title}_{date_str}"
    elif name:
        base_name = f"{name}_{date_str}"
    elif title:
        base_name = f"{title}_{date_str}"
    else:
        base_name = f"Resume_{date_str}"
        
    # Sanitize
    clean_name = sanitize_filename(base_name)
    print("NAME:")
    # Ensure not empty
    if not clean_name:
        clean_name = f"Resume_{date_str}"
    print(clean_name)
    return f"{clean_name}.{extension.lstrip('.')}"
