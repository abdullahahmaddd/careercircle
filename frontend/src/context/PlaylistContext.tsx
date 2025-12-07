"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { ParsedJobDescription } from '@/utils/jdParser';
import api from '@/lib/api';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

// Define types for JobEntry and Playlist
export type JobEntryStatus = 'Not started' | 'Draft ready' | 'Applied' | 'Interviewing' | 'Offer';

export interface JobEntry {
  id: string;
  roleTitle: string;
  applicationDeadline: string;
  status: JobEntryStatus;
  jdText?: string; // Original JD text, optional
  parsedJd?: ParsedJobDescription; // Parsed JD data, optional
  salaryRange?: string; // Nice-to-have
  location?: string; // Nice-to-have
  source?: string; // Nice-to-have
  createdAt: string;
}

export interface Playlist {
  id: string;
  name: string;
  jobEntries: JobEntry[];
}

// Map backend status to frontend status
const mapBackendStatusToFrontend = (status: string): JobEntryStatus => {
  switch (status) {
    case 'wishlist': return 'Not started';
    case 'applied': return 'Applied';
    case 'interviewing': return 'Interviewing';
    case 'offer': return 'Offer';
    case 'rejected': return 'Applied'; // Map rejected to Applied for now as frontend lacks Rejected state
    default: return 'Not started';
  }
};

// Map frontend status to backend status
const mapFrontendStatusToBackend = (status: JobEntryStatus): string => {
  switch (status) {
    case 'Not started': return 'wishlist';
    case 'Draft ready': return 'wishlist'; // Backend doesn't distinguish
    case 'Applied': return 'applied';
    case 'Interviewing': return 'interviewing';
    case 'Offer': return 'offer';
    default: return 'wishlist';
  }
};

const mapJobEntry = (apiEntry: any): JobEntry => ({
  id: apiEntry._id || apiEntry.id,
  roleTitle: apiEntry.role_title,
  applicationDeadline: apiEntry.application_deadline,
  status: mapBackendStatusToFrontend(apiEntry.status),
  jdText: apiEntry.jd_text,
  parsedJd: apiEntry.parsed_jd,
  createdAt: apiEntry.created_at,
});

const mapPlaylist = (apiPlaylist: any): Playlist => ({
  id: apiPlaylist._id || apiPlaylist.id,
  name: apiPlaylist.name,
  jobEntries: apiPlaylist.job_entries?.map(mapJobEntry) || [],
});

