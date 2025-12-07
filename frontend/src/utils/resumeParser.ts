// src/utils/resumeParser.ts
import api from '@/lib/api';

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
 * Parses a resume file by sending it to the backend API.
 */
export const parseResumeFile = async (file: File): Promise<ParsedResume> => {
  console.log(`Sending file to backend for parsing: ${file.name}`);

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post<ParsedResume>('/resumes/parse', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  } catch (error: any) {
    console.error('Error parsing resume:', error);
    const errorMessage = error.response?.data?.detail || 'Failed to parse resume. Please try again.';
    throw new Error(errorMessage);
  }
};