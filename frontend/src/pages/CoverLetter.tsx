"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Mail, Download, ArrowLeft } from "lucide-react";
import { useResumes } from "@/context/ResumeContext";
import { usePlaylists, JobEntry } from "@/context/PlaylistContext";
import { useAuth } from "@/context/AuthContext";
import { generateCoverLetter } from "@/utils/coverLetterGenerator";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

const CoverLetter = () => {
  const { isAuthenticated, currentUser } = useAuth();
  const { masterResume, versionResumes, getResumeById } = useResumes();
  const { playlists } = usePlaylists();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [selectedResumeId, setSelectedResumeId] = useState<string | undefined>(undefined);
  const [selectedJobEntryId, setSelectedJobEntryId] = useState<string | undefined>(undefined);
  const [generatedLetter, setGeneratedLetter] = useState<string>("");

  const allResumes = masterResume ? [masterResume, ...versionResumes] : [...versionResumes];
  const allJobEntries = playlists.flatMap(p => p.jobEntries);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Pre-select resume from URL param if available
    const resumeIdParam = searchParams.get('resumeId');
    if (resumeIdParam && getResumeById(resumeIdParam)) {
      setSelectedResumeId(resumeIdParam);
    } else if (!selectedResumeId && masterResume) {
      // Otherwise, pre-select master resume if available and no other resume is selected
      setSelectedResumeId(masterResume.id);
    } else if (!selectedResumeId && versionResumes.length > 0) {
      // Or pre-select the first version resume if no master
      setSelectedResumeId(versionResumes[0].id);
    }
  }, [masterResume, versionResumes, selectedResumeId, searchParams, getResumeById]);

  const handleGenerateLetter = () => {
    if (!selectedResumeId || !selectedJobEntryId) {
      toast.error("Please select both a resume and a job entry.");
      return;
    }

    const resume = getResumeById(selectedResumeId);
    const jobEntry = allJobEntries.find(job => job.id === selectedJobEntryId);

    if (!resume || !jobEntry) {
      toast.error("Selected resume or job entry not found.");
      return;
    }

    const letter = generateCoverLetter(resume.content, jobEntry, jobEntry.parsedJd || null);
    setGeneratedLetter(letter);
    toast.success("Cover letter generated!");
  };

  const handleDownloadLetter = () => {
    if (!generatedLetter) {
      toast.error("No cover letter to download.");
      return;
    }

    const resume = getResumeById(selectedResumeId!);
    const jobEntry = allJobEntries.find(job => job.id === selectedJobEntryId!);

    const filename = `CoverLetter_${resume?.name.replace(/\s/g, '_') || 'Resume'}_${jobEntry?.roleTitle.replace(/\s/g, '_') || 'Job'}.txt`;

    const element = document.createElement("a");
    const file = new Blob([generatedLetter], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Cover letter downloaded as plain text.");
  };

  if (!isAuthenticated || !currentUser) {
    return null; // Redirect handled by useEffect
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Button variant="outline" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <h1 className="text-3xl font-bold mb-4">Cover Letter Generator</h1>
      <p className="text-muted-foreground mb-6">
        Generate a tailored cover letter using your resume and a specific job description.
      </p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" /> Select Resume & Job
          </CardTitle>
          <CardDescription>Choose the resume version and job entry for your cover letter.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="select-resume">Select Resume</Label>
            <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
              <SelectTrigger id="select-resume">
                <SelectValue placeholder="Select a Resume" />
              </SelectTrigger>
              <SelectContent>
                {allResumes.map(resume => (
                  <SelectItem key={resume.id} value={resume.id}>
                    {resume.name} ({resume.type === 'master' ? 'Master' : 'Version'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="select-job">Select Job Entry</Label>
            <Select value={selectedJobEntryId} onValueChange={setSelectedJobEntryId}>
              <SelectTrigger id="select-job">
                <SelectValue placeholder="Select a Job Entry" />
              </SelectTrigger>
              <SelectContent>
                {allJobEntries.map(job => (
                  <SelectItem key={job.id} value={job.id}>
                    {job.roleTitle} (Deadline: {job.applicationDeadline})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2">
            <Button onClick={handleGenerateLetter} disabled={!selectedResumeId || !selectedJobEntryId} className="w-full">
              <Mail className="mr-2 h-4 w-4" /> Generate Cover Letter
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedLetter && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-6 w-6" /> Generated Cover Letter
            </CardTitle>
            <CardDescription>Edit and customize your tailored cover letter, then download.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={generatedLetter}
              onChange={(e) => setGeneratedLetter(e.target.value)}
              rows={20}
              className="font-mono text-sm"
              placeholder="Your cover letter will appear here..."
            />
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleDownloadLetter} className="flex-1">
                <Download className="mr-2 h-4 w-4" /> Download Cover Letter (TXT)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CoverLetter;