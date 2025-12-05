"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, CheckCircle2, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { parseJobDescription, ParsedJobDescription } from "@/utils/jdParser";
import { parseResumeFile, ParsedResume, Experience, Education, Skill } from "@/utils/resumeParser"; // Import resume parser

const FirstApplicationWorkflow = () => {
  const [step, setStep] = useState(1); // 1: Paste JD, 2: Review Parsed JD, 3: Resume Import, 4: Review Parsed Resume
  const [jobDescription, setJobDescription] = useState("");
  const [parsedJd, setParsedJd] = useState<ParsedJobDescription | null>(null);
  const [editedRole, setEditedRole] = useState("");
  const [editedDomain, setEditedDomain] = useState("");
  const [editedKeywords, setEditedKeywords] = useState<string[]>([]);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);

  // State for editable resume fields
  const [editedResumeName, setEditedResumeName] = useState("");
  const [editedResumeEmail, setEditedResumeEmail] = useState("");
  const [editedResumePhone, setEditedResumePhone] = useState("");
  const [editedResumeLinkedin, setEditedResumeLinkedin] = useState("");
  const [editedResumeSummary, setEditedResumeSummary] = useState("");
  const [editedResumeExperience, setEditedResumeExperience] = useState<Experience[]>([]);
  const [editedResumeEducation, setEditedResumeEducation] = useState<Education[]>([]);
  const [editedResumeSkills, setEditedResumeSkills] = useState<Skill[]>([]);

  const handleParseJd = () => {
    if (jobDescription.trim()) {
      const result = parseJobDescription(jobDescription);
      setParsedJd(result);
      setEditedRole(result.role);
      setEditedDomain(result.domain);
      setEditedKeywords(result.keywords);
      setStep(2); // Move to review JD step
    }
  };

  const handleConfirmJd = () => {
    if (parsedJd) {
      // In a real app, you'd save this to state/context/backend
      const finalJd = {
        ...parsedJd,
        role: editedRole,
        domain: editedDomain,
        keywords: editedKeywords,
      };
      console.log("Confirmed JD:", finalJd);
      // TODO: Implement saving JD to a playlist (FR-006)
      setStep(3); // Move to Resume Import step
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setUploadedFile(event.target.files[0]);
    }
  };

  const handleUploadResume = async () => {
    if (uploadedFile) {
      setIsParsingResume(true);
      try {
        const resumeData = await parseResumeFile(uploadedFile);
        setParsedResume(resumeData);
        // Initialize editable states with parsed data
        setEditedResumeName(resumeData.name);
        setEditedResumeEmail(resumeData.email);
        setEditedResumePhone(resumeData.phone);
        setEditedResumeLinkedin(resumeData.linkedin || "");
        setEditedResumeSummary(resumeData.summary || "");
        setEditedResumeExperience(resumeData.experience);
        setEditedResumeEducation(resumeData.education);
        setEditedResumeSkills(resumeData.skills);
        setStep(4); // Move to review parsed resume step
      } catch (error) {
        console.error("Error parsing resume:", error);
        alert("Failed to parse resume. Please try again.");
      } finally {
        setIsParsingResume(false);
      }
    } else {
      alert("Please select a resume file to upload.");
    }
  };

  const handleConfirmResume = () => {
    if (parsedResume) {
      const finalResume = {
        name: editedResumeName,
        email: editedResumeEmail,
        phone: editedResumePhone,
        linkedin: editedResumeLinkedin,
        summary: editedResumeSummary,
        experience: editedResumeExperience,
        education: editedResumeEducation,
        skills: editedResumeSkills,
      };
      console.log("Confirmed Resume:", finalResume);
      // TODO: Implement creating Master Resume (FR-003)
      alert("Resume confirmed! Master Resume created (mock). Next step: Generate Version Resume.");
      // For now, let's reset to step 1 or navigate away
      setStep(1);
      setJobDescription("");
      setParsedJd(null);
      setUploadedFile(null);
      setParsedResume(null);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-foreground">Guided Workflow: First Application</CardTitle>
          <CardDescription className="text-muted-foreground">
            {step === 1 && "Let's get started! Paste your job description below to begin tailoring your resume."}
            {step === 2 && "Review and confirm the extracted job details. You can make adjustments if needed."}
            {step === 3 && "Now, let's import your existing resume to create your Master Resume."}
            {step === 4 && "Review the parsed resume data. Make any necessary edits before creating your Master Resume."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step 1: Paste JD */}
          {step === 1 && (
            <div className="space-y-4">
              <Label htmlFor="job-description">Paste Job Description</Label>
              <Textarea
                id="job-description"
                placeholder="Paste the full job description here..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={15}
                className="min-h-[200px]"
              />
              <Button onClick={handleParseJd} disabled={!jobDescription.trim()}>
                Parse JD & Next Step <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Review Parsed JD */}
          {step === 2 && parsedJd && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="role">Role/Title</Label>
                <Input
                  id="role"
                  value={editedRole}
                  onChange={(e) => setEditedRole(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={editedDomain}
                  onChange={(e) => setEditedDomain(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Keywords</Label>
                <div className="flex flex-wrap gap-2">
                  {editedKeywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {keyword}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  (Keywords are extracted to help tailor your resume. Full editing functionality for keywords will be added later.)
                </p>
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleConfirmJd}>
                  Confirm & Save Job <CheckCircle2 className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Resume Import */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="resume-upload">Upload your existing resume (PDF or DOCX)</Label>
                <Input
                  id="resume-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
                <p className="text-sm text-muted-foreground">
                  (This is a mock upload. We'll simulate parsing your resume data.)
                </p>
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleUploadResume} disabled={!uploadedFile || isParsingResume}>
                  {isParsingResume ? "Parsing Resume..." : "Upload & Parse Resume"} <Upload className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Review Parsed Resume */}
          {step === 4 && parsedResume && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="resume-name">Name</Label>
                  <Input id="resume-name" value={editedResumeName} onChange={(e) => setEditedResumeName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resume-email">Email</Label>
                  <Input id="resume-email" value={editedResumeEmail} onChange={(e) => setEditedResumeEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resume-phone">Phone</Label>
                  <Input id="resume-phone" value={editedResumePhone} onChange={(e) => setEditedResumePhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resume-linkedin">LinkedIn (Optional)</Label>
                  <Input id="resume-linkedin" value={editedResumeLinkedin} onChange={(e) => setEditedResumeLinkedin(e.target.value)} />
                </div>
              </div>

              <h3 className="text-xl font-semibold mb-4 mt-6">Summary</h3>
              <div className="space-y-2">
                <Label htmlFor="resume-summary">Summary</Label>
                <Textarea id="resume-summary" value={editedResumeSummary} onChange={(e) => setEditedResumeSummary(e.target.value)} rows={5} />
              </div>

              <h3 className="text-xl font-semibold mb-4 mt-6">Experience</h3>
              {editedResumeExperience.map((exp, expIndex) => (
                <Card key={expIndex} className="p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`exp-title-${expIndex}`}>Title</Label>
                      <Input id={`exp-title-${expIndex}`} value={exp.title} onChange={(e) => {
                        const newExp = [...editedResumeExperience];
                        newExp[expIndex].title = e.target.value;
                        setEditedResumeExperience(newExp);
                      }} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`exp-company-${expIndex}`}>Company</Label>
                      <Input id={`exp-company-${expIndex}`} value={exp.company} onChange={(e) => {
                        const newExp = [...editedResumeExperience];
                        newExp[expIndex].company = e.target.value;
                        setEditedResumeExperience(newExp);
                      }} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`exp-start-${expIndex}`}>Start Date</Label>
                      <Input id={`exp-start-${expIndex}`} value={exp.startDate} onChange={(e) => {
                        const newExp = [...editedResumeExperience];
                        newExp[expIndex].startDate = e.target.value;
                        setEditedResumeExperience(newExp);
                      }} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`exp-end-${expIndex}`}>End Date</Label>
                      <Input id={`exp-end-${expIndex}`} value={exp.endDate} onChange={(e) => {
                        const newExp = [...editedResumeExperience];
                        newExp[expIndex].endDate = e.target.value;
                        setEditedResumeExperience(newExp);
                      }} />
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <Label htmlFor={`exp-desc-${expIndex}`}>Description (one bullet point per line)</Label>
                    <Textarea id={`exp-desc-${expIndex}`} value={exp.description.join('\n')} onChange={(e) => {
                      const newExp = [...editedResumeExperience];
                      newExp[expIndex].description = e.target.value.split('\n');
                      setEditedResumeExperience(newExp);
                    }} rows={3} />
                  </div>
                </Card>
              ))}
              {/* TODO: Add functionality to add/remove experience entries */}

              <h3 className="text-xl font-semibold mb-4 mt-6">Education</h3>
              {editedResumeEducation.map((edu, eduIndex) => (
                <Card key={eduIndex} className="p-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`edu-degree-${eduIndex}`}>Degree</Label>
                      <Input id={`edu-degree-${eduIndex}`} value={edu.degree} onChange={(e) => {
                        const newEdu = [...editedResumeEducation];
                        newEdu[eduIndex].degree = e.target.value;
                        setEditedResumeEducation(newEdu);
                      }} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`edu-institution-${eduIndex}`}>Institution</Label>
                      <Input id={`edu-institution-${eduIndex}`} value={edu.institution} onChange={(e) => {
                        const newEdu = [...editedResumeEducation];
                        newEdu[eduIndex].institution = e.target.value;
                        setEditedResumeEducation(newEdu);
                      }} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`edu-grad-date-${eduIndex}`}>Graduation Date</Label>
                      <Input id={`edu-grad-date-${eduIndex}`} value={edu.graduationDate} onChange={(e) => {
                        const newEdu = [...editedResumeEducation];
                        newEdu[eduIndex].graduationDate = e.target.value;
                        setEditedResumeEducation(newEdu);
                      }} />
                    </div>
                  </div>
                </Card>
              ))}
              {/* TODO: Add functionality to add/remove education entries */}

              <h3 className="text-xl font-semibold mb-4 mt-6">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {editedResumeSkills.map((skill, skillIndex) => (
                  <Badge key={skillIndex} variant="secondary" className="flex items-center gap-1">
                    {skill.name} {skill.level && `(${skill.level})`}
                    {/* TODO: Add functionality to remove/edit skills */}
                  </Badge>
                ))}
                {/* TODO: Add functionality to add new skills */}
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                (Full editing functionality for resume sections will be added later.)
              </p>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleConfirmResume}>
                  Confirm & Create Master Resume <CheckCircle2 className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FirstApplicationWorkflow;