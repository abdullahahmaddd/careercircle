"use client";

import React from "react";
import { ParsedResume, Experience, Education, Skill } from "@/utils/resumeParser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PlusCircle, MinusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ResumeEditorProps {
  resume: ParsedResume;
  onChange: (updatedResume: ParsedResume) => void;
  readOnly?: boolean;
}

const ResumeEditor: React.FC<ResumeEditorProps> = ({ resume, onChange, readOnly = false }) => {
  const updateField = <K extends keyof ParsedResume>(field: K, value: ParsedResume[K]) => {
    onChange({ ...resume, [field]: value });
  };

  // Experience Handlers
  const addExperience = () => {
    onChange({
      ...resume,
      experience: [
        ...resume.experience,
        { title: "", company: "", startDate: "", endDate: "", description: [""] },
      ],
    });
  };

  const updateExperience = (index: number, field: keyof Experience, value: any) => {
    const newExperience = [...resume.experience];
    if (field === "description") {
      newExperience[index][field] = value.split('\n');
    } else {
      newExperience[index][field] = value;
    }
    onChange({ ...resume, experience: newExperience });
  };

  const removeExperience = (index: number) => {
    const newExperience = resume.experience.filter((_, i) => i !== index);
    onChange({ ...resume, experience: newExperience });
  };

  // Education Handlers
  const addEducation = () => {
    onChange({
      ...resume,
      education: [...resume.education, { degree: "", institution: "", graduationDate: "" }],
    });
  };

  const updateEducation = (index: number, field: keyof Education, value: any) => {
    const newEducation = [...resume.education];
    newEducation[index][field] = value;
    onChange({ ...resume, education: newEducation });
  };

  const removeEducation = (index: number) => {
    const newEducation = resume.education.filter((_, i) => i !== index);
    onChange({ ...resume, education: newEducation });
  };

  // Skills Handlers
  const addSkill = () => {
    onChange({
      ...resume,
      skills: [...resume.skills, { name: "", level: "" }],
    });
  };

  const updateSkill = (index: number, field: keyof Skill, value: any) => {
    const newSkills = [...resume.skills];
    newSkills[index][field] = value;
    onChange({ ...resume, skills: newSkills });
  };

  const removeSkill = (index: number) => {
    const newSkills = resume.skills.filter((_, i) => i !== index);
    onChange({ ...resume, skills: newSkills });
  };

  return (
    <div className="space-y-8">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={resume.name}
              onChange={(e) => updateField("name", e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={resume.email}
              onChange={(e) => updateField("email", e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={resume.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              disabled={readOnly}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="linkedin">LinkedIn (Optional)</Label>
            <Input
              id="linkedin"
              value={resume.linkedin || ""}
              onChange={(e) => updateField("linkedin", e.target.value)}
              disabled={readOnly}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="summary">Summary</Label>
          <Textarea
            id="summary"
            value={resume.summary || ""}
            onChange={(e) => updateField("summary", e.target.value)}
            rows={5}
            disabled={readOnly}
          />
        </CardContent>
      </Card>

      {/* Experience */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Work Experience</CardTitle>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={addExperience}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Experience
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {resume.experience.map((exp, index) => (
            <div key={index} className="border p-4 rounded-md relative">
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                  onClick={() => removeExperience(index)}
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label htmlFor={`exp-title-${index}`}>Title</Label>
                  <Input
                    id={`exp-title-${index}`}
                    value={exp.title}
                    onChange={(e) => updateExperience(index, "title", e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`exp-company-${index}`}>Company</Label>
                  <Input
                    id={`exp-company-${index}`}
                    value={exp.company}
                    onChange={(e) => updateExperience(index, "company", e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`exp-start-${index}`}>Start Date</Label>
                  <Input
                    id={`exp-start-${index}`}
                    value={exp.startDate}
                    onChange={(e) => updateExperience(index, "startDate", e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`exp-end-${index}`}>End Date</Label>
                  <Input
                    id={`exp-end-${index}`}
                    value={exp.endDate}
                    onChange={(e) => updateExperience(index, "endDate", e.target.value)}
                    disabled={readOnly}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor={`exp-desc-${index}`}>Description (one bullet point per line)</Label>
                <Textarea
                  id={`exp-desc-${index}`}
                  value={exp.description.join('\n')}
                  onChange={(e) => updateExperience(index, "description", e.target.value)}
                  rows={3}
                  disabled={readOnly}
                />
              </div>
            </div>
          ))}
          {resume.experience.length === 0 && <p className="text-muted-foreground">No experience added yet.</p>}
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Education</CardTitle>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={addEducation}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Education
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {resume.education.map((edu, index) => (
            <div key={index} className="border p-4 rounded-md relative">
              {!readOnly && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 text-destructive hover:bg-destructive/10"
                  onClick={() => removeEducation(index)}
                >
                  <MinusCircle className="h-4 w-4" />
                </Button>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`edu-degree-${index}`}>Degree</Label>
                  <Input
                    id={`edu-degree-${index}`}
                    value={edu.degree}
                    onChange={(e) => updateEducation(index, "degree", e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`edu-institution-${index}`}>Institution</Label>
                  <Input
                    id={`edu-institution-${index}`}
                    value={edu.institution}
                    onChange={(e) => updateEducation(index, "institution", e.target.value)}
                    disabled={readOnly}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`edu-grad-date-${index}`}>Graduation Date</Label>
                  <Input
                    id={`edu-grad-date-${index}`}
                    value={edu.graduationDate}
                    onChange={(e) => updateEducation(index, "graduationDate", e.target.value)}
                    disabled={readOnly}
                  />
                </div>
              </div>
            </div>
          ))}
          {resume.education.length === 0 && <p className="text-muted-foreground">No education added yet.</p>}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Skills</CardTitle>
          {!readOnly && (
            <Button variant="outline" size="sm" onClick={addSkill}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Skill
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {resume.skills.map((skill, index) => (
              <div key={index} className="relative group">
                <Badge variant="secondary" className="flex items-center gap-1 pr-6">
                  <Input
                    className="bg-transparent border-none p-0 h-auto focus-visible:ring-0 focus-visible:outline-none"
                    value={skill.name}
                    onChange={(e) => updateSkill(index, "name", e.target.value)}
                    disabled={readOnly}
                    placeholder="Skill Name"
                  />
                  {skill.level && (
                    <Input
                      className="bg-transparent border-none p-0 h-auto focus-visible:ring-0 focus-visible:outline-none w-20"
                      value={skill.level}
                      onChange={(e) => updateSkill(index, "level", e.target.value)}
                      disabled={readOnly}
                      placeholder="Level"
                    />
                  )}
                </Badge>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeSkill(index)}
                  >
                    <MinusCircle className="h-3 w-3" />
                  </Button>
                )}
              </div>
            ))}
            {resume.skills.length === 0 && <p className="text-muted-foreground">No skills added yet.</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResumeEditor;