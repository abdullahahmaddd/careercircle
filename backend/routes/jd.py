from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from backend.models import UserInDB
from backend.routes.auth import get_current_user
from backend.database import get_database
from datetime import datetime
import re

router = APIRouter()

# Request/Response Models
class JDParseRequest(BaseModel):
    text: str

class JDParseResponse(BaseModel):
    role: str
    domain: str
    keywords: List[str]
    
class FitScoreRequest(BaseModel):
    resume_content: Dict[str, Any]
    keywords: List[str]

class FitScoreResponse(BaseModel):
    score: int
    matched_keywords: List[str]
    missing_keywords: List[str]


# Common keywords list for extraction
COMMON_KEYWORDS = [
    # AI/ML
    "machine learning", "deep learning", "artificial intelligence", "ai", "ml",
    "neural network", "natural language processing", "nlp", "computer vision",
    "pytorch", "tensorflow", "keras", "scikit-learn", "sklearn",
    "transformers", "huggingface", "llm", "large language model",
    "cnn", "rnn", "lstm", "transformer", "gan", "generative ai",
    "reinforcement learning", "supervised learning", "unsupervised learning",
    "model training", "model deployment", "mlops", "feature engineering",
    "data preprocessing", "opencv", "pandas", "numpy", "matplotlib",
    # Technical
    "react", "typescript", "javascript", "python", "java", "c++", "c/c++",
    "aws", "azure", "gcp", "cloud",
    "node.js", "nodejs", "express", "fastapi", "django", "flask", "spring",
    "docker", "kubernetes", "ci/cd", "git", "github", "gitlab", "linux",
    "sql", "nosql", "mongodb", "postgresql", "mysql", "redis",
    "rest", "api", "rest api", "graphql", "microservices",
    "data science", "data analysis", "data engineering", "data pipeline",
    "html", "css", "sass", "tailwind", "bootstrap",
    # Management
    "agile", "scrum", "project management", "product management",
    "leadership", "team management", "stakeholder management",
    # Marketing
    "marketing strategy", "seo", "sem", "social media", "content creation",
    "digital marketing", "brand management", "analytics",
    # Finance
    "financial modeling", "risk management", "investment", "budgeting",
    "financial analysis", "accounting", "excel",
    # Soft skills
    "communication", "teamwork", "problem-solving", "analytical",
    "detail-oriented", "motivated", "innovative", "creative",
    "customer service", "client relations", "collaboration",
]


def clean_text(text: str) -> str:
    """Remove emojis and special unicode characters from text."""
    # Remove emoji and special unicode characters
    emoji_pattern = re.compile(
        "["
        "\U0001F600-\U0001F64F"  # emoticons
        "\U0001F300-\U0001F5FF"  # symbols & pictographs
        "\U0001F680-\U0001F6FF"  # transport & map symbols
        "\U0001F1E0-\U0001F1FF"  # flags
        "\U00002500-\U00002BEF"  # chinese char
        "\U00002702-\U000027B0"
        "\U000024C2-\U0001F251"
        "\U0001f926-\U0001f937"
        "\U00010000-\U0010ffff"
        "\u2640-\u2642"
        "\u2600-\u2B55"
        "\u200d"
        "\u23cf"
        "\u23e9"
        "\u231a"
        "\ufe0f"  # dingbats
        "\u3030"
        "]+",
        flags=re.UNICODE
    )
    return emoji_pattern.sub('', text).strip()


# def extract_role(jd_text: str) -> str:
#     """Extract job role/title from JD text."""
#     # Clean the text first
#     cleaned_text = clean_text(jd_text)
#     lower_text = cleaned_text.lower()
    
#     # Check for common role patterns
#     role_patterns = [
#         r"(?:job title|position|role)[:\s]+([^\n.]{5,50})",
#         r"^([^\n]{5,60})(?:\n|$)",  # First line often contains title
#     ]
    
#     for pattern in role_patterns:
#         match = re.search(pattern, cleaned_text, re.IGNORECASE | re.MULTILINE)
#         if match:
#             role = match.group(1).strip()
#             # Skip if it's just whitespace or too short
#             if len(role) >= 5 and len(role) < 60:
#                 return role
    
