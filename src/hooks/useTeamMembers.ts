import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import toast from 'react-hot-toast';

export interface TeamMember {
  id: string;
  fullName: string;
  email: string;
  role: string;
  status: 'active' | 'invited';
  avatar?: string;
  invitedAt?: string;
  joinedAt?: string;
  onboardingComplete?: boolean;
}

export function useTeamMembers() {
  const { user: authUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch('/api/team');
      if (response.ok) {
        const data = await response.json();
        const members = data.members || [];
        
        if (authUser) {
          const existingUserIndex = members.findIndex((m: TeamMember) => m.email === authUser.email);
          
          if (existingUserIndex === -1) {
            const currentUser: TeamMember = {
              id: 'current-user',
              fullName: authUser.displayName || 'Admin User',
              email: authUser.email || '',
              role: 'superadmin',
              status: 'active',
              avatar: authUser.photoURL || undefined,
              joinedAt: new Date().toISOString(),
              onboardingComplete: true
            };
            setTeamMembers([currentUser, ...members]);
          } else {
            const existingUser = members[existingUserIndex];
            const updatedUser = {
              ...existingUser,
              id: 'current-user',
              fullName: authUser.displayName || existingUser.fullName,
              avatar: authUser.photoURL || existingUser.avatar,
              status: 'active' as const
            };
            const otherMembers = members.filter((m: TeamMember) => m.email !== authUser.email);
            setTeamMembers([updatedUser, ...otherMembers]);
          }
        } else {
          setTeamMembers(members);
        }
      }
    } catch (error) {
      console.error('Failed to fetch team members:', error);
      if (authUser) {
        const currentUser: TeamMember = {
          id: 'current-user',
          fullName: authUser.displayName || 'Admin User',
          email: authUser.email || '',
          role: 'superadmin',
          status: 'active',
          avatar: authUser.photoURL || undefined,
          joinedAt: new Date().toISOString(),
          onboardingComplete: true
        };
        setTeamMembers([currentUser]);
      }
    } finally {
      setLoading(false);
    }
  };

  const addMember = async (member: { fullName: string; email: string; role: string }) => {
    try {
      const response = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(member)
      });

      if (response.ok) {
        await fetchTeamMembers();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to add member:', error);
      return false;
    }
  };

  const updateMember = async (updatedMember: { id: string; fullName: string; email: string; role: string }) => {
    try {
      const response = await fetch(`/api/team/${updatedMember.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedMember)
      });

      if (response.ok) {
        await fetchTeamMembers();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update member:', error);
      return false;
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const response = await fetch(`/api/team/${memberId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchTeamMembers();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to remove member:', error);
      return false;
    }
  };

  const resendInvite = async (memberId: string) => {
    // Simulate resend invite - in real app, this would call the API
    try {
      // await fetch(`/api/team/${memberId}/resend-invite`, { method: 'POST' });
      return true;
    } catch (error) {
      console.error('Failed to resend invite:', error);
      return false;
    }
  };

  useEffect(() => {
    if (authUser) {
      fetchTeamMembers();
    }
  }, [authUser]);

  useEffect(() => {
    const handleFocus = () => {
      if (authUser) {
        fetchTeamMembers();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && authUser) {
        fetchTeamMembers();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('popstate', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handleFocus);
    };
  }, [authUser]);

  return {
    loading,
    teamMembers,
    addMember,
    updateMember,
    removeMember,
    resendInvite,
    refreshMembers: fetchTeamMembers
  };
}