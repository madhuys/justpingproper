'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, UserMinus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import toast from 'react-hot-toast';
import teamsStrings from '@/data/strings/teams.json';
import teamMembersData from '@/data/mocks/teamMembers.json';
import teamsData from '@/data/teams.json';

interface TeamMemberAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: {
    id: string;
    name: string;
  };
}

interface Member {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatar?: string;
  isInTeam?: boolean;
}

export function TeamMemberAssignmentModal({ isOpen, onClose, team }: TeamMemberAssignmentModalProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load team members and mark which ones are already in the team
    const teamData = teamsData.find(t => t.id === team.id);
    const teamMemberIds = teamData?.members?.map(m => m.userId).filter(Boolean) || [];
    
    const allMembers = teamMembersData.members.map(member => ({
      ...member,
      isInTeam: teamMemberIds.includes(member.id)
    }));
    
    setMembers(allMembers);
    setFilteredMembers(allMembers);
  }, [team]);

  useEffect(() => {
    const filtered = members.filter(member =>
      member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMembers(filtered);
  }, [members, searchQuery]);

  const handleToggleMember = (memberId: string) => {
    const newSelected = new Set(selectedMembers);
    if (newSelected.has(memberId)) {
      newSelected.delete(memberId);
    } else {
      newSelected.add(memberId);
    }
    setSelectedMembers(newSelected);
  };

  const handleAddMembers = () => {
    if (selectedMembers.size === 0) return;
    
    // Update member states
    const updatedMembers = members.map(member => ({
      ...member,
      isInTeam: member.isInTeam || selectedMembers.has(member.id)
    }));
    
    setMembers(updatedMembers);
    setSelectedMembers(new Set());
    
    toast.success(teamsStrings.teams.messages.addMembersSuccess);
  };

  const handleRemoveMembers = () => {
    if (selectedMembers.size === 0) return;
    
    // Update member states
    const updatedMembers = members.map(member => ({
      ...member,
      isInTeam: member.isInTeam && !selectedMembers.has(member.id)
    }));
    
    setMembers(updatedMembers);
    setSelectedMembers(new Set());
    
    toast.success(teamsStrings.teams.messages.removeMemberSuccess);
  };

  const teamMembers = filteredMembers.filter(m => m.isInTeam);
  const availableMembers = filteredMembers.filter(m => !m.isInTeam);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>{teamsStrings.teams.memberAssignment.title}</DialogTitle>
          <DialogDescription>
            Managing members for: {team.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={teamsStrings.teams.memberAssignment.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selectedMembers.size > 0 && 
                teamsStrings.teams.memberAssignment.selected.replace('{{count}}', selectedMembers.size.toString())
              }
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRemoveMembers}
                disabled={selectedMembers.size === 0}
              >
                <UserMinus className="mr-2 h-4 w-4" />
                {teamsStrings.teams.memberAssignment.remove}
              </Button>
              <Button
                size="sm"
                onClick={handleAddMembers}
                disabled={selectedMembers.size === 0}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {teamsStrings.teams.memberAssignment.add}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium mb-2">Team Members ({teamMembers.length})</h4>
              <ScrollArea className="h-[300px] border rounded-md p-2">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 hover:bg-accent rounded-md cursor-pointer"
                    onClick={() => handleToggleMember(member.id)}
                  >
                    <Checkbox
                      checked={selectedMembers.has(member.id)}
                      onCheckedChange={() => handleToggleMember(member.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>
                        {member.fullName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{member.fullName}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </ScrollArea>
            </div>

            <div>
              <h4 className="font-medium mb-2">Available Members ({availableMembers.length})</h4>
              <ScrollArea className="h-[300px] border rounded-md p-2">
                {availableMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-2 hover:bg-accent rounded-md cursor-pointer"
                    onClick={() => handleToggleMember(member.id)}
                  >
                    <Checkbox
                      checked={selectedMembers.has(member.id)}
                      onCheckedChange={() => handleToggleMember(member.id)}
                    />
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback>
                        {member.fullName.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{member.fullName}</p>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}