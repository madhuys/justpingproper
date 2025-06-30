'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Minimize2, Maximize2, Bot, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/components/molecules/ChatMessage';
import { ChatInput } from '@/components/molecules/ChatInput';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface WorkflowNodeEditorChatProps {
  isOpen: boolean;
  onCloseAction: () => void;
  nodeData: any;
}

interface ExtendedChatMessage {
  id: string;
  text: string;
  sender: 'agent' | 'user';
  timestamp: Date;
  buttons?: string[];
}

export function WorkflowNodeEditorChat({ isOpen, onCloseAction, nodeData }: WorkflowNodeEditorChatProps) {
  const { resolvedTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ExtendedChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messageIdCounter = useRef(0);

  useEffect(() => {
    if (isOpen && nodeData) {
      startConversation();
    }
  }, [isOpen, nodeData]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollAreaRef.current) {
        const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (scrollContainer) {
          scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
      }
    }, 100);
  };

  const startConversation = () => {
    if (!nodeData) return;
    
    setMessages([]);
    
    let initialMessage = '';
    let suggestions: string[] = [];
    
    const node = nodeData.node;
    
    switch (node.data.type) {
      case 'message':
        initialMessage = `I can help you modify this message node. The current message is:\n\n"${node.data.prompt || 'No message set'}"\n\nWhat would you like to change?`;
        suggestions = [
          'Make it more friendly',
          'Make it more professional', 
          'Add personalization',
          'Make it shorter',
          'Translate to another language'
        ];
        break;
        
      case 'input':
        if (node.data.inputType === 'choice' || node.data.inputType === 'multiselect') {
          const choices = node.data.choices || node.data.options || [];
          initialMessage = `This ${node.data.inputType === 'choice' ? 'single choice' : 'multiple choice'} input has ${choices.length} options:\n\n${choices.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')}\n\nHow would you like to modify these options?`;
          suggestions = [
            'Add more options',
            'Change to country list',
            'Change to city list',
            'Reorder options',
            'Convert to text input'
          ];
        } else {
          initialMessage = `This text input collects "${node.data.variable || 'user input'}". The prompt is:\n\n"${node.data.prompt || 'No prompt set'}"\n\nWhat would you like to change?`;
          suggestions = [
            'Add validation',
            'Convert to dropdown',
            'Update prompt text',
            'Make it required',
            'Add placeholder'
          ];
        }
        break;
        
      case 'action':
        initialMessage = `This action node is configured as "${node.data.actionType || 'Not configured'}". How would you like to modify it?`;
        suggestions = [
          'Change action type',
          'Configure API call',
          'Set up email action',
          'Add webhook',
          'Configure MCP tool'
        ];
        break;
        
      case 'branch':
        initialMessage = `This branch node splits the flow into ${node.data.branchCount || 2} paths. What would you like to adjust?`;
        suggestions = [
          'Add more branches',
          'Remove a branch',
          'Add conditions',
          'Change branch logic'
        ];
        break;
        
      default:
        initialMessage = `How can I help you modify this ${node.data.type} node?`;
        suggestions = ['Change label', 'Update configuration'];
    }
    
    addBotMessage(initialMessage, suggestions);
  };

  const addBotMessage = (text: string, buttons?: string[]) => {
    setIsTyping(true);
    
    setTimeout(() => {
      const message: ExtendedChatMessage = {
        id: `msg-${++messageIdCounter.current}`,
        text,
        sender: 'agent',
        timestamp: new Date(),
        buttons
      };
      
      setMessages(prev => [...prev, message]);
      setIsTyping(false);
      setWaitingForInput(true);
      scrollToBottom();
    }, 800);
  };

  const addUserMessage = (text: string) => {
    const message: ExtendedChatMessage = {
      id: `msg-${++messageIdCounter.current}`,
      text,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, message]);
    setWaitingForInput(false);
    scrollToBottom();
    
    // Process the user's request
    processUserRequest(text);
  };

  const handleButtonClick = (action: string) => {
    addUserMessage(action);
  };

  const processUserRequest = (text: string) => {
    if (!nodeData) return;
    
    const lowerText = text.toLowerCase();
    const node = nodeData.node;
    
    // Handle different types of requests
    if (lowerText.includes('country') || lowerText.includes('countries')) {
      handleCountryRequest(text);
    } else if (lowerText.includes('city') || lowerText.includes('cities')) {
      handleCityRequest(text);
    } else if (lowerText.includes('friendly') || lowerText.includes('casual')) {
      handleToneChange('friendly');
    } else if (lowerText.includes('professional') || lowerText.includes('formal')) {
      handleToneChange('professional');
    } else if (lowerText.includes('shorter') || lowerText.includes('concise')) {
      handleMakeShorter();
    } else if (lowerText.includes('add') && lowerText.includes('option')) {
      handleAddOptions(text);
    } else if (lowerText.includes('convert') && lowerText.includes('dropdown')) {
      handleConvertToDropdown();
    } else {
      // Provide contextual help
      addBotMessage(`I understand you want to make changes. Here are some examples of what you can say:\n\n• "Change the message to..."\n• "My countries are USA, Canada, Mexico"\n• "I need cities for California"\n• "Add validation for email"\n• "Make it more friendly"`);
    }
  };

  const handleCountryRequest = (text: string) => {
    const countryPattern = /countries?\s+are\s+([^.]+)|only\s+(?:do|have|support)\s+([^.]+)/i;
    const match = text.match(countryPattern);
    
    if (match) {
      const countriesText = match[1] || match[2];
      const countries = countriesText.split(/,\s*|\s+and\s+/i).map(c => c.trim());
      
      // Update the node through the global update function
      if ((window as any).updateWorkflowNode) {
        (window as any).updateWorkflowNode(nodeData.node.id, {
          inputType: 'choice',
          choices: countries,
          options: countries,
          prompt: 'Select your country:'
        });
      }
      
      addBotMessage(`Great! I've updated the options to: ${countries.join(', ')}. The input is now a dropdown for country selection. What else would you like to modify?`);
    }
  };

  const handleCityRequest = (text: string) => {
    let cities = [];
    
    if (text.toLowerCase().includes('california')) {
      cities = ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Sacramento', 'Oakland', 'Fresno', 'Long Beach'];
    } else if (text.toLowerCase().includes('texas')) {
      cities = ['Houston', 'Dallas', 'Austin', 'San Antonio', 'Fort Worth', 'El Paso', 'Arlington', 'Corpus Christi'];
    } else {
      // Default major US cities
      cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego'];
    }
    
    if ((window as any).updateWorkflowNode) {
      (window as any).updateWorkflowNode(nodeData.node.id, {
        inputType: 'choice',
        choices: cities,
        options: cities,
        prompt: 'Select your city:'
      });
    }
    
    addBotMessage(`I've set up a city selection dropdown. You can say things like "I need cities for Texas" or "Add Miami to the list" to customize it further.`);
  };

  const handleToneChange = (tone: 'friendly' | 'professional') => {
    const node = nodeData.node;
    if (!node.data.prompt) return;
    
    let newPrompt = node.data.prompt;
    
    if (tone === 'friendly') {
      newPrompt = `Hey there! ${node.data.prompt.replace(/^(Hello|Hi|Greetings|Good day),?\s*/i, '')} 😊`;
    } else {
      newPrompt = node.data.prompt.replace(/Hey there!?|Hi!?|😊|🙂|!/g, '').trim();
      newPrompt = `Good day. ${newPrompt}`;
    }
    
    if ((window as any).updateWorkflowNode) {
      (window as any).updateWorkflowNode(nodeData.node.id, { prompt: newPrompt });
    }
    
    addBotMessage(`I've made the message more ${tone}. Is there anything else you'd like to adjust?`);
  };

  const handleMakeShorter = () => {
    const node = nodeData.node;
    if (!node.data.prompt) return;
    
    let shortened = node.data.prompt
      .replace(/\b(just|really|very|quite|actually|basically)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
    
    if (shortened.length > 50) {
      shortened = shortened.substring(0, shortened.lastIndexOf(' ', 50)) + '...';
    }
    
    if ((window as any).updateWorkflowNode) {
      (window as any).updateWorkflowNode(nodeData.node.id, { prompt: shortened });
    }
    
    addBotMessage("I've shortened the message. Would you like me to adjust it further?");
  };

  const handleAddOptions = (text: string) => {
    const node = nodeData.node;
    const addPattern = /add\s+["']?([^"']+)["']?\s+to\s+(?:the\s+)?(?:list|options|choices)?/i;
    const match = text.match(addPattern);
    
    if (match) {
      const newOption = match[1].trim();
      const currentChoices = node.data.choices || node.data.options || [];
      const updatedChoices = [...currentChoices, newOption];
      
      if ((window as any).updateWorkflowNode) {
        (window as any).updateWorkflowNode(nodeData.node.id, {
          choices: updatedChoices,
          options: updatedChoices
        });
      }
      
      addBotMessage(`Added "${newOption}" to the options. The list now has ${updatedChoices.length} items.`);
    }
  };

  const handleConvertToDropdown = () => {
    if ((window as any).updateWorkflowNode) {
      (window as any).updateWorkflowNode(nodeData.node.id, {
        inputType: 'choice',
        choices: ['Option 1', 'Option 2', 'Option 3'],
        options: ['Option 1', 'Option 2', 'Option 3']
      });
    }
    
    addBotMessage("I've converted this to a dropdown input with some default options. You can tell me what specific options you need, like 'My options are Small, Medium, Large'");
  };

  const handleSendMessage = (text: string) => {
    addUserMessage(text);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed right-6 z-50 transition-all"
      style={{
        bottom: 'calc(2rem + 2rem)',
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
            <Sparkles className="h-5 w-5" />
            <h3 className="text-base font-semibold text-white">
              AI Node Editor
            </h3>
            {nodeData && (
              <Badge variant="secondary" className="text-xs bg-white/20">
                {nodeData.node.data.type} node
              </Badge>
            )}
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
                <ChatMessage
                  id={message.id}
                  text={message.text}
                  sender={message.sender}
                  timestamp={message.timestamp}
                />
                {message.sender === 'agent' && message.buttons && (
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
          placeholder="Describe how you want to change this node..."
          disabled={!waitingForInput}
        />
      </Card>
    </div>
  );
}