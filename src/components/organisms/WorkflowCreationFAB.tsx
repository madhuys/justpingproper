'use client';

import React, { useState } from 'react';
import { ChatFAB } from '@/components/molecules/ChatFAB';
import { WorkflowCreationChat } from '@/components/organisms/WorkflowCreationChat';

interface WorkflowCreationFABProps {
  onWorkflowComplete: (config: any) => void;
}

export function WorkflowCreationFAB({ onWorkflowComplete }: WorkflowCreationFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleComplete = (config: any) => {
    setIsOpen(false);
    onWorkflowComplete(config);
  };

  if (!isOpen) {
    return <ChatFAB onClickAction={() => setIsOpen(true)} />;
  }

  return (
    <WorkflowCreationChat
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onComplete={handleComplete}
    />
  );
}