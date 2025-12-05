"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const FirstApplicationWorkflow = () => {
  const [jobDescription, setJobDescription] = useState("");

  const handleNextStep = () => {
    console.log("Job Description submitted:", jobDescription);
    // TODO: Implement JD parsing and move to the next step (e.g., save to playlist)
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-foreground">Guided Workflow: First Application</CardTitle>
          <CardDescription className="text-muted-foreground">
            Let's get started! Paste your job description below to begin tailoring your resume.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <label htmlFor="job-description" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Paste Job Description
            </label>
            <Textarea
              id="job-description"
              placeholder="Paste the full job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              rows={15}
              className="min-h-[200px]"
            />
            <Button onClick={handleNextStep} disabled={!jobDescription.trim()}>
              Parse JD & Next Step <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FirstApplicationWorkflow;