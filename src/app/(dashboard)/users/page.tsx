'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from '@/components/atoms/Loader';
import { EmptyState } from '@/components/atoms/EmptyState';
import { TeamMemberListCard } from '@/components/molecules/TeamMemberListCard';
import { AddTeamMemberModal } from '@/components/organisms/modals/AddTeamMemberModal';
import { EditTeamMemberModal } from '@/components/organisms/modals/EditTeamMemberModal';
import { RemoveTeamMemberModal } from '@/components/organisms/modals/RemoveTeamMemberModal';
import { ResendInviteModal } from '@/components/organisms/modals/ResendInviteModal';
import { Card, CardContent } from '@/components/ui/card';
import { UserPlus, User, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamMembers, TeamMember } from '@/hooks/useTeamMembers';
import systemRoles from '@/data/systemRoles.json';
import usersStrings from '@/data/strings/users.json';
import toast from 'react-hot-toast';

export default function UsersPage() {
  const strings = usersStrings;
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null);
  const [memberToResend, setMemberToResend] = useState<TeamMember | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const {
    loading,
    teamMembers,
    addMember,
    updateMember,
    removeMember,
    resendInvite
  } = useTeamMembers();

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddMember = async (member: { fullName: string; email: string; role: string }) => {
    const success = await addMember(member);
    if (success) {
      toast.success(strings.messages.inviteSuccess);
    } else {
      toast.error(strings.messages.inviteError);
    }
  };

  const handleUpdateMember = async (updatedMember: { id: string; fullName: string; email: string; role: string }) => {
    const success = await updateMember(updatedMember);
    if (success) {
      toast.success(strings.messages.updateSuccess);
      setEditingMember(null);
    } else {
      toast.error(strings.messages.updateError);
    }
  };

  const handleRemoveMember = async () => {
    if (!memberToRemove) return;

    const success = await removeMember(memberToRemove.id);
    if (success) {
      toast.success(strings.messages.removeSuccess);
      setShowRemoveModal(false);
      setMemberToRemove(null);
    } else {
      toast.error(strings.messages.removeError);
    }
  };

  const handleResendInvite = async () => {
    if (!memberToResend) return;

    const success = await resendInvite(memberToResend.id);
    if (success) {
      toast.success(strings.messages.resendSuccess.replace('{email}', memberToResend.email));
      setShowResendModal(false);
      setMemberToResend(null);
    } else {
      toast.error(strings.messages.resendError);
    }
  };

  const viewProfile = (memberId: string) => {
    router.push(`/team/${memberId}/profile`);
  };

  if (loading || !mounted) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const roleOptions = systemRoles.map(role => ({
    value: role.value,
    label: role.name,
    description: role.description
  }));

  return (
    <>
      <div className="w-full max-w-4xl mx-auto p-8">
        <Card>
          <CardContent className="p-8">
            {/* Header Section */}
            <div className="text-center space-y-6 mb-8">
              <div>
                <h1 className="text-2xl font-bold">{strings.header.title}</h1>
                <p className="text-muted-foreground mt-1">{strings.header.description}</p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-center gap-3">
                <AddTeamMemberModal 
                  onAddAction={handleAddMember}
                  roleOptions={roleOptions}
                >
                  <Button className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    {strings.actions.addMember}
                  </Button>
                </AddTeamMemberModal>
                
                <Button 
                  variant="outline"
                  onClick={() => router.push('/users/teams')}
                  className="flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Manage Teams
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => router.push('/settings/rbac')}
                  className="flex items-center gap-2"
                >
                  {strings.actions.viewMatrix}
                </Button>
              </div>
            </div>
            
            {/* Team Members List */}
            <div className="space-y-4">
              {teamMembers.length === 0 ? (
                <EmptyState
                  icon={User}
                  title={strings.emptyState.title}
                  description={strings.emptyState.description}
                  className="py-12"
                />
              ) : (
                teamMembers.map((member) => {
                  const isCurrentUser = member.id === 'current-user' || 
                    (authUser && member.email === authUser.email);
                  
                  return (
                    <TeamMemberListCard
                      key={member.id}
                      member={member}
                      roleLabel={systemRoles.find(r => r.value === member.role)?.name}
                      showActions={true}
                      onViewProfile={() => viewProfile(member.id)}
                      onEdit={() => setEditingMember(member)}
                      onResendInvite={!isCurrentUser && member.status === 'invited' ? () => {
                        setMemberToResend(member);
                        setShowResendModal(true);
                      } : undefined}
                      onRemove={!isCurrentUser ? () => {
                        setMemberToRemove(member);
                        setShowRemoveModal(true);
                      } : undefined}
                    />
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Member Modal */}
      <EditTeamMemberModal
        open={!!editingMember}
        onOpenChange={(open) => !open && setEditingMember(null)}
        member={editingMember}
        roleOptions={roleOptions}
        onSave={handleUpdateMember}
      />

      {/* Remove Member Modal */}
      <RemoveTeamMemberModal
        open={showRemoveModal}
        onOpenChange={(open) => {
          setShowRemoveModal(open);
          if (!open) setMemberToRemove(null);
        }}
        memberName={memberToRemove?.fullName || ''}
        onConfirm={handleRemoveMember}
      />

      {/* Resend Invite Modal */}
      <ResendInviteModal
        open={showResendModal}
        onOpenChange={(open) => {
          setShowResendModal(open);
          if (!open) setMemberToResend(null);
        }}
        member={memberToResend}
        onConfirm={handleResendInvite}
      />
    </>
  );
}