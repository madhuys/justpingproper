'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
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
  FolderOpen,
  Edit
} from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import agentsStrings from '@/data/strings/agents.json';
import toast from 'react-hot-toast';
import { Node, Edge } from 'reactflow';
import { WorkflowNodeData } from '@/components/organisms/workflow/EnhancedWorkflowNodeV2';
import { WorkflowNodeConfigurator } from '@/components/organisms/WorkflowNodeConfigurator';
import { cn } from '@/lib/utils';

// Dynamic import to avoid SSR issues with React Flow
const EnhancedWorkflowBuilderV2 = dynamic(
  () => import('@/components/organisms/workflow/EnhancedWorkflowBuilderV2').then((mod) => mod.EnhancedWorkflowBuilderV2),
  { ssr: false, loading: () => <div className="flex-1 flex items-center justify-center">Loading workflow builder...</div> }
);

// Import workflow templates
const loadSavedWorkflows = async () => {
  try {
    const workflowMap = new Map();
    
    // Dynamically import all workflow files
    const customerSupport = await import('@/data/states/workflows/customer-support.json');
    const interviewScreening = await import('@/data/states/workflows/interview-screening.json');
    const itHelpdesk = await import('@/data/states/workflows/it-helpdesk.json');
    const orderProcessing = await import('@/data/states/workflows/order-processing.json');
    const salesQualification = await import('@/data/states/workflows/sales-qualification.json');
    
    // Add to map only if not already present (ensures unique IDs)
    if (customerSupport.default && !workflowMap.has(customerSupport.default.id)) {
      workflowMap.set(customerSupport.default.id, customerSupport.default);
    }
    if (interviewScreening.default && !workflowMap.has(interviewScreening.default.id)) {
      workflowMap.set(interviewScreening.default.id, interviewScreening.default);
    }
    if (itHelpdesk.default && !workflowMap.has(itHelpdesk.default.id)) {
      workflowMap.set(itHelpdesk.default.id, itHelpdesk.default);
    }
    if (orderProcessing.default && !workflowMap.has(orderProcessing.default.id)) {
      workflowMap.set(orderProcessing.default.id, orderProcessing.default);
    }
    if (salesQualification.default && !workflowMap.has(salesQualification.default.id)) {
      workflowMap.set(salesQualification.default.id, salesQualification.default);
    }
    
    return Array.from(workflowMap.values());
  } catch (error) {
    console.error('Failed to load saved workflows:', error);
    return [];
  }
};

