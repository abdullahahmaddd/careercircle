import io
import re
from typing import Dict, Any, List, Optional
from pypdf import PdfReader
from docx import Document

def extract_text_from_pdf(file_content: bytes) -> str:
    try:
        pdf = PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return text
    except Exception as e:
        raise ValueError(f"Error reading PDF: {str(e)}")

def extract_text_from_docx(file_content: bytes) -> str:
    try:
        doc = Document(io.BytesIO(file_content))
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        # Also extract text from tables (common in resumes)
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    text += cell.text + " "
                text += "\n"
        return text
    except Exception as e:
        raise ValueError(f"Error reading DOCX: {str(e)}")


def extract_contact_info(text: str, lines: List[str]) -> Dict[str, str]:
    """Extract name, email, phone, and LinkedIn from resume text."""
    # Email pattern
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    email_match = re.search(email_pattern, text)
    email = email_match.group(0) if email_match else ""
    
    # Phone patterns (various formats)
    phone_patterns = [
        r'\+?\d{1,3}[-.\s]?\(?\d{2,3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',  # International
        r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}',  # US format
        r'\d{10,11}',  # Plain 10-11 digits
    ]
    phone = ""
    for pattern in phone_patterns:
        phone_match = re.search(pattern, text)
        if phone_match:
            phone = phone_match.group(0)
            break
    
    # LinkedIn pattern
    linkedin_pattern = r'(?:linkedin\.com/in/|linkedin:?\s*)([a-zA-Z0-9-]+)'
    linkedin_match = re.search(linkedin_pattern, text, re.IGNORECASE)
    linkedin = f"linkedin.com/in/{linkedin_match.group(1)}" if linkedin_match else ""
    
    # Name: First non-empty line that doesn't look like contact info
    name = "Unknown Candidate"
    for line in lines[:5]:  # Check first 5 lines
        line_clean = line.strip()
        # Skip if it looks like email, phone, address, or URL
        if (line_clean and 
            len(line_clean) < 60 and 
            not re.search(email_pattern, line_clean) and
            not re.search(r'\d{5,}', line_clean) and  # Zip codes
            not re.search(r'linkedin|github|http|www\.', line_clean, re.IGNORECASE) and
            not re.search(r'^\+?\d[\d\s\-()]+$', line_clean) and  # Phone
            re.search(r'[A-Za-z]{2,}', line_clean)):  # Has letters
            name = line_clean
            break
    
    return {"name": name, "email": email, "phone": phone, "linkedin": linkedin}


def detect_section(line: str) -> Optional[str]:
    """Detect if a line is a section header and return section type."""
    line_lower = line.lower().strip()
    line_clean = re.sub(r'[:\-–—|•]', '', line_lower).strip()
    
    section_keywords = {
        "summary": ["summary", "profile", "professional summary", "objective", "about me", "about", "career objective"],
        "experience": ["experience", "work experience", "work history", "employment", "professional experience", "career history", "employment history"],
        "education": ["education", "academic background", "qualifications", "academic", "degrees", "certifications"],
        "skills": ["skills", "technical skills", "technologies", "core competencies", "competencies", "expertise", "tools", "programming languages"],
        "projects": ["projects", "personal projects", "key projects"],
        "certifications": ["certifications", "certificates", "licenses"],
    }
    
    # Check if line is short enough to be a header (usually < 40 chars)
    if len(line) > 60:
        return None
    
    for section, keywords in section_keywords.items():
        for keyword in keywords:
            if keyword == line_clean or line_clean.startswith(keyword) or line_clean.endswith(keyword):
                return section
    
    return None