#     # Fallback to keyword matching
#     if "machine learning" in lower_text or "ml engineer" in lower_text:
#         return "Machine Learning Engineer"
#     elif "ai engineer" in lower_text or "artificial intelligence" in lower_text:
#         return "AI Engineer"
#     elif "data scientist" in lower_text:
#         return "Data Scientist"
#     elif "data engineer" in lower_text:
#         return "Data Engineer"
#     elif "software engineer" in lower_text:
#         return "Software Engineer"
#     elif "product manager" in lower_text:
#         return "Product Manager"
#     elif "marketing manager" in lower_text:
#         return "Marketing Manager"
#     elif "frontend" in lower_text or "front-end" in lower_text:
#         return "Frontend Developer"
#     elif "backend" in lower_text or "back-end" in lower_text:
#         return "Backend Developer"
#     elif "full stack" in lower_text or "fullstack" in lower_text:
#         return "Full Stack Developer"
    
#     return "Unknown Role"

def extract_role(jd_text: str) -> str:
    """Robust extraction of job role/title from JD text."""
    cleaned_text = clean_text(jd_text)
    if not cleaned_text.strip():
        return "Unknown Role"

    # Normalize whitespace and split into non-empty lines
    lines = [line.strip() for line in cleaned_text.splitlines() if line.strip()]
    lower_text = cleaned_text.lower()

    # 1) If first non-empty line looks like a title (not a long sentence), use it.
    if lines:
        first = lines[0]
        # Heuristic: a title is usually shorter than 80 chars and contains letters/words and maybe slashes/hyphens
        if 3 <= len(first) <= 80 and len(first.split()) <= 8:
            # Remove trailing colons or pipe-like separators
            candidate = re.sub(r"[:|–—\-]{1,}\s*$", "", first).strip()
            # If it contains many words like a full sentence (has a verb) then skip
            if not re.search(r"\b(is|are|will|responsible|design|build|manage|support)\b", candidate, re.IGNORECASE):
                return candidate

    # 2) Look for "As an <role>" or "As a <role>" pattern in the body
    as_pattern = re.search(r"\bas an?\s+([A-Za-z0-9 &/\-\+]{3,80}?)\b(?:,|\.|who|with|that|,)", cleaned_text, re.IGNORECASE)
    if as_pattern:
        role = as_pattern.group(1).strip()
        # common cleanup: replace multiple spaces, normalize slashes
        role = re.sub(r"\s{2,}", " ", role)
        role = role.replace("/", " / ").replace("  ", " ").strip()
        return role

    # 3) Look for lines that are short and title-like elsewhere in the first 5 non-empty lines
    for i, line in enumerate(lines[:5]):
        if 3 <= len(line) <= 80 and len(line.split()) <= 8:
            candidate = re.sub(r"[:|–—\-]{1,}\s*$", "", line).strip()
            if not re.search(r"\b(is|are|will|responsible|design|build|manage|support)\b", candidate, re.IGNORECASE):
                return candidate

    # 4) Fallback keyword matching with improved variants
    low = lower_text
    if any(k in low for k in ["machine learning", "ml engineer", "ai/ml", "ai / ml", "ai engineer", "ai engineer", "artificial intelligence"]):
        # return a sensible normalized label
        if "machine learning" in low or "ml engineer" in low or "ai/ml" in low or "ai / ml" in low:
            return "AI / Machine Learning Engineer"
        return "AI Engineer"
    if "data scientist" in low:
        return "Data Scientist"
    if "data engineer" in low:
        return "Data Engineer"
    if "software engineer" in low or re.search(r"\bsoftware engineer\b", low):
        return "Software Engineer"
    if "product manager" in low:
        return "Product Manager"
    if "marketing manager" in low or "marketing coordinator" in low:
        return "Marketing Manager" if "manager" in low else "Marketing Coordinator"
    if "frontend" in low or "front-end" in low:
        return "Frontend Developer"
    if "backend" in low or "back-end" in low:
        return "Backend Developer"
    if "full stack" in low or "fullstack" in low:
        return "Full Stack Developer"

    # 5) Last resort: first non-empty line trimmed but only if it contains alphabetic chars
    if lines:
        fallback = lines[0].strip()
        if re.search(r"[A-Za-z]", fallback):
            return fallback[:60].strip()

    return "Unknown Role"

