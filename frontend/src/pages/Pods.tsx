"use client";

import React, { useState } from "react";
import { usePods, Pod, SharedResume, Comment } from "@/context/PodContext";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Users, Share2, MessageSquare, UserPlus, Mail, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import MasterResumeDisplay from "@/components/MasterResumeDisplay"; // Re-use for shared resume view

const Pods = () => {
  const { pods, createPod, invitePeerToPod, shareResumeInPod, addCommentToSharedResume, getSharedResumeById } = usePods();
  const { currentUser, isAuthenticated } = useAuth();

  const [newPodName, setNewPodName] = useState("");
  const [isCreatePodDialogOpen, setIsCreatePodDialogOpen] = useState(false);

  const [isInvitePeerDialogOpen, setIsInvitePeerDialogOpen] = useState(false);
  const [peerEmail, setPeerEmail] = useState("");
  const [selectedPodToInvite, setSelectedPodToInvite] = useState<string | undefined>(undefined);

  const [isShareResumeDialogOpen, setIsShareResumeDialogOpen] = useState(false);
  const [selectedPodToShare, setSelectedPodToShare] = useState<string | undefined>(undefined);
  const [resumeToShare, setResumeToShare] = useState<string | undefined>(undefined); // Mock: In a real app, this would be a resume ID

  const [isViewResumeDialogOpen, setIsViewResumeDialogOpen] = useState(false);
  const [currentSharedResume, setCurrentSharedResume] = useState<SharedResume | null>(null);
  const [newCommentText, setNewCommentText] = useState("");

  if (!isAuthenticated) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Pods</h1>
        <p className="text-muted-foreground">Please log in to access your Peer Pods.</p>
      </div>
    );
  }

  const handleCreatePod = async () => {
    if (!newPodName.trim() || !currentUser) return;
    await createPod(newPodName, currentUser.id, currentUser.name, currentUser.email);
    setNewPodName("");
    setIsCreatePodDialogOpen(false);
  };

  const handleInvitePeer = async () => {
    if (!selectedPodToInvite || !peerEmail.trim()) return;
    await invitePeerToPod(selectedPodToInvite, peerEmail);
    setPeerEmail("");
    setSelectedPodToInvite(undefined);
    setIsInvitePeerDialogOpen(false);
  };

  const handleShareResume = async () => {
    if (!selectedPodToShare || !resumeToShare || !currentUser) return;
    // Mock: In a real app, 'resumeToShare' would be a ParsedResume object
    // For now, we'll use a dummy resume or assume the user has a master resume
    const dummyResume: ParsedResume = {
      name: currentUser.name,
      email: currentUser.email,
      phone: "N/A",
      experience: [],
      education: [],
      skills: [{ name: resumeToShare, level: "Mock" }], // Use resumeToShare as a skill for mock
      summary: `This is a mock resume shared by ${currentUser.name} for feedback. Focus: ${resumeToShare}.`
    };
    await shareResumeInPod(selectedPodToShare, currentUser.id, currentUser.name, dummyResume);
    setResumeToShare(undefined);
    setSelectedPodToShare(undefined);
    setIsShareResumeDialogOpen(false);
  };

  const handleViewSharedResume = (sharedResume: SharedResume) => {
    setCurrentSharedResume(sharedResume);
    setIsViewResumeDialogOpen(true);
  };

  const handleAddComment = async () => {
    if (!newCommentText.trim() || !currentUser || !currentSharedResume) return;
    await addCommentToSharedResume(currentSharedResume.id, currentUser.id, currentUser.name, newCommentText);
    setNewCommentText("");
    // Refresh currentSharedResume to show new comment
    const updatedSharedResume = getSharedResumeById(currentSharedResume.id);
    if (updatedSharedResume) {
      setCurrentSharedResume(updatedSharedResume);
    }
  };

  const userOwnedPods = pods.filter(pod => pod.ownerId === currentUser?.id);
  const userMemberPods = pods.filter(pod => pod.members.some(member => member.id === currentUser?.id) && pod.ownerId !== currentUser?.id);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Peer Pods</h1>
      <p className="text-muted-foreground mb-6">Collaborate with peers and get feedback on your resumes.</p>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <Dialog open={isCreatePodDialogOpen} onOpenChange={setIsCreatePodDialogOpen}>
          <DialogTrigger asChild>
            <Button><PlusCircle className="mr-2 h-4 w-4" /> Create New Pod</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Pod</DialogTitle>
              <DialogDescription>Give your new CareerCircle Pod a name.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="pod-name">Pod Name</Label>
                <Input id="pod-name" value={newPodName} onChange={(e) => setNewPodName(e.target.value)} placeholder="e.g., My Study Group" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleCreatePod} disabled={!newPodName.trim()}>Create Pod</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isInvitePeerDialogOpen} onOpenChange={setIsInvitePeerDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline"><UserPlus className="mr-2 h-4 w-4" /> Invite Peer</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Peer to Pod</DialogTitle>
              <DialogDescription>Select a Pod and enter the email of the peer you want to invite.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="select-pod-invite">Select Pod</Label>
                <Select value={selectedPodToInvite} onValueChange={setSelectedPodToInvite}>
                  <SelectTrigger id="select-pod-invite">
                    <SelectValue placeholder="Select a Pod" />
                  </SelectTrigger>
                  <SelectContent>
                    {userOwnedPods.map(pod => (
                      <SelectItem key={pod.id} value={pod.id}>{pod.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="peer-email-invite">Peer's Email</Label>
                <Input id="peer-email-invite" type="email" value={peerEmail} onChange={(e) => setPeerEmail(e.target.value)} placeholder="peer@example.com" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleInvitePeer} disabled={!selectedPodToInvite || !peerEmail.trim()}>Invite</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isShareResumeDialogOpen} onOpenChange={setIsShareResumeDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline"><Share2 className="mr-2 h-4 w-4" /> Share Resume</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Resume with Pod</DialogTitle>
              <DialogDescription>Select a Pod and specify which resume version to share.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="select-pod-share">Select Pod</Label>
                <Select value={selectedPodToShare} onValueChange={setSelectedPodToShare}>
                  <SelectTrigger id="select-pod-share">
                    <SelectValue placeholder="Select a Pod" />
                  </SelectTrigger>
                  <SelectContent>
                    {userOwnedPods.map(pod => (
                      <SelectItem key={pod.id} value={pod.id}>{pod.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="resume-to-share">Resume Version (Mock)</Label>
                <Input id="resume-to-share" value={resumeToShare} onChange={(e) => setResumeToShare(e.target.value)} placeholder="e.g., Marketing Associate Resume" />
                <p className="text-sm text-muted-foreground">
                  (In a real app, you would select an actual resume from your saved versions.)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleShareResume} disabled={!selectedPodToShare || !resumeToShare}>Share</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <h2 className="text-2xl font-semibold mb-4">Your Pods</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pods.length === 0 ? (
          <p className="col-span-full text-muted-foreground">You haven't created or joined any pods yet.</p>
        ) : (
          pods.map(pod => (
            <Card key={pod.id} className="relative">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> {pod.name}
                </CardTitle>
                <CardDescription>Owner: {pod.members.find(m => m.id === pod.ownerId)?.name || 'Unknown'}</CardDescription>
              </CardHeader>
              <CardContent>
                <h3 className="font-medium mb-2">Members ({pod.members.length})</h3>
                <ul className="list-disc list-inside text-sm text-muted-foreground mb-4">
                  {pod.members.map(member => (
                    <li key={member.id}>{member.name} ({member.email})</li>
                  ))}
                </ul>
                <h3 className="font-medium mb-2">Shared Resumes ({pod.sharedResumes.length})</h3>
                {pod.sharedResumes.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No resumes shared in this pod yet.</p>
                ) : (
                  <div className="space-y-2">
                    {pod.sharedResumes.map(sr => (
                      <div key={sr.id} className="flex items-center justify-between p-2 border rounded-md bg-secondary/50">
                        <span className="text-sm flex items-center gap-1">
                          <FileText className="h-4 w-4" /> {sr.versionResume.name} by {sr.resumeOwnerName}
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => handleViewSharedResume(sr)}>
                          <MessageSquare className="mr-1 h-4 w-4" /> View ({sr.comments.length})
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* View Shared Resume Dialog */}
      <Dialog open={isViewResumeDialogOpen} onOpenChange={setIsViewResumeDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Shared Resume: {currentSharedResume?.versionResume.name}</DialogTitle>
            <DialogDescription>
              Shared by {currentSharedResume?.resumeOwnerName} on {new Date(currentSharedResume?.sharedDate || '').toLocaleDateString()}.
            </DialogDescription>
          </DialogHeader>
          {/* Simplified content for debugging */}
          <div className="p-4 text-center text-muted-foreground">
            Content area for shared resume (simplified for debugging)
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewResumeDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Pods;