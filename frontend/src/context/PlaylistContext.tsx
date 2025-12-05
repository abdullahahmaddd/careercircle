"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ParsedJobDescription } from '@/utils/jdParser';

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

// Define the shape of the context
interface PlaylistContextType {
  playlists: Playlist[];
  addPlaylist: (name: string) => void;
  addJobEntry: (playlistId: string, jobEntry: Omit<JobEntry, 'id' | 'createdAt'>) => void;
  updateJobEntryStatus: (playlistId: string, jobEntryId: string, newStatus: JobEntryStatus) => void;
  updateJobEntry: (playlistId: string, jobEntryId: string, updatedFields: Partial<JobEntry>) => void;
  deleteJobEntry: (playlistId: string, jobEntryId: string) => void;
  deletePlaylist: (playlistId: string) => void;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

export const PlaylistProvider = ({ children }: { children: ReactNode }) => {
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    // Initialize from localStorage or with a default playlist
    if (typeof window !== 'undefined') {
      const savedPlaylists = localStorage.getItem('careerCirclePlaylists');
      if (savedPlaylists) {
        return JSON.parse(savedPlaylists);
      }
    }
    return [{ id: 'default-playlist', name: 'My First Applications', jobEntries: [] }];
  });

  useEffect(() => {
    // Save playlists to localStorage whenever they change
    if (typeof window !== 'undefined') {
      localStorage.setItem('careerCirclePlaylists', JSON.stringify(playlists));
    }
  }, [playlists]);

  const addPlaylist = (name: string) => {
    setPlaylists((prev) => [
      ...prev,
      { id: `playlist-${Date.now()}`, name, jobEntries: [] },
    ]);
  };

  const addJobEntry = (playlistId: string, jobEntry: Omit<JobEntry, 'id' | 'createdAt'>) => {
    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist.id === playlistId
          ? {
              ...playlist,
              jobEntries: [
                ...playlist.jobEntries,
                { ...jobEntry, id: `job-${Date.now()}`, createdAt: new Date().toISOString() },
              ],
            }
          : playlist,
      ),
    );
  };

  const updateJobEntryStatus = (playlistId: string, jobEntryId: string, newStatus: JobEntryStatus) => {
    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist.id === playlistId
          ? {
              ...playlist,
              jobEntries: playlist.jobEntries.map((job) =>
                job.id === jobEntryId ? { ...job, status: newStatus } : job,
              ),
            }
          : playlist,
      ),
    );
  };

  const updateJobEntry = (playlistId: string, jobEntryId: string, updatedFields: Partial<JobEntry>) => {
    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist.id === playlistId
          ? {
              ...playlist,
              jobEntries: playlist.jobEntries.map((job) =>
                job.id === jobEntryId ? { ...job, ...updatedFields } : job,
              ),
            }
          : playlist,
      ),
    );
  };

  const deleteJobEntry = (playlistId: string, jobEntryId: string) => {
    setPlaylists((prev) =>
      prev.map((playlist) =>
        playlist.id === playlistId
          ? {
              ...playlist,
              jobEntries: playlist.jobEntries.filter((job) => job.id !== jobEntryId),
            }
          : playlist,
      ),
    );
  };

  const deletePlaylist = (playlistId: string) => {
    setPlaylists((prev) => prev.filter((playlist) => playlist.id !== playlistId));
  };

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