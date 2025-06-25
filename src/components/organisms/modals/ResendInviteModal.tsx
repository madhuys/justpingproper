'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';

interface ResendInviteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    fullName: string;
    email: string;
  } | null;
  onConfirm: () => void;
}

export function ResendInviteModal({ 
  open, 
  onOpenChange, 
  member, 
  onConfirm 
}: ResendInviteModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Resend Invitation</DialogTitle>
          <DialogDescription>
            Resend the invitation email to {member?.fullName} ({member?.email})?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                A new invitation email will be sent with a fresh link that expires in 7 days.
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            Resend Invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}