'use client';

import { useState, useEffect, useMemo } from 'react';
import toast from 'react-hot-toast';

export interface ContactGroup {
  id: string;
  name: string;
  description?: string;
  contactCount: number;
  dateCreated: string;
  dateUpdated: string;
}

export function useContactGroups() {
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<keyof ContactGroup>('dateCreated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 25;

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock data for demonstration
      const mockGroups: ContactGroup[] = [
        {
          id: '1',
          name: 'VIP_Customers',
          description: 'High-value customers requiring special attention',
          contactCount: 156,
          dateCreated: '2024-01-15T10:30:00Z',
          dateUpdated: '2024-03-20T14:45:00Z'
        },
        {
          id: '2',
          name: 'Newsletter_Subscribers',
          description: 'Users who opted in for newsletter updates',
          contactCount: 1234,
          dateCreated: '2024-02-01T09:00:00Z',
          dateUpdated: '2024-03-19T16:20:00Z'
        },
        {
          id: '3',
          name: 'Support_Contacts',
          description: 'Customers who have opened support tickets',
          contactCount: 789,
          dateCreated: '2024-02-15T11:00:00Z',
          dateUpdated: '2024-03-18T09:30:00Z'
        }
      ];

      setGroups(mockGroups);
    } catch (error) {
      toast.error('Failed to load contact groups');
    } finally {
      setLoading(false);
    }
  };

  const createGroup = async (name: string, description: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));

      const newGroup: ContactGroup = {
        id: Date.now().toString(),
        name: name,
        description: description,
        contactCount: 0,
        dateCreated: new Date().toISOString(),
        dateUpdated: new Date().toISOString()
      };

      setGroups(prev => [newGroup, ...prev]);
      toast.success('Group created successfully');
      return newGroup;
    } catch (error) {
      toast.error('Failed to create group');
      throw error;
    }
  };

  const deleteGroup = async (groupId: string) => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setGroups(prev => prev.filter(g => g.id !== groupId));
      toast.success('Group deleted successfully');
    } catch (error) {
      toast.error('Failed to delete group');
      throw error;
    }
  };

  const bulkDeleteGroups = async () => {
    if (selectedGroups.length === 0) return;

    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setGroups(prev => prev.filter(g => !selectedGroups.includes(g.id)));
      setSelectedGroups([]);
      toast.success('Groups deleted successfully');
    } catch (error) {
      toast.error('Failed to delete groups');
      throw error;
    }
  };

  const toggleSelectGroup = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedGroups.length === filteredGroups.length) {
      setSelectedGroups([]);
    } else {
      setSelectedGroups(filteredGroups.map(g => g.id));
    }
  };

  const handleSort = (column: keyof ContactGroup) => {
    if (sortBy === column) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Filter and sort logic
  const filteredGroups = useMemo(() => {
    return groups.filter(group =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [groups, searchQuery]);

  const sortedGroups = useMemo(() => {
    return [...filteredGroups].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });
  }, [filteredGroups, sortBy, sortOrder]);

  return {
    loading,
    groups: sortedGroups,
    searchQuery,
    selectedGroups,
    sortBy,
    sortOrder,
    currentPage,
    rowsPerPage,
    setSearchQuery,
    setCurrentPage,
    toggleSelectGroup,
    toggleSelectAll,
    handleSort,
    createGroup,
    deleteGroup,
    bulkDeleteGroups,
    fetchGroups
  };
}