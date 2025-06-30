'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/atoms/Loader';
import { PageHeader } from '@/components/atoms/PageHeader';
import { GroupsActionBar } from '@/components/molecules/GroupsActionBar';
import { GroupsTable } from '@/components/organisms/GroupsTable';
import { CreateGroupModal } from '@/components/organisms/modals/CreateGroupModal';
import { Plus, Maximize2, Minimize2 } from 'lucide-react';
import contactsStrings from '@/data/strings/contacts.json';
import { useUIPreferences } from '@/hooks/useUIPreferences';
import { useContactGroups } from '@/hooks/useContactGroups';
import toast from 'react-hot-toast';

export default function ContactGroupsPage() {
  const router = useRouter();
  const strings = contactsStrings;
  const { preferences, updateContentExpanded, loading: prefsLoading } = useUIPreferences();
  const {
    loading,
    groups,
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
    bulkDeleteGroups
  } = useContactGroups();
  
  const [mounted, setMounted] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!prefsLoading && preferences.contentExpanded !== undefined) {
      setIsExpanded(preferences.contentExpanded);
    }
  }, [preferences.contentExpanded, prefsLoading]);

  const handleCreateGroup = async (name: string, description: string) => {
    try {
      const newGroup = await createGroup(name, description);
      setShowCreateModal(false);
      router.push(`/contacts/groups/${newGroup.id}/fields`);
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  const handleEditGroup = (group: any) => {
    toast('Edit functionality coming soon');
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm(strings.groups.grid.actions.confirmDelete)) return;
    await deleteGroup(groupId);
  };

  const handleBulkDelete = async () => {
    if (selectedGroups.length === 0) return;
    
    const confirmMessage = strings.groups.grid.actions.confirmBulkDelete.replace(
      '{count}', 
      selectedGroups.length.toString()
    );
    
    if (!confirm(confirmMessage)) return;
    await bulkDeleteGroups();
  };

  const handleGroupClick = (groupId: string) => {
    router.push(`/contacts/groups/${groupId}/fields`);
  };

  if (!mounted || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className={`w-full h-full flex justify-center ${isExpanded ? '' : 'max-w-[1600px] mx-auto'} relative`}>
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
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{strings.breadcrumbs.home}</span>
          <span>/</span>
          <span className="text-foreground">{strings.breadcrumbs.contacts}</span>
        </div>

        <div className="flex justify-between items-start">
          <PageHeader
            title={strings.groups.title}
            description={strings.groups.description}
          />
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            {strings.groups.createForm.createButton}
          </Button>
        </div>

        <GroupsActionBar
          searchQuery={searchQuery}
          selectedCount={selectedGroups.length}
          onSearchChange={setSearchQuery}
          onBulkDelete={handleBulkDelete}
        />

        <GroupsTable
          groups={groups}
          selectedGroups={selectedGroups}
          sortBy={sortBy}
          sortOrder={sortOrder}
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          onSelectGroup={toggleSelectGroup}
          onSelectAll={toggleSelectAll}
          onSort={handleSort}
          onPageChange={setCurrentPage}
          onGroupClick={handleGroupClick}
          onEditGroup={handleEditGroup}
          onDeleteGroup={handleDeleteGroup}
        />

        <CreateGroupModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreateGroup={handleCreateGroup}
        />
      </div>
    </div>
  );
}