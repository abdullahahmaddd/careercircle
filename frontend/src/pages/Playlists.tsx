"use client";

import React, { useState, useMemo, useEffect } from "react";
import { usePlaylists, JobEntry, JobEntryStatus } from "@/context/PlaylistContext";
import JobEntryCard from "@/components/JobEntryCard";
import AddJobEntryDialog from "@/components/AddJobEntryDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter, SortAsc, SortDesc, PlusCircle, ListFilter, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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

const Playlists = () => {
  const { playlists, addPlaylist, deletePlaylist } = usePlaylists();

  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | undefined>(undefined);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreatePlaylistDialogOpen, setIsCreatePlaylistDialogOpen] = useState(false);

  const [filterStatus, setFilterStatus] = useState<JobEntryStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'createdAt'>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  // Set initial selected playlist to the first one available
  useEffect(() => {
    if (playlists.length > 0 && !selectedPlaylistId) {
      setSelectedPlaylistId(playlists[0].id);
    } else if (playlists.length === 0) {
      setSelectedPlaylistId(undefined);
    }
  }, [playlists, selectedPlaylistId]);

  const currentPlaylist = useMemo(() => {
    return playlists.find(p => p.id === selectedPlaylistId);
  }, [playlists, selectedPlaylistId]);

  const jobEntries = currentPlaylist ? currentPlaylist.jobEntries : [];

  const filteredAndSortedJobEntries = useMemo(() => {
    let filtered = jobEntries;

    // Search
    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.roleTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.jdText?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(job => job.status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      let compareValue = 0;
      if (sortBy === 'deadline') {
        const dateA = new Date(a.applicationDeadline).getTime();
        const dateB = new Date(b.applicationDeadline).getTime();
        compareValue = dateA - dateB;
      } else if (sortBy === 'createdAt') {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        compareValue = dateA - dateB;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [jobEntries, filterStatus, sortBy, sortOrder, searchTerm]);

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      addPlaylist(newPlaylistName.trim());
      setNewPlaylistName("");
      setIsCreatePlaylistDialogOpen(false);
      toast.success(`Playlist "${newPlaylistName.trim()}" created!`);
    } else {
      toast.error("Playlist name cannot be empty.");
    }
  };

  const handleDeletePlaylist = () => {
    if (selectedPlaylistId) {
      deletePlaylist(selectedPlaylistId);
      setSelectedPlaylistId(undefined); // Clear selection after deletion
      toast.success(`Playlist "${currentPlaylist?.name}" deleted.`);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Playlists</h1>
      <p className="text-muted-foreground mb-6">Organize your job applications into custom playlists.</p>

      <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
        {/* Playlist Selector */}
        <div className="flex-1 w-full md:w-auto">
          <Select value={selectedPlaylistId} onValueChange={setSelectedPlaylistId}>
            <SelectTrigger className="w-full">
              <ListFilter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select a Playlist" />
            </SelectTrigger>
            <SelectContent>
              {playlists.map(playlist => (
                <SelectItem key={playlist.id} value={playlist.id}>
                  {playlist.name} ({playlist.jobEntries.length} jobs)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Create Playlist Button */}
        <Dialog open={isCreatePlaylistDialogOpen} onOpenChange={setIsCreatePlaylistDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-full md:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> New Playlist
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Playlist</DialogTitle>
              <DialogDescription>Enter a name for your new job application playlist.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="new-playlist-name">Playlist Name</Label>
                <Input
                  id="new-playlist-name"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="e.g., Software Engineer Applications"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreatePlaylistDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim()}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Playlist Button */}
        {selectedPlaylistId && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full md:w-auto" disabled={playlists.length <= 1}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Playlist
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the playlist "{currentPlaylist?.name}" and all {currentPlaylist?.jobEntries.length || 0} associated job entries within it.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeletePlaylist}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      {!currentPlaylist ? (
        <p className="text-center text-muted-foreground">No playlists available. Create a new one to get started!</p>
      ) : (
        <>
          <h2 className="text-2xl font-semibold mb-4">{currentPlaylist.name} Jobs</h2>
          <div className="flex flex-col md:flex-row gap-4 mb-6 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search jobs by title, location, or keywords..."
                className="pl-9 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              <Select value={filterStatus} onValueChange={(value: JobEntryStatus | 'all') => setFilterStatus(value)}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Not started">Not started</SelectItem>
                  <SelectItem value="Draft ready">Draft ready</SelectItem>
                  <SelectItem value="Applied">Applied</SelectItem>
                  <SelectItem value="Interviewing">Interviewing</SelectItem>
                  <SelectItem value="Offer">Offer</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: 'deadline' | 'createdAt') => setSortBy(value)}>
                <SelectTrigger className="w-full md:w-[180px]">
                  {sortOrder === 'asc' ? <SortAsc className="mr-2 h-4 w-4" /> : <SortDesc className="mr-2 h-4 w-4" />}
                  <SelectValue placeholder="Sort By" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deadline">Application Deadline</SelectItem>
                  <SelectItem value="createdAt">Date Added</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}>
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>
            </div>
            <AddJobEntryDialog playlistId={currentPlaylist.id} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedJobEntries.length > 0 ? (
              filteredAndSortedJobEntries.map(job => (
                <JobEntryCard key={job.id} jobEntry={job} playlistId={currentPlaylist.id} />
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground">No job entries found matching your criteria in this playlist.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Playlists;