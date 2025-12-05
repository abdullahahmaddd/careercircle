"use client";

import React, { useEffect, useState } from "react";
import { usePlaylists, JobEntry } from "@/context/PlaylistContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const UpcomingDeadlines: React.FC = () => {
  const { playlists } = usePlaylists();
  const [upcomingJobs, setUpcomingJobs] = useState<JobEntry[]>([]);
  const [hasNotified, setHasNotified] = useState(false);

  useEffect(() => {
    const allJobEntries = playlists.flatMap(playlist => playlist.jobEntries);
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    const filteredJobs = allJobEntries.filter(job => {
      const deadline = new Date(job.applicationDeadline);
      // Only show jobs that are not yet applied and have a deadline within the next 7 days
      return (
        job.status !== 'Applied' &&
        deadline > now &&
        deadline <= sevenDaysFromNow
      );
    }).sort((a, b) => {
      // Sort by closest deadline
      return new Date(a.applicationDeadline).getTime() - new Date(b.applicationDeadline).getTime();
    });

    setUpcomingJobs(filteredJobs);

    if (filteredJobs.length > 0 && !hasNotified) {
      toast.info(`You have ${filteredJobs.length} job application${filteredJobs.length > 1 ? 's' : ''} with upcoming deadlines!`, {
        duration: 5000,
        action: {
          label: "View",
          onClick: () => {
            // In a real app, this would navigate to the playlists page or highlight the dashboard section
            console.log("Navigating to upcoming deadlines...");
          },
        },
      });
      setHasNotified(true); // Prevent repeated notifications on re-renders
    }
  }, [playlists, hasNotified]);

  if (upcomingJobs.length === 0) {
    return null; // Don't render if no upcoming deadlines
  }

  return (
    <Card className="w-full max-w-2xl mx-auto mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-orange-500" /> Upcoming Deadlines
        </CardTitle>
        <Badge variant="destructive">{upcomingJobs.length} Urgent</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        {upcomingJobs.map((job) => (
          <div key={job.id} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <span>{job.roleTitle}</span>
            </div>
            <span className="font-medium text-orange-500">
              {new Date(job.applicationDeadline).toLocaleDateString()}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default UpcomingDeadlines;