"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

// Define User interface
export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Only for mock, never store real passwords client-side
  hasCompletedFirstApplication: boolean; // New flag
}

// Define AuthContextType
interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateProfile: (updatedFields: Partial<User>) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  markFirstApplicationComplete: () => Promise<void>; // New function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    // Load user from localStorage on initial render
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('careerCircleCurrentUser');
      if (storedUser) {
        const user: User = JSON.parse(storedUser);
        setCurrentUser(user);
        setIsAuthenticated(true);
      }
    }
  }, []);

  const saveUserToLocalStorage = (user: User | null) => {
    if (typeof window !== 'undefined') {
      if (user) {
        localStorage.setItem('careerCircleCurrentUser', JSON.stringify(user));
      } else {
        localStorage.removeItem('careerCircleCurrentUser');
      }
    }
  };

  const updateAllUsersInLocalStorage = (updatedUser: User) => {
    if (typeof window !== 'undefined') {
      const storedUsers: User[] = JSON.parse(localStorage.getItem('careerCircleUsers') || '[]');
      const updatedUsers = storedUsers.map((u: User) =>
        u.id === updatedUser.id ? updatedUser : u
      );
      localStorage.setItem('careerCircleUsers', JSON.stringify(updatedUsers));
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock login logic
    if (typeof window !== 'undefined') {
      const storedUsers: User[] = JSON.parse(localStorage.getItem('careerCircleUsers') || '[]');
      const user = storedUsers.find((u: User) => u.email === email && u.password === password);

      if (user) {
        setCurrentUser(user);
        setIsAuthenticated(true);
        saveUserToLocalStorage(user);
        toast.success(`Welcome back, ${user.name}!`);
        return true;
      } else {
        toast.error('Invalid email or password.');
        return false;
      }
    }
    return false;
  };

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    // Mock registration logic
    if (typeof window !== 'undefined') {
      const storedUsers: User[] = JSON.parse(localStorage.getItem('careerCircleUsers') || '[]');
      if (storedUsers.some((u: User) => u.email === email)) {
        toast.error('An account with this email already exists.');
        return false;
      }

      const newUser: User = { id: `user-${Date.now()}`, name, email, password, hasCompletedFirstApplication: false }; // Initialize new user with false
      localStorage.setItem('careerCircleUsers', JSON.stringify([...storedUsers, newUser]));
      setCurrentUser(newUser);
      setIsAuthenticated(true);
      saveUserToLocalStorage(newUser);
      toast.success(`Account created successfully! Welcome, ${name}!`);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    saveUserToLocalStorage(null);
    toast.info('You have been logged out.');
  };

  const updateProfile = async (updatedFields: Partial<User>): Promise<boolean> => {
    if (!currentUser) {
      toast.error('You must be logged in to update your profile.');
      return false;
    }

    const updatedUser = { ...currentUser, ...updatedFields };

    if (typeof window !== 'undefined') {
      updateAllUsersInLocalStorage(updatedUser);
      setCurrentUser(updatedUser);
      saveUserToLocalStorage(updatedUser);
      toast.success('Profile updated successfully!');
      return true;
    }
    return false;
  };

  const deleteAccount = async (): Promise<boolean> => {
    if (!currentUser) {
      toast.error('You must be logged in to delete your account.');
      return false;
    }

    if (typeof window !== 'undefined') {
      const storedUsers: User[] = JSON.parse(localStorage.getItem('careerCircleUsers') || '[]');
      const filteredUsers = storedUsers.filter((u: User) => u.id !== currentUser.id);
      localStorage.setItem('careerCircleUsers', JSON.stringify(filteredUsers));

      // Also remove any associated playlists/job entries for this user (mock)
      // For simplicity, we'll just clear all playlists for now, or assume they are tied to user ID
      // A more robust implementation would filter playlists by ownerId
      localStorage.removeItem('careerCirclePlaylists'); // Clear all playlists for simplicity in mock

      logout(); // Log out the user after deletion
      toast.success('Your account has been deleted.');
      return true;
    }
    return false;
  };

  const markFirstApplicationComplete = async () => {
    if (currentUser) {
      const updatedUser = { ...currentUser, hasCompletedFirstApplication: true };
      updateAllUsersInLocalStorage(updatedUser);
      setCurrentUser(updatedUser);
      saveUserToLocalStorage(updatedUser);
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