def parse_experience_section(lines: List[str]) -> List[Dict[str, Any]]:
    """Parse experience section into structured job entries."""
    experiences = []
    current_job: Dict[str, Any] = {}
    current_descriptions: List[str] = []
    
    # Patterns for job detection
    date_pattern = r'(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]*\d{4}|(?:20\d{2}|19\d{2})[\s\-–—to]+(?:Present|Current|Now|20\d{2}|19\d{2})|(?:\d{1,2}/\d{4})'
    title_company_pattern = r'^([A-Z][^,|•\n]{2,40})\s*(?:[-–—|@,at]\s*|\sat\s)([A-Z][^,|\n]{2,40})'
    
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        if not line_stripped:
            continue
        
        # Check if this line looks like a new job entry (has dates)
        has_date = bool(re.search(date_pattern, line_stripped, re.IGNORECASE))
        
        # Check if it looks like a title/company line
        title_match = re.match(title_company_pattern, line_stripped, re.IGNORECASE)
        
        # If we found a new job header
        if has_date or (title_match and i < len(lines) - 1):
            # Save previous job if exists
            if current_job:
                current_job["description"] = current_descriptions
                experiences.append(current_job)
            
            # Extract dates
            date_match = re.search(date_pattern, line_stripped, re.IGNORECASE)
            dates = date_match.group(0) if date_match else ""
            
            # Try to parse title and company
            if title_match:
                title = title_match.group(1).strip()
                company = title_match.group(2).strip()
            else:
                # Use the line without dates as title
                title = re.sub(date_pattern, '', line_stripped, flags=re.IGNORECASE).strip()
                title = re.sub(r'[-–—|,]\s*$', '', title).strip()
                company = ""
            
            current_job = {
                "title": title or "Role",
                "company": company or "Company",
                "startDate": dates.split('-')[0].strip() if '-' in dates else dates,
                "endDate": dates.split('-')[-1].strip() if '-' in dates else "Present",
            }
            current_descriptions = []
        
        elif current_job:
            # This is a description line for the current job
            # Clean bullet points
            clean_line = re.sub(r'^[\s•\-\*○◦▪►]\s*', '', line_stripped)
            if clean_line and len(clean_line) > 10:
                current_descriptions.append(clean_line)
        
        elif not current_job and line_stripped:
            # First experience entry without clear header
            current_job = {
                "title": line_stripped[:50],
                "company": "",
                "startDate": "",
                "endDate": "Present",
            }
            current_descriptions = []
    
    # Don't forget the last job
    if current_job:
        current_job["description"] = current_descriptions if current_descriptions else [line_stripped]
        experiences.append(current_job)
    
    # If no structured parsing worked, create a single entry with all text
    if not experiences and lines:
        experiences.append({
            "title": "Professional Experience",
            "company": "",
            "startDate": "",
            "endDate": "",
            "description": [line.strip() for line in lines if line.strip()]
        })
    
    return experiences


def parse_education_section(lines: List[str]) -> List[Dict[str, Any]]:
    """Parse education section into structured entries."""
    education_entries = []
    current_entry: Dict[str, Any] = {}
    
    degree_keywords = ["bachelor", "master", "phd", "doctor", "associate", "diploma", "b.s.", "m.s.", "b.a.", "m.a.", "mba", "b.tech", "m.tech", "bs", "ms", "ba", "ma"]
    year_pattern = r'(?:19|20)\d{2}'
    
    for line in lines:
        line_stripped = line.strip()
        if not line_stripped:
            continue
        
        line_lower = line_stripped.lower()
        has_degree = any(kw in line_lower for kw in degree_keywords)
        has_year = bool(re.search(year_pattern, line_stripped))
        
        if has_degree or has_year:
            if current_entry and current_entry.get("degree"):
                education_entries.append(current_entry)
            
            # Extract year
            year_match = re.search(year_pattern, line_stripped)
            year = year_match.group(0) if year_match else ""
            
            # Try to separate degree and institution
            degree = line_stripped
            institution = ""
            
            # Common separators
            for sep in [" - ", " at ", " from ", ", ", " | "]:
                if sep in line_stripped:
                    parts = line_stripped.split(sep)
                    degree = parts[0].strip()
                    institution = parts[1].strip() if len(parts) > 1 else ""
                    break
            
            current_entry = {
                "degree": re.sub(year_pattern, '', degree).strip(),
                "institution": institution or "Institution",
                "graduationDate": year or "N/A"
            }
        elif current_entry:
            # Additional info for current entry
            if not current_entry.get("institution") or current_entry.get("institution") == "Institution":
                current_entry["institution"] = line_stripped
    
    if current_entry and current_entry.get("degree"):
        education_entries.append(current_entry)
    
    # Fallback if nothing parsed
    if not education_entries and lines:
        combined = " ".join(line.strip() for line in lines[:3] if line.strip())
        education_entries.append({
            "degree": combined[:100] if combined else "Education details in resume",
            "institution": "",
            "graduationDate": ""
        })
    
    return education_entries


