"use client";

import React, { useState } from "react";
import { Resume, useResumes } from "@/context/ResumeContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Edit, GitMerge, Trash2, Eye, Mail } from "lucide-react";
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
import ResumeEditor from "./ResumeEditor";
import MasterResumeDisplay from "./MasterResumeDisplay";
import { toast } from "sonner";
import { ParsedResume } from "@/utils/resumeParser";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

interface VersionResumeCardProps {
  versionResume: Resume;
  masterResumeContent: ParsedResume | null;
}

const VersionResumeCard: React.FC<VersionResumeCardProps> = ({ versionResume, masterResumeContent }) => {
  const { deleteResume, updateVersionResumeContent, syncVersionToMaster } = useResumes();
  const [isEditing, setIsEditing] = useState(false);
  const [editedVersionContent, setEditedVersionContent] = useState<ParsedResume>(versionResume.content);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Check for changes by comparing stringified JSON content
  const hasChangesComparedToMaster = masterResumeContent && JSON.stringify(versionResume.content) !== JSON.stringify(masterResumeContent);

  const handleDelete = async () => {
    const success = await deleteResume(versionResume.id);
    if (success) {
      toast.success(`Version Resume "${versionResume.name}" deleted.`);
    }
  };

  const handleSaveEdit = async () => {
    if (JSON.stringify(editedVersionContent) !== JSON.stringify(versionResume.content)) {
      await updateVersionResumeContent(versionResume.id, editedVersionContent);
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedVersionContent(versionResume.content); // Revert changes
    setIsEditing(false);
  };

  const handleSyncToMaster = async () => {
    const success = await syncVersionToMaster(versionResume.id);
    if (success) {
      toast.success(`Version Resume "${versionResume.name}" synced to Master Resume.`);
    }
  };

  return (
    <Card className="relative">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-secondary-foreground" /> {versionResume.name}
          {hasChangesComparedToMaster && (
            <Badge variant="outline" className="ml-2 text-orange-500 border-orange-500">
              Unsynced Changes
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Last Modified: {new Date(versionResume.lastModifiedAt).toLocaleDateString()}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <div className="flex flex-wrap gap-2">
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 md:flex-none">
                <Eye className="mr-2 h-4 w-4" /> View
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Viewing: {versionResume.name}</DialogTitle>
                <DialogDescription>Read-only view of your version resume.</DialogDescription>
              </DialogHeader>
              <MasterResumeDisplay resume={versionResume.content} fitScore={0} />
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isEditing} onOpenChange={setIsEditing}>
            <DialogTrigger asChild>
              <Button variant="secondary" size="sm" className="flex-1 md:flex-none" onClick={() => {
                setEditedVersionContent(versionResume.content); // Load current content for editing
                setIsEditing(true);
              }}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit: {versionResume.name}</DialogTitle>
                <DialogDescription>Make changes to this tailored resume version.</DialogDescription>
              </DialogHeader>
              <ResumeEditor resume={editedVersionContent} onChange={setEditedVersionContent} />
              <DialogFooter>
                <Button variant="outline" onClick={handleCancelEdit}>Cancel</Button>
                <Button onClick={handleSaveEdit}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 md:flex-none" disabled={!hasChangesComparedToMaster}>
                <GitMerge className="mr-2 h-4 w-4" /> Sync to Master
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Sync to Master Resume?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will overwrite your Master Resume with the content of this version. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleSyncToMaster}>Sync</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button asChild variant="outline" size="sm" className="flex-1 md:flex-none">
            <Link to={`/cover-letter?resumeId=${versionResume.id}`}>
              <Mail className="mr-2 h-4 w-4" /> Generate Cover Letter
            </Link>
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="flex-1 md:flex-none">
                <Trash2 className="mr-2 h-4 w-4" /> Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the version resume "{versionResume.name}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default VersionResumeCard;