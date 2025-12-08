// src/utils/coverLetterGenerator.ts

import { ParsedResume } from "./resumeParser";
import { ParsedJobDescription } from "./jdParser";
import { JobEntry } from "@/context/PlaylistContext";

/**
 * Generate a professional cover letter based on resume, job description, and job entry details.
 * Uses the resume content and JD keywords to create personalized content.
 */
export const generateCoverLetter = (
  resume: ParsedResume,
  jobEntry: JobEntry,
  parsedJd: ParsedJobDescription | null
): string => {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const jobTitle = jobEntry.roleTitle || parsedJd?.role || "the open position";
  const domain = parsedJd?.domain || "this industry";

  // Extract key information
  const latestRole = resume.experience[0]?.title || "my previous role";
  const latestCompany = resume.experience[0]?.company || "my previous organization";
  const yearsOfExperience = resume.experience.length > 0 ? `${resume.experience.length}+` : "several";

  // Get top skills that match JD keywords (or just top skills if no JD)
  const jdKeywords = parsedJd?.keywords || [];
  const matchedSkills = resume.skills
    .filter(skill => jdKeywords.some(kw => skill.name.toLowerCase().includes(kw.toLowerCase())))
    .map(s => s.name);
  const topSkills = matchedSkills.length > 0
    ? matchedSkills.slice(0, 4)
    : resume.skills.slice(0, 4).map(s => s.name);

  // Get a relevant achievement from experience
  const keyAchievement = resume.experience[0]?.description?.[0] ||
    "successfully delivered impactful projects and contributed to team success";

  // Education highlight
  const education = resume.education[0];
  const educationLine = education
    ? `a ${education.degree} from ${education.institution}`
    : "a strong educational background";

  // Build the letter with professional structure
  const coverLetterContent = `
${today}

${resume.name}
${resume.email}
${resume.phone}${resume.linkedin ? `\nLinkedIn: ${resume.linkedin}` : ""}

Dear Hiring Manager,

I am writing to express my strong interest in the ${jobTitle} position. With ${yearsOfExperience} years of experience in ${domain} and a proven track record in ${latestRole}, I am excited about the opportunity to contribute to your team.

In my current role as ${latestRole} at ${latestCompany}, I have ${keyAchievement.charAt(0).toLowerCase() + keyAchievement.slice(1)}. This experience has honed my skills in ${topSkills.join(", ")}${topSkills.length > 0 ? "," : ""} which I believe align well with the requirements for this role.

${jdKeywords.length > 0 ? `What particularly excites me about this opportunity is the chance to apply my expertise in ${jdKeywords.slice(0, 3).join(", ")} to make a meaningful impact. ` : ""}I am passionate about delivering high-quality work and thrive in collaborative environments where I can both contribute to and learn from a talented team.

Throughout my career, I have developed:
• Strong technical proficiency in ${topSkills.slice(0, 2).join(" and ") || "relevant technologies"}
• Experience working in fast-paced, deadline-driven environments
• Excellent communication and problem-solving skills
• ${educationLine}

I am confident that my combination of technical skills, hands-on experience, and dedication to continuous improvement make me a strong candidate for this position. I would welcome the opportunity to discuss how my background, skills, and enthusiasm can contribute to your organization's success.

Thank you for considering my application. I look forward to the possibility of speaking with you about this exciting opportunity.

Sincerely,
${resume.name}
`;

  return coverLetterContent.trim();
};

/**
 * Generate a shorter, more casual cover letter for quick applications.
 */
export const generateShortCoverLetter = (
  resume: ParsedResume,
  jobEntry: JobEntry,
  parsedJd: ParsedJobDescription | null
): string => {
  const jobTitle = jobEntry.roleTitle || parsedJd?.role || "the open position";
  const latestRole = resume.experience[0]?.title || "my previous role";
  const topSkills = resume.skills.slice(0, 3).map(s => s.name);

  return `
Dear Hiring Manager,

I am excited to apply for the ${jobTitle} position. With my background as ${latestRole} and expertise in ${topSkills.join(", ")}, I am confident I can make an immediate impact on your team.

I have attached my resume for your review and would love the opportunity to discuss how I can contribute to your organization.

Best regards,
${resume.name}
${resume.email}
`.trim();
};

/**
 * Get suggestions for improving the cover letter based on JD keywords.
 */
export const getCoverLetterTips = (
  resume: ParsedResume,
  parsedJd: ParsedJobDescription | null
): string[] => {
  const tips: string[] = [];
  const jdKeywords = parsedJd?.keywords || [];

  if (jdKeywords.length === 0) {
    tips.push("No job description keywords detected. Consider manually highlighting relevant skills.");
    return tips;
  }

  // Find missing keywords
  const resumeText = [
    resume.summary || "",
    ...resume.experience.flatMap(exp => exp.description),
    ...resume.skills.map(skill => skill.name)
  ].join(" ").toLowerCase();

  const missingKeywords = jdKeywords.filter(kw => !resumeText.includes(kw.toLowerCase()));

  if (missingKeywords.length > 0) {
    tips.push(`Consider addressing these JD keywords: ${missingKeywords.slice(0, 5).join(", ")}`);
  }

  if (!resume.summary || resume.summary.length < 50) {
    tips.push("Add a strong professional summary to your resume for better cover letter personalization.");
  }

  if (resume.experience.length > 0 && resume.experience[0].description.length < 2) {
    tips.push("Add more detailed achievements to your experience section for richer cover letter content.");
  }

  return tips;
};