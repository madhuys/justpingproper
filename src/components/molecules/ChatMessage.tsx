'use client';

import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { Paperclip, Play, Pause, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatMessageProps {
  id: string;
  text?: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  avatar?: string;
  attachments?: Array<{
    type: 'image' | 'file' | 'audio';
    url: string;
    name: string;
  }>;
  audioUrl?: string;
  audioDuration?: number;
  isPlaying?: boolean;
  onPlayAudio?: () => void;
}

export function ChatMessage({ 
  text, 
  sender, 
  timestamp, 
  avatar,
  attachments,
  audioUrl,
  isPlaying,
  onPlayAudio
}: ChatMessageProps) {
  const isUser = sender === 'user';
  const { resolvedTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div
      className={cn(
        "flex gap-3 mb-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 p-0.5">
        <Avatar className={cn(
          "h-7 w-7 ring-1",
          resolvedTheme === 'dark'
            ? "ring-primary/40"
            : "ring-[#1e4394]"
        )}>
          {isUser ? (
            <>
              <AvatarImage src={user?.photoURL || ''} alt={user?.displayName || ''} />
              <AvatarFallback>
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </>
          ) : (
            <AvatarFallback className="bg-muted">
              <Bot className="h-4 w-4 text-muted-foreground" />
            </AvatarFallback>
          )}
        </Avatar>
      </div>

      {/* Message content */}
      <div className={cn(
        "flex flex-col max-w-[70%]",
        isUser ? "items-end" : "items-start"
      )}>
        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 shadow-sm transition-all duration-300 relative overflow-hidden group",
            isUser 
              ? resolvedTheme === 'dark'
                ? "bg-primary/20 text-foreground border border-primary/60 rounded-tr-sm shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]" 
                : "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-card border border-border/50 rounded-tl-sm"
          )}
        >
          {/* Glassmorphic gradient overlays */}
          {isUser ? (
            <>
              {/* User message gradient - primary blue based */}
              <div 
                className={cn(
                  "absolute inset-0",
                  resolvedTheme === 'dark'
                    ? "opacity-20 bg-gradient-to-br from-primary to-blue-600"
                    : "opacity-0"
                )}
                aria-hidden="true"
              />
              
              {/* Hover shimmer effect for user messages */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                style={{ backgroundSize: '200% 100%' }}
                aria-hidden="true"
              />
            </>
          ) : (
            <>
              {/* AI message gradient - blue to purple */}
              <div 
                className="absolute inset-0 opacity-10 bg-gradient-to-br from-blue-500 to-purple-500"
                aria-hidden="true"
              />
              
              {/* Hover shimmer effect for AI messages */}
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                style={{ backgroundSize: '200% 100%' }}
                aria-hidden="true"
              />
            </>
          )}
          {/* Text message */}
          {text && (
            <p className="text-sm whitespace-pre-wrap break-words relative z-10">{text}</p>
          )}

          {/* Audio message */}
          {audioUrl && (
            <div className="flex items-center gap-2 min-w-[200px] relative z-10">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={onPlayAudio}
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
              <div className="flex-1 h-1 bg-background/20 rounded-full">
                <div className="h-full w-1/3 bg-background/50 rounded-full" />
              </div>
              <span className="text-xs">0:30</span>
            </div>
          )}

          {/* Attachments */}
          {attachments && attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {attachments.map((attachment, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Paperclip className="h-3 w-3" />
                  <span className="text-xs underline cursor-pointer hover:no-underline">
                    {attachment.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className={cn(
          "mt-1 text-xs text-muted-foreground",
          isUser ? "mr-1" : "ml-1"
        )}>
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
}