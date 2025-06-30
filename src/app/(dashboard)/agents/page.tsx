'use client';

import React, { useState } from 'react';
import { PageHeader } from '@/components/atoms/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/atoms/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusBar } from '@/components/organisms/StatusBar';
import { 
  Bot, 
  Plus, 
  Workflow, 
  Sparkles,
  Calendar,
  MoreVertical,
  Trash2,
  Edit,
  TestTube,
  MessageSquare
} from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { FreeFlowAgentWizard } from '@/components/organisms/modals/FreeFlowAgentWizard';
import { AgentTestModal } from '@/components/organisms/modals/AgentTestModal';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import agentsStrings from '@/data/strings/agents.json';
import taskTemplates from '@/data/taskTemplates.json';

export default function AgentsPage() {
  const router = useRouter();
  
  const {
    workflowAgents,
    freeflowAgents,
    activeTab,
    wizardOpen,
    wizardType,
    testModalOpen,
    testAgentId,
    buildStatus,
    setActiveTab,
    deleteAgent,
    cancelBuild,
    openWizard,
    closeWizard,
    openTestModal,
    closeTestModal,
    createFreeFlowAgent,
    getAgent
  } = useAgents();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: 'ready' | 'building' | 'failed') => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      ready: 'default',
      building: 'secondary',
      failed: 'destructive'
    };
    
    return (
      <Badge variant={variants[status]}>
        {agentsStrings.status[status]}
      </Badge>
    );
  };

  const getTemplateName = (templateId: string) => {
    return taskTemplates.find(t => t.id === templateId)?.name || templateId;
  };

  const renderWorkflowAgents = () => {
    if (workflowAgents.length === 0) {
      return (
        <Card className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={Workflow}
            title={agentsStrings.emptyState.workflow.title}
            description={agentsStrings.emptyState.workflow.description}
            action={
              <span className="text-sm text-muted-foreground">
                Click the chat button in the bottom right to get started
              </span>
            }
          />
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {workflowAgents.map(agent => (
          <Card key={agent.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Workflow className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {getTemplateName(agent.templateId)} • {agent.steps.length} steps
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(agent.status)}
                {agent.status === 'ready' && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openTestModal(agent.id)}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      {agentsStrings.actions.test}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.location.href = `/agents/workflow/${agent.id}/edit`}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {agentsStrings.actions.edit}
                    </Button>
                  </>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => deleteAgent(agent.id, 'workflow')}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {agentsStrings.actions.delete}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(agent.updatedAt)}</span>
              </div>
              {agent.mcpServerIds.length > 0 && (
                <div>{agent.mcpServerIds.length} channels</div>
              )}
              {agent.enabledTools.length > 0 && (
                <div>{agent.enabledTools.length} tools enabled</div>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderFreeFlowAgents = () => {
    if (freeflowAgents.length === 0) {
      return (
        <Card className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={Sparkles}
            title={agentsStrings.emptyState.freeflow.title}
            description={agentsStrings.emptyState.freeflow.description}
            action={
              <Button onClick={() => openWizard('freeflow')}>
                <Plus className="h-4 w-4 mr-2" />
                {agentsStrings.emptyState.freeflow.action}
              </Button>
            }
          />
        </Card>
      );
    }

    return (
      <div className="space-y-4">
        {freeflowAgents.map(agent => (
          <Card key={agent.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {agent.tone} • {agent.aiModelId}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusBadge(agent.status)}
                {agent.status === 'ready' && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openTestModal(agent.id)}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      {agentsStrings.actions.test}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {agentsStrings.actions.edit}
                    </Button>
                  </>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => deleteAgent(agent.id, 'freeflow')}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      {agentsStrings.actions.delete}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="mt-4 flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{formatDate(agent.updatedAt)}</span>
              </div>
              {agent.mcpServerIds.length > 0 && (
                <div>{agent.mcpServerIds.length} channels</div>
              )}
              {agent.allowedTools.length > 0 && (
                <div>{agent.allowedTools.length} tools enabled</div>
              )}
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const testAgent = testAgentId ? getAgent(testAgentId) : null;

  return (
    <div className="h-full bg-background p-8 relative">
      <div className="container mx-auto max-w-full h-full flex flex-col">
        <PageHeader
          title={agentsStrings.page.title}
          description={agentsStrings.page.description}
          className="mb-6"
        />
        
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'workflow' | 'freeflow')} className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="workflow" className="flex items-center gap-2">
                <Workflow className="h-4 w-4" />
                {agentsStrings.tabs.workflow}
              </TabsTrigger>
              <TabsTrigger value="freeflow" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {agentsStrings.tabs.freeflow}
              </TabsTrigger>
            </TabsList>
            
            
            {activeTab === 'workflow' && (
              <Button onClick={() => {
                // Trigger the OmniChat FAB with workflow context
                (window as any).openOmniChat?.('workflow');
              }}>
                <Plus className="h-4 w-4 mr-2" />
                {agentsStrings.actions.newWorkflowAgent}
              </Button>
            )}
            {activeTab === 'freeflow' && (
              <Button onClick={() => openWizard('freeflow')}>
                <Plus className="h-4 w-4 mr-2" />
                {agentsStrings.actions.newFreeflowAgent}
              </Button>
            )}
          </div>
          
          <TabsContent value="workflow" className="flex-1">
            {renderWorkflowAgents()}
          </TabsContent>
          
          <TabsContent value="freeflow" className="flex-1">
            {renderFreeFlowAgents()}
          </TabsContent>
        </Tabs>
      </div>

      {wizardType === 'freeflow' && (
        <FreeFlowAgentWizard
          isOpen={wizardOpen}
          onClose={closeWizard}
          onCreateAgent={createFreeFlowAgent}
        />
      )}

      {testAgent && (
        <AgentTestModal
          isOpen={testModalOpen}
          onClose={closeTestModal}
          agent={testAgent}
        />
      )}

      <StatusBar
        buildStatus={buildStatus}
        onCancel={cancelBuild}
        type="agent"
      />

    </div>
  );
}