"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, CheckCircle2, Upload, FileText, Download, Share2, CalendarDays, Briefcase } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { parseJobDescription, ParsedJobDescription, calculateFitScore } from "@/utils/jdParser";
import { parseResumeFile, ParsedResume, Experience, Education, Skill } from "@/utils/resumeParser";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import MasterResumeDisplay from "@/components/MasterResumeDisplay";
import ResumeEditor from "@/components/ResumeEditor"; // Import ResumeEditor
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePlaylists, JobEntryStatus, JobEntry } from "@/context/PlaylistContext";
import { useAuth } from "@/context/AuthContext";
import { usePods } from "@/context/PodContext"; // Import usePods
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Helper function to generate ATS-compliant plain text resume content
const generateAtsCompliantTextResume = (resume: ParsedResume, jobRole: string): string => {
  let text = `Resume for ${resume.name} - Tailored for ${jobRole}\n\n`;
  text += `Contact Information:\n`;
  text += `Name: ${resume.name}\n`;
  text += `Email: ${resume.email}\n`;
  text += `Phone: ${resume.phone}\n`;
  if (resume.linkedin) text += `LinkedIn: ${resume.linkedin}\n`;
  text += `\n`;

  if (resume.summary) {
    text += `Summary:\n`;
    text += `${resume.summary}\n\n`;
  }

  if (resume.experience.length > 0) {
    text += `Work Experience:\n`;
    resume.experience.forEach((exp) => {
      text += `- ${exp.title} at ${exp.company} (${exp.startDate} - ${exp.endDate})\n`;
      exp.description.forEach((desc) => {
        text += `  • ${desc}\n`;
      });
      text += `\n`;
    });
  }

  if (resume.education.length > 0) {
    text += `Education:\n`;
    resume.education.forEach((edu) => {
      text += `- ${edu.degree}, ${edu.institution} (Graduation: ${edu.graduationDate})\n`;
    });
    text += `\n`;
  }

  if (resume.skills.length > 0) {
    text += `Skills:\n`;
    text += resume.skills.map((skill) => skill.name + (skill.level ? ` (${skill.level})` : '')).join(', ') + '\n';
  }

  return text;
};

