'use client';

import React, { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MultiSelectCombobox } from '@/components/ui/multi-select-combobox';
import teamsStrings from '@/data/strings/teams.json';
import teamMembersData from '@/data/mocks/teamMembers.json';
import teamsData from '@/data/teams.json';

interface EditTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TeamFormData) => void;
  team: {
    id: string;
    name: string;
    description: string;
    avatar?: string;
  };
}

interface TeamFormData {
  name: string;
  description: string;
  avatar?: string;
  members: string[];
}

export function EditTeamModal({ isOpen, onClose, onSubmit, team }: EditTeamModalProps) {
  const [formData, setFormData] = useState<TeamFormData>({
    name: '',
    description: '',
    members: []
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (team) {
      // Find team data to get member list
      const teamData = teamsData.find(t => t.id === team.id);
      const memberIds = teamData?.members?.map(m => m.userId).filter(Boolean) || [];
      
      setFormData({
        name: team.name,
        description: team.description,
        avatar: team.avatar,
        members: memberIds as string[]
      });
    }
  }, [team]);

  const memberOptions = teamMembersData.members.map(member => ({
    value: member.id,
    label: member.fullName
  }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) {
      newErrors.name = teamsStrings.teams.form.name.error;
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSubmit(formData);
    setErrors({});
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{teamsStrings.teams.editModal.title}</DialogTitle>
          <DialogDescription>
            {teamsStrings.teams.editModal.description}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={formData.avatar} />
              <AvatarFallback>{formData.name.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <Label htmlFor="avatar-edit" className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="mr-2 h-4 w-4" />
                    {teamsStrings.teams.form.avatar.upload}
                  </span>
                </Button>
              </Label>
              <Input
                id="avatar-edit"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarUpload}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="name">{teamsStrings.teams.form.name.label}</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                setErrors({ ...errors, name: '' });
              }}
              placeholder={teamsStrings.teams.form.name.placeholder}
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description">{teamsStrings.teams.form.description.label}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={teamsStrings.teams.form.description.placeholder}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="members">{teamsStrings.teams.form.members.label}</Label>
            <MultiSelectCombobox
              options={memberOptions}
              selected={formData.members}
              onSelect={(value) => setFormData({ ...formData, members: value })}
              placeholder={teamsStrings.teams.form.members.placeholder}
              searchPlaceholder={teamsStrings.teams.form.members.search}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {teamsStrings.teams.editModal.cancel}
            </Button>
            <Button type="submit">
              {teamsStrings.teams.editModal.submit}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}