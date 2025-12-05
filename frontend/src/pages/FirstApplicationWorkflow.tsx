"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { parseJobDescription, ParsedJobDescription } from "@/utils/jdParser"; // Import the parser

const FirstApplicationWorkflow = () => {
  const [step, setStep] = useState(1); // 1: Paste JD, 2: Review Parsed JD
  const [jobDescription, setJobDescription] = useState("");
  const [parsedJd, setParsedJd] = useState<ParsedJobDescription | null>(null);
  const [editedRole, setEditedRole] = useState("");
  const [editedDomain, setEditedDomain] = useState("");
  const [editedKeywords, setEditedKeywords] = useState<string[]>([]);

  const handleParseJd = () => {
    if (jobDescription.trim()) {
      const result = parseJobDescription(jobDescription);
      setParsedJd(result);
      setEditedRole(result.role);
      setEditedDomain(result.domain);
      setEditedKeywords(result.keywords);
      setStep(2); // Move to review step
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
      // TODO: Implement saving JD to a playlist (FR-006) and move to next workflow step (Resume Import)
      alert("Job Description confirmed! Next step: Resume Import (not yet implemented)");
    }
  };

  const handleBack = () => {
    setStep(1); // Go back to JD paste step
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-foreground">Guided Workflow: First Application</CardTitle>
          <CardDescription className="text-muted-foreground">
            {step === 1 && "Let's get started! Paste your job description below to begin tailoring your resume."}
            {step === 2 && "Review and confirm the extracted job details. You can make adjustments if needed."}
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                      {/* TODO: Add functionality to remove/edit keywords */}
                    </Badge>
                  ))}
                  {/* TODO: Add functionality to add new keywords */}
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
        </CardContent>
      </Card>
    </div>
  );
};

export default FirstApplicationWorkflow;