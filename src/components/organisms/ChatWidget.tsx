'use client';

import React, { useState, useRef } from 'react';
import { X, Minimize2, Maximize2, MessageSquare, Clock, GripVertical, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatMessage, ChatMessageProps } from '@/components/molecules/ChatMessage';
import { ChatInput } from '@/components/molecules/ChatInput';
import { useContent } from '@/hooks/useContent';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
}

interface ChatWidgetProps {
  isExpanded: boolean;
  onToggleExpandAction: () => void;
  onCloseAction: () => void;
}

export function ChatWidget({ isExpanded, onToggleExpandAction, onCloseAction }: ChatWidgetProps) {
  const { content } = useContent('home');
  const { resolvedTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('current');
  const [width, setWidth] = useState(480);
  const containerRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const [messages, setMessages] = useState<ChatMessageProps[]>([
    {
      id: '1',
      text: 'Hello! How can I help you today?',
      sender: 'agent',
      timestamp: new Date()
    }
  ]);

  const [sessions] = useState<ChatSession[]>([
    {
      id: '1',
      title: 'Product inquiry',
      lastMessage: 'Thank you for your help!',
      timestamp: new Date(Date.now() - 86400000),
      unread: 0
    },
    {
      id: '2',
      title: 'Technical support',
      lastMessage: 'Issue resolved, thanks!',
      timestamp: new Date(Date.now() - 172800000),
      unread: 0
    }
  ]);

  const handleSendMessage = (text: string, attachments?: File[]) => {
    const newMessage: ChatMessageProps = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
      attachments: attachments?.map(file => ({
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        url: URL.createObjectURL(file)
      }))
    };

    setMessages(prev => [...prev, newMessage]);

    // Simulate agent response
    setTimeout(() => {
      const agentMessage: ChatMessageProps = {
        id: (Date.now() + 1).toString(),
        text: 'Thanks for your message. An agent will be with you shortly.',
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMessage]);
    }, 1000);
  };

  const handleSendAudio = (audioBlob: Blob) => {
    const audioUrl = URL.createObjectURL(audioBlob);
    const newMessage: ChatMessageProps = {
      id: Date.now().toString(),
      text: '',
      sender: 'user',
      timestamp: new Date(),
      audioUrl,
      audioDuration: 0 // We'll need to calculate this properly
    };

    setMessages(prev => [...prev, newMessage]);

    // Simulate agent response
    setTimeout(() => {
      const agentMessage: ChatMessageProps = {
        id: (Date.now() + 1).toString(),
        text: 'Thanks for your voice message. An agent will listen to it shortly.',
        sender: 'agent',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, agentMessage]);
    }, 1000);
  };

  return (
    <div
      ref={containerRef}
      className="fixed right-6 z-50 transition-all"
      style={{
        bottom: 'calc(var(--footer-height, 4rem) + 0rem)',
        top: 'calc(var(--header-height, 4rem) + 1rem)',
        width: isExpanded ? 900 : width,
        maxWidth: 'calc(100vw - 3rem)'
      }}
    >
      <Card 
        className="h-full flex flex-col border p-0 shadow-2xl relative" 
        style={{
          backgroundColor: 'rgba(var(--card-rgb), 0.98)',
          backdropFilter: 'blur(12px)'
        }}
      >
        {/* Resize handle */}
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/20 transition-colors flex items-center justify-center"
          onMouseDown={(e) => {
            isResizing.current = true;
            const startX = e.clientX;
            const startWidth = width;
            
            const handleMouseMove = (e: MouseEvent) => {
              if (!isResizing.current) return;
              const delta = startX - e.clientX;
              const newWidth = Math.max(360, Math.min(900, startWidth + delta));
              setWidth(newWidth);
            };
            
            const handleMouseUp = () => {
              isResizing.current = false;
              document.removeEventListener('mousemove', handleMouseMove);
              document.removeEventListener('mouseup', handleMouseUp);
            };
            
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
          }}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground/50" />
        </div>
        {/* Header */}
        {/* Custom header to avoid CardHeader spacing issues */}
        <div className={cn(
          "flex flex-row items-center justify-between border-b px-6 py-2",
          resolvedTheme === 'dark' 
            ? "bg-[rgba(26,35,50,0.95)] text-white border-[rgba(255,255,255,0.1)]" 
            : "bg-[rgba(8,20,145,0.95)] text-white border-[rgba(255,255,255,0.2)]"
        )}>
          <h3 className="text-base font-semibold text-white">
            {content?.help?.liveChat || 'Live Chat'}
          </h3>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleExpandAction}
              className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"
            >
              {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCloseAction}
              className="h-7 w-7 text-white hover:bg-white/20 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Chat content with tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b px-2">
            <TabsList className="flex-initial rounded-none border-0 h-auto p-0.5 m-0 shrink-0 bg-transparent">
              <TabsTrigger value="current" className="gap-2 py-2 px-3 data-[state=active]:bg-muted">
                <MessageSquare className="h-4 w-4" />
                Current Chat
              </TabsTrigger>
              <TabsTrigger value="sessions" className="gap-2 py-2 px-3 data-[state=active]:bg-muted ml-2">
                <Clock className="h-4 w-4" />
                Past Sessions
              </TabsTrigger>
            </TabsList>
            <Button
              variant="default"
              size="sm"
              className="gap-1.5 text-sm font-medium h-9 px-4"
              onClick={() => {
                setMessages([{
                  id: Date.now().toString(),
                  text: 'Hello! How can I help you today?',
                  sender: 'agent',
                  timestamp: new Date(),
                          }]);
                setActiveTab('current');
              }}
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>

          {/* Current chat */}
          <TabsContent value="current" className="flex-1 flex flex-col overflow-hidden m-0">
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-2">
                {messages.map((message) => (
                  <ChatMessage key={message.id} {...message} />
                ))}
              </div>
            </div>
            <ChatInput onSendMessage={handleSendMessage} onSendAudio={handleSendAudio} />
          </TabsContent>

          {/* Past sessions */}
          <TabsContent value="sessions" className="flex-1 overflow-hidden m-0">
            <div className="h-full overflow-y-auto">
              <div className="p-4 space-y-2">
                {sessions.map((session) => (
                  <Card 
                    key={session.id} 
                    className="p-4 cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => {
                      setActiveTab('current');
                      // TODO: Load session messages
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{session.title}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {session.lastMessage}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground">
                          {session.timestamp.toLocaleDateString()}
                        </span>
                        {session.unread > 0 && (
                          <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                            {session.unread}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}