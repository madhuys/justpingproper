'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/molecules/FormField';
import { Input } from '@/components/ui/input';
import { Combobox } from '@/components/ui/combobox';

interface EditTeamMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    id: string;
    fullName: string;
    email: string;
    role: string;
  } | null;
  roleOptions: Array<{ value: string; label: string }>;
  onSave: (member: { id: string; fullName: string; email: string; role: string }) => void;
}

export function EditTeamMemberModal({ 
  open, 
  onOpenChange, 
  member, 
  roleOptions, 
  onSave 
}: EditTeamMemberModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: ''
  });

  useEffect(() => {
    if (member) {
      setFormData({
        fullName: member.fullName,
        email: member.email,
        role: member.role
      });
    }
  }, [member]);

  const handleSave = () => {
    if (member) {
      onSave({
        id: member.id,
        ...formData
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Team Member</DialogTitle>
          <DialogDescription>
            Update team member information
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <FormField label="Full Name" required>
            <Input
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Enter full name"
            />
          </FormField>
          
          <FormField label="Email Address" required>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter email address"
            />
          </FormField>
          
          <FormField label="System Role" required>
            <Combobox
              options={roleOptions}
              value={formData.role}
              onChange={(value) => setFormData({ ...formData, role: value })}
              placeholder="Select role"
              searchPlaceholder="Search roles..."
              emptyText="No role found."
              className="w-full"
            />
          </FormField>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}