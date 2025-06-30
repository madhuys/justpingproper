import React from 'react';
import { Node } from 'reactflow';
import { WorkflowNodeData } from '@/components/organisms/workflow/EnhancedWorkflowNodeV2';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WorkflowNodeBasicConfig } from '@/components/molecules/WorkflowNodeBasicConfig';
import { WorkflowNodeInputConfig } from '@/components/molecules/WorkflowNodeInputConfig';
import { WorkflowNodeAIConfig } from '@/components/molecules/WorkflowNodeAIConfig';
import { WorkflowNodeActionConfig } from '@/components/molecules/WorkflowNodeActionConfig';
import { WorkflowVariableCollection } from '@/components/molecules/WorkflowVariableCollection';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GitBranch, Plus, Minus } from 'lucide-react';
import agentsStrings from '@/data/strings/agents.json';

interface WorkflowNodeConfiguratorProps {
  selectedNode: Node<WorkflowNodeData> | null;
  nodeLabel: string;
  nodePrompt: string;
  nodeVariable: string;
  nodeVariables: string[];
  nodeVariableValidations: Record<number, string>;
  nodeInputType: 'text' | 'multiselect' | 'choice';
  nodeChoices: string[];
  nodeValidation: string;
  nodeActionType: string;
  nodeAiModel: string;
  nodeSystemPrompt: string;
  nodeTemperature: number;
  nodeMaxTokens: number;
  hasCustomLabel: boolean;
  nodeBranchCount: number;
  onLabelChange: (value: string) => void;
  onPromptChange: (value: string) => void;
  onVariableChange: (value: string) => void;
  onVariablesChange: (value: string[]) => void;
  onVariableValidationsChange: (value: Record<number, string>) => void;
  onInputTypeChange: (value: 'text' | 'multiselect' | 'choice') => void;
  onChoicesChange: (value: string[]) => void;
  onValidationChange: (value: string) => void;
  onActionTypeChange: (value: string) => void;
  onAiModelChange: (value: string) => void;
  onSystemPromptChange: (value: string) => void;
  onTemperatureChange: (value: number) => void;
  onMaxTokensChange: (value: number) => void;
  onCustomLabelChange: (value: boolean) => void;
  onBranchCountChange: (value: number) => void;
}

export function WorkflowNodeConfigurator({
  selectedNode,
  nodeLabel,
  nodePrompt,
  nodeVariable,
  nodeVariables,
  nodeVariableValidations,
  nodeInputType,
  nodeChoices,
  nodeValidation,
  nodeActionType,
  nodeAiModel,
  nodeSystemPrompt,
  nodeTemperature,
  nodeMaxTokens,
  hasCustomLabel,
  nodeBranchCount,
  onLabelChange,
  onPromptChange,
  onVariableChange,
  onVariablesChange,
  onVariableValidationsChange,
  onInputTypeChange,
  onChoicesChange,
  onValidationChange,
  onActionTypeChange,
  onAiModelChange,
  onSystemPromptChange,
  onTemperatureChange,
  onMaxTokensChange,
  onCustomLabelChange,
  onBranchCountChange
}: WorkflowNodeConfiguratorProps) {
  if (!selectedNode) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Select a node to configure
      </div>
    );
  }

  const { nodeConfig } = agentsStrings.workflow;

  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-4">
        <h3 className="text-lg font-semibold">{nodeConfig.title}</h3>

        {/* Basic Configuration */}
        <WorkflowNodeBasicConfig
          nodeLabel={nodeLabel}
          nodePrompt={nodePrompt}
          onLabelChange={onLabelChange}
          onPromptChange={onPromptChange}
          hasCustomLabel={hasCustomLabel}
          onCustomLabelChange={onCustomLabelChange}
          nodeType={selectedNode.data.type}
        />

        {/* Input Node Configuration */}
        {selectedNode.data.type === 'input' && (
          <>
            <WorkflowNodeInputConfig
              inputType={nodeInputType}
              variable={nodeVariable}
              choices={nodeChoices}
              validation={nodeValidation}
              onInputTypeChange={onInputTypeChange}
              onVariableChange={onVariableChange}
              onChoicesChange={onChoicesChange}
              onValidationChange={onValidationChange}
            />

            {/* Multiple Variables Collection */}
            {nodeInputType === 'text' && (
              <WorkflowVariableCollection
                variables={nodeVariables}
                variableValidations={nodeVariableValidations}
                onVariablesChange={onVariablesChange}
                onValidationsChange={onVariableValidationsChange}
              />
            )}
          </>
        )}

        {/* AI Node Configuration */}
        {(selectedNode.data.type === 'aiAnalyze' || selectedNode.data.type === 'message' || selectedNode.data.type === 'action' || selectedNode.data.type === 'input') && (
          <WorkflowNodeAIConfig
            aiModel={nodeAiModel}
            systemPrompt={nodeSystemPrompt}
            temperature={nodeTemperature}
            maxTokens={nodeMaxTokens}
            onModelChange={onAiModelChange}
            onSystemPromptChange={onSystemPromptChange}
            onTemperatureChange={onTemperatureChange}
            onMaxTokensChange={onMaxTokensChange}
          />
        )}

        {/* Action Node Configuration */}
        {selectedNode.data.type === 'action' && (
          <WorkflowNodeActionConfig
            actionType={nodeActionType}
            actionConfig={selectedNode.data.actionConfig || {}}
            onActionTypeChange={onActionTypeChange}
            onActionConfigChange={(config) => {
              // This will be handled by the parent component
              if (onActionTypeChange) {
                // Trigger a node update with the new config
                const event = new CustomEvent('updateActionConfig', { detail: config });
                window.dispatchEvent(event);
              }
            }}
          />
        )}

        {/* Branch Node Configuration */}
        {selectedNode.data.type === 'branch' && (
          <Card className="p-4 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <GitBranch className="h-4 w-4 text-primary" />
              <h3 className="font-medium">{nodeConfig.branchSettings}</h3>
            </div>
            
            <div className="space-y-2">
              <Label>Number of Branches</Label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onBranchCountChange(Math.max(2, nodeBranchCount - 1))}
                  disabled={nodeBranchCount <= 2}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  value={nodeBranchCount}
                  onChange={(e) => onBranchCountChange(parseInt(e.target.value) || 2)}
                  className="flex-1 text-center"
                  min={2}
                  max={5}
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onBranchCountChange(Math.min(5, nodeBranchCount + 1))}
                  disabled={nodeBranchCount >= 5}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Create {nodeBranchCount} different paths based on conditions
              </p>
            </div>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}