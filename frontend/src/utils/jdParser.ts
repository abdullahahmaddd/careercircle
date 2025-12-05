// src/utils/jdParser.ts

export interface ParsedJobDescription {
  role: string;
  domain: string;
  keywords: string[];
}

/**
 * Mock function to parse a job description.
 * In a real application, this would involve NLP or a backend service.
 * For frontend-only, we simulate extraction based on common patterns.
 */
export const parseJobDescription = (jdText: string): ParsedJobDescription => {
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