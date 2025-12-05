// src/utils/resumeParser.ts

export interface Experience {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string[];
}

export interface Education {
  degree: string;
  institution: string;
  graduationDate: string;
}

export interface Skill {
  name: string;
  level?: string; // e.g., "Expert", "Proficient"
}

export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  linkedin?: string;
  summary?: string;
  experience: Experience[];
  education: Education[];
  skills: Skill[];
}

/**
 * Mock function to simulate parsing a resume file (PDF/DOCX).
 *
 * IMPORTANT: In a real application, robust parsing of PDF/DOCX files to extract
 * structured data typically requires a backend service with advanced Natural Language Processing (NLP)
 * capabilities or a very sophisticated client-side library. This mock function
 * returns static predefined data to simulate the process for a frontend-only environment.
 */
export const parseResumeFile = (file: File): Promise<ParsedResume> => {
  console.log(`Simulating parsing for file: ${file.name}`);

  // Simulate a delay for parsing
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        name: "Alex Johnson",
        email: "alex.johnson@example.com",
        phone: "555-123-4567",
        linkedin: "linkedin.com/in/alexjohnson",
        summary: "Highly motivated and results-oriented professional with experience in software development and project management. Seeking to leverage technical skills and leadership abilities to contribute to innovative projects.",
        experience: [
          {
            title: "Software Engineer Intern",
            company: "Tech Solutions Inc.",
            startDate: "May 2023",
            endDate: "Aug 2023",
            description: [
              "Developed and maintained web applications using React and Node.js.",
              "Collaborated with a team of 5 engineers on agile sprints.",
              "Implemented new features and fixed bugs, improving user experience by 15%."
            ],
          },
          {
            title: "Project Assistant",
            company: "University Research Lab",
            startDate: "Sep 2022",
            endDate: "Apr 2023",
            description: [
              "Assisted in data collection and analysis for a research project.",
              "Managed project documentation and communicated updates to stakeholders."
            ],
          },
        ],
        education: [
          {
            degree: "B.S. in Computer Science",
            institution: "State University",
            graduationDate: "May 2024",
          },
        ],
        skills: [
          { name: "JavaScript", level: "Proficient" },
          { name: "React", level: "Proficient" },
          { name: "Node.js", level: "Intermediate" },
          { name: "Python", level: "Intermediate" },
          { name: "SQL", level: "Basic" },
          { name: "Git", level: "Proficient" },
          { name: "Agile Methodologies", level: "Proficient" },
          { name: "Project Management", level: "Basic" },
        ],
      });
    }, 1500); // Simulate 1.5 seconds parsing time
  });
};