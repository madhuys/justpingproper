'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/molecules/FormField';
import { Loader } from '@/components/atoms/Loader';
import contactsStrings from '@/data/strings/contacts.json';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (name: string, description: string) => Promise<void>;
}

export function CreateGroupModal({ isOpen, onClose, onCreateGroup }: CreateGroupModalProps) {
  const strings = contactsStrings.groups.createForm;
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [nameError, setNameError] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const validateGroupName = (name: string) => {
    const regex = /^[A-Za-z0-9_-]+$/;
    if (!regex.test(name)) {
      setNameError(strings.nameError);
      return false;
    }
    setNameError('');
    return true;
  };

  const handleCreate = async () => {
    if (!groupName.trim() || !validateGroupName(groupName)) return;
    
    setIsCreating(true);
    try {
      await onCreateGroup(groupName, groupDescription);
      handleClose();
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setGroupName('');
    setGroupDescription('');
    setNameError('');
    onClose();
  };

  const handleClear = () => {
    setGroupName('');
    setGroupDescription('');
    setNameError('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{strings.title}</DialogTitle>
          <DialogDescription>
            Create a new contact group to organize your contacts
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <FormField 
            label={strings.nameLabel}
            error={nameError}
            required
          >
            <Input
              value={groupName}
              onChange={(e) => {
                setGroupName(e.target.value);
                if (e.target.value) validateGroupName(e.target.value);
              }}
              placeholder={strings.namePlaceholder}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleCreate();
                }
              }}
            />
          </FormField>
          
          <FormField label={strings.descriptionLabel}>
            <Textarea
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder={strings.descriptionPlaceholder}
              rows={3}
            />
          </FormField>
        </div>
        
        <DialogFooter className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={isCreating}
          >
            {strings.clearButton}
          </Button>
          <div className="flex-1" />
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleCreate}
            disabled={!groupName.trim() || !!nameError || isCreating}
          >
            {isCreating ? <Loader /> : strings.createButton}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}