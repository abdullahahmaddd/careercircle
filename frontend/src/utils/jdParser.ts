// src/utils/jdParser.ts
import api from '@/lib/api';

export interface ParsedJobDescription {
  role: string;
  domain: string;
  keywords: string[];
}

export interface FitScoreResult {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
}

/**
 * Parse job description using the backend API.
 * Falls back to local parsing if API fails.
 */
export const parseJobDescriptionAPI = async (jdText: string): Promise<ParsedJobDescription> => {
  try {
    const response = await api.post<ParsedJobDescription>('/jd/parse', { text: jdText });
    return response.data;
  } catch (error) {
    console.warn('Backend JD parsing failed, using local fallback:', error);
    return parseJobDescriptionLocal(jdText);
  }
};

/**
 * Compute fit score using the backend API.
 * Falls back to local calculation if API fails.
 */
export const computeFitScoreAPI = async (
  resumeContent: { summary?: string; experience: { description: string[] }[]; skills: { name: string }[] },
  keywords: string[]
): Promise<FitScoreResult> => {
  try {
    const response = await api.post<{ score: number; matched_keywords: string[]; missing_keywords: string[] }>(
      '/jd/compute-fit-score',
      { resume_content: resumeContent, keywords }
    );
    return {
      score: response.data.score,
      matchedKeywords: response.data.matched_keywords,
      missingKeywords: response.data.missing_keywords,
    };
  } catch (error) {
    console.warn('Backend fit score failed, using local fallback:', error);
    const score = calculateFitScoreLocal(resumeContent, keywords);
    const { matched, missing } = getMatchedAndMissingKeywords(resumeContent, keywords);
    return { score, matchedKeywords: matched, missingKeywords: missing };
  }
};

/**
 * Local/fallback function to parse a job description.
 */
export const parseJobDescriptionLocal = (jdText: string): ParsedJobDescription => {
  const lowerCaseJd = jdText.toLowerCase();
  let role = "Unknown Role";
  let domain = "General";
  let keywords: string[] = [];

  // Simple role extraction (e.g., first line, or after common phrases)
  const roleMatch = jdText.match(/^(.*?)(?:\n|\.|\s-\s)/);
  if (roleMatch && roleMatch[1].length < 100) { // Avoid parsing entire JD as role
    role = roleMatch[1].trim();
  } else if (lowerCaseJd.includes("software engineer")) {
    role = "Software Engineer";
  } else if (lowerCaseJd.includes("marketing manager")) {
    role = "Marketing Manager";
  } else if (lowerCaseJd.includes("data scientist")) {
    role = "Data Scientist";
  }

  // Simple domain extraction
  if (lowerCaseJd.includes("tech") || lowerCaseJd.includes("software")) {
    domain = "Technology";
  } else if (lowerCaseJd.includes("finance") || lowerCaseJd.includes("banking")) {
    domain = "Finance";
  } else if (lowerCaseJd.includes("healthcare") || lowerCaseJd.includes("medical")) {
    domain = "Healthcare";
  } else if (lowerCaseJd.includes("marketing") || lowerCaseJd.includes("sales")) {
    domain = "Marketing & Sales";
  }

  // Simple keyword extraction
  const commonKeywords = [
    "react", "typescript", "javascript", "python", "java", "aws", "azure", "gcp",
    "agile", "scrum", "project management", "sql", "nosql", "data analysis",
    "marketing strategy", "seo", "sem", "social media", "content creation",
    "financial modeling", "risk management", "investment", "customer service",
    "communication", "leadership", "teamwork", "problem-solving"
  ];

  keywords = commonKeywords.filter(keyword => lowerCaseJd.includes(keyword));

  // Add some default keywords if none found
  if (keywords.length === 0) {
    keywords.push("detail-oriented", "motivated", "innovative");
  }

  return { role, domain, keywords: Array.from(new Set(keywords)) }; // Ensure unique keywords
};

/**
 * Helper to get matched and missing keywords.
 */
const getMatchedAndMissingKeywords = (
  resume: { summary?: string; experience: { description: string[] }[]; skills: { name: string }[] },
  jdKeywords: string[]
): { matched: string[]; missing: string[] } => {
  const resumeText = [
    resume.summary || "",
    ...resume.experience.flatMap(exp => exp.description),
    ...resume.skills.map(skill => skill.name)
  ].join(" ").toLowerCase();

  const matched: string[] = [];
  const missing: string[] = [];

  jdKeywords.forEach(keyword => {
    if (resumeText.includes(keyword.toLowerCase())) {
      matched.push(keyword);
    } else {
      missing.push(keyword);
    }
  });

  return { matched, missing };
};

/**
 * Local/fallback fit score calculation.
 */
const calculateFitScoreLocal = (
  resume: { summary?: string; experience: { description: string[] }[]; skills: { name: string }[] },
  jdKeywords: string[]
): number => {
  if (!jdKeywords || jdKeywords.length === 0) return 100; // If no JD keywords, perfect fit

  const { matched } = getMatchedAndMissingKeywords(resume, jdKeywords);
  return Math.round((matched.length / jdKeywords.length) * 100);
};

// Backwards compatibility exports
export const parseJobDescription = parseJobDescriptionLocal;
export const calculateFitScore = calculateFitScoreLocal;