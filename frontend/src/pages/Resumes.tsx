"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { ParsedResume, parseResumeFile } from "@/utils/resumeParser";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ResumeEditor from "@/components/ResumeEditor";
import MasterResumeDisplay from "@/components/MasterResumeDisplay";
import { Upload, FileText, PlusCircle, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useResumes } from "@/context/ResumeContext"; // Import useResumes
import VersionResumeCard from "@/components/VersionResumeCard"; // Import VersionResumeCard
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const Resumes = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const { masterResume, versionResumes, saveMasterResume, updateMasterResumeContent, createVersionResume, deleteResume } = useResumes();

  const [isEditingMaster, setIsEditingMaster] = useState(false);
  const [editedMasterContent, setEditedMasterContent] = useState<ParsedResume | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);

  const [isCreateVersionDialogOpen, setIsCreateVersionDialogOpen] = useState(false);
  const [newVersionName, setNewVersionName] = useState("");

  // Initialize editedMasterContent when masterResume changes or on first load
  useEffect(() => {
    if (masterResume) {
      setEditedMasterContent(masterResume.content);
    } else {
      setEditedMasterContent(null);
    }
  }, [masterResume]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setUploadedFile(event.target.files[0]);
    }
  };

  const handleUploadAndParse = async () => {
    if (!currentUser) {
      toast.error("You must be logged in to upload a resume.");
      return;
    }
    if (uploadedFile) {
      setIsParsingResume(true);
      try {
        const resumeData = await parseResumeFile(uploadedFile);
        if (masterResume) {
          await updateMasterResumeContent(currentUser.id, resumeData);
        } else {
          await saveMasterResume(currentUser.id, resumeData);
        }
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

  const handleSaveMasterEdit = async () => {
    if (!currentUser || !editedMasterContent) return;
    await updateMasterResumeContent(currentUser.id, editedMasterContent);
    setIsEditingMaster(false);
  };

  const handleCancelMasterEdit = () => {
    if (masterResume) {
      setEditedMasterContent(masterResume.content); // Revert changes
    }
    setIsEditingMaster(false);
  };

  const handleDeleteMasterResume = async () => {
    if (!currentUser || !masterResume) return;
    await deleteResume(masterResume.id);
  };

  const handleCreateVersion = async () => {
    if (!currentUser || !masterResume || !newVersionName.trim()) {
      toast.error("Master Resume must exist and version name cannot be empty.");
      return;
    }
    await createVersionResume(currentUser.id, masterResume.id, newVersionName, JSON.parse(JSON.stringify(masterResume.content)));
    setNewVersionName("");
    setIsCreateVersionDialogOpen(false);
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
          {masterResume && editedMasterContent ? (
            <>
              {isEditingMaster ? (
                <ResumeEditor
                  resume={editedMasterContent}
                  onChange={setEditedMasterContent}
                />
              ) : (
                <MasterResumeDisplay resume={masterResume.content} fitScore={0} />
              )}
              <div className="flex flex-wrap gap-2 mt-6">
                {isEditingMaster ? (
                  <>
                    <Button onClick={handleSaveMasterEdit}>Save Master Resume</Button>
                    <Button variant="outline" onClick={handleCancelMasterEdit}>Cancel</Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditingMaster(true)}>Edit Master Resume</Button>
                )}
                <Dialog open={isCreateVersionDialogOpen} onOpenChange={setIsCreateVersionDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="secondary" disabled={!masterResume}>
                      <PlusCircle className="mr-2 h-4 w-4" /> Create New Version
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Version Resume</DialogTitle>
                      <DialogDescription>Give your new version resume a descriptive name.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="version-name">Version Name</Label>
                        <Input
                          id="version-name"
                          value={newVersionName}
                          onChange={(e) => setNewVersionName(e.target.value)}
                          placeholder="e.g., Marketing Associate Resume"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCreateVersionDialogOpen(false)}>Cancel</Button>
                      <Button onClick={handleCreateVersion} disabled={!newVersionName.trim()}>Create Version</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={!masterResume}>
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Master
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your Master Resume and ALL associated Version Resumes.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDeleteMasterResume}>Delete All Resumes</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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

      {/* Version Resumes List */}
      <Card>
        <CardHeader>
          <CardTitle>Version Resumes</CardTitle>
          <CardDescription>Tailored resumes for specific job applications.</CardDescription>
        </CardHeader>
        <CardContent>
          {versionResumes.length === 0 ? (
            <p className="text-muted-foreground">
              No version resumes created yet. Create one from your Master Resume above.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {versionResumes.map((version) => (
                <VersionResumeCard
                  key={version.id}
                  versionResume={version}
                  masterResumeContent={masterResume ? masterResume.content : null}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Resumes;