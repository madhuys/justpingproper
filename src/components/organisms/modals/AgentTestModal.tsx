import React, { useState, useRef, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Loader } from '@/components/atoms/Loader';
import {
  Send,
  Bot,
  User,
  X
} from 'lucide-react';
import { Agent, WorkflowAgent, FreeFlowAgent } from '@/hooks/useAgents';
import agentsStrings from '@/data/strings/agents.json';
import taskTemplates from '@/data/taskTemplates.json';
import aiModels from '@/data/aiModels.json';

interface AgentTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent;
}

interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
}

export function AgentTestModal({ isOpen, onClose, agent }: AgentTestModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize conversation
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      if (agent.type === 'workflow') {
        // Start with first step of workflow
        const workflowAgent = agent as WorkflowAgent;
        if (workflowAgent.steps.length > 0) {
          const firstStep = workflowAgent.steps[0];
          addAgentMessage(firstStep.prompt);
        }
      } else {
        // Start with greeting for free-flow
        const freeflowAgent = agent as FreeFlowAgent;
        const greeting = `Hello! I'm ${freeflowAgent.name}. ${
          freeflowAgent.conversationScope || 'How can I help you today?'
        }`;
        addAgentMessage(greeting);
      }
    }
  }, [isOpen, agent, messages.length]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const addAgentMessage = (content: string) => {
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'agent',
      content,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleSend = async () => {
    if (!inputValue.trim() || isThinking) return;

    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsThinking(true);

    // Simulate thinking
    setTimeout(() => {
      if (agent.type === 'workflow') {
        handleWorkflowResponse(userMessage.content);
      } else {
        handleFreeFlowResponse(userMessage.content);
      }
      setIsThinking(false);
    }, 1500);
  };

  const handleWorkflowResponse = (userInput: string) => {
    const workflowAgent = agent as WorkflowAgent;
    const currentStep = workflowAgent.steps[currentStepIndex];

    // Validate input if needed
    if (currentStep.validation && currentStep.validation !== 'none') {
      const isValid = validateInput(userInput, currentStep.validation);
      if (!isValid && currentStep.fallback) {
        addAgentMessage(currentStep.fallback);
        return;
      }
    }

    // Move to next step
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < workflowAgent.steps.length) {
      setCurrentStepIndex(nextIndex);
      addAgentMessage(workflowAgent.steps[nextIndex].prompt);
    } else {
      // Workflow complete
      const template = taskTemplates.find(t => t.id === workflowAgent.templateId);
      addAgentMessage(
        `Thank you! I've collected all the information needed for the ${template?.name || 'workflow'}. ` +
        `Your request has been processed successfully.`
      );
      setCurrentStepIndex(0); // Reset for next conversation
    }
  };

  const handleFreeFlowResponse = (userInput: string) => {
    const freeflowAgent = agent as FreeFlowAgent;
    const model = aiModels.find(m => m.id === freeflowAgent.aiModelId);
    
    // Generate mock response based on agent configuration
    const responses = [
      `Based on my ${freeflowAgent.tone} personality and knowledge, I understand you're asking about "${userInput}".`,
      `As a ${freeflowAgent.tone} assistant specialized in ${freeflowAgent.conversationScope}, here's my response...`,
      `Using ${model?.name || 'AI'}, I can help you with that. ${freeflowAgent.background}`,
      `That's an interesting question! Let me provide you with a ${freeflowAgent.tone} response.`
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    addAgentMessage(randomResponse);

    // If agent has tools, mention them
    if (freeflowAgent.allowedTools.length > 0) {
      setTimeout(() => {
        addAgentMessage(
          `I have access to these tools to help you better: ${freeflowAgent.allowedTools.join(', ')}`
        );
      }, 1000);
    }
  };

  const validateInput = (input: string, validationType: string): boolean => {
    switch (validationType) {
      case 'name':
        return /^[a-zA-Z\s]{2,}$/.test(input);
      case 'email':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
      case 'phone':
        return /^\+?[\d\s-()]+$/.test(input);
      case 'address':
        return input.length > 5;
      default:
        return true;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClose = () => {
    setMessages([]);
    setCurrentStepIndex(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl h-[600px] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {agentsStrings.testConsole.title.replace('{{name}}', agent.name)}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4">
            <div className="space-y-4 py-4">
              {messages.map(message => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.role === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {message.role === 'agent' && (
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                    </div>
                  )}
                  
                  <Card className={`max-w-md p-3 ${
                    message.role === 'user' ? 'bg-primary text-primary-foreground' : ''
                  }`}>
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.role === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    }`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </Card>

                  {message.role === 'user' && (
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isThinking && (
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary" />
                    </div>
                  </div>
                  <Card className="p-3">
                    <div className="flex items-center space-x-2">
                      <Loader className="h-4 w-4" />
                      <span className="text-sm text-muted-foreground">
                        {agentsStrings.testConsole.thinking}
                      </span>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex space-x-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={agentsStrings.testConsole.placeholder}
                disabled={isThinking}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isThinking}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex justify-between">
              <div className="text-xs text-muted-foreground">
                {agent.type === 'workflow' && (
                  <span>
                    Step {currentStepIndex + 1} of {(agent as WorkflowAgent).steps.length}
                  </span>
                )}
                {agent.type === 'freeflow' && (
                  <span>
                    Model: {aiModels.find(m => m.id === (agent as FreeFlowAgent).aiModelId)?.name}
                  </span>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClose}
              >
                {agentsStrings.actions.endTest}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}