"use client";

import React from "react";
import { ParsedResume, Experience, Education, Skill } from "@/utils/resumeParser";
import { ParsedJobDescription } from "@/utils/jdParser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface MasterResumeDisplayProps {
  resume: ParsedResume;
  jobDescription?: ParsedJobDescription | null;
  fitScore: number;
  matchedKeywords?: string[];
  missingKeywords?: string[];
}

// Helper to highlight keywords in text
const highlightKeywords = (text: string, keywords: string[]) => {
  if (!keywords || keywords.length === 0) return text;

  const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
  return text.split(regex).map((part, index) =>
    regex.test(part) ? (
      <span key={index} className="bg-green-200 dark:bg-green-700 rounded px-0.5">
        {part}
      </span>
    ) : (
      part
    )
  );
};

const MasterResumeDisplay: React.FC<MasterResumeDisplayProps> = ({
  resume,
  jobDescription,
  fitScore,
  matchedKeywords,
  missingKeywords
}) => {
  const jdKeywords = jobDescription?.keywords || [];

  // Calculate matched/missing if not provided
  const computedMatchedKeywords = matchedKeywords || jdKeywords.filter(keyword => {
    const resumeText = [
      resume.summary || "",
      ...resume.experience.flatMap(exp => exp.description),
      ...resume.skills.map(skill => skill.name)
    ].join(" ").toLowerCase();
    return resumeText.includes(keyword.toLowerCase());
  });

  const computedMissingKeywords = missingKeywords || jdKeywords.filter(
    keyword => !computedMatchedKeywords.includes(keyword)
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center flex-wrap gap-2">
          <span>Master Resume: {resume.name}</span>
          {jobDescription && (
            <Badge
              variant={fitScore >= 70 ? "default" : fitScore >= 40 ? "secondary" : "destructive"}
              className="text-lg px-3 py-1"
            >
              Fit Score: {fitScore}%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Keyword Match Summary */}
        {jobDescription && jdKeywords.length > 0 && (
          <div className="border rounded-lg p-4 bg-muted/50">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <span>Keyword Analysis</span>
            </h3>

            {/* Matched Keywords */}
            {computedMatchedKeywords.length > 0 && (
              <div className="mb-3">
                <div className="flex items-center gap-1 mb-2 text-green-600 dark:text-green-400">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">Matched Keywords ({computedMatchedKeywords.length})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {computedMatchedKeywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-300">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Keywords */}
            {computedMissingKeywords.length > 0 && (
              <div>
                <div className="flex items-center gap-1 mb-2 text-orange-600 dark:text-orange-400">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Missing Keywords ({computedMissingKeywords.length})</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {computedMissingKeywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="bg-orange-50 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300">
                      {keyword}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Consider adding these keywords to improve your fit score.
                </p>
              </div>
            )}
          </div>
        )}

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