'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Users, MoreVertical } from 'lucide-react';
import { PageHeader } from '@/components/atoms/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import { CreateTeamModal } from '@/components/organisms/modals/CreateTeamModal';
import { EditTeamModal } from '@/components/organisms/modals/EditTeamModal';
import { DeleteTeamModal } from '@/components/organisms/modals/DeleteTeamModal';
import { TeamMemberAssignmentModal } from '@/components/organisms/modals/TeamMemberAssignmentModal';
import teamsData from '@/data/teams.json';
import teamsStrings from '@/data/strings/teams.json';

interface Team {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive';
  memberCount: number;
  createdAt: string;
  avatar?: string;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredTeams, setFilteredTeams] = useState<Team[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading teams
    setTimeout(() => {
      setTeams(teamsData.map(team => ({
        id: team.id,
        name: team.name,
        description: team.description,
        status: team.status as 'active' | 'inactive',
        memberCount: team.memberCount,
        createdAt: team.createdAt,
        avatar: team.avatar
      })));
      setLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    const filtered = teams.filter(team =>
      team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredTeams(filtered);
  }, [teams, searchQuery]);

  const handleCreateTeam = (teamData: any) => {
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      name: teamData.name,
      description: teamData.description,
      status: 'active',
      memberCount: teamData.members?.length || 0,
      createdAt: new Date().toISOString(),
      avatar: teamData.avatar
    };
    setTeams([...teams, newTeam]);
    toast.success(teamsStrings.teams.messages.createSuccess);
    setIsCreateModalOpen(false);
  };

  const handleEditTeam = (teamData: any) => {
    if (!selectedTeam) return;
    
    const updatedTeams = teams.map(team =>
      team.id === selectedTeam.id
        ? { ...team, ...teamData }
        : team
    );
    setTeams(updatedTeams);
    toast.success(teamsStrings.teams.messages.updateSuccess);
    setIsEditModalOpen(false);
  };

  const handleDeleteTeam = () => {
    if (!selectedTeam) return;
    
    setTeams(teams.filter(team => team.id !== selectedTeam.id));
    toast.success(teamsStrings.teams.messages.deleteSuccess);
    setIsDeleteModalOpen(false);
  };

  const openEditModal = (team: Team) => {
    setSelectedTeam(team);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (team: Team) => {
    setSelectedTeam(team);
    setIsDeleteModalOpen(true);
  };

  const openMemberModal = (team: Team) => {
    setSelectedTeam(team);
    setIsMemberModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <PageHeader 
        title={teamsStrings.teams.title}
        subtitle={teamsStrings.teams.subtitle}
      />

      <div className="mt-6 flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder={teamsStrings.teams.table.name}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {teamsStrings.teams.actions.create}
        </Button>
      </div>

      {filteredTeams.length === 0 ? (
        <Card className="mt-6 p-12 text-center">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {teamsStrings.teams.empty.title}
          </h3>
          <p className="text-muted-foreground mb-4">
            {teamsStrings.teams.empty.description}
          </p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {teamsStrings.teams.empty.action}
          </Button>
        </Card>
      ) : (
        <Card className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{teamsStrings.teams.table.name}</TableHead>
                <TableHead>{teamsStrings.teams.table.description}</TableHead>
                <TableHead>{teamsStrings.teams.table.members}</TableHead>
                <TableHead>{teamsStrings.teams.table.status}</TableHead>
                <TableHead>{teamsStrings.teams.table.createdAt}</TableHead>
                <TableHead className="text-right">{teamsStrings.teams.table.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      {team.avatar ? (
                        <img
                          src={team.avatar}
                          alt={team.name}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      {team.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {team.description}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openMemberModal(team)}
                    >
                      {team.memberCount} members
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Badge variant={team.status === 'active' ? 'default' : 'secondary'}>
                      {teamsStrings.teams.status[team.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(team.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditModal(team)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {teamsStrings.teams.actions.edit}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openMemberModal(team)}>
                          <Users className="mr-2 h-4 w-4" />
                          {teamsStrings.teams.actions.viewMembers}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteModal(team)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {teamsStrings.teams.actions.delete}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {isCreateModalOpen && (
        <CreateTeamModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateTeam}
        />
      )}

      {isEditModalOpen && selectedTeam && (
        <EditTeamModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleEditTeam}
          team={selectedTeam}
        />
      )}

      {isDeleteModalOpen && selectedTeam && (
        <DeleteTeamModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteTeam}
          team={selectedTeam}
        />
      )}

      {isMemberModalOpen && selectedTeam && (
        <TeamMemberAssignmentModal
          isOpen={isMemberModalOpen}
          onClose={() => setIsMemberModalOpen(false)}
          team={selectedTeam}
        />
      )}
    </div>
  );
}