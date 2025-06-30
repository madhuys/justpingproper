import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import agentsState from '@/data/states/agents.json';
import agentsStrings from '@/data/strings/agents.json';
import taskTemplates from '@/data/taskTemplates.json';
import mcpServers from '@/data/mcpServers.json';
import aiModels from '@/data/aiModels.json';
import { useKnowledgebase } from './useKnowledgebase';

export interface WorkflowStep {
  id: string;
  prompt: string;
  inputType: 'text' | 'choice' | 'validation';
  validation?: string;
  fallback?: string;
}

export interface WorkflowAgent {
  id: string;
  type: 'workflow';
  name: string;
  description?: string;
  templateId: string;
  steps: WorkflowStep[];
  knowledgeIndexId?: string;
  mcpServerIds: string[];
  enabledTools: string[];
  apiKey?: string;
  status: 'ready' | 'building' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface FreeFlowAgent {
  id: string;
  type: 'freeflow';
  name: string;
  tone: string;
  background: string;
  avatar?: string;
  conversationScope: string;
  knowledgeIndexId?: string;
  allowedTools: string[];
  aiModelId: string;
  mcpServerIds: string[];
  status: 'ready' | 'building' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export type Agent = WorkflowAgent | FreeFlowAgent;

export interface BuildStatus {
  isBuilding: boolean;
  agentId: string | null;
  agentType: 'workflow' | 'freeflow' | null;
  progress: number;
  message: string;
}

export function useAgents() {
  const [workflowAgents, setWorkflowAgents] = useState<WorkflowAgent[]>(agentsState.agents.workflow);
  const [freeflowAgents, setFreeflowAgents] = useState<FreeFlowAgent[]>(agentsState.agents.freeflow);
  const [activeTab, setActiveTab] = useState<'workflow' | 'freeflow'>(agentsState.activeTab);
  const [wizardOpen, setWizardOpen] = useState(agentsState.wizardOpen);
  const [wizardType, setWizardType] = useState<'workflow' | 'freeflow' | null>(agentsState.wizardType);
  const [testModalOpen, setTestModalOpen] = useState(agentsState.testModalOpen);
  const [testAgentId, setTestAgentId] = useState<string | null>(agentsState.testAgentId);
  const [buildStatus, setBuildStatus] = useState<BuildStatus>(agentsState.buildStatus);
  
  const { knowledgeIndexes } = useKnowledgebase();

  // Load saved agents from localStorage
  useEffect(() => {
    const savedAgents = localStorage.getItem('agents');
    if (savedAgents) {
      const parsed = JSON.parse(savedAgents);
      setWorkflowAgents(parsed.workflow || []);
      setFreeflowAgents(parsed.freeflow || []);
    }
  }, []);

  // Save agents to localStorage
  useEffect(() => {
    localStorage.setItem('agents', JSON.stringify({
      workflow: workflowAgents,
      freeflow: freeflowAgents
    }));
  }, [workflowAgents, freeflowAgents]);

  // Create workflow agent
  const createWorkflowAgent = useCallback(async (data: {
    name: string;
    description?: string;
    templateId: string;
    steps: WorkflowStep[];
    knowledgeIndexId?: string;
    mcpServerIds: string[];
    enabledTools: string[];
    apiKey?: string;
  }) => {
    const newAgent: WorkflowAgent = {
      id: `wa-${Date.now()}`,
      type: 'workflow',
      name: data.name,
      description: data.description,
      templateId: data.templateId,
      steps: data.steps,
      knowledgeIndexId: data.knowledgeIndexId,
      mcpServerIds: data.mcpServerIds,
      enabledTools: data.enabledTools,
      apiKey: data.apiKey,
      status: 'building',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setWorkflowAgents(prev => [...prev, newAgent]);
    setBuildStatus({
      isBuilding: true,
      agentId: newAgent.id,
      agentType: 'workflow',
      progress: 0,
      message: agentsStrings.status.buildingMessage.replace('{{name}}', newAgent.name)
    });

    toast(agentsStrings.notifications.createStarted.replace('{{type}}', 'Workflow'));

    // Simulate build process
    simulateBuildProcess(newAgent.id, 'workflow', newAgent.name);
  }, []);

  // Create free-flow agent
  const createFreeFlowAgent = useCallback(async (data: {
    name: string;
    tone: string;
    background: string;
    avatar?: string;
    conversationScope: string;
    knowledgeIndexId?: string;
    allowedTools: string[];
    aiModelId: string;
    mcpServerIds: string[];
  }) => {
    const newAgent: FreeFlowAgent = {
      id: `fa-${Date.now()}`,
      type: 'freeflow',
      name: data.name,
      tone: data.tone,
      background: data.background,
      avatar: data.avatar,
      conversationScope: data.conversationScope,
      knowledgeIndexId: data.knowledgeIndexId,
      allowedTools: data.allowedTools,
      aiModelId: data.aiModelId,
      mcpServerIds: data.mcpServerIds,
      status: 'building',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setFreeflowAgents(prev => [...prev, newAgent]);
    setBuildStatus({
      isBuilding: true,
      agentId: newAgent.id,
      agentType: 'freeflow',
      progress: 0,
      message: agentsStrings.status.buildingMessage.replace('{{name}}', newAgent.name)
    });

    toast(agentsStrings.notifications.createStarted.replace('{{type}}', 'Free-Flow'));

    // Simulate build process
    simulateBuildProcess(newAgent.id, 'freeflow', newAgent.name);
  }, []);

  // Simulate build process
  const simulateBuildProcess = useCallback((agentId: string, type: 'workflow' | 'freeflow', agentName: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        
        // Update agent status
        if (type === 'workflow') {
          setWorkflowAgents(prev => {
            const updated = prev.map(agent => 
              agent.id === agentId ? { ...agent, status: 'ready' } : agent
            );
            return updated;
          });
        } else {
          setFreeflowAgents(prev => {
            const updated = prev.map(agent => 
              agent.id === agentId ? { ...agent, status: 'ready' } : agent
            );
            return updated;
          });
        }

        // Clear build status
        setBuildStatus({
          isBuilding: false,
          agentId: null,
          agentType: null,
          progress: 0,
          message: ''
        });

        toast.success(agentsStrings.notifications.createSuccess.replace('{{name}}', agentName));
      } else {
        setBuildStatus(prev => ({ ...prev, progress }));
      }
    }, 500);
  }, []);

  // Cancel build
  const cancelBuild = useCallback(() => {
    if (buildStatus.agentId && buildStatus.agentType) {
      // Update agent status to failed
      if (buildStatus.agentType === 'workflow') {
        setWorkflowAgents(prev => prev.map(agent => 
          agent.id === buildStatus.agentId ? { ...agent, status: 'failed' } : agent
        ));
      } else {
        setFreeflowAgents(prev => prev.map(agent => 
          agent.id === buildStatus.agentId ? { ...agent, status: 'failed' } : agent
        ));
      }
    }

    setBuildStatus({
      isBuilding: false,
      agentId: null,
      agentType: null,
      progress: 0,
      message: ''
    });

    toast(agentsStrings.notifications.buildCancelled);
  }, [buildStatus]);

  // Update agent
  const updateAgent = useCallback((agentId: string, type: 'workflow' | 'freeflow', updates: Partial<Agent>) => {
    if (type === 'workflow') {
      setWorkflowAgents(prev => prev.map(agent => 
        agent.id === agentId ? { ...agent, ...updates, updatedAt: new Date().toISOString() } : agent
      ));
    } else {
      setFreeflowAgents(prev => prev.map(agent => 
        agent.id === agentId ? { ...agent, ...updates, updatedAt: new Date().toISOString() } : agent
      ));
    }
    toast.success(agentsStrings.notifications.updateSuccess);
  }, []);

  // Delete agent
  const deleteAgent = useCallback((agentId: string, type: 'workflow' | 'freeflow') => {
    if (!confirm(agentsStrings.notifications.deleteConfirm)) return;

    if (type === 'workflow') {
      setWorkflowAgents(prev => prev.filter(agent => agent.id !== agentId));
    } else {
      setFreeflowAgents(prev => prev.filter(agent => agent.id !== agentId));
    }
    toast.success(agentsStrings.notifications.deleteSuccess);
  }, []);

  // Open wizard
  const openWizard = useCallback((type: 'workflow' | 'freeflow') => {
    setWizardType(type);
    setWizardOpen(true);
  }, []);

  // Close wizard
  const closeWizard = useCallback(() => {
    setWizardOpen(false);
    setWizardType(null);
  }, []);

  // Open test modal
  const openTestModal = useCallback((agentId: string) => {
    setTestAgentId(agentId);
    setTestModalOpen(true);
  }, []);

  // Close test modal
  const closeTestModal = useCallback(() => {
    setTestModalOpen(false);
    setTestAgentId(null);
  }, []);

  // Get agent by ID
  const getAgent = useCallback((agentId: string): Agent | null => {
    const workflowAgent = workflowAgents.find(a => a.id === agentId);
    if (workflowAgent) return workflowAgent;
    
    const freeflowAgent = freeflowAgents.find(a => a.id === agentId);
    if (freeflowAgent) return freeflowAgent;
    
    return null;
  }, [workflowAgents, freeflowAgents]);

  return {
    // State
    workflowAgents,
    freeflowAgents,
    activeTab,
    wizardOpen,
    wizardType,
    testModalOpen,
    testAgentId,
    buildStatus,
    taskTemplates,
    mcpServers,
    aiModels,
    knowledgeIndexes: knowledgeIndexes.filter(idx => idx.status === 'ready'),
    
    // Actions
    setActiveTab,
    createWorkflowAgent,
    createFreeFlowAgent,
    updateAgent,
    deleteAgent,
    cancelBuild,
    openWizard,
    closeWizard,
    openTestModal,
    closeTestModal,
    getAgent
  };
}