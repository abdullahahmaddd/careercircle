// src/utils/coverLetterGenerator.ts

import { ParsedResume } from "./resumeParser";
import { ParsedJobDescription } from "./jdParser";
import { JobEntry } from "@/context/PlaylistContext";

/**
 * Mock function to generate a cover letter based on resume, job description, and job entry details.
 * This is a simplified, frontend-only implementation that generates a plain text letter.
 */
export const generateCoverLetter = (
  resume: ParsedResume,
  jobEntry: JobEntry,
  parsedJd: ParsedJobDescription | null
): string => {
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const recipientName = "Hiring Manager"; // Mock recipient
  const companyName = jobEntry.parsedJd?.domain || "Company"; // Use domain as company name for mock
  const jobTitle = jobEntry.roleTitle;

  let coverLetterContent = `
${today}

${resume.name}
${resume.email}
${resume.phone}
${resume.linkedin ? `LinkedIn: ${resume.linkedin}` : ''}

${recipientName}
${companyName}
[Company Address, if known - Mock]

Dear ${recipientName},

I am writing to express my enthusiastic interest in the ${jobTitle} position at ${companyName}, as advertised on [Platform - Mock]. With my background in ${resume.experience[0]?.title || 'relevant field'} and a strong passion for ${parsedJd?.domain || 'this industry'}, I am confident I can make a significant contribution to your team.

In my previous role as a ${resume.experience[0]?.title || 'professional'} at ${resume.experience[0]?.company || 'a previous organization'}, I ${resume.experience[0]?.description[0] || 'gained valuable experience in key areas'}. My skills in ${resume.skills.map(s => s.name).slice(0, 3).join(', ') || 'various technologies'} align well with the requirements outlined in your job description. I am particularly drawn to ${companyName}'s commitment to [Company Value/Mission - Mock] and believe my proactive approach and problem-solving abilities would be a great asset.

I am eager to bring my dedication and capabilities to ${companyName} and contribute to your continued success. Thank you for your time and consideration. I have attached my resume for your review and welcome the opportunity to discuss how my qualifications can benefit your organization.

Sincerely,
${resume.name}
`;

  return coverLetterContent.trim();
};