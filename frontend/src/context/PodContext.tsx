"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';
import { ParsedResume } from '@/utils/resumeParser'; // Assuming ParsedResume is available
import api from '@/lib/api';
import { useAuth } from './AuthContext';

// Define types for Pods, Shared Resumes, and Comments
export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  location?: string; // e.g., "overall", "summary", "experience[0].description[1]"
  createdAt: string;
}

export interface SharedResume {
  id: string;
  podId: string;
  resumeOwnerId: string;
  resumeOwnerName: string;
  versionResume: ParsedResume; // The actual resume content
  sharedDate: string;
  comments: Comment[];
}

export interface Pod {
  id: string;
  ownerId: string;
  name: string;
  members: { id: string; name: string; email: string }[]; // Simplified member info
  sharedResumes: SharedResume[];
  createdAt: string;
}

// Helpers for data mapping
const mapComment = (c: any): Comment => ({
  id: c.id,
  authorId: c.author_id,
  authorName: c.author_name,
  text: c.text,
  location: c.location,
  createdAt: c.created_at,
});

const mapSharedResume = (sr: any, podId: string): SharedResume => ({
  id: sr.id,
  podId: podId,
  resumeOwnerId: sr.resume_owner_id,
  resumeOwnerName: sr.resume_owner_name,
  versionResume: sr.version_resume,
  sharedDate: sr.shared_date,
  comments: sr.comments ? sr.comments.map(mapComment) : [],
});

const mapMember = (m: any) => ({
  id: m.id,
  name: m.name,
  email: m.email,
});

const mapPod = (p: any): Pod => ({
  id: p.id,
  ownerId: p.owner_id,
  name: p.name,
  members: p.members ? p.members.map(mapMember) : [],
  sharedResumes: p.shared_resumes ? p.shared_resumes.map((sr: any) => mapSharedResume(sr, p.id)) : [],
  createdAt: p.created_at,
});

// Define the shape of the context
interface PodContextType {
  pods: Pod[];
  createPod: (name: string, ownerId: string, ownerName: string, ownerEmail: string) => Promise<Pod | null>;
  invitePeerToPod: (podId: string, peerEmail: string) => Promise<boolean>;
  shareResumeInPod: (podId: string, resumeId: string) => Promise<SharedResume | null>;
  addCommentToSharedResume: (sharedResumeId: string, authorId: string, authorName: string, text: string, location?: string) => Promise<boolean>;
  deleteComment: (sharedResumeId: string, commentId: string, currentUserId: string, resumeOwnerId: string) => Promise<boolean>;
  getPodById: (podId: string) => Pod | undefined;
  getSharedResumeById: (sharedResumeId: string) => SharedResume | undefined;
}

const PodContext = createContext<PodContextType | undefined>(undefined);

export const PodProvider = ({ children }: { children: ReactNode }) => {
  const { isAuthenticated } = useAuth();
  const [pods, setPods] = useState<Pod[]>([]);

  const loadPods = useCallback(async () => {
    try {
      const response = await api.get('/pods/');
      console.log('Raw /pods/ response:', response.data);
      setPods(response.data.map(mapPod));
    } catch (error) {
      console.error('Failed to load pods:', error);
      toast.error('Failed to load pods.');
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadPods();
    } else {
      setPods([]);
    }
  }, [isAuthenticated, loadPods]);

  const createPod = async (name: string, ownerId: string, ownerName: string, ownerEmail: string): Promise<Pod | null> => {
    try {
      const response = await api.post('/pods/', { name });
      const newPod = mapPod(response.data);
      setPods((prev) => [...prev, newPod]);
      toast.success(`Pod "${name}" created!`);
      return newPod;
    } catch (error) {
      console.error('Failed to create pod:', error);
      toast.error('Failed to create pod.');
      return null;
    }
  };

  const invitePeerToPod = async (podId: string, peerEmail: string): Promise<boolean> => {
    try {
      const response = await api.post(`/pods/${podId}/invite`, { email: peerEmail });
      const updatedPod = mapPod(response.data);
      setPods((prev) => prev.map(p => p.id === podId ? updatedPod : p));
      toast.success(`Invitation sent to ${peerEmail}`);
      return true;
    } catch (error: any) {
      console.error('Failed to invite peer:', error);
      toast.error(error.response?.data?.detail || 'Failed to invite peer.');
      return false;
    }
  };

  const shareResumeInPod = async (podId: string, resumeId: string): Promise<SharedResume | null> => {
    try {
      const response = await api.post(`/pods/${podId}/share`, { resume_id: resumeId });
      const updatedPod = mapPod(response.data);
      setPods((prev) => prev.map(p => p.id === podId ? updatedPod : p));
      
      // Find the new shared resume to return
      // Better: return the last shared resume
      const lastShared = updatedPod.sharedResumes[updatedPod.sharedResumes.length - 1];
      
      toast.success(`Resume shared in Pod!`);
      return lastShared;
    } catch (error: any) {
      console.error('Failed to share resume:', error);
      toast.error(error.response?.data?.detail || 'Failed to share resume.');
      return null;
    }
  };

  const addCommentToSharedResume = async (sharedResumeId: string, authorId: string, authorName: string, text: string, location?: string): Promise<boolean> => {
     // Backend only needs text and location. author info comes from token.
     // We need to find the podId for this sharedResumeId.
     // The context has `getSharedResumeById` but it doesn't give podId efficiently without searching.
     // But we can search.
     
     const pod = pods.find(p => p.sharedResumes.some(sr => sr.id === sharedResumeId));
     if (!pod) {
         toast.error("Pod not found for this resume.");
         return false;
     }
     
     try {
         const response = await api.post(`/pods/${pod.id}/shared/${sharedResumeId}/comments`, { text, location });
         const updatedPod = mapPod(response.data);
         setPods((prev) => prev.map(p => p.id === pod.id ? updatedPod : p));
         toast.success("Comment added!");
         return true;
     } catch (error) {
         console.error('Failed to add comment:', error);
         toast.error('Failed to add comment.');
         return false;
     }
  };

  const deleteComment = async (sharedResumeId: string, commentId: string, currentUserId: string, resumeOwnerId: string): Promise<boolean> => {
     const pod = pods.find(p => p.sharedResumes.some(sr => sr.id === sharedResumeId));
     if (!pod) return false;

    try {
      const response = await api.delete(`/pods/${pod.id}/shared/${sharedResumeId}/comments/${commentId}`);
      const updatedPod = mapPod(response.data);
      setPods((prev) => prev.map(p => p.id === pod.id ? updatedPod : p));
      toast.success("Comment deleted.");
      return true;
    } catch (error) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment.');
      return false;
    }
  };

  const getPodById = (podId: string) => pods.find(pod => pod.id === podId);
  const getSharedResumeById = (sharedResumeId: string) => {
    for (const pod of pods) {
      const sharedResume = pod.sharedResumes.find(sr => sr.id === sharedResumeId);
      if (sharedResume) return sharedResume;
    }
    return undefined;
  };

  return (
    <PodContext.Provider
      value={{
        pods,
        createPod,
        invitePeerToPod,
        shareResumeInPod,
        addCommentToSharedResume,
        deleteComment,
        getPodById,
        getSharedResumeById,
      }}
    >
      {children}
    </PodContext.Provider>
  );
};

export const usePods = () => {
  const context = useContext(PodContext);
  if (context === undefined) {
    throw new Error('usePods must be used within a PodProvider');
  }
  return context;
};