// Define the shape of the context
interface PlaylistContextType {
  playlists: Playlist[];
  addPlaylist: (name: string) => Promise<void>;
  addJobEntry: (playlistId: string, jobEntry: Omit<JobEntry, 'id' | 'createdAt'>) => Promise<JobEntry | undefined>;
  updateJobEntryStatus: (playlistId: string, jobEntryId: string, newStatus: JobEntryStatus) => Promise<void>;
  updateJobEntry: (playlistId: string, jobEntryId: string, updatedFields: Partial<JobEntry>) => Promise<void>;
  deleteJobEntry: (playlistId: string, jobEntryId: string) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  hasUpcomingDeadlines: boolean; // New: Flag for upcoming deadlines
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export const PlaylistProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);

  const loadPlaylists = useCallback(async () => {
    try {
      const response = await api.get('/playlists/');
      setPlaylists(response.data.map(mapPlaylist));
    } catch (error) {
      console.error('Failed to load playlists:', error);
      toast.error('Failed to load playlists.');
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadPlaylists();
    } else {
      setPlaylists([]);
    }
  }, [isAuthenticated, loadPlaylists]);

  const addPlaylist = async (name: string) => {
    try {
      const response = await api.post('/playlists/', { name });
      const newPlaylist = mapPlaylist(response.data);
      setPlaylists((prev) => [...prev, newPlaylist]);
      toast.success(`Playlist "${name}" created!`);
    } catch (error) {
      console.error('Failed to create playlist:', error);
      toast.error('Failed to create playlist.');
    }
  };

  const addJobEntry = async (playlistId: string, jobEntry: Omit<JobEntry, 'id' | 'createdAt'>) => {
    try {
      const payload = {
        role_title: jobEntry.roleTitle,
        status: mapFrontendStatusToBackend(jobEntry.status),
        application_deadline: jobEntry.applicationDeadline && jobEntry.applicationDeadline !== 'N/A' ? jobEntry.applicationDeadline : null,
        jd_text: jobEntry.jdText,
        parsed_jd: jobEntry.parsedJd,
      };
      const response = await api.post(`/playlists/${playlistId}/entries`, payload);
      const updatedPlaylist = mapPlaylist(response.data);
      
      setPlaylists((prev) => {
        const exists = prev.some(p => p.id === updatedPlaylist.id);
        if (exists) {
            return prev.map((playlist) =>
              playlist.id === updatedPlaylist.id ? updatedPlaylist : playlist
            );
        } else {
            return [...prev, updatedPlaylist];
        }
      });
      toast.success('Job entry added!');
      
      // Return the newly added entry (assuming it's the last one)
      return updatedPlaylist.jobEntries[updatedPlaylist.jobEntries.length - 1];
    } catch (error) {
      console.error('Failed to add job entry:', error);
      toast.error('Failed to add job entry.');
      return undefined;
    }
  };

  const updateJobEntryStatus = async (playlistId: string, jobEntryId: string, newStatus: JobEntryStatus) => {
    try {
      const payload = {
        status: mapFrontendStatusToBackend(newStatus),
      };
      const response = await api.patch(`/playlists/${playlistId}/entries/${jobEntryId}`, payload);
      const updatedPlaylist = mapPlaylist(response.data);

      setPlaylists((prev) =>
        prev.map((playlist) =>
          playlist.id === playlistId ? updatedPlaylist : playlist
        )
      );
      toast.success('Status updated!');
    } catch (error) {
      console.error('Failed to update job status:', error);
      toast.error('Failed to update status.');
    }
  };

  const updateJobEntry = async (playlistId: string, jobEntryId: string, updatedFields: Partial<JobEntry>) => {
    try {
      const payload: any = {};
      if (updatedFields.roleTitle) payload.role_title = updatedFields.roleTitle;
      if (updatedFields.status) payload.status = mapFrontendStatusToBackend(updatedFields.status);
      if (updatedFields.applicationDeadline) payload.application_deadline = updatedFields.applicationDeadline;
      if (updatedFields.jdText) payload.jd_text = updatedFields.jdText;
      if (updatedFields.parsedJd) payload.parsed_jd = updatedFields.parsedJd;

      const response = await api.patch(`/playlists/${playlistId}/entries/${jobEntryId}`, payload);
      const updatedPlaylist = mapPlaylist(response.data);

      setPlaylists((prev) =>
        prev.map((playlist) =>
          playlist.id === playlistId ? updatedPlaylist : playlist
        )
      );
      toast.success('Job entry updated!');
    } catch (error) {
      console.error('Failed to update job entry:', error);
      toast.error('Failed to update job entry.');
    }
  };

  const deleteJobEntry = async (playlistId: string, jobEntryId: string) => {
    try {
      const response = await api.delete(`/playlists/${playlistId}/entries/${jobEntryId}`);
      const updatedPlaylist = mapPlaylist(response.data);

      setPlaylists((prev) =>
        prev.map((playlist) =>
          playlist.id === playlistId ? updatedPlaylist : playlist
        )
      );
      toast.success('Job entry deleted.');
    } catch (error) {
      console.error('Failed to delete job entry:', error);
      toast.error('Failed to delete job entry.');
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    try {
      await api.delete(`/playlists/${playlistId}`);
      setPlaylists((prev) => prev.filter((playlist) => playlist.id !== playlistId));
      toast.success('Playlist deleted.');
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      toast.error('Failed to delete playlist.');
    }
  };

  // Calculate hasUpcomingDeadlines
  const hasUpcomingDeadlines = React.useMemo(() => {
    const allJobEntries = playlists.flatMap(playlist => playlist.jobEntries);
    const now = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    return allJobEntries.some(job => {
      const deadline = new Date(job.applicationDeadline);
      return (
        job.status !== 'Applied' &&
        deadline > now &&
        deadline <= sevenDaysFromNow
      );
    });
  }, [playlists]);

  return (
    <PlaylistContext.Provider
      value={{
        playlists,
        addPlaylist,
        addJobEntry,
        updateJobEntryStatus,
        updateJobEntry,
        deleteJobEntry,
        deletePlaylist,
        hasUpcomingDeadlines, // Provide the new flag
      }}
    >
      {children}
    </PlaylistContext.Provider>
  );
};

export const usePlaylists = () => {
  const context = useContext(PlaylistContext);
  if (context === undefined) {
    throw new Error('usePlaylists must be used within a PlaylistProvider');
  }
  return context;
};