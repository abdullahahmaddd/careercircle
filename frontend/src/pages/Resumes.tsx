"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ParsedResume, parseResumeFile } from "@/utils/resumeParser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ResumeEditor from "@/components/ResumeEditor"; // Import ResumeEditor
import MasterResumeDisplay from "@/components/MasterResumeDisplay"; // For displaying, not editing
import { Upload, FileText, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

const Resumes = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [masterResume, setMasterResume] = useState<ParsedResume | null>(null);
  const [isEditingMaster, setIsEditingMaster] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);

  // Mock storage for Master Resume
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const storedMasterResume = localStorage.getItem(`masterResume_${currentUser.id}`);
      if (storedMasterResume) {
        setMasterResume(JSON.parse(storedMasterResume));
      }
    } else {
      setMasterResume(null);
    }
  }, [isAuthenticated, currentUser]);

  const saveMasterResume = (updatedResume: ParsedResume) => {
    if (currentUser) {
      localStorage.setItem(`masterResume_${currentUser.id}`, JSON.stringify(updatedResume));
      setMasterResume(updatedResume);
      toast.success("Master Resume updated successfully!");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setUploadedFile(event.target.files[0]);
    }
  };

  const handleUploadAndParse = async () => {
    if (uploadedFile) {
      setIsParsingResume(true);
      try {
        const resumeData = await parseResumeFile(uploadedFile);
        saveMasterResume(resumeData);
        setIsEditingMaster(true); // Go into edit mode after parsing
        toast.success("Resume parsed and set as Master Resume. Review and save!");
      } catch (error) {
        console.error("Error parsing resume:", error);
        toast.error("Failed to parse resume. Please try again.");
      } finally {
        setIsParsingResume(false);
        setUploadedFile(null); // Clear file input
      }
    } else {
      toast.error("Please select a resume file to upload.");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Resumes</h1>
        <p className="text-muted-foreground">Please log in to manage your resumes.</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Resumes</h1>
      <p className="text-muted-foreground mb-6">Manage your Master Resume and create tailored Version Resumes here.</p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" /> Master Resume
          </CardTitle>
          <CardDescription>Your comprehensive professional profile.</CardDescription>
        </CardHeader>
        <CardContent>
          {masterResume ? (
            <>
              {isEditingMaster ? (
                <ResumeEditor
                  resume={masterResume}
                  onChange={setMasterResume} // Update local state during editing
                />
              ) : (
                <MasterResumeDisplay resume={masterResume} fitScore={0} /> // Display mode
              )}
              <div className="flex gap-2 mt-6">
                {isEditingMaster ? (
                  <>
                    <Button onClick={() => {
                      saveMasterResume(masterResume!); // Save current edited state
                      setIsEditingMaster(false);
                    }}>Save Master Resume</Button>
                    <Button variant="outline" onClick={() => {
                      // Revert to last saved state
                      const storedMasterResume = localStorage.getItem(`masterResume_${currentUser?.id}`);
                      if (storedMasterResume) {
                        setMasterResume(JSON.parse(storedMasterResume));
                      }
                      setIsEditingMaster(false);
                    }}>Cancel</Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditingMaster(true)}>Edit Master Resume</Button>
                )}
                <Button variant="secondary" disabled={!masterResume}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Create New Version
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground">You don't have a Master Resume yet. Import one to get started!</p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="flex-1"
                />
                <Button onClick={handleUploadAndParse} disabled={!uploadedFile || isParsingResume}>
                  {isParsingResume ? "Parsing..." : "Upload & Parse"} <Upload className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Placeholder for Version Resumes List */}
      <Card>
        <CardHeader>
          <CardTitle>Version Resumes</CardTitle>
          <CardDescription>Tailored resumes for specific job applications.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Version resume management will be fully implemented here in a future iteration.
            For now, you can create a version resume through the "First Application" workflow.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Resumes;