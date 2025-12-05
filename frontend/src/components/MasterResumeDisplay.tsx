"use client";

import React from "react";
import { ParsedResume, Experience, Education, Skill } from "@/utils/resumeParser";
import { ParsedJobDescription } from "@/utils/jdParser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MasterResumeDisplayProps {
  resume: ParsedResume;
  jobDescription?: ParsedJobDescription | null;
  fitScore: number;
}

// Helper to highlight keywords in text
const highlightKeywords = (text: string, keywords: string[]) => {
  if (!keywords || keywords.length === 0) return text;

  const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
  return text.split(regex).map((part, index) =>
    regex.test(part) ? (
      <span key={index} className="bg-yellow-200 dark:bg-yellow-700 rounded px-0.5">
        {part}
      </span>
    ) : (
      part
    )
  );
};

const MasterResumeDisplay: React.FC<MasterResumeDisplayProps> = ({ resume, jobDescription, fitScore }) => {
  const jdKeywords = jobDescription?.keywords || [];

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Master Resume: {resume.name}</span>
          {jobDescription && (
            <Badge variant="secondary" className="text-lg px-3 py-1">
              Fit Score: {fitScore}%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Contact Information */}
        <div className="border-b pb-4">
          <h3 className="text-xl font-semibold mb-2">Contact Information</h3>
          <p><strong>Email:</strong> {resume.email}</p>
          <p><strong>Phone:</strong> {resume.phone}</p>
          {resume.linkedin && <p><strong>LinkedIn:</strong> {resume.linkedin}</p>}
        </div>

        {/* Summary */}
        {resume.summary && (
          <div className="border-b pb-4">
            <h3 className="text-xl font-semibold mb-2">Summary</h3>
            <p>{highlightKeywords(resume.summary, jdKeywords)}</p>
          </div>
        )}

        {/* Experience */}
        {resume.experience.length > 0 && (
          <div className="border-b pb-4">
            <h3 className="text-xl font-semibold mb-2">Work Experience</h3>
            {resume.experience.map((exp, index) => (
              <div key={index} className="mb-4 last:mb-0">
                <h4 className="font-medium text-lg">{highlightKeywords(exp.title, jdKeywords)} at {highlightKeywords(exp.company, jdKeywords)}</h4>
                <p className="text-sm text-muted-foreground">{exp.startDate} - {exp.endDate}</p>
                <ul className="list-disc list-inside ml-4 mt-1">
                  {exp.description.map((desc, descIndex) => (
                    <li key={descIndex}>{highlightKeywords(desc, jdKeywords)}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {resume.education.length > 0 && (
          <div className="border-b pb-4">
            <h3 className="text-xl font-semibold mb-2">Education</h3>
            {resume.education.map((edu, index) => (
              <div key={index} className="mb-4 last:mb-0">
                <h4 className="font-medium text-lg">{highlightKeywords(edu.degree, jdKeywords)}</h4>
                <p>{highlightKeywords(edu.institution, jdKeywords)}</p>
                <p className="text-sm text-muted-foreground">Graduation: {edu.graduationDate}</p>
              </div>
            ))}
          </div>
        )}

        {/* Skills */}
        {resume.skills.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {resume.skills.map((skill, index) => (
                <Badge key={index} variant={jdKeywords.some(kw => skill.name.toLowerCase().includes(kw.toLowerCase())) ? "default" : "secondary"}>
                  {highlightKeywords(skill.name, jdKeywords)} {skill.level && `(${skill.level})`}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MasterResumeDisplay;