'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, MoreVertical, Edit, Mail, Trash2, Clock, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TeamMemberListCardProps {
  member: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    status: 'active' | 'invited';
    avatar?: string;
    onboardingComplete?: boolean;
  };
  roleLabel?: string;
  showActions?: boolean;
  onViewProfile?: () => void;
  onEdit?: () => void;
  onResendInvite?: () => void;
  onRemove?: () => void;
  color?: string;
}

export function TeamMemberListCard({ 
  member, 
  roleLabel,
  showActions = true,
  onViewProfile,
  onEdit,
  onResendInvite,
  onRemove,
  color = "from-blue-500 to-purple-500"
}: TeamMemberListCardProps) {
  // Role-based colors (avoiding red, orange, yellow, pink)
  const roleColors: Record<string, string> = {
    'superadmin': 'from-red-500 to-red-600',        // Red for current user
    'admin': 'from-blue-600 to-blue-800',           // Dark blue
    'limited-admin': 'from-purple-500 to-purple-700', // Purple
    'billing-admin': 'from-green-500 to-green-700',  // Green
    'default': 'from-gray-500 to-gray-700'          // Default gray
  };
  
  // Check if this is the current user (they get red)
  const isCurrentUser = member.id === 'current-user';
  const memberColor = isCurrentUser 
    ? roleColors['superadmin'] 
    : roleColors[member.role] || roleColors['default'];

  return (
    <Card className="relative p-4 hover:bg-muted/50 transition-colors border-border/50 backdrop-blur-sm overflow-hidden group">
      {/* Gradient accent overlay */}
      <div 
        className={cn(
          "absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-300",
          "bg-gradient-to-br",
          memberColor
        )}
        aria-hidden="true"
      />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <Avatar className="h-12 w-12">
            <AvatarImage src={member.avatar} alt={member.fullName} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {member.fullName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {/* Member Info */}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">{member.fullName}</h3>
              <Badge 
                className={cn(
                  "backdrop-blur-sm border-0 transition-all",
                  "bg-blue-500/10 hover:bg-blue-500/20 text-blue-700",
                  "dark:bg-blue-500/20 dark:hover:bg-blue-500/30 dark:text-white"
                )}
              >
                {roleLabel || member.role}
              </Badge>
              {member.status === 'invited' ? (
                <Badge 
                  className={cn(
                    "gap-1 backdrop-blur-sm border-0 transition-all",
                    "bg-amber-500/10 text-amber-700 hover:bg-amber-500/20",
                    "dark:bg-amber-500/20 dark:hover:bg-amber-500/30 dark:text-white"
                  )}
                >
                  <Clock className="h-3 w-3" />
                  Invited
                </Badge>
              ) : (
                <Badge 
                  className={cn(
                    "gap-1 backdrop-blur-sm border-0 transition-all",
                    "bg-green-500/10 text-green-700 hover:bg-green-500/20",
                    "dark:bg-green-500/20 dark:hover:bg-green-500/30 dark:text-white"
                  )}
                >
                  <CheckCircle className="h-3 w-3" />
                  Active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <Mail className="h-3 w-3" />
              {member.email}
            </div>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2">
            {member.status === 'active' && onViewProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewProfile}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                View Profile
              </Button>
            )}
            
            {(onEdit || onResendInvite || onRemove) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {onEdit && (
                    <DropdownMenuItem onClick={onEdit}>
                      <Edit className="h-4 w-4 mr-2" />
                      Change Role
                    </DropdownMenuItem>
                  )}
                  
                  {member.status === 'invited' && onResendInvite && (
                    <DropdownMenuItem onClick={onResendInvite}>
                      <Mail className="h-4 w-4 mr-2" />
                      Resend Invite
                    </DropdownMenuItem>
                  )}
                  
                  {onRemove && (
                    <>
                      {(onEdit || (member.status === 'invited' && onResendInvite)) && <DropdownMenuSeparator />}
                      <DropdownMenuItem 
                        onClick={onRemove}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove Member
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}