export default function CreateWorkflowAgentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { knowledgeIndexes, createWorkflowAgent } = useAgents();
  const { workflow: workflowStrings } = agentsStrings;
  
  // Form data
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [workflowNodes, setWorkflowNodes] = useState<Node<WorkflowNodeData>[]>([]);
  const [workflowEdges, setWorkflowEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<Node<WorkflowNodeData> | null>(null);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [showConfig, setShowConfig] = useState(true);
  const [showWorkflowList, setShowWorkflowList] = useState(false);
  const [savedWorkflows, setSavedWorkflows] = useState<any[]>([]);
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');

  // Node configuration
  const [nodeLabel, setNodeLabel] = useState('');
  const [nodePrompt, setNodePrompt] = useState('');
  const [nodeVariable, setNodeVariable] = useState('');
  const [nodeVariables, setNodeVariables] = useState<string[]>([]);
  const [nodeVariableValidations, setNodeVariableValidations] = useState<Record<number, string>>({});
  const [nodeInputType, setNodeInputType] = useState<'text' | 'multiselect' | 'choice'>('text');
  const [nodeChoices, setNodeChoices] = useState<string[]>([]);
  const [nodeValidation, setNodeValidation] = useState('none');
  const [nodeActionType, setNodeActionType] = useState('');
  const [nodeAiModel, setNodeAiModel] = useState('gpt-4o');
  const [nodeSystemPrompt, setNodeSystemPrompt] = useState('');
  const [nodeTemperature, setNodeTemperature] = useState(0.7);
  const [nodeMaxTokens, setNodeMaxTokens] = useState(500);
  const [hasCustomLabel, setHasCustomLabel] = useState(false);
  const [nodeBranchCount, setNodeBranchCount] = useState(2);
  const [nodeFiles, setNodeFiles] = useState<Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
  }>>([]);
  
  // Action node specific fields
  const [actionFields, setActionFields] = useState<Record<string, any>>({
    // MCP fields
    mcpServer: '',
    mcpTool: '',
    mcpToolParams: {},
    // API fields
    apiUrl: '',
    apiMethod: 'GET',
    apiHeaders: {},
    apiBody: '',
    apiAuthType: 'none',
    apiAuthToken: '',
    apiAuthHeader: 'Authorization',
    // Email fields
    emailType: 'user',
    emailTo: '',
    emailCc: '',
    emailBcc: '',
    emailSubject: '',
    emailBody: '',
    emailTemplate: '',
    emailFrom: 'DoNotReply@justping.ai',
    // WhatsApp/SMS fields
    whatsappProvider: 'justping',
    smsProvider: 'twilio',
    phoneNumber: '',
    messageContent: '',
    messageTemplate: '',
    // Webhook fields
    webhookUrl: '',
    webhookMethod: 'POST',
    webhookHeaders: {},
    webhookBody: '',
    webhookAuthType: 'none',
    webhookAuthToken: '',
    // Calendar fields
    calendarType: 'user',
    calendarId: '',
    calendarEvent: {
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      location: '',
      attendees: [],
    },
    // CRM fields
    crmSystem: 'salesforce',
    crmAction: 'update',
    crmRecordType: 'contact',
    crmRecordId: '',
    crmFields: {},
  });

  // Store a ref to the workflow update function
  const updateNodeInWorkflow = useRef<((node: Node<WorkflowNodeData>) => void) | null>(null);

  const handleNodeSelect = useCallback((node: Node<WorkflowNodeData>) => {
    setSelectedNode(node);
    
    // Load node data into form
    setNodeLabel(node.data.label || '');
    setNodePrompt(node.data.prompt || '');
    setNodeVariable(node.data.variable || '');
    setNodeVariables(node.data.variables || (node.data.variable ? [node.data.variable] : []));
    setNodeVariableValidations(node.data.variableValidations || {});
    setNodeInputType(node.data.inputType || 'text');
    setNodeValidation(node.data.validationType || 'none');
    setNodeActionType(node.data.actionType || '');
    setNodeAiModel(node.data.aiModel || 'gpt-4o');
    setNodeSystemPrompt(node.data.systemPrompt || '');
    setNodeTemperature(node.data.temperature || 0.7);
    setNodeMaxTokens(node.data.maxTokens || 500);
    setNodeChoices(node.data.choices || node.data.options || []);
    
    // Check if label was customized by comparing with default labels
    const defaultLabels = ['Collect Text Input', 'Collect Choice', 'Collect Multiple Choices', 'Collect Input'];
    setHasCustomLabel(!defaultLabels.includes(node.data.label || ''));
    
    // Load branch count for branch nodes
    if (node.data.type === 'branch') {
      setNodeBranchCount(node.data.branchCount || 2);
    }
    
    // Load files
    setNodeFiles(node.data.files || []);
    
    // Load action config for action nodes
    if (node.data.type === 'action') {
      setActionFields(prev => ({
        ...prev,
        ...(node.data.actionConfig || {})
      }));
    } else {
      // Reset action fields for non-action nodes
      setActionFields({
        mcpServer: '',
        mcpTool: '',
        mcpToolParams: {},
        apiUrl: '',
        apiMethod: 'GET',
        apiHeaders: {},
        apiBody: '',
        emailTo: '',
        emailSubject: '',
        emailBody: '',
        phoneNumber: '',
        messageContent: '',
        webhookUrl: '',
        webhookMethod: 'POST',
        webhookHeaders: {},
        webhookBody: ''
      });
    }
    
    // Auto-show config when node is selected
    setShowConfig(true);
    setShowWorkflowList(false);
  }, []);

  // Save workflow to local storage and temp state
  const saveWorkflowToTemp = useCallback(() => {
    const tempWorkflow = {
      name,
      description,
      nodes: workflowNodes,
      edges: workflowEdges,
      selectedNodeId: selectedNode?.id || null,
      lastSaved: new Date().toISOString()
    };
    
    // Save to localStorage only - disable API save to stop file modifications
    localStorage.setItem('tempWorkflow', JSON.stringify(tempWorkflow));
    
    // API save disabled to prevent continuous file updates
    // fetch('/api/states/tempWorkflow', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(tempWorkflow)
    // }).catch(err => console.error('Failed to save temp workflow:', err));
  }, [name, description, workflowNodes, workflowEdges, selectedNode]);

  // Load workflow from temp state
  const loadWorkflowFromTemp = useCallback(async () => {
    try {
      // Try to load from localStorage first
      const localData = localStorage.getItem('tempWorkflow');
      if (localData) {
        const tempWorkflow = JSON.parse(localData);
        if (tempWorkflow.nodes && tempWorkflow.nodes.length > 0) {
          setName(tempWorkflow.name || '');
          setDescription(tempWorkflow.description || '');
          setWorkflowNodes(tempWorkflow.nodes);
          setWorkflowEdges(tempWorkflow.edges);
          return true;
        }
      }
      
      // Try to load from API
      const response = await fetch('/api/states/tempWorkflow');
      if (response.ok) {
        const tempWorkflow = await response.json();
        if (tempWorkflow.nodes && tempWorkflow.nodes.length > 0) {
          setName(tempWorkflow.name || '');
          setDescription(tempWorkflow.description || '');
          setWorkflowNodes(tempWorkflow.nodes);
          setWorkflowEdges(tempWorkflow.edges);
          return true;
        }
      }
    } catch (error) {
      console.error('Failed to load temp workflow:', error);
    }
    return false;
  }, []);

  // Manual save only - no automatic autosave
  const manualSave = useCallback(() => {
    if (workflowNodes.length > 0) {
      saveWorkflowToTemp();
    }
  }, [workflowNodes, saveWorkflowToTemp]);

  // Theme detection
  useEffect(() => {
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

  // Set up global function for node updates from AI chat
  useEffect(() => {
    (window as any).updateWorkflowNode = (nodeId: string, updates: Partial<WorkflowNodeData>) => {
      const node = workflowNodes.find(n => n.id === nodeId);
      if (node && updateNodeInWorkflow.current) {
        const updatedNode: Node<WorkflowNodeData> = {
          ...node,
          data: {
            ...node.data,
            ...updates
          }
        };
        updateNodeInWorkflow.current(updatedNode);
        
        // Update selected node state if it's the same node
        if (selectedNode && selectedNode.id === nodeId) {
          handleNodeSelect(updatedNode);
        }
      }
    };

    return () => {
      delete (window as any).updateWorkflowNode;
    };
  }, [workflowNodes, selectedNode, handleNodeSelect]);

  // Load workflow on mount
  useEffect(() => {
    loadWorkflowFromTemp();
  }, [loadWorkflowFromTemp]);

  // Update node in real-time as user types
  const updateNodeInRealTime = useCallback(() => {
    if (!selectedNode || !updateNodeInWorkflow.current) return;
    
    // Auto-update label based on input type if user hasn't customized it
    let label = nodeLabel;
    if (selectedNode && selectedNode.data.type === 'input' && !hasCustomLabel) {
      if (nodeInputType === 'text') {
        label = 'Collect Text Input';
      } else if (nodeInputType === 'choice') {
        label = 'Collect Choice';
      } else if (nodeInputType === 'multiselect') {
        label = 'Collect Multiple Choices';
      }
    }
    
    const updatedNode: Node<WorkflowNodeData> = {
      ...selectedNode,
      data: {
        ...selectedNode.data,
        label,
        prompt: nodePrompt,
        variable: nodeVariable,
        variables: nodeVariables.filter(v => v.trim() !== ''),
        variableValidations: nodeVariableValidations,
        inputType: nodeInputType,
        validationType: nodeValidation,
        actionType: nodeActionType,
        aiModel: nodeAiModel,
        systemPrompt: nodeSystemPrompt,
        temperature: nodeTemperature,
        maxTokens: nodeMaxTokens,
        choices: nodeInputType === 'choice' ? nodeChoices.filter(c => c.trim() !== '') : undefined,
        options: nodeInputType === 'multiselect' ? nodeChoices.filter(c => c.trim() !== '') : undefined,
        branchCount: selectedNode.data.type === 'branch' ? nodeBranchCount : undefined,
        files: nodeFiles,
        actionConfig: selectedNode.data.type === 'action' ? actionFields : undefined
      }
    };
    
    updateNodeInWorkflow.current(updatedNode);
  }, [
    selectedNode, nodeLabel, nodePrompt, nodeVariable, nodeVariables, nodeVariableValidations,
    nodeInputType, nodeValidation, nodeActionType, nodeAiModel, nodeSystemPrompt,
    nodeTemperature, nodeMaxTokens, nodeChoices, hasCustomLabel, nodeBranchCount,
    nodeFiles, actionFields
  ]);

  // Load saved workflows
  useEffect(() => {
    loadSavedWorkflows().then(setSavedWorkflows);
  }, []);

  // Listen for action config updates
  useEffect(() => {
    const handleActionConfigUpdate = (event: CustomEvent) => {
      if (selectedNode && selectedNode.data.type === 'action') {
        setActionFields(event.detail);
        updateNodeInRealTime();
      }
    };

    window.addEventListener('updateActionConfig', handleActionConfigUpdate as EventListener);
    return () => {
      window.removeEventListener('updateActionConfig', handleActionConfigUpdate as EventListener);
    };
  }, [selectedNode, updateNodeInRealTime]);

  // Load configuration from URL parameters
  useEffect(() => {
    const template = searchParams.get('template');
    const persona = searchParams.get('persona');
    const tone = searchParams.get('tone');
    const knowledgeIndexes = searchParams.get('knowledgeIndexes');
    const integrations = searchParams.get('integrations');
    
    if (template) {
      // Load workflow template
      const loadTemplate = async () => {
        try {
          const templateMap: Record<string, string> = {
            'customer-support': 'customer-support',
            'interview-screening': 'interview-screening',
            'order-processing': 'order-processing',
            'lead-qualification': 'sales-qualification',
            'it-helpdesk': 'it-helpdesk'
          };
          
          const workflowFile = templateMap[template] || template;
          if (workflowFile && workflowFile !== 'build-from-scratch') {
            const workflow = await import(`@/data/states/workflows/${workflowFile}.json`);
            if (workflow.default) {
              setName(workflow.default.name || '');
              setDescription(workflow.default.description || '');
              setWorkflowNodes(workflow.default.nodes || []);
              setWorkflowEdges(workflow.default.edges || []);
              
              // Apply persona configuration
              if (persona) {
                // Store persona for later use in node configurations
                // This would be used when creating AI-powered nodes
              }
              
              toast.success(`Loaded ${workflow.default.name} template`);
            }
          }
        } catch (error) {
          console.error('Failed to load template:', error);
        }
      };
      
      loadTemplate();
    }
  }, [searchParams]);

  // No automatic save - manual save only

  // Manual node update only when user changes form fields
  const handleNodeUpdate = useCallback(() => {
    if (selectedNode) {
      updateNodeInRealTime();
    }
  }, [selectedNode, updateNodeInRealTime]);

  // Sync selected node when workflow nodes change
  useEffect(() => {
    if (selectedNode) {
      const updatedNode = workflowNodes.find(n => n.id === selectedNode.id);
      if (updatedNode && JSON.stringify(updatedNode.data) !== JSON.stringify(selectedNode.data)) {
        setSelectedNode(updatedNode);
      }
    }
  }, [workflowNodes, selectedNode?.id]);

  const handleSaveWorkflow = () => {
    if (!name.trim()) {
      setShowNameDialog(true);
      return;
    }
    
    // Convert workflow nodes to steps for the agent
    const steps = workflowNodes
      .filter(node => node.data.type !== 'start' && node.data.type !== 'end')
      .map(node => ({
        id: node.id,
        prompt: node.data.prompt || '',
        inputType: node.data.inputType === 'multiselect' ? 'choice' : (node.data.inputType || 'text') as 'text' | 'choice' | 'validation',
        validation: node.data.validationType === 'none' ? undefined : node.data.validationType,
        fallback: node.data.systemPrompt,
        choices: node.data.choices,
        options: node.data.options,
      }));
    
    const workflowData = {
      name,
      description,
      templateId: 'custom',
      steps,
      knowledgeIndexId: undefined,
      mcpServerIds: [],
      enabledTools: [],
      apiKey: undefined
    };
    
    createWorkflowAgent(workflowData);
    
    // Also save the full workflow structure to file system
    const fullWorkflow = {
      id: `wa-${Date.now()}`,
      name,
      description,
      nodes: workflowNodes,
      edges: workflowEdges,
      viewport: { x: 0, y: 0, zoom: 1 },
      flowDirection: 'LR',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    fetch('/api/workflows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullWorkflow),
    }).catch(error => console.error('Failed to save workflow file:', error));
    
    toast.success('Workflow saved successfully!');
    router.push('/agents');
  };

  const handleNameSave = (newName: string) => {
    if (newName.trim()) {
      setName(newName);
      setShowNameDialog(false);
      handleSaveWorkflow();
    }
  };

  const handleWorkflowLoad = (workflow: any) => {
    setName(workflow.name);
    setDescription(workflow.description || '');
    setWorkflowNodes(workflow.nodes || []);
    setWorkflowEdges(workflow.edges || []);
    setShowWorkflowList(false);
    toast.success(`Loaded ${workflow.name}`);
    
    // Force refresh the selected node if it exists in the loaded workflow
    if (selectedNode && workflow.nodes) {
      const loadedNode = workflow.nodes.find((n: Node<WorkflowNodeData>) => n.id === selectedNode.id);
      if (loadedNode) {
        handleNodeSelect(loadedNode);
      }
    }
  };

  const handleNodesChange = useCallback((nodes: Node<WorkflowNodeData>[]) => {
    setWorkflowNodes(nodes);
  }, []);

  const handleEdgesChange = useCallback((edges: Edge[]) => {
    setWorkflowEdges(edges);
  }, []);

  const handleUpdateNodeInWorkflow = useCallback((updatedNode: Node<WorkflowNodeData>) => {
    setWorkflowNodes(nodes => nodes.map(node => 
      node.id === updatedNode.id ? updatedNode : node
    ));
  }, []);

  return (
    <>
      <div className="h-full flex flex-col bg-background overflow-hidden">
        {/* Top Toolbar */}
        <div 
          className="h-14 border-b flex items-center px-4"
          style={{
            backgroundColor: currentTheme === 'dark' ? 'rgba(20, 20, 20, 0.8)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(12px) saturate(150%)',
            WebkitBackdropFilter: 'blur(12px) saturate(150%)',
            borderBottom: currentTheme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'
          }}
        >
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/agents')}
              className="h-8"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {workflowStrings.builder.backToAgents}
            </Button>
            
            <div className="h-6 w-px bg-border" />
            
            <div className="flex items-center gap-2 flex-1">
              <Workflow className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium truncate">{name || 'New Workflow'}</span>
              {description && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-sm text-muted-foreground truncate">{description}</span>
                </>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowNameDialog(true)}
              className="h-8 w-8"
            >
              <Edit className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowWorkflowList(!showWorkflowList);
                if (!showWorkflowList) setShowConfig(false);
              }}
            >
              <FolderOpen className="h-4 w-4 mr-1" />
              {workflowStrings.builder.savedWorkflows}
            </Button>
            
            {selectedNode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowConfig(!showConfig);
                  if (!showConfig) setShowWorkflowList(false);
                }}
              >
                <Settings className="h-4 w-4 mr-1" />
                {showConfig ? workflowStrings.builder.hideConfig : workflowStrings.builder.showConfig}
              </Button>
            )}
            
            <Button
              size="sm"
              onClick={handleSaveWorkflow}
            >
              <Save className="h-4 w-4 mr-1" />
              {workflowStrings.builder.saveWorkflow}
            </Button>
          </div>
        </div>

        {/* Workflow Builder */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <EnhancedWorkflowBuilderV2
              onSave={(nodes, edges) => {
                setWorkflowNodes(nodes);
                setWorkflowEdges(edges);
              }}
              onNodeSelect={handleNodeSelect}
              onNodeUpdate={(updateFn) => {
                updateNodeInWorkflow.current = updateFn;
              }}
              workflowId="create-workflow"
              initialNodes={workflowNodes}
              initialEdges={workflowEdges}
            />
          </div>

          {/* Right Sidebar - Saved Workflows or Node Configuration */}
          <div 
            className={cn(
              "transition-all duration-300 ease-in-out border-l h-full",
              (showConfig && selectedNode) || showWorkflowList ? "w-96" : "w-0"
            )}
            style={{
              backgroundColor: currentTheme === 'light' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              color: 'var(--foreground)',
              borderLeft: '1px solid rgba(127, 127, 127, 0.2)',
              overflow: (showConfig && selectedNode) || showWorkflowList ? 'auto' : 'hidden'
            }}
          >
            {showWorkflowList && !showConfig && (
              <div className="h-full flex flex-col">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">{workflowStrings.builder.savedWorkflows}</h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowWorkflowList(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {savedWorkflows.map((workflow) => (
                    <Card
                      key={workflow.id}
                      className="p-3 cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleWorkflowLoad(workflow)}
                    >
                      <h4 className="font-medium">{workflow.name}</h4>
                      {workflow.description && (
                        <p className="text-sm text-muted-foreground mt-1">{workflow.description}</p>
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            )}
            {showConfig && selectedNode && (
              <WorkflowNodeConfigurator
                selectedNode={selectedNode}
                nodeLabel={nodeLabel}
                nodePrompt={nodePrompt}
                nodeVariable={nodeVariable}
                nodeVariables={nodeVariables}
                nodeVariableValidations={nodeVariableValidations}
                nodeInputType={nodeInputType}
                nodeChoices={nodeChoices}
                nodeValidation={nodeValidation}
                nodeActionType={nodeActionType}
                nodeAiModel={nodeAiModel}
                nodeSystemPrompt={nodeSystemPrompt}
                nodeTemperature={nodeTemperature}
                nodeMaxTokens={nodeMaxTokens}
                hasCustomLabel={hasCustomLabel}
                nodeBranchCount={nodeBranchCount}
                onLabelChange={(value) => { setNodeLabel(value); handleNodeUpdate(); }}
                onPromptChange={(value) => { setNodePrompt(value); handleNodeUpdate(); }}
                onVariableChange={(value) => { setNodeVariable(value); handleNodeUpdate(); }}
                onVariablesChange={(value) => { setNodeVariables(value); handleNodeUpdate(); }}
                onVariableValidationsChange={(value) => { setNodeVariableValidations(value); handleNodeUpdate(); }}
                onInputTypeChange={(value) => { setNodeInputType(value); handleNodeUpdate(); }}
                onChoicesChange={(value) => { setNodeChoices(value); handleNodeUpdate(); }}
                onValidationChange={(value) => { setNodeValidation(value); handleNodeUpdate(); }}
                onActionTypeChange={(value) => { setNodeActionType(value); handleNodeUpdate(); }}
                onAiModelChange={(value) => { setNodeAiModel(value); handleNodeUpdate(); }}
                onSystemPromptChange={(value) => { setNodeSystemPrompt(value); handleNodeUpdate(); }}
                onTemperatureChange={(value) => { setNodeTemperature(value); handleNodeUpdate(); }}
                onMaxTokensChange={(value) => { setNodeMaxTokens(value); handleNodeUpdate(); }}
                onCustomLabelChange={(value) => { setHasCustomLabel(value); handleNodeUpdate(); }}
                onBranchCountChange={(value) => { setNodeBranchCount(value); handleNodeUpdate(); }}
              />
            )}
          </div>
        </div>
      </div>
      
      {/* Name Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Workflow Details</DialogTitle>
            <DialogDescription>
              Provide a name and description for your workflow.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="workflow-name">Workflow Name</Label>
              <Input
                id="workflow-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => manualSave()}
                placeholder="e.g., Customer Support Flow"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    manualSave();
                    handleNameSave(name);
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workflow-description">Description (Optional)</Label>
              <Textarea
                id="workflow-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => manualSave()}
                placeholder="Describe what this workflow does..."
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNameDialog(false)}>
                Cancel
              </Button>
              <Button onClick={() => {
                if (name.trim()) {
                  setShowNameDialog(false);
                  if (!workflowNodes.length) {
                    handleSaveWorkflow();
                  }
                }
              }}>
                {workflowNodes.length ? 'Update Details' : 'Save Workflow'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}