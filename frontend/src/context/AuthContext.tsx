"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import api from '@/lib/api';

// Define User interface
export interface User {
  id: string;
  name: string;
  email: string;
  hasCompletedFirstApplication: boolean;
}

// Define AuthContextType
interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  updateProfile: (updatedFields: Partial<User>) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  logout: () => void;
  markFirstApplicationComplete: () => Promise<void>; // New function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Fetch current user if token exists
  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      // Map _id to id if necessary
      const userData = response.data;
      const mappedUser = {
        ...userData,
        id: userData._id || userData.id
      };
      setCurrentUser(mappedUser);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // If fetch fails (e.g., token expired), logout locally
      logout();
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      fetchCurrentUser();
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token } = response.data;
      localStorage.setItem('access_token', access_token);
      await fetchCurrentUser();
      toast.success('Logged in successfully!');
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Invalid email or password.');
      return false;
    }
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await api.post('/auth/signup', { name, email, password });
      const { access_token } = response.data;
      localStorage.setItem('access_token', access_token);
      await fetchCurrentUser();
      toast.success(`Account created! Welcome, ${name}!`);
      return true;
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.response?.data?.detail || 'Registration failed.');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setIsAuthenticated(false);
    setCurrentUser(null);
    toast.info('You have been logged out.');
  };

  const updateProfile = async (updatedFields: Partial<User>): Promise<boolean> => {
    if (!currentUser) return false;

    try {
      // Build payload for backend
      const payload: Record<string, any> = {};

      if (updatedFields.name !== undefined) {
        payload.name = updatedFields.name;
      }
      if (updatedFields.hasCompletedFirstApplication !== undefined) {
        payload.has_completed_first_application = updatedFields.hasCompletedFirstApplication;
      }

      if (Object.keys(payload).length > 0) {
        await api.patch('/auth/me', payload);
      }

      // Refresh user data
      await fetchCurrentUser();
      toast.success('Profile updated successfully!');
      return true;
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error.response?.data?.detail || 'Failed to update profile.');
      return false;
    }
  };

  const deleteAccount = async (): Promise<boolean> => {
    // Backend API doesn't have a delete account endpoint yet.
    // For now, we will just log the user out and clear local state.
    logout();
    toast.info('Account deletion is not yet supported by the backend. Logged out locally.');
    return true;
  };

  const markFirstApplicationComplete = async () => {
    if (currentUser) {
      await updateProfile({ hasCompletedFirstApplication: true });
      console.log("First application workflow marked as complete.");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        login,
        register,
        logout,
        updateProfile,
        deleteAccount,
        markFirstApplicationComplete,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};