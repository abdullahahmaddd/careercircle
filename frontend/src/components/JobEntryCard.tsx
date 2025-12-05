"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, Briefcase, MapPin, DollarSign, LinkIcon, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { JobEntry, JobEntryStatus, usePlaylists } from '@/context/PlaylistContext';
import { Button } from '@/components/ui/button';
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

interface JobEntryCardProps {
  jobEntry: JobEntry;
  playlistId: string;
}

const JobEntryCard: React.FC<JobEntryCardProps> = ({ jobEntry, playlistId }) => {
  const { updateJobEntryStatus, deleteJobEntry } = usePlaylists();

  const handleStatusChange = (newStatus: JobEntryStatus) => {
    updateJobEntryStatus(playlistId, jobEntry.id, newStatus);
  };

  const handleDelete = () => {
    deleteJobEntry(playlistId, jobEntry.id);
  };

  const getStatusVariant = (status: JobEntryStatus) => {
    switch (status) {
      case 'Applied': return 'default';
      case 'Interviewing': return 'secondary';
      case 'Offer': return 'success'; // Assuming a 'success' variant exists or can be styled
      case 'Draft ready': return 'outline';
      default: return 'destructive'; // Not started
    }
  };

  return (
    <Card className="relative p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the job entry "{jobEntry.roleTitle}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-primary" /> {jobEntry.roleTitle}
        </CardTitle>
        {jobEntry.parsedJd?.domain && (
          <CardDescription className="text-sm text-muted-foreground">
            Domain: {jobEntry.parsedJd.domain}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDays className="h-4 w-4" /> Deadline: {jobEntry.applicationDeadline}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Badge variant={getStatusVariant(jobEntry.status)}>{jobEntry.status}</Badge>
          <Select value={jobEntry.status} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Update Status" />
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
        {jobEntry.location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" /> {jobEntry.location}
          </div>
        )}
        {jobEntry.salaryRange && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <DollarSign className="h-4 w-4" /> {jobEntry.salaryRange}
          </div>
        )}
        {jobEntry.source && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LinkIcon className="h-4 w-4" /> Source: {jobEntry.source}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default JobEntryCard;