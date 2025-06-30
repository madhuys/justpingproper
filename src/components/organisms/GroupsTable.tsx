import React from 'react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { EmptyState } from '@/components/atoms/EmptyState';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  Users
} from 'lucide-react';
import contactsStrings from '@/data/strings/contacts.json';

export interface ContactGroup {
  id: string;
  name: string;
  description?: string;
  contactCount: number;
  dateCreated: string;
  dateUpdated: string;
}

interface GroupsTableProps {
  groups: ContactGroup[];
  selectedGroups: string[];
  sortBy: keyof ContactGroup;
  sortOrder: 'asc' | 'desc';
  currentPage: number;
  rowsPerPage: number;
  onSelectGroup: (groupId: string) => void;
  onSelectAll: () => void;
  onSort: (column: keyof ContactGroup) => void;
  onPageChange: (page: number) => void;
  onGroupClick: (groupId: string) => void;
  onEditGroup: (group: ContactGroup) => void;
  onDeleteGroup: (groupId: string) => void;
}

export function GroupsTable({
  groups,
  selectedGroups,
  sortBy,
  sortOrder,
  currentPage,
  rowsPerPage,
  onSelectGroup,
  onSelectAll,
  onSort,
  onPageChange,
  onGroupClick,
  onEditGroup,
  onDeleteGroup
}: GroupsTableProps) {
  const strings = contactsStrings;

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

  const totalPages = Math.ceil(groups.length / rowsPerPage);
  const paginatedGroups = groups.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b">
            <tr>
              <th className="p-4 text-left">
                <Checkbox
                  checked={
                    groups.length > 0 &&
                    selectedGroups.length === groups.length
                  }
                  onCheckedChange={onSelectAll}
                />
              </th>
              <th
                className="p-4 text-left font-medium cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('name')}
              >
                <div className="flex items-center gap-2">
                  {strings.groups.grid.columns.name}
                  {sortBy === 'name' && (
                    sortOrder === 'asc' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )
                  )}
                </div>
              </th>
              <th
                className="p-4 text-left font-medium cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('contactCount')}
              >
                <div className="flex items-center gap-2">
                  {strings.groups.grid.columns.contactCount}
                  {sortBy === 'contactCount' && (
                    sortOrder === 'asc' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )
                  )}
                </div>
              </th>
              <th
                className="p-4 text-left font-medium cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('dateCreated')}
              >
                <div className="flex items-center gap-2">
                  {strings.groups.grid.columns.dateCreated}
                  {sortBy === 'dateCreated' && (
                    sortOrder === 'asc' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )
                  )}
                </div>
              </th>
              <th
                className="p-4 text-left font-medium cursor-pointer hover:bg-muted/50"
                onClick={() => onSort('dateUpdated')}
              >
                <div className="flex items-center gap-2">
                  {strings.groups.grid.columns.dateUpdated}
                  {sortBy === 'dateUpdated' && (
                    sortOrder === 'asc' ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )
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
                      onCheckedChange={() => onSelectGroup(group.id)}
                    />
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => onGroupClick(group.id)}
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
                    <Badge variant="secondary">{group.contactCount}</Badge>
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
                        <DropdownMenuItem onClick={() => onEditGroup(group)}>
                          <Edit className="h-4 w-4 mr-2" />
                          {strings.groups.grid.actions.edit}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteGroup(group.id)}
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
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() =>
                onPageChange(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}