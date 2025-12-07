"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { toast } from 'sonner';
import { ParsedResume } from '@/utils/resumeParser';
import { useAuth } from './AuthContext'; // To get current user ID
import api from '@/lib/api';

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

// Helper to map backend response to frontend interface
const mapResume = (apiResume: any): Resume => {
  const id = apiResume._id || apiResume.id;
  if (!id) {
    console.warn('Resume ID is missing in API response:', apiResume);
  }
  return {
    id: id,
    userId: apiResume.user_id,
    type: apiResume.type,
    name: apiResume.name,
    content: apiResume.content,
    createdAt: apiResume.created_at,
    lastModifiedAt: apiResume.last_modified_at,
    sourceMasterId: apiResume.source_master_id,
    jobDescriptionId: apiResume.job_description_id,
  };
};

// Define the shape of the context
interface ResumeContextType {
  masterResume: Resume | null;
  versionResumes: Resume[];
  loadUserResumes: (userId: string) => void;
  saveMasterResume: (userId: string, resumeContent: ParsedResume) => Promise<Resume | null>;
  updateMasterResumeContent: (userId: string, resumeContent: ParsedResume) => Promise<Resume | null>;
  createVersionResume: (userId: string, masterResumeId: string, name: string, content: ParsedResume, jobDescriptionId?: string) => Promise<Resume | null>;
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

  const loadUserResumes = useCallback(async (userId: string) => {
    try {
      const response = await api.get('/resumes/');
      console.log('Fetched resumes response:', response.data);
      const resumes = response.data.map(mapResume);
      setMasterResume(resumes.find((r: Resume) => r.type === 'master') || null);
      setVersionResumes(resumes.filter((r: Resume) => r.type === 'version'));
    } catch (error) {
      console.error('Failed to load resumes:', error);
      toast.error('Failed to load resumes.');
    }
  }, []);

  // Load user resumes on component mount or currentUser change
  useEffect(() => {
    if (currentUser) {
      loadUserResumes(currentUser.id);
    } else {
      setMasterResume(null);
      setVersionResumes([]);
    }
  }, [currentUser, loadUserResumes]);

  const saveMasterResume = async (userId: string, resumeContent: ParsedResume): Promise<Resume | null> => {
    try {
      const payload = {
        name: 'Master Resume',
        content: resumeContent,
        type: 'master',
      };
      const response = await api.post('/resumes/', payload);
      const newMaster = mapResume(response.data);
      setMasterResume(newMaster);
      toast.success("Master Resume created!");
      return newMaster;
    } catch (error) {
      console.error('Failed to create master resume:', error);
      toast.error('Failed to create Master Resume.');
      return null;
    }
  };

  const updateMasterResumeContent = async (userId: string, resumeContent: ParsedResume): Promise<Resume | null> => {
    if (!masterResume) {
      toast.error("Master resume not found.");
      return null;
    }
    if (!masterResume.id) {
      console.error("Master resume ID is undefined", masterResume);
      toast.error("Cannot update master resume: ID is missing.");
      return null;
    }
    try {
      const payload = {
        content: resumeContent,
      };
      const response = await api.put(`/resumes/${masterResume.id}`, payload);
      const updatedMaster = mapResume(response.data);
      setMasterResume(updatedMaster);
      toast.success("Master Resume updated!");
      return updatedMaster;
    } catch (error) {
      console.error('Failed to update master resume:', error);
      toast.error('Failed to update Master Resume.');
      return null;
    }
  };

  const createVersionResume = async (userId: string, masterResumeId: string, name: string, content: ParsedResume, jobDescriptionId?: string): Promise<Resume | null> => {
    try {
      const payload = {
        name,
        content,
        type: 'version',
        source_master_id: masterResumeId,
        job_description_id: jobDescriptionId,
      };
      const response = await api.post('/resumes/', payload);
      const newVersion = mapResume(response.data);
      setVersionResumes(prev => [...prev, newVersion]);
      toast.success(`Version Resume "${name}" created!`);
      return newVersion;
    } catch (error) {
      console.error('Failed to create version resume:', error);
      toast.error('Failed to create Version Resume.');
      return null;
    }
  };

  const updateVersionResumeContent = async (versionResumeId: string, resumeContent: ParsedResume): Promise<Resume | null> => {
    try {
      const payload = {
        content: resumeContent,
      };
      const response = await api.put(`/resumes/${versionResumeId}`, payload);
      const updatedVersion = mapResume(response.data);
      
      setVersionResumes(prev => prev.map(r => r.id === versionResumeId ? updatedVersion : r));
      
      toast.success(`Version Resume "${updatedVersion.name}" updated!`);
      return updatedVersion;
    } catch (error) {
      console.error('Failed to update version resume:', error);
      toast.error('Failed to update Version Resume.');
      return null;
    }
  };

  const deleteResume = async (resumeId: string): Promise<boolean> => {
    const resumeToDelete = getResumeById(resumeId);
    if (!resumeToDelete) {
      toast.error("Resume not found.");
      return false;
    }

    try {
      await api.delete(`/resumes/${resumeId}`);
      
      if (resumeToDelete.type === 'master') {
        setMasterResume(null);
        // Assuming backend handles cascading delete of versions if master is deleted,
        // or we need to refresh list. For now, let's clear local versions too if that's the logic.
        // Actually, normally deleting master might not delete versions automatically unless backend does it.
        // But if master is gone, versions linked to it might need handling.
        // Let's reload to be safe or just clear.
        setVersionResumes([]);
        // Ideally we should reload
        loadUserResumes(currentUser!.id);
      } else {
        setVersionResumes(prev => prev.filter(r => r.id !== resumeId));
      }

      toast.success(`Resume deleted.`);
      return true;
    } catch (error) {
      console.error('Failed to delete resume:', error);
      toast.error('Failed to delete resume.');
      return false;
    }
  };

  const syncVersionToMaster = async (versionResumeId: string): Promise<boolean> => {
    if (!masterResume) {
      toast.error("Master Resume not found.");
      return false;
    }

    const version = versionResumes.find(r => r.id === versionResumeId);
    if (!version) {
      toast.error("Version Resume not found.");
      return false;
    }

    // Call updateMasterResumeContent with the version's content
    const result = await updateMasterResumeContent(masterResume.userId, version.content);
    if (result) {
      toast.success(`Changes from "${version.name}" synced to Master Resume!`);
      return true;
    }
    return false;
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