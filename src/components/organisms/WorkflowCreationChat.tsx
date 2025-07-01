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
import aiModels from '@/data/aiModels.json';
import knowledgebaseState from '@/data/states/knowledgebase.json';
import mcpServers from '@/data/mcpServers.json';
import agentCreationOptions from '@/data/states/agentCreationOptions.json';
import toast from 'react-hot-toast';

interface WorkflowCreationChatProps {
  isOpen: boolean;
  onCloseAction: () => void;
  onCompleteAction: (config: any) => void;
  agentType?: 'workflow' | 'freeflow';
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

export function WorkflowCreationChat({ isOpen, onCloseAction, onCompleteAction, agentType = 'workflow' }: WorkflowCreationChatProps) {
  const { resolvedTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState('welcome');
  const [config, setConfig] = useState<any>({ agentType });
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

  // Use actual knowledge indexes from state and shared options
  const knowledgeIndexes = knowledgebaseState.indexes.knowledge.map((index: any) => ({
    label: index.name || '',
    value: index.id || ''
  }));

  const integrations = agentCreationOptions.integrations;
  const tools = agentCreationOptions.tools;

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
    setConfig({ agentType });
    setSelectedPersona(null);
    setPlayingVideo(null);
    setShowPersonaVideo(false);
    
    // Use setTimeout to ensure state is cleared before adding message
    setTimeout(() => {
      if (agentType === 'freeflow') {
        addBotMessage(
          "Welcome to Agent Builder! Let's create a free-flow agent. First, what's the main purpose or mandate for your assistant?",
          agentCreationOptions.purposes.freeflow
        );
        setCurrentStep('mandate');
      } else {
        addBotMessage(
          "Welcome to Agent Builder! What's the main purpose of this agent?",
          agentCreationOptions.purposes.workflow
        );
      }
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
      case 'mandate':
        if (agentType === 'freeflow') {
          // Handle button selection for mandate
          setConfig((prev: any) => ({ ...prev, mandate: action }));
          setCurrentStep('selectPersona');
          
          setTimeout(() => {
            const personaButtons = personas.personas.map(p => p.name);
            addBotMessage(
              'Great! Now, choose a persona for your agent:',
              personaButtons
            );
          }, 500);
        }
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
      case 'agentName':
        if (action === 'Skip') {
          setConfig((prev: any) => ({ ...prev, name: '' }));
          finalizeAgent();
        }
        break;
      case 'confirmAgent':
        if (action === 'Yes, perfect!') {
          setCurrentStep('agentName');
          setTimeout(() => {
            addBotMessage(
              'Great! Would you like to give your agent a name? You can type a name or skip.',
              ['Skip']
            );
          }, 500);
        } else {
          // Go back to description
          setCurrentStep('agentDescription');
          setTimeout(() => {
            addBotMessage(
              'No problem! Please describe what you want this agent to do again.'
            );
          }, 500);
        }
        break;
      case 'confirmBuild':
        buildFreeflowAgent();
        break;
      case 'selectKnowledgeIndexes':
        if (action === 'Skip') {
          setConfig((prev: any) => ({ ...prev, knowledgeIndexes: [] }));
          setSelectedChoices([]);
          
          // Continue to integrations
          setCurrentStep('selectIntegrations');
          setTimeout(() => {
            addBotMessage(
              'Select integrations/MCP servers for your agent or skip:',
              ['Skip'],
              undefined,
              mcpServers.servers.map(s => s.name)
            );
          }, 500);
        }
        break;
      case 'selectIntegrations':
        if (action === 'Skip') {
          setConfig((prev: any) => ({ ...prev, integrations: [] }));
          setSelectedChoices([]);
          
          // Show final confirmation
          setCurrentStep('confirmBuild');
          setTimeout(() => {
            addBotMessage(
              `Perfect! I'll create a free-flow agent with:\n- Mandate: ${config.mandate}\n- Persona: ${personas.personas.find(p => p.id === config.persona)?.name}\n- Name: ${config.name || 'Unnamed'}\n- Model: ${config.aiModel}\n\nReady to create?`,
              ['Create Agent']
            );
          }, 500);
        }
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
    if (agentType === 'freeflow') {
      // For freeflow, knowledge indexes are optional
      addUserMessage(selectedChoices.length > 0 ? selectedChoices.join(', ') : 'None selected');
      // Convert names to IDs
      const selectedIndexes = selectedChoices.map(choice => 
        knowledgebaseState.indexes.knowledge.find((k: any) => k.name === choice)?.id
      ).filter(Boolean);
      
      setConfig((prev: any) => ({ ...prev, knowledgeIndexes: selectedIndexes }));
      setSelectedChoices([]);
      
      // Continue to integrations
      setCurrentStep('selectIntegrations');
      setTimeout(() => {
        addBotMessage(
          'Select integrations/MCP servers for your agent:',
          undefined,
          undefined,
          mcpServers.servers.map(s => s.name)
        );
      }, 500);
    } else {
      // Original workflow logic
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
    }
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
        if (agentType === 'freeflow') {
          setCurrentStep('agentDescription');
          addBotMessage(
            'Please briefly describe what you want this agent to do. Be specific about its tasks and capabilities.'
          );
        } else {
          setCurrentStep('selectIntegrations');
          addBotMessage(
            'Which connected integrations should this agent use?',
            undefined,
            undefined,
            integrations
          );
        }
      }, 2000);
    }, 500);
  };

  const handleMultiselectSubmit = () => {
    if (currentStep === 'selectKnowledgeIndexes') {
      handleKnowledgeIndexSubmit();
    } else if (currentStep === 'selectIntegrations') {
      if (agentType === 'freeflow') {
        // For freeflow, integrations are optional
        addUserMessage(selectedChoices.length > 0 ? selectedChoices.join(', ') : 'None selected');
        // Convert MCP server names to IDs
        const selectedMcpIds = selectedChoices.map(name => 
          mcpServers.servers.find(s => s.name === name)?.id
        ).filter(Boolean);
        setConfig((prev: any) => ({ ...prev, integrations: selectedMcpIds }));
        setSelectedChoices([]);
        
        // Ask for agent description after integrations
        setCurrentStep('agentDescription');
        setTimeout(() => {
          addBotMessage(
            'Please briefly describe what you want this agent to do. Be specific about its tasks and capabilities.'
          );
        }, 500);
      } else {
        if (selectedChoices.length === 0) {
          toast.error('Please select at least one option');
          return;
        }
        
        addUserMessage(selectedChoices.join(', '));
        setConfig((prev: any) => ({ ...prev, integrations: selectedChoices }));
        setSelectedChoices([]);
        
        buildWorkflow();
      }
    } else if (currentStep === 'selectTools') {
      addUserMessage(selectedChoices.join(', '));
      // Convert tool names back to IDs
      const selectedToolIds = selectedChoices.map(name => 
        tools.find(t => t.name === name)?.id
      ).filter(Boolean);
      setConfig((prev: any) => ({ ...prev, tools: selectedToolIds }));
      setSelectedChoices([]);
      
      // Continue to knowledge indexes
      setCurrentStep('selectKnowledgeIndexes');
      setTimeout(() => {
        addBotMessage(
          'Would you like to enable knowledge search? Select knowledge indexes or skip:',
          ['Skip'],
          undefined,
          knowledgebaseState.indexes.knowledge.map((k: any) => k.name)
        );
      }, 500);
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

  const finalizeAgent = () => {
    setCurrentStep('building');
    setTimeout(() => {
      addBotMessage('Perfect! Creating your free-flow agent now... ✨');
    }, 500);
    
    setTimeout(() => {
      onCompleteAction(config);
      onCloseAction();
      toast.success('Opening Free-Flow Agent Playground...');
    }, 2000);
  };
  
  const buildFreeflowAgent = () => {
    finalizeAgent();
  };

  const handleViewWorkflow = () => {
    onCompleteAction(config);
    onCloseAction();
    toast.success('Opening workflow builder...');
  };

  const handleSendMessage = (text: string) => {
    // Handle free text input
    addUserMessage(text);
    
    if (agentType === 'freeflow') {
      switch (currentStep) {
        case 'mandate':
          // Store the mandate
          setConfig((prev: any) => ({ ...prev, mandate: text }));
          setCurrentStep('selectPersona');
          
          setTimeout(() => {
            const personaButtons = personas.personas.map(p => p.name);
            addBotMessage(
              'Great! Now, choose a persona for your agent:',
              personaButtons
            );
          }, 500);
          break;
          
        case 'agentDescription':
          // Store the description
          setConfig((prev: any) => ({ ...prev, description: text }));
          setCurrentStep('confirmAgent');
          
          // Generate confirmation message based on description
          setTimeout(() => {
            const persona = personas.personas.find(p => p.id === config.persona);
            addBotMessage(
              `Got it! Let me confirm what I'll create:\n\n🤖 **${persona?.name || 'AI'} Agent**\n\n📋 **Tasks:**\n- ${text}\n\n🎯 **Purpose:** ${config.mandate}\n\n🧰 **Tools:** ${config.tools?.length || 0} selected\n📚 **Knowledge:** ${config.knowledgeIndexes?.length || 0} indexes\n🔌 **Integrations:** ${config.integrations?.length || 0} connected\n\nDoes this look correct?`,
              ['Yes, perfect!', 'No, let me change something']
            );
          }, 500);
          break;
          
        case 'agentName':
          // Store the name
          setConfig((prev: any) => ({ ...prev, name: text }));
          finalizeAgent();
          break;
      }
    }
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

    if (message.dropdown) {
      return (
        <div className="mt-3 space-y-3">
          <Select
            onValueChange={(value) => {
              addUserMessage(message.dropdown?.find(d => d.value === value)?.label || value);
              setConfig((prev: any) => ({ ...prev, aiModel: value }));
              
              // Continue to next step
              setCurrentStep('selectTools');
              setTimeout(() => {
                addBotMessage(
                  'Select the tools your agent should have access to:',
                  undefined,
                  undefined,
                  tools.map(t => t.name)
                );
              }, 500);
            }}
            disabled={!waitingForInput}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select an AI model..." />
            </SelectTrigger>
            <SelectContent>
              {message.dropdown.map(item => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              {agentType === 'freeflow' ? 'Free-Flow Agent Assistant' : 'Workflow Agent Assistant'}
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