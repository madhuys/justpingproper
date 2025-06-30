'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Minimize2, Maximize2, MessageSquare, Bot, Sparkles, Send, User, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChatMessage } from '@/components/molecules/ChatMessage';
import { ChatInput } from '@/components/molecules/ChatInput';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import workflowTemplates from '@/data/workflowTemplates.json';
import personas from '@/data/personas.json';
import toast from 'react-hot-toast';

interface WorkflowCreationChatProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onCompleteAction: (config: any) => void;
}

interface ExtendedChatMessage {
  id: string;
  text: string;
  sender: 'agent' | 'user';
  timestamp: Date;
  buttons?: string[];
  choices?: string[];
  multiselect?: string[];
  dropdown?: { label: string; value: string }[];
  inputType?: 'buttons' | 'multiselect' | 'dropdown';
  personaVideo?: any;
}

export function WorkflowCreationChat({ isOpen, onCloseAction, onCompleteAction }: WorkflowCreationChatProps) {
  const { resolvedTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState('welcome');
  const [config, setConfig] = useState<any>({});
  const [isTyping, setIsTyping] = useState(false);
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [showPersonaVideo, setShowPersonaVideo] = useState(false);
  const messageIdCounter = useRef(0);
  const hasStarted = useRef(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Mock data
  const knowledgeIndexes = [
    { label: 'Support Articles Index', value: 'support-articles' },
    { label: 'Product Specs Index', value: 'product-specs' },
    { label: 'Sales Playbook Index', value: 'sales-playbook' },
    { label: 'IT Documentation Index', value: 'it-documentation' },
    { label: 'Product Catalog Index', value: 'product-catalog' }
  ];

  const integrations = [
    'Google Calendar',
    'HubSpot CRM',
    'Zendesk',
    'Salesforce',
    'LinkedIn Recruiter',
    'Slack'
  ];

  useEffect(() => {
    if (isOpen && !hasStarted.current) {
      hasStarted.current = true;
      startConversation();
    }
    
    // Reset when dialog closes
    if (!isOpen) {
      hasStarted.current = false;
    }
  }, [isOpen]);

  const startConversation = () => {
    setMessages([]);
    setCurrentStep('welcome');
    setConfig({});
    setSelectedPersona(null);
    setPlayingVideo(null);
    setShowPersonaVideo(false);
    
    // Use setTimeout to ensure state is cleared before adding message
    setTimeout(() => {
      addBotMessage(
        "Welcome to Agent Builder! What's the main purpose of this agent?",
        ['Customer Support', 'Interview Screening', 'Order Processing', 'Lead Qualification', 'IT Helpdesk', 'Build from Scratch']
      );
    }, 100);
  };

  const addBotMessage = (
    text: string, 
    buttons?: string[], 
    choices?: string[], 
    multiselect?: string[], 
    dropdown?: { label: string; value: string }[]
  ) => {
    setIsTyping(true);
    
    // Scroll to bottom when typing starts
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, 100);
    
    setTimeout(() => {
      const inputType = buttons ? 'buttons' : multiselect ? 'multiselect' : dropdown ? 'dropdown' : undefined;
      
      setMessages(prev => [...prev, {
        id: `msg-${++messageIdCounter.current}`,
        text,
        sender: 'agent',
        timestamp: new Date(),
        buttons,
        choices,
        multiselect,
        dropdown,
        inputType
      }]);
      setIsTyping(false);
      setWaitingForInput(true);
      
      // Scroll to bottom after message is added
      setTimeout(() => {
        if (scrollAreaRef.current) {
          const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
          }
        }
      }, 100);
    }, 800);
  };

  const addUserMessage = (text: string) => {
    setMessages(prev => [...prev, {
      id: `msg-${++messageIdCounter.current}`,
      text,
      sender: 'user',
      timestamp: new Date()
    }]);
    setWaitingForInput(false);
    
    // Scroll to bottom after user message
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, 100);
  };

  const handleButtonClick = (action: string) => {
    addUserMessage(action);
    
    switch (currentStep) {
      case 'welcome':
        handleTemplateSelection(action);
        break;
      case 'useKnowledgeIndex':
        handleKnowledgeIndexChoice(action);
        break;
      case 'selectPersona':
        handlePersonaSelection(action);
        break;
      case 'viewWorkflow':
        handleViewWorkflow();
        break;
    }
  };

  const handleTemplateSelection = (template: string) => {
    const templateId = template.toLowerCase().replace(/ /g, '-');
    setConfig((prev: any) => ({ ...prev, template: templateId }));
    
    if (templateId === 'build-from-scratch') {
      setCurrentStep('selectPersona');
      setTimeout(() => {
        const personaButtons = personas.personas.map(p => p.name);
        addBotMessage(
          "Let's define your custom flow. First, pick a persona for your agent:",
          personaButtons
        );
      }, 500);
    } else {
      setCurrentStep('useKnowledgeIndex');
      setTimeout(() => {
        addBotMessage(
          `Great choice! ${template} is a popular workflow. Would you like to fine-tune this flow with your knowledge indexes?`,
          ['Yes, select indexes', 'No, skip']
        );
      }, 500);
    }
  };

  const handleKnowledgeIndexChoice = (choice: string) => {
    if (choice === 'Yes, select indexes') {
      setCurrentStep('selectKnowledgeIndexes');
      setTimeout(() => {
        addBotMessage(
          'Select one or more knowledge indexes to enhance your agent:',
          undefined,
          undefined,
          knowledgeIndexes.map(k => k.label)
        );
      }, 500);
    } else {
      setCurrentStep('selectPersona');
      setTimeout(() => {
        const personaButtons = personas.personas.map(p => p.name);
        addBotMessage(
          'Choose a persona for your agent responses:',
          personaButtons
        );
      }, 500);
    }
  };

  const handleKnowledgeIndexSubmit = () => {
    if (selectedChoices.length === 0) {
      toast.error('Please select at least one knowledge index');
      return;
    }
    
    addUserMessage(selectedChoices.join(', '));
    const selectedIndexes = selectedChoices.map(choice => 
      knowledgeIndexes.find(k => k.label === choice)?.value
    ).filter(Boolean);
    
    setConfig((prev: any) => ({ ...prev, knowledgeIndexes: selectedIndexes }));
    setSelectedChoices([]);
    
    setCurrentStep('selectPersona');
    setTimeout(() => {
      const personaButtons = personas.personas.map(p => p.name);
      addBotMessage(
        'Choose a persona for your agent responses:',
        personaButtons
      );
    }, 500);
  };

  const handlePersonaSelection = (personaName: string) => {
    const persona = personas.personas.find(p => p.name === personaName);
    if (!persona) return;
    
    setSelectedPersona(persona.id);
    setPlayingVideo(persona.id);
    setShowPersonaVideo(true);
    setConfig((prev: any) => ({ ...prev, persona: persona.id, tone: persona.tone }));
    
    // Add persona video message
    setMessages(prev => [...prev, {
      id: `msg-${++messageIdCounter.current}`,
      text: '',
      sender: 'agent',
      timestamp: new Date(),
      personaVideo: persona
    }]);
    
    // Scroll to bottom after persona video
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, 100);
    
    // Add persona's self introduction after a short delay
    setTimeout(() => {
      if (persona.selfIntroduction) {
        addBotMessage(persona.selfIntroduction);
      }
      
      // Continue to next step after video/intro
      setTimeout(() => {
        setCurrentStep('selectIntegrations');
        addBotMessage(
          'Which connected integrations should this agent use?',
          undefined,
          undefined,
          integrations
        );
      }, 2000);
    }, 500);
  };

  const handleMultiselectSubmit = () => {
    if (currentStep === 'selectKnowledgeIndexes') {
      handleKnowledgeIndexSubmit();
    } else if (currentStep === 'selectIntegrations') {
      if (selectedChoices.length === 0) {
        toast.error('Please select at least one option');
        return;
      }
      
      addUserMessage(selectedChoices.join(', '));
      setConfig((prev: any) => ({ ...prev, integrations: selectedChoices }));
      setSelectedChoices([]);
      
      buildWorkflow();
    }
  };

  const buildWorkflow = () => {
    setCurrentStep('building');
    setTimeout(() => {
      addBotMessage('Building your draft workflow... ✨');
    }, 500);
    
    setTimeout(() => {
      setCurrentStep('viewWorkflow');
      addBotMessage(
        'Your draft workflow is ready! Click below to view and edit it in the workflow builder.',
        ['View Workflow']
      );
    }, 2000);
  };

  const handleViewWorkflow = () => {
    onCompleteAction(config);
    onCloseAction();
    toast.success('Opening workflow builder...');
  };

  const handleSendMessage = (text: string) => {
    // Handle free text input if needed
    addUserMessage(text);
  };

  const renderSpecialInput = (message: ExtendedChatMessage) => {
    if (message.buttons) {
      // Check if these are persona buttons
      const isPersonaSelection = currentStep === 'selectPersona' && 
        message.buttons.some(btn => personas.personas.some(p => p.name === btn));
      
      if (isPersonaSelection) {
        return (
          <div className="grid grid-cols-1 gap-2 mt-3">
            {message.buttons.map((button) => {
              const persona = personas.personas.find(p => p.name === button);
              if (!persona) return null;
              
              return (
                <Card
                  key={persona.id}
                  className={cn(
                    "cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md overflow-hidden",
                    "border-muted/50",
                    !waitingForInput && "opacity-50 cursor-not-allowed",
                    selectedPersona === persona.id && "ring-2 ring-primary"
                  )}
                  onClick={() => waitingForInput && handleButtonClick(button)}
                >
                  <div className="flex gap-4 p-4">
                    {/* Square video/image container */}
                    <div className="relative w-24 h-24 flex-shrink-0 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg overflow-hidden">
                      {persona.video ? (
                        <video
                          src={persona.video}
                          className="w-full h-full object-cover"
                          muted
                          autoPlay={playingVideo === persona.id}
                          onEnded={() => setPlayingVideo(null)}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="h-12 w-12 text-primary/50" />
                        </div>
                      )}
                    </div>
                    
                    {/* Info section */}
                    <div className="flex-1">
                      <h4 className="font-medium">{persona.name}</h4>
                      <p className="text-sm text-muted-foreground">{persona.role}</p>
                      <p className="text-xs mt-2">{persona.description}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        );
      }
      
      // Regular buttons
      return (
        <div className="flex flex-wrap gap-2 mt-3">
          {message.buttons.map((button) => (
            <Button
              key={button}
              variant="outline"
              size="sm"
              onClick={() => handleButtonClick(button)}
              disabled={!waitingForInput}
            >
              {button}
            </Button>
          ))}
        </div>
      );
    }

    if (message.multiselect) {
      return (
        <div className="mt-3 space-y-3">
          <div className="space-y-2">
            {message.multiselect.map((option) => (
              <label
                key={option}
                className="flex items-center gap-2 cursor-pointer p-2 hover:bg-accent rounded"
              >
                <Checkbox
                  checked={selectedChoices.includes(option)}
                  onCheckedChange={(checked) => {
                    setSelectedChoices(prev =>
                      checked
                        ? [...prev, option]
                        : prev.filter(c => c !== option)
                    );
                  }}
                  disabled={!waitingForInput}
                />
                <span className="text-sm">{option}</span>
              </label>
            ))}
          </div>
          <Button
            size="sm"
            onClick={handleMultiselectSubmit}
            disabled={selectedChoices.length === 0 || !waitingForInput}
          >
            Continue
          </Button>
        </div>
      );
    }

    return null;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed right-6 z-50 transition-all"
      style={{
        bottom: 'calc(2rem + 2rem)', // Footer height + 2rem padding
        top: '5rem',
        width: isExpanded ? 900 : 480,
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
        {/* Header */}
        <div className={cn(
          "flex flex-row items-center justify-between border-b px-6 py-2",
          resolvedTheme === 'dark' 
            ? "bg-[rgba(26,35,50,0.95)] text-white border-[rgba(255,255,255,0.1)]" 
            : "bg-[rgba(8,20,145,0.95)] text-white border-[rgba(255,255,255,0.2)]"
        )}>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <h3 className="text-base font-semibold text-white">
              Agent Creation Assistant
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
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

        {/* Chat content */}
        <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
          <div className="space-y-2">
            {messages.map((message) => (
              <div key={message.id}>
                {message.personaVideo ? (
                  // Render persona video card
                  <div className="flex gap-3 mb-4">
                    <div className="flex-shrink-0 p-0.5">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-primary-foreground" />
                        </div>
                      </div>
                    </div>
                    <div className="flex-1 max-w-[85%]">
                      <Card className="overflow-hidden">
                        <div className="space-y-4">
                          {/* Large square video preview */}
                          <div className="relative w-full aspect-square bg-gradient-to-br from-primary/20 to-primary/10 overflow-hidden">
                            <video
                              src={message.personaVideo.video}
                              className="w-full h-full object-cover"
                              muted
                              autoPlay={playingVideo === message.personaVideo.id}
                              onEnded={() => setPlayingVideo(null)}
                            />
                          </div>
                          {/* Info section below video */}
                          <div className="px-4 pb-4">
                            <h4 className="font-medium text-lg">{message.personaVideo.name}</h4>
                            <p className="text-sm text-muted-foreground">{message.personaVideo.role}</p>
                            <Badge variant="secondary" className="mt-2">{message.personaVideo.tone}</Badge>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </div>
                ) : (
                  // Regular message
                  <>
                    <ChatMessage
                      id={message.id}
                      text={message.text}
                      sender={message.sender}
                      timestamp={message.timestamp}
                    />
                    {message.sender === 'agent' && renderSpecialInput(message)}
                  </>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3 mb-4">
                <div className="flex-shrink-0 p-0.5">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary-foreground" />
                    </div>
                  </div>
                </div>
                <div className="flex-1 max-w-[85%]">
                  <div className="px-4 py-3 bg-muted rounded-2xl rounded-tl-md">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input area */}
        <ChatInput 
          onSendMessage={handleSendMessage}
          placeholder="Type your response..."
          disabled={!waitingForInput || currentStep === 'building' || currentStep === 'viewWorkflow'}
        />
      </Card>
    </div>
  );
}