'use client';

import React, { useState, useEffect } from 'react';
import { ChatFAB } from '@/components/molecules/ChatFAB';
import { ChatWidget } from '@/components/organisms/ChatWidget';
import { WorkflowCreationChat } from '@/components/organisms/WorkflowCreationChat';
import { WorkflowNodeEditorChat } from '@/components/organisms/WorkflowNodeEditorChat';
import { useRouter, usePathname } from 'next/navigation';

export type ChatContext = 'live' | 'workflow' | 'agent' | 'node-editor' | null;

interface OmniChatFABProps {
  defaultContext?: ChatContext;
}

export function OmniChatFAB({ defaultContext = 'live' }: OmniChatFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeContext, setActiveContext] = useState<ChatContext>(defaultContext);
  const [isExpanded, setIsExpanded] = useState(false);
  const [nodeData, setNodeData] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Determine context based on current page
  useEffect(() => {
    if (pathname?.includes('/agents')) {
      setActiveContext('workflow');
    } else {
      setActiveContext('live');
    }
  }, [pathname]);

  const handleFABClick = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleWorkflowComplete = (config: any) => {
    setIsOpen(false);
    // Navigate to workflow builder with configuration
    const params = new URLSearchParams({
      template: config.template || '',
      persona: config.persona || '',
      tone: config.tone || '',
      knowledgeIndexes: (config.knowledgeIndexes || []).join(','),
      integrations: (config.integrations || []).join(',')
    });
    
    router.push(`/agents/workflow/create?${params.toString()}`);
  };

  // Expose a global method to trigger specific contexts
  useEffect(() => {
    (window as any).openOmniChat = (context: ChatContext, data?: any) => {
      setActiveContext(context);
      if (context === 'node-editor' && data) {
        setNodeData(data);
      }
      setIsOpen(true);
    };

    return () => {
      delete (window as any).openOmniChat;
    };
  }, []);

  if (!isOpen) {
    return (
      <div className="fixed bottom-8 right-8 z-50">
        <ChatFAB onClickAction={handleFABClick} />
      </div>
    );
  }

  // Render appropriate chat widget based on context
  return (
    <div className="fixed bottom-8 right-8 z-50">
      {activeContext === 'workflow' && (
        <WorkflowCreationChat
          isOpen={isOpen}
          onCloseAction={handleClose}
          onCompleteAction={handleWorkflowComplete}
        />
      )}
      {activeContext === 'live' && (
        <ChatWidget
          isExpanded={isExpanded}
          onToggleExpandAction={() => setIsExpanded(!isExpanded)}
          onCloseAction={handleClose}
        />
      )}
      {activeContext === 'node-editor' && (
        <WorkflowNodeEditorChat
          isOpen={isOpen}
          onCloseAction={handleClose}
          nodeData={nodeData}
        />
      )}
    </div>
  );
}