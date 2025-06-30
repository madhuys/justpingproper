import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Trash2 } from 'lucide-react';
import contactsStrings from '@/data/strings/contacts.json';

interface GroupsActionBarProps {
  searchQuery: string;
  selectedCount: number;
  onSearchChange: (query: string) => void;
  onBulkDelete: () => void;
}

export function GroupsActionBar({
  searchQuery,
  selectedCount,
  onSearchChange,
  onBulkDelete
}: GroupsActionBarProps) {
  const strings = contactsStrings;

  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          className="pl-10"
          placeholder={strings.groups.search.placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {selectedCount > 0 && (
        <Button variant="destructive" onClick={onBulkDelete}>
          <Trash2 className="h-4 w-4 mr-2" />
          {strings.groups.grid.actions.bulkDelete} ({selectedCount})
        </Button>
      )}
    </div>
  );
}