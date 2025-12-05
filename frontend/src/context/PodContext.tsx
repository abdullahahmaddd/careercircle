"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { ParsedResume } from '@/utils/resumeParser'; // Assuming ParsedResume is available

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

// Define the shape of the context
interface PodContextType {
  pods: Pod[];
  createPod: (name: string, ownerId: string, ownerName: string, ownerEmail: string) => Promise<Pod | null>;
  invitePeerToPod: (podId: string, peerEmail: string) => Promise<boolean>;
  shareResumeInPod: (podId: string, resumeOwnerId: string, resumeOwnerName: string, versionResume: ParsedResume) => Promise<SharedResume | null>;
  addCommentToSharedResume: (sharedResumeId: string, authorId: string, authorName: string, text: string, location?: string) => Promise<boolean>;
  deleteComment: (sharedResumeId: string, commentId: string, currentUserId: string, resumeOwnerId: string) => Promise<boolean>;
  getPodById: (podId: string) => Pod | undefined;
  getSharedResumeById: (sharedResumeId: string) => SharedResume | undefined;
}

const PodContext = createContext<PodContextType | undefined>(undefined);

export const PodProvider = ({ children }: { children: ReactNode }) => {
  const [pods, setPods] = useState<Pod[]>(() => {
    if (typeof window !== 'undefined') {
      const savedPods = localStorage.getItem('careerCirclePods');
      return savedPods ? JSON.parse(savedPods) : [];
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('careerCirclePods', JSON.stringify(pods));
    }
  }, [pods]);

  const createPod = async (name: string, ownerId: string, ownerName: string, ownerEmail: string): Promise<Pod | null> => {
    const newPod: Pod = {
      id: `pod-${Date.now()}`,
      ownerId,
      name,
      members: [{ id: ownerId, name: ownerName, email: ownerEmail }],
      sharedResumes: [],
      createdAt: new Date().toISOString(),
    };
    setPods((prev) => [...prev, newPod]);
    toast.success(`Pod "${name}" created!`);
    return newPod;
  };

  const invitePeerToPod = async (podId: string, peerEmail: string): Promise<boolean> => {
    // Mock: In a real app, this would send an email invitation and handle acceptance.
    // For now, we'll just add the peer to the pod directly if they "accept" (mock).
    const storedUsers = JSON.parse(localStorage.getItem('careerCircleUsers') || '[]');
    const peerUser = storedUsers.find((u: any) => u.email === peerEmail);

    if (!peerUser) {
      toast.error(`No user found with email: ${peerEmail}.`);
      return false;
    }

    setPods((prev) =>
      prev.map((pod) => {
        if (pod.id === podId) {
          if (pod.members.some(m => m.id === peerUser.id)) {
            toast.info(`${peerUser.name} is already a member of "${pod.name}".`);
            return pod;
          }
          toast.success(`Mock: Invitation sent to ${peerUser.name} for "${pod.name}".`);
          // For mock, directly add to members
          return {
            ...pod,
            members: [...pod.members, { id: peerUser.id, name: peerUser.name, email: peerUser.email }],
          };
        }
        return pod;
      }),
    );
    return true;
  };

  const shareResumeInPod = async (podId: string, resumeOwnerId: string, resumeOwnerName: string, versionResume: ParsedResume): Promise<SharedResume | null> => {
    const newSharedResume: SharedResume = {
      id: `shared-resume-${Date.now()}`,
      podId,
      resumeOwnerId,
      resumeOwnerName,
      versionResume,
      sharedDate: new Date().toISOString(),
      comments: [],
    };

    setPods((prev) =>
      prev.map((pod) =>
        pod.id === podId
          ? { ...pod, sharedResumes: [...pod.sharedResumes, newSharedResume] }
          : pod,
      ),
    );
    toast.success(`Resume shared in Pod "${getPodById(podId)?.name || ''}"!`);
    return newSharedResume;
  };

  const addCommentToSharedResume = async (sharedResumeId: string, authorId: string, authorName: string, text: string, location?: string): Promise<boolean> => {
    const newComment: Comment = {
      id: `comment-${Date.now()}`,
      authorId,
      authorName,
      text,
      location,
      createdAt: new Date().toISOString(),
    };

    setPods((prev) =>
      prev.map((pod) => ({
        ...pod,
        sharedResumes: pod.sharedResumes.map((sr) =>
          sr.id === sharedResumeId
            ? { ...sr, comments: [...sr.comments, newComment] }
            : sr,
        ),
      })),
    );
    toast.info(`New comment added by ${authorName}.`); // In-app notification (FR-007)
    // Mock email notification (FR-007)
    console.log(`Mock: Email notification sent for new comment on shared resume ${sharedResumeId}.`);
    return true;
  };

  const deleteComment = async (sharedResumeId: string, commentId: string, currentUserId: string, resumeOwnerId: string): Promise<boolean> => {
    let commentDeleted = false;
    setPods((prev) =>
      prev.map((pod) => ({
        ...pod,
        sharedResumes: pod.sharedResumes.map((sr) => {
          if (sr.id === sharedResumeId) {
            const updatedComments = sr.comments.filter(comment => {
              // Only allow deletion if current user is the author or the resume owner
              if (comment.id === commentId && (comment.authorId === currentUserId || resumeOwnerId === currentUserId)) {
                commentDeleted = true;
                return false; // Remove this comment
              }
              return true; // Keep other comments
            });
            return { ...sr, comments: updatedComments };
          }
          return sr;
        }),
      })),
    );

    if (commentDeleted) {
      toast.success("Comment deleted successfully.");
      return true;
    } else {
      toast.error("Failed to delete comment. You might not have permission.");
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