const FirstApplicationWorkflow = () => {
  const { playlists, addJobEntry, updateJobEntryStatus } = usePlaylists();
  const { currentUser, markFirstApplicationComplete } = useAuth();
  const { createPod, shareResumeInPod, invitePeerToPod, pods } = usePods(); // Use usePods
  const navigate = useNavigate();
  const defaultPlaylistId = playlists[0]?.id || 'default-playlist';

  const [step, setStep] = useState(1);
  const [jobDescription, setJobDescription] = useState("");
  const [parsedJd, setParsedJd] = useState<ParsedJobDescription | null>(null);
  const [editedRole, setEditedRole] = useState("");
  const [editedDomain, setEditedDomain] = useState("");
  const [editedKeywords, setEditedKeywords] = useState<string[]>([]);
  const [fitScore, setFitScore] = useState(0);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [parsedResume, setParsedResume] = useState<ParsedResume | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);

  const [masterResume, setMasterResume] = useState<ParsedResume | null>(null);
  const [versionResume, setVersionResume] = useState<ParsedResume | null>(null);
  const [hasVersionChanges, setHasVersionChanges] = useState(false);
  const [showSyncPrompt, setShowSyncPrompt] = useState(false);

  const [currentWorkflowJobEntry, setCurrentWorkflowJobEntry] = useState<JobEntry | null>(null);
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [jobEntryStatus, setJobEntryStatus] = useState<JobEntryStatus>('Not started');
  const [salaryRange, setSalaryRange] = useState("");
  const [location, setLocation] = useState("");
  const [source, setSource] = useState("");

  const [showInvitePodDialog, setShowInvitePodDialog] = useState(false);
  const [peerEmailToInvite, setPeerEmailToInvite] = useState("");
  const [selectedPodId, setSelectedPodId] = useState<string | undefined>(undefined);

  // Helper to compare resumes for changes
  const resumesAreEqual = (res1: ParsedResume | null, res2: ParsedResume | null): boolean => {
    if (!res1 || !res2) return res1 === res2;
    return JSON.stringify(res1) === JSON.stringify(res2);
  };

  useEffect(() => {
    if (masterResume && versionResume) {
      setHasVersionChanges(!resumesAreEqual(masterResume, versionResume));
    }
  }, [masterResume, versionResume]);


  const handleParseJd = () => {
    if (jobDescription.trim()) {
      const result = parseJobDescription(jobDescription);
      setParsedJd(result);
      setEditedRole(result.role);
      setEditedDomain(result.domain);
      setEditedKeywords(result.keywords);
      setStep(2);
    }
  };

  const handleConfirmJd = () => {
    if (parsedJd) {
      const finalJd = {
        ...parsedJd,
        role: editedRole,
        domain: editedDomain,
        keywords: editedKeywords,
      };

      const newJobEntry: Omit<JobEntry, 'id' | 'createdAt'> = {
        roleTitle: finalJd.role,
        applicationDeadline: applicationDeadline || "N/A",
        status: 'Not started',
        jdText: jobDescription,
        parsedJd: finalJd,
        salaryRange,
        location,
        source,
      };

      addJobEntry(defaultPlaylistId, newJobEntry);
      const updatedPlaylist = playlists.find(p => p.id === defaultPlaylistId);
      const latestJobEntry = updatedPlaylist?.jobEntries[updatedPlaylist.jobEntries.length - 1];
      if (latestJobEntry) {
        setCurrentWorkflowJobEntry(latestJobEntry);
        setJobEntryStatus(latestJobEntry.status);
      }

      setStep(3);
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
        setStep(4);
      } catch (error) {
        console.error("Error parsing resume:", error);
        toast.error("Failed to parse resume. Please try again.");
      } finally {
        setIsParsingResume(false);
      }
    } else {
      toast.error("Please select a resume file to upload.");
    }
  };

  const handleConfirmResume = () => {
    if (parsedResume) {
      setMasterResume(parsedResume);

      if (parsedJd) {
        const score = calculateFitScore(parsedResume, parsedJd.keywords);
        setFitScore(score);
      }

      setStep(5);
    }
  };

  const handleGenerateVersionResume = () => {
    if (masterResume) {
      const newVersion = JSON.parse(JSON.stringify(masterResume));
      setVersionResume(newVersion);
      setHasVersionChanges(false);
      setStep(6);
    }
  };

  const handleSaveVersionAndContinue = () => {
    setStep(7);
  };

  const handleExportResume = (format: 'docx' | 'pdf') => {
    if (!versionResume) {
      toast.error("No version resume available to export.");
      return;
    }

    const resumeTextContent = generateAtsCompliantTextResume(versionResume, editedRole);
    const filename = `${versionResume.name.replace(/\s/g, '_')}_${editedRole.replace(/\s/g, '_')}_Resume.${format === 'docx' ? 'txt' : 'txt'}`;

    const element = document.createElement("a");
    const file = new Blob([resumeTextContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(`Mock: Downloading ATS-compliant ${format.toUpperCase()} (as .txt) for ${versionResume.name}.`);
  };

  const handleInviteToPodClick = () => {
    if (!currentUser) {
      toast.error("You must be logged in to invite peers to a Pod.");
      return;
    }
    setShowInvitePodDialog(true);
  };

  const handleInvitePeerAndShare = async () => {
    if (!currentUser || !versionResume) return;

    let targetPodId = selectedPodId;
    if (!targetPodId) {
      // If no pod selected, create a default one for the user
      const newPod = await createPod(`${currentUser.name}'s CareerCircle`, currentUser.id, currentUser.name, currentUser.email);
      if (newPod) {
        targetPodId = newPod.id;
      } else {
        toast.error("Failed to create a Pod.");
        return;
      }
    }

    if (targetPodId) {
      if (peerEmailToInvite) {
        await invitePeerToPod(targetPodId, peerEmailToInvite);
      }
      await shareResumeInPod(targetPodId, currentUser.id, currentUser.name, versionResume);
      setShowInvitePodDialog(false);
      setPeerEmailToInvite("");
      setSelectedPodId(undefined);
    }
  };

  const handleSyncChanges = () => {
    if (masterResume && versionResume) {
      setMasterResume(JSON.parse(JSON.stringify(versionResume))); // Deep copy
    }
    setHasVersionChanges(false);
    setShowSyncPrompt(false);
    setStep(5);
  };

  const handleDiscardChanges = () => {
    setHasVersionChanges(false);
    setShowSyncPrompt(false);
    setStep(5);
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else if (step === 4) setStep(3);
    else if (step === 5) {
      if (hasVersionChanges) {
        setShowSyncPrompt(true);
      } else {
        setStep(4);
      }
    }
    else if (step === 6) setStep(5);
    else if (step === 7) setStep(6);
  };

  const handleJobEntryStatusChange = (value: JobEntryStatus) => {
    setJobEntryStatus(value);
    if (currentWorkflowJobEntry) {
      updateJobEntryStatus(defaultPlaylistId, currentWorkflowJobEntry.id, value);
      setCurrentWorkflowJobEntry(prev => prev ? { ...prev, status: value } : null);
    }
  };

  const handleFinishWorkflow = async () => {
    await markFirstApplicationComplete();
    toast.success("Workflow complete! You can now navigate to other sections.");
    navigate("/");
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
            {step === 5 && "Your Master Resume is ready! Review your content and see how well it fits the job description."}
            {step === 6 && "You're now tailoring your Version Resume. Optimize content, keywords, and structure to match the job description."}
            {step === 7 && "Great job! Your tailored resume is ready. Now, export it and consider getting feedback from your peers."}
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
              <div className="space-y-2">
                <Label htmlFor="application-deadline">Application Deadline (Optional)</Label>
                <Input
                  id="application-deadline"
                  type="date"
                  value={applicationDeadline}
                  onChange={(e) => setApplicationDeadline(e.target.value)}
                />
              </div>
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

              <h3 className="text-xl font-semibold mb-4 mt-6">Optional Job Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="salary-range">Salary Range (e.g., $80k - $100k)</Label>
                  <Input
                    id="salary-range"
                    value={salaryRange}
                    onChange={(e) => setSalaryRange(e.target.value)}
                    placeholder="e.g., $80,000 - $100,000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location / Remote / Hybrid</Label>
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g., New York, NY (Remote)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="source">Source (e.g., LinkedIn, Referral)</Label>
                  <Input
                    id="source"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g., LinkedIn, Company Website"
                  />
                </div>
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
              {currentWorkflowJobEntry && (
                <Card className="p-4 border-l-4 border-primary">
                  <CardTitle className="text-lg flex items-center gap-2 mb-2">
                    <Briefcase className="h-5 w-5" /> Job Saved: {currentWorkflowJobEntry.roleTitle}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" /> Deadline: {currentWorkflowJobEntry.applicationDeadline}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Label>Status:</Label>
                    <Select value={jobEntryStatus} onValueChange={handleJobEntryStatusChange}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not started">Not started</SelectItem>
                        <SelectItem value="Draft ready">Draft ready</SelectItem>
                        <SelectItem value="Applied">Applied</SelectItem>
                        <SelectItem value="Interviewing">Interviewing</SelectItem>
                        <SelectItem value="Offer">Offer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
              )}
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
              <ResumeEditor
                resume={parsedResume}
                onChange={setParsedResume}
              />
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

          {/* Step 5: Master Resume Overview */}
          {step === 5 && masterResume && (
            <div className="space-y-6">
              <h3 className="text-2xl font-semibold text-center">Master Resume Overview</h3>
              <p className="text-muted-foreground text-center">
                Your Master Resume is now the single source of truth for your professional experience.
                Keywords from the job description are highlighted below, and a Fit Score is calculated.
              </p>
              <MasterResumeDisplay resume={masterResume} jobDescription={parsedJd} fitScore={fitScore} />
              {currentWorkflowJobEntry && (
                <Card className="p-4 border-l-4 border-primary">
                  <CardTitle className="text-lg flex items-center gap-2 mb-2">
                    <Briefcase className="h-5 w-5" /> Job Tracked: {currentWorkflowJobEntry.roleTitle}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" /> Deadline: {currentWorkflowJobEntry.applicationDeadline}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Label>Status:</Label>
                    <Select value={jobEntryStatus} onValueChange={handleJobEntryStatusChange}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Not started">Not started</SelectItem>
                        <SelectItem value="Draft ready">Draft ready</SelectItem>
                        <SelectItem value="Applied">Applied</SelectItem>
                        <SelectItem value="Interviewing">Interviewing</SelectItem>
                        <SelectItem value="Offer">Offer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
              )}
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleGenerateVersionResume}>
                  Generate First Version Resume <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 6: Version Resume Tailoring */}
          {step === 6 && versionResume && (
            <div className="space-y-6 text-center">
              <FileText className="mx-auto h-16 w-16 text-primary mb-4" />
              <h3 className="text-2xl font-semibold">Version Resume Tailoring for "{editedRole}"</h3>
              <p className="text-muted-foreground mb-4">
                You are now working on a tailored version of your resume.
                Optimize content, keywords, and structure to match the job description.
              </p>
              <ResumeEditor
                resume={versionResume}
                onChange={setVersionResume}
              />
              {hasVersionChanges && (
                <p className="text-sm text-orange-500">
                  Changes detected! These changes can be synced to your Master Resume later.
                </p>
              )}
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleSaveVersionAndContinue}>
                  Save Version & Continue <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 7: Export & Share */}
          {step === 7 && (
            <div className="space-y-6 text-center">
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-500 mb-4" />
              <h3 className="text-2xl font-semibold">Your Tailored Resume is Ready!</h3>
              <p className="text-muted-foreground mb-6">
                Download your ATS-compliant resume and get ready to apply.
                You can also invite peers to your Pod for valuable feedback.
              </p>
              <p className="text-sm text-orange-500 mb-4">
                (Note: For this frontend-only app, DOCX/PDF export is simulated by downloading a structured plain text file.)
              </p>
              <div className="flex flex-col md:flex-row justify-center gap-4 mb-8">
                <Button onClick={() => handleExportResume('docx')}>
                  <Download className="mr-2 h-4 w-4" /> Export as DOCX (Mock)
                </Button>
                <Button onClick={() => handleExportResume('pdf')}>
                  <Download className="mr-2 h-4 w-4" /> Export as PDF (Mock)
                </Button>
              </div>
              <div className="space-y-4">
                <h4 className="text-xl font-semibold">Want feedback before you apply?</h4>
                <p className="text-muted-foreground">
                  Share this version with your CareerCircle for constructive criticism.
                </p>
                <Button variant="secondary" onClick={handleInviteToPodClick}>
                  <Share2 className="mr-2 h-4 w-4" /> Invite Peers to Pod
                </Button>
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={handleFinishWorkflow}>
                  Finish Workflow <CheckCircle2 className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Master/Version Sync Alert Dialog */}
      <AlertDialog open={showSyncPrompt} onOpenChange={setShowSyncPrompt}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes in Version Resume</AlertDialogTitle>
            <AlertDialogDescription>
              We noticed you updated your "{editedRole || "tailored"}" version. Would you like to apply these changes to your Master Resume before going back?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleDiscardChanges}>Discard Changes</AlertDialogCancel>
            <AlertDialogAction onClick={handleSyncChanges}>Apply Changes to Master</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invite to Pod Dialog */}
      <AlertDialog open={showInvitePodDialog} onOpenChange={setShowInvitePodDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Share Resume with a Pod</AlertDialogTitle>
            <AlertDialogDescription>
              Invite a peer to your CareerCircle Pod and share your current resume version for feedback.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="pod-select">Select an existing Pod or a new one will be created</Label>
              <Select value={selectedPodId} onValueChange={setSelectedPodId}>
                <SelectTrigger id="pod-select">
                  <SelectValue placeholder="Select a Pod" />
                </SelectTrigger>
                <SelectContent>
                  {pods.filter(pod => pod.ownerId === currentUser?.id).map(pod => (
                    <SelectItem key={pod.id} value={pod.id}>{pod.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="peer-email">Peer's Email (Optional)</Label>
              <Input
                id="peer-email"
                type="email"
                placeholder="peer@example.com"
                value={peerEmailToInvite}
                onChange={(e) => setPeerEmailToInvite(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                If the peer doesn't have an account, a mock invitation will be sent.
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleInvitePeerAndShare} disabled={!currentUser || !versionResume}>
              Invite & Share
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default FirstApplicationWorkflow;