"use client";

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { usePlaylists, JobEntryStatus } from '@/context/PlaylistContext';
import { PlusCircle } from 'lucide-react';
import { parseJobDescription } from '@/utils/jdParser';

interface AddJobEntryDialogProps {
  playlistId: string;
}

const AddJobEntryDialog: React.FC<AddJobEntryDialogProps> = ({ playlistId }) => {
  const { addJobEntry } = usePlaylists();
  const [isOpen, setIsOpen] = useState(false);

  const [roleTitle, setRoleTitle] = useState('');
  const [applicationDeadline, setApplicationDeadline] = useState('');
  const [status, setStatus] = useState<JobEntryStatus>('Not started');
  const [jdText, setJdText] = useState('');
  const [salaryRange, setSalaryRange] = useState('');
  const [location, setLocation] = useState('');
  const [source, setSource] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!roleTitle.trim() || !applicationDeadline.trim()) {
      alert('Role/Title and Application Deadline are required.');
      return;
    }

    const parsedJd = jdText.trim() ? parseJobDescription(jdText) : undefined;

    addJobEntry(playlistId, {
      roleTitle,
      applicationDeadline,
      status,
      jdText: jdText.trim() ? jdText : undefined,
      parsedJd,
      salaryRange: salaryRange.trim() ? salaryRange : undefined,
      location: location.trim() ? location : undefined,
      source: source.trim() ? source : undefined,
    });

    // Reset form
    setRoleTitle('');
    setApplicationDeadline('');
    setStatus('Not started');
    setJdText('');
    setSalaryRange('');
    setLocation('');
    setSource('');
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full md:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Job
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Job Entry</DialogTitle>
          <DialogDescription>
            Manually add a job application to your playlist. Fill in the details below.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="roleTitle" className="text-right">
              Role/Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="roleTitle"
              value={roleTitle}
              onChange={(e) => setRoleTitle(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="applicationDeadline" className="text-right">
              Deadline <span className="text-red-500">*</span>
            </Label>
            <Input
              id="applicationDeadline"
              type="date"
              value={applicationDeadline}
              onChange={(e) => setApplicationDeadline(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Status
            </Label>
            <Select value={status} onValueChange={(value: JobEntryStatus) => setStatus(value)}>
              <SelectTrigger className="col-span-3">
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="jdText" className="text-right">
              Job Description (Optional)
            </Label>
            <Textarea
              id="jdText"
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              className="col-span-3 min-h-[100px]"
              placeholder="Paste the full job description here to enable parsing for future features."
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="salaryRange" className="text-right">
              Salary Range (Optional)
            </Label>
            <Input
              id="salaryRange"
              value={salaryRange}
              onChange={(e) => setSalaryRange(e.target.value)}
              className="col-span-3"
              placeholder="e.g., $80,000 - $100,000"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="location" className="text-right">
              Location (Optional)
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="col-span-3"
              placeholder="e.g., New York, NY (Remote)"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="source" className="text-right">
              Source (Optional)
            </Label>
            <Input
              id="source"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="col-span-3"
              placeholder="e.g., LinkedIn, Company Website"
            />
          </div>
          <DialogFooter>
            <Button type="submit">Add Job</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddJobEntryDialog;