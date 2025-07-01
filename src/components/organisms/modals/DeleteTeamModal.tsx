'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import teamsStrings from '@/data/strings/teams.json';

interface DeleteTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  team: {
    id: string;
    name: string;
  };
}

export function DeleteTeamModal({ isOpen, onClose, onConfirm, team }: DeleteTeamModalProps) {
  // Check if team has active inboxes or assignments
  const hasActiveResources = true; // This would come from actual data

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {teamsStrings.teams.deleteModal.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              {teamsStrings.teams.deleteModal.description}
            </p>
            {hasActiveResources && (
              <p className="text-destructive font-medium">
                {teamsStrings.teams.deleteModal.warning}
              </p>
            )}
            <p className="font-medium">Team: {team.name}</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            {teamsStrings.teams.deleteModal.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {teamsStrings.teams.deleteModal.submit}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}