def extract_domain(jd_text: str) -> str:
    """Extract industry domain from JD text."""
    lower_text = jd_text.lower()
    
    if any(kw in lower_text for kw in ["machine learning", "ai", "deep learning", "neural", "ml"]):
        return "AI/Machine Learning"
    elif any(kw in lower_text for kw in ["tech", "software", "developer", "engineer", "programming"]):
        return "Technology"
    elif any(kw in lower_text for kw in ["finance", "banking", "investment", "financial"]):
        return "Finance"
    elif any(kw in lower_text for kw in ["healthcare", "medical", "hospital", "pharmaceutical"]):
        return "Healthcare"
    elif any(kw in lower_text for kw in ["marketing", "advertising", "brand", "digital marketing"]):
        return "Marketing"
    elif any(kw in lower_text for kw in ["sales", "business development", "account"]):
        return "Sales"
    elif any(kw in lower_text for kw in ["education", "teaching", "academic"]):
        return "Education"
    elif any(kw in lower_text for kw in ["retail", "e-commerce", "ecommerce"]):
        return "Retail"
    
    return "General"


def extract_keywords(jd_text: str) -> List[str]:
    """Extract relevant keywords from JD text."""
    lower_text = jd_text.lower()
    
    found_keywords = []
    for keyword in COMMON_KEYWORDS:
        if keyword in lower_text:
            found_keywords.append(keyword)
    
    # Also extract any skills in parentheses or after "skills:" patterns
    skills_pattern = r"(?:skills?|requirements?|qualifications?)[:\s]+([^\n]+)"
    matches = re.findall(skills_pattern, jd_text, re.IGNORECASE)
    for match in matches:
        # Split by common delimiters
        potential_skills = re.split(r'[,;•·|]', match)
        for skill in potential_skills:
            clean_skill = skill.strip().lower()
            # Clean out markdown/formatting
            clean_skill = re.sub(r'\*+', '', clean_skill).strip()
            if 2 < len(clean_skill) < 30 and clean_skill not in found_keywords:
                found_keywords.append(clean_skill)
    
    # Ensure we have at least some keywords
    if len(found_keywords) == 0:
        found_keywords = ["detail-oriented", "motivated", "team player"]
    
    return list(set(found_keywords))[:25]  # Return max 25 unique keywords


@router.post("/parse", response_model=JDParseResponse)
async def parse_job_description(
    request: JDParseRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """Parse a job description and extract role, domain, and keywords."""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Job description text cannot be empty")
    
    role = extract_role(request.text)
    domain = extract_domain(request.text)
    keywords = extract_keywords(request.text)
    
    return JDParseResponse(role=role, domain=domain, keywords=keywords)


@router.post("/compute-fit-score", response_model=FitScoreResponse)
async def compute_fit_score(
    request: FitScoreRequest,
    current_user: UserInDB = Depends(get_current_user)
):
    """Compute fit score between resume content and JD keywords."""
    if not request.keywords:
        return FitScoreResponse(score=100, matched_keywords=[], missing_keywords=[])
    
    # Build resume text from content
    resume_parts = []
    
    # Summary
    if request.resume_content.get("summary"):
        resume_parts.append(request.resume_content["summary"])
    
    # Experience descriptions
    for exp in request.resume_content.get("experience", []):
        if isinstance(exp.get("description"), list):
            resume_parts.extend(exp["description"])
        elif isinstance(exp.get("description"), str):
            resume_parts.append(exp["description"])
    
    # Skills
    for skill in request.resume_content.get("skills", []):
        if isinstance(skill, dict):
            resume_parts.append(skill.get("name", ""))
        elif isinstance(skill, str):
            resume_parts.append(skill)
    
    resume_text = " ".join(resume_parts).lower()
    
    matched = []
    missing = []
    
    for keyword in request.keywords:
        if keyword.lower() in resume_text:
            matched.append(keyword)
        else:
            missing.append(keyword)
    
    total = len(request.keywords)
    score = round((len(matched) / total) * 100) if total > 0 else 100
    
    return FitScoreResponse(
        score=score,
        matched_keywords=matched,
        missing_keywords=missing
    )
