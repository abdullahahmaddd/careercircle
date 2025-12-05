"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';
import { ParsedResume } from '@/utils/resumeParser';
import { useAuth } from './AuthContext'; // To get current user ID

// Define Resume entity interface
export interface Resume {
  id: string;
  userId: string;
  type: 'master' | 'version';
  name: string; // e.g., "Master Resume", "Marketing Associate Version"
  content: ParsedResume; // The actual resume data
  createdAt: string;
  lastModifiedAt: string;
  sourceMasterId?: string; // For version resumes, links to master
  jobDescriptionId?: string; // For version resumes, links to a specific JD if tailored
}

// Define the shape of the context
interface ResumeContextType {
  masterResume: Resume | null;
  versionResumes: Resume[];
  loadUserResumes: (userId: string) => void;
  saveMasterResume: (userId: string, resumeContent: ParsedResume) => Promise<Resume>;
  updateMasterResumeContent: (userId: string, resumeContent: ParsedResume) => Promise<Resume>;
  createVersionResume: (userId: string, masterResumeId: string, name: string, content: ParsedResume, jobDescriptionId?: string) => Promise<Resume>;
  updateVersionResumeContent: (versionResumeId: string, resumeContent: ParsedResume) => Promise<Resume | null>;
  deleteResume: (resumeId: string) => Promise<boolean>;
  syncVersionToMaster: (versionResumeId: string) => Promise<boolean>;
  getResumeById: (resumeId: string) => Resume | undefined;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export const ResumeProvider = ({ children }: { children: ReactNode }) => {
  const { currentUser } = useAuth();
  const [masterResume, setMasterResume] = useState<Resume | null>(null);
  const [versionResumes, setVersionResumes] = useState<Resume[]>([]);

  // Helper to get all resumes from localStorage for a user
  const getResumesFromLocalStorage = useCallback((userId: string): Resume[] => {
    if (typeof window === 'undefined') return [];
    const allResumes: Resume[] = JSON.parse(localStorage.getItem('careerCircleResumes') || '[]');
    return allResumes.filter(r => r.userId === userId);
  }, []);

  // Helper to save all resumes to localStorage
  const saveAllResumesToLocalStorage = useCallback((allUserResumes: Resume[]) => {
    if (typeof window === 'undefined') return;
    const existingGlobalResumes: Resume[] = JSON.parse(localStorage.getItem('careerCircleResumes') || '[]');
    const otherUsersResumes = existingGlobalResumes.filter(r => r.userId !== currentUser?.id);
    localStorage.setItem('careerCircleResumes', JSON.stringify([...otherUsersResumes, ...allUserResumes]));
  }, [currentUser]);

  // Load user resumes on component mount or currentUser change
  useEffect(() => {
    if (currentUser) {
      loadUserResumes(currentUser.id);
    } else {
      setMasterResume(null);
      setVersionResumes([]);
    }
  }, [currentUser]); // Removed getResumesFromLocalStorage from dependency array to avoid infinite loop

  const loadUserResumes = useCallback((userId: string) => {
    const userResumes = getResumesFromLocalStorage(userId);
    setMasterResume(userResumes.find(r => r.type === 'master') || null);
    setVersionResumes(userResumes.filter(r => r.type === 'version'));
  }, [getResumesFromLocalStorage]);

  const saveMasterResume = async (userId: string, resumeContent: ParsedResume): Promise<Resume> => {
    const newMaster: Resume = {
      id: `master-${Date.now()}`,
      userId,
      type: 'master',
      name: 'Master Resume',
      content: resumeContent,
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
    };
    setMasterResume(newMaster);
    setVersionResumes(prev => {
      saveAllResumesToLocalStorage([...prev, newMaster]);
      return prev;
    });
    toast.success("Master Resume created!");
    return newMaster;
  };

  const updateMasterResumeContent = async (userId: string, resumeContent: ParsedResume): Promise<Resume> => {
    if (!masterResume || masterResume.userId !== userId) {
      throw new Error("Master resume not found or unauthorized.");
    }
    const updatedMaster = { ...masterResume, content: resumeContent, lastModifiedAt: new Date().toISOString() };
    setMasterResume(updatedMaster);
    setVersionResumes(prev => {
      saveAllResumesToLocalStorage([...prev, updatedMaster]);
      return prev;
    });
    toast.success("Master Resume updated!");
    return updatedMaster;
  };

  const createVersionResume = async (userId: string, masterResumeId: string, name: string, content: ParsedResume, jobDescriptionId?: string): Promise<Resume> => {
    const newVersion: Resume = {
      id: `version-${Date.now()}`,
      userId,
      type: 'version',
      name,
      content,
      createdAt: new Date().toISOString(),
      lastModifiedAt: new Date().toISOString(),
      sourceMasterId: masterResumeId,
      jobDescriptionId,
    };
    setVersionResumes(prev => {
      const updatedVersions = [...prev, newVersion];
      saveAllResumesToLocalStorage([...(masterResume ? [masterResume] : []), ...updatedVersions]);
      return updatedVersions;
    });
    toast.success(`Version Resume "${name}" created!`);
    return newVersion;
  };

  const updateVersionResumeContent = async (versionResumeId: string, resumeContent: ParsedResume): Promise<Resume | null> => {
    let updatedVersion: Resume | null = null;
    setVersionResumes(prev => {
      const newVersions = prev.map(r => {
        if (r.id === versionResumeId && r.userId === currentUser?.id) {
          updatedVersion = { ...r, content: resumeContent, lastModifiedAt: new Date().toISOString() };
          return updatedVersion;
        }
        return r;
      });
      saveAllResumesToLocalStorage([...(masterResume ? [masterResume] : []), ...newVersions]);
      return newVersions;
    });
    if (updatedVersion) {
      toast.success(`Version Resume "${updatedVersion.name}" updated!`);
    } else {
      toast.error("Failed to update version resume.");
    }
    return updatedVersion;
  };

  const deleteResume = async (resumeId: string): Promise<boolean> => {
    if (!currentUser) {
      toast.error("You must be logged in to delete resumes.");
      return false;
    }

    const resumeToDelete = getResumeById(resumeId);
    if (!resumeToDelete || resumeToDelete.userId !== currentUser.id) {
      toast.error("Resume not found or unauthorized to delete.");
      return false;
    }

    if (resumeToDelete.type === 'master') {
      // Delete master and all associated versions
      setMasterResume(null);
      setVersionResumes([]);
      saveAllResumesToLocalStorage([]); // Clear all user resumes
      toast.success("Master Resume and all versions deleted.");
    } else {
      // Delete only the specific version
      setVersionResumes(prev => {
        const newVersions = prev.filter(r => r.id !== resumeId);
        saveAllResumesToLocalStorage([...(masterResume ? [masterResume] : []), ...newVersions]);
        return newVersions;
      });
      toast.success(`Version Resume "${resumeToDelete.name}" deleted.`);
    }
    return true;
  };

  const syncVersionToMaster = async (versionResumeId: string): Promise<boolean> => {
    if (!currentUser || !masterResume) {
      toast.error("Master Resume not found or user not logged in.");
      return false;
    }

    const version = versionResumes.find(r => r.id === versionResumeId && r.userId === currentUser.id);
    if (!version) {
      toast.error("Version Resume not found or unauthorized.");
      return false;
    }

    const updatedMaster = { ...masterResume, content: version.content, lastModifiedAt: new Date().toISOString() };
    setMasterResume(updatedMaster);
    setVersionResumes(prev => {
      saveAllResumesToLocalStorage([...prev, updatedMaster]);
      return prev;
    });
    toast.success(`Changes from "${version.name}" synced to Master Resume!`);
    return true;
  };

  const getResumeById = (resumeId: string): Resume | undefined => {
    if (masterResume?.id === resumeId) return masterResume;
    return versionResumes.find(r => r.id === resumeId);
  };

  return (
    <ResumeContext.Provider
      value={{
        masterResume,
        versionResumes,
        loadUserResumes,
        saveMasterResume,
        updateMasterResumeContent,
        createVersionResume,
        updateVersionResumeContent,
        deleteResume,
        syncVersionToMaster,
        getResumeById,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
};

export const useResumes = () => {
  const context = useContext(ResumeContext);
  if (context === undefined) {
    throw new Error('useResumes must be used within a ResumeProvider');
  }
  return context;
};