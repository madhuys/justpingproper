'use client';

import React, { useState, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ChevronLeft,
  Save,
  X,
  Workflow,
  Home,
  Plus,
  Settings,
  ChevronRight,
  FolderOpen
} from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import agentsStrings from '@/data/strings/agents.json';
import toast from 'react-hot-toast';
import { Node, Edge } from 'reactflow';
import { WorkflowNodeData } from '@/components/organisms/workflow/EnhancedWorkflowNodeV2';
import { cn } from '@/lib/utils';

// Dynamic import to avoid SSR issues with React Flow
const EnhancedWorkflowBuilderV2 = dynamic(
  () => import('@/components/organisms/workflow/EnhancedWorkflowBuilderV2').then((mod) => mod.EnhancedWorkflowBuilderV2),
  { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center">Loading workflow builder...</div> }
);

// Popular variables for the dropdown
const popularVariables = [
  'name', 'email', 'phone', 'address', 'city', 'state', 'zipcode', 'country',
  'company', 'jobTitle', 'department', 'website', 'birthday', 'age',
  'orderNumber', 'trackingNumber', 'invoiceNumber', 'accountNumber',
  'productName', 'quantity', 'price', 'date', 'time', 'reason',
  'feedback', 'rating', 'comments', 'preferences', 'interests'
];

// Action presets
const actionPresets = [
  { id: 'sendEmail', label: 'Send Email', icon: 'Mail' },
  { id: 'sendWhatsApp', label: 'Send WhatsApp', icon: 'MessageSquare' },
  { id: 'sendSMS', label: 'Send SMS', icon: 'Phone' },
  { id: 'updateCalendar', label: 'Update Calendar', icon: 'CalendarPlus' },
  { id: 'updateCRM', label: 'Update CRM', icon: 'Database' },
  { id: 'webhook', label: 'Call Webhook', icon: 'Webhook' },
  { id: 'notify', label: 'Send Notification', icon: 'BellRing' },
];

// AI Models
const aiModels = [
  { id: 'gpt-4', label: 'GPT-4' },
  { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
  { id: 'claude-3', label: 'Claude 3' },
  { id: 'gemini-pro', label: 'Gemini Pro' },
];

export default function EditWorkflowAgentPage() {
  const router = useRouter();
  const params = useParams();
  const agentId = params.id as string;
  const { knowledgeIndexes, updateAgent, getAgent } = useAgents();
  
  // Form data
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [workflowNodes, setWorkflowNodes] = useState<Node<WorkflowNodeData>[]>([]);
  const [workflowEdges, setWorkflowEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node<WorkflowNodeData> | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [showConfig, setShowConfig] = useState(true);
  const [loading, setLoading] = useState(true);
  const [agent, setAgent] = useState<any>(null);
  const [showWorkflowList, setShowWorkflowList] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  const [savedWorkflows, setSavedWorkflows] = useState<any[]>([]);

  // Node configuration
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodePrompt, setNodePrompt] = useState('');
  const [nodeVariable, setNodeVariable] = useState('');
  const [nodeVariables, setNodeVariables] = useState<string[]>([]);
  const [nodeInputType, setNodeInputType] = useState<'text' | 'multiselect' | 'choice'>('text');
  const [nodeChoices, setNodeChoices] = useState<string[]>([]);
  const [nodeValidation, setNodeValidation] = useState('none');
  const [nodeActionType, setNodeActionType] = useState('');
  const [nodeAiModel, setNodeAiModel] = useState('gpt-4o');
  const [nodeSystemPrompt, setNodeSystemPrompt] = useState('');
  const [nodeTemperature, setNodeTemperature] = useState([0.7]);
  const [nodeMaxTokens, setNodeMaxTokens] = useState([500]);

  // Load agent data
  React.useEffect(() => {
    const loadAgent = async () => {
      const foundAgent = getAgent(agentId);
      if (foundAgent && foundAgent.type === 'workflow') {
        setAgent(foundAgent);
        setName(foundAgent.name);
        setDescription(foundAgent.description || '');
        
        // Try to load workflow from file system first
        try {
          const response = await fetch(`/api/workflows/${agentId}`);
          if (response.ok) {
            const workflow = await response.json();
            setWorkflowNodes(workflow.nodes || []);
            setWorkflowEdges(workflow.edges || []);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Failed to load workflow from file system:', error);
        }
        
        // Fallback: Convert steps back to nodes
        const startNode: Node<WorkflowNodeData> = {
          id: 'start',
          type: 'workflow',
          position: { x: 400, y: 50 },
          data: {
            label: 'Start',
            type: 'start',
            prompt: 'Conversation begins here',
            flowDirection: 'LR',
          },
        };

        const stepNodes = foundAgent.steps.map((step: any, index: number) => ({
          id: step.id,
          type: 'workflow' as const,
          position: { x: 400, y: 150 + (index * 150) },
          data: {
            label: `Step ${index + 1}`,
            type: 'input' as const,
            prompt: step.prompt,
            inputType: step.inputType as 'text' | 'multiselect' | 'choice',
            validationType: step.validation,
            systemPrompt: step.fallback,
            choices: step.choices,
            options: step.options,
            flowDirection: 'LR',
          },
        }));

        const endNode: Node<WorkflowNodeData> = {
          id: 'end',
          type: 'workflow',
          position: { x: 400, y: 150 + (foundAgent.steps.length * 150) },
          data: {
            label: 'End',
            type: 'end',
            prompt: 'Conversation ends here',
            flowDirection: 'LR',
          },
        };

        setWorkflowNodes([startNode, ...stepNodes, endNode]);
        
        // Create edges
        const edges: Edge[] = [];
        const allNodes = [startNode, ...stepNodes, endNode];
        for (let i = 0; i < allNodes.length - 1; i++) {
          edges.push({
            id: `e${allNodes[i].id}-${allNodes[i + 1].id}`,
            source: allNodes[i].id,
            target: allNodes[i + 1].id,
            animated: true,
          });
        }
        setWorkflowEdges(edges);
      }
      setLoading(false);
    };
    
    loadAgent();
  }, [agentId, getAgent]);

  // Use a ref to track if we're updating from the config panel
  const isUpdatingFromConfig = useRef(false);
  
  const updateSelectedNode = useCallback((updates: Partial<WorkflowNodeData>) => {
    if (!selectedNode) return;
    
    isUpdatingFromConfig.current = true;
    setWorkflowNodes(prev => prev.map(node => 
      node.id === selectedNode.id 
        ? { ...node, data: { ...node.data, ...updates } }
        : node
    ));
    // Reset flag after a short delay
    setTimeout(() => {
      isUpdatingFromConfig.current = false;
    }, 100);
  }, [selectedNode]);

  const handleNodeSelect = useCallback((node: Node<WorkflowNodeData>) => {
    // Save current node changes before switching
    if (selectedNode && selectedNode.id !== node.id) {
      saveNodeChanges();
    }
    
    setSelectedNode(node);
    
    // Load node data into form
    setNodeLabel(node.data.label || '');
    setNodePrompt(node.data.prompt || '');
    setNodeVariable(node.data.variable || '');
    setNodeVariables(node.data.variables || (node.data.variable ? [node.data.variable] : []));
    setNodeInputType(node.data.inputType || 'text');
    setNodeValidation(node.data.validationType || 'none');
    setNodeActionType(node.data.actionType || '');
    setNodeAiModel(node.data.aiModel || 'gpt-4o');
    setNodeSystemPrompt(node.data.systemPrompt || '');
    setNodeTemperature([node.data.temperature || 0.7]);
    setNodeMaxTokens([node.data.maxTokens || 500]);
    setNodeChoices(node.data.choices || node.data.options || []);
    
    // Check if label was customized by comparing with default labels
    const defaultLabels = ['Collect Text Input', 'Collect Choice', 'Collect Multiple Choices', 'Collect Input'];
    setHasCustomLabel(!defaultLabels.includes(node.data.label || ''));
  }, [selectedNode, saveNodeChanges]);

  const [hasCustomLabel, setHasCustomLabel] = useState(false);

  // Theme detection
  React.useEffect(() => {
    const checkTheme = () => {
      const isDark = document.documentElement.classList.contains('dark');
      setCurrentTheme(isDark ? 'dark' : 'light');
    };
    
    checkTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  const saveNodeChanges = useCallback(() => {
    if (!selectedNode) return;
    
    // Auto-update label based on input type if user hasn't customized it
    let label = nodeLabel;
    if (selectedNode.data.type === 'input' && !hasCustomLabel) {
      if (nodeInputType === 'text') {
        label = 'Collect Text Input';
      } else if (nodeInputType === 'choice') {
        label = 'Collect Choice';
      } else if (nodeInputType === 'multiselect') {
        label = 'Collect Multiple Choices';
      }
    }
    
    updateSelectedNode({
      label,
      prompt: nodePrompt,
      variable: nodeVariable,
      variables: nodeVariables.filter(v => v.trim() !== ''),
      inputType: nodeInputType,
      validationType: nodeValidation,
      actionType: nodeActionType,
      aiModel: nodeAiModel,
      systemPrompt: nodeSystemPrompt,
      temperature: nodeTemperature[0],
      maxTokens: nodeMaxTokens[0],
      choices: nodeInputType === 'choice' ? nodeChoices.filter(c => c.trim() !== '') : undefined,
      options: nodeInputType === 'choice' ? nodeChoices.filter(c => c.trim() !== '') : undefined,
    });
  }, [
    selectedNode, nodeLabel, nodePrompt, nodeVariable, nodeVariables, nodeInputType,
    nodeValidation, nodeActionType, nodeAiModel, nodeSystemPrompt,
    nodeTemperature, nodeMaxTokens, nodeChoices, updateSelectedNode, hasCustomLabel
  ]);

  // Handle save on blur or enter
  const handleInputBlur = useCallback(() => {
    if (selectedNode) {
      saveNodeChanges();
    }
  }, [selectedNode, saveNodeChanges]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedNode) {
      saveNodeChanges();
    }
  }, [selectedNode, saveNodeChanges]);

  const handleSave = async () => {
    if (!name.trim()) {
      setShowNameDialog(true);
      return;
    }

    if (workflowNodes.length <= 2) { // At least start and end
      toast.error('Workflow must have at least one step between start and end');
      return;
    }
    
    // Basic validation - ensure we have start and end nodes
    const hasStart = workflowNodes.some(n => n.data?.type === 'start');
    const hasEnd = workflowNodes.some(n => n.data?.type === 'end');
    
    if (!hasStart || !hasEnd) {
      toast.error('Workflow must have both start and end nodes');
      return;
    }

    // Save workflow to file system
    try {
      const workflow = {
        id: agentId,
        name,
        description,
        nodes: workflowNodes,
        edges: workflowEdges,
        viewport: { x: 0, y: 0, zoom: 1 },
        flowDirection: 'LR',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const response = await fetch(`/api/workflows/${agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(workflow),
      });

      if (!response.ok) {
        throw new Error('Failed to save workflow');
      }

      // Convert workflow nodes to steps for agent
      const steps = workflowNodes
        .filter(node => node.data.type !== 'start' && node.data.type !== 'end')
        .map(node => ({
          id: node.id,
          prompt: node.data.prompt || '',
          inputType: node.data.inputType || 'text',
          validation: node.data.validationType === 'none' ? undefined : node.data.validationType,
          fallback: node.data.systemPrompt,
          choices: node.data.choices,
          options: node.data.options,
        }));

      updateAgent(agentId, 'workflow', {
        name,
        description,
        steps,
      });

      toast.success('Workflow saved successfully!');
      window.location.href = '/agents';
    } catch (error) {
      toast.error('Failed to save workflow');
      console.error(error);
    }
  };


  // Load saved workflows when panel opens
  React.useEffect(() => {
    if (showWorkflowList) {
      loadSavedWorkflows();
    }
  }, [showWorkflowList]);

  const loadSavedWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows');
      if (response.ok) {
        const workflows = await response.json();
        setSavedWorkflows(workflows);
      }
    } catch (error) {
      console.error('Failed to load workflows:', error);
    }
  };

  const loadWorkflow = async (workflowId: string) => {
    try {
      const response = await fetch(`/api/workflows/${workflowId}`);
      if (response.ok) {
        const workflow = await response.json();
        setWorkflowNodes(workflow.nodes || []);
        setWorkflowEdges(workflow.edges || []);
        setName(workflow.name || '');
        setDescription(workflow.description || '');
        toast.success('Workflow loaded successfully!');
        setShowWorkflowList(false);
      }
    } catch (error) {
      toast.error('Failed to load workflow');
      console.error(error);
    }
  };

  // Auto-validation based on variable name
  React.useEffect(() => {
    if (nodeVariable) {
      const lowerVar = nodeVariable.toLowerCase();
      if (lowerVar.includes('email')) setNodeValidation('email');
      else if (lowerVar.includes('phone')) setNodeValidation('phone');
      else if (lowerVar.includes('zip') || lowerVar.includes('postal')) setNodeValidation('postcode');
      else if (lowerVar.includes('date')) setNodeValidation('date');
      else if (lowerVar.includes('url') || lowerVar.includes('website')) setNodeValidation('url');
      else if (lowerVar.includes('card') || lowerVar.includes('credit')) setNodeValidation('card');
    }
  }, [nodeVariable]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading workflow...</p>
        </div>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Agent not found</p>
          <Button onClick={() => window.location.href = '/agents'}>
            Back to Agents
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-transparent flex flex-col">
      {/* Compact Header */}
      <div className="h-14 border-b flex items-center px-4" style={{
        backgroundColor: currentTheme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}>
        <div className="flex items-center gap-4 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/agents'}
            className="h-8"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          
          <div className="h-6 w-px bg-border" />
          
          <div className="flex items-center gap-2">
            <Workflow className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{name || 'Editing Workflow'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowConfig(!showConfig);
              setShowWorkflowList(false);
            }}
            className="h-8"
          >
            <Settings className="h-4 w-4 mr-2" />
            {showConfig ? 'Hide' : 'Show'} Config
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="h-8"
          >
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setShowWorkflowList(!showWorkflowList);
              setShowConfig(false);
            }}
            className="h-8"
          >
            <FolderOpen className="h-4 w-4 mr-2" />
            Load
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden bg-transparent">
        {/* Workflow Builder */}
        <div className="flex-1" style={{
          backgroundColor: currentTheme === 'light' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)'
        }}>
          <EnhancedWorkflowBuilderV2
            onSave={(nodes, edges) => {
              setWorkflowNodes(nodes);
              setWorkflowEdges(edges);
            }}
            initialFlow={
              workflowNodes.length > 0
                ? { nodes: workflowNodes, edges: workflowEdges }
                : undefined
            }
            selectedNode={selectedNode}
            onNodeSelect={handleNodeSelect}
            workflowId={agentId}
          />
        </div>

        {/* Workflow List Panel */}
        {showWorkflowList && (
          <div className="w-96 border-l overflow-y-auto" style={{
            backgroundColor: currentTheme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)'
          }}>
            <div className="w-full border-b border-border/50">
              <div className="flex items-center justify-between px-4 py-4">
                <h3 className="text-lg font-semibold">
                  Saved Workflows
                </h3>
              </div>
            </div>
            <div className="px-6 py-6">
              {savedWorkflows.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  <p>No saved workflows found</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {savedWorkflows.map((workflow) => (
                    <Card 
                      key={workflow.id}
                      className="p-4 hover:bg-accent/80 cursor-pointer transition-all duration-200 bg-card/60 backdrop-blur-sm border border-border/50 hover:border-border/70"
                      onClick={() => loadWorkflow(workflow.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{workflow.name}</h4>
                          {workflow.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">{workflow.description}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {workflow.updatedAt ? new Date(workflow.updatedAt).toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Configuration Panel */}
        {showConfig && selectedNode && (
          <div className="w-96 border-l overflow-y-auto" style={{
            backgroundColor: currentTheme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)'
          }}>
            <div className="w-full border-b border-border/50">
              <div className="flex items-center justify-between px-4 py-4">
                <h3 className="text-lg font-semibold">
                  Configure {selectedNode.data.type}
                </h3>
              </div>
            </div>
            <div className="px-6 py-6">

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label>Node Label</Label>
                  <Input
                    value={nodeLabel}
                    onChange={(e) => {
                      setNodeLabel(e.target.value);
                      setHasCustomLabel(true);
                    }}
                    onBlur={handleInputBlur}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter node label..."
                    className="mt-2 w-full"
                  />
                </div>

                {(selectedNode.data.type === 'message' || selectedNode.data.type === 'input') && (
                  <div>
                    <Label>Message/Prompt</Label>
                    <Textarea
                      value={nodePrompt}
                      onChange={(e) => setNodePrompt(e.target.value)}
                      onBlur={handleInputBlur}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter the message or prompt..."
                      rows={3}
                      className="mt-2 w-full"
                    />
                  </div>
                )}
              </div>

              {/* Input Configuration */}
              {selectedNode.data.type === 'input' && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Input Configuration</h4>
                  
                  <div>
                    <Label>Input Type</Label>
                    <Select 
                      value={nodeInputType} 
                      onValueChange={(v) => {
                        setNodeInputType(v as any);
                        // Don't auto-save on select change
                      }}
                    >
                      <SelectTrigger className="mt-2 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Free Text</SelectItem>
                        <SelectItem value="choice">Single Choice</SelectItem>
                        <SelectItem value="multiselect">Multi Select</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {(nodeInputType === 'choice' || nodeInputType === 'multiselect') && (
                    <div>
                      <Label>Options</Label>
                      <div className="mt-2 space-y-2">
                        {nodeChoices.map((choice, i) => (
                          <div key={i} className="flex gap-2">
                            <Input
                              value={choice}
                              onChange={(e) => {
                                const newChoices = [...nodeChoices];
                                newChoices[i] = e.target.value;
                                setNodeChoices(newChoices);
                              }}
                              placeholder={`Option ${i + 1}`}
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setNodeChoices(prev => prev.filter((_, idx) => idx !== i))}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setNodeChoices(prev => [...prev, ''])}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Option
                        </Button>
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Variables to Capture</Label>
                    <div className="mt-2 space-y-2">
                      {nodeVariables.map((variable, i) => (
                        <div key={i} className="flex gap-2">
                          <Input
                            value={variable}
                            onChange={(e) => {
                              const newVariables = [...nodeVariables];
                              newVariables[i] = e.target.value;
                              setNodeVariables(newVariables);
                            }}
                            onBlur={handleInputBlur}
                            onKeyPress={handleKeyPress}
                            placeholder="Variable name"
                            className="font-mono"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setNodeVariables(prev => prev.filter((_, idx) => idx !== i))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setNodeVariables(prev => [...prev, ''])}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Variable
                      </Button>
                    </div>
                    {nodeVariables.length === 0 && (
                      <div className="mt-2">
                        <Select 
                          value="" 
                          onValueChange={(value) => {
                            setNodeVariables([value]);
                            setNodeVariable(value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Or select from common variables..." />
                          </SelectTrigger>
                          <SelectContent>
                            {popularVariables.map(variable => (
                              <SelectItem key={variable} value={variable}>
                                {variable}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  <div>
                    <Label>Validation Type</Label>
                    <Select 
                      value={nodeValidation} 
                      onValueChange={(v) => {
                        setNodeValidation(v);
                        // Don't auto-save on select change
                      }}
                    >
                      <SelectTrigger className="mt-2 w-full">
                        <SelectValue placeholder="Select validation..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="email">Email Address</SelectItem>
                        <SelectItem value="phone">Phone Number</SelectItem>
                        <SelectItem value="postcode">Post Code</SelectItem>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="card">Credit Card</SelectItem>
                        <SelectItem value="custom">Custom AI Validation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                </div>
              )}

              {/* Action Configuration */}
              {selectedNode.data.type === 'action' && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Action Configuration</h4>
                  
                  <div>
                    <Label>Action Type</Label>
                    <Select 
                      value={nodeActionType} 
                      onValueChange={(v) => {
                        setNodeActionType(v);
                        // Don't auto-save on select change
                      }}
                    >
                      <SelectTrigger className="mt-2 w-full">
                        <SelectValue placeholder="Select action..." />
                      </SelectTrigger>
                      <SelectContent>
                        {actionPresets.map(action => (
                          <SelectItem key={action.id} value={action.id}>
                            {action.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* AI Configuration */}
              {(selectedNode.data.type === 'message' || selectedNode.data.type === 'input') && (
                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">AI Configuration</h4>
                  
                  <div>
                    <Label>AI Model</Label>
                    <Select 
                      value={nodeAiModel} 
                      onValueChange={(v) => {
                        setNodeAiModel(v);
                        // Don't auto-save on select change
                      }}
                    >
                      <SelectTrigger className="mt-2 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {aiModels.map(model => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>System Prompt</Label>
                    <Textarea
                      value={nodeSystemPrompt}
                      onChange={(e) => setNodeSystemPrompt(e.target.value)}
                      placeholder="Enter system prompt for this node..."
                      rows={4}
                      className="mt-2 w-full"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Temperature</Label>
                      <span className="text-sm text-muted-foreground">{nodeTemperature[0]}</span>
                    </div>
                    <Slider
                      value={nodeTemperature}
                      onValueChange={setNodeTemperature}
                      onValueCommit={handleInputBlur}
                      min={0}
                      max={1}
                      step={0.1}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Max Tokens</Label>
                      <span className="text-sm text-muted-foreground">{nodeMaxTokens[0]}</span>
                    </div>
                    <Slider
                      value={nodeMaxTokens}
                      onValueChange={setNodeMaxTokens}
                      onValueCommit={handleInputBlur}
                      min={50}
                      max={2000}
                      step={50}
                    />
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        )}
      </div>

      {/* Name Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Name Your Workflow</DialogTitle>
            <DialogDescription>
              Please provide a name for your workflow agent before saving.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label>Workflow Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Customer Support Bot"
                className="mt-2"
              />
            </div>
            <div>
              <Label>Description (Optional)</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe what this workflow does..."
                rows={3}
                className="mt-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNameDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (name.trim()) {
                  setShowNameDialog(false);
                  handleSave();
                }
              }}>
                Save Workflow
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}