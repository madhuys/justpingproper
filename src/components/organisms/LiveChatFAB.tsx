'use client';

import React, { useState } from 'react';
import { ChatFAB } from '@/components/molecules/ChatFAB';
import { ChatWidget } from '@/components/organisms/ChatWidget';

export function LiveChatFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!isOpen) {
    return <ChatFAB onClickAction={() => setIsOpen(true)} />;
  }

  return (
    <ChatWidget
      isExpanded={isExpanded}
      onToggleExpandAction={() => setIsExpanded(!isExpanded)}
      onCloseAction={() => setIsOpen(false)}
    />
  );
}