import io
import re
from typing import Dict, Any, List
from pypdf import PdfReader
from docx import Document

def extract_text_from_pdf(file_content: bytes) -> str:
    try:
        pdf = PdfReader(io.BytesIO(file_content))
        text = ""
        for page in pdf.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        print(f"Error reading PDF: {e}")
        return ""

def extract_text_from_docx(file_content: bytes) -> str:
    try:
        doc = Document(io.BytesIO(file_content))
        text = ""
        for para in doc.paragraphs:
            text += para.text + "\n"
        return text
    except Exception as e:
        print(f"Error reading DOCX: {e}")
        return ""

def parse_resume_text(text: str) -> Dict[str, Any]:
    # Basic Regex Patterns
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    phone_pattern = r'\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
    linkedin_pattern = r'linkedin\.com/in/[a-zA-Z0-9-]+'
    
    email_match = re.search(email_pattern, text)
    phone_match = re.search(phone_pattern, text)
    linkedin_match = re.search(linkedin_pattern, text)
    
    email = email_match.group(0) if email_match else ""
    phone = phone_match.group(0) if phone_match else ""
    linkedin = linkedin_match.group(0) if linkedin_match else ""
    
    # Heuristic for Name: First non-empty line usually
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    name = lines[0] if lines else "Unknown Candidate"
    if len(name) > 50: # If first line is too long, it's probably not a name
        name = "Unknown Candidate"

    # Sections Extraction (Simple Keyword Search)
    # This is a basic state machine parser
    
    raw_sections = {
        "summary": [],
        "experience": [],
        "education": [],
        "skills": []
    }
    
    section_keywords = {
        "experience": ["experience", "work history", "employment", "professional experience"],
        "education": ["education", "academic background", "qualifications"],
        "skills": ["skills", "technical skills", "technologies", "core competencies"],
        "summary": ["summary", "profile", "professional summary", "objective"]
    }
    
    current_section = "summary" 
    
    for line in lines:
        line_lower = line.lower()
        
        # Check if line looks like a section header
        is_header = False
        for section, keywords in section_keywords.items():
            # Header heuristic: keyword in line, short line (e.g., < 30 chars), maybe uppercase?
            # We'll just check if the line *contains* the keyword and is short enough
            if any(k == line_lower or (k in line_lower and len(line) < 40 and line.isupper()) for k in keywords):
                current_section = section
                is_header = True
                break
        
        if not is_header:
            raw_sections[current_section].append(line)

    # Process raw sections into structured data
    
    # Skills
    skills_list = []
    skill_text = " ".join(raw_sections["skills"])
    # Split by common delimiters
    potential_skills = re.split(r'[,|•·\n]', skill_text)
    for skill in potential_skills:
        clean_skill = skill.strip()
        if clean_skill and len(clean_skill) < 40: # Avoid capturing long sentences
            skills_list.append({"name": clean_skill, "level": "Intermediate"})

    # Education
    education_list = []
    edu_text = raw_sections["education"]
    if edu_text:
        # Simple heuristic: try to find lines with years
        # Otherwise create one generic entry
        education_list.append({
            "institution": "See Resume Text",
            "degree": " ".join(edu_text[:2]) if len(edu_text) > 0 else "Degree Not Found",
            "graduationDate": "N/A"
        })

    # Experience
    experience_list = []
    exp_text = raw_sections["experience"]
    if exp_text:
        # We'll just dump the text into one entry for now as parsing job blocks is hard without LLM
        # Or we can split by lines that look like dates?
        experience_list.append({
            "title": "Professional Experience",
            "company": "Various",
            "startDate": "",
            "endDate": "",
            "description": exp_text # Pass list of strings directly
        })

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "linkedin": linkedin,
        "summary": " ".join(raw_sections["summary"]),
        "experience": experience_list,
        "education": education_list,
        "skills": skills_list
    }

async def parse_resume(file_content: bytes, filename: str) -> Dict[str, Any]:
    text = ""
    if filename.lower().endswith('.pdf'):
        text = extract_text_from_pdf(file_content)
    elif filename.lower().endswith('.docx'):
        text = extract_text_from_docx(file_content)
    else:
        # Try decoding as text
        try:
            text = file_content.decode('utf-8')
        except:
            pass
            
    return parse_resume_text(text)