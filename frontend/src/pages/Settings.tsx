"use client";

import React, { useState, useEffect } from "react";
import { useAuth, User } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Download, Eye, EyeOff, Loader2 } from "lucide-react";
import api from "@/lib/api";

const Settings = () => {
  const { isAuthenticated, currentUser, updateProfile, deleteAccount, logout } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(currentUser?.name || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [isEditing, setIsEditing] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/auth"); // Redirect to auth if not logged in
    } else if (currentUser) {
      setName(currentUser.name);
      setEmail(currentUser.email);
    }
  }, [isAuthenticated, currentUser, navigate]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      // Only name can be updated, email is not changeable
      const updatedFields: Partial<User> = { name };
      const success = await updateProfile(updatedFields);
      if (success) {
        setIsEditing(false);
      }
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error("Change password error:", error);
      toast.error(error.response?.data?.detail || "Failed to change password.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDownloadUserData = () => {
    if (!currentUser) {
      toast.error("No user data to download.");
      return;
    }

    const userId = currentUser.id;
    const userData: { [key: string]: any } = {
      userProfile: currentUser,
      resumes: [],
      playlists: [],
      pods: [],
    };

    // Gather user-specific data from localStorage
    if (typeof window !== 'undefined') {
      const allResumes = JSON.parse(localStorage.getItem('careerCircleResumes') || '[]');
      userData.resumes = allResumes.filter((r: any) => r.userId === userId);

      const allPlaylists = JSON.parse(localStorage.getItem('careerCirclePlaylists') || '[]');
      // This filtering is a bit tricky due to the mock playlist structure.
      // Assuming 'default-playlist' is shared or not directly user-owned in the same way.
      // For a robust solution, Playlist should have an ownerId.
      userData.playlists = allPlaylists.filter((p: any) => p.jobEntries.some((je: any) => je.id.startsWith('job-') && je.id.split('-')[1] === userId.split('-')[1]));

      const allPods = JSON.parse(localStorage.getItem('careerCirclePods') || '[]');
      userData.pods = allPods.filter((p: any) => p.ownerId === userId || p.members.some((m: any) => m.id === userId));
    }

    const filename = `careerCircle_data_${currentUser.name.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(userData, null, 2)], { type: "application/json" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Your data has been downloaded!");
  };

  const handleDeleteAccount = async () => {
    const success = await deleteAccount();
    if (success) {
      navigate("/auth"); // Redirect to auth page after account deletion
    }
  };

  if (!isAuthenticated || !currentUser) {
    return null; // Or a loading spinner, or redirect handled by useEffect
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Settings</h1>
      <p className="text-muted-foreground mb-6">Manage your profile and application preferences.</p>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your account's profile information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Email address cannot be changed.
              </p>
            </div>
            {isEditing ? (
              <div className="flex gap-2">
                <Button type="submit">Save Changes</Button>
                <Button variant="outline" onClick={() => {
                  setIsEditing(false);
                  setName(currentUser.name); // Revert changes
                  setEmail(currentUser.email);
                }}>Cancel</Button>
              </div>
            ) : (
              <Button type="button" onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </form>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Password Management</CardTitle>
          <CardDescription>Change your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 6 characters)"
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>
            <Button type="submit" disabled={isChangingPassword}>
              {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-destructive">Delete Account</CardTitle>
          <CardDescription>Permanently delete your account and all associated data.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <Button variant="outline" onClick={handleDownloadUserData}>
              <Download className="mr-2 h-4 w-4" /> Download My Data (JSON)
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">Delete Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;