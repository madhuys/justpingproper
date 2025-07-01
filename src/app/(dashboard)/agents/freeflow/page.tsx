'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { 
  Bot, 
  Save, 
  FolderOpen,
  Send,
  MessageSquare,
  Code,
  Sparkles,
  Upload,
  X,
  ChevronRight,
  User,
  Play,
  CheckCircle
} from 'lucide-react';
import { ChatMessage } from '@/components/molecules/ChatMessage';
import { ChatInput } from '@/components/molecules/ChatInput';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import personas from '@/data/personas.json';
import aiModels from '@/data/aiModels.json';
import knowledgebaseState from '@/data/states/knowledgebase.json';
import freeflowStrings from '@/data/strings/freeflow.json';
import mcpServers from '@/data/mcpServers.json';
import { PersonaSelectionModal } from '@/components/organisms/modals/PersonaSelectionModal';
import { MultiSelectCombobox, MultiSelectOption } from '@/components/ui/multi-select-combobox';
import freeflowsState from '@/data/states/freeflows.json';
import agentCreationOptions from '@/data/states/agentCreationOptions.json';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ResizablePanesProps {
  leftContent: React.ReactNode;
  centerContent: React.ReactNode;
  rightContent: React.ReactNode;
}

// Resizable three-pane layout component
function ResizablePanes({ leftContent, centerContent, rightContent }: ResizablePanesProps) {
  const [leftWidth, setLeftWidth] = useState(480); // 480px default for left pane
  const [rightWidth, setRightWidth] = useState(360); // 360px default for right pane
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
      setLeftWidth(Math.max(340, Math.min(600, newWidth))); // Min 340px, Max 600px
    } else if (isResizing === 'right') {
      const rightEdgeX = containerWidth - mouseX;
      const newWidth = rightEdgeX;
      setRightWidth(Math.max(270, Math.min(480, newWidth))); // Min 270px, Max 480px
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
      <div className="h-full overflow-hidden flex-1 px-4">
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

export default function FreeFlowPlaygroundPage() {
  const { resolvedTheme } = useTheme();
  const [agentName, setAgentName] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const [showPersonaModal, setShowPersonaModal] = useState(false);
  const [enableKnowledgeSearch, setEnableKnowledgeSearch] = useState(false);
  const [selectedKnowledgeIndexes, setSelectedKnowledgeIndexes] = useState<string[]>([]);
  const [enableWebSearch, setEnableWebSearch] = useState(false);
  const [selectedWebProviders, setSelectedWebProviders] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedMcpServers, setSelectedMcpServers] = useState<string[]>([]);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [showMagicPrompter, setShowMagicPrompter] = useState(false);
  const [taskDescription, setTaskDescription] = useState('');
  const [messages, setMessages] = useState<Message[]>(() => {
    // Add sample messages
    const sampleMessages: Message[] = [
      {
        id: 'sample-1',
        role: 'user',
        content: 'Hello! Can you help me understand quantum computing?',
        timestamp: new Date(Date.now() - 5 * 60 * 1000) // 5 minutes ago
      },
      {
        id: 'sample-2',
        role: 'assistant',
        content: 'Of course! I\'d be happy to explain quantum computing. Quantum computing is a revolutionary approach to computation that leverages the principles of quantum mechanics to process information in fundamentally different ways than classical computers.\n\nUnlike classical computers that use bits (0 or 1), quantum computers use quantum bits or "qubits" which can exist in a superposition of both states simultaneously. This allows quantum computers to perform certain calculations exponentially faster than classical computers.\n\nWould you like me to explain more about specific aspects like superposition, entanglement, or quantum algorithms?',
        timestamp: new Date(Date.now() - 4 * 60 * 1000) // 4 minutes ago
      },
      {
        id: 'sample-3',
        role: 'user',
        content: 'Yes, please explain superposition!',
        timestamp: new Date(Date.now() - 3 * 60 * 1000) // 3 minutes ago
      },
      {
        id: 'sample-4',
        role: 'assistant',
        content: 'Superposition is one of the most fascinating principles in quantum mechanics! Here\'s how it works:\n\n**What is Superposition?**\nSuperposition allows a quantum particle (like a qubit) to exist in multiple states simultaneously until it\'s measured. Think of it like a coin that\'s spinning in the air - it\'s neither heads nor tails, but both at the same time.\n\n**Classical vs Quantum:**\n- Classical bit: Either 0 OR 1\n- Qubit in superposition: Both 0 AND 1 simultaneously\n\n**The Power:**\nThis means a quantum computer with n qubits can process 2^n possibilities at once! For example:\n- 10 qubits = 1,024 states\n- 50 qubits = over 1 quadrillion states\n\nWhen we measure a qubit, the superposition "collapses" and we get either 0 or 1 with certain probabilities. This is what makes quantum computing so powerful for specific problems!',
        timestamp: new Date(Date.now() - 2 * 60 * 1000) // 2 minutes ago
      }
    ];
    return sampleMessages;
  });
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [jsonView, setJsonView] = useState({ request: {}, response: {} });

  // Parse URL parameters on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('name')) setAgentName(params.get('name') || '');
    if (params.get('mandate')) setTaskDescription(params.get('mandate') || '');
    if (params.get('aiModel')) {
      const modelId = params.get('aiModel');
      const model = aiModels.models.find(m => m.id === modelId);
      if (model) {
        setSelectedProvider(model.provider);
        setSelectedModel(model.id);
      }
    }
    if (params.get('persona')) {
      const personaId = params.get('persona');
      const persona = personas.personas.find(p => p.id === personaId);
      if (persona) setSelectedPersona(persona);
    } else {
      // Set default persona if none selected
      const defaultPersona = personas.personas.find(p => p.id === 'alex-chen');
      if (defaultPersona) setSelectedPersona(defaultPersona);
    }
    if (params.get('tools')) {
      setSelectedTools(params.get('tools')?.split(',').filter(Boolean) || []);
    }
    if (params.get('knowledgeIndexes')) {
      const indexes = params.get('knowledgeIndexes')?.split(',').filter(Boolean) || [];
      setSelectedKnowledgeIndexes(indexes);
      setEnableKnowledgeSearch(indexes.length > 0);
    }
    if (params.get('integrations')) {
      setSelectedMcpServers(params.get('integrations')?.split(',').filter(Boolean) || []);
    }
    
    // Generate initial system prompt if we have persona and mandate
    if (params.get('mandate') && params.get('persona')) {
      const personaId = params.get('persona');
      const persona = personas.personas.find(p => p.id === personaId);
      if (persona) {
        const generatedPrompt = `You are ${persona.name}, ${persona.role}.

${persona.selfIntroduction || ''}

Your task is to: ${params.get('mandate')}

Key traits: ${persona.traits?.join(', ') || 'helpful, professional'}
Tone: ${persona.tone || 'professional'}

Always maintain this persona and help users with their requests while staying in character.`;
        setSystemPrompt(generatedPrompt);
      }
    }
  }, []);
  
  // AI Parameters
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(1);
  const [maxTokens, setMaxTokens] = useState(500);
  const [frequencyPenalty, setFrequencyPenalty] = useState(0);
  const [presencePenalty, setPresencePenalty] = useState(0);
  const [stopSequences, setStopSequences] = useState('');
  const [customHeaders, setCustomHeaders] = useState('{}');
  const [showSavedAgentsPanel, setShowSavedAgentsPanel] = useState(false);

  // Get available models for selected provider
  const availableModels = selectedProvider 
    ? aiModels.models.filter(m => m.provider === selectedProvider)
    : [];

  // Check if selected model supports multimodal
  const selectedModelInfo = aiModels.models.find(m => m.id === selectedModel);
  const isMultimodal = selectedModelInfo?.description?.toLowerCase().includes('multimodal') || false;

  // Use shared web search providers
  const webSearchProviders = agentCreationOptions.webSearchProviders;

  // Convert web providers to MultiSelectOption format
  const webProviderOptions: MultiSelectOption[] = webSearchProviders.map(provider => ({
    value: provider.id,
    label: provider.label
  }));

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputMessage('');
    setIsLoading(true);

    // Mock response
    setTimeout(() => {
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `This is a mock response to: "${inputMessage}". The agent is configured with ${selectedPersona?.name || 'default'} persona.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, response]);
      setIsLoading(false);

      // Update JSON view
      setJsonView({
        request: {
          model: selectedModel,
          messages: [...messages, newMessage],
          temperature,
          top_p: topP,
          max_tokens: maxTokens,
          frequency_penalty: frequencyPenalty,
          presence_penalty: presencePenalty
        },
        response: {
          id: response.id,
          object: 'chat.completion',
          created: Date.now(),
          model: selectedModel,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: response.content
            },
            finish_reason: 'stop'
          }]
        }
      });
    }, 1000);
  };

  const handleMagicPrompter = () => {
    if (!taskDescription.trim()) {
      toast.error('Please describe your task first');
      return;
    }

    const generatedPrompt = `You are ${selectedPersona?.name || 'an AI assistant'}, ${selectedPersona?.role || ''}.

${selectedPersona?.selfIntroduction || ''}

Your task is to: ${taskDescription}

Key traits: ${selectedPersona?.traits?.join(', ') || 'helpful, professional'}
Tone: ${selectedPersona?.tone || 'professional'}

Always maintain this persona and help users with their requests while staying in character.`;

    setSystemPrompt(generatedPrompt);
    setShowMagicPrompter(false);
    toast.success('System prompt generated!');
  };

  const handlePublish = () => {
    // Show publish modal
    toast.success('Publishing feature coming soon!');
  };

  const handleSave = () => {
    if (!agentName.trim()) {
      toast.error('Please enter an agent name');
      return;
    }

    const config = {
      id: Date.now().toString(),
      name: agentName,
      provider: selectedProvider,
      model: selectedModel,
      persona: selectedPersona,
      tools: selectedTools,
      mcpServers: selectedMcpServers,
      knowledgeSearch: {
        enabled: enableKnowledgeSearch,
        indexes: selectedKnowledgeIndexes
      },
      webSearch: {
        enabled: enableWebSearch,
        providers: selectedWebProviders
      },
      systemPrompt,
      parameters: {
        temperature,
        topP,
        maxTokens,
        frequencyPenalty,
        presencePenalty,
        stopSequences: stopSequences.split('\n').filter(s => s.trim()),
        customHeaders: JSON.parse(customHeaders || '{}')
      },
      messages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save to localStorage
    localStorage.setItem('freeflow-agent-config', JSON.stringify(config));
    
    // Save to freeflows.json (in a real app, this would be an API call)
    const existingAgents = freeflowsState.savedAgents || [];
    const updatedAgents = [...existingAgents, config];
    
    // Update the state file
    // In production, this would be an API call to update the JSON file
    localStorage.setItem('freeflow-agents', JSON.stringify({ savedAgents: updatedAgents }));
    
    toast.success('Agent configuration saved!');
  };

  const handleLoad = () => {
    setShowSavedAgentsPanel(true);
  };

  const loadAgentConfig = (agent: any) => {
    setAgentName(agent.name || '');
    setSelectedProvider(agent.provider || '');
    setSelectedModel(agent.model || '');
    setSelectedPersona(agent.persona || null);
    setSelectedTools(agent.tools || []);
    setSelectedMcpServers(agent.mcpServers || []);
    setEnableKnowledgeSearch(agent.knowledgeSearch?.enabled || false);
    setSelectedKnowledgeIndexes(agent.knowledgeSearch?.indexes || []);
    setEnableWebSearch(agent.webSearch?.enabled || false);
    setSelectedWebProviders(agent.webSearch?.providers || []);
    setSystemPrompt(agent.systemPrompt || '');
    setTemperature(agent.parameters?.temperature || 0.7);
    setTopP(agent.parameters?.topP || 1);
    setMaxTokens(agent.parameters?.maxTokens || 500);
    setFrequencyPenalty(agent.parameters?.frequencyPenalty || 0);
    setPresencePenalty(agent.parameters?.presencePenalty || 0);
    setStopSequences(agent.parameters?.stopSequences?.join('\n') || '');
    setCustomHeaders(JSON.stringify(agent.parameters?.customHeaders || {}));
    setMessages(agent.messages || []);
    toast.success(`Loaded agent: ${agent.name}`);
    setShowSavedAgentsPanel(false);
  };

  // Use shared tools from agentCreationOptions
  const availableTools = agentCreationOptions.tools;

  // Convert tools to MultiSelectOption format
  const toolOptions: MultiSelectOption[] = availableTools.map(tool => ({
    value: tool.id,
    label: tool.name,
    description: tool.description
  }));

  // MCP servers as options
  const mcpOptions: MultiSelectOption[] = mcpServers.servers.map(server => ({
    value: server.id,
    label: server.name,
    description: server.description
  }));

  // Knowledge indexes as options
  const knowledgeIndexOptions: MultiSelectOption[] = knowledgebaseState.indexes.knowledge.map((index: any) => ({
    value: index.id || '',
    label: index.name || '',
    description: `${index.documents || 0} documents`
  }));

  // Left pane content
  const leftPaneContent = (
    <Card className="h-full rounded-none border-0 border-r overflow-y-auto py-2">
      <div className="px-4 py-2 space-y-4">
        <h3 className="text-lg font-semibold">{freeflowStrings.leftPane.title}</h3>
        
        {/* Agent Name */}
        <div className="space-y-2">
          <Label>Agent Name</Label>
          <Input 
            value={agentName}
            onChange={(e) => setAgentName(e.target.value)}
            placeholder="Enter agent name..."
          />
        </div>

        {/* Provider Selection */}
        <div className="space-y-2">
          <Label>{freeflowStrings.leftPane.provider.label}</Label>
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger>
              <SelectValue placeholder={freeflowStrings.leftPane.provider.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {[...new Set(aiModels.models.map(m => m.provider))].map(provider => (
                <SelectItem key={provider} value={provider}>
                  {provider}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Model Selection */}
        <div className="space-y-2">
          <Label>{freeflowStrings.leftPane.model.label}</Label>
          <Select 
            value={selectedModel} 
            onValueChange={setSelectedModel}
            disabled={!selectedProvider}
          >
            <SelectTrigger>
              <SelectValue placeholder={freeflowStrings.leftPane.model.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {availableModels.map(model => (
                <SelectItem key={model.id} value={model.id}>
                  <div className="flex items-center gap-2">
                    <span>{model.name}</span>
                    {model.description?.toLowerCase().includes('multimodal') && (
                      <Badge variant="secondary" className="text-xs">Multimodal</Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Persona Selection */}
        <div className="space-y-2">
          <Label>{freeflowStrings.leftPane.persona.label}</Label>
          <Button 
            variant="outline" 
            className="w-full justify-start"
            onClick={() => setShowPersonaModal(true)}
          >
            {selectedPersona ? (
              <div className="flex items-center gap-3">
                <div className="relative w-8 h-8 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full overflow-hidden p-1">
                  {selectedPersona.video ? (
                    <video
                      src={selectedPersona.video}
                      className="w-full h-full object-cover rounded-full"
                      muted
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary/50" />
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <p className="font-medium text-sm">{selectedPersona.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedPersona.role}</p>
                </div>
              </div>
            ) : (
              <>
                <User className="h-4 w-4 mr-2" />
                Choose Persona
              </>
            )}
          </Button>
        </div>

        <Separator />

        {/* Tools Selection */}
        <div className="space-y-2">
          <Label>Available Tools</Label>
          <MultiSelectCombobox
            options={toolOptions}
            selected={selectedTools}
            onSelect={setSelectedTools}
            placeholder="Select tools..."
            searchPlaceholder="Search tools..."
            emptyText="No tools found"
          />
        </div>

        {/* MCP Servers */}
        <div className="space-y-2">
          <Label>MCP Servers</Label>
          <MultiSelectCombobox
            options={mcpOptions}
            selected={selectedMcpServers}
            onSelect={setSelectedMcpServers}
            placeholder="Select MCP servers..."
            searchPlaceholder="Search MCP servers..."
            emptyText="No MCP servers found"
          />
        </div>

        {/* Knowledge Search */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{freeflowStrings.leftPane.knowledgeSearch.label}</Label>
            <Checkbox
              checked={enableKnowledgeSearch}
              onCheckedChange={(checked) => setEnableKnowledgeSearch(checked === true)}
            />
          </div>
          {enableKnowledgeSearch && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {freeflowStrings.leftPane.knowledgeSearch.description}
              </p>
              <MultiSelectCombobox
                options={knowledgeIndexOptions}
                selected={selectedKnowledgeIndexes}
                onSelect={setSelectedKnowledgeIndexes}
                placeholder="Select knowledge indexes..."
                searchPlaceholder="Search knowledge indexes..."
                emptyText="No knowledge indexes found"
              />
            </div>
          )}
        </div>

        {/* Web Search */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{freeflowStrings.leftPane.webSearch.label}</Label>
            <Checkbox
              checked={enableWebSearch}
              onCheckedChange={(checked) => setEnableWebSearch(checked === true)}
            />
          </div>
          {enableWebSearch && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {freeflowStrings.leftPane.webSearch.description}
              </p>
              <MultiSelectCombobox
                options={webProviderOptions}
                selected={selectedWebProviders}
                onSelect={setSelectedWebProviders}
                placeholder="Select web search providers..."
                searchPlaceholder="Search providers..."
                emptyText="No providers found"
              />
            </div>
          )}
        </div>

        <Separator />

        {/* System Prompt */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{freeflowStrings.leftPane.systemPrompt.label}</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowMagicPrompter(true)}
            >
              <Sparkles className="h-4 w-4 mr-1" />
              {freeflowStrings.leftPane.systemPrompt.magicPrompter.button}
            </Button>
          </div>
          <Textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder={freeflowStrings.leftPane.systemPrompt.placeholder}
            rows={6}
          />
        </div>

        {/* Multimodal Input (if supported) */}
        {isMultimodal && (
          <div className="space-y-2">
            <Label>{freeflowStrings.leftPane.multimodal.label}</Label>
            <p className="text-xs text-muted-foreground">
              {freeflowStrings.leftPane.multimodal.description}
            </p>
            <Button variant="outline" className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              {freeflowStrings.leftPane.multimodal.uploadButton}
            </Button>
          </div>
        )}
      </div>

      {/* Magic Prompter Dialog */}
      {showMagicPrompter && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 p-6">
            <h3 className="text-lg font-semibold mb-4">
              {freeflowStrings.leftPane.systemPrompt.magicPrompter.button}
            </h3>
            <div className="space-y-4">
              <div>
                <Label>{freeflowStrings.leftPane.systemPrompt.magicPrompter.label}</Label>
                <Textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder={freeflowStrings.leftPane.systemPrompt.magicPrompter.placeholder}
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowMagicPrompter(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleMagicPrompter}>
                  <Sparkles className="h-4 w-4 mr-1" />
                  {freeflowStrings.leftPane.systemPrompt.magicPrompter.generate}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </Card>
  );

  // Center pane content
  const centerPaneContent = (
    <Card className="h-full rounded-none border-0 border-r flex flex-col py-0">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="border-b px-4 py-2 flex items-center justify-between">
          <div className="flex items-center justify-between w-full">
            <TabsList>
              <TabsTrigger value="chat">
                <MessageSquare className="h-4 w-4 mr-1" />
                {freeflowStrings.centerPane.tabs.chat}
              </TabsTrigger>
              <TabsTrigger value="json">
                <Code className="h-4 w-4 mr-1" />
                {freeflowStrings.centerPane.tabs.json}
              </TabsTrigger>
            </TabsList>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSave}>
                <Save className="h-4 w-4 mr-1" />
                {freeflowStrings.centerPane.controls.save}
              </Button>
              <Button variant="outline" size="sm" onClick={handleLoad}>
                <FolderOpen className="h-4 w-4 mr-1" />
                {freeflowStrings.centerPane.controls.load}
              </Button>
              {activeTab === 'chat' && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setMessages([])}
                >
                  {freeflowStrings.centerPane.controls.clear}
                </Button>
              )}
            </div>
          </div>
        </div>

      <TabsContent value="chat" className="flex-1 p-0 m-0">
        <div className="h-full flex flex-col">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-2">
              {messages.map(message => (
                <ChatMessage
                  key={message.id}
                  id={message.id}
                  text={message.content}
                  sender={message.role === 'user' ? 'user' : 'agent'}
                  timestamp={message.timestamp}
                  avatar={message.role === 'assistant' && selectedPersona ? selectedPersona.image : undefined}
                />
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 p-0.5">
                    <Avatar className={cn(
                      "h-7 w-7 ring-1",
                      resolvedTheme === 'dark'
                        ? "ring-primary/40"
                        : "ring-[#1e4394]"
                    )}>
                      {selectedPersona?.image && <AvatarImage src={selectedPersona.image} alt={selectedPersona.name} />}
                      <AvatarFallback className="bg-muted">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                      </AvatarFallback>
                    </Avatar>
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
          <ChatInput
            onSendMessage={(message) => {
              setInputMessage(message);
              handleSendMessage();
            }}
            placeholder={freeflowStrings.centerPane.chat.placeholder}
            disabled={isLoading}
          />
        </div>
      </TabsContent>

      <TabsContent value="json" className="flex-1 p-0 m-0">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-2">
                {freeflowStrings.centerPane.json.request}
              </h3>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(jsonView.request, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-2">
                {freeflowStrings.centerPane.json.response}
              </h3>
              <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto">
                {JSON.stringify(jsonView.response, null, 2)}
              </pre>
            </div>
          </div>
        </ScrollArea>
      </TabsContent>
      </Tabs>
    </Card>
  );

  // Right pane content
  const rightPaneContent = (
    <Card className="h-full rounded-none border-0 overflow-y-auto py-2">
      <div className="px-4 py-2 space-y-4">
        <h3 className="text-lg font-semibold">{freeflowStrings.rightPane.title}</h3>

        {/* Temperature */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{freeflowStrings.rightPane.temperature.label}</Label>
            <span className="text-sm text-muted-foreground">{temperature}</span>
          </div>
          <Slider
            value={[temperature]}
            onValueChange={([value]) => setTemperature(value)}
            min={0}
            max={1}
            step={0.1}
          />
          <p className="text-xs text-muted-foreground">
            {freeflowStrings.rightPane.temperature.description}
          </p>
        </div>

        {/* Top-p */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{freeflowStrings.rightPane.topP.label}</Label>
            <span className="text-sm text-muted-foreground">{topP}</span>
          </div>
          <Slider
            value={[topP]}
            onValueChange={([value]) => setTopP(value)}
            min={0}
            max={1}
            step={0.1}
          />
          <p className="text-xs text-muted-foreground">
            {freeflowStrings.rightPane.topP.description}
          </p>
        </div>

        {/* Max Tokens */}
        <div className="space-y-2">
          <Label>{freeflowStrings.rightPane.maxTokens.label}</Label>
          <Input
            type="number"
            value={maxTokens}
            onChange={(e) => setMaxTokens(parseInt(e.target.value) || 0)}
            min={1}
            max={4000}
          />
          <p className="text-xs text-muted-foreground">
            {freeflowStrings.rightPane.maxTokens.description}
          </p>
        </div>

        {/* Frequency Penalty */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{freeflowStrings.rightPane.frequencyPenalty.label}</Label>
            <span className="text-sm text-muted-foreground">{frequencyPenalty}</span>
          </div>
          <Slider
            value={[frequencyPenalty]}
            onValueChange={([value]) => setFrequencyPenalty(value)}
            min={-2}
            max={2}
            step={0.1}
          />
          <p className="text-xs text-muted-foreground">
            {freeflowStrings.rightPane.frequencyPenalty.description}
          </p>
        </div>

        {/* Presence Penalty */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{freeflowStrings.rightPane.presencePenalty.label}</Label>
            <span className="text-sm text-muted-foreground">{presencePenalty}</span>
          </div>
          <Slider
            value={[presencePenalty]}
            onValueChange={([value]) => setPresencePenalty(value)}
            min={-2}
            max={2}
            step={0.1}
          />
          <p className="text-xs text-muted-foreground">
            {freeflowStrings.rightPane.presencePenalty.description}
          </p>
        </div>

        {/* Stop Sequences */}
        <div className="space-y-2">
          <Label>{freeflowStrings.rightPane.stopSequences.label}</Label>
          <Textarea
            value={stopSequences}
            onChange={(e) => setStopSequences(e.target.value)}
            placeholder={freeflowStrings.rightPane.stopSequences.placeholder}
            rows={3}
          />
        </div>

        {/* Custom Headers */}
        <div className="space-y-2">
          <Label>{freeflowStrings.rightPane.customHeaders.label}</Label>
          <Textarea
            value={customHeaders}
            onChange={(e) => setCustomHeaders(e.target.value)}
            placeholder={freeflowStrings.rightPane.customHeaders.placeholder}
            rows={3}
            className="font-mono text-xs"
          />
        </div>

        <Separator />

        {/* Publish Button */}
        <Button 
          className="w-full"
          onClick={handlePublish}
          disabled={!selectedModel || !selectedPersona || !systemPrompt}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          {freeflowStrings.publish.button}
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="h-full flex flex-col relative">
      <div className="px-6 py-2 bg-background/50 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3">
          <Bot className={cn("h-5 w-5", resolvedTheme === 'dark' ? "text-white" : "text-primary")} />
          <h1 className="text-2xl font-bold tracking-tight">{freeflowStrings.title}</h1>
        </div>
      </div>
      
      <div className="flex-1 overflow-hidden">
        <ResizablePanes
          leftContent={leftPaneContent}
          centerContent={centerPaneContent}
          rightContent={rightPaneContent}
        />
      </div>

      {/* Persona Selection Modal */}
      <PersonaSelectionModal
        isOpen={showPersonaModal}
        onClose={() => setShowPersonaModal(false)}
        onSelectPersona={(persona) => {
          setSelectedPersona(persona);
          setShowPersonaModal(false);
          
          // Auto-fill system prompt with persona introduction
          if (persona.selfIntroduction) {
            setSystemPrompt(prev => {
              if (!prev) return persona.selfIntroduction;
              return prev + '\n\n' + persona.selfIntroduction;
            });
          }
        }}
        currentPersonaId={selectedPersona?.id}
      />
      
      {/* Saved Agents Panel - Slides in from right */}
      {showSavedAgentsPanel && (
        <div className="absolute inset-0 z-50 flex justify-end overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setShowSavedAgentsPanel(false)}
          />
          
          {/* Panel */}
          <Card className="relative w-96 h-full rounded-none border-l shadow-2xl animate-in slide-in-from-right duration-300 py-0">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Saved Agents</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowSavedAgentsPanel(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <ScrollArea className="h-[calc(100%-73px)]">
              <div className="p-4 space-y-3">
                {(freeflowsState.savedAgents || []).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>No saved agents yet</p>
                    <p className="text-sm mt-1">Save your first agent to see it here</p>
                  </div>
                ) : (
                  (freeflowsState.savedAgents || []).map((agent: any) => (
                    <Card 
                      key={agent.id} 
                      className="p-4 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => loadAgentConfig(agent)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{agent.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {agent.persona ? personas.personas.find(p => p.id === agent.persona)?.name : 'No persona'}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {agent.model}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {new Date(agent.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <CheckCircle className="h-4 w-4 text-primary mt-1" />
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>
      )}
    </div>
  );
}