def parse_skills_section(lines: List[str]) -> List[Dict[str, str]]:
    """Parse skills section into list of skills."""
    skills = []
    seen = set()
    
    # Combine all lines
    text = " ".join(line.strip() for line in lines)
    
    # Split by common delimiters
    potential_skills = re.split(r'[,|•·:\n/]', text)
    
    for skill in potential_skills:
        # Clean up the skill
        clean_skill = re.sub(r'^\s*[-–—*○◦▪►]\s*', '', skill)
        clean_skill = re.sub(r'\([^)]*\)', '', clean_skill)  # Remove parenthetical
        clean_skill = clean_skill.strip()
        
        # Validate skill
        if (clean_skill and 
            2 < len(clean_skill) < 50 and 
            clean_skill.lower() not in seen and
            not re.match(r'^\d+$', clean_skill)):  # Not just numbers
            skills.append({"name": clean_skill, "level": ""})
            seen.add(clean_skill.lower())
    
    return skills[:30]  # Limit to 30 skills


def parse_resume_text(text: str) -> Dict[str, Any]:
    """Parse resume text into structured data."""
    lines = [line for line in text.split('\n')]
    non_empty_lines = [line.strip() for line in lines if line.strip()]
    
    # Extract contact info
    contact = extract_contact_info(text, non_empty_lines)
    
    # Section extraction using state machine
    sections = {
        "summary": [],
        "experience": [],
        "education": [],
        "skills": [],
        "projects": [],
        "certifications": [],
    }
    
    current_section = "summary"
    
    for line in non_empty_lines:
        detected = detect_section(line)
        if detected:
            current_section = detected
        else:
            sections[current_section].append(line)
    
    # Process each section
    experience = parse_experience_section(sections["experience"])
    education = parse_education_section(sections["education"])
    skills = parse_skills_section(sections["skills"])
    
    # If skills are empty, try to extract from other sections
    if not skills and sections["summary"]:
        skills = parse_skills_section(sections["summary"][:3])
    
    summary = " ".join(sections["summary"][:5])  # First 5 lines of summary
    
    return {
        "name": contact["name"],
        "email": contact["email"],
        "phone": contact["phone"],
        "linkedin": contact["linkedin"],
        "summary": summary,
        "experience": experience,
        "education": education,
        "skills": skills
    }


async def parse_resume(file_content: bytes, filename: str) -> Dict[str, Any]:
    """Main entry point for resume parsing."""
    text = ""
    filename_lower = filename.lower()
    
    try:
        if filename_lower.endswith('.pdf'):
            text = extract_text_from_pdf(file_content)
        elif filename_lower.endswith('.docx'):
            text = extract_text_from_docx(file_content)
        else:
            # Try decoding as text
            try:
                text = file_content.decode('utf-8')
            except Exception:
                raise ValueError("Unsupported file format and could not decode as text")
    except ValueError as e:
        raise e
    except Exception as e:
        raise ValueError(f"Failed to parse file: {str(e)}")
            
    if not text.strip():
        raise ValueError("Could not extract any text from the file")

    return parse_resume_text(text)