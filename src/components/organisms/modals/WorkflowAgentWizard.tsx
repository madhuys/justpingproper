import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  GripVertical,
  HeadphonesIcon,
  UserCheck,
  ShoppingCart,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { useAgents, WorkflowStep } from '@/hooks/useAgents';
import agentsStrings from '@/data/strings/agents.json';
import toast from 'react-hot-toast';
import { Node, Edge } from 'reactflow';
import { WorkflowNodeData } from '../workflow/WorkflowNode';

// Dynamic import to avoid SSR issues with React Flow
const WorkflowBuilder = dynamic(
  () => import('../workflow/WorkflowBuilder').then((mod) => mod.WorkflowBuilder),
  { ssr: false }
);

interface WorkflowAgentWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAgent: (data: {
    name: string;
    templateId: string;
    steps: WorkflowStep[];
    knowledgeIndexId?: string;
    mcpServerIds: string[];
    enabledTools: string[];
    apiKey?: string;
  }) => void;
}

const iconMap = {
  HeadphonesIcon,
  UserCheck,
  ShoppingCart,
  Calendar,
  MessageSquare
};

export function WorkflowAgentWizard({ isOpen, onClose, onCreateAgent }: WorkflowAgentWizardProps) {
  const { taskTemplates, knowledgeIndexes, mcpServers } = useAgents();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Form data
  const [name, setName] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [workflowNodes, setWorkflowNodes] = useState<Node<WorkflowNodeData>[]>([]);
  const [workflowEdges, setWorkflowEdges] = useState<Edge[]>([]);
  const [knowledgeIndexId, setKnowledgeIndexId] = useState('');
  const [selectedMcpServers, setSelectedMcpServers] = useState<string[]>([]);
  const [enabledTools, setEnabledTools] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState('');

  const wizardSteps = [
    agentsStrings.wizard.workflow.steps.template,
    agentsStrings.wizard.workflow.steps.script,
    agentsStrings.wizard.workflow.steps.integrations,
    agentsStrings.wizard.workflow.steps.review
  ];

  const handleNext = () => {
    // Validation
    if (currentStep === 0 && !templateId) {
      toast.error(agentsStrings.validation.templateRequired);
      return;
    }
    if (currentStep === 1 && workflowNodes.length <= 1) { // Only has start node
      toast.error(agentsStrings.validation.stepsRequired);
      return;
    }
    
    if (currentStep < wizardSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSelectTemplate = (id: string) => {
    setTemplateId(id);
    const template = taskTemplates.find(t => t.id === id);
    if (template && template.defaultSteps) {
      // Create initial workflow nodes from template
      const startNode: Node<WorkflowNodeData> = {
        id: '1',
        type: 'workflow',
        position: { x: 250, y: 50 },
        data: {
          label: 'Start',
          type: 'start',
          prompt: 'Conversation begins here',
        },
      };

      const stepNodes = template.defaultSteps.map((step, index) => ({
        id: `step-${Date.now()}-${index}`,
        type: 'workflow' as const,
        position: { x: 250, y: 150 + (index * 100) },
        data: {
          label: `Step ${index + 1}`,
          type: 'input' as const,
          prompt: step.prompt,
          inputType: step.inputType as 'text' | 'multiselect' | 'ai-validated',
          validationType: step.validation,
        },
      }));

      const endNode: Node<WorkflowNodeData> = {
        id: 'end',
        type: 'workflow',
        position: { x: 250, y: 150 + (template.defaultSteps.length * 100) },
        data: {
          label: 'End',
          type: 'end',
          prompt: 'Conversation ends here',
        },
      };

      setWorkflowNodes([startNode, ...stepNodes, endNode]);
      
      // Create edges to connect nodes
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
  };

  const toggleTool = (tool: string) => {
    setEnabledTools(prev =>
      prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]
    );
  };

  const toggleMcpServer = (serverId: string) => {
    setSelectedMcpServers(prev =>
      prev.includes(serverId) ? prev.filter(s => s !== serverId) : [...prev, serverId]
    );
  };

  const handleCreate = () => {
    if (!name.trim()) {
      toast.error(agentsStrings.validation.nameRequired);
      return;
    }

    // Convert workflow nodes to steps
    const steps: WorkflowStep[] = workflowNodes
      .filter(node => node.data.type !== 'start' && node.data.type !== 'end')
      .map(node => ({
        id: node.id,
        prompt: node.data.prompt || '',
        inputType: node.data.inputType || 'text',
        validation: node.data.validationType,
        fallback: node.data.systemPrompt
      }));

    onCreateAgent({
      name,
      templateId,
      steps,
      knowledgeIndexId,
      mcpServerIds: selectedMcpServers,
      enabledTools,
      apiKey
    });

    // Reset form
    setCurrentStep(0);
    setName('');
    setTemplateId('');
    setWorkflowNodes([]);
    setWorkflowEdges([]);
    setKnowledgeIndexId('');
    setSelectedMcpServers([]);
    setEnabledTools([]);
    setApiKey('');
    onClose();
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Template Selection
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {agentsStrings.wizard.workflow.template.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {agentsStrings.wizard.workflow.template.description}
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Agent Name</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={agentsStrings.wizard.freeflow.persona.namePlaceholder}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {taskTemplates.map(template => {
                const Icon = iconMap[template.icon as keyof typeof iconMap] || MessageSquare;
                return (
                  <Card
                    key={template.id}
                    className={`p-4 cursor-pointer transition-colors ${
                      templateId === template.id ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleSelectTemplate(template.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <Icon className="h-5 w-5 text-muted-foreground mt-1" />
                      <div className="flex-1">
                        <h4 className="font-medium">{template.name}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        );

      case 1: // Script Builder
        return (
          <div className="h-[600px] -m-6 relative">
            <WorkflowBuilder
              onSave={(nodes, edges) => {
                setWorkflowNodes(nodes);
                setWorkflowEdges(edges);
              }}
              initialFlow={
                workflowNodes.length > 0
                  ? { nodes: workflowNodes, edges: workflowEdges }
                  : undefined
              }
            />
          </div>
        );

      case 2: // Integrations
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {agentsStrings.wizard.workflow.integrations.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {agentsStrings.wizard.workflow.integrations.description}
              </p>
            </div>

            <div>
              <Label>{agentsStrings.wizard.workflow.integrations.knowledgeIndex}</Label>
              <Select value={knowledgeIndexId} onValueChange={setKnowledgeIndexId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={agentsStrings.wizard.workflow.integrations.knowledgeIndexPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {knowledgeIndexes.map(index => (
                    <SelectItem key={index.id} value={index.id}>
                      {index.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="mb-2 block">{agentsStrings.wizard.workflow.integrations.mcpServers}</Label>
              <div className="space-y-2">
                {mcpServers.map(server => (
                  <label
                    key={server.id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedMcpServers.includes(server.id)}
                      onCheckedChange={() => toggleMcpServer(server.id)}
                    />
                    <span className="text-sm">{server.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="mb-2 block">{agentsStrings.wizard.workflow.integrations.tools}</Label>
              <div className="space-y-2">
                {Object.entries(agentsStrings.wizard.workflow.integrations.toolOptions).map(([key, value]) => (
                  <label
                    key={key}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <Checkbox
                      checked={enabledTools.includes(key)}
                      onCheckedChange={() => toggleTool(key)}
                    />
                    <span className="text-sm">{value}</span>
                  </label>
                ))}
              </div>
            </div>

            {enabledTools.includes('onlineSearch') && (
              <div>
                <Label>{agentsStrings.wizard.workflow.integrations.apiKey}</Label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={agentsStrings.wizard.workflow.integrations.apiKeyPlaceholder}
                  className="mt-2"
                />
              </div>
            )}
          </div>
        );

      case 3: // Review
        const selectedTemplate = taskTemplates.find(t => t.id === templateId);
        return (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {agentsStrings.wizard.workflow.review.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {agentsStrings.wizard.workflow.review.description}
              </p>
            </div>

            <Card className="p-4 space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Name</span>
                <p className="font-medium">{name || 'Untitled Agent'}</p>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">
                  {agentsStrings.wizard.workflow.review.template}
                </span>
                <p className="font-medium">{selectedTemplate?.name}</p>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">
                  {agentsStrings.wizard.workflow.review.steps}
                </span>
                <p className="font-medium">{workflowNodes.filter(n => n.data.type !== 'start' && n.data.type !== 'end').length} steps configured</p>
              </div>

              {knowledgeIndexId && (
                <div>
                  <span className="text-sm text-muted-foreground">
                    {agentsStrings.wizard.workflow.review.knowledge}
                  </span>
                  <p className="font-medium">
                    {knowledgeIndexes.find(k => k.id === knowledgeIndexId)?.name}
                  </p>
                </div>
              )}

              {selectedMcpServers.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">
                    {agentsStrings.wizard.workflow.review.channels}
                  </span>
                  <p className="font-medium">{selectedMcpServers.length} channels selected</p>
                </div>
              )}

              {enabledTools.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">
                    {agentsStrings.wizard.workflow.review.tools}
                  </span>
                  <p className="font-medium">{enabledTools.length} tools enabled</p>
                </div>
              )}
            </Card>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={currentStep === 1 ? "max-w-[90vw] w-[90vw] h-[90vh]" : "max-w-2xl"}>
        <DialogHeader>
          <DialogTitle>{agentsStrings.wizard.workflow.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              {wizardSteps.map((step, index) => (
                <span
                  key={index}
                  className={index <= currentStep ? 'text-primary' : 'text-muted-foreground'}
                >
                  {step}
                </span>
              ))}
            </div>
            <Progress value={(currentStep + 1) / wizardSteps.length * 100} />
          </div>

          {/* Content */}
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={currentStep === 0 ? onClose : handleBack}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              {currentStep === 0 ? agentsStrings.actions.cancel : agentsStrings.actions.back}
            </Button>

            {currentStep < wizardSteps.length - 1 ? (
              <Button onClick={handleNext}>
                {agentsStrings.actions.next}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleCreate}>
                {agentsStrings.actions.create}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}