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
import { Badge } from '@/components/ui/badge';
import publishStrings from '@/data/strings/publish.json';

interface UnpublishAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  agent: {
    id: string;
    agentName: string;
    channels?: Array<{ type: string }>;
    statistics?: {
      activeConversations: number;
    };
  };
}

export function UnpublishAgentModal({ isOpen, onClose, onConfirm, agent }: UnpublishAgentModalProps) {
  const hasActiveConversations = agent.statistics && agent.statistics.activeConversations > 0;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {publishStrings.publish.unpublishModal.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              {publishStrings.publish.unpublishModal.description}
            </p>
            <div className="bg-muted p-3 rounded-md">
              <p className="font-medium mb-2">Agent: {agent.agentName}</p>
              {agent.channels && agent.channels.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Published on: {agent.channels.map(c => c.type).join(', ')}
                </p>
              )}
              {hasActiveConversations && (
                <Badge variant="destructive" className="mt-2">
                  {agent.statistics?.activeConversations} active conversations
                </Badge>
              )}
            </div>
            <p className="text-sm text-destructive font-medium">
              {publishStrings.publish.unpublishModal.warning}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            {publishStrings.publish.unpublishModal.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {publishStrings.publish.unpublishModal.submit}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}