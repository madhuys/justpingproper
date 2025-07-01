'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Clock, MoreVertical, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChatMessage } from '@/components/molecules/ChatMessage';
import { ChatInput } from '@/components/molecules/ChatInput';
import toast from 'react-hot-toast';
import teamInboxStrings from '@/data/strings/teamInbox.json';
import teamMembersData from '@/data/mocks/teamMembers.json';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

interface ChatViewProps {
  conversation: any;
  onAssignmentChange: (assigneeId: string | null) => void;
  onStatusChange: (status: string) => void;
}

export function ChatView({ conversation, onAssignmentChange, onStatusChange }: ChatViewProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Scroll to bottom when conversation changes or new messages
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [conversation]);

  // Update timer every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSendMessage = (text: string, attachments?: File[]) => {
    if (!text.trim() && !attachments?.length) return;

    // In a real app, this would send the message
    toast.success(teamInboxStrings.teamInbox.messages.sendSuccess);
  };

  const handleSendAudio = (audioBlob: Blob) => {
    // Handle audio message
    toast.success(teamInboxStrings.teamInbox.messages.sendSuccess);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getWhatsAppSessionTimer = () => {
    if (conversation.channel !== 'whatsapp' || !conversation.whatsappSessionExpiry) {
      return null;
    }

    const expiry = new Date(conversation.whatsappSessionExpiry);
    const diffMs = expiry.getTime() - currentTime.getTime();

    if (diffMs <= 0) {
      return { 
        expired: true, 
        hours: 0,
        minutes: 0,
        seconds: 0,
        time: 'Expired',
        percentage: 0
      };
    }

    const totalHours = 24; // WhatsApp 24-hour session
    const elapsedMs = (totalHours * 3600000) - diffMs;
    const percentage = Math.max(0, Math.min(100, (elapsedMs / (totalHours * 3600000)) * 100));

    const hours = Math.floor(diffMs / 3600000);
    const minutes = Math.floor((diffMs % 3600000) / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    
    return { 
      expired: false, 
      hours,
      minutes,
      seconds,
      time: `${hours}h ${minutes}m ${seconds}s`,
      isExpiring: hours < 2,
      percentage
    };
  };

  const sessionTimer = getWhatsAppSessionTimer();
  const teamMembers = teamMembersData.members;

  return (
    <Card className="h-full rounded-none border-0 border-r flex flex-col py-0">
      {/* Header */}
      <div className="border-b px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={conversation.customerAvatar} />
              <AvatarFallback>
                {conversation.customerName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{conversation.customerName}</h3>
              <p className="text-sm text-muted-foreground">
                {conversation.customerEmail || conversation.customerPhone || conversation.customerHandle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {sessionTimer && (
              <div className="flex items-center gap-3">
                {/* Clock-style countdown */}
                <div className="relative">
                  <div className="w-16 h-16 relative">
                    {/* Background circle */}
                    <svg className="w-16 h-16 transform -rotate-90">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={`${2 * Math.PI * 28}`}
                        strokeDashoffset={`${2 * Math.PI * 28 * (1 - sessionTimer.percentage / 100)}`}
                        className={cn(
                          "transition-all duration-1000",
                          sessionTimer.expired 
                            ? 'text-destructive'
                            : sessionTimer.isExpiring
                            ? 'text-yellow-500'
                            : 'text-green-500'
                        )}
                      />
                    </svg>
                    {/* Clock icon in center */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Clock className={cn(
                        "h-6 w-6",
                        sessionTimer.expired 
                          ? 'text-destructive'
                          : sessionTimer.isExpiring
                          ? 'text-yellow-500'
                          : 'text-green-500'
                      )} />
                    </div>
                  </div>
                </div>
                
                {/* Digital countdown */}
                <div className="flex flex-col">
                  <div className={cn(
                    "font-mono text-lg font-semibold tabular-nums",
                    sessionTimer.expired 
                      ? 'text-destructive'
                      : sessionTimer.isExpiring
                      ? 'text-yellow-600 dark:text-yellow-400'
                      : 'text-green-600 dark:text-green-400'
                  )}>
                    {sessionTimer.expired ? (
                      'EXPIRED'
                    ) : (
                      <>
                        {String(sessionTimer.hours).padStart(2, '0')}:
                        {String(sessionTimer.minutes).padStart(2, '0')}:
                        {String(sessionTimer.seconds).padStart(2, '0')}
                      </>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {sessionTimer.expired 
                      ? 'Session expired'
                      : sessionTimer.isExpiring
                      ? 'Session expiring soon'
                      : 'WhatsApp session'
                    }
                  </span>
                </div>
              </div>
            )}

            <Select 
              value={conversation.assignedTo || 'unassigned'} 
              onValueChange={(value) => onAssignmentChange(value === 'unassigned' ? null : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">
                  {teamInboxStrings.teamInbox.chat.header.unassigned}
                </SelectItem>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {conversation.status !== 'closed' ? (
                  <DropdownMenuItem onClick={() => onStatusChange('closed')}>
                    {teamInboxStrings.teamInbox.chat.actions.resolve}
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenuItem onClick={() => onStatusChange('open')}>
                    {teamInboxStrings.teamInbox.chat.actions.reopen}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem>{teamInboxStrings.teamInbox.chat.actions.export}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Messages Area - Matching freeflow layout */}
      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-2">
            {conversation.messages.map((msg: any) => (
              <ChatMessage
                key={msg.id}
                id={msg.id}
                text={msg.text}
                sender={msg.sender}
                timestamp={new Date(msg.timestamp)}
                status={msg.status}
                attachments={msg.attachments}
                audioUrl={msg.audioUrl}
                audioDuration={msg.audioDuration}
              />
            ))}
          </div>
        </ScrollArea>
        
        {/* Input Area - Direct ChatInput without wrapper */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onSendAudio={handleSendAudio}
          placeholder={
            sessionTimer?.expired 
              ? teamInboxStrings.teamInbox.chat.input.placeholderExpired
              : teamInboxStrings.teamInbox.chat.input.placeholder
          }
          disabled={sessionTimer?.expired}
        />
      </div>
    </Card>
  );
}