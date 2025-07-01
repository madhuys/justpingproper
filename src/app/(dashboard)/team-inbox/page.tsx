'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ConversationList } from '@/components/organisms/teamInbox/ConversationList';
import { ChatView } from '@/components/organisms/teamInbox/ChatView';
import { ContextPanel } from '@/components/organisms/teamInbox/ContextPanel';
import { Card } from '@/components/ui/card';
import toast from 'react-hot-toast';
import teamInboxStrings from '@/data/strings/teamInbox.json';
import publishedAgentsData from '@/data/publishedAgents.json';
import mockConversationsData from '@/data/mockConversations.json';

interface Conversation {
  id: string;
  channel: string;
  customerName: string;
  status: string;
  priority: string;
  assignedTo: string | null;
  lastMessage: {
    text: string;
    timestamp: string;
    sender: string;
  };
  unreadCount: number;
  messages: any[];
  capturedData?: Record<string, any>;
  notes?: any[];
}

interface ResizablePanesProps {
  leftContent: React.ReactNode;
  centerContent: React.ReactNode;
  rightContent: React.ReactNode;
}

// Resizable three-pane layout component (copied from freeflow)
function ResizablePanes({ leftContent, centerContent, rightContent }: ResizablePanesProps) {
  const [leftWidth, setLeftWidth] = useState(300); // 300px min for left pane
  const [rightWidth, setRightWidth] = useState(360); // 360px min for right pane
  const containerRef = useRef<HTMLDivElement>(null);
  const leftResizeRef = useRef<HTMLDivElement>(null);
  const rightResizeRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current || !isResizing) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const mouseX = e.clientX - containerRect.left;

    if (isResizing === 'left') {
      const newWidth = mouseX;
      setLeftWidth(Math.max(300, Math.min(600, newWidth))); // Min 300px, Max 600px
    } else if (isResizing === 'right') {
      const rightEdgeX = containerWidth - mouseX;
      const newWidth = rightEdgeX;
      setRightWidth(Math.max(360, Math.min(600, newWidth))); // Min 360px, Max 600px
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(null);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  return (
    <div ref={containerRef} className="flex h-full relative">
      {/* Left Pane */}
      <div style={{ width: `${leftWidth}px` }} className="h-full overflow-hidden flex-shrink-0">
        {leftContent}
      </div>

      {/* Left Resize Handle */}
      <div
        ref={leftResizeRef}
        className="w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors"
        onMouseDown={() => setIsResizing('left')}
      />

      {/* Center Pane */}
      <div className="h-full overflow-hidden flex-1">
        {centerContent}
      </div>

      {/* Right Resize Handle */}
      <div
        ref={rightResizeRef}
        className="w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors"
        onMouseDown={() => setIsResizing('right')}
      />

      {/* Right Pane */}
      <div style={{ width: `${rightWidth}px` }} className="h-full overflow-hidden flex-shrink-0">
        {rightContent}
      </div>
    </div>
  );
}

export default function TeamInboxPage() {
  const [selectedInbox, setSelectedInbox] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [loading, setLoading] = useState(true);

  // Get available team inboxes from published agents
  const availableInboxes = publishedAgentsData
    .filter(agent => agent.status === 'published' && agent.inboxId)
    .map(agent => ({
      id: agent.inboxId,
      name: agent.agentName,
      teamCount: agent.teamAccess.length
    }));

  useEffect(() => {
    // Set default inbox
    if (availableInboxes.length > 0 && !selectedInbox) {
      setSelectedInbox(availableInboxes[0].id);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (selectedInbox && mockConversationsData[selectedInbox]) {
      setConversations(mockConversationsData[selectedInbox]);
      // Select first conversation by default
      if (mockConversationsData[selectedInbox].length > 0 && !selectedConversation) {
        setSelectedConversation(mockConversationsData[selectedInbox][0]);
      }
    }
  }, [selectedInbox]);

  const handleInboxChange = (inboxId: string) => {
    setSelectedInbox(inboxId);
    setSelectedConversation(null);
  };

  const handleConversationSelect = (conversation: Conversation) => {
    setSelectedConversation(conversation);
    // Mark as read
    if (conversation.unreadCount > 0) {
      const updatedConversations = conversations.map(c =>
        c.id === conversation.id ? { ...c, unreadCount: 0 } : c
      );
      setConversations(updatedConversations);
    }
  };

  const handleAssignmentChange = (conversationId: string, assigneeId: string | null) => {
    const updatedConversations = conversations.map(c =>
      c.id === conversationId ? { ...c, assignedTo: assigneeId } : c
    );
    setConversations(updatedConversations);
    
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation({ ...selectedConversation, assignedTo: assigneeId });
    }
    
    toast.success(teamInboxStrings.teamInbox.messages.assignSuccess);
  };

  const handleStatusChange = (conversationId: string, status: string) => {
    const updatedConversations = conversations.map(c =>
      c.id === conversationId ? { ...c, status } : c
    );
    setConversations(updatedConversations);
    
    if (selectedConversation?.id === conversationId) {
      setSelectedConversation({ ...selectedConversation, status });
    }
    
    toast.success(teamInboxStrings.teamInbox.messages.stateChangeSuccess);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Left pane content
  const leftPaneContent = (
    <div className="h-full sidebar-glass-dark dark:sidebar-glass-dark">
      <ConversationList
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={handleConversationSelect}
        selectedInbox={selectedInbox}
        availableInboxes={availableInboxes}
        onInboxChange={handleInboxChange}
      />
    </div>
  );

  // Center pane content
  const centerPaneContent = selectedConversation ? (
    <ChatView
      conversation={selectedConversation}
      onAssignmentChange={(assigneeId) => 
        handleAssignmentChange(selectedConversation.id, assigneeId)
      }
      onStatusChange={(status) =>
        handleStatusChange(selectedConversation.id, status)
      }
    />
  ) : (
    <Card className="h-full rounded-none border-0 border-r flex items-center justify-center">
      <p className="text-muted-foreground">Select a conversation to view</p>
    </Card>
  );

  // Right pane content
  const rightPaneContent = (
    <div className="h-full sidebar-glass-dark dark:sidebar-glass-dark">
      {selectedConversation ? (
        <ContextPanel
          conversation={selectedConversation}
          onStatusChange={(status) =>
            handleStatusChange(selectedConversation.id, status)
          }
        />
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          Select a conversation to view details
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full overflow-hidden">
      <ResizablePanes
        leftContent={leftPaneContent}
        centerContent={centerPaneContent}
        rightContent={rightPaneContent}
      />
    </div>
  );
}