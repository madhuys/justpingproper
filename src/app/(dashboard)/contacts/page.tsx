'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Loader } from '@/components/atoms/Loader';
import { EmptyState } from '@/components/atoms/EmptyState';
import { CreateGroupModal } from '@/components/organisms/modals/CreateGroupModal';
import { 
  Search, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Users,
  Plus,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import contactsStrings from '@/data/strings/contacts.json';
import contactsState from '@/data/states/contacts.json';
import toast from 'react-hot-toast';
import { useUIPreferences } from '@/hooks/useUIPreferences';

interface ContactGroup {
  id: string;
  name: string;
  description?: string;
  contactCount: number;
  dateCreated: string;
  dateUpdated: string;
}

export default function ContactGroupsPage() {
  const router = useRouter();
  const strings = contactsStrings;
  const { preferences, updateContentExpanded, loading: prefsLoading } = useUIPreferences();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<ContactGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<keyof ContactGroup>('dateCreated');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const rowsPerPage = 25;

  useEffect(() => {
    setMounted(true);
    fetchGroups();
  }, []);

  // Set initial expanded state from preferences
  useEffect(() => {
    if (!prefsLoading) {
      if (preferences.contentExpanded !== undefined) {
        setIsExpanded(preferences.contentExpanded);
      }
    }
  }, [preferences.contentExpanded, prefsLoading]);

  const fetchGroups = async () => {
    try {
      // Simulate API call - replace with actual API
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
        }
      ];
      
      setGroups(mockGroups);
    } catch (error) {
      toast.error('Failed to load contact groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (name: string, description: string) => {
    try {
      // API call to create group
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
      setShowCreateModal(false);
      
      // Navigate to fields screen
      router.push(`/contacts/groups/${newGroup.id}/fields`);
    } catch (error) {
      toast.error('Failed to create group');
      throw error;
    }
  };

  const handleEditGroup = (group: ContactGroup) => {
    // Open edit modal - implement later
    toast.info('Edit functionality coming soon');
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm(strings.groups.grid.actions.confirmDelete)) return;
    
    try {
      // API call to delete
      await new Promise(resolve => setTimeout(resolve, 500));
      setGroups(prev => prev.filter(g => g.id !== groupId));
      toast.success('Group deleted successfully');
    } catch (error) {
      toast.error('Failed to delete group');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedGroups.length === 0) return;
    
    const confirmMessage = strings.groups.grid.actions.confirmBulkDelete.replace(
      '{count}', 
      selectedGroups.length.toString()
    );
    
    if (!confirm(confirmMessage)) return;
    
    try {
      // API call to bulk delete
      await new Promise(resolve => setTimeout(resolve, 500));
      setGroups(prev => prev.filter(g => !selectedGroups.includes(g.id)));
      setSelectedGroups([]);
      toast.success('Groups deleted successfully');
    } catch (error) {
      toast.error('Failed to delete groups');
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
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter and sort logic
  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortedGroups = [...filteredGroups].sort((a, b) => {
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

  // Pagination
  const totalPages = Math.ceil(sortedGroups.length / rowsPerPage);
  const paginatedGroups = sortedGroups.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex justify-center ${isExpanded ? '' : 'max-w-[1600px] mx-auto'} relative`}>
      {/* Expand/Collapse button positioned at top-right of center pane */}
      <div className="absolute top-8 right-8 z-20">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full bg-card shadow-lg border border-border hover:bg-accent"
          onClick={() => {
            const newExpanded = !isExpanded;
            setIsExpanded(newExpanded);
            updateContentExpanded(newExpanded);
          }}
          title={isExpanded ? "Collapse to default width" : "Expand to full width"}
        >
          {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className="flex flex-col gap-6 p-8 w-full">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{strings.breadcrumbs.home}</span>
          <span>/</span>
          <span className="text-foreground">{strings.breadcrumbs.contacts}</span>
        </div>

      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{strings.groups.title}</h1>
          <p className="text-muted-foreground mt-1">{strings.groups.description}</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {strings.groups.createForm.createButton}
        </Button>
      </div>

      {/* Search and Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="pl-10"
            placeholder={strings.groups.search.placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {selectedGroups.length > 0 && (
          <Button
            variant="destructive"
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {strings.groups.grid.actions.bulkDelete} ({selectedGroups.length})
          </Button>
        )}
      </div>

      {/* Groups Grid */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr>
                <th className="p-4 text-left">
                  <Checkbox
                    checked={
                      filteredGroups.length > 0 && 
                      selectedGroups.length === filteredGroups.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </th>
                <th 
                  className="p-4 text-left font-medium cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    {strings.groups.grid.columns.name}
                    {sortBy === 'name' && (
                      sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="p-4 text-left font-medium cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('contactCount')}
                >
                  <div className="flex items-center gap-2">
                    {strings.groups.grid.columns.contactCount}
                    {sortBy === 'contactCount' && (
                      sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="p-4 text-left font-medium cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('dateCreated')}
                >
                  <div className="flex items-center gap-2">
                    {strings.groups.grid.columns.dateCreated}
                    {sortBy === 'dateCreated' && (
                      sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th 
                  className="p-4 text-left font-medium cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('dateUpdated')}
                >
                  <div className="flex items-center gap-2">
                    {strings.groups.grid.columns.dateUpdated}
                    {sortBy === 'dateUpdated' && (
                      sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </th>
                <th className="p-4 text-left font-medium">
                  {strings.groups.grid.columns.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedGroups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8">
                    <EmptyState
                      icon={Users}
                      title={strings.groups.grid.empty}
                      description=""
                    />
                  </td>
                </tr>
              ) : (
                paginatedGroups.map(group => (
                  <tr key={group.id} className="border-b hover:bg-muted/50">
                    <td className="p-4">
                      <Checkbox
                        checked={selectedGroups.includes(group.id)}
                        onCheckedChange={() => toggleSelectGroup(group.id)}
                      />
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => router.push(`/contacts/groups/${group.id}/fields`)}
                        className="text-primary hover:underline font-medium"
                      >
                        {group.name}
                      </button>
                      {group.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {group.description}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">
                        {group.contactCount}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatDate(group.dateCreated)}
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {formatDate(group.dateUpdated)}
                    </td>
                    <td className="p-4">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEditGroup(group)}>
                            <Edit className="h-4 w-4 mr-2" />
                            {strings.groups.grid.actions.edit}
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteGroup(group.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {strings.groups.grid.actions.delete}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t">
            <div className="text-sm text-muted-foreground">
              {strings.groups.grid.pagination.pageOf
                .replace('{current}', currentPage.toString())
                .replace('{total}', totalPages.toString())}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

        {/* Create Group Modal */}
        <CreateGroupModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateGroup={handleCreateGroup}
        />
      </div>
    </div>
  );
}