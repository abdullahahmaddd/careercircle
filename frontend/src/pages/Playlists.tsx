"use client";

import React, { useState, useMemo } from "react";
import { usePlaylists, JobEntry, JobEntryStatus } from "@/context/PlaylistContext";
import JobEntryCard from "@/components/JobEntryCard";
import AddJobEntryDialog from "@/components/AddJobEntryDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter, SortAsc, SortDesc } from "lucide-react";
import { Button } from "@/components/ui/button";

const Playlists = () => {
  const { playlists } = usePlaylists();
  const defaultPlaylist = playlists.find(p => p.id === 'default-playlist'); // Assuming the first playlist is the default
  const jobEntries = defaultPlaylist ? defaultPlaylist.jobEntries : [];

  const [filterStatus, setFilterStatus] = useState<JobEntryStatus | 'all'>('all');
  const [sortBy, setSortBy] = useState<'deadline' | 'createdAt'>('deadline');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchTerm, setSearchTerm] = useState('');

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

  if (!defaultPlaylist) {
    return (
      <div className="p-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Playlists</h1>
        <p className="text-muted-foreground">No default playlist found. Please ensure the app is initialized correctly.</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Playlists</h1>
      <p className="text-muted-foreground mb-6">Organize your job applications into custom playlists.</p>

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
        <AddJobEntryDialog playlistId={defaultPlaylist.id} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAndSortedJobEntries.length > 0 ? (
          filteredAndSortedJobEntries.map(job => (
            <JobEntryCard key={job.id} jobEntry={job} playlistId={defaultPlaylist.id} />
          ))
        ) : (
          <p className="col-span-full text-center text-muted-foreground">No job entries found matching your criteria.</p>
        )}
      </div>
    </div>
  );
};

export default Playlists;